use bytemuck::{Pod, Zeroable};
use glam::Vec3;
use wgpu::util::DeviceExt;

/// Vertex format for debug lines
#[repr(C)]
#[derive(Copy, Clone, Debug, Pod, Zeroable)]
pub struct LineVertex {
    pub position: [f32; 3],
    pub color: [f32; 3],
}

impl LineVertex {
    const ATTRIBS: [wgpu::VertexAttribute; 2] =
        wgpu::vertex_attr_array![0 => Float32x3, 1 => Float32x3];

    pub fn desc() -> wgpu::VertexBufferLayout<'static> {
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<LineVertex>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &Self::ATTRIBS,
        }
    }
}

/// Collection of line vertices to be rendered
pub struct LineBatch {
    pub vertices: Vec<LineVertex>,
}

impl LineBatch {
    pub fn new() -> Self {
        Self {
            vertices: Vec::new(),
        }
    }

    pub fn clear(&mut self) {
        self.vertices.clear();
    }

    pub fn add_line(&mut self, start: Vec3, end: Vec3, color: [f32; 3]) {
        self.vertices.push(LineVertex {
            position: start.to_array(),
            color,
        });
        self.vertices.push(LineVertex {
            position: end.to_array(),
            color,
        });
    }

    /// Add a box (cuboid) as 12 lines
    pub fn add_box(&mut self, min: Vec3, max: Vec3, color: [f32; 3]) {
        // Bottom face (4 lines)
        self.add_line(Vec3::new(min.x, min.y, min.z), Vec3::new(max.x, min.y, min.z), color);
        self.add_line(Vec3::new(max.x, min.y, min.z), Vec3::new(max.x, min.y, max.z), color);
        self.add_line(Vec3::new(max.x, min.y, max.z), Vec3::new(min.x, min.y, max.z), color);
        self.add_line(Vec3::new(min.x, min.y, max.z), Vec3::new(min.x, min.y, min.z), color);

        // Top face (4 lines)
        self.add_line(Vec3::new(min.x, max.y, min.z), Vec3::new(max.x, max.y, min.z), color);
        self.add_line(Vec3::new(max.x, max.y, min.z), Vec3::new(max.x, max.y, max.z), color);
        self.add_line(Vec3::new(max.x, max.y, max.z), Vec3::new(min.x, max.y, max.z), color);
        self.add_line(Vec3::new(min.x, max.y, max.z), Vec3::new(min.x, max.y, min.z), color);

        // Vertical edges (4 lines)
        self.add_line(Vec3::new(min.x, min.y, min.z), Vec3::new(min.x, max.y, min.z), color);
        self.add_line(Vec3::new(max.x, min.y, min.z), Vec3::new(max.x, max.y, min.z), color);
        self.add_line(Vec3::new(max.x, min.y, max.z), Vec3::new(max.x, max.y, max.z), color);
        self.add_line(Vec3::new(min.x, min.y, max.z), Vec3::new(min.x, max.y, max.z), color);
    }

    /// Add a sphere approximation as 3 orthogonal circles
    pub fn add_sphere(&mut self, center: Vec3, radius: f32, color: [f32; 3], segments: u32) {
        let segment_count = segments.max(8);

        // XY circle
        for i in 0..segment_count {
            let angle1 = (i as f32 / segment_count as f32) * std::f32::consts::TAU;
            let angle2 = ((i + 1) as f32 / segment_count as f32) * std::f32::consts::TAU;

            let p1 = center + Vec3::new(radius * angle1.cos(), radius * angle1.sin(), 0.0);
            let p2 = center + Vec3::new(radius * angle2.cos(), radius * angle2.sin(), 0.0);
            self.add_line(p1, p2, color);
        }

        // XZ circle
        for i in 0..segment_count {
            let angle1 = (i as f32 / segment_count as f32) * std::f32::consts::TAU;
            let angle2 = ((i + 1) as f32 / segment_count as f32) * std::f32::consts::TAU;

            let p1 = center + Vec3::new(radius * angle1.cos(), 0.0, radius * angle1.sin());
            let p2 = center + Vec3::new(radius * angle2.cos(), 0.0, radius * angle2.sin());
            self.add_line(p1, p2, color);
        }

        // YZ circle
        for i in 0..segment_count {
            let angle1 = (i as f32 / segment_count as f32) * std::f32::consts::TAU;
            let angle2 = ((i + 1) as f32 / segment_count as f32) * std::f32::consts::TAU;

            let p1 = center + Vec3::new(0.0, radius * angle1.cos(), radius * angle1.sin());
            let p2 = center + Vec3::new(0.0, radius * angle2.cos(), radius * angle2.sin());
            self.add_line(p1, p2, color);
        }
    }

    pub fn is_empty(&self) -> bool {
        self.vertices.is_empty()
    }

    pub fn vertex_count(&self) -> u32 {
        self.vertices.len() as u32
    }
}

impl Default for LineBatch {
    fn default() -> Self {
        Self::new()
    }
}

/// Line renderer using wgpu
pub struct LineRenderer {
    pipeline: wgpu::RenderPipeline,
    vertex_buffer: wgpu::Buffer,
    vertex_capacity: usize,
    camera_bind_group_layout: wgpu::BindGroupLayout,
    camera_buffer: wgpu::Buffer,
    camera_bind_group: wgpu::BindGroup,
}

