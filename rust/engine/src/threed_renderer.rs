use anyhow::{Context as AnyhowContext, Result};
use glam::Vec3 as GlamVec3;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;
use three_d::*;
use winit::dpi::PhysicalSize;
use winit::window::Window as WinitWindow;

use vibe_ecs_bridge::decoders::{
    CameraComponent, GeometryAsset, Instanced, Light as LightComponent, MeshRenderer, Terrain,
    Transform,
};
use vibe_ecs_bridge::ComponentRegistry;
use vibe_scene::Scene as SceneData;
use vibe_scene::{Entity, EntityId};
use vibe_scene_graph::SceneGraph;

// Import renderer modules
use crate::renderer::camera_renderer::{AdditionalCamera, CameraEntry, CameraVariant};
use crate::renderer::coordinate_conversion::threejs_to_threed_position;
use crate::renderer::{
    apply_post_processing, create_camera, generate_terrain, load_camera, load_instanced,
    load_light, load_mesh_renderer, CameraConfig, ColorGradingEffect, DebugLineRenderer,
    EnhancedDirectionalLight, EnhancedSpotLight, LODManager, LODSelector, LoadedLight,
    MaterialManager, PostProcessSettings, SkyboxRenderer,
};

/// Mesh rendering state extracted from scene (visibility, shadows, etc.)
/// This allows passing rendering state without holding a borrow on the full scene.
#[derive(Debug, Clone, Default)]
pub struct MeshRenderState {
    /// Map of entity ID to visibility state (MeshRenderer.enabled)
    pub visibility: HashMap<EntityId, bool>,
}

impl MeshRenderState {
    /// Extract mesh rendering state from scene
    pub fn from_scene(scene: &SceneData) -> Self {
        let mut visibility = HashMap::new();

        for entity in &scene.entities {
            if let Some(entity_id) = entity.entity_id() {
                // Check MeshRenderer.enabled field
                if let Some(mesh_renderer_value) = entity.components.get("MeshRenderer") {
                    if let Ok(mesh_renderer) =
                        serde_json::from_value::<serde_json::Value>(mesh_renderer_value.clone())
                    {
                        if let Some(enabled) =
                            mesh_renderer.get("enabled").and_then(|v| v.as_bool())
                        {
                            visibility.insert(entity_id, enabled);
                        }
                    }
                }
            }
        }

        Self { visibility }
    }
}

/// ThreeDRenderer - Rendering backend using three-d library for PBR rendering
///
/// This renderer is focused on core rendering responsibilities:
/// - Managing the rendering context and window
/// - Coordinating the render loop
/// - Managing scene objects (meshes, lights, camera)
/// - Synchronizing with physics
pub struct ThreeDRenderer {
    windowed_context: WindowedContext,
    context: Context,
    camera: Camera,
    camera_config: Option<CameraConfig>,
    scene_graph: Option<SceneGraph>,
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    mesh_entity_ids: Vec<EntityId>, // Parallel array: entity ID for each mesh
    mesh_scales: Vec<GlamVec3>,     // Parallel array: final local scale per mesh
    mesh_base_scales: Vec<GlamVec3>, // Parallel array: primitive/base scale per mesh
    mesh_cast_shadows: Vec<bool>,   // Parallel array: cast_shadows flag for each mesh
    mesh_receive_shadows: Vec<bool>, // Parallel array: receive_shadows flag for each mesh
    directional_lights: Vec<EnhancedDirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<EnhancedSpotLight>,
    ambient_light: Option<AmbientLight>,
    window_size: (u32, u32),

    // Resource management
    mesh_cache: HashMap<String, CpuMesh>,
    material_manager: MaterialManager,
    component_registry: ComponentRegistry,
    skybox_renderer: SkyboxRenderer,
    debug_line_renderer: DebugLineRenderer,
    hdr_color_texture: Option<Texture2D>,
    hdr_depth_texture: Option<three_d::DepthTexture2D>,
    additional_cameras: Vec<AdditionalCamera>,
    loaded_entity_ids: HashSet<EntityId>, // Track all loaded entities to prevent duplicates

    // Camera follow smoothing
    last_camera_position: Vec3,
    last_camera_target: Vec3,

    // LOD Management
    lod_manager: Arc<LODManager>,
    lod_selector: LODSelector,

    // BVH System for visibility culling and raycasting
    bvh_manager: Option<std::sync::Arc<std::sync::Mutex<crate::spatial::bvh_manager::BvhManager>>>,
    visibility_culler: Option<crate::renderer::visibility::VisibilityCuller>,
    bvh_debug_logger: Option<crate::renderer::bvh_debug::BvhDebugLogger>,
}

