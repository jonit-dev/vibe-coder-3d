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
//! - input API (stubs)
//! - timer API (placeholder - handled by engine)

pub mod camera_api;
pub mod console_api;
pub mod entities_api;
pub mod entity_api;
pub mod entity_mutations;
pub mod event_api;
pub mod input_api;
pub mod material_api;
pub mod math_api;
pub mod physics_api;
pub mod query_api;
pub mod time_api;
pub mod timer_api;

#[cfg(test)]
mod event_api_test;

// Re-export for convenience
pub use camera_api::register_camera_api;
pub use console_api::register_console_api;
pub use entities_api::register_entities_api;
pub use entity_api::register_entity_api;
pub use entity_mutations::{EntityMutation, EntityMutationBuffer};
pub use event_api::{cleanup_event_api, register_event_api};
pub use input_api::register_input_api;
pub use material_api::register_material_api;
pub use math_api::register_math_api;
pub use physics_api::register_physics_api;
pub use query_api::register_query_api;
pub use time_api::{register_time_api, update_time_api, TimeInfo};
pub use timer_api::register_timer_api;
