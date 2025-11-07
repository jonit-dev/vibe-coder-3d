//! LOD component decoder

use anyhow::Result;
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::LODComponent;

/// Decoder for LOD components
pub struct LODDecoder;

impl IComponentDecoder for LODDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "LOD" || kind == "LodComponent"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: LODComponent = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("LOD"), ComponentKindId::new("LodComponent")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lod_decoder() {
        let decoder = LODDecoder;
        assert!(decoder.can_decode("LOD"));
        assert!(decoder.can_decode("LodComponent"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "originalPath": "/models/tree.glb",
            "highFidelityPath": "/models/tree_high.glb",
            "lowFidelityPath": "/models/tree_low.glb",
            "distanceThresholds": [10.0, 50.0],
            "overrideQuality": "HighFidelity"
        });

        let decoded = decoder.decode(&json).unwrap();
        let lod = decoded.downcast_ref::<LODComponent>().unwrap();
        assert_eq!(lod.original_path, "/models/tree.glb");
        assert_eq!(lod.high_fidelity_path.as_deref(), Some("/models/tree_high.glb"));
        assert_eq!(lod.low_fidelity_path.as_deref(), Some("/models/tree_low.glb"));
        assert_eq!(lod.distance_thresholds, Some([10.0, 50.0]));
        assert!(lod.override_quality.is_some());
    }

    #[test]
    fn test_lod_capabilities() {
        let decoder = LODDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_lod_component_kinds() {
        let decoder = LODDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 2);
        assert!(kinds.iter().any(|k| k.as_str() == "LOD"));
        assert!(kinds.iter().any(|k| k.as_str() == "LodComponent"));
    }
}