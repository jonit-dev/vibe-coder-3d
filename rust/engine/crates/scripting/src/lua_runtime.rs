//! Lua runtime wrapper with lifecycle management
//!
//! This module provides a safe wrapper around mlua's Lua runtime, managing script loading,
//! lifecycle function extraction, and execution.

use anyhow::{Context, Result};
use mlua::prelude::*;
use mlua::{LuaOptions, RegistryKey, StdLib};
use std::path::Path;

/// Wrapper around mlua::Lua that provides lifecycle management
pub struct LuaScriptRuntime {
    lua: Lua,
}

impl LuaScriptRuntime {
    /// Create a new Lua runtime with debug library enabled for TypeScriptToLua
    pub fn new() -> Result<Self> {
        // Enable standard libraries + debug for TypeScriptToLua source maps
        let lua = unsafe {
            Lua::unsafe_new_with(StdLib::ALL_SAFE | StdLib::DEBUG, LuaOptions::default())
        };

        Ok(Self { lua })
    }

    /// Load a Lua script from a file path
    ///
    /// Executes the script and extracts lifecycle functions (onStart, onUpdate, etc.)
    /// storing them in the Lua registry to extend their lifetime beyond local scope.
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the .lua file
    ///
    /// # Returns
    ///
    /// A `LuaScript` containing registry keys for lifecycle functions
    pub fn load_script(&self, path: &Path) -> Result<LuaScript> {
        let script_content = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read Lua script: {}", path.display()))?;

        // Execute script - TypeScriptToLua scripts return a module table
        let module: mlua::Value = self
            .lua
            .load(&script_content)
            .set_name(path.to_string_lossy())
            .eval()
            .map_err(|e| anyhow::anyhow!("Failed to execute Lua script: {}", e))?;

        // Check if the script returns a module table (TypeScriptToLua pattern)
        // or defines global functions (plain Lua pattern)
        let source_table = if let mlua::Value::Table(ref table) = module {
            table.clone()
        } else {
            self.lua.globals()
        };

        // Extract lifecycle functions from either the module table or globals
        let on_start: Option<LuaFunction> = source_table.get("onStart")?;
        let on_start = on_start
            .map(|f| self.lua.create_registry_value(f))
            .transpose()
            .map_err(|e| anyhow::anyhow!("Failed to register onStart function: {}", e))?;

        let on_update: Option<LuaFunction> = source_table.get("onUpdate")?;
        let on_update = on_update
            .map(|f| self.lua.create_registry_value(f))
            .transpose()
            .map_err(|e| anyhow::anyhow!("Failed to register onUpdate function: {}", e))?;

        let on_destroy: Option<LuaFunction> = source_table.get("onDestroy")?;
        let on_destroy = on_destroy
            .map(|f| self.lua.create_registry_value(f))
            .transpose()
            .map_err(|e| anyhow::anyhow!("Failed to register onDestroy function: {}", e))?;

        let on_enable: Option<LuaFunction> = source_table.get("onEnable")?;
        let on_enable = on_enable
            .map(|f| self.lua.create_registry_value(f))
            .transpose()
            .map_err(|e| anyhow::anyhow!("Failed to register onEnable function: {}", e))?;

        let on_disable: Option<LuaFunction> = source_table.get("onDisable")?;
        let on_disable = on_disable
            .map(|f| self.lua.create_registry_value(f))
            .transpose()
            .map_err(|e| anyhow::anyhow!("Failed to register onDisable function: {}", e))?;

        // Warn if no lifecycle functions found
        if on_start.is_none() && on_update.is_none() && on_destroy.is_none() {
            log::warn!(
                "Script '{}' defines no lifecycle functions (onStart, onUpdate, onDestroy)",
                path.display()
            );
        }

        Ok(LuaScript {
            on_start,
            on_update,
            on_destroy,
            on_enable,
            on_disable,
        })
    }

    /// Get a reference to the underlying Lua VM
    pub fn lua(&self) -> &Lua {
        &self.lua
    }
}

impl Default for LuaScriptRuntime {
    fn default() -> Self {
        Self::new().expect("Failed to create Lua runtime")
    }
}

/// Represents a loaded Lua script with lifecycle functions stored in the registry
///
/// Using RegistryKey allows us to store function references beyond their local scope,
/// avoiding lifetime issues with Lua's garbage collector.
pub struct LuaScript {
    on_start: Option<RegistryKey>,
    on_update: Option<RegistryKey>,
    on_destroy: Option<RegistryKey>,
    on_enable: Option<RegistryKey>,
    on_disable: Option<RegistryKey>,
}

impl LuaScript {
    /// Call the onStart lifecycle function if it exists
    pub fn call_on_start(&self, lua: &Lua) -> Result<()> {
        if let Some(ref key) = self.on_start {
            let func: LuaFunction = lua.registry_value(key).map_err(|e| {
                anyhow::anyhow!("Failed to retrieve onStart function from registry: {}", e)
            })?;
            func.call::<()>(())
                .map_err(|e| anyhow::anyhow!("Error executing onStart(): {}", e))?;
        }
        Ok(())
    }

