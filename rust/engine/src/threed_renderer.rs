use anyhow::{Context as AnyhowContext, Result};
use glam::Vec3 as GlamVec3;
use std::collections::HashMap;
use std::sync::Arc;
use three_d::*;
use winit::window::Window as WinitWindow;

use vibe_ecs_bridge::decoders::{
    CameraComponent, Light as LightComponent, MeshRenderer, Transform,
};
use vibe_ecs_bridge::ComponentRegistry;
use vibe_scene::Scene as SceneData;
use vibe_scene::{Entity, EntityId};
use vibe_scene_graph::SceneGraph;

// Import renderer modules
use crate::renderer::{
    apply_post_processing, create_camera, load_camera, load_light, load_mesh_renderer,
    CameraConfig, ColorGradingEffect, EnhancedDirectionalLight, EnhancedSpotLight, LoadedLight,
    MaterialManager, PostProcessSettings, SkyboxRenderer,
};

/// ThreeDRenderer - Rendering backend using three-d library for PBR rendering
///
/// This renderer is focused on core rendering responsibilities:
/// - Managing the rendering context and window
/// - Coordinating the render loop
/// - Managing scene objects (meshes, lights, camera)
/// - Synchronizing with physics
pub struct ThreeDRenderer {
    _windowed_context: WindowedContext,
    context: Context,
    camera: Camera,
    camera_config: Option<CameraConfig>,
    scene_graph: Option<SceneGraph>,
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    mesh_entity_ids: Vec<EntityId>, // Parallel array: entity ID for each mesh
    mesh_scales: Vec<GlamVec3>,     // Parallel array: final local scale per mesh
    mesh_cast_shadows: Vec<bool>,   // Parallel array: castShadows flag for each mesh
    mesh_receive_shadows: Vec<bool>, // Parallel array: receiveShadows flag for each mesh
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
    hdr_color_texture: Option<Texture2D>,
    hdr_depth_texture: Option<three_d::DepthTexture2D>,

    // Camera follow smoothing
    last_camera_position: Vec3,
    last_camera_target: Vec3,
}

struct RenderSettings {
    clear_state: Option<ClearState>,
    render_skybox: bool,
    post_settings: Option<PostProcessSettings>,
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

