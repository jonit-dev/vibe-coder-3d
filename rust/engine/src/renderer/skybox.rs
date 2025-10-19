/// Skybox rendering
///
/// Implements textured skybox rendering with intensity, blur and rotation support.
use std::sync::Arc;

use anyhow::{Context as AnyhowContext, Result};
use three_d::{
    Camera, ClearState, ColorMapping, ColorMaterial, Context, CpuMesh, CpuTexture, Deg, Effect,
    Light, Mat3, Mat4, Mesh, Program, RenderStates, RenderTarget, Skybox, SquareMatrix, Srgba,
    ToneMapping, Vec2, Vec3,
};

use super::camera_loader::CameraConfig;

/// Internal skybox instance with associated effect parameters
struct SkyboxInstance {
    skybox: Skybox,
    texture: Arc<three_d::TextureCubeMap>,
    intensity: f32,
    blur: f32,
    rotation: Mat3,
    scale: Vec3,
    tint: Vec3,
    max_lod: f32,
    repeat: Vec2,
    offset: Vec2,
}

impl SkyboxInstance {
    fn to_effect(&self) -> SkyboxEffect {
        SkyboxEffect {
            texture: Arc::clone(&self.texture),
            intensity: self.intensity,
            lod: (self.blur.clamp(0.0, 1.0)) * self.max_lod,
            rotation: self.rotation,
            scale: self.scale,
            tint: self.tint,
            repeat: self.repeat,
            offset: self.offset,
        }
    }
}

/// Skybox renderer for background environment
pub struct SkyboxRenderer {
    textured: Option<SkyboxInstance>,
    fallback: Option<Mesh>,
    fallback_color: ColorMaterial,
}

impl SkyboxRenderer {
    /// Create a new skybox renderer
    pub fn new() -> Self {
        Self {
            textured: None,
            fallback: None,
            fallback_color: ColorMaterial::default(),
        }
    }

    /// Load skybox from camera configuration
    /// Returns true if a skybox was loaded, false otherwise
    pub async fn load_from_config(
        &mut self,
        context: &Context,
        config: &CameraConfig,
    ) -> Result<bool> {
        self.textured = None;
        self.fallback = None;

        let texture_path = match config.skybox_texture.as_deref() {
            Some(path) if !path.is_empty() => path,
            _ => {
                log::info!("Skybox: No texture specified");
                return Ok(false);
            }
        };

        log::info!("Loading skybox from: {}", texture_path);
        log::info!("  Intensity: {}", config.skybox_intensity);
        log::info!("  Blur: {}", config.skybox_blur);
        log::info!("  Scale: {:?}", config.skybox_scale);
        log::info!("  Rotation: {:?}", config.skybox_rotation);
        log::info!("  Repeat: {:?}", config.skybox_repeat);
        log::info!("  Offset: {:?}", config.skybox_offset);

        // Resolve path: /assets/... -> ../game/assets/... (same as texture loading)
        let resolved_path = if texture_path.starts_with("/assets/") {
            format!("../game{}", texture_path)
        } else if texture_path.starts_with("assets/") {
            format!("../game/{}", texture_path)
        } else {
            texture_path.to_string()
        };

        log::debug!("Resolved skybox path: {} -> {}", texture_path, resolved_path);

        // Load texture via three-d asset loader
        let mut loaded = match three_d_asset::io::load_async(&[&resolved_path]).await {
            Ok(assets) => assets,
            Err(err) => {
                log::warn!(
                    "Failed to load skybox texture '{}': {}. Falling back to solid color sky.",
                    texture_path,
                    err
                );
                self.build_fallback(context, config);
                return Ok(false);
            }
        };

        let cpu_texture: CpuTexture = match loaded.deserialize("") {
            Ok(tex) => tex,
            Err(err) => {
                log::warn!(
                    "Failed to deserialize skybox texture '{}': {}. Falling back to solid color sky.",
                    texture_path,
                    err
                );
                self.build_fallback(context, config);
                return Ok(false);
            }
        };

        let skybox = Skybox::new_from_equirectangular(context, &cpu_texture);
        let texture = Arc::clone(skybox.texture());

        let rotation = config.skybox_rotation.map_or(Mat3::identity(), |rot| {
            Mat3::from_angle_z(Deg(rot.z))
                * Mat3::from_angle_y(Deg(rot.y))
                * Mat3::from_angle_x(Deg(rot.x))
        });

        let scale = config
            .skybox_scale
            .map(|s| Vec3::new(s.x.max(0.001), s.y.max(0.001), s.z.max(0.001)))
            .unwrap_or(Vec3::new(1.0, 1.0, 1.0));

        let tint = Vec3::new(1.0, 1.0, 1.0);

        let repeat = config.skybox_repeat.unwrap_or((1.0, 1.0));
        let repeat_vec = Vec2::new(repeat.0.max(0.0001), repeat.1.max(0.0001));

        let offset = config.skybox_offset.unwrap_or((0.0, 0.0));
        let offset_vec = Vec2::new(offset.0, offset.1);

        let max_dimension = texture.width().max(texture.height()).max(1) as f32;
        let max_lod = max_dimension.log2().max(0.0);

        self.textured = Some(SkyboxInstance {
            skybox,
            texture,
            intensity: config.skybox_intensity.max(0.0),
            blur: config.skybox_blur.clamp(0.0, 1.0),
            rotation,
            scale,
            tint,
            max_lod,
            repeat: repeat_vec,
            offset: offset_vec,
        });

        self.fallback = None;

        log::info!("Skybox texture loaded successfully");
        Ok(true)
    }

