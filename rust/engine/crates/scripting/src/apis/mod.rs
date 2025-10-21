//! Script APIs
//!
//! This module contains all the Lua API implementations that scripts can use.
//! - entity.transform API + console logging (implemented)
//! - input API (stubs)
//! - timer API (placeholder - handled by engine)

pub mod console_api;
pub mod entity_api;
pub mod input_api;
pub mod timer_api;

// Re-export for convenience
pub use console_api::register_console_api;
pub use entity_api::register_entity_api;
pub use input_api::register_input_api;
pub use timer_api::register_timer_api;
