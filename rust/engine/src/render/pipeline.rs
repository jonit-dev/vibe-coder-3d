//! Refactored render pipeline using extracted modules.

mod layouts;
mod graphics;
mod shadow;
mod bind_groups;

pub use bind_groups::BindGroupFactory;
pub use graphics::GraphicsPipelines;
pub use layouts::PipelineLayouts;
pub use shadow::ShadowPipeline;

// Re-export types that are used externally
use super::vertex::Vertex;
use bytemuck::{Pod, Zeroable};
use glam::{Mat4, Vec3};
use wgpu::util::DeviceExt;

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct CameraUniform {
    view_proj: [[f32; 4]; 4],
    camera_position: [f32; 4],
}

impl CameraUniform {
    pub fn new() -> Self {
        Self {
            view_proj: Mat4::IDENTITY.to_cols_array_2d(),
            camera_position: [0.0, 0.0, 0.0, 0.0],
        }
    }

    pub fn update_view_proj(&mut self, view_proj: Mat4, camera_pos: Vec3) {
        self.view_proj = view_proj.to_cols_array_2d();
        self.camera_position = [camera_pos.x, camera_pos.y, camera_pos.z, 0.0];
    }
}

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct LightUniform {
    // Directional light
    pub directional_direction: [f32; 3],
    pub directional_intensity: f32,
    pub directional_color: [f32; 3],
    pub directional_enabled: f32,

    // Ambient light
    pub ambient_color: [f32; 3],
    pub ambient_intensity: f32,

    // Point light 0
    pub point_position_0: [f32; 3],
    pub point_intensity_0: f32,
    pub point_color_0: [f32; 3],
    pub point_range_0: f32,

    // Point light 1
    pub point_position_1: [f32; 3],
    pub point_intensity_1: f32,
    pub point_color_1: [f32; 3],
    pub point_range_1: f32,

    // Spot light
    pub spot_position: [f32; 3],
    pub spot_intensity: f32,
    pub spot_direction: [f32; 3],
    pub spot_angle: f32,
    pub spot_color: [f32; 3],
    pub spot_penumbra: f32,
    pub spot_range: f32,
    pub spot_decay: f32,
    // Parity extras
    pub point_decay_0: f32,
    pub point_decay_1: f32,
    pub physically_correct_lights: f32,
    pub exposure: f32,
    pub tone_mapping: f32,
    _padding: [f32; 1],
}

impl LightUniform {
    pub fn new() -> Self {
        Self {
            directional_direction: [0.5, 1.0, 0.5],
            directional_intensity: 1.0,
            directional_color: [1.0, 1.0, 1.0],
            directional_enabled: 1.0,

            ambient_color: [0.3, 0.3, 0.3],
            ambient_intensity: 1.0,

            point_position_0: [0.0, 0.0, 0.0],
            point_intensity_0: 0.0,
            point_color_0: [1.0, 1.0, 1.0],
            point_range_0: 10.0,

            point_position_1: [0.0, 0.0, 0.0],
            point_intensity_1: 0.0,
            point_color_1: [1.0, 1.0, 1.0],
            point_range_1: 10.0,

            spot_position: [0.0, 0.0, 0.0],
            spot_intensity: 0.0,
            spot_direction: [0.0, -1.0, 0.0],
            spot_angle: 45.0_f32.to_radians(),
            spot_color: [1.0, 1.0, 1.0],
            spot_penumbra: 0.1,
            spot_range: 10.0,
            spot_decay: 1.0,
            point_decay_0: 1.0,
            point_decay_1: 1.0,
            physically_correct_lights: 0.0,
            exposure: 1.0,
            tone_mapping: 1.0,
            _padding: [0.0; 1],
        }
    }
}

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct ShadowUniform {
    pub dir_light_vp: [[f32; 4]; 4],
    pub spot_light_vp: [[f32; 4]; 4],
    pub shadow_bias: f32,
    pub shadow_radius: f32,
    pub dir_shadow_enabled: f32,
    pub spot_shadow_enabled: f32,
}

