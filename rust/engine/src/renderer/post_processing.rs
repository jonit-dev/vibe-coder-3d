/// Post-processing utilities for camera-driven color grading and exposure
use three_d::{
    apply_screen_effect, ColorMapping, ColorTexture, DepthTexture, Effect, Light, Program,
    RenderTarget, ToneMapping, Vec3,
};

use super::camera_loader::CameraConfig;

/// Post-processing parameters derived from camera configuration
#[derive(Debug, Clone)]
pub struct PostProcessSettings {
    pub exposure: f32,
    pub contrast: f32,
    pub saturation: f32,
    pub brightness: f32,
    pub tint: Vec3,
    pub apply_tone_mapping: bool,
}

impl PostProcessSettings {
    /// Default settings (no-op)
    pub fn identity() -> Self {
        Self {
            exposure: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            brightness: 0.0,
            tint: Vec3::new(1.0, 1.0, 1.0),
            apply_tone_mapping: false,
        }
    }

    /// Determine post-processing parameters from the camera configuration.
    /// Returns `None` when no modifications are required.
    pub fn from_camera(config: &CameraConfig) -> Option<Self> {
        let mut settings = Self::identity();
        let mut dirty = false;

        // Exposure is driven by toneMappingExposure regardless of HDR flag
        if (config.tone_mapping_exposure - 1.0).abs() > f32::EPSILON {
            settings.exposure = config.tone_mapping_exposure.max(0.0);
            dirty = true;
        }

        // Tone mapping and HDR both require the effect to run to avoid double application later
        if config.hdr {
            settings.apply_tone_mapping = true;
            dirty = true;
        }

        if config.enable_post_processing {
            if let Some(preset) = config.post_processing_preset.as_deref() {
                match preset {
                    "cinematic" => {
                        settings.exposure *= 1.1;
                        settings.contrast = 1.15;
                        settings.saturation = 1.08;
                        settings.brightness = -0.02;
                        settings.tint = Vec3::new(1.05, 0.98, 0.92);
                        dirty = true;
                    }
                    "realistic" => {
                        settings.contrast = 1.05;
                        settings.saturation = 1.0;
                        dirty = true;
                    }
                    "stylized" => {
                        settings.exposure *= 1.05;
                        settings.contrast = 1.25;
                        settings.saturation = 1.2;
                        settings.brightness = 0.03;
                        settings.tint = Vec3::new(0.95, 1.0, 1.08);
                        dirty = true;
                    }
                    "none" => {} // explicit no-op
                    _ => {}
                }
            }
        }

        if dirty {
            Some(settings)
        } else {
            None
        }
    }
}

/// Lightweight color grading effect with exposure, tint, and simple grading controls
#[derive(Clone)]
pub struct ColorGradingEffect {
    pub exposure: f32,
    pub contrast: f32,
    pub saturation: f32,
    pub brightness: f32,
    pub tint: Vec3,
    pub apply_tone_mapping: bool,
}

impl From<PostProcessSettings> for ColorGradingEffect {
    fn from(settings: PostProcessSettings) -> Self {
        Self {
            exposure: settings.exposure,
            contrast: settings.contrast,
            saturation: settings.saturation,
            brightness: settings.brightness,
            tint: settings.tint,
            apply_tone_mapping: settings.apply_tone_mapping,
        }
    }
}

impl Effect for ColorGradingEffect {
    fn fragment_shader_source(
        &self,
        _lights: &[&dyn Light],
        color_texture: Option<ColorTexture>,
        depth_texture: Option<DepthTexture>,
    ) -> String {
        let color_sampling = color_texture
            .map(|t| t.fragment_shader_source())
            .unwrap_or_default();
        let depth_sampling = depth_texture
            .map(|t| t.fragment_shader_source())
            .unwrap_or_default();

        let tone_mapping_src = if self.apply_tone_mapping {
            ToneMapping::fragment_shader_source().to_string()
        } else {
            String::new()
        };
        let color_mapping_src = if self.apply_tone_mapping {
            ColorMapping::fragment_shader_source().to_string()
        } else {
            String::new()
        };

        format!(
            r#"{color_sampling}{depth_sampling}{tone_mapping_src}{color_mapping_src}

            uniform float ppExposure;
            uniform float ppContrast;
            uniform float ppSaturation;
            uniform float ppBrightness;
            uniform vec3 ppTint;

            in vec2 uvs;
            layout (location = 0) out vec4 outColor;

            vec3 apply_contrast(vec3 color, float contrast) {{
                return (color - 0.5) * contrast + 0.5;
            }}

            vec3 apply_saturation(vec3 color, float saturation) {{
                float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
                return mix(vec3(luma), color, saturation);
            }}

            void main() {{
                vec4 sampled = {sample_color};
                vec3 rgb = sampled.rgb;

                rgb *= ppExposure;
                rgb = apply_contrast(rgb, ppContrast);
                rgb = apply_saturation(rgb, ppSaturation);
                rgb += vec3(ppBrightness);
                rgb *= ppTint;

                {tone_map_call}
                {color_map_call}

                rgb = clamp(rgb, 0.0, 1.0);
                outColor = vec4(rgb, sampled.a);
                {depth_copy}
            }}
        "#,
            color_sampling = color_sampling,
            depth_sampling = depth_sampling,
            tone_mapping_src = tone_mapping_src,
            color_mapping_src = color_mapping_src,
            sample_color = if color_texture.is_some() {
                "sample_color(uvs)".to_string()
            } else {
                "vec4(0.0)".to_string()
            },
            tone_map_call = if self.apply_tone_mapping {
                "rgb = tone_mapping(rgb);"
            } else {
                ""
            },
            color_map_call = if self.apply_tone_mapping {
                "rgb = color_mapping(rgb);"
            } else {
                ""
            },
            depth_copy = if depth_texture.is_some() {
                "gl_FragDepth = sample_depth(uvs);"
            } else {
                ""
            }
        )
    }