        Ok(Self {
            _windowed_context: windowed_context,
            context,
            camera,
            camera_config: None,
            scene_graph: None,
            meshes: Vec::new(),
            mesh_entity_ids: Vec::new(),
            mesh_scales: Vec::new(),
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
            hdr_color_texture: None,
            hdr_depth_texture: None,
            last_camera_position: initial_pos,
            last_camera_target: initial_target,
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
        // Clone config to avoid borrow checker issues
        let config = if let Some(ref cfg) = self.camera_config {
            cfg.clone()
        } else {
            return; // No camera config
        };

        // Check if camera follow is enabled
        if let Some(follow_target_id) = config.follow_target {
            self.update_camera_follow(&config, follow_target_id, delta_time);
        }
    }

    /// Update camera to follow a target entity
    fn update_camera_follow(&mut self, config: &CameraConfig, target_id: u32, delta_time: f32) {
        // Get target entity's world transform from scene graph
        let target_transform = if let Some(ref mut graph) = self.scene_graph {
            let entity_id = EntityId::new(target_id as u64);
            graph.get_world_transform(entity_id)
        } else {
            return; // No scene graph, can't follow
        };

        let target_matrix = if let Some(mat) = target_transform {
            mat
        } else {
            log::warn!(
                "Camera follow target entity {} not found in scene",
                target_id
            );
            return;
        };

        // Extract position from target's world matrix
        let target_pos = target_matrix.w_axis.truncate();
        let target_vec3 = vec3(target_pos.x, target_pos.y, target_pos.z);

        // Apply follow offset
        let offset = config.follow_offset.unwrap_or(vec3(0.0, 2.0, -5.0));
        let desired_position = target_vec3 + offset;

        // Apply smoothing if enabled
        let new_position = if config.enable_smoothing {
            let smoothing_factor = (config.smoothing_speed * delta_time).min(1.0);
            self.last_camera_position * (1.0 - smoothing_factor)
                + desired_position * smoothing_factor
        } else {
            desired_position
        };

        // Update camera look target (smoothed towards entity position)
        let desired_target = target_vec3;
        let new_target = if config.enable_smoothing {
            let rotation_factor = (config.rotation_smoothing * delta_time).min(1.0);
            self.last_camera_target * (1.0 - rotation_factor) + desired_target * rotation_factor
        } else {
            desired_target
        };

        // Update camera view
        self.camera
            .set_view(new_position, new_target, vec3(0.0, 1.0, 0.0));

        // Store for next frame smoothing
        self.last_camera_position = new_position;
        self.last_camera_target = new_target;
    }

    fn prepare_render_settings(&self) -> RenderSettings {
        let default_clear = ClearState::color_and_depth(0.2, 0.3, 0.4, 1.0, 1.0);

        if let Some(ref config) = self.camera_config {
            let background = config.background_color.unwrap_or((0.2, 0.3, 0.4, 1.0));
            let solid_clear = ClearState::color_and_depth(
                background.0,
                background.1,
                background.2,
                background.3,
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
                    if self.skybox_renderer.is_loaded() {
                        render_skybox = true;
                        Some(ClearState::depth(1.0))
                    } else {
                        log::warn!(
                            "Camera clearFlags set to 'skybox' but no skybox texture loaded; falling back to solid color."
                        );
                        Some(solid_clear)
                    }
                }
                "depthonly" => Some(ClearState::depth(1.0)),
                "dontclear" => None,
                "solidcolor" => Some(solid_clear),
                other => {
                    log::warn!(
                        "Unknown clear flag '{}', defaulting to solid color clear.",
                        other
                    );
                    Some(solid_clear)
                }
            };

            let post_settings = PostProcessSettings::from_camera(config);

            RenderSettings {
                clear_state,
                render_skybox,
                post_settings,
            }
        } else {
            RenderSettings {
                clear_state: Some(default_clear),
                render_skybox: false,
                post_settings: None,
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

    /// Render a frame
    pub fn render(&mut self, delta_time: f32) -> Result<()> {
        self.log_first_frame();

        // Update camera (follow system, etc.)
        self.update_camera_internal(delta_time);

        // Generate shadow maps for lights that cast shadows
        self.generate_shadow_maps();

        let settings = self.prepare_render_settings();
        let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;

        if let Some(ref post_settings) = settings.post_settings {
            if post_settings.apply_tone_mapping {
                tone_restore = Some((self.camera.tone_mapping, self.camera.color_mapping));
                self.camera.disable_tone_and_color_mapping();
            }
        }

        if let Some(post_settings) = settings.post_settings.clone() {
            self.ensure_post_process_targets();

            // Create raw pointer for split borrowing before any other borrows
            let self_ptr = self as *const Self;

            // Render to HDR target in a scope so it drops before we access hdr_color_texture again
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
                    render_target.clear(clear_state);
                }

                if settings.render_skybox {
                    self.skybox_renderer.render(&render_target, &self.camera);
                }

                // Use raw pointer to split borrows safely
                // Safety: We're borrowing different fields - lights (immutable) vs hdr textures (mutable via render_target)
                // These fields don't overlap, so this is safe
                let lights;
                unsafe {
                    lights = (*self_ptr).collect_lights();
                }
                render_target.render(&self.camera, &self.meshes, &lights);
            } // render_target dropped here

            let color_texture =
                three_d::ColorTexture::Single(self.hdr_color_texture.as_ref().unwrap());
            let effect = ColorGradingEffect::from(post_settings);
            let screen =
                RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);
            apply_post_processing(&screen, effect, &self.camera, color_texture);
        } else {
            let screen =
                RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);

            if let Some(clear_state) = settings.clear_state {
                screen.clear(clear_state);
            }

            if settings.render_skybox {
                self.skybox_renderer.render(&screen, &self.camera);
            }

            // Collect lights just before rendering to avoid borrow checker issues
            let lights = self.collect_lights();
            screen.render(&self.camera, &self.meshes, &lights);
        }

        if let Some((tone, color)) = tone_restore {
            self.camera.tone_mapping = tone;
            self.camera.color_mapping = color;
        }

        // Swap buffers to display the rendered frame
        self._windowed_context
            .swap_buffers()
            .with_context(|| "Failed to swap buffers")?;

