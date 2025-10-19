use anyhow::{Context as AnyhowContext, Result};
use std::collections::HashMap;
use std::sync::Arc;
use three_d::*;
use winit::window::Window as WinitWindow;

use crate::ecs::{ComponentRegistry, SceneData};
use vibe_ecs_bridge::decoders::{
    CameraComponent, Light as LightComponent, MeshRenderer, Transform,
};
use vibe_ecs_bridge::{position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt};
use vibe_scene::{Entity, EntityId};

/// Material data loaded from scene JSON
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MaterialData {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub metalness: Option<f32>,
    #[serde(default)]
    pub roughness: Option<f32>,
    #[serde(default)]
    pub emissive: Option<String>,
    #[serde(default, rename = "emissiveIntensity")]
    pub emissive_intensity: Option<f32>,
}

/// ThreeDRenderer - New rendering backend using three-d library for PBR rendering
pub struct ThreeDRenderer {
    _windowed_context: WindowedContext,
    context: Context,
    camera: Camera,
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    mesh_entity_ids: Vec<EntityId>, // Parallel array: entity ID for each mesh
    directional_lights: Vec<DirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<SpotLight>,
    ambient_light: Option<AmbientLight>,
    window_size: (u32, u32),

    // Resource caches
    mesh_cache: HashMap<String, CpuMesh>,
    material_cache: HashMap<String, MaterialData>,
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
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_light: None,
            window_size: (size.width, size.height),
            mesh_cache: HashMap::new(),
            material_cache: HashMap::new(),
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
        // Log first frame info
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

        // Collect all lights
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
        log::info!("═══════════════════════════════════════════════════════════");
        log::info!("RUST SCENE LOAD: {}", scene.metadata.name);
        log::info!("═══════════════════════════════════════════════════════════");

        // Clear existing scene
        self.meshes.clear();
        self.mesh_entity_ids.clear();
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;

        // Log scene metadata
        log::info!("Scene Metadata:");
        log::info!("  Name: {}", scene.metadata.name);
        log::info!("  Version: {}", scene.metadata.version);
        if let Some(desc) = &scene.metadata.description {
            log::info!("  Description: {}", desc);
        }
        log::info!("  Total Entities: {}", scene.entities.len());

        // Load materials into cache
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if let Some(materials_value) = &scene.materials {
            // Materials is stored as a JSON array
            if let Some(materials_array) = materials_value.as_array() {
                log::info!("Loading {} materials...", materials_array.len());
                for (idx, material_json) in materials_array.iter().enumerate() {
                    if let Ok(material) =
                        serde_json::from_value::<MaterialData>(material_json.clone())
                    {
                        if let Some(id) = &material.id {
                            log::info!("\nMaterial {}: {}", idx + 1, id);
                            log::info!("  Color:      {:?}", material.color);
                            log::info!("  Metalness:  {:?}", material.metalness);
                            log::info!("  Roughness:  {:?}", material.roughness);
                            log::info!("  Emissive:   {:?}", material.emissive);
                            log::info!("  Emissive Intensity: {:?}", material.emissive_intensity);
                            self.material_cache.insert(id.clone(), material);
                        }
                    }
                }
            }
        } else {
            log::warn!("No materials found in scene");
        }

        // Process entities
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("ENTITIES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        for entity in &scene.entities {
            self.load_entity(entity)?;
        }

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

