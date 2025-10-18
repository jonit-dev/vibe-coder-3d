use super::{
    material_uniform::{
        MaterialUniform, ALPHA_MODE_BLEND, TEXTURE_ALBEDO, TEXTURE_EMISSIVE, TEXTURE_METALLIC,
        TEXTURE_NORMAL, TEXTURE_OCCLUSION, TEXTURE_ROUGHNESS,
    },
    pipeline::{InstanceRaw, LightUniform, RenderPipeline, ShadowUniform},
    shadows::{ShadowConfig, ShadowResources},
    Camera,
};
use crate::ecs::{components::transform::Transform, SceneData};
use glam::{Mat4, Quat, Vec3};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use vibe_assets::{MaterialCache, MeshCache, TextureCache};
use vibe_ecs_bridge::MeshRendererMaterialOverride;
use vibe_scene::EntityId;
use vibe_scene_graph::SceneGraph;
use wgpu::util::DeviceExt;

// Modular helpers
mod instances;
mod lights;
mod materials;
mod shadows;
mod sorting;
mod textures;

use shadows::ShadowBinder;
use sorting::DrawSorter;

pub struct RenderableEntity {
    pub entity_id: Option<EntityId>,
    pub transform: Mat4,
    pub mesh_id: String,
    pub material_id: Option<String>,
    pub texture_override: Option<String>, // Override texture for GLTF models
    pub cast_shadows: bool,
    pub receive_shadows: bool,
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
    pub shadow_resources: ShadowResources,
    pub shadow_bind_group: wgpu::BindGroup, // For main pass (includes texture)
    pub shadow_uniform_bind_group: wgpu::BindGroup, // For shadow pass (uniform only)
}

impl SceneRenderer {
    pub fn new(
        device: &wgpu::Device,
        config: &wgpu::SurfaceConfiguration,
        queue: &wgpu::Queue,
    ) -> Self {
        let mut mesh_cache = MeshCache::new();
        mesh_cache.initialize_primitives(device);

        let material_cache = MaterialCache::new();

        let mut texture_cache = TextureCache::new();
        texture_cache.initialize_default(device, queue);

        let pipeline = RenderPipeline::new(device, config);
        let depth_texture = super::depth_texture::DepthTexture::create(device, config);

        // Initialize shadow resources
        let shadow_config = ShadowConfig::default();
        let shadow_resources = ShadowResources::new(device, shadow_config);

        // Create shadow bind group for first directional light map (for main pass)
        // Gracefully handle missing shadow maps instead of panicking
        let shadow_bind_group = if let Some(dir_map) = shadow_resources.get_directional_map(0) {
            pipeline.create_shadow_bind_group(device, &dir_map.view, &shadow_resources.compare_sampler)
        } else {
            log::warn!("No directional shadow maps configured; shadows will be disabled");
            // Create a bind group with a dummy texture to avoid shader errors
            pipeline.create_shadow_bind_group(
                device,
                &texture_cache.default().view, // Use default white texture as placeholder
                &shadow_resources.compare_sampler,
            )
        };

        // Create shadow uniform-only bind group (for shadow pass)
        let shadow_uniform_bind_group = pipeline.create_shadow_uniform_bind_group(device);

        log::info!(
            "Shadow system initialized: {} directional, {} spot lights",
            shadow_resources.directional_maps.len(),
            shadow_resources.spot_maps.len()
        );

        Self {
            mesh_cache,
            material_cache,
            texture_cache,
            pipeline,
            entities: Vec::new(),
            instance_buffer: None,
            light_uniform: LightUniform::new(),
            depth_texture,
            shadow_resources,
            shadow_bind_group,
            shadow_uniform_bind_group,
        }
    }

