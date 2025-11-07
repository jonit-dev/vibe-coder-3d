//! Transform component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

/// Transform component for entity position, rotation, and scale
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

/// Decoder for Transform components
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
    fn test_transform_decoder_minimal() {
        let decoder = TransformDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let transform = decoded.downcast_ref::<Transform>().unwrap();
        assert!(transform.position.is_none());
        assert!(transform.rotation.is_none());
        assert!(transform.scale.is_none());
    }

    #[test]
    fn test_transform_capabilities() {
        let decoder = TransformDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_transform_component_kinds() {
        let decoder = TransformDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Transform");
    }
}