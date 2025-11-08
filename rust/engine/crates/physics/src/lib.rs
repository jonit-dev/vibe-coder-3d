pub mod builder;
pub mod character_controller;
pub mod components;
pub mod events;
pub mod scene_integration;
pub mod world;

pub use character_controller::{CharacterControllerConfig, CharacterControllerPreset, InputMapping, PhysicsConfig};
pub use components::{PhysicsMaterial, RigidBodyType};
pub use events::{CollisionEvent, ContactEvent, PhysicsEventQueue};
pub use scene_integration::populate_physics_world;
pub use world::{PhysicsWorld, RaycastHit};
