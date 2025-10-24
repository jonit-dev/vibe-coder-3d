///! Math API for Lua scripts
///!
///! Provides mathematical constants, functions, and game-specific utilities.
use mlua::prelude::*;

/// Register math API in Lua global scope
///
/// Provides:
/// - **Constants**: `math.PI`, `math.E`
/// - **Basic Functions**: `math.abs()`, `math.sin()`, `math.cos()`, etc.
/// - **Game Utilities**: `math.clamp()`, `math.lerp()`, `math.radToDeg()`, `math.degToRad()`, `math.distance()`
///
/// # Arguments
///
/// * `lua` - The Lua VM
///
/// # Example Lua usage
///
/// ```lua
/// -- Use constants
/// local fullCircle = 2 * math.PI
/// local e = math.E
///
/// -- Basic math
/// local dist = math.sqrt(x*x + y*y + z*z)
/// local rounded = math.round(value)
///
/// -- Game utilities
/// local clamped = math.clamp(health, 0, 100)
/// local interpolated = math.lerp(start, target, 0.5)
/// local degrees = math.radToDeg(angle)
/// local radians = math.degToRad(rotation)
/// local distance = math.distance(x1, y1, z1, x2, y2, z2)
/// ```
pub fn register_math_api(lua: &Lua) -> LuaResult<()> {
    let globals = lua.globals();
    let math_table: LuaTable = globals.get("math")?; // Get existing Lua math table

    // Add constants
    math_table.set("PI", std::f64::consts::PI)?;
    math_table.set("E", std::f64::consts::E)?;

    // Note: Lua already has most basic math functions (sin, cos, sqrt, etc.)
    // We only need to add custom game-specific utilities

    // clamp(value, min, max)
    math_table.set(
        "clamp",
        lua.create_function(|_, (value, min, max): (f64, f64, f64)| Ok(value.max(min).min(max)))?,
    )?;

    // lerp(a, b, t)
    math_table.set(
        "lerp",
        lua.create_function(|_, (a, b, t): (f64, f64, f64)| Ok(a + (b - a) * t))?,
    )?;

    // radToDeg(radians)
    math_table.set(
        "radToDeg",
        lua.create_function(|_, rad: f64| Ok(rad * (180.0 / std::f64::consts::PI)))?,
    )?;

    // degToRad(degrees)
    math_table.set(
        "degToRad",
        lua.create_function(|_, deg: f64| Ok(deg * (std::f64::consts::PI / 180.0)))?,
    )?;

    // distance(x1, y1, z1, x2, y2, z2)
    math_table.set(
        "distance",
        lua.create_function(
            |_, (x1, y1, z1, x2, y2, z2): (f64, f64, f64, f64, f64, f64)| {
                let dx = x2 - x1;
                let dy = y2 - y1;
                let dz = z2 - z1;
                Ok((dx * dx + dy * dy + dz * dz).sqrt())
            },
        )?,
    )?;

    // round(x) - Lua 5.1 doesn't have math.round
    // Check if round exists by trying to get it
    let has_round = match math_table.raw_get::<mlua::Value>(lua.create_string("round")?) {
        Ok(v) => !matches!(v, mlua::Value::Nil),
        Err(_) => false,
    };

    if !has_round {
        math_table.set("round", lua.create_function(|_, x: f64| Ok(x.round()))?)?;
    }

    log::debug!("Math API registered with game utilities");
    Ok(())
}