impl ShadowUniform {
    pub fn new() -> Self {
        Self {
            dir_light_vp: Mat4::IDENTITY.to_cols_array_2d(),
            spot_light_vp: Mat4::IDENTITY.to_cols_array_2d(),
            shadow_bias: 0.0005,
            shadow_radius: 2.0,
            dir_shadow_enabled: 0.0,
            spot_shadow_enabled: 0.0,
        }
    }

    pub fn update_directional(&mut self, vp_matrix: Mat4, enabled: bool, bias: f32, radius: f32) {
        self.dir_light_vp = vp_matrix.to_cols_array_2d();
        self.dir_shadow_enabled = if enabled { 1.0 } else { 0.0 };
        self.shadow_bias = bias;
        self.shadow_radius = radius;
    }

    pub fn update_spot(&mut self, vp_matrix: Mat4, enabled: bool) {
        self.spot_light_vp = vp_matrix.to_cols_array_2d();
        self.spot_shadow_enabled = if enabled { 1.0 } else { 0.0 };
    }
}

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct InstanceRaw {
    model: [[f32; 4]; 4],
    color: [f32; 3],
    metallic_roughness: [f32; 2],
    _padding: [f32; 3],
}

impl InstanceRaw {
    pub fn from_matrix(model: Mat4) -> Self {
        Self {
            model: model.to_cols_array_2d(),
            color: [0.7, 0.7, 0.7],
            metallic_roughness: [0.0, 0.5],
            _padding: [0.0; 3],
        }
    }

    pub fn with_material(model: Mat4, color: [f32; 3], metallic: f32, roughness: f32) -> Self {
        Self {
            model: model.to_cols_array_2d(),
            color,
            metallic_roughness: [metallic, roughness],
            _padding: [0.0; 3],
        }
    }

    pub fn desc() -> wgpu::VertexBufferLayout<'static> {
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<InstanceRaw>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Instance,
            attributes: &[
                wgpu::VertexAttribute {
                    offset: 0,
                    shader_location: 5,
                    format: wgpu::VertexFormat::Float32x4,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 4]>() as wgpu::BufferAddress,
                    shader_location: 6,
                    format: wgpu::VertexFormat::Float32x4,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 8]>() as wgpu::BufferAddress,
                    shader_location: 7,
                    format: wgpu::VertexFormat::Float32x4,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 12]>() as wgpu::BufferAddress,
                    shader_location: 8,
                    format: wgpu::VertexFormat::Float32x4,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 16]>() as wgpu::BufferAddress,
                    shader_location: 9,
                    format: wgpu::VertexFormat::Float32x3,
                },
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 19]>() as wgpu::BufferAddress,
                    shader_location: 10,
                    format: wgpu::VertexFormat::Float32x2,
                },
            ],
        }
    }
}

/// Refactored RenderPipeline using extracted modules
pub struct RenderPipeline {
    pub opaque_pipeline: wgpu::RenderPipeline,
    pub transparent_pipeline: wgpu::RenderPipeline,
    pub camera_bind_group: wgpu::BindGroup,
    pub camera_buffer: wgpu::Buffer,
    pub light_buffer: wgpu::Buffer,
    pub texture_bind_group_layout: wgpu::BindGroupLayout,
    pub material_bind_group_layout: wgpu::BindGroupLayout,
    pub shadow_bind_group_layout: wgpu::BindGroupLayout,
    pub shadow_uniform_only_layout: wgpu::BindGroupLayout,
    pub shadow_pipeline: wgpu::RenderPipeline,
    pub shadow_buffer: wgpu::Buffer,
    pub empty_bind_group: wgpu::BindGroup,
}