    pub fn load_scene(&mut self, device: &wgpu::Device, queue: &wgpu::Queue, scene: &SceneData) {
        log::info!("Loading scene entities for rendering...");
        log::debug!("Scene has {} total entities", scene.entities.len());
        self.entities.clear();

        // Load materials from scene
        self.material_cache
            .load_from_scene(scene.materials.as_ref());

        // Build scene graph for transform hierarchy (uses deg->rad for Euler to match Three.js)
        let scene_graph_result = SceneGraph::build(scene);
        let mut scene_graph = match scene_graph_result {
            Ok(graph) => {
                log::info!(
                    "Built scene graph with {} entities",
                    graph.entity_ids().len()
                );
                Some(graph)
            }
            Err(e) => {
                log::error!("Failed to build scene graph: {}", e);
                log::warn!("Falling back to flat hierarchy (no parent transforms) - entities will still render with local transforms");
                None
            }
        };

        // Reset lights to defaults
        self.light_uniform = LightUniform::new();
        let mut dir_shadow_enabled: bool = false;
        let mut dir_shadow_bias: f32 = 0.0005;
        let mut dir_shadow_radius: f32 = 2.0;
        let mut dir_light_dir: Vec3 = Vec3::new(0.5, -1.0, 0.5);
        // Parity config defaults
        self.light_uniform.physically_correct_lights = 1.0; // match Three.js default true in modern renderer
        self.light_uniform.exposure = 1.0; // toneMappingExposure
        self.light_uniform.tone_mapping = 1.0; // ACES on

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
                                dir_shadow_enabled = light.castShadow;
                                dir_shadow_bias = light.shadowBias;
                                dir_shadow_radius = light.shadowRadius;
                                dir_light_dir =
                                    Vec3::new(light.directionX, light.directionY, light.directionZ);
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
                                    self.light_uniform.point_decay_0 = light.decay;
                                } else {
                                    self.light_uniform.point_position_1 =
                                        [position.x, position.y, position.z];
                                    self.light_uniform.point_intensity_1 = light.intensity;
                                    self.light_uniform.point_color_1 = light_color;
                                    self.light_uniform.point_range_1 = light.range;
                                    self.light_uniform.point_decay_1 = light.decay;
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
                            self.light_uniform.spot_direction =
                                [light.directionX, light.directionY, light.directionZ];
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
        // If scene graph build failed, extract renderables with flat hierarchy (local transforms only)
        log::info!("Extracting renderable entities...");
        let renderable_instances = if let Some(ref mut graph) = scene_graph {
            log::debug!("Using scene graph with hierarchical transforms");
            graph.extract_renderables(scene)
        } else {
            log::warn!("Using flat hierarchy fallback - extracting entities with local transforms only");
            extract_renderables_flat(scene)
        };
        log::info!("Found {} renderable instances", renderable_instances.len());

        for instance in renderable_instances {
            let materials_list = instance.materials.clone();
            let inline_override = instance.material_override.clone();
            let mut inline_material_cache: HashMap<Option<String>, String> = HashMap::new();

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
                                let vibe_assets::GltfData {
                                    meshes,
                                    mesh_textures,
                                    images,
                                } = gltf_data;

                                log::info!(
                                    "Loaded {} mesh(es) and {} texture(s) from GLTF model",
                                    meshes.len(),
                                    images.len()
                                );

                                // Load textures into texture cache and remember the first one for fallback use
                                let mut first_texture_id: Option<String> = None;
                                for (idx, gltf_image) in images.iter().enumerate() {
                                    let texture_id =
                                        gltf_image.name.as_ref().map(|n| n.clone()).unwrap_or_else(
                                            || format!("{}_texture_{}", model_path, idx),
                                        );

                                    let load_result = self.texture_cache.load_from_rgba_pixels(
                                        device,
                                        queue,
                                        &gltf_image.data,
                                        gltf_image.width,
                                        gltf_image.height,
                                        &texture_id,
                                    );

                                    if let Err(e) = load_result {
                                        log::error!(
                                            "Failed to load texture '{}': {}",
                                            texture_id,
                                            e
                                        );
                                        continue;
                                    }

                                    if first_texture_id.is_none() {
                                        first_texture_id = Some(texture_id.clone());
                                    }
                                }

                                // Upload all meshes from the GLTF file
                                for (idx, vibe_mesh) in meshes.into_iter().enumerate() {
                                    let mesh_name = format!("{}_{}", model_path, idx);

                                    // Upload mesh directly (vibe_assets::Mesh)
                                    self.mesh_cache.upload_mesh(device, &mesh_name, vibe_mesh);

                                    // Use the primitive-specific texture if available, otherwise fallback
                                    let texture_override = mesh_textures
                                        .get(idx)
                                        .cloned()
                                        .flatten()
                                        .or_else(|| first_texture_id.clone());

                                    let base_material_id = materials_list
                                        .as_ref()
                                        .and_then(|list| list.get(idx).cloned())
                                        .or_else(|| instance.material_id.clone());
                                    let final_material_id = self.resolve_material_id(
                                        base_material_id,
                                        inline_override.as_ref(),
                                        instance.entity_id,
                                        idx,
                                        &mut inline_material_cache,
                                    );

                                    // Create a renderable entity for each mesh in the GLTF
                                    self.entities.push(RenderableEntity {
                                        entity_id: Some(instance.entity_id),
                                        transform: instance.world_transform,
                                        mesh_id: mesh_name,
                                        material_id: final_material_id,
                                        texture_override,
                                        cast_shadows: instance.cast_shadows,
                                        receive_shadows: instance.receive_shadows,
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
                        log::warn!(
                            "GLTF support not enabled, ignoring modelPath: {}",
                            model_path
                        );
                        log::warn!("Compile with --features gltf-support to enable GLTF loading");
                    }
                }
            }

            // Use primitive mesh (default or fallback)
            let mesh_id = instance
                .mesh_id
                .clone()
                .unwrap_or_else(|| "cube".to_string());

            let base_material_id = materials_list
                .as_ref()
                .and_then(|list| list.get(0).cloned())
                .or_else(|| instance.material_id.clone());
            let material_id = self.resolve_material_id(
                base_material_id,
                inline_override.as_ref(),
                instance.entity_id,
                0,
                &mut inline_material_cache,
            );

            // Extract position from transform matrix for logging
            let pos = instance.world_transform.w_axis;
            let scale = Vec3::new(
                instance.world_transform.x_axis.length(),
                instance.world_transform.y_axis.length(),
                instance.world_transform.z_axis.length(),
            );

            log::info!(
                "  ✓ Renderable entity {:?}: mesh='{}', material={:?}, pos=[{:.2}, {:.2}, {:.2}], scale=[{:.2}, {:.2}, {:.2}]",
                instance.entity_id,
                &mesh_id,
                &material_id,
                pos.x, pos.y, pos.z,
                scale.x, scale.y, scale.z
            );

            self.entities.push(RenderableEntity {
                entity_id: Some(instance.entity_id),
                transform: instance.world_transform,
                mesh_id,
                material_id,
                texture_override: None, // Primitive meshes don't have texture overrides
                cast_shadows: instance.cast_shadows,
                receive_shadows: instance.receive_shadows,
            });
        }

        log::info!("Loaded {} renderable entities", self.entities.len());

        // Create instance buffer
        if !self.entities.is_empty() {
            self.update_instance_buffer(device);
        }

        // Compute scene bounds and update shadow uniform for directional light using ShadowBinder
        let (scene_center, scene_radius) = ShadowBinder::compute_scene_bounds(&self.entities);
        let shadow_uniform = if directional_light_set {
            ShadowBinder::update_directional(
                dir_light_dir,
                scene_center,
                scene_radius,
                dir_shadow_enabled,
                dir_shadow_bias,
                dir_shadow_radius,
            )
        } else {
            ShadowUniform::new()
        };
        self.pipeline.update_shadows(queue, &shadow_uniform);
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
                    "Instance #{}: mesh='{}', material='{}', color=RGB({:.2}, {:.2}, {:.2}), metalness={}, roughness={}",
                    idx,
                    e.mesh_id,
                    mat_id,
                    color_rgb.x,
                    color_rgb.y,
                    color_rgb.z,
                    material.metalness,
                    material.roughness
                );

