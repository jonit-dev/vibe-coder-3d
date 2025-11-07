//! GeometryAsset component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::default_enabled;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GeometryAssetOptions {
    #[serde(default)]
    #[serde(rename = "recomputeNormals")]
    pub recomputeNormals: bool,
    #[serde(default)]
    #[serde(rename = "recomputeTangents")]
    pub recomputeTangents: bool,
    #[serde(default)]
    pub recenter: bool,
    #[serde(default = "default_enabled")]
    #[serde(rename = "computeBounds")]
    pub computeBounds: bool,
    #[serde(default)]
    #[serde(rename = "flipNormals")]
    pub flipNormals: bool,
    #[serde(default = "default_one")]
    pub scale: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GeometryAsset {
    pub path: String,
    #[serde(default, rename = "geometryId")]
    pub geometry_id: Option<String>,
    #[serde(default, rename = "materialId")]
    pub material_id: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled", rename = "castShadows")]
    pub cast_shadows: bool,
    #[serde(default = "default_enabled", rename = "receiveShadows")]
    pub receive_shadows: bool,
    #[serde(default)]
    pub options: Option<GeometryAssetOptions>,
}

// Default value functions
fn default_one() -> f32 {
    1.0
}

impl Default for GeometryAssetOptions {
    fn default() -> Self {
        Self {
            recomputeNormals: false,
            recomputeTangents: false,
            recenter: false,
            computeBounds: true,
            flipNormals: false,
            scale: 1.0,
        }
    }
}

/// Decoder for GeometryAsset components
pub struct GeometryAssetDecoder;

impl IComponentDecoder for GeometryAssetDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "GeometryAsset"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: GeometryAsset = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("GeometryAsset")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_geometry_asset_decoder() {
        let decoder = GeometryAssetDecoder;
        assert!(decoder.can_decode("GeometryAsset"));

        let json = serde_json::json!({
            "path": "models/tree.glb",
            "geometryId": "tree_geo",
            "materialId": "bark_material",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": false,
            "options": {
                "scale": 2.0,
                "recenter": true
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let asset = decoded.downcast_ref::<GeometryAsset>().unwrap();
        assert_eq!(asset.path, "models/tree.glb");
        assert_eq!(asset.geometry_id.as_deref(), Some("tree_geo"));
        assert_eq!(asset.material_id.as_deref(), Some("bark_material"));
        assert!(asset.enabled);
        assert!(asset.cast_shadows);
        assert!(!asset.receive_shadows);
        assert!(asset.options.is_some());

        let options = asset.options.as_ref().unwrap();
        assert_eq!(options.scale, 2.0);
        assert!(options.recenter);
    }

    #[test]
    fn test_geometry_asset_decoder_minimal() {
        let decoder = GeometryAssetDecoder;
        let json = serde_json::json!({
            "path": "models/cube.obj"
        });

        let decoded = decoder.decode(&json).unwrap();
        let asset = decoded.downcast_ref::<GeometryAsset>().unwrap();
        assert_eq!(asset.path, "models/cube.obj");
        assert!(asset.enabled);
        assert!(asset.cast_shadows);
        assert!(asset.receive_shadows);
        assert!(asset.options.is_none());
    }

    #[test]
    fn test_geometry_asset_capabilities() {
        let decoder = GeometryAssetDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_geometry_asset_component_kinds() {
        let decoder = GeometryAssetDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "GeometryAsset");
    }
}