        Ok(())
    }

    /// Load a single entity from the scene
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
            self.load_mesh_renderer(entity, &mesh_renderer, transform.as_ref())?;
        }

        // Check for Light
        if let Some(light) = self.get_component::<LightComponent>(entity, "Light") {
            self.load_light(entity, &light, transform.as_ref())?;
        }

        // Check for Camera
        if let Some(camera) = self.get_component::<CameraComponent>(entity, "Camera") {
            self.load_camera(entity, &camera, transform.as_ref())?;
        }

        Ok(())
    }

    /// Helper to get a typed component from an entity
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

    /// Load a mesh renderer component
    fn load_mesh_renderer(
        &mut self,
        entity: &Entity,
        mesh_renderer: &MeshRenderer,
        transform: Option<&Transform>,
    ) -> Result<()> {
        log::info!("  MeshRenderer:");
        log::info!("    Mesh ID:     {:?}", mesh_renderer.meshId);
        log::info!("    Material ID: {:?}", mesh_renderer.materialId);

        // For now, create primitive meshes based on meshId hints
        // In Phase 2.2 we'll add proper GLTF loading
        let cpu_mesh = if let Some(mesh_id) = &mesh_renderer.meshId {
            match mesh_id.to_lowercase().as_str() {
                id if id.contains("cube") || id.contains("box") => {
                    log::info!("    Creating:    Cube primitive");
                    CpuMesh::cube()
                }
                id if id.contains("sphere") => {
                    log::info!("    Creating:    Sphere primitive (16 segments)");
                    CpuMesh::sphere(16)
                }
                id if id.contains("plane") => {
                    log::info!("    Creating:    Plane primitive");
                    // Create a square plane (entity Transform will orient it)
                    CpuMesh::square()
                }
                _ => {
                    log::warn!("    Unknown mesh type: {}, using cube", mesh_id);
                    CpuMesh::cube()
                }
            }
        } else {
            log::info!("    Creating:    Default cube");
            CpuMesh::cube()
        };

        // Get or create material
        let material = if let Some(material_id) = &mesh_renderer.materialId {
            if let Some(material_data) = self.material_cache.get(material_id) {
                log::info!("    Using cached material: {}", material_id);
                self.create_material(material_data)
            } else {
                log::warn!("    Material not found: {}, using default", material_id);
                self.create_default_material()
            }
        } else {
            log::info!("    Using default material");
            self.create_default_material()
        };

        // Create mesh and combine with material
        let mut mesh = Mesh::new(&self.context, &cpu_mesh);

        // Apply transform if present
        if let Some(transform) = transform {
            let position = position_to_vec3_opt(transform.position.as_ref());
            let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
            let scale = scale_to_vec3_opt(transform.scale.as_ref());

            log::info!("  Transform:");
            log::info!("    RAW from JSON:");
            log::info!("      Position: {:?}", transform.position);
            log::info!("      Rotation: {:?} (THREE.JS DEGREES)", transform.rotation);
            log::info!("      Scale:    {:?}", transform.scale);
            log::info!("");
            log::info!("    CONVERTED (glam):");
            log::info!("      Position: [{:.4}, {:.4}, {:.4}]", position.x, position.y, position.z);
            log::info!("      Rotation: [{:.4}, {:.4}, {:.4}, {:.4}] (quat, RADIANS)",
                rotation.x, rotation.y, rotation.z, rotation.w);
            log::info!("      Scale:    [{:.4}, {:.4}, {:.4}]", scale.x, scale.y, scale.z);

            // Convert Three.js coordinates to three-d coordinates (flip Z)
            // CRITICAL DIFFERENCE: Three.js uses +Z forward, three-d uses -Z forward
            // This requires flipping the Z coordinate
            let pos = vec3(position.x, position.y, -position.z);
            let (axis, angle) = rotation.to_axis_angle();
            let axis_3d = vec3(axis.x, axis.y, axis.z);
            let scale_3d = vec3(scale.x, scale.y, scale.z);

            log::info!("");
            log::info!("    three-d COORDINATE SYSTEM CONVERSION:");
            log::info!("      ┌─────────────────────────────────────────────────────┐");
            log::info!("      │ CRITICAL: Z-axis flip for three-d compatibility     │");
            log::info!("      │ Three.js:  +Z is forward                            │");
            log::info!("      │ three-d:   -Z is forward                            │");
            log::info!("      └─────────────────────────────────────────────────────┘");
            log::info!("      Position (three-d): [{:.4}, {:.4}, {:.4}] ← Z FLIPPED from {:.4}",
                pos.x, pos.y, pos.z, position.z);
            log::info!("      Rotation axis: [{:.4}, {:.4}, {:.4}]", axis_3d.x, axis_3d.y, axis_3d.z);
            log::info!("      Rotation angle: {:.4} rad ({:.2}°)", angle, angle.to_degrees());
            log::info!("      Scale (three-d): [{:.4}, {:.4}, {:.4}]", scale_3d.x, scale_3d.y, scale_3d.z);

            // Build transformation matrix
            let transform_mat = Mat4::from_translation(pos)
                * Mat4::from_axis_angle(axis_3d, radians(angle))
                * Mat4::from_nonuniform_scale(scale_3d.x, scale_3d.y, scale_3d.z);

            mesh.set_transformation(transform_mat);
        }

        let gm = Gm::new(mesh, material);
        self.meshes.push(gm);

        // Store the entity ID for this mesh
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        self.mesh_entity_ids.push(entity_id);

        Ok(())
    }

    /// Load a light component
    fn load_light(
        &mut self,
        _entity: &Entity,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        log::info!("  Light:");
        log::info!("    Type:       {}", light.lightType);
        log::info!("    Intensity:  {}", light.intensity);

        let color = if let Some(light_color) = &light.color {
            let r = (light_color.r * 255.0) as u8;
            let g = (light_color.g * 255.0) as u8;
            let b = (light_color.b * 255.0) as u8;
            log::info!("    Color:      rgb({}, {}, {})", r, g, b);
            Srgba::new(r, g, b, 255)
        } else {
            log::info!("    Color:      white (default)");
            Srgba::WHITE
        };

        match light.lightType.to_lowercase().as_str() {
            "directionallight" | "directional" => {
                // Flip Z for three-d coordinate system
                let direction = vec3(light.directionX, light.directionY, -light.directionZ);
                log::info!(
                    "    Direction:  [{:.2}, {:.2}, {:.2}] (Z flipped)",
                    direction.x,
                    direction.y,
                    direction.z
                );
                log::info!(
                    "    Cast Shadow: {} (shadows not yet implemented)",
                    light.castShadow
                );

                let dir_light =
                    DirectionalLight::new(&self.context, light.intensity, color, &direction);

                // TODO: Enable shadows in Phase 2.4
                // if light.castShadow {
                //     dir_light.enable_shadows(...);
                // }

                self.directional_lights.push(dir_light);
            }
            "pointlight" | "point" => {
                // Extract position from transform (flip Z for three-d coordinate system)
                let position = if let Some(t) = transform {
                    let pos = position_to_vec3_opt(t.position.as_ref());
                    vec3(pos.x, pos.y, -pos.z) // Flip Z
                } else {
                    vec3(0.0, 0.0, 0.0)
                };

                log::info!(
                    "    Position:   [{:.2}, {:.2}, {:.2}] (Z flipped)",
                    position.x,
                    position.y,
                    position.z
                );

                let point_light = PointLight::new(
                    &self.context,
                    light.intensity,
                    color,
                    &position,
                    Attenuation::default(),
                );

                self.point_lights.push(point_light);
            }
            "spotlight" | "spot" => {
                // Extract position and direction from transform (flip Z for three-d coordinate system)
                let position = if let Some(t) = transform {
                    let pos = position_to_vec3_opt(t.position.as_ref());
                    vec3(pos.x, pos.y, -pos.z) // Flip Z
                } else {
                    vec3(0.0, 0.0, 0.0)
                };

                let direction = vec3(light.directionX, light.directionY, -light.directionZ); // Flip Z

                log::info!(
                    "    Position:   [{:.2}, {:.2}, {:.2}] (Z flipped)",
                    position.x,
                    position.y,
                    position.z
                );
                log::info!(
                    "    Direction:  [{:.2}, {:.2}, {:.2}] (Z flipped)",
                    direction.x,
                    direction.y,
                    direction.z
                );

                let spot_light = SpotLight::new(
                    &self.context,
                    light.intensity,
                    color,
                    &position,
                    &direction,
                    radians(0.5), // TODO: get from component
                    Attenuation::default(),
                );

                self.spot_lights.push(spot_light);
            }
            "ambientlight" | "ambient" => {
                log::info!("    Cast Shadow: {}", light.castShadow);
                self.ambient_light = Some(AmbientLight::new(&self.context, light.intensity, color));
            }
            _ => {
                log::warn!("    Unknown light type: {}", light.lightType);
            }
        }

        Ok(())
    }

    /// Load a camera component
    fn load_camera(
        &mut self,
        _entity: &Entity,
        camera_component: &CameraComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        log::info!("  Camera:");
        log::info!("    Is Main:    {}", camera_component.is_main);
        log::info!("    FOV:        {}° (DEGREES, no conversion needed)", camera_component.fov);
        log::info!("    Near Plane: {}", camera_component.near);
        log::info!("    Far Plane:  {}", camera_component.far);
        log::info!("    Projection: {:?}", camera_component.projection_type);

        // Only update camera if this is the main camera
        if !camera_component.is_main {
            log::info!("    Skipping non-main camera");
            return Ok(());
        }

        // Extract position and target from transform
        let (position, target) = if let Some(t) = transform {
            let pos = position_to_vec3_opt(t.position.as_ref());
            let rotation = rotation_to_quat_opt(t.rotation.as_ref());

            log::info!("  Transform (raw JSON):");
            log::info!("    Position:   {:?}", t.position);
            log::info!("    Rotation:   {:?}", t.rotation);
            log::info!("  Transform (parsed glam):");
            log::info!("    Position:   {:?}", pos);
            log::info!("    Rotation (quat): {:?}", rotation);

            // Calculate target position from rotation
            // Three.js: right-handed, Y-up, camera looks down +Z
            // three-d: right-handed, Y-up, camera looks down -Z
            //
            // Solution: Flip the Z axis for both position and target
            // Three.js camera at [0, 1, -10] looking at +Z becomes
            // three-d camera at [0, 1, 10] looking at -Z
            let forward_threejs = rotation * glam::Vec3::Z; // +Z forward
            let target_pos_threejs = pos + forward_threejs;

            // Flip Z coordinates to convert Three.js → three-d coordinate system
            let pos_threed = glam::Vec3::new(pos.x, pos.y, -pos.z);
            let target_threed = glam::Vec3::new(
                target_pos_threejs.x,
                target_pos_threejs.y,
                -target_pos_threejs.z,
            );

            log::info!("  Coordinate Conversion:");
            log::info!("    Three.js forward: {:?}", forward_threejs);
            log::info!("    Three.js target:  {:?}", target_pos_threejs);
            log::info!(
                "    three-d position: [{:.2}, {:.2}, {:.2}] (Z flipped)",
                pos_threed.x,
                pos_threed.y,
                pos_threed.z
            );
            log::info!(
                "    three-d target:   [{:.2}, {:.2}, {:.2}] (Z flipped)",
                target_threed.x,
                target_threed.y,
                target_threed.z
            );

            (
                vec3(pos_threed.x, pos_threed.y, pos_threed.z),
                vec3(target_threed.x, target_threed.y, target_threed.z),
            )
        } else {
            log::info!("    Using default position/target (no transform)");
            (vec3(0.0, 2.0, 5.0), vec3(0.0, 0.0, 0.0))
        };

        // Update camera with scene parameters
        self.camera = Camera::new_perspective(
            Viewport::new_at_origo(self.window_size.0, self.window_size.1),
            position,
            target,
            vec3(0.0, 1.0, 0.0),
            degrees(camera_component.fov),
            camera_component.near,
            camera_component.far,
        );

        log::info!("  Final Camera Configuration:");
        log::info!(
            "    Position: [{:.2}, {:.2}, {:.2}]",
            position.x,
            position.y,
            position.z
        );
        log::info!(
            "    Target:   [{:.2}, {:.2}, {:.2}]",
            target.x,
            target.y,
            target.z
        );
        log::info!("    Up:       [0.00, 1.00, 0.00]");
        log::info!(
            "    Viewport: {}x{}",
            self.window_size.0,
            self.window_size.1
        );

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
                    // Get position and rotation from physics
                    let iso = body.position();
                    let translation = iso.translation;
                    let rotation = iso.rotation;

                    // Apply Z-flip for coordinate conversion (Three.js ↔ three-d)
                    // Physics uses Three.js convention (+Z forward), three-d uses -Z forward
                    let position = vec3(translation.x, translation.y, -translation.z);

                    // Convert nalgebra quaternion to glam quaternion, then to axis-angle
                    let glam_quat =
                        glam::Quat::from_xyzw(rotation.i, rotation.j, rotation.k, rotation.w);
                    let (axis, angle) = glam_quat.to_axis_angle();
                    let axis_3d = vec3(axis.x, axis.y, axis.z);

                    // Build transformation matrix
                    let transform_mat = Mat4::from_translation(position)
                        * Mat4::from_axis_angle(axis_3d, radians(angle));

                    // Update mesh transformation
                    self.meshes[mesh_idx].set_transformation(transform_mat);
                }
            }
        }
    }

    /// Create a three-d PhysicalMaterial from MaterialData
    fn create_material(&self, material: &MaterialData) -> PhysicalMaterial {
        // Parse hex color or use default
        let albedo_color = material
            .color
            .as_ref()
            .and_then(|hex| parse_hex_color(hex))
            .unwrap_or(Srgba::WHITE);

        let cpu_material = CpuMaterial {
            albedo: albedo_color,
            metallic: material.metalness.unwrap_or(0.0),
            roughness: material.roughness.unwrap_or(0.7),
            // TODO: Add texture support in Phase 2.2
            ..Default::default()
        };

        PhysicalMaterial::new(&self.context, &cpu_material)
    }

    /// Create a default material
    fn create_default_material(&self) -> PhysicalMaterial {
        let cpu_material = CpuMaterial {
            albedo: Srgba::new(200, 200, 200, 255),
            metallic: 0.0,
            roughness: 0.7,
            ..Default::default()
        };

        PhysicalMaterial::new(&self.context, &cpu_material)
    }
}

/// Parse hex color string (#RRGGBB or #RGB) to Srgba
fn parse_hex_color(hex: &str) -> Option<Srgba> {
    let hex = hex.trim_start_matches('#');

    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
        let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
        let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
        Some(Srgba::new(r, g, b, 255))
    } else if hex.len() == 3 {
        let r = u8::from_str_radix(&hex[0..1], 16).ok()? * 17;
        let g = u8::from_str_radix(&hex[1..2], 16).ok()? * 17;
        let b = u8::from_str_radix(&hex[2..3], 16).ok()? * 17;
        Some(Srgba::new(r, g, b, 255))
    } else {
        None
    }
}

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
