//! Save/Load API for Lua scripts
//!
//! Provides persistent key-value storage for game save data.
//! - Store integers, floats, strings, and JSON-serializable objects
//! - Data persisted to disk automatically
//! - Thread-safe access for scripts

use mlua::prelude::*;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Save manager reference for save/load operations
pub type SaveManagerRef = Arc<dyn SaveManagerProvider + Send + Sync>;

/// Trait for providing save/load functionality to scripts
pub trait SaveManagerProvider {
    /// Set an integer value
    fn set_int(&self, key: &str, value: i64);

    /// Get an integer value
    fn get_int(&self, key: &str, default: Option<i64>) -> Option<i64>;

    /// Set a float value
    fn set_float(&self, key: &str, value: f64);

    /// Get a float value
    fn get_float(&self, key: &str, default: Option<f64>) -> Option<f64>;

    /// Set a string value
    fn set_string(&self, key: &str, value: &str);

    /// Get a string value
    fn get_string(&self, key: &str, default: Option<&str>) -> Option<String>;

    /// Set a JSON-serializable object
    fn set_object(&self, key: &str, value: JsonValue) -> Result<(), String>;

    /// Get a JSON object
    fn get_object(&self, key: &str) -> Option<JsonValue>;

    /// Delete a key
    fn delete_key(&self, key: &str);

    /// Clear all save data
    fn clear(&self);

    /// Check if a key exists
    fn has_key(&self, key: &str) -> bool;

    /// Save data to disk
    fn save(&self) -> Result<(), String>;

    /// Load data from disk
    fn load(&self) -> Result<(), String>;
}

/// Simple file-based save manager
pub struct FileSaveManager {
    data: Arc<Mutex<HashMap<String, JsonValue>>>,
    save_path: PathBuf,
    auto_save: bool,
}

impl FileSaveManager {
    /// Create a new save manager with the specified save file path
    pub fn new(save_path: PathBuf, auto_save: bool) -> Self {
        log::info!("Creating FileSaveManager with path: {:?}", save_path);

        // Ensure the parent directory exists
        if let Some(parent) = save_path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    log::warn!("Failed to create save directory {:?}: {}", parent, e);
                }
            }
        }

        let mut manager = Self {
            data: Arc::new(Mutex::new(HashMap::new())),
            save_path,
            auto_save,
        };

        // Try to load existing save data
        if let Err(e) = manager.load() {
            log::info!("No existing save data found ({}), starting fresh", e);
        }

        manager
    }

    /// Helper to auto-save if enabled
    fn try_auto_save(&self) {
        if self.auto_save {
            if let Err(e) = self.save() {
                log::error!("Auto-save failed: {}", e);
            }
        }
    }
}

impl SaveManagerProvider for FileSaveManager {
    fn set_int(&self, key: &str, value: i64) {
        if let Ok(mut data) = self.data.lock() {
            data.insert(key.to_string(), JsonValue::Number(value.into()));
            drop(data);
            self.try_auto_save();
            log::debug!("Save API: Set int '{}' = {}", key, value);
        }
    }

    fn get_int(&self, key: &str, default: Option<i64>) -> Option<i64> {
        if let Ok(data) = self.data.lock() {
            if let Some(value) = data.get(key) {
                if let Some(num) = value.as_i64() {
                    return Some(num);
                }
            }
        }
        default
    }

    fn set_float(&self, key: &str, value: f64) {
        if let Ok(mut data) = self.data.lock() {
            data.insert(
                key.to_string(),
                JsonValue::Number(serde_json::Number::from_f64(value).unwrap_or_else(|| 0.into())),
            );
            drop(data);
            self.try_auto_save();
            log::debug!("Save API: Set float '{}' = {}", key, value);
        }
    }

    fn get_float(&self, key: &str, default: Option<f64>) -> Option<f64> {
        if let Ok(data) = self.data.lock() {
            if let Some(value) = data.get(key) {
                if let Some(num) = value.as_f64() {
                    return Some(num);
                }
            }
        }
        default
    }

    fn set_string(&self, key: &str, value: &str) {
        if let Ok(mut data) = self.data.lock() {
            data.insert(key.to_string(), JsonValue::String(value.to_string()));
            drop(data);
            self.try_auto_save();
            log::debug!("Save API: Set string '{}' = '{}'", key, value);
        }
    }

