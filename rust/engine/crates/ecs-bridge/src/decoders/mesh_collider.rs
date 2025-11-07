//! MeshCollider component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::{default_enabled, default_one};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshColliderSize {
    #[serde(default = "default_one")]
    pub width: f32,
    #[serde(default = "default_one")]
    pub height: f32,
    #[serde(default = "default_one")]
    pub depth: f32,
    #[serde(default = "default_radius")]
    pub radius: f32,
    #[serde(default = "default_radius")]
    #[serde(rename = "capsuleRadius")]
    pub capsule_radius: f32,
    #[serde(default = "default_capsule_height")]
    #[serde(rename = "capsuleHeight")]
    pub capsule_height: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PhysicsMaterialData {
    #[serde(default = "default_friction")]
    pub friction: f32,
    #[serde(default = "default_restitution")]
    pub restitution: f32,
    #[serde(default = "default_density")]
    pub density: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshCollider {
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_collider_type")]
    #[serde(rename = "colliderType")]
    pub collider_type: String,
    #[serde(default)]
    #[serde(rename = "isTrigger")]
    pub is_trigger: bool,
    #[serde(default = "default_center")]
    pub center: [f32; 3],
    #[serde(default)]
    pub size: MeshColliderSize,
    #[serde(default)]
    #[serde(rename = "physicsMaterial")]
    pub physics_material: PhysicsMaterialData,
}

// Default value functions
fn default_collider_type() -> String {
    "box".to_string()
}

fn default_center() -> [f32; 3] {
    [0.0, 0.0, 0.0]
}

fn default_radius() -> f32 {
    0.5
}

fn default_capsule_height() -> f32 {
    2.0
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

impl Default for MeshColliderSize {
    fn default() -> Self {
        Self {
            width: default_one(),
            height: default_one(),
            depth: default_one(),
            radius: default_radius(),
            capsule_radius: default_radius(),
            capsule_height: default_capsule_height(),
        }
    }
}

impl Default for PhysicsMaterialData {
    fn default() -> Self {
        Self {
            friction: default_friction(),
            restitution: default_restitution(),
            density: default_density(),
        }
    }
}

/// Decoder for MeshCollider components
pub struct MeshColliderDecoder;

impl IComponentDecoder for MeshColliderDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MeshCollider"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MeshCollider = serde_json::from_value(value.clone())?;
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
        vec![ComponentKindId::new("MeshCollider")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mesh_collider_decoder() {
        let decoder = MeshColliderDecoder;
        assert!(decoder.can_decode("MeshCollider"));
        assert!(!decoder.can_decode("RigidBody"));

        let json = serde_json::json!({
            "enabled": true,
            "colliderType": "sphere",
            "isTrigger": true,
            "center": [1.0, 2.0, 3.0],
            "size": {
                "width": 2.0,
                "height": 3.0,
                "depth": 1.5,
                "radius": 1.0,
                "capsuleRadius": 0.8,
                "capsuleHeight": 3.0
            },
            "physicsMaterial": {
                "friction": 0.9,
                "restitution": 0.2,
                "density": 1.5
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let collider = decoded.downcast_ref::<MeshCollider>().unwrap();
        assert_eq!(collider.enabled, true);
        assert_eq!(collider.collider_type, "sphere");
        assert_eq!(collider.is_trigger, true);
        assert_eq!(collider.center, [1.0, 2.0, 3.0]);
        assert_eq!(collider.size.radius, 1.0);
        assert_eq!(collider.physics_material.friction, 0.9);
    }

    #[test]
    fn test_mesh_collider_decoder_defaults() {
        let decoder = MeshColliderDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let collider = decoded.downcast_ref::<MeshCollider>().unwrap();
        assert_eq!(collider.enabled, true);
        assert_eq!(collider.collider_type, "box");
        assert_eq!(collider.is_trigger, false);
        assert_eq!(collider.center, [0.0, 0.0, 0.0]);
        assert_eq!(collider.size.width, 1.0);
        assert_eq!(collider.size.height, 1.0);
        assert_eq!(collider.size.depth, 1.0);
        assert_eq!(collider.size.radius, 0.5);
        assert_eq!(collider.size.capsule_radius, 0.5);
        assert_eq!(collider.size.capsule_height, 2.0);
        assert_eq!(collider.physics_material.friction, 0.7);
        assert_eq!(collider.physics_material.restitution, 0.3);
        assert_eq!(collider.physics_material.density, 1.0);
    }

    #[test]
    fn test_mesh_collider_capabilities() {
        let decoder = MeshColliderDecoder;
        let caps = decoder.capabilities();
        assert!(!caps.affects_rendering);
        assert!(caps.requires_pass.is_none());
        assert!(caps.stable);
    }

    #[test]
    fn test_mesh_collider_component_kinds() {
        let decoder = MeshColliderDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "MeshCollider");
    }
}