impl LineRenderer {
    pub fn new(
        device: &wgpu::Device,
        config: &wgpu::SurfaceConfiguration,
    ) -> Self {
        // Create camera buffer
        let camera_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("Debug Line Camera Buffer"),
            size: std::mem::size_of::<[[f32; 4]; 4]>() as u64, // mat4x4
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        // Create camera bind group layout
        let camera_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::VERTEX,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                }],
                label: Some("debug_line_camera_bind_group_layout"),
            });

        // Create camera bind group
        let camera_bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &camera_bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: camera_buffer.as_entire_binding(),
            }],
            label: Some("debug_line_camera_bind_group"),
        });
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Debug Line Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shaders/line.wgsl").into()),
        });

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Debug Line Pipeline Layout"),
            bind_group_layouts: &[&camera_bind_group_layout],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Debug Line Pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &[LineVertex::desc()],
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs_main",
                targets: &[Some(wgpu::ColorTargetState {
                    format: config.format,
                    blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::LineList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                polygon_mode: wgpu::PolygonMode::Fill,
                unclipped_depth: false,
                conservative: false,
            },
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: false, // Don't write depth, but do test
                depth_compare: wgpu::CompareFunction::Less,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            multisample: wgpu::MultisampleState {
                count: 1,
                mask: !0,
                alpha_to_coverage_enabled: false,
            },
            multiview: None,
        });

        // Initial vertex buffer (will be resized as needed)
        let initial_capacity = 1024;
        let vertex_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("Debug Line Vertex Buffer"),
            size: (initial_capacity * std::mem::size_of::<LineVertex>()) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        Self {
            pipeline,
            vertex_buffer,
            vertex_capacity: initial_capacity,
            camera_bind_group_layout,
            camera_buffer,
            camera_bind_group,
        }
    }

    /// Update camera matrices
    pub fn update_camera(&self, queue: &wgpu::Queue, camera: &crate::render::Camera) {
        let view_proj = camera.view_projection_matrix();
        // Convert Mat4 to array for bytemuck
        let matrix_array: [[f32; 4]; 4] = view_proj.to_cols_array_2d();
        queue.write_buffer(&self.camera_buffer, 0, bytemuck::cast_slice(&[matrix_array]));
    }

    /// Upload line batch to GPU
    pub fn upload(&mut self, device: &wgpu::Device, queue: &wgpu::Queue, batch: &LineBatch) {
        if batch.vertices.is_empty() {
            return;
        }

        // Resize buffer if needed
        if batch.vertices.len() > self.vertex_capacity {
            let new_capacity = (batch.vertices.len() * 2).next_power_of_two();
            self.vertex_buffer = device.create_buffer(&wgpu::BufferDescriptor {
                label: Some("Debug Line Vertex Buffer"),
                size: (new_capacity * std::mem::size_of::<LineVertex>()) as u64,
                usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
                mapped_at_creation: false,
            });
            self.vertex_capacity = new_capacity;
            log::debug!("Resized line vertex buffer to {} vertices", new_capacity);
        }

        // Upload vertices
        queue.write_buffer(
            &self.vertex_buffer,
            0,
            bytemuck::cast_slice(&batch.vertices),
        );
    }

    /// Draw lines using the provided render pass
    pub fn draw<'a>(
        &'a self,
        render_pass: &mut wgpu::RenderPass<'a>,
        vertex_count: u32,
    ) {
        if vertex_count == 0 {
            return;
        }

        render_pass.set_pipeline(&self.pipeline);
        render_pass.set_bind_group(0, &self.camera_bind_group, &[]);
        render_pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
        render_pass.draw(0..vertex_count, 0..1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_batch_new() {
        let batch = LineBatch::new();
        assert!(batch.is_empty());
        assert_eq!(batch.vertex_count(), 0);
    }

    #[test]
    fn test_add_line() {
        let mut batch = LineBatch::new();
        batch.add_line(Vec3::ZERO, Vec3::ONE, [1.0, 1.0, 0.0]);

        assert!(!batch.is_empty());
        assert_eq!(batch.vertex_count(), 2);
        assert_eq!(batch.vertices[0].position, [0.0, 0.0, 0.0]);
        assert_eq!(batch.vertices[1].position, [1.0, 1.0, 1.0]);
    }

    #[test]
    fn test_add_box() {
        let mut batch = LineBatch::new();
        batch.add_box(Vec3::ZERO, Vec3::ONE, [1.0, 1.0, 0.0]);

        // Box has 12 edges, each is 2 vertices
        assert_eq!(batch.vertex_count(), 24);
    }

    #[test]
    fn test_add_sphere() {
        let mut batch = LineBatch::new();
        batch.add_sphere(Vec3::ZERO, 1.0, [1.0, 1.0, 0.0], 16);

        // 3 circles with 16 segments each = 3 * 16 * 2 vertices
        assert_eq!(batch.vertex_count(), 96);
    }

    #[test]
    fn test_clear() {
        let mut batch = LineBatch::new();
        batch.add_line(Vec3::ZERO, Vec3::ONE, [1.0, 1.0, 0.0]);
        assert!(!batch.is_empty());

        batch.clear();
        assert!(batch.is_empty());
        assert_eq!(batch.vertex_count(), 0);
    }
}
