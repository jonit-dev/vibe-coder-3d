use anyhow::{Context as AnyhowContext, Result};
use std::collections::HashMap;
use std::sync::Arc;
use three_d::*;
use winit::window::Window as WinitWindow;

use crate::ecs::{ComponentRegistry, SceneData};
use vibe_ecs_bridge::decoders::{CameraComponent, Light as LightComponent, MeshRenderer, Transform};
use vibe_ecs_bridge::{position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt};
use vibe_scene::Entity;

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
        let windowed_context = WindowedContext::from_winit_window(window.as_ref(), Default::default())
            .with_context(|| "Failed to create three-d context from window")?;

        // WindowedContext implements Deref<Target = Context>, so we can clone the context
        let context: Context = windowed_context.clone();

        // Create perspective camera
        let viewport = Viewport::new_at_origo(size.width, size.height);
        let camera = Camera::new_perspective(
            viewport,
            vec3(0.0, 2.0, 5.0),  // position
            vec3(0.0, 0.0, 0.0),  // target
            vec3(0.0, 1.0, 0.0),  // up
            degrees(60.0),        // fov
            0.1,                  // near
            1000.0,               // far
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
            1.5,                        // intensity
            Srgba::WHITE,               // color
            &vec3(-1.0, -1.0, -1.0),   // direction
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
                log::info!("First frame render: {} meshes, camera at pos", self.meshes.len());
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
        self._windowed_context.swap_buffers()
            .with_context(|| "Failed to swap buffers")?;

        Ok(())
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        log::info!("Resizing renderer to {}x{}", width, height);
        self.window_size = (width, height);

        // Update camera viewport
        self.camera.set_viewport(Viewport::new_at_origo(width, height));
    }

    /// Update camera position and target
    pub fn update_camera(&mut self, position: glam::Vec3, target: glam::Vec3) {
        let pos = vec3(position.x, position.y, position.z);
        let tgt = vec3(target.x, target.y, target.z);
        self.camera.set_view(pos, tgt, vec3(0.0, 1.0, 0.0));
    }

    /// Load a full scene from SceneData
    pub fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        log::info!("Loading scene: {}", scene.metadata.name);

        // Clear existing scene
        self.meshes.clear();
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;

        // Load materials into cache
        if let Some(materials_value) = &scene.materials {
            // Materials is stored as a JSON array
            if let Some(materials_array) = materials_value.as_array() {
                for material_json in materials_array {
                    if let Ok(material) =
                        serde_json::from_value::<MaterialData>(material_json.clone())
                    {
                        if let Some(id) = &material.id {
                            log::debug!("Caching material: {}", id);
                            self.material_cache.insert(id.clone(), material);
                        }
                    }
                }
            }
        }

        // Process entities
        for entity in &scene.entities {
            self.load_entity(entity)?;
        }

        log::info!(
            "Scene loaded: {} meshes, {} directional lights, {} point lights, {} spot lights",
            self.meshes.len(),
            self.directional_lights.len(),
            self.point_lights.len(),
            self.spot_lights.len()
        );

        Ok(())
    }

    /// Load a single entity from the scene
    fn load_entity(&mut self, entity: &Entity) -> Result<()> {
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
        _entity: &Entity,
        mesh_renderer: &MeshRenderer,
        transform: Option<&Transform>,
    ) -> Result<()> {
        // For now, create primitive meshes based on meshId hints
        // In Phase 2.2 we'll add proper GLTF loading
        let cpu_mesh = if let Some(mesh_id) = &mesh_renderer.meshId {
            match mesh_id.to_lowercase().as_str() {
                id if id.contains("cube") || id.contains("box") => CpuMesh::cube(),
                id if id.contains("sphere") => CpuMesh::sphere(16),
                id if id.contains("plane") => {
                    // Create a horizontal plane
                    let mut plane = CpuMesh::square();
                    // Rotate to be horizontal (XZ plane)
                    plane.transform(&Mat4::from_angle_x(degrees(-90.0))).ok();
                    plane
                }
                _ => {
                    log::warn!("Unknown mesh type: {}, using cube", mesh_id);
                    CpuMesh::cube()
                }
            }
        } else {
            CpuMesh::cube()
        };

        // Get or create material
        let material = if let Some(material_id) = &mesh_renderer.materialId {
            if let Some(material_data) = self.material_cache.get(material_id) {
                self.create_material(material_data)
            } else {
                log::warn!("Material not found: {}, using default", material_id);
                self.create_default_material()
            }
        } else {
            self.create_default_material()
        };

        // Create mesh and combine with material
        let mut mesh = Mesh::new(&self.context, &cpu_mesh);

        // Apply transform if present
        if let Some(transform) = transform {
            let position = position_to_vec3_opt(transform.position.as_ref());
            let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
            let scale = scale_to_vec3_opt(transform.scale.as_ref());

            // Convert glam types to three_d types
            let pos = vec3(position.x, position.y, position.z);
            let (axis, angle) = rotation.to_axis_angle();
            let axis_3d = vec3(axis.x, axis.y, axis.z);
            let scale_3d = vec3(scale.x, scale.y, scale.z);

            // Build transformation matrix
            let transform_mat = Mat4::from_translation(pos)
                * Mat4::from_axis_angle(axis_3d, radians(angle))
                * Mat4::from_nonuniform_scale(scale_3d.x, scale_3d.y, scale_3d.z);

            mesh.set_transformation(transform_mat);
        }

        let gm = Gm::new(mesh, material);
        self.meshes.push(gm);

        log::debug!("Loaded mesh with transform: pos=({}, {}, {})",
            transform.map(|t| position_to_vec3_opt(t.position.as_ref())).unwrap_or(glam::Vec3::ZERO).x,
            transform.map(|t| position_to_vec3_opt(t.position.as_ref())).unwrap_or(glam::Vec3::ZERO).y,
            transform.map(|t| position_to_vec3_opt(t.position.as_ref())).unwrap_or(glam::Vec3::ZERO).z
        );

        Ok(())
    }

    /// Load a light component
    fn load_light(
        &mut self,
        _entity: &Entity,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let color = if let Some(light_color) = &light.color {
            Srgba::new(
                (light_color.r * 255.0) as u8,
                (light_color.g * 255.0) as u8,
                (light_color.b * 255.0) as u8,
                255,
            )
        } else {
            Srgba::WHITE
        };

        match light.lightType.to_lowercase().as_str() {
            "directionallight" | "directional" => {
                let direction = vec3(light.directionX, light.directionY, light.directionZ);
                let dir_light =
                    DirectionalLight::new(&self.context, light.intensity, color, &direction);

                // TODO: Enable shadows in Phase 2.4
                // if light.castShadow {
                //     dir_light.enable_shadows(...);
                // }

                self.directional_lights.push(dir_light);
            }
            "pointlight" | "point" => {
                // Extract position from transform
                let position = if let Some(t) = transform {
                    let pos = position_to_vec3_opt(t.position.as_ref());
                    vec3(pos.x, pos.y, pos.z)
                } else {
                    vec3(0.0, 0.0, 0.0)
                };

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
                // Extract position and direction from transform
                let position = if let Some(t) = transform {
                    let pos = position_to_vec3_opt(t.position.as_ref());
                    vec3(pos.x, pos.y, pos.z)
                } else {
                    vec3(0.0, 0.0, 0.0)
                };

                let direction = vec3(light.directionX, light.directionY, light.directionZ);

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
                self.ambient_light =
                    Some(AmbientLight::new(&self.context, light.intensity, color));
            }
            _ => {
                log::warn!("Unknown light type: {}", light.lightType);
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
        // Only update camera if this is the main camera
        if !camera_component.is_main {
            return Ok(());
        }

        // Extract position and target from transform
        let (position, target) = if let Some(t) = transform {
            let pos = position_to_vec3_opt(t.position.as_ref());
            let rotation = rotation_to_quat_opt(t.rotation.as_ref());

            // Calculate forward direction from rotation
            // Three.js camera default forward is -Z (camera looks down negative Z axis)
            let forward = rotation * glam::Vec3::new(0.0, 0.0, -1.0);
            let target_pos = pos + forward;

            (
                vec3(pos.x, pos.y, pos.z),
                vec3(target_pos.x, target_pos.y, target_pos.z),
            )
        } else {
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

        log::info!("Loaded main camera: FOV {}, near {}, far {}, pos=({}, {}, {}), target=({}, {}, {})",
            camera_component.fov, camera_component.near, camera_component.far,
            position.x, position.y, position.z,
            target.x, target.y, target.z);

        Ok(())
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
