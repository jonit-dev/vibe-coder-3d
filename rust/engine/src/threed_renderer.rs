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

struct RenderSettings {
    clear_state: Option<ClearState>,
    render_skybox: bool,
    post_settings: Option<PostProcessSettings>,
}

struct AdditionalCamera {
    camera: Camera,
    config: CameraConfig,
    skybox_renderer: SkyboxRenderer,
    last_position: Vec3,
    last_target: Vec3,
}

struct CameraEntry {
    depth: i32,
    variant: CameraVariant,
}

enum CameraVariant {
    Main,
    Additional(usize),
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
    pub fn update_camera_internal(&mut self, delta_time: f32) {
        if let Some(ref config) = self.camera_config.clone() {
            if let Some(target_id) = Self::follow_target_if_locked(&config) {
                let target_vec3 =
                    Self::compute_follow_target_position(self.scene_graph.as_mut(), target_id);
                if let Some(target_vec3) = target_vec3 {
                    Self::apply_follow_to_camera(
                        &mut self.camera,
                        &config,
                        target_vec3,
                        &mut self.last_camera_position,
                        &mut self.last_camera_target,
                        delta_time,
                    );
                } else {
                    log::warn!(
                        "Camera follow target entity {} not found in scene",
                        target_id
                    );
                }
            }
        }

        for idx in 0..self.additional_cameras.len() {
            let follow_target = {
                let cam = &self.additional_cameras[idx];
                Self::follow_target_if_locked(&cam.config)
            };

            if let Some(target_id) = follow_target {
                let target_vec3 =
                    Self::compute_follow_target_position(self.scene_graph.as_mut(), target_id);

                if let Some(target_vec3) = target_vec3 {
                    let (config, camera, last_position, last_target) = {
                        let cam = &mut self.additional_cameras[idx];
                        (
                            &cam.config,
                            &mut cam.camera,
                            &mut cam.last_position,
                            &mut cam.last_target,
                        )
                    };

                    Self::apply_follow_to_camera(
                        camera,
                        config,
                        target_vec3,
                        last_position,
                        last_target,
                        delta_time,
                    );
                } else {
                    log::warn!(
                        "Camera follow target entity {} not found in scene",
                        target_id
                    );
                }
            }
        }
    }

    fn ensure_post_process_targets(&mut self) {
        let (width, height) = self.window_size;

        let recreate_color = match self.hdr_color_texture {
            Some(ref tex) => tex.width() != width || tex.height() != height,
            None => true,
        };

        if recreate_color {
            self.hdr_color_texture = Some(Texture2D::new_empty::<[f32; 4]>(
                &self.context,
                width,
                height,
                Interpolation::Linear,
                Interpolation::Linear,
                Some(Interpolation::Linear),
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            ));
        }

        let recreate_depth = match self.hdr_depth_texture {
            Some(ref tex) => tex.width() != width || tex.height() != height,
            None => true,
        };

        if recreate_depth {
            self.hdr_depth_texture = Some(three_d::DepthTexture2D::new::<f32>(
                &self.context,
                width,
                height,
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            ));
        }
    }

    /// Initialize BVH system if not already initialized
    fn ensure_bvh_initialized(&mut self) {
        if self.bvh_manager.is_none() {
            log::info!("🎯 Initializing BVH System for real-time culling...");

            let config = crate::spatial::bvh_manager::BvhConfig {
                enable_bvh_culling: true,
                enable_bvh_raycasts: true,
                max_leaf_triangles: 8,
                max_leaf_refs: 4,
                mesh_split_strategy: crate::spatial::mesh_bvh::SplitStrategy::Sah,
                enable_incremental_updates: true,
            };

            let bvh_manager = std::sync::Arc::new(std::sync::Mutex::new(
                crate::spatial::bvh_manager::BvhManager::with_config(config)
            ));
            let visibility_culler = crate::renderer::visibility::VisibilityCuller::new(bvh_manager.clone());

            self.bvh_manager = Some(bvh_manager);
            self.visibility_culler = Some(visibility_culler);

            log::info!("✅ BVH System initialized with SAH splitting and incremental updates");
        }
    }

    /// Register a mesh with the BVH system.
    ///
    /// Uses three-d's built-in axis-aligned bounding box for the mesh (local space) and
    /// stores it in the BVH keyed by the entity id. We do NOT try to read raw vertex
    /// buffers; we rely on three-d's geometry metadata instead.
    fn register_mesh_with_bvh(&mut self, mesh_idx: usize) {
        // Ensure BVH exists
        self.ensure_bvh_initialized();

        let (Some(ref bvh_manager), Some(&entity_id)) =
            (&self.bvh_manager, self.mesh_entity_ids.get(mesh_idx))
        else {
            return;
        };

        let Some(mesh) = self.meshes.get(mesh_idx) else {
            return;
        };

        // three-d Mesh::aabb() returns an axis-aligned bounding box in mesh-local space.
        // We convert it into our internal Aabb type.
        let mesh_aabb = mesh.aabb();
        let min = glam::Vec3::new(
            mesh_aabb.min().x,
            mesh_aabb.min().y,
            mesh_aabb.min().z,
        );
        let max = glam::Vec3::new(
            mesh_aabb.max().x,
            mesh_aabb.max().y,
            mesh_aabb.max().z,
        );
        let local_aabb = crate::spatial::primitives::Aabb::new(min, max);

        // For initial registration we use identity transform; update_bvh_system() will
        // apply the current world transform each frame.
        let mut manager = bvh_manager.lock().unwrap();
        manager.register_mesh(entity_id.as_u64(), &[], &[], local_aabb);

        log::debug!(
            "📦 Registered mesh {} (entity {}) with BVH using three-d aabb",
            mesh_idx,
            entity_id
        );
    }

