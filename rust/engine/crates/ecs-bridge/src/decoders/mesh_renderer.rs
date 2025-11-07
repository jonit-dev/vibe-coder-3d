//! MeshRenderer component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::default_enabled;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshRenderer {
    #[serde(default, rename = "meshId")]
    pub mesh_id: Option<String>,
    #[serde(default, rename = "materialId")]
    pub material_id: Option<String>,
    #[serde(default)]
    pub materials: Option<Vec<String>>,
    #[serde(default)]
    pub material: Option<MeshRendererMaterialOverride>,
    #[serde(default, rename = "modelPath")]
    pub model_path: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled", rename = "cast_shadows")]
    pub cast_shadows: bool,
    #[serde(default = "default_enabled", rename = "receive_shadows")]
    pub receive_shadows: bool,
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

/// Decoder for MeshRenderer components
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

#[cfg(test)]
mod tests {
    use super::*;

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
        assert_eq!(renderer.mesh_id.as_deref(), Some("cube"));
        assert_eq!(renderer.material_id.as_deref(), Some("default"));
        assert!(renderer.enabled);
    }

    #[test]
    fn test_mesh_renderer_decoder_defaults() {
        let decoder = MeshRendererDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let renderer = decoded.downcast_ref::<MeshRenderer>().unwrap();
        assert!(renderer.mesh_id.is_none());
        assert!(renderer.material_id.is_none());
        assert!(renderer.enabled);
        assert!(renderer.cast_shadows);
        assert!(renderer.receive_shadows);
    }

    #[test]
    fn test_mesh_renderer_with_material_override() {
        let decoder = MeshRendererDecoder;
        let json = serde_json::json!({
            "meshId": "sphere",
            "material": {
                "color": "#ff0000",
                "metalness": 0.8,
                "roughness": 0.2
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let renderer = decoded.downcast_ref::<MeshRenderer>().unwrap();
        assert_eq!(renderer.mesh_id.as_deref(), Some("sphere"));
        assert!(renderer.material.is_some());

        let material = renderer.material.as_ref().unwrap();
        assert_eq!(material.color.as_deref(), Some("#ff0000"));
        assert_eq!(material.metalness, Some(0.8));
        assert_eq!(material.roughness, Some(0.2));
    }

    #[test]
    fn test_mesh_renderer_capabilities() {
        let decoder = MeshRendererDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_mesh_renderer_component_kinds() {
        let decoder = MeshRendererDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "MeshRenderer");
    }

    #[test]
    fn test_mesh_renderer_with_model_path() {
        let decoder = MeshRendererDecoder;
        let json = serde_json::json!({
            "modelPath": "models/car.glb",
            "cast_shadows": false,
            "receive_shadows": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let renderer = decoded.downcast_ref::<MeshRenderer>().unwrap();
        assert_eq!(renderer.model_path.as_deref(), Some("models/car.glb"));
        assert!(!renderer.cast_shadows);
        assert!(renderer.receive_shadows);
    }
}