                InstanceRaw::with_material(
                    e.transform,
                    [color_rgb.x, color_rgb.y, color_rgb.z],
                    material.metalness,
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
        // 0) Render directional shadow map (simple: render all instances as casters)
        // Wrap in a scope to ensure shadow_pass is dropped before main render pass
        {
            if let Some(dir_map) = self.shadow_resources.get_directional_map(0) {
                if let Some(instance_buffer) = &self.instance_buffer {
                    let mut shadow_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                        label: Some("Directional Shadow Pass"),
                        color_attachments: &[],
                        depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                            view: &dir_map.view,
                            depth_ops: Some(wgpu::Operations {
                                load: wgpu::LoadOp::Clear(1.0),
                                store: wgpu::StoreOp::Store,
                            }),
                            stencil_ops: None,
                        }),
                        occlusion_query_set: None,
                        timestamp_writes: None,
                    });

                    shadow_pass.set_pipeline(&self.pipeline.shadow_pipeline);
                    shadow_pass.set_vertex_buffer(1, instance_buffer.slice(..));
                    // Bind empty groups for indices 0-2, shadow uniform at index 3
                    shadow_pass.set_bind_group(0, &self.pipeline.empty_bind_group, &[]);
                    shadow_pass.set_bind_group(1, &self.pipeline.empty_bind_group, &[]);
                    shadow_pass.set_bind_group(2, &self.pipeline.empty_bind_group, &[]);
                    // Use uniform-only bind group (no texture) to avoid usage conflict
                    shadow_pass.set_bind_group(3, &self.shadow_uniform_bind_group, &[]);

