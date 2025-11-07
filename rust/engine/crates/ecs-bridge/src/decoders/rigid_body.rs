//! RigidBody component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::default_enabled;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RigidBodyMaterial {
    #[serde(default = "default_friction")]
    pub friction: f32,
    #[serde(default = "default_restitution")]
    pub restitution: f32,
    #[serde(default = "default_density")]
    pub density: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RigidBody {
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_body_type")]
    #[serde(rename = "bodyType")]
    pub body_type: String,
    #[serde(default, rename = "type")]
    pub type_: Option<String>, // Legacy field for backward compat
    #[serde(default = "default_mass")]
    pub mass: f32,
    #[serde(default = "default_gravity_scale")]
    #[serde(rename = "gravityScale")]
    pub gravity_scale: f32,
    #[serde(default = "default_can_sleep")]
    #[serde(rename = "canSleep")]
    pub can_sleep: bool,
    #[serde(default)]
    pub material: Option<RigidBodyMaterial>,
}

// Default value functions
fn default_body_type() -> String {
    "dynamic".to_string()
}

fn default_mass() -> f32 {
    1.0
}

fn default_gravity_scale() -> f32 {
    1.0
}

fn default_can_sleep() -> bool {
    true
}

fn default_friction() -> f32 {
    0.7
}

fn default_restitution() -> f32 {
    0.3
}

fn default_density() -> f32 {
    1.0
}

impl RigidBody {
    /// Get the body type, preferring bodyType over legacy type field
    /// If only legacy "type" field is provided, use that instead of default
    pub fn get_body_type(&self) -> &str {
        // If type_ is explicitly set and bodyType is the default, prefer type_
        if let Some(ref type_) = self.type_ {
            if self.body_type == "dynamic" {
                // bodyType is default, so legacy type takes precedence
                return type_;
            }
        }
        // Otherwise use bodyType (either explicitly set or default)
        &self.body_type
    }
}

/// Decoder for RigidBody components
pub struct RigidBodyDecoder;

impl IComponentDecoder for RigidBodyDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "RigidBody"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: RigidBody = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("RigidBody")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rigid_body_decoder() {
        let decoder = RigidBodyDecoder;
        assert!(decoder.can_decode("RigidBody"));
        assert!(!decoder.can_decode("MeshCollider"));

        let json = serde_json::json!({
            "enabled": true,
            "bodyType": "dynamic",
            "mass": 5.0,
            "gravityScale": 0.5,
            "canSleep": false,
            "material": {
                "friction": 0.8,
                "restitution": 0.5,
                "density": 2.0
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let rigid_body = decoded.downcast_ref::<RigidBody>().unwrap();
        assert_eq!(rigid_body.enabled, true);
        assert_eq!(rigid_body.body_type, "dynamic");
        assert_eq!(rigid_body.mass, 5.0);
        assert_eq!(rigid_body.gravity_scale, 0.5);
        assert_eq!(rigid_body.can_sleep, false);
        assert!(rigid_body.material.is_some());
        let material = rigid_body.material.as_ref().unwrap();
        assert_eq!(material.friction, 0.8);
        assert_eq!(material.restitution, 0.5);
        assert_eq!(material.density, 2.0);
    }

    #[test]
    fn test_rigid_body_decoder_defaults() {
        let decoder = RigidBodyDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let rigid_body = decoded.downcast_ref::<RigidBody>().unwrap();
        assert_eq!(rigid_body.enabled, true);
        assert_eq!(rigid_body.body_type, "dynamic");
        assert_eq!(rigid_body.mass, 1.0);
        assert_eq!(rigid_body.gravity_scale, 1.0);
        assert_eq!(rigid_body.can_sleep, true);
    }

    #[test]
    fn test_rigid_body_legacy_type_field() {
        let json = serde_json::json!({
            "type": "static"
        });

        let rigid_body: RigidBody = serde_json::from_value(json).unwrap();
        assert_eq!(rigid_body.get_body_type(), "static");
    }

    #[test]
    fn test_rigid_body_capabilities() {
        let decoder = RigidBodyDecoder;
        let caps = decoder.capabilities();
        assert!(!caps.affects_rendering);
        assert!(caps.requires_pass.is_none());
        assert!(caps.stable);
    }

    #[test]
    fn test_rigid_body_component_kinds() {
        let decoder = RigidBodyDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "RigidBody");
    }
}