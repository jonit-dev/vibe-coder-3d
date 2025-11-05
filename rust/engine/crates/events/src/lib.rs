//! Cross-Entity Event API for the Vibe Engine
//!
//! Provides a unified event bus for cross-entity, cross-system communication
//! between Rust systems, Lua scripts, and future WASM modules.

pub mod bus;
pub mod targeted;
pub mod types;

// Re-export main types for convenience
pub use bus::SceneEventBus;
pub use types::{EventEnvelope, EventKey, SubscriberId};
pub use targeted::EventTargeter;

// Re-export key constants
pub use types::keys;

#[cfg(test)]
mod integration_test;