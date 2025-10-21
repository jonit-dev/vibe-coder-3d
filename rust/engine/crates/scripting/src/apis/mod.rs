//! Script APIs
//!
//! This module contains all the Lua API implementations that scripts can use.
//! - console API (implemented)
//! - entity.transform API (implemented)
//! - time API (implemented)
//! - math API (implemented)
//! - input API (stubs)
//! - timer API (placeholder - handled by engine)

pub mod console_api;
pub mod entity_api;
pub mod input_api;
pub mod math_api;
pub mod time_api;
pub mod timer_api;

// Re-export for convenience
pub use console_api::register_console_api;
pub use entity_api::register_entity_api;
pub use input_api::register_input_api;
pub use math_api::register_math_api;
pub use time_api::{register_time_api, update_time_api, TimeInfo};
pub use timer_api::register_timer_api;
