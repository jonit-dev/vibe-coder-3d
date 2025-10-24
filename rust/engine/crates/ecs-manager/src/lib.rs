/// ECS Manager - Central coordinator for mutable scene operations
///
/// Provides SceneManager for runtime entity creation, modification, and destruction.

pub mod entity_builder;
pub mod scene_manager;
mod scene_manager_test;
mod physics_sync_test;
mod stress_test;

// Re-export key types
pub use entity_builder::EntityBuilder;
pub use scene_manager::SceneManager;
