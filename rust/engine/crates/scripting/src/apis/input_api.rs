//! Input API for Lua scripts
//!
//! Provides keyboard, mouse, and action system input for game scripts.

use mlua::prelude::*;
use std::sync::Arc;

// Forward declare InputManager type from engine
// This will be passed in from the engine crate
pub type InputManagerRef = Arc<dyn InputApiProvider + Send + Sync>;

/// Trait for providing input state to scripts
/// Engine implements this with the real InputManager
pub trait InputApiProvider {
    // Keyboard
    fn is_key_down(&self, key: &str) -> bool;
    fn is_key_pressed(&self, key: &str) -> bool;
    fn is_key_released(&self, key: &str) -> bool;

    // Mouse
    fn is_mouse_button_down(&self, button: u8) -> bool;
    fn is_mouse_button_pressed(&self, button: u8) -> bool;
    fn is_mouse_button_released(&self, button: u8) -> bool;
    fn mouse_position(&self) -> (f64, f64);
    fn mouse_delta(&self) -> (f64, f64);
    fn mouse_wheel(&self) -> f32;
    fn is_pointer_locked(&self) -> bool;
    fn lock_pointer(&self);
    fn unlock_pointer(&self);

    // Actions
    fn get_action_value(&self, map_name: &str, action_name: &str) -> Option<(String, Vec<f32>)>; // (type, values)
    fn is_action_active(&self, map_name: &str, action_name: &str) -> bool;
    fn enable_action_map(&self, map_name: &str);
    fn disable_action_map(&self, map_name: &str);
}

/// Register input API in Lua global scope
///
/// If input_manager is provided, uses real input state.
/// Otherwise, returns stub values for testing.
pub fn register_input_api(lua: &Lua, input_manager: Option<InputManagerRef>) -> LuaResult<()> {
    let globals = lua.globals();
    let input = lua.create_table()?;

    // Keyboard methods
    let input_mgr_clone = input_manager.clone();
    input.set(
        "isKeyDown",
        lua.create_function(move |_, key: String| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_key_down(&key))
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "isKeyPressed",
        lua.create_function(move |_, key: String| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_key_pressed(&key))
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "isKeyReleased",
        lua.create_function(move |_, key: String| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_key_released(&key))
                .unwrap_or(false))
        })?,
    )?;

    // Mouse button methods
    let input_mgr_clone = input_manager.clone();
    input.set(
        "isMouseButtonDown",
        lua.create_function(move |_, button: u8| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_mouse_button_down(button))
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "isMouseButtonPressed",
        lua.create_function(move |_, button: u8| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_mouse_button_pressed(button))
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "isMouseButtonReleased",
        lua.create_function(move |_, button: u8| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_mouse_button_released(button))
                .unwrap_or(false))
        })?,
    )?;

    // Mouse position/delta/wheel
    let input_mgr_clone = input_manager.clone();
    input.set(
        "mousePosition",
        lua.create_function(move |lua, ()| {
            let (x, y) = input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.mouse_position())
                .unwrap_or((0.0, 0.0));
            let result = lua.create_table()?;
            result.set(1, x)?;
            result.set(2, y)?;
            Ok(result)
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "mouseDelta",
        lua.create_function(move |lua, ()| {
            let (dx, dy) = input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.mouse_delta())
                .unwrap_or((0.0, 0.0));
            let result = lua.create_table()?;
            result.set(1, dx)?;
            result.set(2, dy)?;
            Ok(result)
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "mouseWheel",
        lua.create_function(move |_, ()| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.mouse_wheel())
                .unwrap_or(0.0))
        })?,
    )?;

    // Pointer lock
    let input_mgr_clone = input_manager.clone();
    input.set(
        "isPointerLocked",
        lua.create_function(move |_, ()| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_pointer_locked())
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "lockPointer",
        lua.create_function(move |_, ()| {
            if let Some(mgr) = input_mgr_clone.as_ref() {
                mgr.lock_pointer();
            }
            Ok(())
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "unlockPointer",
        lua.create_function(move |_, ()| {
            if let Some(mgr) = input_mgr_clone.as_ref() {
                mgr.unlock_pointer();
            }
            Ok(())
        })?,
    )?;

    // Action system methods
    let input_mgr_clone = input_manager.clone();
    input.set(
        "getActionValue",
        lua.create_function(move |lua, (map_name, action_name): (String, String)| {
            if let Some(mgr) = input_mgr_clone.as_ref() {
                if let Some((value_type, values)) = mgr.get_action_value(&map_name, &action_name) {
                    // Return appropriate type based on value_type
                    match value_type.as_str() {
                        "scalar" => Ok(LuaValue::Number(
                            values.get(0).copied().unwrap_or(0.0) as f64
                        )),
                        "vector2" => {
                            let table = lua.create_table()?;
                            table.set(1, values.get(0).copied().unwrap_or(0.0))?;
                            table.set(2, values.get(1).copied().unwrap_or(0.0))?;
                            Ok(LuaValue::Table(table))
                        }
                        "vector3" => {
                            let table = lua.create_table()?;
                            table.set(1, values.get(0).copied().unwrap_or(0.0))?;
                            table.set(2, values.get(1).copied().unwrap_or(0.0))?;
                            table.set(3, values.get(2).copied().unwrap_or(0.0))?;
                            Ok(LuaValue::Table(table))
                        }
                        _ => Ok(LuaValue::Number(0.0)),
                    }
                } else {
                    Ok(LuaValue::Number(0.0))
                }
            } else {
                Ok(LuaValue::Number(0.0))
            }
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "isActionActive",
        lua.create_function(move |_, (map_name, action_name): (String, String)| {
            Ok(input_mgr_clone
                .as_ref()
                .map(|mgr| mgr.is_action_active(&map_name, &action_name))
                .unwrap_or(false))
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "enableActionMap",
        lua.create_function(move |_, map_name: String| {
            if let Some(mgr) = input_mgr_clone.as_ref() {
                mgr.enable_action_map(&map_name);
            }
            Ok(())
        })?,
    )?;

    let input_mgr_clone = input_manager.clone();
    input.set(
        "disableActionMap",
        lua.create_function(move |_, map_name: String| {
            if let Some(mgr) = input_mgr_clone.as_ref() {
                mgr.disable_action_map(&map_name);
            }
            Ok(())
        })?,
    )?;

    // TODO: onAction / offAction - requires callback storage

    globals.set("input", input)?;
    log::debug!(
        "Input API registered ({})",
        if input_manager.is_some() {
            "with real InputManager"
        } else {
            "stub mode"
        }
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_api_registration_stub() {
        let lua = Lua::new();
        assert!(register_input_api(&lua, None).is_ok());

        // Verify input table exists
        let result: LuaResult<bool> = lua.load("return input ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_is_key_down_stub() {
        let lua = Lua::new();
        register_input_api(&lua, None).unwrap();

        // Should return false (stub)
        let result: bool = lua.load(r#"return input.isKeyDown("w")"#).eval().unwrap();
        assert!(!result);
    }

    #[test]
    fn test_mouse_position_stub() {
        let lua = Lua::new();
        register_input_api(&lua, None).unwrap();

        // Should return [0, 0] (stub)
        let result: LuaResult<(f64, f64)> = lua
            .load(
                r#"
                local pos = input.mousePosition()
                return pos[1], pos[2]
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let (x, y) = result.unwrap();
        assert_eq!(x, 0.0);
        assert_eq!(y, 0.0);
    }
}
