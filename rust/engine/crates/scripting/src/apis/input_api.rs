//! Input API for Lua scripts
//!
//! Provides keyboard and mouse input stubs for game scripts.
//! Currently returns placeholder values - will be integrated with actual input system.

use mlua::prelude::*;

/// Register input API in Lua global scope
///
/// Provides:
/// - `input.isKeyDown(key: string): boolean` - Check if key is currently pressed
/// - `input.getMousePosition(): {x: number, y: number}` - Get mouse position
/// - `input.isMouseButtonDown(button: number): boolean` - Check if mouse button pressed
///
/// # Arguments
///
/// * `lua` - The Lua VM
///
/// # Example Lua usage
///
/// ```lua
/// if input.isKeyDown("Space") then
///     console.log("Space key pressed!")
/// end
///
/// local mouse = input.getMousePosition()
/// console.log("Mouse at: " .. mouse.x .. ", " .. mouse.y)
/// ```
pub fn register_input_api(lua: &Lua) -> LuaResult<()> {
    let globals = lua.globals();
    let input = lua.create_table()?;

    // isKeyDown stub - always returns false for now
    input.set(
        "isKeyDown",
        lua.create_function(|_, _key: String| {
            // TODO: Integrate with actual input system
            Ok(false)
        })?,
    )?;

    // getMousePosition stub - returns (0, 0) for now
    input.set(
        "getMousePosition",
        lua.create_function(|lua, ()| {
            let pos = lua.create_table()?;
            pos.set("x", 0.0)?;
            pos.set("y", 0.0)?;
            Ok(pos)
        })?,
    )?;

    // isMouseButtonDown stub - always returns false for now
    input.set(
        "isMouseButtonDown",
        lua.create_function(|_, _button: u8| {
            // TODO: Integrate with actual input system
            Ok(false)
        })?,
    )?;

    globals.set("input", input)?;
    log::debug!("Input API registered (stub implementation)");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_api_registration() {
        let lua = Lua::new();
        assert!(register_input_api(&lua).is_ok());

        // Verify input table exists
        let result: LuaResult<bool> = lua.load("return input ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_is_key_down_stub() {
        let lua = Lua::new();
        register_input_api(&lua).unwrap();

        // Should return false for any key (stub)
        let result: bool = lua.load(r#"return input.isKeyDown("Space")"#).eval().unwrap();
        assert!(!result);
    }

    #[test]
    fn test_get_mouse_position_stub() {
        let lua = Lua::new();
        register_input_api(&lua).unwrap();

        // Should return {x: 0, y: 0} (stub)
        let result: LuaResult<(f64, f64)> = lua
            .load(
                r#"
                local pos = input.getMousePosition()
                return pos.x, pos.y
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let (x, y) = result.unwrap();
        assert_eq!(x, 0.0);
        assert_eq!(y, 0.0);
    }

    #[test]
    fn test_is_mouse_button_down_stub() {
        let lua = Lua::new();
        register_input_api(&lua).unwrap();

        // Should return false for any button (stub)
        let result: bool = lua.load("return input.isMouseButtonDown(0)").eval().unwrap();
        assert!(!result);
    }
}
