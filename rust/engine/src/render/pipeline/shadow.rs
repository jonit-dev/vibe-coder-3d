//! Shadow pipeline - depth-only rendering for shadow maps.

use super::super::pipeline::{InstanceRaw, Vertex};

/// Shadow pipeline for depth-only rendering
pub struct ShadowPipeline {
    pub pipeline: wgpu::RenderPipeline,
}

impl ShadowPipeline {
    pub fn new(device: &wgpu::Device, pipeline_layout: &wgpu::PipelineLayout) -> Self {
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("../shader.wgsl").into()),
        });

        let vertex_buffers = [Vertex::desc(), InstanceRaw::desc()];

        let primitive_state = wgpu::PrimitiveState {
            topology: wgpu::PrimitiveTopology::TriangleList,
            strip_index_format: None,
            front_face: wgpu::FrontFace::Ccw,
            cull_mode: Some(wgpu::Face::Back),
            polygon_mode: wgpu::PolygonMode::Fill,
            unclipped_depth: false,
            conservative: false,
        };

        let multisample_state = wgpu::MultisampleState {
            count: 1,
            mask: !0,
            alpha_to_coverage_enabled: false,
        };

        let depth_stencil = wgpu::DepthStencilState {
            format: wgpu::TextureFormat::Depth32Float,
            depth_write_enabled: true,
            depth_compare: wgpu::CompareFunction::Less,
            stencil: wgpu::StencilState::default(),
            bias: wgpu::DepthBiasState::default(),
        };

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Shadow Pipeline (Depth-only)"),
            layout: Some(pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_shadow",
                buffers: &vertex_buffers,
            },
            fragment: None, // Depth-only, no fragment shader
            primitive: primitive_state,
            depth_stencil: Some(depth_stencil),
            multisample: multisample_state,
            multiview: None,
        });

        Self { pipeline }
    }
}