                    for (i, entity) in self.entities.iter().enumerate() {
                        // Only render shadow-casting entities
                        if !entity.cast_shadows {
                            continue;
                        }

                        if let Some(gpu_mesh) = self.mesh_cache.get(entity.mesh_id.as_str()) {
                            shadow_pass.set_vertex_buffer(0, gpu_mesh.vertex_buffer.slice(..));
                            shadow_pass.set_index_buffer(
                                gpu_mesh.index_buffer.slice(..),
                                wgpu::IndexFormat::Uint32,
                            );
                            shadow_pass.draw_indexed(
                                0..gpu_mesh.index_count,
                                0,
                                i as u32..(i + 1) as u32,
                            );
                        }
                    }
                    // shadow_pass is dropped here when it goes out of scope
                }
            }
        } // Scope ends here, ensuring shadow_pass is fully dropped
          // Update camera
        self.pipeline
            .update_camera(queue, camera.view_projection_matrix(), camera.position);

        // Update lights
        self.pipeline.update_lights(queue, &self.light_uniform);

        // Get default fallback textures
        let default_white = self.texture_cache.default();
        let default_normal = self.texture_cache.default_normal();
        let default_black = self.texture_cache.default_black();
        let default_gray = self.texture_cache.default_gray();

        // Pre-create texture and material bind groups for each entity
        let mut texture_bind_groups: Vec<wgpu::BindGroup> = Vec::new();
        let mut material_bind_groups: Vec<wgpu::BindGroup> = Vec::new();
        let mut material_uniform_buffers: Vec<wgpu::Buffer> = Vec::new();
        let mut entity_alpha_modes: Vec<u32> = Vec::new();

        for entity in &self.entities {
            // Determine which textures to use (or fallback to defaults)
            let (
                albedo_view,
                has_albedo,
                normal_view,
                has_normal,
                metallic_view,
                has_metallic,
                roughness_view,
                has_roughness,
                emissive_view,
                has_emissive,
                occlusion_view,
                has_occlusion,
            ) = if let Some(ref texture_override) = entity.texture_override {
                let has_texture = self.texture_cache.contains(texture_override);
                let texture = self.texture_cache.get(texture_override);
                (
                    &texture.view,
                    has_texture,
                    &default_normal.view,
                    false,
                    &default_black.view,
                    false,
                    &default_gray.view,
                    false,
                    &default_black.view,
                    false,
                    &default_white.view,
                    false,
                )
            } else if let Some(ref material_id) = entity.material_id {
                let material = self.material_cache.get(material_id);

                let (albedo_view, has_albedo) = material
                    .albedoTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_white.view, false));

                let (normal_view, has_normal) = material
                    .normalTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_normal.view, false));

                let (metallic_view, has_metallic) = material
                    .metallicTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_black.view, false));

                let (roughness_view, has_roughness) = material
                    .roughnessTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_gray.view, false));

                let (emissive_view, has_emissive) = material
                    .emissiveTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_black.view, false));

                let (occlusion_view, has_occlusion) = material
                    .occlusionTexture
                    .as_ref()
                    .and_then(|id| {
                        self.texture_cache
                            .contains(id)
                            .then(|| (&self.texture_cache.get(id).view, true))
                    })
                    .unwrap_or((&default_white.view, false));

                (
                    albedo_view,
                    has_albedo,
                    normal_view,
                    has_normal,
                    metallic_view,
                    has_metallic,
                    roughness_view,
                    has_roughness,
                    emissive_view,
                    has_emissive,
                    occlusion_view,
                    has_occlusion,
                )
            } else {
                (
                    &default_white.view,
                    false,
                    &default_normal.view,
                    false,
                    &default_black.view,
                    false,
                    &default_gray.view,
                    false,
                    &default_black.view,
                    false,
                    &default_white.view,
                    false,
                )
            };

            // Create bind group with all 6 textures
            let bind_group = self.pipeline.create_multi_texture_bind_group(
                device,
                albedo_view,
                normal_view,
                metallic_view,
                roughness_view,
                emissive_view,
                occlusion_view,
                &default_white.sampler, // Use white texture's sampler (they all share same sampler settings)
            );
            texture_bind_groups.push(bind_group);

            // Build material uniform for this entity
            let mut material_uniform = entity
                .material_id
                .as_ref()
                .map(|id| MaterialUniform::from_material(self.material_cache.get(id)))
                .unwrap_or_else(MaterialUniform::new);

            let mut flags = material_uniform.texture_flags();
            if entity.texture_override.is_some() && has_albedo {
                flags |= TEXTURE_ALBEDO;
            }

            if !has_albedo {
                flags &= !TEXTURE_ALBEDO;
            }
            if !has_normal {
                flags &= !TEXTURE_NORMAL;
            }
            if !has_metallic {
                flags &= !TEXTURE_METALLIC;
            }
            if !has_roughness {
                flags &= !TEXTURE_ROUGHNESS;
            }
            if !has_emissive {
                flags &= !TEXTURE_EMISSIVE;
            }
            if !has_occlusion {
                flags &= !TEXTURE_OCCLUSION;
            }
            material_uniform.set_texture_flags(flags);

            let alpha_mode = material_uniform.alpha_mode();
            entity_alpha_modes.push(alpha_mode);

            let material_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some("Material Uniform Buffer"),
                contents: bytemuck::cast_slice(&[material_uniform]),
                usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            });

            let material_bind_group = self
                .pipeline
                .create_material_bind_group(device, &material_buffer);

            material_uniform_buffers.push(material_buffer);
            material_bind_groups.push(material_bind_group);
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

        if let Some(instance_buffer) = &self.instance_buffer {
            // Use DrawSorter to bucket and sort entities
            let (opaque_indices, transparent_draws) =
                DrawSorter::bucket_and_sort(&entity_alpha_modes, &self.entities, camera.position);

            render_pass.set_vertex_buffer(1, instance_buffer.slice(..));

            if !opaque_indices.is_empty() {
                render_pass.set_pipeline(&self.pipeline.opaque_pipeline);
                render_pass.set_bind_group(0, &self.pipeline.camera_bind_group, &[]);
                // Bind shadow group (dir shadow used in fs_main)
                render_pass.set_bind_group(3, &self.shadow_bind_group, &[]);

                for &i in &opaque_indices {
                    let mesh_id = self.entities[i].mesh_id.as_str();
                    render_pass.set_bind_group(1, &texture_bind_groups[i], &[]);
                    render_pass.set_bind_group(2, &material_bind_groups[i], &[]);

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

            if !transparent_draws.is_empty() {
                render_pass.set_pipeline(&self.pipeline.transparent_pipeline);
                render_pass.set_bind_group(0, &self.pipeline.camera_bind_group, &[]);
                render_pass.set_bind_group(3, &self.shadow_bind_group, &[]);

                for (i, _) in &transparent_draws {
                    let mesh_id = self.entities[*i].mesh_id.as_str();
                    render_pass.set_bind_group(1, &texture_bind_groups[*i], &[]);
                    render_pass.set_bind_group(2, &material_bind_groups[*i], &[]);

                    if let Some(gpu_mesh) = self.mesh_cache.get(mesh_id) {
                        render_pass.set_vertex_buffer(0, gpu_mesh.vertex_buffer.slice(..));
                        render_pass.set_index_buffer(
                            gpu_mesh.index_buffer.slice(..),
                            wgpu::IndexFormat::Uint32,
                        );
                        render_pass.draw_indexed(
                            0..gpu_mesh.index_count,
                            0,
                            *i as u32..(*i + 1) as u32,
                        );
                    }
                }
            }
        }
    }

    fn resolve_material_id(
        &mut self,
        base_material_id: Option<String>,
        inline_override: Option<&MeshRendererMaterialOverride>,
        entity_id: EntityId,
        variant_index: usize,
        cache: &mut HashMap<Option<String>, String>,
    ) -> Option<String> {
        if let Some(override_data) = inline_override {
            if let Some(existing) = cache.get(&base_material_id) {
                return Some(existing.clone());
            }
            let new_id = self.create_inline_material(
                base_material_id.as_deref(),
                override_data,
                entity_id,
                variant_index,
            );
            cache.insert(base_material_id.clone(), new_id.clone());
            Some(new_id)
        } else {
            base_material_id
        }
    }

    fn create_inline_material(
        &mut self,
        base_material_id: Option<&str>,
        override_data: &MeshRendererMaterialOverride,
        entity_id: EntityId,
        variant_index: usize,
    ) -> String {
        let mut material = base_material_id
            .and_then(|id| {
                if self.material_cache.contains(id) {
                    Some(self.material_cache.get(id).clone())
                } else {
                    None
                }
            })
            .unwrap_or_else(|| self.material_cache.default().clone());

        if let Some(shader) = override_data.shader.as_ref() {
            material.shader = shader.clone();
        }
        if let Some(material_type) = override_data.material_type.as_ref() {
            material.materialType = material_type.clone();
        }
        if let Some(color) = override_data.color.as_ref() {
            material.color = color.clone();
        }
        if let Some(metalness) = override_data.metalness {
            material.metalness = metalness;
        }
        if let Some(roughness) = override_data.roughness {
            material.roughness = roughness;
        }
        if let Some(normal_scale) = override_data.normal_scale {
            material.normalScale = normal_scale;
        }
        if let Some(occlusion_strength) = override_data.occlusion_strength {
            material.occlusionStrength = occlusion_strength;
        }
        if let Some(texture_offset_x) = override_data.texture_offset_x {
            material.textureOffsetX = texture_offset_x;
        }
        if let Some(texture_offset_y) = override_data.texture_offset_y {
            material.textureOffsetY = texture_offset_y;
        }
        if let Some(texture_repeat_x) = override_data.texture_repeat_x {
            material.textureRepeatX = texture_repeat_x;
        }
        if let Some(texture_repeat_y) = override_data.texture_repeat_y {
            material.textureRepeatY = texture_repeat_y;
        }

        if let Some(emissive) = override_data.emissive.as_ref() {
            material.emissive = Some(emissive.clone());
        }
        if let Some(emissive_intensity) = override_data.emissive_intensity {
            material.emissiveIntensity = emissive_intensity;
        }

        if let Some(albedo_texture) = override_data.albedo_texture.as_ref() {
            material.albedoTexture = Some(albedo_texture.clone());
        }
        if let Some(normal_texture) = override_data.normal_texture.as_ref() {
            material.normalTexture = Some(normal_texture.clone());
        }
        if let Some(metallic_texture) = override_data.metallic_texture.as_ref() {
            material.metallicTexture = Some(metallic_texture.clone());
        }
        if let Some(roughness_texture) = override_data.roughness_texture.as_ref() {
            material.roughnessTexture = Some(roughness_texture.clone());
        }
        if let Some(emissive_texture) = override_data.emissive_texture.as_ref() {
            material.emissiveTexture = Some(emissive_texture.clone());
        }
        if let Some(occlusion_texture) = override_data.occlusion_texture.as_ref() {
            material.occlusionTexture = Some(occlusion_texture.clone());
        }

        if let Some(transparent) = override_data.transparent {
            material.transparent = transparent;
        }
        if let Some(alpha_mode) = override_data.alpha_mode.as_ref() {
            material.alphaMode = alpha_mode.clone();
        }
        if let Some(alpha_cutoff) = override_data.alpha_cutoff {
            material.alphaCutoff = alpha_cutoff;
        }

        let inline_id =
            self.generate_inline_material_id(base_material_id, entity_id, variant_index);
        material.id = inline_id.clone();
        if material.name.is_none() {
            material.name = Some(format!("Inline {}", inline_id));
        }

        self.material_cache.insert(material.clone());
        inline_id
    }

    fn generate_inline_material_id(
        &self,
        base_material_id: Option<&str>,
        entity_id: EntityId,
        variant_index: usize,
    ) -> String {
        let mut hasher = DefaultHasher::new();
        hasher.write_u64(entity_id.as_u64());
        hasher.write_usize(variant_index);
        if let Some(id) = base_material_id {
            id.hash(&mut hasher);
        }
        let hash = hasher.finish();
        format!("inline-{hash:x}")
    }

    /// Update entity transform from physics, keeping original scale intact.
    /// Returns true when any instance changed.
    pub fn update_entity_transform(
        &mut self,
        entity_id: EntityId,
        position: Vec3,
        rotation: Quat,
    ) -> bool {
        let mut updated = false;
        for entity in &mut self.entities {
            if entity.entity_id == Some(entity_id) {
                let (scale, _, _) = entity.transform.to_scale_rotation_translation();
                entity.transform = Mat4::from_scale_rotation_translation(scale, rotation, position);
                updated = true;
            }
        }
        updated
    }

    /// Rebuild GPU instance buffer with latest transforms/material data
    pub fn rebuild_instance_buffer(&mut self, device: &wgpu::Device) {
        self.update_instance_buffer(device);
    }
}

