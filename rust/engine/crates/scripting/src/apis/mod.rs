//! Script APIs
//!
//! This module contains all the Lua API implementations that scripts can use.
//! - console API (implemented)
//! - entity.transform API (implemented)
//! - time API (implemented)
//! - math API (implemented)
//! - event API (implemented)
//! - query API (implemented - findByName, findByTag stub, raycast stubs)
//! - entities API (implemented - entity lookups and references)
//! - physics API (implemented - RigidBody, MeshCollider, PhysicsEvents, CharacterController)
//! - camera API (implemented - Camera component manipulation)
//! - material API (implemented - MeshRenderer material manipulation)
//! - audio API (implemented - Sound playback and control)
//! - mesh API (implemented - Visibility, shadow control)
//! - collision API (implemented - Physics event callbacks)
//! - scene API (implemented - Scene loading/unloading)
//! - input API (stubs)
//! - timer API (placeholder - handled by engine)
//! - prefab API (implemented - Runtime entity spawning)

pub mod audio_api;
pub mod camera_api;
pub mod collision_api;
pub mod console_api;
pub mod entities_api;
pub mod entity_api;
pub mod entity_mutations;
pub mod event_api;
pub mod gameobject_api;
pub mod input_api;
pub mod light_api;
pub mod material_api;
pub mod math_api;
pub mod mesh_api;
pub mod physics_api;
pub mod prefab_api;
pub mod query_api;
pub mod query_helpers;
pub mod save_api;
pub mod scene_api;
pub mod time_api;
pub mod timer_api;

#[cfg(test)]
mod event_api_test;

// Re-export for convenience
pub use audio_api::register_audio_api;
pub use camera_api::register_camera_api;
pub use collision_api::{
    cleanup_collision_api, create_collision_api, dispatch_physics_event, PhysicsEventType,
};
pub use console_api::register_console_api;
pub use entities_api::register_entities_api;
pub use entity_api::register_entity_api;
pub use entity_mutations::{EntityMutation, EntityMutationBuffer};
pub use event_api::{cleanup_event_api, register_event_api};
pub use gameobject_api::register_gameobject_api;
pub use input_api::{register_input_api, InputApiProvider, InputManagerRef};
pub use light_api::register_light_api;
pub use material_api::register_material_api;
pub use math_api::register_math_api;
pub use mesh_api::MeshAPI;
pub use physics_api::register_physics_api;
pub use prefab_api::{register_prefab_api, PrefabManagerProvider, PrefabManagerRef};
pub use query_api::register_query_api;
pub use save_api::{
    create_file_save_manager, register_save_api, SaveManagerProvider, SaveManagerRef,
};
pub use scene_api::{register_scene_api, SceneManagerProvider, SceneManagerRef};
pub use time_api::{register_time_api, update_time_api, TimeInfo};
pub use timer_api::register_timer_api;