        Ok(())
    }

    /// Capture a screenshot using the xcap crate (OS-level window capture)
    pub fn capture_window_screenshot(
        &self,
        window_title: &str,
        path: &std::path::Path,
    ) -> Result<()> {
        log::info!("Capturing window screenshot to: {}", path.display());

        // Get all windows
        let windows = xcap::Window::all().with_context(|| "Failed to enumerate windows")?;

        // Find our window by title
        let target_window = windows
            .iter()
            .find(|w| {
                w.title()
                    .to_lowercase()
                    .contains(&window_title.to_lowercase())
            })
            .with_context(|| format!("Window with title '{}' not found", window_title))?;

        log::debug!("Found window: {}", target_window.title());

        // Capture the window
        let image = target_window
            .capture_image()
            .with_context(|| "Failed to capture window image")?;

        // Save the image
        image
            .save(path)
            .with_context(|| format!("Failed to save screenshot to {}", path.display()))?;

        log::info!("Screenshot saved successfully");
        Ok(())
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        log::info!("Resizing renderer to {}x{}", width, height);
        self.window_size = (width, height);
        self.hdr_color_texture = None;
        self.hdr_depth_texture = None;

        // Update camera viewport
        self.camera
            .set_viewport(Viewport::new_at_origo(width, height));
    }

    /// Update camera position and target
    pub fn update_camera(&mut self, position: glam::Vec3, target: glam::Vec3) {
        let pos = vec3(position.x, position.y, position.z);
        let tgt = vec3(target.x, target.y, target.z);
        self.camera.set_view(pos, tgt, vec3(0.0, 1.0, 0.0));
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

        // Process entities
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("ENTITIES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        for entity in &scene.entities {
            self.load_entity(entity).await?;
        }

        self.log_scene_load_summary();

        Ok(())
    }

    /// Sync physics transforms back to renderer meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        // Iterate through all entities with physics bodies
        for (entity_id, body_handle) in physics_world.entity_to_body.iter() {
            // Get the rigid body
            if let Some(body) = physics_world.rigid_bodies.get(*body_handle) {
                // Find mesh index for this entity
                if let Some(mesh_idx) = self.mesh_entity_ids.iter().position(|&id| id == *entity_id)
                {
                    self.update_mesh_from_physics(mesh_idx, body);
                }
            }
        }
    }

    // ===== Private Helper Methods =====

    fn clear_scene(&mut self) {
        self.meshes.clear();
        self.mesh_entity_ids.clear();
        self.mesh_scales.clear();
        self.mesh_cast_shadows.clear();
        self.mesh_receive_shadows.clear();
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;
        self.skybox_renderer.clear();
    }

    fn load_materials(&mut self, scene: &SceneData) {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if let Some(materials_value) = &scene.materials {
            self.material_manager.load_from_scene(materials_value);
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

        // Check for MeshRenderer
        if let Some(mesh_renderer) = self.get_component::<MeshRenderer>(entity, "MeshRenderer") {
            self.handle_mesh_renderer(entity, &mesh_renderer, transform.as_ref())
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
    ) -> Result<()> {
        let (gm, final_scale) = load_mesh_renderer(
            &self.context,
            entity,
            mesh_renderer,
            transform,
            &mut self.material_manager,
        )
        .await?;

        self.meshes.push(gm);

        // Store the entity ID for this mesh
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        self.mesh_entity_ids.push(entity_id);
        self.mesh_scales.push(final_scale);

        // Store shadow flags
        self.mesh_cast_shadows.push(mesh_renderer.castShadows);
        self.mesh_receive_shadows.push(mesh_renderer.receiveShadows);

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
            self.camera = create_camera(&config, self.window_size);

            // Apply tone mapping configuration from the camera component
            self.camera.tone_mapping = parse_tone_mapping(config.tone_mapping.as_deref());
            self.camera.color_mapping = ColorMapping::ComputeToSrgb;

            // Load skybox texture if available
            if config.skybox_texture.is_some() {
                if let Err(err) = self
                    .skybox_renderer
                    .load_from_config(&self.context, &config)
                    .await
                {
                    log::warn!("Failed to load skybox texture: {}", err);
                    self.skybox_renderer.clear();
                }
            } else {
                self.skybox_renderer.clear();
            }

            // Store camera config for follow system and other features
            self.camera_config = Some(config);
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
        // Extract mesh geometries for shadow casting, filtering by castShadows flag
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

        log::debug!("Generating shadow maps for {} shadow-casting meshes", geometries.len());

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

        // Apply Z-flip for coordinate conversion (Three.js ↔ three-d)
        // Physics uses Three.js convention (+Z forward), three-d uses -Z forward
        let position = vec3(translation.x, translation.y, -translation.z);

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
        log::info!("RUST SCENE LOAD: {}", scene.metadata.name);
        log::info!("═══════════════════════════════════════════════════════════");

        log::info!("Scene Metadata:");
        log::info!("  Name: {}", scene.metadata.name);
        log::info!("  Version: {}", scene.metadata.version);
        if let Some(desc) = &scene.metadata.description {
            log::info!("  Description: {}", desc);
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
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
