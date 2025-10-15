use super::{
    pipeline::{InstanceRaw, LightUniform, RenderPipeline},
    Camera,
};
use vibe_assets::{MaterialCache, MeshCache, TextureCache};
use crate::ecs::{components::transform::Transform, SceneData};
use glam::{Mat4, Vec3};
use vibe_scene_graph::SceneGraph;
use wgpu::util::DeviceExt;

pub struct RenderableEntity {
    pub transform: Mat4,
    pub mesh_id: String,
    pub material_id: Option<String>,
    pub texture_override: Option<String>, // Override texture for GLTF models
}

pub struct SceneRenderer {
    pub mesh_cache: MeshCache,
    pub material_cache: MaterialCache,
    pub texture_cache: TextureCache,
    pub pipeline: RenderPipeline,
    pub entities: Vec<RenderableEntity>,
    pub instance_buffer: Option<wgpu::Buffer>,
    pub light_uniform: LightUniform,
    pub depth_texture: super::depth_texture::DepthTexture,
}

impl SceneRenderer {
    pub fn new(device: &wgpu::Device, config: &wgpu::SurfaceConfiguration, queue: &wgpu::Queue) -> Self {
        let mut mesh_cache = MeshCache::new();
        mesh_cache.initialize_primitives(device);

        let material_cache = MaterialCache::new();

        let mut texture_cache = TextureCache::new();
        texture_cache.initialize_default(device, queue);

        let pipeline = RenderPipeline::new(device, config);
        let depth_texture = super::depth_texture::DepthTexture::create(device, config);

        Self {
            mesh_cache,
            material_cache,
            texture_cache,
            pipeline,
            entities: Vec::new(),
            instance_buffer: None,
            light_uniform: LightUniform::new(),
            depth_texture,
        }
    }

