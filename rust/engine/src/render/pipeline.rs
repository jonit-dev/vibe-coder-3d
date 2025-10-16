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
    pub physically_correct_lights: f32, // 1.0 = on
    pub exposure: f32,                  // toneMappingExposure
    pub tone_mapping: f32,              // 1.0 = ACES on
    _padding: [f32; 1],                 // align to 16 bytes
}

impl LightUniform {
    pub fn new() -> Self {
        Self {
            // Default directional light (like Three.js default)
            directional_direction: [0.5, 1.0, 0.5],
            directional_intensity: 1.0,
            directional_color: [1.0, 1.0, 1.0],
            directional_enabled: 1.0,

            // Default ambient light
            ambient_color: [0.3, 0.3, 0.3],
            ambient_intensity: 1.0,

            // No point lights by default
            point_position_0: [0.0, 0.0, 0.0],
            point_intensity_0: 0.0,
            point_color_0: [1.0, 1.0, 1.0],
            point_range_0: 10.0,

            point_position_1: [0.0, 0.0, 0.0],
            point_intensity_1: 0.0,
            point_color_1: [1.0, 1.0, 1.0],
            point_range_1: 10.0,

            // No spot light by default
            spot_position: [0.0, 0.0, 0.0],
            spot_intensity: 0.0,
            spot_direction: [0.0, -1.0, 0.0], // pointing down
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

/// Shadow uniform data for shadow mapping
#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct ShadowUniform {
    /// Directional light view-projection matrix
    pub dir_light_vp: [[f32; 4]; 4],
    /// Spot light view-projection matrix
    pub spot_light_vp: [[f32; 4]; 4],
    /// Shadow bias to reduce shadow acne
    pub shadow_bias: f32,
    /// Shadow radius for PCF soft shadows (in texel units)
    pub shadow_radius: f32,
    /// Directional shadow enabled (1.0 = enabled, 0.0 = disabled)
    pub dir_shadow_enabled: f32,
    /// Spot shadow enabled (1.0 = enabled, 0.0 = disabled)
    pub spot_shadow_enabled: f32,
}

impl ShadowUniform {
    pub fn new() -> Self {
        Self {
            dir_light_vp: Mat4::IDENTITY.to_cols_array_2d(),
            spot_light_vp: Mat4::IDENTITY.to_cols_array_2d(),
            shadow_bias: 0.0005,      // Default bias to reduce acne
            shadow_radius: 2.0,       // Default radius for soft shadows
            dir_shadow_enabled: 0.0,  // Disabled by default
            spot_shadow_enabled: 0.0, // Disabled by default
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
    _padding: [f32; 3], // Align to 16 bytes
}

impl InstanceRaw {
    pub fn from_matrix(model: Mat4) -> Self {
        Self {
            model: model.to_cols_array_2d(),
            color: [0.7, 0.7, 0.7], // Default gray
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
                // Model matrix (4x vec4)
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
                // Color (vec3)
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 16]>() as wgpu::BufferAddress,
                    shader_location: 9,
                    format: wgpu::VertexFormat::Float32x3,
                },
                // Metallic + Roughness (vec2)
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 19]>() as wgpu::BufferAddress,
                    shader_location: 10,
                    format: wgpu::VertexFormat::Float32x2,
                },
            ],
        }
    }
}

pub struct RenderPipeline {
    pub opaque_pipeline: wgpu::RenderPipeline,
    pub transparent_pipeline: wgpu::RenderPipeline,
    pub camera_bind_group: wgpu::BindGroup,
    pub camera_buffer: wgpu::Buffer,
    pub light_buffer: wgpu::Buffer,
    pub texture_bind_group_layout: wgpu::BindGroupLayout,
    pub material_bind_group_layout: wgpu::BindGroupLayout,
    // Shadow mapping resources
    pub shadow_bind_group_layout: wgpu::BindGroupLayout,
    pub shadow_uniform_only_layout: wgpu::BindGroupLayout, // For shadow pass (uniform only)
    pub shadow_pipeline: wgpu::RenderPipeline,
    pub shadow_buffer: wgpu::Buffer,
    pub empty_bind_group: wgpu::BindGroup, // For shadow pipeline unused slots
}

