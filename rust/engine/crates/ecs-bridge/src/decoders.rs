use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

// ============================================================================
// Component Types (duplicated from main engine for now, will refactor later)
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

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

fn default_alpha() -> f32 {
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
    #[serde(default, rename = "followOffset")]
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
    #[serde(default, rename = "skyboxScale")]
    pub skybox_scale: Option<[f32; 3]>,
    #[serde(default, rename = "skyboxRotation")]
    pub skybox_rotation: Option<[f32; 3]>,
    #[serde(default, rename = "skyboxRepeat")]
    pub skybox_repeat: Option<[f32; 2]>,
    #[serde(default, rename = "skyboxOffset")]
    pub skybox_offset: Option<[f32; 2]>,
    #[serde(default = "default_skybox_intensity", rename = "skyboxIntensity")]
    pub skybox_intensity: f32,
    #[serde(default, rename = "skyboxBlur")]
    pub skybox_blur: f32,
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

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LightColor {
    #[serde(default = "default_one")]
    pub r: f32,
    #[serde(default = "default_one")]
    pub g: f32,
    #[serde(default = "default_one")]
    pub b: f32,
}

fn default_one() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Light {
    #[serde(default = "default_light_type")]
    pub lightType: String,
    #[serde(default)]
    pub color: Option<LightColor>,
    #[serde(default = "default_intensity")]
    pub intensity: f32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled")]
    pub castShadow: bool,
    #[serde(default)]
    pub directionX: f32,
    #[serde(default = "default_neg_one")]
    pub directionY: f32,
    #[serde(default)]
    pub directionZ: f32,
    #[serde(default = "default_range")]
    pub range: f32,
    #[serde(default = "default_one")]
    pub decay: f32,
    #[serde(default = "default_angle")]
    pub angle: f32,
    #[serde(default = "default_penumbra")]
    pub penumbra: f32,
    #[serde(default = "default_shadow_map_size")]
    pub shadowMapSize: u32,
    #[serde(default = "default_shadow_bias")]
    pub shadowBias: f32,
    #[serde(default = "default_one")]
    pub shadowRadius: f32,
}

fn default_light_type() -> String {
    "directional".to_string()
}
fn default_intensity() -> f32 {
    1.0
}
fn default_enabled() -> bool {
    true
}
fn default_neg_one() -> f32 {
    -1.0
}
fn default_range() -> f32 {
    10.0
}
fn default_angle() -> f32 {
    std::f32::consts::PI / 6.0
}
fn default_penumbra() -> f32 {
    0.1
}
fn default_shadow_map_size() -> u32 {
    1024
}
fn default_shadow_bias() -> f32 {
    -0.0001
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshRenderer {
    #[serde(default)]
    pub meshId: Option<String>,
    #[serde(default)]
    pub materialId: Option<String>,
    #[serde(default)]
    pub materials: Option<Vec<String>>,
    #[serde(default)]
    pub material: Option<MeshRendererMaterialOverride>,
    #[serde(default)]
    pub modelPath: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled")]
    pub castShadows: bool,
    #[serde(default = "default_enabled")]
    pub receiveShadows: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Material {
    #[serde(default)]
    pub id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, Default)]
pub struct MeshRendererMaterialOverride {
    #[serde(default)]
    pub shader: Option<String>,
    #[serde(default, rename = "materialType")]
    pub material_type: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default, rename = "albedoTexture")]
    pub albedo_texture: Option<String>,
    #[serde(default, rename = "normalTexture")]
    pub normal_texture: Option<String>,
    #[serde(default, rename = "normalScale")]
    pub normal_scale: Option<f32>,
    #[serde(default)]
    pub metalness: Option<f32>,
    #[serde(default, rename = "metallicTexture")]
    pub metallic_texture: Option<String>,
    #[serde(default)]
    pub roughness: Option<f32>,
    #[serde(default, rename = "roughnessTexture")]
    pub roughness_texture: Option<String>,
    #[serde(default)]
    pub emissive: Option<String>,
    #[serde(default, rename = "emissiveIntensity")]
    pub emissive_intensity: Option<f32>,
    #[serde(default, rename = "emissiveTexture")]
    pub emissive_texture: Option<String>,
    #[serde(default, rename = "occlusionTexture")]
    pub occlusion_texture: Option<String>,
    #[serde(default, rename = "occlusionStrength")]
    pub occlusion_strength: Option<f32>,
    #[serde(default, rename = "textureOffsetX")]
    pub texture_offset_x: Option<f32>,
    #[serde(default, rename = "textureOffsetY")]
    pub texture_offset_y: Option<f32>,
    #[serde(default, rename = "textureRepeatX")]
    pub texture_repeat_x: Option<f32>,
    #[serde(default, rename = "textureRepeatY")]
    pub texture_repeat_y: Option<f32>,
    #[serde(default)]
    pub transparent: Option<bool>,
    #[serde(default, rename = "alphaMode")]
    pub alpha_mode: Option<String>,
    #[serde(default, rename = "alphaCutoff")]
    pub alpha_cutoff: Option<f32>,
}

