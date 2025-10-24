//! Vibe Scripting - Lua scripting system for the Vibe Coder engine
//!
//! Provides hot-reloadable Lua scripting with lifecycle management (onStart, onUpdate, onDestroy, onEnable, onDisable)
//! and comprehensive API surface for entity manipulation, input, physics, audio, and more.

pub mod apis;
pub mod lua_runtime;
pub mod script_system;

#[cfg(feature = "hot-reload")]
pub mod hot_reload;

// Re-exports for convenience
pub use apis::{InputApiProvider, InputManagerRef};
pub use lua_runtime::{LuaScript, LuaScriptRuntime};
pub use script_system::ScriptSystem;

#[cfg(feature = "hot-reload")]
pub use hot_reload::ScriptHotReloader;