    pub fn load_scene(&mut self, device: &wgpu::Device, queue: &wgpu::Queue, scene: &SceneData) {
        log::info!("Loading scene entities for rendering...");
        log::debug!("Scene has {} total entities", scene.entities.len());
        self.entities.clear();

        // Load materials from scene
        self.material_cache
            .load_from_scene(scene.materials.as_ref());

        // Build scene graph for transform hierarchy
        let mut scene_graph = match SceneGraph::build(scene) {
            Ok(graph) => {
                log::info!("Built scene graph with {} entities", graph.entity_ids().len());
                graph
            }
            Err(e) => {
                log::error!("Failed to build scene graph: {}", e);
                log::warn!("Falling back to flat hierarchy (no parent transforms)");
                // Continue with empty graph - will process entities manually below
                return;
            }
        };

        // Reset lights to defaults
        self.light_uniform = LightUniform::new();

        // Extract lights from scene
        let mut directional_light_set = false;
        let mut ambient_light_set = false;
        let mut point_light_count = 0;

        for (idx, entity) in scene.entities.iter().enumerate() {
            let unnamed = "Unnamed".to_string();
            let entity_name = entity.name.as_ref().unwrap_or(&unnamed);
            log::debug!("Processing entity #{}: '{}'", idx, entity_name);
            log::debug!(
                "  Components: {:?}",
                entity.components.keys().collect::<Vec<_>>()
            );

            // Check for Light component
            if entity.has_component("Light") {
                if let Some(light) =
                    entity.get_component::<crate::ecs::components::light::Light>("Light")
                {
                    log::debug!("  Light component found:");
                    log::debug!("    Type: {}", light.lightType);
                    log::debug!("    Enabled: {}", light.enabled);
                    log::debug!("    Intensity: {}", light.intensity);
                    if let Some(ref color) = light.color {
                        log::debug!("    Color: RGB({}, {}, {})", color.r, color.g, color.b);
                    }
                    log::debug!("    Cast Shadow: {}", light.castShadow);

                    // Only process enabled lights
                    if !light.enabled {
                        log::debug!("    Skipping (disabled)");
                        continue;
                    }

                    let light_color = light
                        .color
                        .as_ref()
                        .map(|c| [c.r, c.g, c.b])
                        .unwrap_or([1.0, 1.0, 1.0]);

                    match light.lightType.as_str() {
                        "directional" => {
                            if !directional_light_set {
                                log::info!(
                                    "  ✓ Using directional light: intensity={}, color={:?}",
                                    light.intensity,
                                    light_color
                                );
                                self.light_uniform.directional_direction =
                                    [light.directionX, light.directionY, light.directionZ];
                                self.light_uniform.directional_intensity = light.intensity;
                                self.light_uniform.directional_color = light_color;
                                self.light_uniform.directional_enabled = 1.0;
                                directional_light_set = true;
                            } else {
                                log::debug!("    Skipping (directional light already set)");
                            }
                        }
                        "ambient" => {
                            if !ambient_light_set {
                                log::info!(
                                    "  ✓ Using ambient light: intensity={}, color={:?}",
                                    light.intensity,
                                    light_color
                                );
                                self.light_uniform.ambient_color = light_color;
                                self.light_uniform.ambient_intensity = light.intensity;
                                ambient_light_set = true;
                            } else {
                                log::debug!("    Skipping (ambient light already set)");
                            }
                        }
                        "point" => {
                            if point_light_count < 2 {
                                log::info!(
                                    "  ✓ Using point light #{}: intensity={}, range={}, color={:?}",
                                    point_light_count,
                                    light.intensity,
                                    light.range,
                                    light_color
                                );

                                // Get transform for point light position
                                let transform = entity
                                    .get_component::<Transform>("Transform")
                                    .unwrap_or_default();
                                let position = transform.position_vec3();

                                if point_light_count == 0 {
                                    self.light_uniform.point_position_0 =
                                        [position.x, position.y, position.z];
                                    self.light_uniform.point_intensity_0 = light.intensity;
                                    self.light_uniform.point_color_0 = light_color;
                                    self.light_uniform.point_range_0 = light.range;
                                } else {
                                    self.light_uniform.point_position_1 =
                                        [position.x, position.y, position.z];
                                    self.light_uniform.point_intensity_1 = light.intensity;
                                    self.light_uniform.point_color_1 = light_color;
                                    self.light_uniform.point_range_1 = light.range;
                                }
                                point_light_count += 1;
                            } else {
                                log::debug!("    Skipping (max 2 point lights already set)");
                            }
                        }
                        "spot" => {
                            log::info!(
                                "  ✓ Using spot light: intensity={}, angle={}, penumbra={}, range={}, color={:?}",
                                light.intensity,
                                light.angle,
                                light.penumbra,
                                light.range,
                                light_color
                            );

                            // Get transform for spot light position
                            let transform = entity
                                .get_component::<Transform>("Transform")
                                .unwrap_or_default();
                            let position = transform.position_vec3();

                            self.light_uniform.spot_position = [position.x, position.y, position.z];
                            self.light_uniform.spot_intensity = light.intensity;
                            self.light_uniform.spot_direction = [light.directionX, light.directionY, light.directionZ];
                            self.light_uniform.spot_angle = light.angle;
                            self.light_uniform.spot_color = light_color;
                            self.light_uniform.spot_penumbra = light.penumbra;
                            self.light_uniform.spot_range = light.range;
                            self.light_uniform.spot_decay = light.decay;
                        }
                        _ => {
                            log::warn!("    Unknown light type: {}", light.lightType);
                        }
                    }
                }
            }

        }

        // Extract renderable entities using scene graph (includes world transforms from hierarchy)
        log::info!("Extracting renderable entities from scene graph...");
        let renderable_instances = scene_graph.extract_renderables(scene);
        log::info!("Found {} renderable instances", renderable_instances.len());

        for instance in renderable_instances {
            // Check if this entity has a modelPath for GLTF loading
            if let Some(ref model_path) = instance.model_path {
                if !model_path.is_empty() {
                    log::info!("Loading GLTF model from: {}", model_path);

                    // Try to load GLTF model
                    #[cfg(feature = "gltf-support")]
                    {
                        use vibe_assets::load_gltf_full;

                        match load_gltf_full(model_path) {
                            Ok(gltf_data) => {
                                log::info!("Loaded {} mesh(es) and {} texture(s) from GLTF model",
                                    gltf_data.meshes.len(), gltf_data.images.len());

                                // Load textures into texture cache
                                for (idx, gltf_image) in gltf_data.images.iter().enumerate() {
                                    let texture_id = gltf_image.name.as_ref()
                                        .map(|n| n.clone())
                                        .unwrap_or_else(|| format!("{}_texture_{}", model_path, idx));

                                    if let Err(e) = self.texture_cache.load_from_rgba_pixels(
                                        device,
                                        queue,
                                        &gltf_image.data,
                                        gltf_image.width,
                                        gltf_image.height,
                                        &texture_id
                                    ) {
                                        log::error!("Failed to load texture '{}': {}", texture_id, e);
                                    }
                                }

                                // Upload all meshes from the GLTF file
                                for (idx, vibe_mesh) in gltf_data.meshes.into_iter().enumerate() {
                                    let mesh_name = format!("{}_{}", model_path, idx);

                                    // Upload mesh directly (vibe_assets::Mesh)
                                    self.mesh_cache.upload_mesh(device, &mesh_name, vibe_mesh);

                                    // Use the first texture from GLTF if available
                                    let texture_override = if !gltf_data.images.is_empty() {
                                        Some("texture_0".to_string())
                                    } else {
                                        None
                                    };

                                    // Create a renderable entity for each mesh in the GLTF
                                    self.entities.push(RenderableEntity {
                                        transform: instance.world_transform,
                                        mesh_id: mesh_name,
                                        material_id: instance.material_id.clone(),
                                        texture_override,
                                    });
                                }
                                continue; // Skip the default primitive logic below
                            }
                            Err(e) => {
                                log::error!("Failed to load GLTF model '{}': {:?}", model_path, e);
                                log::warn!("Falling back to primitive mesh");
                            }
                        }
                    }

                    #[cfg(not(feature = "gltf-support"))]
                    {
                        log::warn!("GLTF support not enabled, ignoring modelPath: {}", model_path);
                        log::warn!("Compile with --features gltf-support to enable GLTF loading");
                    }
                }
            }

            // Use primitive mesh (default or fallback)
            let mesh_id = instance
                .mesh_id
                .clone()
                .unwrap_or_else(|| "cube".to_string());

            let material_id = instance.material_id.clone();

            log::debug!(
                "  ✓ Renderable: mesh='{}', material={:?}, world_transform={:?}",
                &mesh_id,
                &material_id,
                instance.world_transform
            );

            self.entities.push(RenderableEntity {
                transform: instance.world_transform,
                mesh_id,
                material_id,
                texture_override: None, // Primitive meshes don't have texture overrides
            });
        }

        log::info!("Loaded {} renderable entities", self.entities.len());

        // Create instance buffer
        if !self.entities.is_empty() {
            self.update_instance_buffer(device);
        }
    }