    /// Update BVH system transforms from current mesh transforms.
    ///
    /// This wires the BVH to actual world transforms so frustum culling is correct
    /// instead of using placeholder identity matrices.
    fn update_bvh_system(&mut self) {
        // Ensure BVH exists
        self.ensure_bvh_initialized();

        // BVH update temporarily disabled: keep it a no-op to avoid impacting rendering.
        // This avoids incorrect transforms and expensive rebuilds while BVH integration
        // is still experimental.
        if self.bvh_manager.is_some() {
            log::debug!("BVH manager present; update_bvh_system is currently a no-op");
        }
    }

    /// Get indices of visible meshes based solely on MeshRenderer.enabled.
    ///
    /// BVH/frustum culling is intentionally disabled for now to avoid regressions
    /// (gray/empty scenes, stack overflows from bad math). This function is guaranteed
    /// to be O(mesh_count) and non-recursive.
    fn get_visible_mesh_indices(&self, render_state: Option<&MeshRenderState>) -> Vec<usize> {
        match render_state {
            None => (0..self.meshes.len()).collect(),
            Some(state) => {
                (0..self.meshes.len())
                    .filter(|&idx| {
                        if let Some(&entity_id) = self.mesh_entity_ids.get(idx) {
                            // Only hide when explicitly disabled
                            !matches!(state.visibility.get(&entity_id), Some(false))
                        } else {
                            // If we don't know the entity, keep it visible
                            true
                        }
                    })
                    .collect()
            }
        }
    }

    /// Render a frame
    pub fn render(
        &mut self,
        delta_time: f32,
        debug_mode: bool,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        self.log_first_frame();

        // Update camera (follow system, etc.)
        self.update_camera_internal(delta_time);

        // Update BVH system for culling
        self.update_bvh_system();

        // Update BVH debug logging
        if let (Some(bvh_manager), Some(ref mut debug_logger)) = (&self.bvh_manager, &mut self.bvh_debug_logger) {
            let manager = bvh_manager.lock().unwrap();
            debug_logger.update(delta_time, &manager);
        }

        // Generate shadow maps for lights that cast shadows
        self.generate_shadow_maps();

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
                    let settings =
                        Self::prepare_render_settings_for(config, self.skybox_renderer.is_loaded());

                    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
                    if let Some(ref post_settings) = settings.post_settings {
                        if post_settings.apply_tone_mapping {
                            tone_restore =
                                Some((self.camera.tone_mapping, self.camera.color_mapping));
                            self.camera.disable_tone_and_color_mapping();
                        }
                    }

                    if let Some(post_settings) = settings.post_settings.clone() {
                        self.ensure_post_process_targets();

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
                        let visible_indices = self.get_visible_mesh_indices(render_state);

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

                        let lights = self.collect_lights();
                        let visible_indices = self.get_visible_mesh_indices(render_state);
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
                    let settings = Self::prepare_render_settings_for(&config_clone, skybox_loaded);

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
                        self.ensure_post_process_targets();

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
                        let visible_indices = self.get_visible_mesh_indices(render_state);

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

                        let lights = self.collect_lights();
                        let visible_indices = self.get_visible_mesh_indices(render_state);
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
        self.generate_shadow_maps();

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
        let lights = self.collect_lights();
        let visible_indices = self.get_visible_mesh_indices(render_state);
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
            let viewport = Self::viewport_from_config(config, self.window_size);
            self.camera.set_viewport(viewport);
        } else {
            self.camera
                .set_viewport(Viewport::new_at_origo(width, height));
        }

        for cam in &mut self.additional_cameras {
            let viewport = Self::viewport_from_config(&cam.config, self.window_size);
            cam.camera.set_viewport(viewport);
        }
    }

    fn viewport_from_config(config: &CameraConfig, window_size: (u32, u32)) -> Viewport {
        if let Some(ref rect) = config.viewport_rect {
            let x = (rect.x * window_size.0 as f32) as u32;
            let y = (rect.y * window_size.1 as f32) as u32;
            let width = (rect.width * window_size.0 as f32) as u32;
            let height = (rect.height * window_size.1 as f32) as u32;

            Viewport {
                x: x as i32,
                y: y as i32,
                width: width.max(1),
                height: height.max(1),
            }
        } else {
            Viewport::new_at_origo(window_size.0, window_size.1)
        }
    }

