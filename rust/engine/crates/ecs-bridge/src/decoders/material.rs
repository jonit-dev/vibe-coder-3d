//! Material component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Material {
    #[serde(default)]
    pub id: Option<String>,
}

/// Decoder for Material components
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

#[cfg(test)]
mod tests {
    use super::*;

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
    fn test_material_decoder_defaults() {
        let decoder = MaterialDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let material = decoded.downcast_ref::<Material>().unwrap();
        assert!(material.id.is_none());
    }

    #[test]
    fn test_material_capabilities() {
        let decoder = MaterialDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_material_component_kinds() {
        let decoder = MaterialDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Material");
    }
}