impl RenderPipeline {
    pub fn new(device: &wgpu::Device, config: &wgpu::SurfaceConfiguration) -> Self {
        // Create camera uniform buffer
        let camera_uniform = CameraUniform::new();
        let camera_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Camera Buffer"),
            contents: bytemuck::cast_slice(&[camera_uniform]),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        // Create lighting uniform buffer
        let light_uniform = LightUniform::new();
        let light_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Light Buffer"),
            contents: bytemuck::cast_slice(&[light_uniform]),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        // Create bind group layout
        let camera_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Uniform,
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Uniform,
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                ],
                label: Some("camera_bind_group_layout"),
            });

        // Create bind group
        let camera_bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &camera_bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: camera_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: light_buffer.as_entire_binding(),
                },
            ],
            label: Some("camera_bind_group"),
        });

        // Create texture bind group layout (group 1) - 6 texture slots + 1 sampler
        let texture_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[
                    // Binding 0: Albedo texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 1: Normal texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 2: Metallic texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 2,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 3: Roughness texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 3,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 4: Emissive texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 4,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 5: Occlusion texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 5,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    // Binding 6: Shared sampler for all textures
                    wgpu::BindGroupLayoutEntry {
                        binding: 6,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                        count: None,
                    },
                ],
                label: Some("texture_bind_group_layout"),
            });

        // Create material uniform bind group layout (group 2)
        let material_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                }],
                label: Some("material_bind_group_layout"),
            });

        // Create shadow uniform buffer (group 3)
        let shadow_uniform = ShadowUniform::new();
        let shadow_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Shadow Buffer"),
            contents: bytemuck::cast_slice(&[shadow_uniform]),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        // Create shadow bind group layout (group 3): uniform + depth texture + compare sampler
        let shadow_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[
                    // Binding 0: Shadow uniform
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Uniform,
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                    // Binding 1: Shadow map depth texture
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::FRAGMENT | wgpu::ShaderStages::VERTEX,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Depth,
                        },
                        count: None,
                    },
                    // Binding 2: Comparison sampler for shadow map
                    wgpu::BindGroupLayoutEntry {
                        binding: 2,
                        visibility: wgpu::ShaderStages::FRAGMENT | wgpu::ShaderStages::VERTEX,
                        ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Comparison),
                        count: None,
                    },
                ],
                label: Some("shadow_bind_group_layout"),
            });

        // Create shadow uniform-only bind group layout (for shadow pass)
        // Only contains the uniform buffer, not the shadow map texture/sampler
        let shadow_uniform_only_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[
                    // Binding 0: Shadow uniform
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::VERTEX,
                        ty: wgpu::BindingType::Buffer {
                            ty: wgpu::BufferBindingType::Uniform,
                            has_dynamic_offset: false,
                            min_binding_size: None,
                        },
                        count: None,
                    },
                ],
                label: Some("shadow_uniform_only_layout"),
            });

        // Load shader
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shader.wgsl").into()),
        });

        // Create pipeline layout with all bind group layouts
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Render Pipeline Layout"),
            bind_group_layouts: &[
                &camera_bind_group_layout,
                &texture_bind_group_layout,
                &material_bind_group_layout,
                &shadow_bind_group_layout,
            ],
            push_constant_ranges: &[],
        });

        // Create shadow-only pipeline layout
        // Shadow shader uses @group(3) for shadows, so we need 4 slots but only define group 3
        // Use empty bind group layouts for slots 0-2
        let empty_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[],
                label: Some("empty_bind_group_layout"),
            });

        // Create empty bind group for unused slots
        let empty_bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &empty_bind_group_layout,
            entries: &[],
            label: Some("empty_bind_group"),
        });

        let shadow_pipeline_layout =
            device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some("Shadow Pipeline Layout"),
                bind_group_layouts: &[
                    &empty_bind_group_layout,    // group 0 (unused)
                    &empty_bind_group_layout,    // group 1 (unused)
                    &empty_bind_group_layout,    // group 2 (unused)
                    &shadow_uniform_only_layout, // group 3 (uniform only, no texture)
                ],
                push_constant_ranges: &[],
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

        let opaque_fragment = wgpu::FragmentState {
            module: &shader,
            entry_point: "fs_main",
            targets: &[Some(wgpu::ColorTargetState {
                format: config.format,
                blend: None,
                write_mask: wgpu::ColorWrites::ALL,
            })],
        };

        let transparent_fragment = wgpu::FragmentState {
            module: &shader,
            entry_point: "fs_main",
            targets: &[Some(wgpu::ColorTargetState {
                format: config.format,
                blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                write_mask: wgpu::ColorWrites::ALL,
            })],
        };

        let opaque_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline (Opaque)"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &vertex_buffers,
            },
            fragment: Some(opaque_fragment),
            primitive: primitive_state,
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            multisample: multisample_state,
            multiview: None,
        });

        let transparent_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline (Transparent)"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &vertex_buffers,
            },
            fragment: Some(transparent_fragment),
            primitive: primitive_state,
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: false,
                depth_compare: wgpu::CompareFunction::LessEqual,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            multisample: multisample_state,
            multiview: None,
        });

        // Create depth-only shadow pipeline for rendering caster depth from light POV
        let shadow_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Shadow Pipeline (Depth-only)"),
            layout: Some(&shadow_pipeline_layout), // Use shadow-specific layout
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_shadow",
                buffers: &vertex_buffers,
            },
            fragment: None, // depth-only
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: Some(wgpu::Face::Back),
                polygon_mode: wgpu::PolygonMode::Fill,
                unclipped_depth: false,
                conservative: false,
            },
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            multisample: multisample_state,
            multiview: None,
        });

        Self {
            opaque_pipeline,
            transparent_pipeline,
            camera_bind_group,
            camera_buffer,
            light_buffer,
            texture_bind_group_layout,
            material_bind_group_layout,
            shadow_bind_group_layout,
            shadow_uniform_only_layout,
            shadow_pipeline,
            shadow_buffer,
            empty_bind_group,
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

    /// Update shadow uniform buffer
    pub fn update_shadows(&self, queue: &wgpu::Queue, shadows: &ShadowUniform) {
        queue.write_buffer(&self.shadow_buffer, 0, bytemuck::cast_slice(&[*shadows]));
    }

    /// Create a texture bind group with all 6 texture slots
    /// Textures are provided in order: albedo, normal, metallic, roughness, emissive, occlusion
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
        device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &self.texture_bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(albedo_view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(normal_view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::TextureView(metallic_view),
                },
                wgpu::BindGroupEntry {
                    binding: 3,
                    resource: wgpu::BindingResource::TextureView(roughness_view),
                },
                wgpu::BindGroupEntry {
                    binding: 4,
                    resource: wgpu::BindingResource::TextureView(emissive_view),
                },
                wgpu::BindGroupEntry {
                    binding: 5,
                    resource: wgpu::BindingResource::TextureView(occlusion_view),
                },
                wgpu::BindGroupEntry {
                    binding: 6,
                    resource: wgpu::BindingResource::Sampler(sampler),
                },
            ],
            label: Some("multi_texture_bind_group"),
        })
    }

    /// Create a material uniform bind group
    pub fn create_material_bind_group(
        &self,
        device: &wgpu::Device,
        material_buffer: &wgpu::Buffer,
    ) -> wgpu::BindGroup {
        device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &self.material_bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: material_buffer.as_entire_binding(),
            }],
            label: Some("material_uniform_bind_group"),
        })
    }

    /// Create a shadow uniform-only bind group (for shadow pass)
    /// Only contains the shadow uniform buffer, not the shadow map texture
    pub fn create_shadow_uniform_bind_group(&self, device: &wgpu::Device) -> wgpu::BindGroup {
        device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &self.shadow_uniform_only_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: self.shadow_buffer.as_entire_binding(),
            }],
            label: Some("shadow_uniform_bind_group"),
        })
    }

    /// Create a shadow bind group for a given depth texture view and comparison sampler
    pub fn create_shadow_bind_group(
        &self,
        device: &wgpu::Device,
        shadow_view: &wgpu::TextureView,
        compare_sampler: &wgpu::Sampler,
    ) -> wgpu::BindGroup {
        device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &self.shadow_bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: self.shadow_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(shadow_view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Sampler(compare_sampler),
                },
            ],
            label: Some("shadow_bind_group"),
        })
    }
}