    fn id(&self, color_texture: Option<ColorTexture>, depth_texture: Option<DepthTexture>) -> u16 {
        let mut id = 0b1u16 << 14;
        if self.apply_tone_mapping {
            id |= 0b1u16 << 13;
        }
        id | color_texture.map(|t| t.id()).unwrap_or(0) | depth_texture.map(|t| t.id()).unwrap_or(0)
    }

    fn fragment_attributes(&self) -> three_d::FragmentAttributes {
        three_d::FragmentAttributes {
            uv: true,
            ..three_d::FragmentAttributes::NONE
        }
    }

    fn use_uniforms(
        &self,
        program: &Program,
        camera: &three_d::Camera,
        _lights: &[&dyn Light],
        color_texture: Option<ColorTexture>,
        depth_texture: Option<DepthTexture>,
    ) {
        if let Some(color_texture) = color_texture {
            color_texture.use_uniforms(program);
        }
        if let Some(depth_texture) = depth_texture {
            depth_texture.use_uniforms(program);
        }

        program.use_uniform("ppExposure", self.exposure);
        program.use_uniform("ppContrast", self.contrast);
        program.use_uniform("ppSaturation", self.saturation);
        program.use_uniform("ppBrightness", self.brightness);
        program.use_uniform("ppTint", self.tint);

        if self.apply_tone_mapping {
            camera.tone_mapping.use_uniforms(program);
            camera.color_mapping.use_uniforms(program);
        }
    }

    fn render_states(&self) -> three_d::RenderStates {
        three_d::RenderStates {
            depth_test: three_d::DepthTest::Always,
            ..Default::default()
        }
    }
}

/// Apply the post-processing effect to the given screen render target.
pub fn apply_post_processing<'a>(
    screen: &RenderTarget<'a>,
    effect: ColorGradingEffect,
    camera: &three_d::Camera,
    color_texture: ColorTexture<'a>,
) {
    screen.apply_screen_effect(&effect, camera, &[], Some(color_texture), None);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_config() -> CameraConfig {
        CameraConfig {
            position: Vec3::new(0.0, 0.0, 0.0),
            target: Vec3::new(0.0, 0.0, -1.0),
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            is_main: true,
            projection_type: "perspective".to_string(),
            orthographic_size: 10.0,
            depth: 0,
            clear_flags: Some("solidColor".to_string()),
            background_color: Some((0.0, 0.0, 0.0, 1.0)),
            skybox_texture: None,
            control_mode: None,
            enable_smoothing: false,
            follow_target: None,
            follow_offset: None,
            smoothing_speed: 5.0,
            rotation_smoothing: 5.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: Some("aces".to_string()),
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        }
    }

    #[test]
    fn exposure_triggers_settings() {
        let mut config = make_config();
        config.tone_mapping_exposure = 1.5;

        let settings = PostProcessSettings::from_camera(&config).unwrap();
        assert!((settings.exposure - 1.5).abs() < f32::EPSILON);
    }

    #[test]
    fn cinematic_changes_parameters() {
        let mut config = make_config();
        config.enable_post_processing = true;
        config.post_processing_preset = Some("cinematic".to_string());

        let settings = PostProcessSettings::from_camera(&config).unwrap();
        assert!(settings.contrast > 1.0);
        assert!(settings.saturation > 1.0);
    }

    #[test]
    fn no_changes_returns_none() {
        let config = make_config();
        assert!(PostProcessSettings::from_camera(&config).is_none());
    }
}
