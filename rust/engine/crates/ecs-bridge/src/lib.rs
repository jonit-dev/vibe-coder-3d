pub mod decoders;
pub mod transform_utils;

#[cfg(test)]
mod custom_shape_integration_test;

use anyhow::Result;
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

// Re-export commonly used types
pub use decoders::{
    create_default_registry, CameraComponent, CustomShape, GeometryAsset, GeometryAssetOptions,
    InstanceData, Instanced, Light, LightColor, Material, MeshCollider, MeshColliderSize,
    MeshRenderer, MeshRendererMaterialOverride, PhysicsMaterialData, PrefabInstance, RigidBody,
    RigidBodyMaterial, Sound, Terrain, Transform,
};

// Re-export transform utilities for standardized conversions
pub use transform_utils::{
    position_to_vec3, position_to_vec3_opt, rotation_to_quat, rotation_to_quat_array_opt,
    rotation_to_quat_opt, scale_to_vec3, scale_to_vec3_opt,
};

/// Component capabilities - describes what a component affects
#[derive(Debug, Clone)]
pub struct ComponentCapabilities {
    /// Does this component affect rendering?
    pub affects_rendering: bool,
    /// Which render pass does this require? (e.g., "shadow", "geometry", "skybox")
    pub requires_pass: Option<&'static str>,
    /// Is this component API stable?
    pub stable: bool,
}

impl ComponentCapabilities {
    pub fn none() -> Self {
        Self {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    pub fn rendering(pass: &'static str) -> Self {
        Self {
            affects_rendering: true,
            requires_pass: Some(pass),
            stable: true,
        }
    }
}

/// Trait for component decoders
pub trait IComponentDecoder: Send + Sync {
    /// Can this decoder handle this component kind?
    fn can_decode(&self, kind: &str) -> bool;

    /// Decode the JSON value into a typed component
    /// Returns a boxed Any that can be downcast to the specific component type
    fn decode(&self, value: &Value) -> Result<Box<dyn Any>>;

    /// Get capabilities for this component type
    fn capabilities(&self) -> ComponentCapabilities;

    /// Get the component kind(s) this decoder handles
    fn component_kinds(&self) -> Vec<ComponentKindId>;
}

/// Registry for component decoders
pub struct ComponentRegistry {
    decoders: Vec<Box<dyn IComponentDecoder>>,
}

impl ComponentRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        Self {
            decoders: Vec::new(),
        }
    }

    /// Register a decoder
    pub fn register<D: IComponentDecoder + 'static>(&mut self, decoder: D) {
        self.decoders.push(Box::new(decoder));
    }

    /// Decode a component by kind
    pub fn decode(&self, kind: &str, value: &Value) -> Result<Box<dyn Any>> {
        for decoder in &self.decoders {
            if decoder.can_decode(kind) {
                return decoder.decode(value);
            }
        }
        anyhow::bail!("No decoder found for component kind: {}", kind)
    }

    /// Get capabilities for a component kind
    pub fn capabilities(&self, kind: &str) -> Option<ComponentCapabilities> {
        for decoder in &self.decoders {
            if decoder.can_decode(kind) {
                return Some(decoder.capabilities());
            }
        }
        None
    }

    /// Check if a decoder exists for this kind
    pub fn has_decoder(&self, kind: &str) -> bool {
        self.decoders.iter().any(|d| d.can_decode(kind))
    }

    /// Get all registered component kinds
    pub fn registered_kinds(&self) -> Vec<ComponentKindId> {
        self.decoders
            .iter()
            .flat_map(|d| d.component_kinds())
            .collect()
    }
}

impl Default for ComponentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, Clone, PartialEq)]
    struct TestComponent {
        value: i32,
    }

    struct TestDecoder;

    impl IComponentDecoder for TestDecoder {
        fn can_decode(&self, kind: &str) -> bool {
            kind == "TestComponent"
        }

        fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
            let v = value
                .get("value")
                .and_then(|v| v.as_i64())
                .ok_or_else(|| anyhow::anyhow!("Missing value field"))?;
            Ok(Box::new(TestComponent { value: v as i32 }))
        }

        fn capabilities(&self) -> ComponentCapabilities {
            ComponentCapabilities::none()
        }

        fn component_kinds(&self) -> Vec<ComponentKindId> {
            vec![ComponentKindId::new("TestComponent")]
        }
    }

    #[test]
    fn test_registry_register_and_decode() {
        let mut registry = ComponentRegistry::new();
        registry.register(TestDecoder);

        assert!(registry.has_decoder("TestComponent"));
        assert!(!registry.has_decoder("OtherComponent"));

        let json = serde_json::json!({ "value": 42 });
        let decoded = registry.decode("TestComponent", &json).unwrap();
        let component = decoded.downcast_ref::<TestComponent>().unwrap();
        assert_eq!(component.value, 42);
    }

    #[test]
    fn test_registry_no_decoder() {
        let registry = ComponentRegistry::new();
        let json = serde_json::json!({ "value": 42 });
        let result = registry.decode("UnknownComponent", &json);
        assert!(result.is_err());
    }

    #[test]
    fn test_registry_capabilities() {
        let mut registry = ComponentRegistry::new();
        registry.register(TestDecoder);

        let caps = registry.capabilities("TestComponent");
        assert!(caps.is_some());
        assert_eq!(caps.unwrap().affects_rendering, false);

        let caps = registry.capabilities("UnknownComponent");
        assert!(caps.is_none());
    }

    #[test]
    fn test_component_capabilities() {
        let none = ComponentCapabilities::none();
        assert!(!none.affects_rendering);
        assert!(none.requires_pass.is_none());
        assert!(none.stable);

        let rendering = ComponentCapabilities::rendering("geometry");
        assert!(rendering.affects_rendering);
        assert_eq!(rendering.requires_pass, Some("geometry"));
        assert!(rendering.stable);
    }
}