    fn update_instance_buffer(&mut self, device: &wgpu::Device) {
        log::debug!(
            "Creating instance buffer for {} entities",
            self.entities.len()
        );

        let instance_data: Vec<InstanceRaw> = self
            .entities
            .iter()
            .enumerate()
            .map(|(idx, e)| {
                // Get material
                let (material, mat_id) = if let Some(ref mat_id) = e.material_id {
                    (self.material_cache.get(mat_id), mat_id.as_str())
                } else {
                    (self.material_cache.default(), "default")
                };

                let color_rgb = material.color_rgb();

                log::debug!(
                    "Instance #{}: mesh='{}', material='{}', color=RGB({:.2}, {:.2}, {:.2}), metallic={}, roughness={}",
                    idx,
                    e.mesh_id,
                    mat_id,
                    color_rgb.x,
                    color_rgb.y,
                    color_rgb.z,
                    material.metallic,
                    material.roughness
                );

                InstanceRaw::with_material(
                    e.transform,
                    [color_rgb.x, color_rgb.y, color_rgb.z],
                    material.metallic,
                    material.roughness,
                )
            })
            .collect();

        self.instance_buffer = Some(
            device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some("Instance Buffer"),
                contents: bytemuck::cast_slice(&instance_data),
                usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            }),
        );

        log::debug!("Instance buffer created successfully");
    }

    pub fn render(
        &self,
        encoder: &mut wgpu::CommandEncoder,
        view: &wgpu::TextureView,
        camera: &Camera,
        queue: &wgpu::Queue,
        device: &wgpu::Device,
    ) {
        // Update camera
        self.pipeline
            .update_camera(queue, camera.view_projection_matrix(), camera.position);

        // Update lights
        self.pipeline.update_lights(queue, &self.light_uniform);

        // Create default texture bind group (white texture for materials without textures)
        let default_texture = self.texture_cache.default();
        let default_texture_bind_group = self.pipeline.create_texture_bind_group(
            device,
            &default_texture.view,
            &default_texture.sampler,
        );

        // Pre-create texture bind groups for each entity
        let mut texture_bind_groups: Vec<wgpu::BindGroup> = Vec::new();
        for entity in &self.entities {
            let bind_group = if let Some(ref texture_override) = entity.texture_override {
                // GLTF models have texture override (e.g., "texture_0")
                let texture = self.texture_cache.get(texture_override);
                self.pipeline.create_texture_bind_group(
                    device,
                    &texture.view,
                    &texture.sampler,
                )
            } else if let Some(ref material_id) = entity.material_id {
                let material = self.material_cache.get(material_id);

                // If material has albedo texture, create bind group for it
                if let Some(ref texture_id) = material.albedoTexture {
                    let texture = self.texture_cache.get(texture_id);
                    self.pipeline.create_texture_bind_group(
                        device,
                        &texture.view,
                        &texture.sampler,
                    )
                } else {
                    // Use default white texture
                    self.pipeline.create_texture_bind_group(
                        device,
                        &default_texture.view,
                        &default_texture.sampler,
                    )
                }
            } else {
                // No material, use default white texture
                self.pipeline.create_texture_bind_group(
                    device,
                    &default_texture.view,
                    &default_texture.sampler,
                )
            };
            texture_bind_groups.push(bind_group);
        }

        let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("Scene Render Pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(camera.background_color),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                view: &self.depth_texture.view,
                depth_ops: Some(wgpu::Operations {
                    load: wgpu::LoadOp::Clear(1.0),
                    store: wgpu::StoreOp::Store,
                }),
                stencil_ops: None,
            }),
            occlusion_query_set: None,
            timestamp_writes: None,
        });

        render_pass.set_pipeline(&self.pipeline.pipeline);
        render_pass.set_bind_group(0, &self.pipeline.camera_bind_group, &[]);
        // Start with default texture (will be overridden per entity if needed)
        render_pass.set_bind_group(1, &default_texture_bind_group, &[]);

        if let Some(instance_buffer) = &self.instance_buffer {
            render_pass.set_vertex_buffer(1, instance_buffer.slice(..));

            // Render each entity individually with correct texture
            for (i, entity) in self.entities.iter().enumerate() {
                let mesh_id = entity.mesh_id.as_str();

                // Bind the texture for this entity
                render_pass.set_bind_group(1, &texture_bind_groups[i], &[]);

                // Draw this entity
                if let Some(gpu_mesh) = self.mesh_cache.get(mesh_id) {
                    render_pass.set_vertex_buffer(0, gpu_mesh.vertex_buffer.slice(..));
                    render_pass.set_index_buffer(
                        gpu_mesh.index_buffer.slice(..),
                        wgpu::IndexFormat::Uint32,
                    );
                    render_pass.draw_indexed(
                        0..gpu_mesh.index_count,
                        0,
                        i as u32..(i + 1) as u32,
                    );
                }
            }
        }
    }
}
