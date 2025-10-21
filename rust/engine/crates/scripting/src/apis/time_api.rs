///! Time API for Lua scripts
///!
///! Provides time and frame information for game scripts.

use mlua::prelude::*;

/// Time information passed to scripts each frame
#[derive(Debug, Clone, Copy)]
pub struct TimeInfo {
    /// Total elapsed time since start (in seconds)
    pub time: f64,
    /// Time since last frame (in seconds)
    pub delta_time: f64,
    /// Total number of frames rendered
    pub frame_count: u64,
}

impl Default for TimeInfo {
    fn default() -> Self {
        Self {
            time: 0.0,
            delta_time: 0.0,
            frame_count: 0,
        }
    }
}

/// Register time API in Lua global scope
///
/// Provides read-only time information:
/// - `time.time` - Total elapsed time since start (seconds)
/// - `time.deltaTime` - Time since last frame (seconds)
/// - `time.frameCount` - Total frames rendered
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `time_info` - Current time information
///
/// # Example Lua usage
///
/// ```lua
/// function onUpdate()
///     console:log("Frame:", time.frameCount)
///     console:log("Delta:", time.deltaTime)
///     console:log("Total time:", time.time)
///
///     -- Rotate object over time
///     local angle = time.time * math.pi * 2 / 10  -- Full rotation every 10 seconds
///     entity.transform:setRotation(0, angle, 0)
/// end
/// ```
pub fn register_time_api(lua: &Lua, time_info: TimeInfo) -> LuaResult<()> {
    let globals = lua.globals();
    let time_table = lua.create_table()?;

    // Set time values as read-only properties
    time_table.set("time", time_info.time)?;
    time_table.set("deltaTime", time_info.delta_time)?;
    time_table.set("frameCount", time_info.frame_count)?;

    // Make table read-only by setting a metatable that denies writes
    let metatable = lua.create_table()?;
    metatable.set(
        "__newindex",
        lua.create_function(|_, (_table, key, _value): (LuaTable, String, LuaValue)| {
            Err::<(), _>(LuaError::RuntimeError(format!(
                "Cannot modify time.{} - time API is read-only",
                key
            )))
        })?,
    )?;
    time_table.set_metatable(Some(metatable));

    globals.set("time", time_table)?;
    log::trace!(
        "Time API registered: time={:.3}s, deltaTime={:.3}s, frame={}",
        time_info.time,
        time_info.delta_time,
        time_info.frame_count
    );
    Ok(())
}

/// Update time API with new time information
///
/// This should be called every frame before script execution
pub fn update_time_api(lua: &Lua, time_info: TimeInfo) -> LuaResult<()> {
    register_time_api(lua, time_info)
}