// ============================================================================
// Decoders
// ============================================================================

pub struct TransformDecoder;

impl IComponentDecoder for TransformDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Transform"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Transform = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("Transform")]
    }
}

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

pub struct LightDecoder;

impl IComponentDecoder for LightDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Light"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Light = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("shadow"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Light")]
    }
}

pub struct MeshRendererDecoder;

impl IComponentDecoder for MeshRendererDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MeshRenderer"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MeshRenderer = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("MeshRenderer")]
    }
}

pub struct MaterialDecoder;

impl IComponentDecoder for MaterialDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Material"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Material = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("Material")]
    }
}

// ============================================================================
// Helper to create a fully populated registry
// ============================================================================

use crate::ComponentRegistry;

pub fn create_default_registry() -> ComponentRegistry {
    let mut registry = ComponentRegistry::new();
    registry.register(TransformDecoder);
    registry.register(CameraDecoder);
    registry.register(LightDecoder);
    registry.register(MeshRendererDecoder);
    registry.register(MaterialDecoder);
    registry
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_decoder() {
        let decoder = TransformDecoder;
        assert!(decoder.can_decode("Transform"));
        assert!(!decoder.can_decode("Camera"));

        let json = serde_json::json!({
            "position": [1.0, 2.0, 3.0],
            "rotation": [0.0, 0.0, 0.0],
            "scale": [1.0, 1.0, 1.0]
        });

        let decoded = decoder.decode(&json).unwrap();
        let transform = decoded.downcast_ref::<Transform>().unwrap();
        assert_eq!(transform.position, Some([1.0, 2.0, 3.0]));
    }

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
    fn test_light_decoder() {
        let decoder = LightDecoder;
        assert!(decoder.can_decode("Light"));

        let json = serde_json::json!({
            "lightType": "directional",
            "intensity": 1.5,
            "enabled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let light = decoded.downcast_ref::<Light>().unwrap();
        assert_eq!(light.intensity, 1.5);
    }

    #[test]
    fn test_mesh_renderer_decoder() {
        let decoder = MeshRendererDecoder;
        assert!(decoder.can_decode("MeshRenderer"));

        let json = serde_json::json!({
            "meshId": "cube",
            "materialId": "default",
            "enabled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let renderer = decoded.downcast_ref::<MeshRenderer>().unwrap();
        assert_eq!(renderer.meshId.as_deref(), Some("cube"));
    }

    #[test]
    fn test_material_decoder() {
        let decoder = MaterialDecoder;
        assert!(decoder.can_decode("Material"));

        let json = serde_json::json!({
            "id": "mat-1"
        });

        let decoded = decoder.decode(&json).unwrap();
        let material = decoded.downcast_ref::<Material>().unwrap();
        assert_eq!(material.id.as_deref(), Some("mat-1"));
    }

    #[test]
    fn test_default_registry() {
        let registry = create_default_registry();

        assert!(registry.has_decoder("Transform"));
        assert!(registry.has_decoder("Camera"));
        assert!(registry.has_decoder("Light"));
        assert!(registry.has_decoder("MeshRenderer"));
        assert!(registry.has_decoder("Material"));
        assert!(!registry.has_decoder("Unknown"));
    }

    #[test]
    fn test_registry_decode_all_components() {
        let registry = create_default_registry();

        // Test Transform
        let json = serde_json::json!({"position": [1.0, 2.0, 3.0]});
        let decoded = registry.decode("Transform", &json).unwrap();
        assert!(decoded.downcast_ref::<Transform>().is_some());

        // Test Camera
        let json = serde_json::json!({"fov": 60.0});
        let decoded = registry.decode("Camera", &json).unwrap();
        assert!(decoded.downcast_ref::<CameraComponent>().is_some());

        // Test Light
        let json = serde_json::json!({"intensity": 1.0});
        let decoded = registry.decode("Light", &json).unwrap();
        assert!(decoded.downcast_ref::<Light>().is_some());

        // Test MeshRenderer
        let json = serde_json::json!({"meshId": "cube"});
        let decoded = registry.decode("MeshRenderer", &json).unwrap();
        assert!(decoded.downcast_ref::<MeshRenderer>().is_some());

        // Test Material
        let json = serde_json::json!({"id": "mat-1"});
        let decoded = registry.decode("Material", &json).unwrap();
        assert!(decoded.downcast_ref::<Material>().is_some());
    }
}
