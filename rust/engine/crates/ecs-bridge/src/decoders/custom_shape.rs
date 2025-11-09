//! CustomShape component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

/// CustomShape component stores shape ID and dynamic parameters
/// for procedurally generated custom shapes
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CustomShape {
    /// Shape identifier (e.g., "helix", "star", "tree")
    #[serde(default, rename = "shapeId")]
    pub shape_id: String,

    /// Shape-specific parameters (validated by shape's Zod schema in TypeScript)
    /// In Rust, this is a dynamic map that will be parsed by each shape generator
    #[serde(default)]
    pub params: Value,
}

/// Decoder for CustomShape components
pub struct CustomShapeDecoder;

impl IComponentDecoder for CustomShapeDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "CustomShape"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: CustomShape = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("CustomShape")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_custom_shape_decoder() {
        let decoder = CustomShapeDecoder;
        assert!(decoder.can_decode("CustomShape"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "shapeId": "helix",
            "params": {
                "height": 10.0,
                "radius": 2.0,
                "turns": 5
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let shape = decoded.downcast_ref::<CustomShape>().unwrap();
        assert_eq!(shape.shape_id, "helix");
        assert_eq!(shape.params["height"], 10.0);
        assert_eq!(shape.params["radius"], 2.0);
        assert_eq!(shape.params["turns"], 5);
    }

    #[test]
    fn test_custom_shape_decoder_minimal() {
        let decoder = CustomShapeDecoder;
        let json = serde_json::json!({
            "shapeId": "star"
        });

        let decoded = decoder.decode(&json).unwrap();
        let shape = decoded.downcast_ref::<CustomShape>().unwrap();
        assert_eq!(shape.shape_id, "star");
        assert!(shape.params.is_null());
    }

    #[test]
    fn test_custom_shape_capabilities() {
        let decoder = CustomShapeDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_custom_shape_component_kinds() {
        let decoder = CustomShapeDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "CustomShape");
    }
}