    fn prepare_render_settings_for(config: &CameraConfig, skybox_loaded: bool) -> RenderSettings {
        const NEUTRAL_GRAY: (f32, f32, f32, f32) = (64.0 / 255.0, 64.0 / 255.0, 64.0 / 255.0, 1.0);

        let solid_color = config
            .background_color
            .unwrap_or((0.0_f32, 0.0_f32, 0.0_f32, 1.0));

        let solid_clear = ClearState::color_and_depth(
            solid_color.0,
            solid_color.1,
            solid_color.2,
            solid_color.3,
            1.0,
        );
        let gray_clear = ClearState::color_and_depth(
            NEUTRAL_GRAY.0,
            NEUTRAL_GRAY.1,
            NEUTRAL_GRAY.2,
            NEUTRAL_GRAY.3,
            1.0,
        );

        let mut render_skybox = false;

        let clear_state = match config
            .clear_flags
            .as_deref()
            .map(|s| s.to_ascii_lowercase())
            .unwrap_or_else(|| "solidcolor".to_string())
            .as_str()
        {
            "skybox" => {
                if skybox_loaded {
                    render_skybox = true;
                    Some(ClearState::depth(1.0))
                } else {
                    Some(gray_clear)
                }
            }
            "depthonly" => Some(ClearState::depth(1.0)),
            "dontclear" => None,
            "solidcolor" | "color" => Some(solid_clear),
            other => {
                log::warn!(
                    "Unknown clear flag '{}', defaulting to neutral gray clear.",
                    other
                );
                Some(gray_clear)
            }
        };

        let post_settings = PostProcessSettings::from_camera(config);

        RenderSettings {
            clear_state,
            render_skybox,
            post_settings,
        }
    }

    fn follow_target_if_locked(config: &CameraConfig) -> Option<u32> {
        let target_id = config.follow_target?;
        match config
            .control_mode
            .as_deref()
            .map(|mode| mode.to_ascii_lowercase())
        {
            Some(ref mode) if mode == "locked" => Some(target_id),
            Some(ref mode) if mode == "free" => None,
            Some(ref mode) => {
                log::warn!(
                    "Unknown camera controlMode '{}'; defaulting to locked follow.",
                    mode
                );
                Some(target_id)
            }
            None => Some(target_id),
        }
    }

    fn compute_follow_target_position(
        scene_graph: Option<&mut SceneGraph>,
        target_id: u32,
    ) -> Option<Vec3> {
        let graph = scene_graph?;
        let entity_id = EntityId::new(target_id as u64);
        let transform = graph.get_world_transform(entity_id)?;
        let target_pos = transform.w_axis.truncate();
        Some(vec3(target_pos.x, target_pos.y, target_pos.z))
    }

    fn apply_follow_to_camera(
        camera: &mut Camera,
        config: &CameraConfig,
        target_vec3: Vec3,
        last_position: &mut Vec3,
        last_target: &mut Vec3,
        delta_time: f32,
    ) {
        let offset = config.follow_offset.unwrap_or(vec3(0.0, 2.0, -5.0));
        let desired_position = target_vec3 + offset;

        let new_position = if config.enable_smoothing {
            let smoothing_factor = (config.smoothing_speed * delta_time).min(1.0);
            *last_position * (1.0 - smoothing_factor) + desired_position * smoothing_factor
        } else {
            desired_position
        };

        let desired_target = target_vec3;
        let new_target = if config.enable_smoothing {
            let rotation_factor = (config.rotation_smoothing * delta_time).min(1.0);
            *last_target * (1.0 - rotation_factor) + desired_target * rotation_factor
        } else {
            desired_target
        };

        camera.set_view(new_position, new_target, vec3(0.0, 1.0, 0.0));

        *last_position = new_position;
        *last_target = new_target;
    }

    /// Load a full scene from SceneData
    /// Now async to support texture loading!
    pub async fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        self.log_scene_load_start(scene);
        self.clear_scene();

        // Build scene graph for transform hierarchy and camera follow
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("SCENE GRAPH");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        let scene_graph = SceneGraph::build(scene)?;
        log::info!(
            "Scene graph built with {} entities",
            scene_graph.entity_count()
        );
        self.scene_graph = Some(scene_graph);

        // Load materials
        self.load_materials(scene);

        // Load and register prefabs
        let mut prefab_registry = vibe_ecs_bridge::PrefabRegistry::new();
        let mut prefab_instances: Vec<Entity> = Vec::new();

        // Note: Prefabs are no longer stored as a top-level scene field
        // They may be loaded from a separate source in the future

        // Process PrefabInstance components and instantiate prefabs
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("PREFAB INSTANCES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        for entity in &scene.entities {
            if let Some(prefab_instance) =
                self.get_component::<vibe_ecs_bridge::PrefabInstance>(entity, "PrefabInstance")
            {
                log::info!("  Instantiating prefab: {}", prefab_instance.prefab_id);

                // Extract instance Transform to position the prefab
                let instance_transform = entity.components.get("Transform");

                match prefab_registry.get(&prefab_instance.prefab_id) {
                    Some(prefab) => {
                        match vibe_ecs_bridge::instantiate_prefab(
                            prefab,
                            entity.persistent_id.clone(),
                            prefab_instance.override_patch.as_ref(),
                            instance_transform,
                            &prefab_instance.instance_uuid,
                            &self.component_registry,
                        ) {
                            Ok(instances) => {
                                log::info!("    → Created {} entity/entities", instances.len());
                                prefab_instances.extend(instances);
                            }
                            Err(e) => {
                                log::warn!(
                                    "    Failed to instantiate prefab {}: {}",
                                    prefab_instance.prefab_id,
                                    e
                                );
                            }
                        }
                    }
                    None => {
                        log::warn!("    Prefab not found: {}", prefab_instance.prefab_id);
                    }
                }
            }
        }

