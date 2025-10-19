/// Skybox rendering
///
/// Implements textured skybox rendering with intensity, blur and rotation support.
use std::sync::Arc;

use anyhow::{Context as AnyhowContext, Result};
use three_d::{
    Camera, ClearState, ColorMapping, ColorMaterial, Context, CpuMesh, CpuTexture, Effect, Light,
    Mat3, Mat4, Mesh, Program, RenderStates, RenderTarget, Skybox, Srgba, ToneMapping, Vec3,
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

        // Load texture via three-d asset loader
        let mut loaded = match three_d_asset::io::load_async(&[texture_path]).await {
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
            let x = rot.x.to_radians();
            let y = rot.y.to_radians();
            let z = rot.z.to_radians();
            Mat3::from_angle_z(z) * Mat3::from_angle_y(y) * Mat3::from_angle_x(x)
        });

        let scale = config
            .skybox_scale
            .map(|s| Vec3::new(s.x.max(0.001), s.y.max(0.001), s.z.max(0.001)))
            .unwrap_or(Vec3::new(1.0, 1.0, 1.0));

        let tint = Vec3::new(1.0, 1.0, 1.0);

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
            .unwrap_or(Mat4::from_uniform_scale(500.0));

        let mut gm = mesh;
        gm.set_transformation(transform);

        self.fallback_color = ColorMaterial {
            color,
            render_states: RenderStates {
                depth_test: three_d::DepthTest::LessOrEqual,
                cull: three_d::Cull::Front,
                ..Default::default()
            },
            ..Default::default()
        };
        self.fallback = Some(gm);
    }

    /// Render the skybox.
    /// Skybox should be rendered BEFORE scene geometry with depth reset.
    pub fn render(&self, render_target: &RenderTarget, camera: &Camera) {
        if let Some(instance) = &self.textured {
            render_target.clear_partially(
                camera.viewport(),
                ClearState::depth(1.0), // ensure skybox renders behind scene
            );

            let effect = instance.to_effect();
            render_target.render_with_effect(&effect, camera, [&instance.skybox], &[], None, None);
        } else if let Some(ref mesh) = self.fallback {
            render_target
                .clear_partially(camera.viewport(), ClearState::depth(1.0))
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

            in vec3 coords;
            layout (location = 0) out vec4 outColor;

            void main() {{
                vec3 direction = normalize(skyRotation * (coords * skyScale));
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
