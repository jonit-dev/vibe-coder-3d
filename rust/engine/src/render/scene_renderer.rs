use super::{
    mesh_cache::MeshCache,
    pipeline::{InstanceRaw, RenderPipeline},
    Camera,
};
use crate::ecs::{components::transform::Transform, SceneData};
use glam::Mat4;
use wgpu::util::DeviceExt;

pub struct RenderableEntity {
    pub transform: Mat4,
    pub mesh_id: String,
}

pub struct SceneRenderer {
    pub mesh_cache: MeshCache,
    pub pipeline: RenderPipeline,
    pub entities: Vec<RenderableEntity>,
    pub instance_buffer: Option<wgpu::Buffer>,
}

impl SceneRenderer {
    pub fn new(device: &wgpu::Device, config: &wgpu::SurfaceConfiguration) -> Self {
        let mut mesh_cache = MeshCache::new();
        mesh_cache.initialize_primitives(device);

        let pipeline = RenderPipeline::new(device, config);

        Self {
            mesh_cache,
            pipeline,
            entities: Vec::new(),
            instance_buffer: None,
        }
    }

    pub fn load_scene(&mut self, device: &wgpu::Device, scene: &SceneData) {
        log::info!("Loading scene entities for rendering...");
        self.entities.clear();

        for entity in &scene.entities {
            // Check if entity has MeshRenderer
            if let Some(mesh_renderer) = entity.get_component::<crate::ecs::components::mesh_renderer::MeshRenderer>("MeshRenderer") {
                if !mesh_renderer.enabled {
                    continue;
                }

                // Get transform
                let transform = entity
                    .get_component::<Transform>("Transform")
                    .unwrap_or_default();

                let mesh_id = mesh_renderer
                    .meshId
                    .clone()
                    .unwrap_or_else(|| "cube".to_string());

                log::debug!(
                    "Added entity '{}' with mesh '{}'",
                    entity.name.as_ref().unwrap_or(&"Unnamed".to_string()),
                    &mesh_id
                );

                self.entities.push(RenderableEntity {
                    transform: transform.matrix(),
                    mesh_id,
                });
            }
        }

        log::info!("Loaded {} renderable entities", self.entities.len());

        // Create instance buffer
        if !self.entities.is_empty() {
            self.update_instance_buffer(device);
        }
    }

    fn update_instance_buffer(&mut self, device: &wgpu::Device) {
        let instance_data: Vec<InstanceRaw> = self
            .entities
            .iter()
            .map(|e| InstanceRaw::from_matrix(e.transform))
            .collect();

        self.instance_buffer = Some(device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Instance Buffer"),
            contents: bytemuck::cast_slice(&instance_data),
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
        }));
    }

    pub fn render(
        &self,
        encoder: &mut wgpu::CommandEncoder,
        view: &wgpu::TextureView,
        camera: &Camera,
        queue: &wgpu::Queue,
    ) {
        // Update camera
        self.pipeline.update_camera(queue, camera.view_projection_matrix());

        let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("Scene Render Pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color {
                        r: 0.1,
                        g: 0.2,
                        b: 0.3,
                        a: 1.0,
                    }),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: None,
            occlusion_query_set: None,
            timestamp_writes: None,
        });

        render_pass.set_pipeline(&self.pipeline.pipeline);
        render_pass.set_bind_group(0, &self.pipeline.camera_bind_group, &[]);

        if let Some(instance_buffer) = &self.instance_buffer {
            render_pass.set_vertex_buffer(1, instance_buffer.slice(..));

            // Group entities by mesh for efficient rendering
            let mut current_mesh: Option<&str> = None;
            let mut instance_start = 0;

            for (i, entity) in self.entities.iter().enumerate() {
                let mesh_id = entity.mesh_id.as_str();

                if Some(mesh_id) != current_mesh {
                    // Render previous batch if exists
                    if let Some(prev_mesh) = current_mesh {
                        if let Some(gpu_mesh) = self.mesh_cache.get(prev_mesh) {
                            render_pass.set_vertex_buffer(0, gpu_mesh.vertex_buffer.slice(..));
                            render_pass.set_index_buffer(
                                gpu_mesh.index_buffer.slice(..),
                                wgpu::IndexFormat::Uint32,
                            );
                            render_pass.draw_indexed(
                                0..gpu_mesh.index_count,
                                0,
                                instance_start as u32..i as u32,
                            );
                        }
                    }

                    current_mesh = Some(mesh_id);
                    instance_start = i;
                }
            }

            // Render final batch
            if let Some(mesh_id) = current_mesh {
                if let Some(gpu_mesh) = self.mesh_cache.get(mesh_id) {
                    render_pass.set_vertex_buffer(0, gpu_mesh.vertex_buffer.slice(..));
                    render_pass.set_index_buffer(
                        gpu_mesh.index_buffer.slice(..),
                        wgpu::IndexFormat::Uint32,
                    );
                    render_pass.draw_indexed(
                        0..gpu_mesh.index_count,
                        0,
                        instance_start as u32..self.entities.len() as u32,
                    );
                }
            }
        }
    }
}