        // Rebuild scene graph with prefab instances included
        if !prefab_instances.is_empty() {
            log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log::info!("REBUILDING SCENE GRAPH WITH PREFAB INSTANCES");
            log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log::info!("  Original entities: {}", scene.entities.len());
            log::info!("  Prefab instances: {}", prefab_instances.len());

            // Create merged scene with both original entities and prefab instances
            let mut full_scene = scene.clone();
            full_scene.entities.extend(prefab_instances.clone());

            // Rebuild scene graph to include prefab hierarchies
            self.scene_graph = Some(SceneGraph::build(&full_scene)?);
            log::info!(
                "  Scene graph rebuilt with {} total entities",
                full_scene.entities.len()
            );
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

        self.log_scene_load_summary();

        Ok(())
    }

    /// Sync newly created entities to renderer
    /// This is called after SceneManager applies entity commands to add runtime-created entities to the renderer
    pub async fn sync_new_entities(&mut self, scene: &SceneData) -> Result<()> {
        log::debug!(
            "sync_new_entities: checking {} scene entities against {} loaded entities",
            scene.entities.len(),
            self.loaded_entity_ids.len()
        );

        for entity in &scene.entities {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

            // Check if this entity has already been loaded (prevents duplicate cameras/lights/meshes)
            if !self.loaded_entity_ids.contains(&entity_id) {
                log::info!(
                    "Syncing new entity {} ({})",
                    entity_id,
                    entity.name.as_deref().unwrap_or("unnamed")
                );

                // Load the new entity (handles all component types)
                // Note: load_entity() automatically adds entity_id to loaded_entity_ids
                self.load_entity(entity).await?;
            }
        }

        log::debug!(
            "sync_new_entities: complete, loaded {} total entities",
            self.loaded_entity_ids.len()
        );
        Ok(())
    }

