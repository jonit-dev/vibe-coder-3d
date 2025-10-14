pub mod components;
pub mod scene;
#[cfg(test)]
mod scene_test;

// Re-export from vibe-scene for backward compatibility
pub use vibe_scene::{ComponentKindId, Entity, EntityId, Metadata, Scene as SceneData};

// Re-export from ecs-bridge
pub use vibe_ecs_bridge::{ComponentCapabilities, ComponentRegistry, IComponentDecoder};
