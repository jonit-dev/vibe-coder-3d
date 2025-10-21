//! Timer API for Lua scripts
//!
//! Provides timer functionality for delayed callbacks and scheduled execution.
//! Currently a placeholder - timers are handled by the host engine.

use mlua::prelude::*;

/// Register timer API in Lua global scope
///
/// Provides:
/// - `timer.setTimeout(callback: function, delayMs: number): number` - Schedule callback after delay
/// - `timer.setInterval(callback: function, intervalMs: number): number` - Schedule repeating callback
/// - `timer.clearTimeout(id: number)` - Cancel scheduled timeout
/// - `timer.clearInterval(id: number)` - Cancel scheduled interval
///
/// Note: This is currently a stub. Timers need to be managed by the engine's
/// update loop with proper frame budgeting.
///
/// # Arguments
///
/// * `lua` - The Lua VM
///
/// # Example Lua usage
///
/// ```lua
/// local timerId = timer.setTimeout(function()
///     console.log("Delayed callback!")
/// end, 1000)
///
/// -- Cancel the timer
/// timer.clearTimeout(timerId)
/// ```
pub fn register_timer_api(_lua: &Lua) -> LuaResult<()> {
    // Placeholder for timer API
    // Timers should be handled by the host engine's frame loop
    // to ensure proper frame budgeting and avoid blocking

    log::debug!("Timer API not yet implemented - handled by engine");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timer_api_registration() {
        let lua = Lua::new();
        // Should not error even though it's a placeholder
        assert!(register_timer_api(&lua).is_ok());
    }
}