impl ThreeDRenderer {
    /// Initialize the three-d renderer from a winit window
    pub fn new(window: Arc<WinitWindow>) -> Result<Self> {
        log::info!("Initializing three-d renderer...");

        // Create three-d WindowedContext from winit window with MSAA antialiasing
        let size = window.inner_size();
        let windowed_context = WindowedContext::from_winit_window(
            window.as_ref(),
            SurfaceSettings {
                // Enable 4x MSAA for smooth edges on geometry
                multisamples: 4,
                ..Default::default()
            },
        )
        .with_context(|| "Failed to create three-d context from window")?;

        log::info!("  MSAA: 4x (antialiasing enabled)");

        // WindowedContext implements Deref<Target = Context>, so we can clone the context
        let context: Context = windowed_context.clone();

        // Create perspective camera
        let viewport = Viewport::new_at_origo(size.width, size.height);
        let camera = Camera::new_perspective(
            viewport,
            vec3(0.0, 2.0, 5.0), // position
            vec3(0.0, 0.0, 0.0), // target
            vec3(0.0, 1.0, 0.0), // up
            degrees(60.0),       // fov
            0.1,                 // near
            1000.0,              // far
        );

        log::info!("  Viewport: {}x{}", size.width, size.height);
        log::info!("  Camera FOV: 60°, Near: 0.1, Far: 1000.0");

        // Create component registry for decoding ECS components
        let component_registry = vibe_ecs_bridge::decoders::create_default_registry();

        let initial_pos = vec3(0.0, 2.0, 5.0);
        let initial_target = vec3(0.0, 0.0, 0.0);

        let debug_line_renderer = DebugLineRenderer::new(&context);

        // Initialize LOD system with default configuration
        let lod_manager = LODManager::new();
        let lod_selector = LODSelector::new(Arc::clone(&lod_manager));

        log::info!("  LOD System initialized (quality: Original, auto-switch: ENABLED)");

        Ok(Self {
            windowed_context,
            context,
            camera,
            camera_config: None,
            scene_graph: None,
            meshes: Vec::new(),
            mesh_entity_ids: Vec::new(),
            mesh_scales: Vec::new(),
            mesh_base_scales: Vec::new(),
            mesh_cast_shadows: Vec::new(),
            mesh_receive_shadows: Vec::new(),
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_light: None,
            window_size: (size.width, size.height),
            mesh_cache: HashMap::new(),
            material_manager: MaterialManager::new(),
            component_registry,
            skybox_renderer: SkyboxRenderer::new(),
            debug_line_renderer,
            hdr_color_texture: None,
            hdr_depth_texture: None,
            additional_cameras: Vec::new(),
            loaded_entity_ids: HashSet::new(),
            last_camera_position: initial_pos,
            last_camera_target: initial_target,
            lod_manager,
            lod_selector,

            // Initialize BVH System
            bvh_manager: None, // Will be initialized on first scene load
            visibility_culler: None,
            bvh_debug_logger: Some(crate::renderer::bvh_debug::BvhDebugLogger::new(5.0)), // Log every 5 seconds
        })
    }

    /// Create a simple test scene with primitives
    pub fn create_test_scene(&mut self) -> Result<()> {
        log::info!("Creating test scene with primitives...");

        // Create a simple cube mesh
        let cpu_mesh = CpuMesh::cube();
        let mesh = Mesh::new(&self.context, &cpu_mesh);

        // Create PBR material
        let material = PhysicalMaterial::new(
            &self.context,
            &CpuMaterial {
                albedo: Srgba::new(200, 100, 100, 255),
                metallic: 0.3,
                roughness: 0.7,
                ..Default::default()
            },
        );

        // Combine mesh and material
        let cube = Gm::new(mesh, material);
        self.meshes.push(cube);
        self.mesh_entity_ids.push(EntityId::new(0)); // Test cube with ID 0
        self.mesh_scales.push(GlamVec3::ONE);
        self.mesh_base_scales.push(GlamVec3::ONE);
        self.mesh_cast_shadows.push(true); // Test cube casts shadows
        self.mesh_receive_shadows.push(true); // Test cube receives shadows

        // Add directional light (enhanced with shadow support)
        let light = EnhancedDirectionalLight::new(
            &self.context,
            1.5,                     // intensity
            Srgba::WHITE,            // color
            &vec3(-1.0, -1.0, -1.0), // direction
            -0.0001,                 // shadow bias
            1.0,                     // shadow radius (PCF)
            2048,                    // shadow map size
            true,                    // cast shadows
        );
        self.directional_lights.push(light);

        // Add ambient light
        self.ambient_light = Some(AmbientLight::new(
            &self.context,
            0.3,          // intensity
            Srgba::WHITE, // color
        ));

        log::info!("  Added cube with PBR material");
        log::info!("  Added directional light");
        log::info!("  Added ambient light");

        Ok(())
    }

    /// Update camera based on follow system and other camera features

