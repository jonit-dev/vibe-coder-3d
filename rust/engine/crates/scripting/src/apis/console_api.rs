///! Console API for Lua scripts
///!
///! Provides console.log, console.warn, console.error that map to Rust's log crate.
use mlua::{Lua, Result as LuaResult, Variadic};

/// Register console API in the Lua environment
///
/// Creates a global `console` table with:
/// - console:log(...) - Maps to log::debug!
/// - console:warn(...) - Maps to log::warn!
/// - console:error(...) - Maps to log::error!
pub fn register_console_api(lua: &Lua) -> LuaResult<()> {
    let console_table = lua.create_table()?;

    // console:log(...)
    console_table.set(
        "log",
        lua.create_function(|_, (_self, args): (mlua::Value, Variadic<mlua::Value>)| {
            let message = format_variadic_args(args);
            log::debug!("[Lua Console] {}", message);
            Ok(())
        })?,
    )?;

    // console:warn(...)
    console_table.set(
        "warn",
        lua.create_function(|_, (_self, args): (mlua::Value, Variadic<mlua::Value>)| {
            let message = format_variadic_args(args);
            log::warn!("[Lua Console] {}", message);
            Ok(())
        })?,
    )?;

    // console:error(...)
    console_table.set(
        "error",
        lua.create_function(|_, (_self, args): (mlua::Value, Variadic<mlua::Value>)| {
            let message = format_variadic_args(args);
            log::error!("[Lua Console] {}", message);
            Ok(())
        })?,
    )?;

    lua.globals().set("console", console_table)?;

    Ok(())
}

/// Format variadic Lua arguments into a string
fn format_variadic_args(args: Variadic<mlua::Value>) -> String {
    args.iter()
        .map(|v| value_to_string(v))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Convert a Lua value to a string for logging
fn value_to_string(value: &mlua::Value) -> String {
    match value {
        mlua::Value::Nil => "nil".to_string(),
        mlua::Value::Boolean(b) => b.to_string(),
        mlua::Value::Integer(i) => i.to_string(),
        mlua::Value::Number(n) => n.to_string(),
        mlua::Value::String(s) => match s.to_str() {
            Ok(str_val) => str_val.to_string(),
            Err(_) => "<invalid utf8>".to_string(),
        },
        mlua::Value::Table(t) => {
            // Simple table representation
            if let Ok(len) = t.len() {
                if len > 0 {
                    // Array-like table
                    let items: Vec<String> = (1..=len)
                        .filter_map(|i| t.get::<mlua::Value>(i).ok())
                        .map(|v| value_to_string(&v))
                        .collect();
                    return format!("[{}]", items.join(", "));
                }
            }
            // Object-like table or empty
            format!("table: {:?}", t.to_pointer())
        }
        mlua::Value::Function(_) => "function".to_string(),
        mlua::Value::Thread(_) => "thread".to_string(),
        mlua::Value::UserData(_) => "userdata".to_string(),
        mlua::Value::LightUserData(_) => "lightuserdata".to_string(),
        mlua::Value::Error(e) => format!("error: {}", e),
        mlua::Value::Other(_) => "other".to_string(),
    }
}
