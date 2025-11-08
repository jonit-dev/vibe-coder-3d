//! Character Controller Module
//!
//! Provides kinematic character controller functionality with:
//! - Ground detection and slope limiting
//! - Step up/down handling
//! - Jumping with coyote time
//! - Collision resolution and sliding
//!
//! ## Architecture
//!
//! - `component`: Configuration and runtime state
//! - `system`: Frame update logic and physics integration
//! - `queries`: Ground detection and collision queries
//!
//! ## Usage
//!
//! ```rust,ignore
//! use vibe_physics::character_controller::{
//!     CharacterControllerSystem,
//!     CharacterControllerComponent,
//!     CharacterControllerConfig,
//! };
//!
//! // Create system
//! let mut system = CharacterControllerSystem::new();
//!
//! // Create and add controller
//! let config = CharacterControllerConfig::default();
//! let mut controller = CharacterControllerComponent::new(entity_id, config);
//! controller.set_move_input([1.0, 0.0]); // Move right
//! system.add_controller(controller);
//!
//! // Update each frame
//! system.update(&mut physics_world, delta_seconds);
//! ```

pub mod component;
pub mod queries;
pub mod system;

// Re-export public types
pub use component::{
    CharacterControllerComponent, CharacterControllerConfig, CharacterControllerPreset,
    CharacterControllerState, InputMapping, PhysicsConfig,
};
pub use queries::{calculate_slide_vector, compute_ground, is_slope_too_steep, GroundHit};
pub use system::CharacterControllerSystem;
