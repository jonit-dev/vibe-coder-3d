//! Script APIs
//!
//! This module contains all the Lua API implementations that scripts can use.
//! Phase 1 (MVP): entity.transform API + console logging
//! Future phases will add: input, math, timer, events, audio, query, prefab, etc.

pub mod console_api;
pub mod entity_api;

// Re-export for convenience
pub use console_api::register_console_api;
pub use entity_api::register_entity_api;
