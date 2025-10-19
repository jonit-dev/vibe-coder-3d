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

// Import renderer modules
use crate::renderer::{
    create_camera, load_camera, load_light, load_mesh_renderer, LoadedLight, MaterialManager,
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
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    mesh_entity_ids: Vec<EntityId>, // Parallel array: entity ID for each mesh
    mesh_scales: Vec<GlamVec3>,     // Parallel array: final local scale per mesh
    directional_lights: Vec<DirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<SpotLight>,
    ambient_light: Option<AmbientLight>,
    window_size: (u32, u32),

    // Resource management
    mesh_cache: HashMap<String, CpuMesh>,
    material_manager: MaterialManager,
    component_registry: ComponentRegistry,
}

impl ThreeDRenderer {
    /// Initialize the three-d renderer from a winit window
    pub fn new(window: Arc<WinitWindow>) -> Result<Self> {
        log::info!("Initializing three-d renderer...");

        // Create three-d WindowedContext from winit window
        let size = window.inner_size();
        let windowed_context =
            WindowedContext::from_winit_window(window.as_ref(), Default::default())
                .with_context(|| "Failed to create three-d context from window")?;

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

        Ok(Self {
            _windowed_context: windowed_context,
            context,
            camera,
            meshes: Vec::new(),
            mesh_entity_ids: Vec::new(),
            mesh_scales: Vec::new(),
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_light: None,
            window_size: (size.width, size.height),
            mesh_cache: HashMap::new(),
            material_manager: MaterialManager::new(),
            component_registry,
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

        // Add directional light
        let light = DirectionalLight::new(
            &self.context,
            1.5,                     // intensity
            Srgba::WHITE,            // color
            &vec3(-1.0, -1.0, -1.0), // direction
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

    /// Render a frame
    pub fn render(&mut self) -> Result<()> {
        self.log_first_frame();

        // Collect all lights
        let lights = self.collect_lights();

        // Render to default framebuffer (screen)
        RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1)
            .clear(ClearState::color_and_depth(0.2, 0.3, 0.4, 1.0, 1.0))
            .render(&self.camera, &self.meshes, &lights);

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
    pub fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        self.log_scene_load_start(scene);
        self.clear_scene();

        // Load materials
        self.load_materials(scene);

        // Process entities
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("ENTITIES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        for entity in &scene.entities {
            self.load_entity(entity)?;
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
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;
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

    fn load_entity(&mut self, entity: &Entity) -> Result<()> {
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
            self.handle_mesh_renderer(entity, &mesh_renderer, transform.as_ref())?;
        }

        // Check for Light
        if let Some(light) = self.get_component::<LightComponent>(entity, "Light") {
            self.handle_light(&light, transform.as_ref())?;
        }

        // Check for Camera
        if let Some(camera) = self.get_component::<CameraComponent>(entity, "Camera") {
            self.handle_camera(&camera, transform.as_ref())?;
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

    fn handle_mesh_renderer(
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
            &self.material_manager,
        )?;

        self.meshes.push(gm);

        // Store the entity ID for this mesh
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        self.mesh_entity_ids.push(entity_id);
        self.mesh_scales.push(final_scale);

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

    fn handle_camera(
        &mut self,
        camera_component: &CameraComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(config) = load_camera(camera_component, transform)? {
            self.camera = create_camera(&config, self.window_size);
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

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