impl RenderPipeline {
    pub fn new(device: &wgpu::Device, config: &wgpu::SurfaceConfiguration) -> Self {
        // Create layouts
        let layouts = PipelineLayouts::new(device, config);

        // Create main pipeline layout
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Render Pipeline Layout"),
            bind_group_layouts: &[
                &layouts.camera_bind_group_layout,
                &layouts.texture_bind_group_layout,
                &layouts.material_bind_group_layout,
                &layouts.shadow_bind_group_layout,
            ],
            push_constant_ranges: &[],
        });

        // Create shadow pipeline layout
        let shadow_pipeline_layout =
            device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some("Shadow Pipeline Layout"),
                bind_group_layouts: &[
                    &layouts.empty_bind_group_layout,
                    &layouts.empty_bind_group_layout,
                    &layouts.empty_bind_group_layout,
                    &layouts.shadow_uniform_only_layout,
                ],
                push_constant_ranges: &[],
            });

        // Create graphics pipelines
        let graphics = GraphicsPipelines::new(device, config, &pipeline_layout);

        // Create shadow pipeline
        let shadow = ShadowPipeline::new(device, &shadow_pipeline_layout);

        Self {
            opaque_pipeline: graphics.opaque,
            transparent_pipeline: graphics.transparent,
            camera_bind_group: layouts.camera_bind_group,
            camera_buffer: layouts.camera_buffer,
            light_buffer: layouts.light_buffer,
            texture_bind_group_layout: layouts.texture_bind_group_layout,
            material_bind_group_layout: layouts.material_bind_group_layout,
            shadow_bind_group_layout: layouts.shadow_bind_group_layout,
            shadow_uniform_only_layout: layouts.shadow_uniform_only_layout,
            shadow_pipeline: shadow.pipeline,
            shadow_buffer: layouts.shadow_buffer,
            empty_bind_group: layouts.empty_bind_group,
        }
    }

    pub fn update_camera(&self, queue: &wgpu::Queue, view_proj: Mat4, camera_pos: Vec3) {
        let mut camera_uniform = CameraUniform::new();
        camera_uniform.update_view_proj(view_proj, camera_pos);
        queue.write_buffer(
            &self.camera_buffer,
            0,
            bytemuck::cast_slice(&[camera_uniform]),
        );
    }

    pub fn update_lights(&self, queue: &wgpu::Queue, lights: &LightUniform) {
        queue.write_buffer(&self.light_buffer, 0, bytemuck::cast_slice(&[*lights]));
    }

    pub fn update_shadows(&self, queue: &wgpu::Queue, shadows: &ShadowUniform) {
        queue.write_buffer(&self.shadow_buffer, 0, bytemuck::cast_slice(&[*shadows]));
    }

    pub fn create_multi_texture_bind_group(
        &self,
        device: &wgpu::Device,
        albedo_view: &wgpu::TextureView,
        normal_view: &wgpu::TextureView,
        metallic_view: &wgpu::TextureView,
        roughness_view: &wgpu::TextureView,
        emissive_view: &wgpu::TextureView,
        occlusion_view: &wgpu::TextureView,
        sampler: &wgpu::Sampler,
    ) -> wgpu::BindGroup {
        BindGroupFactory::textures(
            device,
            &self.texture_bind_group_layout,
            albedo_view,
            normal_view,
            metallic_view,
            roughness_view,
            emissive_view,
            occlusion_view,
            sampler,
        )
    }

    pub fn create_material_bind_group(
        &self,
        device: &wgpu::Device,
        material_buffer: &wgpu::Buffer,
    ) -> wgpu::BindGroup {
        BindGroupFactory::material(device, &self.material_bind_group_layout, material_buffer)
    }

    pub fn create_shadow_uniform_bind_group(&self, device: &wgpu::Device) -> wgpu::BindGroup {
        BindGroupFactory::shadow_uniform_only(
            device,
            &self.shadow_uniform_only_layout,
            &self.shadow_buffer,
        )
    }

    pub fn create_shadow_bind_group(
        &self,
        device: &wgpu::Device,
        shadow_view: &wgpu::TextureView,
        compare_sampler: &wgpu::Sampler,
    ) -> wgpu::BindGroup {
        BindGroupFactory::shadow(
            device,
            &self.shadow_bind_group_layout,
            &self.shadow_buffer,
            shadow_view,
            compare_sampler,
        )
    }
}