/// Fallback for extracting renderables when scene graph build fails
/// Uses local transforms only (no parent hierarchy)
fn extract_renderables_flat(scene: &SceneData) -> Vec<vibe_scene_graph::RenderableInstance> {
    use vibe_ecs_bridge::transform_utils::{position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt};

    let mut instances = Vec::new();

    for entity in &scene.entities {
        // Only process entities with MeshRenderer component
        if !entity.has_component("MeshRenderer") {
            continue;
        }

        let mesh_renderer = match entity.get_component::<vibe_ecs_bridge::MeshRenderer>("MeshRenderer") {
            Some(mr) => mr,
            None => continue,
        };

        // Skip if not enabled
        if !mesh_renderer.enabled {
            continue;
        }

        // Get transform (use identity if missing)
        let transform = entity.get_component::<Transform>("Transform");

        let position = transform.as_ref().and_then(|t| t.position.as_ref()).map(|p| *p);
        let rotation = transform.as_ref().and_then(|t| t.rotation.as_ref());
        let scale = transform.as_ref().and_then(|t| t.scale.as_ref()).map(|s| *s);

        // Build local transform matrix
        let pos_vec = position_to_vec3_opt(position.as_ref());
        let rot_quat = rotation_to_quat_opt(rotation);
        let scale_vec = scale_to_vec3_opt(scale.as_ref());

        let world_transform = Mat4::from_scale_rotation_translation(scale_vec, rot_quat, pos_vec);

        // Convert Option<u32> to EntityId
        let entity_id = match entity.id {
            Some(id_num) => vibe_scene::EntityId::new(id_num as u64),
            None => continue, // Skip entities without IDs
        };

        instances.push(vibe_scene_graph::RenderableInstance {
            entity_id,
            world_transform,
            mesh_id: mesh_renderer.meshId.clone(),
            material_id: mesh_renderer.materialId.clone(),
            materials: mesh_renderer.materials.clone(),
            material_override: mesh_renderer.material.clone(),
            model_path: mesh_renderer.modelPath.clone(),
            cast_shadows: mesh_renderer.castShadows,
            receive_shadows: mesh_renderer.receiveShadows,
        });
    }

    instances
}