    /// Initialize BVH system if not already initialized
    /// Render a frame
    pub fn render(
        &mut self,
        delta_time: f32,
        debug_mode: bool,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        crate::renderer::scene_utilities::log_first_frame(
            self.meshes.len(),
            self.directional_lights.len(),
            self.point_lights.len(),
            self.spot_lights.len(),
            self.ambient_light.is_some(),
            self.camera.position(),
            self.camera.target(),
        );

        // Update camera (follow system, etc.) - main camera
        if let Some(ref config) = self.camera_config.clone() {
            crate::renderer::update_camera_follow(
                &mut self.camera,
                &config,
                self.scene_graph.as_mut(),
                &mut self.last_camera_position,
                &mut self.last_camera_target,
                delta_time,
            );
        }
        // Update additional cameras follow
        for idx in 0..self.additional_cameras.len() {
            let (config, camera, last_position, last_target, scene_graph) = {
                let cam = &mut self.additional_cameras[idx];
                (
                    &cam.config,
                    &mut cam.camera,
                    &mut cam.last_position,
                    &mut cam.last_target,
                    self.scene_graph.as_mut(),
                )
            };
            crate::renderer::update_camera_follow(
                camera,
                config,
                scene_graph,
                last_position,
                last_target,
                delta_time,
            );
        }

        // Update BVH system for culling (ensure BVH exists first)
        if self.bvh_manager.is_none() {
            let (bvh_manager, visibility_culler) =
                crate::renderer::bvh_integration::initialize_bvh_system();
            self.bvh_manager = Some(bvh_manager);
            self.visibility_culler = Some(visibility_culler);
        }
        crate::renderer::bvh_integration::update_bvh_transforms(&self.bvh_manager);

        // Update BVH debug logging
        if let (Some(bvh_manager), Some(ref mut debug_logger)) = (&self.bvh_manager, &mut self.bvh_debug_logger) {
            let manager = bvh_manager.lock().unwrap();
            debug_logger.update(delta_time, &manager);
        }

        // Generate shadow maps for lights that cast shadows
        crate::renderer::lighting::generate_shadow_maps(
            &self.meshes,
            &self.mesh_cast_shadows,
            &mut self.directional_lights,
            &mut self.spot_lights,
        );

        let mut camera_entries = Vec::new();
        if let Some(ref config) = self.camera_config {
            camera_entries.push(CameraEntry {
                depth: config.depth,
                variant: CameraVariant::Main,
            });
        }
        for (idx, cam) in self.additional_cameras.iter().enumerate() {
            camera_entries.push(CameraEntry {
                depth: cam.config.depth,
                variant: CameraVariant::Additional(idx),
            });
        }
        camera_entries.sort_by(|a, b| a.depth.cmp(&b.depth));

        let screen = RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);