    fn get_string(&self, key: &str, default: Option<&str>) -> Option<String> {
        if let Ok(data) = self.data.lock() {
            if let Some(value) = data.get(key) {
                if let Some(s) = value.as_str() {
                    return Some(s.to_string());
                }
            }
        }
        default.map(|s| s.to_string())
    }

    fn set_object(&self, key: &str, value: JsonValue) -> Result<(), String> {
        if let Ok(mut data) = self.data.lock() {
            data.insert(key.to_string(), value);
            drop(data);
            self.try_auto_save();
            log::debug!("Save API: Set object '{}'", key);
            Ok(())
        } else {
            Err("Failed to acquire lock".to_string())
        }
    }

    fn get_object(&self, key: &str) -> Option<JsonValue> {
        if let Ok(data) = self.data.lock() {
            data.get(key).cloned()
        } else {
            None
        }
    }

    fn delete_key(&self, key: &str) {
        if let Ok(mut data) = self.data.lock() {
            data.remove(key);
            drop(data);
            self.try_auto_save();
            log::debug!("Save API: Deleted key '{}'", key);
        }
    }

    fn clear(&self) {
        if let Ok(mut data) = self.data.lock() {
            data.clear();
            drop(data);
            self.try_auto_save();
            log::info!("Save API: Cleared all save data");
        }
    }

    fn has_key(&self, key: &str) -> bool {
        if let Ok(data) = self.data.lock() {
            data.contains_key(key)
        } else {
            false
        }
    }

    fn save(&self) -> Result<(), String> {
        if let Ok(data) = self.data.lock() {
            let json = serde_json::to_string_pretty(&*data)
                .map_err(|e| format!("Failed to serialize save data: {}", e))?;

            fs::write(&self.save_path, json)
                .map_err(|e| format!("Failed to write save file: {}", e))?;

            log::info!("Save data written to {:?}", self.save_path);
            Ok(())
        } else {
            Err("Failed to acquire lock".to_string())
        }
    }

    fn load(&self) -> Result<(), String> {
        if !self.save_path.exists() {
            return Err("Save file does not exist".to_string());
        }

        let json = fs::read_to_string(&self.save_path)
            .map_err(|e| format!("Failed to read save file: {}", e))?;

        let loaded_data: HashMap<String, JsonValue> =
            serde_json::from_str(&json).map_err(|e| format!("Failed to parse save file: {}", e))?;

        if let Ok(mut data) = self.data.lock() {
            *data = loaded_data;
            log::info!("Save data loaded from {:?}", self.save_path);
            Ok(())
        } else {
            Err("Failed to acquire lock".to_string())
        }
    }
}

/// Create a default file-based save manager
pub fn create_file_save_manager(save_path: Option<PathBuf>) -> SaveManagerRef {
    let path = save_path.unwrap_or_else(|| {
        let mut p = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        p.push("saves");
        p.push("savegame.json");
        p
    });

    Arc::new(FileSaveManager::new(path, true)) // Auto-save enabled by default
}

