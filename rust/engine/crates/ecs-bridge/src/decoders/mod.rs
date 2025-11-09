//! Component decoder modules
//!
//! This directory contains individual decoder modules, each focused on a specific
//! component type. Each module defines both the component data structure and its
//! corresponding decoder implementation.

pub mod camera;
pub mod common;
pub mod custom_shape;
pub mod geometry_asset;
pub mod instanced;
pub mod light;
pub mod lod;
pub mod material;
pub mod mesh_collider;
pub mod mesh_renderer;
pub mod prefab_instance;
pub mod rigid_body;
pub mod script;
pub mod sound;
pub mod terrain;
pub mod transform;

// Re-export common types and utilities
pub use camera::*;
pub use common::*;
pub use custom_shape::*;
pub use geometry_asset::*;
pub use instanced::*;
pub use light::*;
pub use lod::*;
pub use material::*;
pub use mesh_collider::*;
pub use mesh_renderer::*;
pub use prefab_instance::*;
pub use rigid_body::*;
pub use script::*;
pub use sound::*;
pub use terrain::*;
pub use transform::*;

use crate::ComponentRegistry;

/// Create a default component registry with all standard decoders registered
pub fn create_default_registry() -> ComponentRegistry {
    let mut registry = ComponentRegistry::new();
    registry.register(transform::TransformDecoder);
    registry.register(camera::CameraDecoder);
    registry.register(light::LightDecoder);
    registry.register(mesh_renderer::MeshRendererDecoder);
    registry.register(material::MaterialDecoder);
    registry.register(custom_shape::CustomShapeDecoder);
    registry.register(rigid_body::RigidBodyDecoder);
    registry.register(mesh_collider::MeshColliderDecoder);
    registry.register(geometry_asset::GeometryAssetDecoder);
    registry.register(prefab_instance::PrefabInstanceDecoder);
    registry.register(instanced::InstancedDecoder);
    registry.register(terrain::TerrainDecoder);
    registry.register(sound::SoundDecoder);
    registry.register(script::ScriptDecoder);
    registry.register(lod::LODDecoder);
    registry
}