        for entry in camera_entries {
            match entry.variant {
                CameraVariant::Main => {
                    let Some(ref config) = self.camera_config.clone() else {
                        continue;
                    };
                    let scissor: ScissorBox = self.camera.viewport().into();
                    let settings = crate::renderer::render_settings::prepare_render_settings_for(
                        config,
                        self.skybox_renderer.is_loaded(),
                    );

                    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
                    if let Some(ref post_settings) = settings.post_settings {
                        if post_settings.apply_tone_mapping {
                            tone_restore =
                                Some((self.camera.tone_mapping, self.camera.color_mapping));
                            self.camera.disable_tone_and_color_mapping();
                        }
                    }

                    if let Some(post_settings) = settings.post_settings.clone() {
                        // Ensure HDR textures exist
                        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_color_texture(
                            &self.context,
                            self.hdr_color_texture.as_ref(),
                            self.window_size,
                        ) {
                            self.hdr_color_texture = Some(new_texture);
                        }
                        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_depth_texture(
                            &self.context,
                            self.hdr_depth_texture.as_ref(),
                            self.window_size,
                        ) {
                            self.hdr_depth_texture = Some(new_texture);
                        }

                        // Manually collect light references to avoid borrowing all of self
                        let mut lights: Vec<&dyn Light> = Vec::new();
                        for light in &self.directional_lights {
                            lights.push(light);
                        }
                        for light in &self.point_lights {
                            lights.push(light);
                        }
                        for light in &self.spot_lights {
                            lights.push(light);
                        }
                        if let Some(ref ambient) = self.ambient_light {
                            lights.push(ambient);
                        }

                        // Extract visible mesh indices BEFORE creating render_target (avoids borrow conflicts)
                        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
                            self.meshes.len(),
                            &self.mesh_entity_ids,
                            render_state.map(|s| &s.visibility),
                        );

                        {
                            let render_target = {
                                let color_target = self
                                    .hdr_color_texture
                                    .as_mut()
                                    .expect("HDR color texture not initialized")
                                    .as_color_target(None);
                                let depth_target = self
                                    .hdr_depth_texture
                                    .as_mut()
                                    .expect("HDR depth texture not initialized")
                                    .as_depth_target();
                                RenderTarget::new(color_target, depth_target)
                            };

                            if let Some(clear_state) = settings.clear_state {
                                render_target.clear_partially(scissor, clear_state);
                            }

                            if settings.render_skybox {
                                self.skybox_renderer.render(&render_target, &self.camera);
                            }

                            // Convert indices to mesh references
                            let visible_meshes: Vec<_> = visible_indices
                                .iter()
                                .filter_map(|&idx| self.meshes.get(idx))
                                .collect();
                            render_target.render(&self.camera, &visible_meshes, &lights);
                        }

                        let color_texture =
                            three_d::ColorTexture::Single(self.hdr_color_texture.as_ref().unwrap());
                        let effect = ColorGradingEffect::from(post_settings);
                        apply_post_processing(
                            &screen,
                            effect,
                            &self.camera,
                            color_texture,
                            scissor,
                        );
                    } else {
                        if let Some(clear_state) = settings.clear_state {
                            screen.clear_partially(scissor, clear_state);
                        }

                        if settings.render_skybox {
                            self.skybox_renderer.render(&screen, &self.camera);
                        }

                        let lights = crate::renderer::lighting::collect_lights(
                            &self.directional_lights,
                            &self.point_lights,
                            &self.spot_lights,
                            &self.ambient_light,
                        );
                        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
                            self.meshes.len(),
                            &self.mesh_entity_ids,
                            render_state.map(|s| &s.visibility),
                        );
                        let visible_meshes: Vec<_> = visible_indices
                            .iter()
                            .filter_map(|&idx| self.meshes.get(idx))
                            .collect();
                        screen.render(&self.camera, &visible_meshes, &lights);
                    }

                    if let Some((tone, color)) = tone_restore {
                        self.camera.tone_mapping = tone;
                        self.camera.color_mapping = color;
                    }
                }
                CameraVariant::Additional(index) => {
                    if index >= self.additional_cameras.len() {
                        continue;
                    }

                    let config_clone = {
                        let cam = &self.additional_cameras[index];
                        cam.config.clone()
                    };
                    let skybox_loaded = {
                        let cam = &self.additional_cameras[index];
                        cam.skybox_renderer.is_loaded()
                    };
                    let settings = crate::renderer::render_settings::prepare_render_settings_for(
                        &config_clone,
                        skybox_loaded,
                    );

                    let scissor: ScissorBox = {
                        let cam = &self.additional_cameras[index];
                        cam.camera.viewport().into()
                    };

                    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
                    if let Some(ref post_settings) = settings.post_settings {
                        if post_settings.apply_tone_mapping {
                            let cam = &mut self.additional_cameras[index];
                            tone_restore =
                                Some((cam.camera.tone_mapping, cam.camera.color_mapping));
                            cam.camera.disable_tone_and_color_mapping();
                        }
                    }

                    if let Some(post_settings) = settings.post_settings.clone() {
                        // Ensure HDR textures exist
                        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_color_texture(
                            &self.context,
                            self.hdr_color_texture.as_ref(),
                            self.window_size,
                        ) {
                            self.hdr_color_texture = Some(new_texture);
                        }
                        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_depth_texture(
                            &self.context,
                            self.hdr_depth_texture.as_ref(),
                            self.window_size,
                        ) {
                            self.hdr_depth_texture = Some(new_texture);
                        }

                        // Manually collect light references to avoid borrowing all of self
                        let mut lights: Vec<&dyn Light> = Vec::new();
                        for light in &self.directional_lights {
                            lights.push(light);
                        }
                        for light in &self.point_lights {
                            lights.push(light);
                        }
                        for light in &self.spot_lights {
                            lights.push(light);
                        }
                        if let Some(ref ambient) = self.ambient_light {
                            lights.push(ambient);
                        }

                        // Extract visible mesh indices BEFORE creating render_target (avoids borrow conflicts)
                        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
                            self.meshes.len(),
                            &self.mesh_entity_ids,
                            render_state.map(|s| &s.visibility),
                        );

                        {
                            let render_target = {
                                let color_target = self
                                    .hdr_color_texture
                                    .as_mut()
                                    .expect("HDR color texture not initialized")
                                    .as_color_target(None);
                                let depth_target = self
                                    .hdr_depth_texture
                                    .as_mut()
                                    .expect("HDR depth texture not initialized")
                                    .as_depth_target();
                                RenderTarget::new(color_target, depth_target)
                            };

                            if let Some(clear_state) = settings.clear_state {
                                render_target.clear_partially(scissor, clear_state);
                            }

                            if settings.render_skybox {
                                let skybox_renderer =
                                    &self.additional_cameras[index].skybox_renderer;
                                let camera_ref = &self.additional_cameras[index].camera;
                                skybox_renderer.render(&render_target, camera_ref);
                            }

                            // Convert indices to mesh references
                            let visible_meshes: Vec<_> = visible_indices
                                .iter()
                                .filter_map(|&idx| self.meshes.get(idx))
                                .collect();
                            let camera_ref = &self.additional_cameras[index].camera;
                            render_target.render(camera_ref, &visible_meshes, &lights);
                        }

                        let color_texture =
                            three_d::ColorTexture::Single(self.hdr_color_texture.as_ref().unwrap());
                        let effect = ColorGradingEffect::from(post_settings);
                        let camera_ref = &self.additional_cameras[index].camera;
                        apply_post_processing(&screen, effect, camera_ref, color_texture, scissor);
                    } else {
                        if let Some(clear_state) = settings.clear_state {
                            screen.clear_partially(scissor, clear_state);
                        }

                        if settings.render_skybox {
                            let skybox_renderer = &self.additional_cameras[index].skybox_renderer;
                            let camera_ref = &self.additional_cameras[index].camera;
                            skybox_renderer.render(&screen, camera_ref);
                        }

                        let lights = crate::renderer::lighting::collect_lights(
                            &self.directional_lights,
                            &self.point_lights,
                            &self.spot_lights,
                            &self.ambient_light,
                        );
                        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
                            self.meshes.len(),
                            &self.mesh_entity_ids,
                            render_state.map(|s| &s.visibility),
                        );
                        let visible_meshes: Vec<_> = visible_indices
                            .iter()
                            .filter_map(|&idx| self.meshes.get(idx))
                            .collect();
                        let camera_ref = &self.additional_cameras[index].camera;
                        screen.render(camera_ref, &visible_meshes, &lights);
                    }

                    if let Some((tone, color)) = tone_restore {
                        let cam = &mut self.additional_cameras[index];
                        cam.camera.tone_mapping = tone;
                        cam.camera.color_mapping = color;
                    }
                }
            }
        }

        // Render debug overlay if debug mode is enabled
        if debug_mode {
            let screen =
                RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);
            self.render_debug_overlay(&screen, physics_world)?;
        }

        self.windowed_context
            .swap_buffers()
            .with_context(|| "Failed to swap buffers")?;

        Ok(())
    }

    /// Capture a screenshot by rendering to a texture and saving it
    pub fn render_to_screenshot(
        &mut self,
        path: &std::path::Path,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        render_state: Option<&MeshRenderState>,
        scale: f32,
        quality: u8,
    ) -> Result<()> {
        // Generate shadow maps first (required for proper rendering)
        crate::renderer::lighting::generate_shadow_maps(
            &self.meshes,
            &self.mesh_cast_shadows,
            &mut self.directional_lights,
            &mut self.spot_lights,
        );

        // Preserve current camera viewports so we can restore them after the capture
        let original_main_viewport = self.camera.viewport();
        let original_additional_viewports: Vec<_> = self
            .additional_cameras
            .iter()
            .map(|cam| cam.camera.viewport())
            .collect();

        // Calculate screenshot viewports
        let width = ((self.window_size.0 as f32) * scale).max(1.0) as u32;
        let height = ((self.window_size.1 as f32) * scale).max(1.0) as u32;
        let additional_configs: Vec<_> = self
            .additional_cameras
            .iter()
            .map(|cam| cam.config.clone())
            .collect();
        let (screenshot_main_viewport, screenshot_additional_viewports) =
            crate::util::calculate_screenshot_viewports((width, height), &additional_configs);

        // Adjust viewports to match the offscreen render target
        self.camera.set_viewport(screenshot_main_viewport);
        for (cam, viewport) in self
            .additional_cameras
            .iter_mut()
            .zip(screenshot_additional_viewports.iter())
        {
            cam.camera.set_viewport(*viewport);
        }

        // Collect data for screenshot rendering
        let lights = crate::renderer::lighting::collect_lights(
            &self.directional_lights,
            &self.point_lights,
            &self.spot_lights,
            &self.ambient_light,
        );
        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
                            self.meshes.len(),
                            &self.mesh_entity_ids,
                            render_state.map(|s| &s.visibility),
                        );
        let visible_meshes: Vec<_> = visible_indices
            .iter()
            .filter_map(|&idx| self.meshes.get(idx))
            .collect();

        // Delegate to screenshot module
        let result = crate::util::render_to_screenshot(
            &self.context,
            &self.camera,
            &[],  // TODO: Support additional cameras in screenshot
            self.camera_config.as_ref(),
            &self.skybox_renderer,
            &visible_meshes,
            &lights,
            render_state,
            self.window_size,
            path,
            scale,
            quality,
            physics_world,
            Some(&self.debug_line_renderer),
        );

        // Restore original viewports
        self.camera.set_viewport(original_main_viewport);
        for (cam, viewport) in self
            .additional_cameras
            .iter_mut()
            .zip(original_additional_viewports.into_iter())
        {
            cam.camera.set_viewport(viewport);
        }

        result
    }


    /// Update camera position and target
    pub fn update_camera(&mut self, position: glam::Vec3, target: glam::Vec3) {
        let pos = vec3(position.x, position.y, position.z);
        let tgt = vec3(target.x, target.y, target.z);
        self.camera.set_view(pos, tgt, vec3(0.0, 1.0, 0.0));
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        log::info!("Resizing renderer to {}x{}", width, height);

        // CRITICAL: Resize the three-d context to match the new window size
        // Without this, the framebuffer size won't match the window and rendering will be clipped
        self.windowed_context
            .resize(PhysicalSize::new(width, height));

        self.window_size = (width, height);
        self.hdr_color_texture = None;
        self.hdr_depth_texture = None;

        if let Some(ref config) = self.camera_config {
            let viewport = crate::renderer::render_settings::viewport_from_config(config, self.window_size);
            self.camera.set_viewport(viewport);
        } else {
            self.camera
                .set_viewport(Viewport::new_at_origo(width, height));
        }

        for cam in &mut self.additional_cameras {
            let viewport = crate::renderer::render_settings::viewport_from_config(&cam.config, self.window_size);
            cam.camera.set_viewport(viewport);
        }
    }


    /// Load a full scene from SceneData
    /// Now async to support texture loading!
    pub async fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        crate::renderer::scene_utilities::log_scene_load_start(scene);
        self.clear_scene();

        // Build scene graph for transform hierarchy and camera follow
        self.scene_graph = Some(crate::renderer::scene_loader::build_scene_graph(scene)?);

        // Load materials
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if !scene.materials.is_empty() {
            let materials_value = serde_json::Value::Array(scene.materials.clone());
            self.material_manager.load_from_scene(&materials_value);
        } else {
            log::warn!("No materials found in scene");
        }

        // Process prefab definitions and instances
        let (updated_scene_graph, prefab_instances) =
            crate::renderer::scene_loader::process_prefabs(scene, &self.component_registry)?;

        // Update scene graph if prefab instances were created
        if let Some(scene_graph) = updated_scene_graph {
            self.scene_graph = Some(scene_graph);
        }

        // Process entities
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("ENTITIES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Process original scene entities
        for entity in &scene.entities {
            self.load_entity(entity).await?;
        }

        // Process instantiated prefab entities
        for entity in &prefab_instances {
            self.load_entity(entity).await?;
        }

        crate::renderer::scene_utilities::log_scene_load_summary(
            self.meshes.len(),
            self.directional_lights.len(),
            self.point_lights.len(),
            self.spot_lights.len(),
            self.ambient_light.is_some(),
        );

        Ok(())
    }

    /// Sync newly created entities to renderer
    /// This is called after SceneManager applies entity commands to add runtime-created entities to the renderer
    pub async fn sync_new_entities(&mut self, scene: &SceneData) -> Result<()> {
        let new_entities = crate::renderer::scene_loader::filter_new_entities(
            &scene.entities,
            &self.loaded_entity_ids,
        );

        for entity in new_entities {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
            log::info!(
                "Syncing new entity {} ({})",
                entity_id,
                entity.name.as_deref().unwrap_or("unnamed")
            );

            // Load the new entity (handles all component types)
            // Note: load_entity() automatically adds entity_id to loaded_entity_ids
            self.load_entity(entity).await?;
        }

        log::debug!(
            "sync_new_entities: complete, loaded {} total entities",
            self.loaded_entity_ids.len()
        );
        Ok(())
    }

    /// Sync physics transforms back to renderer meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        crate::renderer::physics_sync::sync_physics_transforms(
            &mut self.meshes,
            &self.mesh_entity_ids,
            &self.mesh_scales,
            physics_world,
        );
    }

    /// Sync script transforms back to renderer meshes
    pub fn sync_script_transforms(&mut self, script_system: &vibe_scripting::ScriptSystem) {
        crate::renderer::physics_sync::sync_script_transforms(
            &mut self.meshes,
            &self.mesh_entity_ids,
            &mut self.mesh_scales,
            &self.mesh_base_scales,
            script_system,
        );
    }

    /// Update entity material from script mutation (e.g., material:setColor())
    ///
    /// Updates the material properties for all meshes belonging to the given entity
    pub fn update_entity_material(
        &mut self,
        entity_id: vibe_scene::EntityId,
        data: &serde_json::Value,
    ) {
        crate::renderer::material_update::update_entity_material(
            &mut self.meshes,
            &self.mesh_entity_ids,
            entity_id,
            data,
        );
    }

    /// Render debug visualizations (grid, colliders, etc.) when debug mode is enabled
    pub fn render_debug_overlay(
        &mut self,
        target: &RenderTarget,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
    ) -> Result<()> {
        crate::renderer::debug_rendering::render_debug_overlay(
            &self.debug_line_renderer,
            &self.camera,
            target,
            physics_world,
        )
    }

    // ===== Private Helper Methods =====

    fn clear_scene(&mut self) {
        crate::renderer::scene_utilities::clear_scene(
            crate::renderer::scene_utilities::SceneState {
                meshes: &mut self.meshes,
                mesh_entity_ids: &mut self.mesh_entity_ids,
                mesh_scales: &mut self.mesh_scales,
                mesh_base_scales: &mut self.mesh_base_scales,
                mesh_cast_shadows: &mut self.mesh_cast_shadows,
                mesh_receive_shadows: &mut self.mesh_receive_shadows,
                directional_lights: &mut self.directional_lights,
                point_lights: &mut self.point_lights,
                spot_lights: &mut self.spot_lights,
                ambient_light: &mut self.ambient_light,
                skybox_renderer: &mut self.skybox_renderer,
                loaded_entity_ids: &mut self.loaded_entity_ids,
            },
        );
    }

    async fn load_entity(&mut self, entity: &Entity) -> Result<()> {
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        log::info!(
            "\n[Entity {}] \"{}\"",
            entity_id,
            entity.name.as_deref().unwrap_or("unnamed")
        );

        // Try to get Transform component
        let transform = self.get_component::<Transform>(entity, "Transform");

        // Check for LOD component
        let lod_component = self.get_component::<vibe_ecs_bridge::LODComponent>(entity, "LOD");

        // Check for MeshRenderer
        if let Some(mesh_renderer) = self.get_component::<MeshRenderer>(entity, "MeshRenderer") {
            self.handle_mesh_renderer(entity, &mesh_renderer, transform.as_ref(), lod_component.as_ref())
                .await?;
        }

        // Check for GeometryAsset
        if let Some(geometry_asset) = self.get_component::<GeometryAsset>(entity, "GeometryAsset") {
            self.handle_geometry_asset(entity, &geometry_asset, transform.as_ref())
                .await?;
        }

        // Check for Instanced
        if let Some(instanced) = self.get_component::<Instanced>(entity, "Instanced") {
            self.handle_instanced(entity, &instanced, transform.as_ref())
                .await?;
        }

        // Check for Terrain
        if let Some(terrain) = self.get_component::<Terrain>(entity, "Terrain") {
            self.handle_terrain(entity, &terrain, transform.as_ref())
                .await?;
        }

        // Check for Light
        if let Some(light) = self.get_component::<LightComponent>(entity, "Light") {
            self.handle_light(&light, transform.as_ref())?;
        }

        // Check for Camera
        if let Some(camera) = self.get_component::<CameraComponent>(entity, "Camera") {
            self.handle_camera(&camera, transform.as_ref()).await?;
        }

        // Mark entity as loaded to prevent duplicate loading
        self.loaded_entity_ids.insert(entity_id);

        Ok(())
    }

    fn get_component<T: 'static>(&self, entity: &Entity, component_name: &str) -> Option<T>
    where
        T: serde::de::DeserializeOwned,
    {
        entity
            .components
            .get(component_name)
            .and_then(|value| self.component_registry.decode(component_name, value).ok())
            .and_then(|boxed| boxed.downcast::<T>().ok())
            .map(|boxed| *boxed)
    }

    async fn handle_mesh_renderer(
        &mut self,
        entity: &Entity,
        mesh_renderer: &MeshRenderer,
        transform: Option<&Transform>,
        lod_component: Option<&vibe_ecs_bridge::LODComponent>,
    ) -> Result<()> {
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        // Get effective transform (world transform if in scene graph, else local)
        let effective_transform = crate::renderer::entity_loader::get_effective_transform(
            entity_id,
            transform,
            &mut self.scene_graph,
        );

        // Get camera position for LOD distance calculations
        let camera_pos = GlamVec3::new(
            self.camera.position().x,
            self.camera.position().y,
            self.camera.position().z,
        );

        let submeshes = crate::renderer::entity_loader::handle_mesh_renderer(
            &self.context,
            entity,
            mesh_renderer,
            effective_transform.as_ref(),
            transform,
            lod_component,
            &mut self.material_manager,
            &self.lod_manager,
            camera_pos,
        )
        .await?;

        // Handle all submeshes (primitives return 1, GLTF models may return multiple)
        for (gm, final_scale, base_scale) in submeshes.into_iter() {
            let mesh_idx = self.meshes.len();
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(mesh_renderer.cast_shadows);
            self.mesh_receive_shadows
                .push(mesh_renderer.receive_shadows);

            // Register mesh with BVH system for culling and raycasting
            if self.bvh_manager.is_none() {
                let (bvh_manager, visibility_culler) =
                    crate::renderer::bvh_integration::initialize_bvh_system();
                self.bvh_manager = Some(bvh_manager);
                self.visibility_culler = Some(visibility_culler);
            }
            if let (Some(ref bvh_manager), Some(mesh)) = (&self.bvh_manager, self.meshes.get(mesh_idx)) {
                crate::renderer::bvh_integration::register_mesh_with_bvh(
                    bvh_manager,
                    mesh,
                    entity_id,
                    mesh_idx,
                );
            }
        }

        Ok(())
    }

    async fn handle_geometry_asset(
        &mut self,
        entity: &Entity,
        geometry_asset: &GeometryAsset,
        transform: Option<&Transform>,
    ) -> Result<()> {
        // Delegate to entity_loader module
        let result = crate::renderer::entity_loader::handle_geometry_asset(
            &self.context,
            entity,
            geometry_asset,
            transform,
            &mut self.material_manager,
        )
        .await;

        // Only store if successful
        if let Ok((gm, final_scale, base_scale)) = result {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(geometry_asset.cast_shadows);
            self.mesh_receive_shadows
                .push(geometry_asset.receive_shadows);
        }

        Ok(())
    }

    async fn handle_instanced(
        &mut self,
        entity: &Entity,
        instanced: &Instanced,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let instances = crate::renderer::entity_loader::handle_instanced(
            &self.context,
            entity,
            instanced,
            transform,
            &mut self.material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        // Each instance becomes a separate mesh (three-d doesn't have native GPU instancing)
        for (gm, final_scale, base_scale) in instances.into_iter() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(instanced.cast_shadows);
            self.mesh_receive_shadows.push(instanced.receive_shadows);
        }

        Ok(())
    }

    async fn handle_terrain(
        &mut self,
        entity: &Entity,
        terrain: &Terrain,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let meshes = crate::renderer::entity_loader::handle_terrain(
            &self.context,
            entity,
            terrain,
            transform,
            &mut self.material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        for (gm, final_scale, base_scale) in meshes.into_iter() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(true); // Terrains cast shadows by default
            self.mesh_receive_shadows.push(true); // Terrains receive shadows by default
        }

        Ok(())
    }

    fn handle_light(
        &mut self,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(loaded_light) = crate::renderer::entity_loader::handle_light(
            &self.context,
            light,
            transform,
        )? {
            match loaded_light {
                LoadedLight::Directional(light) => self.directional_lights.push(light),
                LoadedLight::Point(light) => self.point_lights.push(light),
                LoadedLight::Spot(light) => self.spot_lights.push(light),
                LoadedLight::Ambient(light) => self.ambient_light = Some(light),
            }
        }
        Ok(())
    }

    async fn handle_camera(
        &mut self,
        camera_component: &CameraComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(result) = crate::renderer::entity_loader::handle_camera(
            &self.context,
            camera_component,
            transform,
            self.window_size,
        )
        .await?
        {
            if result.config.is_main {
                self.camera = result.camera;
                self.camera_config = Some(result.config.clone());
                self.skybox_renderer = result.skybox_renderer;
                self.last_camera_position = result.config.position;
                self.last_camera_target = result.config.target;
            } else {
                self.additional_cameras.push(AdditionalCamera {
                    camera: result.camera,
                    config: result.config.clone(),
                    skybox_renderer: result.skybox_renderer,
                    last_position: result.config.position,
                    last_target: result.config.target,
                });
            }
        }
        Ok(())
    }




    // ========================================================================
    // LOD Management API
    // ========================================================================

    /// Get reference to LOD manager for configuration
    pub fn lod_manager(&self) -> &Arc<LODManager> {
        &self.lod_manager
    }

    /// Set global LOD quality (disables auto-switch)
    pub fn set_lod_quality(&self, quality: crate::renderer::LODQuality) {
        self.lod_manager.set_quality(quality);
        log::info!("LOD quality set to: {:?}", quality);
    }

    /// Enable/disable automatic distance-based LOD switching
    pub fn set_lod_auto_switch(&self, enabled: bool) {
        self.lod_manager.set_auto_switch(enabled);
        log::info!("LOD auto-switch: {}", if enabled { "enabled" } else { "disabled" });
    }

    /// Set distance thresholds for LOD switching
    pub fn set_lod_distance_thresholds(&self, high: f32, low: f32) {
        self.lod_manager.set_distance_thresholds(high, low);
        log::info!("LOD thresholds set to: high={}, low={}", high, low);
    }

    /// Get current LOD configuration
    pub fn get_lod_config(&self) -> crate::renderer::LODConfig {
        self.lod_manager.get_config()
    }
}

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
