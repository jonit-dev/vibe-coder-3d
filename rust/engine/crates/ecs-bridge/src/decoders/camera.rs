//! Camera component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use super::common::{default_alpha, deserialize_optional_vec2, deserialize_optional_vec3};
use crate::{ComponentCapabilities, IComponentDecoder};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CameraColor {
    #[serde(default)]
    pub r: f32,
    #[serde(default)]
    pub g: f32,
    #[serde(default)]
    pub b: f32,
    #[serde(default = "default_alpha")]
    pub a: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ViewportRect {
    #[serde(default)]
    pub x: f32,
    #[serde(default)]
    pub y: f32,
    #[serde(default = "default_one")]
    pub width: f32,
    #[serde(default = "default_one")]
    pub height: f32,
}

fn default_one() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CameraComponent {
    #[serde(default = "default_fov")]
    pub fov: f32,
    #[serde(default = "default_near")]
    pub near: f32,
    #[serde(default = "default_far")]
    pub far: f32,
    #[serde(default, rename = "isMain")]
    pub is_main: bool,
    #[serde(default = "default_projection_type", rename = "projectionType")]
    pub projection_type: String,
    #[serde(default = "default_orthographic_size", rename = "orthographicSize")]
    pub orthographic_size: f32,
    #[serde(default)]
    pub depth: i32,

    // Background and clear behavior
    #[serde(default, rename = "clearFlags")]
    pub clear_flags: Option<String>,
    #[serde(default, rename = "backgroundColor")]
    pub background_color: Option<CameraColor>,
    #[serde(default, rename = "skyboxTexture")]
    pub skybox_texture: Option<String>,

    // Control & follow
    #[serde(default, rename = "controlMode")]
    pub control_mode: Option<String>, // "locked" | "free"
    #[serde(default, rename = "enableSmoothing")]
    pub enable_smoothing: bool,
    #[serde(default, rename = "followTarget")]
    pub follow_target: Option<u32>,
    #[serde(
        default,
        rename = "followOffset",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub follow_offset: Option<[f32; 3]>,
    #[serde(default = "default_smoothing_speed", rename = "smoothingSpeed")]
    pub smoothing_speed: f32,
    #[serde(default = "default_rotation_smoothing", rename = "rotationSmoothing")]
    pub rotation_smoothing: f32,

    // Viewport (normalized 0..1)
    #[serde(default, rename = "viewportRect")]
    pub viewport_rect: Option<ViewportRect>,

    // HDR / Tone Mapping
    #[serde(default)]
    pub hdr: bool,
    #[serde(default, rename = "toneMapping")]
    pub tone_mapping: Option<String>, // none | linear | reinhard | cineon | aces
    #[serde(
        default = "default_tone_mapping_exposure",
        rename = "toneMappingExposure"
    )]
    pub tone_mapping_exposure: f32,

    // Post-processing
    #[serde(default, rename = "enablePostProcessing")]
    pub enable_post_processing: bool,
    #[serde(default, rename = "postProcessingPreset")]
    pub post_processing_preset: Option<String>,

    // Skybox transforms
    #[serde(
        default,
        rename = "skyboxScale",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_scale: Option<[f32; 3]>,
    #[serde(
        default,
        rename = "skyboxRotation",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_rotation: Option<[f32; 3]>,
    #[serde(
        default,
        rename = "skyboxRepeat",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_repeat: Option<[f32; 2]>,
    #[serde(
        default,
        rename = "skyboxOffset",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_offset: Option<[f32; 2]>,
    #[serde(default = "default_skybox_intensity", rename = "skyboxIntensity")]
    pub skybox_intensity: f32,
    #[serde(default, rename = "skyboxBlur")]
    pub skybox_blur: f32,
}

// Default value functions
fn default_fov() -> f32 {
    60.0
}

fn default_near() -> f32 {
    0.1
}

fn default_far() -> f32 {
    100.0
}

fn default_projection_type() -> String {
    "perspective".to_string()
}

fn default_orthographic_size() -> f32 {
    10.0
}

fn default_smoothing_speed() -> f32 {
    5.0
}

fn default_rotation_smoothing() -> f32 {
    5.0
}

fn default_tone_mapping_exposure() -> f32 {
    1.0
}

fn default_skybox_intensity() -> f32 {
    1.0
}

/// Decoder for Camera components
pub struct CameraDecoder;

impl IComponentDecoder for CameraDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Camera"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: CameraComponent = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Camera")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_camera_decoder() {
        let decoder = CameraDecoder;
        assert!(decoder.can_decode("Camera"));

        let json = serde_json::json!({
            "fov": 75.0,
            "near": 0.1,
            "far": 1000.0,
            "isMain": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let camera = decoded.downcast_ref::<CameraComponent>().unwrap();
        assert_eq!(camera.fov, 75.0);
        assert!(camera.is_main);
    }

    #[test]
    fn test_camera_decoder_defaults() {
        let decoder = CameraDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let camera = decoded.downcast_ref::<CameraComponent>().unwrap();
        assert_eq!(camera.fov, 60.0); // default_fov
        assert_eq!(camera.near, 0.1); // default_near
        assert_eq!(camera.far, 100.0); // default_far
        assert!(!camera.is_main);
        assert_eq!(camera.projection_type, "perspective");
    }

    #[test]
    fn test_camera_capabilities() {
        let decoder = CameraDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_camera_component_kinds() {
        let decoder = CameraDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Camera");
    }
}
