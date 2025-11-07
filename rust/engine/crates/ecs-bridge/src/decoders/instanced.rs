//! Instanced component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::default_true;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InstanceData {
    pub position: [f32; 3],
    #[serde(default)]
    pub rotation: Option<[f32; 3]>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
    #[serde(default)]
    pub color: Option<[f32; 3]>,
    #[serde(default)]
    #[serde(rename = "userData")]
    pub user_data: Option<Value>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Instanced {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_capacity")]
    pub capacity: u32,
    #[serde(default, rename = "baseMeshId")]
    pub base_mesh_id: String,
    #[serde(default, rename = "baseMaterialId")]
    pub base_material_id: String,
    #[serde(default)]
    pub instances: Vec<InstanceData>,
    #[serde(default = "default_true", rename = "castShadows")]
    pub cast_shadows: bool,
    #[serde(default = "default_true", rename = "receiveShadows")]
    pub receive_shadows: bool,
    #[serde(default = "default_true", rename = "frustum_culled")]
    pub frustum_culled: bool,
}

fn default_capacity() -> u32 {
    100
}

/// Decoder for Instanced components
pub struct InstancedDecoder;

impl IComponentDecoder for InstancedDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Instanced"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Instanced = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("Instanced")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_instanced_decoder() {
        let decoder = InstancedDecoder;
        assert!(decoder.can_decode("Instanced"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "enabled": true,
            "capacity": 500,
            "baseMeshId": "cube",
            "baseMaterialId": "mat-1",
            "instances": [
                {
                    "position": [1.0, 2.0, 3.0],
                    "rotation": [0.0, 90.0, 0.0],
                    "scale": [1.0, 1.0, 1.0],
                    "color": [1.0, 0.0, 0.0]
                },
                {
                    "position": [4.0, 5.0, 6.0]
                }
            ],
            "castShadows": true,
            "receiveShadows": false,
            "frustum_culled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Instanced>().unwrap();
        assert_eq!(component.enabled, true);
        assert_eq!(component.capacity, 500);
        assert_eq!(component.base_mesh_id, "cube");
        assert_eq!(component.base_material_id, "mat-1");
        assert_eq!(component.instances.len(), 2);
        assert_eq!(component.instances[0].position, [1.0, 2.0, 3.0]);
        assert_eq!(component.instances[0].rotation, Some([0.0, 90.0, 0.0]));
        assert_eq!(component.instances[0].scale, Some([1.0, 1.0, 1.0]));
        assert_eq!(component.instances[0].color, Some([1.0, 0.0, 0.0]));
        assert_eq!(component.instances[1].position, [4.0, 5.0, 6.0]);
        assert_eq!(component.instances[1].rotation, None);
        assert_eq!(component.cast_shadows, true);
        assert_eq!(component.receive_shadows, false);
        assert_eq!(component.frustum_culled, true);
    }

    #[test]
    fn test_instanced_decoder_defaults() {
        let decoder = InstancedDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Instanced>().unwrap();
        assert_eq!(component.enabled, true);
        assert_eq!(component.capacity, 100);
        assert_eq!(component.base_mesh_id, "");
        assert_eq!(component.base_material_id, "");
        assert_eq!(component.instances.len(), 0);
        assert_eq!(component.cast_shadows, true);
        assert_eq!(component.receive_shadows, true);
        assert_eq!(component.frustum_culled, true);
    }

    #[test]
    fn test_instanced_capabilities() {
        let decoder = InstancedDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_instanced_component_kinds() {
        let decoder = InstancedDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Instanced");
    }
}