/// Register save/load API in Lua global scope
///
/// Provides:
/// - `save.setInt(key: string, value: number)`
/// - `save.getInt(key: string, default?: number): number`
/// - `save.setFloat(key: string, value: number)`
/// - `save.getFloat(key: string, default?: number): number`
/// - `save.setString(key: string, value: string)`
/// - `save.getString(key: string, default?: string): string`
/// - `save.setObject(key: string, value: table)`
/// - `save.getObject(key: string): table|nil`
/// - `save.deleteKey(key: string)`
/// - `save.clear()`
/// - `save.hasKey(key: string): boolean`
/// - `save.save()` - Manually save to disk
/// - `save.load()` - Manually load from disk
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `save_manager` - Save manager for persistence
///
/// # Example Lua usage
///
/// ```lua
/// -- Set values
/// save.setInt("playerLevel", 10)
/// save.setFloat("playerHealth", 85.5)
/// save.setString("playerName", "Hero")
/// save.setObject("inventory", {gold = 100, items = {"sword", "shield"}})
///
/// -- Get values with defaults
/// local level = save.getInt("playerLevel", 1)
/// local health = save.getFloat("playerHealth", 100.0)
/// local name = save.getString("playerName", "Player")
/// local inventory = save.getObject("inventory")
///
/// -- Check if key exists
/// if save.hasKey("playerLevel") then
///     console.log("Player level exists")
/// end
///
/// -- Delete a key
/// save.deleteKey("oldData")
///
/// -- Clear all save data
/// save.clear()
///
/// -- Manual save/load (auto-save is enabled by default)
/// save.save()  -- Force save to disk
/// save.load()  -- Reload from disk
/// ```
pub fn register_save_api(lua: &Lua, save_manager: Option<SaveManagerRef>) -> LuaResult<()> {
    let globals = lua.globals();
    let save = lua.create_table()?;

    // save.setInt(key: string, value: number)
    {
        let mgr = save_manager.clone();
        save.set(
            "setInt",
            lua.create_function(move |_, (key, value): (String, i64)| {
                if let Some(ref mgr) = mgr {
                    mgr.set_int(&key, value);
                } else {
                    log::warn!("Save API: setInt() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.getInt(key: string, default?: number): number
    {
        let mgr = save_manager.clone();
        save.set(
            "getInt",
            lua.create_function(move |_, (key, default): (String, Option<i64>)| {
                if let Some(ref mgr) = mgr {
                    Ok(mgr.get_int(&key, default))
                } else {
                    Ok(default)
                }
            })?,
        )?;
    }

    // save.setFloat(key: string, value: number)
    {
        let mgr = save_manager.clone();
        save.set(
            "setFloat",
            lua.create_function(move |_, (key, value): (String, f64)| {
                if let Some(ref mgr) = mgr {
                    mgr.set_float(&key, value);
                } else {
                    log::warn!("Save API: setFloat() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.getFloat(key: string, default?: number): number
    {
        let mgr = save_manager.clone();
        save.set(
            "getFloat",
            lua.create_function(move |_, (key, default): (String, Option<f64>)| {
                if let Some(ref mgr) = mgr {
                    Ok(mgr.get_float(&key, default))
                } else {
                    Ok(default)
                }
            })?,
        )?;
    }

    // save.setString(key: string, value: string)
    {
        let mgr = save_manager.clone();
        save.set(
            "setString",
            lua.create_function(move |_, (key, value): (String, String)| {
                if let Some(ref mgr) = mgr {
                    mgr.set_string(&key, &value);
                } else {
                    log::warn!("Save API: setString() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.getString(key: string, default?: string): string
    {
        let mgr = save_manager.clone();
        save.set(
            "getString",
            lua.create_function(move |_, (key, default): (String, Option<String>)| {
                if let Some(ref mgr) = mgr {
                    Ok(mgr.get_string(&key, default.as_deref()))
                } else {
                    Ok(default)
                }
            })?,
        )?;
    }

    // save.setObject(key: string, value: table)
    {
        let mgr = save_manager.clone();
        save.set(
            "setObject",
            lua.create_function(move |lua_ctx, (key, value): (String, LuaValue)| {
                if let Some(ref mgr) = mgr {
                    // Convert Lua value to JSON
                    let json_value = lua_value_to_json(&value, lua_ctx)?;
                    if let Err(e) = mgr.set_object(&key, json_value) {
                        return Err(LuaError::RuntimeError(format!(
                            "Failed to set object: {}",
                            e
                        )));
                    }
                } else {
                    log::warn!("Save API: setObject() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.getObject(key: string): table|nil
    {
        let mgr = save_manager.clone();
        save.set(
            "getObject",
            lua.create_function(move |lua_ctx, key: String| {
                if let Some(ref mgr) = mgr {
                    if let Some(json_value) = mgr.get_object(&key) {
                        // Convert JSON to Lua value
                        return json_to_lua_value(lua_ctx, &json_value);
                    }
                }
                Ok(LuaValue::Nil)
            })?,
        )?;
    }

    // save.deleteKey(key: string)
    {
        let mgr = save_manager.clone();
        save.set(
            "deleteKey",
            lua.create_function(move |_, key: String| {
                if let Some(ref mgr) = mgr {
                    mgr.delete_key(&key);
                } else {
                    log::warn!("Save API: deleteKey() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.clear()
    {
        let mgr = save_manager.clone();
        save.set(
            "clear",
            lua.create_function(move |_, ()| {
                if let Some(ref mgr) = mgr {
                    mgr.clear();
                } else {
                    log::warn!("Save API: clear() called in stub mode");
                }
                Ok(())
            })?,
        )?;
    }

    // save.hasKey(key: string): boolean
    {
        let mgr = save_manager.clone();
        save.set(
            "hasKey",
            lua.create_function(move |_, key: String| {
                if let Some(ref mgr) = mgr {
                    Ok(mgr.has_key(&key))
                } else {
                    Ok(false)
                }
            })?,
        )?;
    }

    // save.save() - Manual save to disk
    {
        let mgr = save_manager.clone();
        save.set(
            "save",
            lua.create_function(move |_, ()| {
                if let Some(ref mgr) = mgr {
                    match mgr.save() {
                        Ok(()) => Ok(true),
                        Err(e) => {
                            log::error!("Failed to save: {}", e);
                            Ok(false)
                        }
                    }
                } else {
                    log::warn!("Save API: save() called in stub mode");
                    Ok(false)
                }
            })?,
        )?;
    }

    // save.load() - Manual load from disk
    let has_manager = save_manager.is_some();
    {
        let mgr = save_manager;
        save.set(
            "load",
            lua.create_function(move |_, ()| {
                if let Some(ref mgr) = mgr {
                    match mgr.load() {
                        Ok(()) => Ok(true),
                        Err(e) => {
                            log::error!("Failed to load: {}", e);
                            Ok(false)
                        }
                    }
                } else {
                    log::warn!("Save API: load() called in stub mode");
                    Ok(false)
                }
            })?,
        )?;
    }

    globals.set("save", save)?;
    log::debug!(
        "Save API registered ({})",
        if has_manager {
            "with file save manager"
        } else {
            "stub mode"
        }
    );
    Ok(())
}

/// Convert Lua value to JSON value
fn lua_value_to_json(value: &LuaValue, lua: &Lua) -> LuaResult<JsonValue> {
    match value {
        LuaValue::Nil => Ok(JsonValue::Null),
        LuaValue::Boolean(b) => Ok(JsonValue::Bool(*b)),
        LuaValue::Integer(i) => Ok(JsonValue::Number((*i).into())),
        LuaValue::Number(n) => Ok(JsonValue::Number(
            serde_json::Number::from_f64(*n).unwrap_or_else(|| 0.into()),
        )),
        LuaValue::String(s) => Ok(JsonValue::String(s.to_str()?.to_string())),
        LuaValue::Table(t) => {
            // Check if it's an array or object
            let len = t.len()?;
            if len > 0 {
                // Array-like table
                let mut arr = Vec::new();
                for i in 1..=len {
                    let v: LuaValue = t.get(i)?;
                    arr.push(lua_value_to_json(&v, lua)?);
                }
                Ok(JsonValue::Array(arr))
            } else {
                // Object-like table
                let mut obj = serde_json::Map::new();
                for pair in t.pairs::<LuaValue, LuaValue>() {
                    let (k, v) = pair?;
                    let key = match k {
                        LuaValue::String(s) => s.to_str()?.to_string(),
                        LuaValue::Integer(i) => i.to_string(),
                        LuaValue::Number(n) => n.to_string(),
                        _ => continue,
                    };
                    obj.insert(key, lua_value_to_json(&v, lua)?);
                }
                Ok(JsonValue::Object(obj))
            }
        }
        _ => Err(LuaError::RuntimeError(
            "Unsupported Lua value type for JSON conversion".to_string(),
        )),
    }
}

/// Convert JSON value to Lua value
fn json_to_lua_value<'lua>(lua: &'lua Lua, value: &JsonValue) -> LuaResult<LuaValue> {
    match value {
        JsonValue::Null => Ok(LuaValue::Nil),
        JsonValue::Bool(b) => Ok(LuaValue::Boolean(*b)),
        JsonValue::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(LuaValue::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(LuaValue::Number(f))
            } else {
                Ok(LuaValue::Nil)
            }
        }
        JsonValue::String(s) => Ok(LuaValue::String(lua.create_string(s)?)),
        JsonValue::Array(arr) => {
            let table = lua.create_table()?;
            for (i, v) in arr.iter().enumerate() {
                table.set(i + 1, json_to_lua_value(lua, v)?)?;
            }
            Ok(LuaValue::Table(table))
        }
        JsonValue::Object(obj) => {
            let table = lua.create_table()?;
            for (k, v) in obj {
                table.set(k.as_str(), json_to_lua_value(lua, v)?)?;
            }
            Ok(LuaValue::Table(table))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_save_api_registration_stub() {
        let lua = Lua::new();
        assert!(register_save_api(&lua, None).is_ok());

        // Verify save table exists
        let result: LuaResult<bool> = lua.load("return save ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_set_get_int() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        manager.set_int("score", 100);
        assert_eq!(manager.get_int("score", None), Some(100));
        assert_eq!(manager.get_int("nonexistent", Some(42)), Some(42));
    }

    #[test]
    fn test_set_get_float() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        manager.set_float("health", 85.5);
        assert_eq!(manager.get_float("health", None), Some(85.5));
        assert_eq!(manager.get_float("nonexistent", Some(100.0)), Some(100.0));
    }

    #[test]
    fn test_set_get_string() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        manager.set_string("name", "Hero");
        assert_eq!(manager.get_string("name", None), Some("Hero".to_string()));
        assert_eq!(
            manager.get_string("nonexistent", Some("Default")),
            Some("Default".to_string())
        );
    }

    #[test]
    fn test_delete_key() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        manager.set_int("score", 100);
        assert!(manager.has_key("score"));

        manager.delete_key("score");
        assert!(!manager.has_key("score"));
    }

    #[test]
    fn test_clear() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        manager.set_int("score", 100);
        manager.set_string("name", "Hero");
        assert!(manager.has_key("score"));
        assert!(manager.has_key("name"));

        manager.clear();
        assert!(!manager.has_key("score"));
        assert!(!manager.has_key("name"));
    }

    #[test]
    fn test_save_load() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");

        // Create manager and save data
        {
            let manager = FileSaveManager::new(save_path.clone(), false);
            manager.set_int("score", 100);
            manager.set_string("name", "Hero");
            assert!(manager.save().is_ok());
        }

        // Load data in new manager
        {
            let manager = FileSaveManager::new(save_path, false);
            assert_eq!(manager.get_int("score", None), Some(100));
            assert_eq!(manager.get_string("name", None), Some("Hero".to_string()));
        }
    }

    #[test]
    fn test_lua_int_operations() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        // Set and get int
        lua.load(
            r#"
            save.setInt("score", 100)
            local score = save.getInt("score", 0)
            assert(score == 100, "Score should be 100")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_string_operations() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            save.setString("name", "Hero")
            local name = save.getString("name", "Default")
            assert(name == "Hero", "Name should be 'Hero'")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_object_operations() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            save.setObject("inventory", {gold = 100, items = {"sword", "shield"}})
            local inv = save.getObject("inventory")
            assert(inv ~= nil, "Inventory should exist")
            assert(inv.gold == 100, "Gold should be 100")
            assert(inv.items[1] == "sword", "First item should be sword")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_has_key() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            assert(not save.hasKey("score"), "Score should not exist initially")
            save.setInt("score", 100)
            assert(save.hasKey("score"), "Score should exist after setting")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_delete_key() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            save.setInt("score", 100)
            assert(save.hasKey("score"), "Score should exist")
            save.deleteKey("score")
            assert(not save.hasKey("score"), "Score should be deleted")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_clear() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            save.setInt("score", 100)
            save.setString("name", "Hero")
            assert(save.hasKey("score") and save.hasKey("name"), "Both keys should exist")
            save.clear()
            assert(not save.hasKey("score") and not save.hasKey("name"), "All keys should be cleared")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_lua_comprehensive_workflow() {
        let temp_dir = TempDir::new().unwrap();
        let save_path = temp_dir.path().join("test_save.json");
        let manager = Arc::new(FileSaveManager::new(save_path, false));

        let lua = Lua::new();
        register_save_api(&lua, Some(manager.clone())).unwrap();

        lua.load(
            r#"
            -- Set different types of values
            save.setInt("level", 10)
            save.setFloat("health", 85.5)
            save.setString("playerName", "Hero")
            save.setObject("stats", {
                strength = 15,
                agility = 12,
                equipment = {"sword", "shield", "helmet"}
            })

            -- Get with defaults
            assert(save.getInt("level", 1) == 10, "Level should be 10")
            assert(save.getFloat("health", 100.0) == 85.5, "Health should be 85.5")
            assert(save.getString("playerName", "NoName") == "Hero", "Name should be Hero")

            -- Check non-existent keys return defaults
            assert(save.getInt("missing", 42) == 42, "Missing int should return default")
            assert(save.getFloat("missing", 3.14) == 3.14, "Missing float should return default")
            assert(save.getString("missing", "default") == "default", "Missing string should return default")

            -- Verify object
            local stats = save.getObject("stats")
            assert(stats.strength == 15, "Strength should be 15")
            assert(stats.equipment[2] == "shield", "Second equipment should be shield")

            -- Delete and verify
            save.deleteKey("level")
            assert(not save.hasKey("level"), "Level should be deleted")

            -- Clear everything
            save.clear()
            assert(not save.hasKey("health"), "All data should be cleared")
        "#,
        )
        .exec()
        .unwrap();
    }
}