    /// Sync physics transforms back to renderer meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        // Iterate through all entities with physics bodies
        for (entity_id, body_handle) in physics_world.entity_to_body.iter() {
            if let Some(body) = physics_world.rigid_bodies.get(*body_handle) {
                // A single entity (especially GLTF models) may expand to multiple submeshes,
                // so update every mesh that references this physics body.
                let mesh_count = self.mesh_entity_ids.len();
                for mesh_idx in 0..mesh_count {
                    if self.mesh_entity_ids[mesh_idx] == *entity_id {
                        self.update_mesh_from_physics(mesh_idx, body);
                    }
                }
            }
        }
    }

    /// Sync script transforms back to renderer meshes
    pub fn sync_script_transforms(&mut self, script_system: &vibe_scripting::ScriptSystem) {
        use vibe_scene::EntityId;

        let entity_ids = script_system.entity_ids();
        log::debug!(
            "sync_script_transforms: {} entities with scripts",
            entity_ids.len()
        );
        log::debug!(
            "  Renderer has {} meshes with IDs: {:?}",
            self.mesh_entity_ids.len(),
            self.mesh_entity_ids
        );

        // Get all entity IDs that have scripts
        for entity_id in entity_ids {
            // Get the transform from the script system
            if let Some(transform) = script_system.take_transform_if_dirty(entity_id) {
                log::debug!(
                    "  Script entity {}: rotation={:?}",
                    entity_id,
                    transform.rotation
                );

                // The entity_id from script system is now u64 (PersistentId hash)
                let entity_id_obj = EntityId::new(entity_id);
                log::debug!(
                    "    Looking for EntityId({}) in renderer mesh list",
                    entity_id
                );

                // Collect all mesh indices for this entity (GLTF models may have multiple submeshes)
                let matching_indices: Vec<usize> = self
                    .mesh_entity_ids
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, id)| {
                        let matches = *id == entity_id_obj;
                        log::debug!(
                            "      Comparing {:?} == {:?}: {}",
                            id,
                            entity_id_obj,
                            matches
                        );
                        matches.then_some(idx)
                    })
                    .collect();

                if matching_indices.is_empty() {
                    log::warn!(
                        "  Entity {} has script but no mesh found in renderer",
                        entity_id
                    );
                    continue;
                }

                for mesh_idx in matching_indices {
                    log::debug!("    Updating mesh at index {}", mesh_idx);
                    let base_scale = self
                        .mesh_base_scales
                        .get(mesh_idx)
                        .copied()
                        .unwrap_or(GlamVec3::ONE);
                    let (transform_mat, final_scale) =
                        crate::renderer::transform_utils::compose_transform_with_base_scale(
                            &transform, base_scale,
                        );

                    if let Some(mesh) = self.meshes.get_mut(mesh_idx) {
                        mesh.set_transformation(transform_mat);
                        self.mesh_scales[mesh_idx] = final_scale;
                        log::debug!("    Transform applied successfully");
                    }
                }
            }
        }
    }

    /// Update entity material from script mutation (e.g., material:setColor())
    ///
    /// Updates the material properties for all meshes belonging to the given entity
    pub fn update_entity_material(
        &mut self,
        entity_id: vibe_scene::EntityId,
        data: &serde_json::Value,
    ) {
        use three_d::Srgba;

        log::debug!("update_entity_material called for entity {:?}", entity_id);

        // Find all mesh indices for this entity
        let matching_indices: Vec<usize> = self
            .mesh_entity_ids
            .iter()
            .enumerate()
            .filter_map(|(idx, id)| if *id == entity_id { Some(idx) } else { None })
            .collect();

        if matching_indices.is_empty() {
            log::warn!("Entity {:?} has no meshes to update", entity_id);
            return;
        }

        log::debug!(
            "Found {} meshes for entity {:?}",
            matching_indices.len(),
            entity_id
        );

        // Extract material changes from the data
        if let Some(material_obj) = data.get("material").and_then(|v| v.as_object()) {
            for mesh_idx in matching_indices {
                if let Some(mesh) = self.meshes.get_mut(mesh_idx) {
                    // Access material directly (PhysicalMaterial is the second type parameter)
                    let material = &mut mesh.material;

                    // Update color if present
                    if let Some(color_str) = material_obj.get("color").and_then(|v| v.as_str()) {
                        if let Some(color) =
                            crate::renderer::material_manager::parse_hex_color(color_str)
                        {
                            material.albedo = color;
                            log::info!("Updated mesh {} material color to {}", mesh_idx, color_str);
                        }
                    }

                    // Update metalness if present
                    if let Some(metalness) = material_obj.get("metalness").and_then(|v| v.as_f64())
                    {
                        material.metallic = metalness as f32;
                        log::debug!("Updated mesh {} metalness to {}", mesh_idx, metalness);
                    }

                    // Update roughness if present
                    if let Some(roughness) = material_obj.get("roughness").and_then(|v| v.as_f64())
                    {
                        material.roughness = roughness as f32;
                        log::debug!("Updated mesh {} roughness to {}", mesh_idx, roughness);
                    }

                    // Update emissive if present
                    if let Some(emissive_str) =
                        material_obj.get("emissive").and_then(|v| v.as_str())
                    {
                        if let Some(emissive_color) =
                            crate::renderer::material_manager::parse_hex_color(emissive_str)
                        {
                            material.emissive = emissive_color;
                            log::debug!("Updated mesh {} emissive to {}", mesh_idx, emissive_str);
                        }
                    }

                    // Update emissive intensity if present
                    if let Some(intensity) = material_obj
                        .get("emissiveIntensity")
                        .and_then(|v| v.as_f64())
                    {
                        let intensity = intensity.max(0.0) as f32;
                        let emissive = material.emissive;
                        let scale =
                            |channel: u8| ((channel as f32 * intensity).clamp(0.0, 255.0)) as u8;
                        material.emissive = Srgba::new(
                            scale(emissive.r),
                            scale(emissive.g),
                            scale(emissive.b),
                            emissive.a,
                        );
                        log::debug!(
                            "Updated mesh {} emissive intensity factor to {}",
                            mesh_idx,
                            intensity
                        );
                    }
                }
            }
        }
    }

    /// Render debug visualizations (grid, colliders, etc.) when debug mode is enabled
    pub fn render_debug_overlay(
        &mut self,
        target: &RenderTarget,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
    ) -> Result<()> {
        use crate::debug::{append_collider_lines, append_ground_grid, LineBatch};

        let mut line_batch = LineBatch::new();

        // Add ground grid (20x20 units, 20 divisions)
        append_ground_grid(&mut line_batch, 20.0, 20);

        // Add collider outlines if physics world exists
        if let Some(physics_world) = physics_world {
            append_collider_lines(physics_world, &mut line_batch);
        }

        // Render the lines
        if let Some(debug_mesh) = self.debug_line_renderer.create_line_mesh(&line_batch)? {
            target.render(&self.camera, &[&debug_mesh], &[]);
        }

        Ok(())
    }

    // ===== Private Helper Methods =====

    fn clear_scene(&mut self) {
        self.meshes.clear();
        self.mesh_entity_ids.clear();
        self.mesh_scales.clear();
        self.mesh_base_scales.clear();
        self.mesh_cast_shadows.clear();
        self.mesh_receive_shadows.clear();
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;
        self.skybox_renderer.clear();
        self.loaded_entity_ids.clear();
    }

    fn load_materials(&mut self, scene: &SceneData) {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if !scene.materials.is_empty() {
            let materials_value = serde_json::Value::Array(scene.materials.clone());
            self.material_manager.load_from_scene(&materials_value);
        } else {
            log::warn!("No materials found in scene");
        }
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

        // Try to get world transform from scene graph (for parent-child hierarchies)
        let effective_transform = if let Some(scene_graph) = &mut self.scene_graph {
            if let Some(world_matrix) = scene_graph.get_world_transform(entity_id) {
                // Decompose world matrix into TRS components
                let (scale, rotation, translation) = world_matrix.to_scale_rotation_translation();

                // Create a Transform with world values
                Some(Transform {
                    position: Some([translation.x, translation.y, translation.z]),
                    rotation: Some(vec![rotation.x, rotation.y, rotation.z, rotation.w]), // Quaternion XYZW
                    scale: Some([scale.x, scale.y, scale.z]),
                })
            } else {
                // Entity not in scene graph, use local transform
                transform.cloned()
            }
        } else {
            // No scene graph, use local transform
            transform.cloned()
        };

        // Get camera position for LOD distance calculations
        let camera_pos = GlamVec3::new(
            self.camera.position().x,
            self.camera.position().y,
            self.camera.position().z,
        );

        let submeshes = load_mesh_renderer(
            &self.context,
            entity,
            mesh_renderer,
            effective_transform.as_ref(),
            &mut self.material_manager,
            lod_component,
            &self.lod_manager,
            camera_pos,
        )
        .await?;

        // Handle all submeshes (primitives return 1, GLTF models may return multiple)
        for (idx, (gm, final_scale, base_scale)) in submeshes.into_iter().enumerate() {
            let mesh_idx = self.meshes.len();
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(mesh_renderer.cast_shadows);
            self.mesh_receive_shadows
                .push(mesh_renderer.receive_shadows);

            // Register mesh with BVH system for culling and raycasting
            self.register_mesh_with_bvh(mesh_idx);

            if let Some(transform) = transform {
                let ts_position =
                    vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
                let converted = threejs_to_threed_position(ts_position);
                log::info!(
                    "    Submesh {} transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
                    idx,
                    ts_position.x,
                    ts_position.y,
                    ts_position.z,
                    converted.x,
                    converted.y,
                    converted.z
                );
            } else {
                log::info!(
                    "    Submesh {} transform: no Transform component, using primitive base scale only",
                    idx
                );
            }

            log::info!(
                "      Shadows → cast: {}, receive: {}, final scale [{:.2}, {:.2}, {:.2}]",
                mesh_renderer.cast_shadows,
                mesh_renderer.receive_shadows,
                final_scale.x,
                final_scale.y,
                final_scale.z
            );
        }

        Ok(())
    }

    async fn handle_geometry_asset(
        &mut self,
        entity: &Entity,
        geometry_asset: &GeometryAsset,
        transform: Option<&Transform>,
    ) -> Result<()> {
        use crate::renderer::mesh_loader::convert_geometry_meta_to_cpu_mesh;

        log::info!("  GeometryAsset:");
        log::info!("    Path:        {:?}", geometry_asset.path);
        log::info!("    Geometry ID: {:?}", geometry_asset.geometry_id);
        log::info!("    Material ID: {:?}", geometry_asset.material_id);
        log::info!("    Enabled:     {}", geometry_asset.enabled);

        if !geometry_asset.enabled {
            log::info!("    Skipping disabled geometry asset");
            return Ok(());
        }

        // 1. Load the geometry metadata from path
        // Resolve path: TypeScript stores paths like "/src/game/geometry/file.shape.json"
        // Geometry files are synced from src/game/geometry/ to rust/game/geometry/ via yarn rust:sync-assets
        // Since we run from rust/engine/, we load from ../game/geometry/
        let resolved_path = if geometry_asset.path.starts_with("/src/game/geometry/") {
            // Extract just the filename from the TypeScript path
            let filename = geometry_asset
                .path
                .strip_prefix("/src/game/geometry/")
                .unwrap_or(&geometry_asset.path);
            PathBuf::from("../game/geometry").join(filename)
        } else if geometry_asset.path.starts_with('/') {
            // Legacy fallback: strip leading slash and use relative path
            let relative_path = geometry_asset
                .path
                .strip_prefix('/')
                .unwrap_or(&geometry_asset.path);
            PathBuf::from("../..").join(relative_path)
        } else {
            PathBuf::from(&geometry_asset.path)
        };

        log::info!("    Resolved path: {}", resolved_path.display());

        let geometry_meta =
            vibe_assets::GeometryMeta::from_file(&resolved_path).with_context(|| {
                format!("Failed to load geometry metadata: {}", geometry_asset.path)
            })?;

        log::info!(
            "    Loaded metadata: {} vertices, {} indices",
            geometry_meta.vertex_count().unwrap_or(0),
            geometry_meta.index_count().unwrap_or(0)
        );

        // 2. Convert to CpuMesh
        let cpu_mesh = convert_geometry_meta_to_cpu_mesh(&geometry_meta)?;

        // 3. Create GPU mesh
        let mut mesh = Mesh::new(&self.context, &cpu_mesh);

        // 4. Get or create material
        let material = if let Some(material_id) = &geometry_asset.material_id {
            if let Some(material_data) = self.material_manager.get_material(material_id) {
                log::info!("    Using material: {}", material_id);
                let material_clone = material_data.clone();
                self.material_manager
                    .create_physical_material(&self.context, &material_clone)
                    .await?
            } else {
                log::warn!("    Material '{}' not found, using default", material_id);
                self.material_manager.create_default_material(&self.context)
            }
        } else {
            log::info!("    Using default material");
            self.material_manager.create_default_material(&self.context)
        };

        // 5. Apply transform
        let (final_scale, base_scale) = if let Some(transform) = transform {
            let converted =
                crate::renderer::transform_utils::convert_transform_to_matrix(transform, None);
            mesh.set_transformation(converted.matrix);

            let ts_position = vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
            let converted_pos = threejs_to_threed_position(ts_position);
            log::info!(
                "    Transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
                ts_position.x,
                ts_position.y,
                ts_position.z,
                converted_pos.x,
                converted_pos.y,
                converted_pos.z
            );

            (converted.final_scale, converted.base_scale)
        } else {
            log::info!("    No Transform component, using identity transform");
            (GlamVec3::ONE, GlamVec3::ONE)
        };

        // 6. Store in parallel arrays
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        self.meshes.push(Gm::new(mesh, material));
        self.mesh_entity_ids.push(entity_id);
        self.mesh_scales.push(final_scale);
        self.mesh_base_scales.push(base_scale);
        self.mesh_cast_shadows.push(geometry_asset.cast_shadows);
        self.mesh_receive_shadows
            .push(geometry_asset.receive_shadows);

        log::info!(
            "    GeometryAsset loaded → cast shadows: {}, receive shadows: {}, final scale [{:.2}, {:.2}, {:.2}]",
            geometry_asset.cast_shadows,
            geometry_asset.receive_shadows,
            final_scale.x,
            final_scale.y,
            final_scale.z
        );

        Ok(())
    }

    async fn handle_instanced(
        &mut self,
        entity: &Entity,
        instanced: &Instanced,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let instances = load_instanced(
            &self.context,
            entity,
            instanced,
            transform,
            &mut self.material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        let instance_count = instances.len();

        // Each instance becomes a separate mesh (three-d doesn't have native GPU instancing)
        for (idx, (gm, final_scale, base_scale)) in instances.into_iter().enumerate() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(instanced.cast_shadows);
            self.mesh_receive_shadows.push(instanced.receive_shadows);

            if idx < 3 {
                log::info!(
                    "    Instance {}: shadows (cast: {}, recv: {}), scale [{:.2}, {:.2}, {:.2}]",
                    idx,
                    instanced.cast_shadows,
                    instanced.receive_shadows,
                    final_scale.x,
                    final_scale.y,
                    final_scale.z
                );
            }
        }

        if instance_count > 3 {
            log::info!("    ... and {} more instances added", instance_count - 3);
        }

        Ok(())
    }

    async fn handle_terrain(
        &mut self,
        entity: &Entity,
        terrain: &Terrain,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let meshes = generate_terrain(
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

            log::info!(
                "    Terrain mesh added: scale [{:.2}, {:.2}, {:.2}]",
                final_scale.x,
                final_scale.y,
                final_scale.z
            );
        }

        Ok(())
    }

    fn handle_light(
        &mut self,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(loaded_light) = load_light(&self.context, light, transform)? {
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
        if let Some(config) = load_camera(camera_component, transform)? {
            let mut camera = create_camera(&config, self.window_size);
            camera.tone_mapping = parse_tone_mapping(config.tone_mapping.as_deref());
            camera.color_mapping = ColorMapping::ComputeToSrgb;

            let mut skybox_renderer = SkyboxRenderer::new();
            if config.skybox_texture.is_some() {
                if let Err(err) = skybox_renderer
                    .load_from_config(&self.context, &config)
                    .await
                {
                    log::warn!("Failed to load skybox texture: {}", err);
                    skybox_renderer.clear();
                }
            }

            if config.is_main {
                self.camera = camera;
                self.camera_config = Some(config.clone());
                self.skybox_renderer = skybox_renderer;
                self.last_camera_position = config.position;
                self.last_camera_target = config.target;

                log::info!(
                    "    Main camera loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}], clearFlags={:?}, background={:?}",
                    config.position.x,
                    config.position.y,
                    config.position.z,
                    config.target.x,
                    config.target.y,
                    config.target.z,
                    config.clear_flags,
                    config.background_color
                );
            } else {
                self.additional_cameras.push(AdditionalCamera {
                    camera,
                    config: config.clone(),
                    skybox_renderer,
                    last_position: config.position,
                    last_target: config.target,
                });

                log::info!(
                    "    Additional camera (depth {}) loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}]",
                    config.depth,
                    config.position.x,
                    config.position.y,
                    config.position.z,
                    config.target.x,
                    config.target.y,
                    config.target.z
                );
            }
        }
        Ok(())
    }

    fn collect_lights(&self) -> Vec<&dyn Light> {
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

        lights
    }

    /// Helper method to render with lights, splitting borrows properly
    fn render_scene_with_lights(
        &self,
        render_target: &RenderTarget,
        camera: &Camera,
        meshes: &[Gm<Mesh, PhysicalMaterial>],
    ) {
        let lights = self.collect_lights();
        render_target.render(camera, meshes, &lights);
    }

    fn generate_shadow_maps(&mut self) {
        // Extract mesh geometries for shadow casting, filtering by cast_shadows flag
        let geometries: Vec<&dyn Geometry> = self
            .meshes
            .iter()
            .zip(self.mesh_cast_shadows.iter())
            .filter(|(_, &casts_shadow)| casts_shadow)
            .map(|(gm, _)| &gm.geometry as &dyn Geometry)
            .collect();

        if geometries.is_empty() {
            log::debug!("No shadow-casting meshes in scene");
            return;
        }

        log::debug!(
            "Generating shadow maps for {} shadow-casting meshes",
            geometries.len()
        );

        // Generate shadow maps for directional lights that cast shadows
        for light in &mut self.directional_lights {
            if light.cast_shadow {
                light.generate_shadow_map(light.shadow_map_size, geometries.clone());
            }
        }

        // Generate shadow maps for spot lights that cast shadows
        for light in &mut self.spot_lights {
            if light.cast_shadow {
                light.generate_shadow_map(light.shadow_map_size, geometries.clone());
            }
        }
    }

    fn update_mesh_from_physics(&mut self, mesh_idx: usize, body: &rapier3d::dynamics::RigidBody) {
        // Get position and rotation from physics
        let iso = body.position();
        let translation = iso.translation;
        let rotation = iso.rotation;

        // Physics runs in the same coordinate system as the renderer, so we can use
        // the translation directly.
        let position = vec3(translation.x, translation.y, translation.z);

        // Convert nalgebra quaternion to glam quaternion, then to axis-angle
        let glam_quat = glam::Quat::from_xyzw(rotation.i, rotation.j, rotation.k, rotation.w);
        let (axis, angle) = glam_quat.to_axis_angle();
        let axis_3d = vec3(axis.x, axis.y, axis.z);
        let scale = self
            .mesh_scales
            .get(mesh_idx)
            .copied()
            .unwrap_or(GlamVec3::ONE);
        let scale_vec = vec3(scale.x, scale.y, scale.z);

        // Build transformation matrix
        let transform_mat = Mat4::from_translation(position)
            * Mat4::from_axis_angle(axis_3d, radians(angle))
            * Mat4::from_nonuniform_scale(scale_vec.x, scale_vec.y, scale_vec.z);

        // Update mesh transformation
        self.meshes[mesh_idx].set_transformation(transform_mat);
    }

    // ===== Logging Methods =====

    fn log_first_frame(&self) {
        static mut FIRST_FRAME: bool = true;
        unsafe {
            if FIRST_FRAME {
                log::info!("=== FIRST FRAME RENDER ===");
                log::info!("  Meshes: {}", self.meshes.len());
                log::info!("  Directional lights: {}", self.directional_lights.len());
                log::info!("  Point lights: {}", self.point_lights.len());
                log::info!("  Spot lights: {}", self.spot_lights.len());
                log::info!(
                    "  Ambient light: {}",
                    if self.ambient_light.is_some() {
                        "yes"
                    } else {
                        "no"
                    }
                );
                log::info!("  Camera position: {:?}", self.camera.position());
                log::info!("  Camera target: {:?}", self.camera.target());
                log::info!("=========================");
                FIRST_FRAME = false;
            }
        }
    }

    fn log_scene_load_start(&self, scene: &SceneData) {
        log::info!("═══════════════════════════════════════════════════════════");
        log::info!("RUST SCENE LOAD: {}", scene.name);
        log::info!("═══════════════════════════════════════════════════════════");

        log::info!("Scene Metadata:");
        log::info!("  Name: {}", scene.name);
        log::info!("  Version: {}", scene.version);
        if let Some(metadata) = &scene.metadata {
            if let Some(desc) = metadata.get("description") {
                if let Some(desc_str) = desc.as_str() {
                    log::info!("  Description: {}", desc_str);
                }
            }
        }
        log::info!("  Total Entities: {}", scene.entities.len());
    }

    fn log_scene_load_summary(&self) {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("SCENE LOAD SUMMARY");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("Meshes:             {}", self.meshes.len());
        log::info!("Directional Lights: {}", self.directional_lights.len());
        log::info!("Point Lights:       {}", self.point_lights.len());
        log::info!("Spot Lights:        {}", self.spot_lights.len());
        log::info!(
            "Ambient Light:      {}",
            if self.ambient_light.is_some() {
                "yes"
            } else {
                "no"
            }
        );
        log::info!("═══════════════════════════════════════════════════════════");
        log::info!("END RUST SCENE LOAD");
        log::info!("═══════════════════════════════════════════════════════════\n");
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

fn parse_tone_mapping(mode: Option<&str>) -> ToneMapping {
    match mode.unwrap_or("aces").to_ascii_lowercase().as_str() {
        "none" | "linear" => ToneMapping::None,
        "reinhard" => ToneMapping::Reinhard,
        "cineon" | "filmic" => ToneMapping::Filmic,
        "aces" => ToneMapping::Aces,
        other => {
            log::warn!("Unknown tone mapping mode '{}', defaulting to ACES", other);
            ToneMapping::Aces
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use three_d::vec3;
    use vibe_ecs_bridge::decoders::ViewportRect;

    fn base_camera_config() -> CameraConfig {
        CameraConfig {
            position: vec3(0.0, 0.0, 0.0),
            target: vec3(0.0, 0.0, -1.0),
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            is_main: false,
            projection_type: "perspective".to_string(),
            orthographic_size: 5.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: None,
            enable_smoothing: false,
            follow_target: None,
            follow_offset: None,
            smoothing_speed: 0.0,
            rotation_smoothing: 0.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        }
    }

}

#[cfg(test)]
mod follow_tests {
    use super::*;
    use crate::renderer::load_camera;
    use vibe_ecs_bridge::decoders::CameraComponent;

    fn config_with_control(control: Option<&str>) -> CameraConfig {
        let component = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 100.0,
            is_main: true,
            projection_type: "perspective".to_string(),
            orthographic_size: 10.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: control.map(|mode| mode.to_string()),
            enable_smoothing: false,
            follow_target: Some(42),
            follow_offset: None,
            smoothing_speed: 5.0,
            rotation_smoothing: 5.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        };

        load_camera(&component, None)
            .expect("load_camera should succeed")
            .expect("CameraConfig expected")
    }

    #[test]
    fn follow_enabled_when_locked() {
        let config = config_with_control(Some("locked"));
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), Some(42));
    }

    #[test]
    fn follow_disabled_when_free() {
        let config = config_with_control(Some("free"));
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), None);
    }

    #[test]
    fn follow_defaults_to_locked_when_unspecified() {
        let config = config_with_control(None);
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), Some(42));
    }
}

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