    fn build_fallback(&mut self, context: &Context, config: &CameraConfig) {
        log::info!("Skybox: Using fallback solid color sphere");

        let mut cpu_mesh = CpuMesh::sphere(32);

        if let Some(normals) = cpu_mesh.normals.as_mut() {
            for normal in normals.iter_mut() {
                *normal = -*normal;
            }
        }

        let mesh = Mesh::new(context, &cpu_mesh);

        let color = if let Some(bg_color) = config.background_color {
            Srgba::new(
                (bg_color.0 * 255.0) as u8,
                (bg_color.1 * 255.0) as u8,
                (bg_color.2 * 255.0) as u8,
                (bg_color.3 * 255.0) as u8,
            )
        } else {
            Srgba::new(135, 206, 235, 255)
        };

        let transform = config
            .skybox_scale
            .map(|s| Mat4::from_nonuniform_scale(s.x, s.y, s.z))
            .unwrap_or(Mat4::from_scale(500.0));

        let mut fallback_mesh = mesh;
        fallback_mesh.set_transformation(transform);

        self.fallback_color = ColorMaterial {
            color,
            render_states: RenderStates {
                depth_test: three_d::DepthTest::LessOrEqual,
                cull: three_d::Cull::Front,
                ..Default::default()
            },
            ..Default::default()
        };
        self.fallback = Some(fallback_mesh);
    }

    /// Render the skybox.
    /// Skybox should be rendered BEFORE scene geometry with depth reset.
    pub fn render(&self, render_target: &RenderTarget, camera: &Camera) {
        if let Some(instance) = &self.textured {
            render_target.clear_partially(
                camera.viewport().into(),
                ClearState::depth(1.0), // ensure skybox renders behind scene
            );

            let effect = instance.to_effect();
            render_target.render_with_effect(&effect, camera, [&instance.skybox], &[], None, None);
        } else if let Some(ref mesh) = self.fallback {
            render_target
                .clear_partially(camera.viewport().into(), ClearState::depth(1.0))
                .render_with_material(&self.fallback_color, camera, [mesh], &[]);
        }
    }

    /// Check if a textured skybox is loaded
    pub fn is_loaded(&self) -> bool {
        self.textured.is_some()
    }