    /// Call the onUpdate lifecycle function if it exists
    ///
    /// # Arguments
    ///
    /// * `lua` - Reference to the Lua VM
    /// * `delta_time` - Time elapsed since last frame in seconds
    pub fn call_on_update(&self, lua: &Lua, delta_time: f32) -> Result<()> {
        if let Some(ref key) = self.on_update {
            let func: LuaFunction = lua.registry_value(key).map_err(|e| {
                anyhow::anyhow!("Failed to retrieve onUpdate function from registry: {}", e)
            })?;
            func.call::<()>(delta_time)
                .map_err(|e| anyhow::anyhow!("Error executing onUpdate(): {}", e))?;
        }
        Ok(())
    }

    /// Call the onDestroy lifecycle function if it exists
    pub fn call_on_destroy(&self, lua: &Lua) -> Result<()> {
        if let Some(ref key) = self.on_destroy {
            let func: LuaFunction = lua.registry_value(key).map_err(|e| {
                anyhow::anyhow!("Failed to retrieve onDestroy function from registry: {}", e)
            })?;
            func.call::<()>(())
                .map_err(|e| anyhow::anyhow!("Error executing onDestroy(): {}", e))?;
        }
        Ok(())
    }

    /// Call the onEnable lifecycle function if it exists
    pub fn call_on_enable(&self, lua: &Lua) -> Result<()> {
        if let Some(ref key) = self.on_enable {
            let func: LuaFunction = lua.registry_value(key).map_err(|e| {
                anyhow::anyhow!("Failed to retrieve onEnable function from registry: {}", e)
            })?;
            func.call::<()>(())
                .map_err(|e| anyhow::anyhow!("Error executing onEnable(): {}", e))?;
        }
        Ok(())
    }

    /// Call the onDisable lifecycle function if it exists
    pub fn call_on_disable(&self, lua: &Lua) -> Result<()> {
        if let Some(ref key) = self.on_disable {
            let func: LuaFunction = lua.registry_value(key).map_err(|e| {
                anyhow::anyhow!("Failed to retrieve onDisable function from registry: {}", e)
            })?;
            func.call::<()>(())
                .map_err(|e| anyhow::anyhow!("Error executing onDisable(): {}", e))?;
        }
        Ok(())
    }

    /// Check if this script has an onUpdate function
    pub fn has_on_update(&self) -> bool {
        self.on_update.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_lua_runtime_creation() {
        let runtime = LuaScriptRuntime::new();
        assert!(runtime.is_ok());
    }

    #[test]
    fn test_load_script_with_lifecycle() {
        let runtime = LuaScriptRuntime::new().unwrap();

        // Create temporary Lua script file
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(
            temp_file,
            r#"
            function onStart()
                print("Started!")
            end

            function onUpdate(deltaTime)
                print("Update:", deltaTime)
            end

            function onDestroy()
                print("Destroyed!")
            end
            "#
        )
        .unwrap();

        // Load script and verify lifecycle functions exist
        let script = runtime.load_script(temp_file.path()).unwrap();
        assert!(script.on_start.is_some());
        assert!(script.on_update.is_some());
        assert!(script.on_destroy.is_some());
    }

    #[test]
    fn test_call_lifecycle_methods() {
        let runtime = LuaScriptRuntime::new().unwrap();

        // Create script with lifecycle functions
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(
            temp_file,
            r#"
            function onStart()
            end

            function onUpdate(deltaTime)
            end

            function onDestroy()
            end
            "#
        )
        .unwrap();

        let script = runtime.load_script(temp_file.path()).unwrap();

        // Call lifecycle methods (should not panic)
        script.call_on_start(runtime.lua()).unwrap();
        script.call_on_update(runtime.lua(), 0.016).unwrap();
        script.call_on_destroy(runtime.lua()).unwrap();
    }

    #[test]
    fn test_script_with_no_lifecycle_functions() {
        let runtime = LuaScriptRuntime::new().unwrap();

        // Create script with no lifecycle functions
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(
            temp_file,
            r#"
            -- Empty script
            local x = 5
            "#
        )
        .unwrap();

        // Should load but warn
        let script = runtime.load_script(temp_file.path()).unwrap();
        assert!(script.on_start.is_none());
        assert!(script.on_update.is_none());
        assert!(script.on_destroy.is_none());
    }

    #[test]
    fn test_script_with_syntax_error() {
        let runtime = LuaScriptRuntime::new().unwrap();

        // Create script with syntax error
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(
            temp_file,
            r#"
            function onStart(
                -- Missing closing parenthesis
            "#
        )
        .unwrap();

        // Should fail to load
        let result = runtime.load_script(temp_file.path());
        assert!(result.is_err());
    }

    #[test]
    fn test_has_on_update() {
        let runtime = LuaScriptRuntime::new().unwrap();

        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(
            temp_file,
            r#"
            function onUpdate(deltaTime)
            end
            "#
        )
        .unwrap();

        let script = runtime.load_script(temp_file.path()).unwrap();
        assert!(script.has_on_update());
    }
}
