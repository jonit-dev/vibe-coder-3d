//! Input system for keyboard, mouse, and actions
//!
//! Provides frame-based input tracking and action mapping system.

mod actions;
mod keyboard;
mod manager;
mod mouse;
mod script_bridge;

pub use actions::{ActionConfig, ActionMapConfig, ActionType, BindingConfig, BindingType};
pub use manager::{ActionValue, InputManager};