    /// Clear the current skybox
    pub fn clear(&mut self) {
        self.textured = None;
        self.fallback = None;
    }
}

impl Default for SkyboxRenderer {
    fn default() -> Self {
        Self::new()
    }
}

/// Skybox effect used to apply intensity, blur and tint
struct SkyboxEffect {
    texture: Arc<three_d::TextureCubeMap>,
    intensity: f32,
    lod: f32,
    rotation: Mat3,
    scale: Vec3,
    tint: Vec3,
    repeat: Vec2,
    offset: Vec2,
}

impl Effect for SkyboxEffect {
    fn fragment_shader_source(
        &self,
        _lights: &[&dyn Light],
        _color_texture: Option<three_d::ColorTexture>,
        _depth_texture: Option<three_d::DepthTexture>,
    ) -> String {
        format!(
            r#"{tone}{color}

            uniform samplerCube texture0;
            uniform float intensity;
            uniform float lodLevel;
            uniform mat3 skyRotation;
            uniform vec3 skyScale;
            uniform vec3 skyTint;
            uniform vec2 skyRepeat;
            uniform vec2 skyOffset;

            const float PI = 3.1415926535897932384626433832795;

            vec3 apply_repeat_offset(vec3 direction) {{
                vec3 dir = normalize(direction);
                float yaw = atan(dir.z, dir.x);
                float pitch = asin(clamp(dir.y, -1.0, 1.0));

                vec2 uv;
                uv.x = yaw / (2.0 * PI) + 0.5;
                uv.y = 0.5 - pitch / PI;

                vec2 transformed = uv * skyRepeat + skyOffset;
                transformed = fract(transformed);

                float newYaw = (transformed.x - 0.5) * 2.0 * PI;
                float newPitch = (0.5 - transformed.y) * PI;

                vec3 result;
                result.x = cos(newPitch) * cos(newYaw);
                result.y = sin(newPitch);
                result.z = cos(newPitch) * sin(newYaw);
                return normalize(result);
            }}

            in vec3 coords;
            layout (location = 0) out vec4 outColor;

            void main() {{
                vec3 direction = normalize(skyRotation * (coords * skyScale));
                direction = apply_repeat_offset(direction);
                vec3 color = textureLod(texture0, direction, lodLevel).rgb;
                color = color * intensity * skyTint;
                color = tone_mapping(color);
                color = color_mapping(color);
                outColor = vec4(color, 1.0);
            }}
        "#,
            tone = ToneMapping::fragment_shader_source(),
            color = ColorMapping::fragment_shader_source()
        )
    }

    fn id(
        &self,
        _color_texture: Option<three_d::ColorTexture>,
        _depth_texture: Option<three_d::DepthTexture>,
    ) -> u16 {
        0b1u16 << 15 | 0b1u16 << 14
    }

    fn fragment_attributes(&self) -> three_d::FragmentAttributes {
        three_d::FragmentAttributes::NONE
    }

    fn use_uniforms(
        &self,
        program: &Program,
        camera: &Camera,
        _lights: &[&dyn Light],
        _color_texture: Option<three_d::ColorTexture>,
        _depth_texture: Option<three_d::DepthTexture>,
    ) {
        program.use_texture_cube("texture0", &self.texture);
        program.use_uniform("intensity", self.intensity);
        program.use_uniform("lodLevel", self.lod);
        program.use_uniform("skyRotation", self.rotation);
        program.use_uniform("skyScale", self.scale);
        program.use_uniform("skyTint", self.tint);
        program.use_uniform("skyRepeat", self.repeat);
        program.use_uniform("skyOffset", self.offset);
        camera.tone_mapping.use_uniforms(program);
        camera.color_mapping.use_uniforms(program);
    }

    fn render_states(&self) -> RenderStates {
        RenderStates {
            depth_test: three_d::DepthTest::LessOrEqual,
            cull: three_d::Cull::Front,
            ..Default::default()
        }
    }
}
