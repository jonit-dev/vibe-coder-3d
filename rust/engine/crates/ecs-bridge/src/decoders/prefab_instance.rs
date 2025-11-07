//! PrefabInstance component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

/// Recursive entity structure for prefabs
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabEntity {
    pub name: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub components: std::collections::HashMap<String, Value>,
    #[serde(default)]
    pub children: Vec<PrefabEntity>,
}

/// Complete prefab definition
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabDefinition {
    pub id: String,
    pub name: String,
    #[serde(default = "default_version")]
    pub version: u32,
    pub root: PrefabEntity,
    #[serde(default)]
    pub metadata: std::collections::HashMap<String, Value>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabInstance {
    #[serde(default)]
    #[serde(rename = "prefabId")]
    pub prefab_id: String,
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default)]
    #[serde(rename = "instanceUuid")]
    pub instance_uuid: String,
    #[serde(default)]
    #[serde(rename = "overridePatch")]
    pub override_patch: Option<Value>,
}

fn default_version() -> u32 {
    1
}

/// Decoder for PrefabInstance components
pub struct PrefabInstanceDecoder;

impl IComponentDecoder for PrefabInstanceDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "PrefabInstance"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: PrefabInstance = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("PrefabInstance")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prefab_instance_decoder() {
        let decoder = PrefabInstanceDecoder;
        assert!(decoder.can_decode("PrefabInstance"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "prefabId": "tree-prefab",
            "version": 2,
            "instanceUuid": "abc-123",
            "overridePatch": {"color": "red"}
        });

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<PrefabInstance>().unwrap();
        assert_eq!(component.prefab_id, "tree-prefab");
        assert_eq!(component.version, 2);
        assert_eq!(component.instance_uuid, "abc-123");
        assert!(component.override_patch.is_some());
    }

    #[test]
    fn test_prefab_instance_decoder_defaults() {
        let decoder = PrefabInstanceDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<PrefabInstance>().unwrap();
        assert_eq!(component.prefab_id, "");
        assert_eq!(component.version, 1);
        assert_eq!(component.instance_uuid, "");
        assert!(component.override_patch.is_none());
    }

    #[test]
    fn test_prefab_instance_capabilities() {
        let decoder = PrefabInstanceDecoder;
        let caps = decoder.capabilities();
        assert!(!caps.affects_rendering);
        assert!(caps.requires_pass.is_none());
        assert!(caps.stable);
    }

    #[test]
    fn test_prefab_instance_component_kinds() {
        let decoder = PrefabInstanceDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "PrefabInstance");
    }
}