//! Scene API for Lua scripts
//!
//! Provides scene management capabilities for game scripts.
//! - Load/unload scenes
//! - Get current scene information
//! - Additive scene loading (load without unloading current)

use mlua::prelude::*;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use vibe_scene::Scene;

/// Scene manager reference for scene operations
/// This will be passed in from the engine to handle actual scene loading
pub type SceneManagerRef = Arc<dyn SceneManagerProvider + Send + Sync>;

/// Trait for providing scene management to scripts
/// Engine implements this with real scene loading capabilities
pub trait SceneManagerProvider {
    /// Get the currently loaded scene
    fn get_current_scene(&self) -> Option<Arc<Scene>>;

    /// Load a scene (replaces current scene)
    fn load_scene(&self, scene_path: &str) -> Result<(), String>;

    /// Load a scene additively (keeps current scene)
    fn load_scene_additive(&self, scene_path: &str) -> Result<(), String>;

    /// Unload the current scene
    fn unload_scene(&self) -> Result<(), String>;

    /// Get the current scene name/path
    fn get_current_scene_path(&self) -> Option<String>;
}

/// Simple scene manager that provides real scene path tracking
/// For now, scene loading/unloading is not implemented at runtime level
pub struct SimpleSceneManager {
    /// Current scene path
    current_scene_path: Arc<Mutex<Option<String>>>,
    /// Base path for resolving relative scene paths
    base_path: PathBuf,
}

impl SimpleSceneManager {
    /// Create a new simple scene manager
    pub fn new(initial_scene_path: Option<String>, base_path: PathBuf) -> Self {
        log::info!("Creating SimpleSceneManager with initial scene: {:?}", initial_scene_path);
        Self {
            current_scene_path: Arc::new(Mutex::new(initial_scene_path)),
            base_path,
        }
    }

    /// Update the current scene path (call this when scene is loaded at app level)
    pub fn set_scene_path(&self, path: Option<String>) {
        if let Ok(mut current_path) = self.current_scene_path.lock() {
            *current_path = path.clone();
            log::info!("Scene path updated to: {:?}", path);
        }
    }
}

impl SceneManagerProvider for SimpleSceneManager {
    fn get_current_scene(&self) -> Option<Arc<Scene>> {
        // For now, we don't have access to the loaded Scene at runtime
        // This would require the app to expose the current scene
        log::debug!("get_current_scene() called - returning None (scene not accessible at script level)");
        None
    }

    fn load_scene(&self, scene_path: &str) -> Result<(), String> {
        // Runtime scene loading is not currently supported
        // This would require significant engine architecture changes
        log::warn!("Scene API: load_scene('{}') called - runtime scene loading not implemented", scene_path);
        Err("Runtime scene loading not supported - scenes must be loaded at application level".to_string())
    }

    fn load_scene_additive(&self, scene_path: &str) -> Result<(), String> {
        // Additive scene loading is not currently supported
        log::warn!("Scene API: load_scene_additive('{}') called - additive loading not implemented", scene_path);
        Err("Additive scene loading not supported - scenes must be loaded at application level".to_string())
    }

    fn unload_scene(&self) -> Result<(), String> {
        // Scene unloading is not currently supported
        log::warn!("Scene API: unload_scene() called - runtime scene unloading not implemented");
        Err("Runtime scene unloading not supported - scenes must be managed at application level".to_string())
    }

    fn get_current_scene_path(&self) -> Option<String> {
        if let Ok(current_path) = self.current_scene_path.lock() {
            current_path.clone()
        } else {
            None
        }
    }
}

/// Create a simple scene manager for basic Scene API functionality
/// This provides real scene path tracking even if loading/unloading isn't supported
pub fn create_simple_scene_manager(initial_scene_path: Option<String>) -> Arc<dyn SceneManagerProvider + Send + Sync> {
    let base_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    Arc::new(SimpleSceneManager::new(initial_scene_path, base_path))
}

/// Register scene API in Lua global scope
///
/// Provides:
/// - `scene.getCurrentScene(): string|nil` - Get current scene path
/// - `scene.load(scenePath: string): boolean` - Load scene (replaces current)
/// - `scene.loadAdditive(scenePath: string): boolean` - Load scene additively
/// - `scene.unload(): boolean` - Unload current scene
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `scene_manager` - Scene manager for actual scene operations
///
/// # Example Lua usage
///
/// ```lua
/// -- Get current scene
/// local current = scene.getCurrentScene()
/// if current then
///     console.log("Current scene:", current)
/// end
///
/// -- Load a new level
/// if scene.load("levels/level2.json") then
///     console.log("Level 2 loaded successfully")
/// else
///     console.log("Failed to load Level 2")
/// end
///
/// -- Load UI overlay (additive)
/// if scene.loadAdditive("ui/hud.json") then
///     console.log("HUD loaded additively")
/// end
///
/// -- Unload current scene
/// if scene.unload() then
///     console.log("Scene unloaded")
/// end
/// ```
pub fn register_scene_api(lua: &Lua, scene_manager: Option<SceneManagerRef>) -> LuaResult<()> {
    let globals = lua.globals();
    let scene = lua.create_table()?;

    // scene.getCurrentScene(): string|nil
    {
        let mgr = scene_manager.clone();
        scene.set(
            "getCurrentScene",
            lua.create_function(move |_, ()| {
                if let Some(ref mgr) = mgr {
                    if let Some(scene_path) = mgr.get_current_scene_path() {
                        Ok(Some(scene_path))
                    } else {
                        Ok(None)
                    }
                } else {
                    // Stub mode - no scene manager
                    Ok(None)
                }
            })?,
        )?;
    }

    // scene.load(scenePath: string): boolean
    {
        let mgr = scene_manager.clone();
        scene.set(
            "load",
            lua.create_function(move |_, scene_path: String| {
                log::debug!("Scene API: Loading scene '{}'", scene_path);

                if let Some(ref mgr) = mgr {
                    match mgr.load_scene(&scene_path) {
                        Ok(()) => {
                            log::info!("Scene '{}' loaded successfully", scene_path);
                            Ok(true)
                        }
                        Err(e) => {
                            log::error!("Failed to load scene '{}': {}", scene_path, e);
                            Ok(false)
                        }
                    }
                } else {
                    // Stub mode - always return false
                    log::warn!("Scene API: load() called in stub mode (no scene manager)");
                    Ok(false)
                }
            })?,
        )?;
    }

    // scene.loadAdditive(scenePath: string): boolean
    {
        let mgr = scene_manager.clone();
        scene.set(
            "loadAdditive",
            lua.create_function(move |_, scene_path: String| {
                log::debug!("Scene API: Loading scene '{}' additively", scene_path);

                if let Some(ref mgr) = mgr {
                    match mgr.load_scene_additive(&scene_path) {
                        Ok(()) => {
                            log::info!("Scene '{}' loaded additively", scene_path);
                            Ok(true)
                        }
                        Err(e) => {
                            log::error!("Failed to load scene '{}' additively: {}", scene_path, e);
                            Ok(false)
                        }
                    }
                } else {
                    // Stub mode - always return false
                    log::warn!("Scene API: loadAdditive() called in stub mode (no scene manager)");
                    Ok(false)
                }
            })?,
        )?;
    }

    // scene.unload(): boolean
    {
        let mgr = scene_manager.clone();
        scene.set(
            "unload",
            lua.create_function(move |_, ()| {
                log::debug!("Scene API: Unloading current scene");

                if let Some(ref mgr) = mgr {
                    match mgr.unload_scene() {
                        Ok(()) => {
                            log::info!("Scene unloaded successfully");
                            Ok(true)
                        }
                        Err(e) => {
                            log::error!("Failed to unload scene: {}", e);
                            Ok(false)
                        }
                    }
                } else {
                    // Stub mode - always return false
                    log::warn!("Scene API: unload() called in stub mode (no scene manager)");
                    Ok(false)
                }
            })?,
        )?;
    }

    globals.set("scene", scene)?;
    log::debug!(
        "Scene API registered ({})",
        if scene_manager.is_some() {
            "with real SceneManager"
        } else {
            "stub mode"
        }
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    // Mock scene manager for testing
    struct MockSceneManager {
        current_scene: Mutex<Option<String>>,
        should_fail_load: Mutex<bool>,
        should_fail_unload: Mutex<bool>,
    }

    impl MockSceneManager {
        fn new() -> Self {
            Self {
                current_scene: Mutex::new(Some("test_scene.json".to_string())),
                should_fail_load: Mutex::new(false),
                should_fail_unload: Mutex::new(false),
            }
        }

        fn set_fail_load(&self, fail: bool) {
            *self.should_fail_load.lock().unwrap() = fail;
        }

        fn set_fail_unload(&self, fail: bool) {
            *self.should_fail_unload.lock().unwrap() = fail;
        }
    }

    impl SceneManagerProvider for MockSceneManager {
        fn get_current_scene(&self) -> Option<Arc<Scene>> {
            // For testing, we don't need to return actual Scene data
            None
        }

        fn load_scene(&self, scene_path: &str) -> Result<(), String> {
            if *self.should_fail_load.lock().unwrap() {
                Err("Mock load failure".to_string())
            } else {
                let mut current = self.current_scene.lock().unwrap();
                *current = Some(scene_path.to_string());
                Ok(())
            }
        }

        fn load_scene_additive(&self, scene_path: &str) -> Result<(), String> {
            if *self.should_fail_load.lock().unwrap() {
                Err("Mock additive load failure".to_string())
            } else {
                // Mock implementation - just log the additive load
                log::debug!("Mock additive load: {}", scene_path);
                Ok(())
            }
        }

        fn unload_scene(&self) -> Result<(), String> {
            if *self.should_fail_unload.lock().unwrap() {
                Err("Mock unload failure".to_string())
            } else {
                let mut current = self.current_scene.lock().unwrap();
                *current = None;
                Ok(())
            }
        }

        fn get_current_scene_path(&self) -> Option<String> {
            self.current_scene.lock().unwrap().clone()
        }
    }

    #[test]
    fn test_scene_api_registration_stub() {
        let lua = Lua::new();
        assert!(register_scene_api(&lua, None).is_ok());

        // Verify scene table exists
        let result: LuaResult<bool> = lua.load("return scene ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_get_current_scene_stub() {
        let lua = Lua::new();
        register_scene_api(&lua, None).unwrap();

        // Should return nil in stub mode
        let result: LuaResult<Option<String>> = lua.load("return scene.getCurrentScene()").eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn test_load_scene_stub() {
        let lua = Lua::new();
        register_scene_api(&lua, None).unwrap();

        // Should return false in stub mode
        let result: bool = lua
            .load(r#"return scene.load("test_scene.json")"#)
            .eval()
            .unwrap();
        assert!(!result); // Should fail in stub mode
    }

    #[test]
    fn test_load_additive_stub() {
        let lua = Lua::new();
        register_scene_api(&lua, None).unwrap();

        // Should return false in stub mode
        let result: bool = lua
            .load(r#"return scene.loadAdditive("ui_overlay.json")"#)
            .eval()
            .unwrap();
        assert!(!result); // Should fail in stub mode
    }

    #[test]
    fn test_unload_scene_stub() {
        let lua = Lua::new();
        register_scene_api(&lua, None).unwrap();

        // Should return false in stub mode
        let result: bool = lua.load("return scene.unload()").eval().unwrap();
        assert!(!result); // Should fail in stub mode
    }

    #[test]
    fn test_get_current_scene_with_manager() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        register_scene_api(&lua, Some(mock_manager.clone())).unwrap();

        // Should return current scene path
        let result: LuaResult<Option<String>> = lua.load("return scene.getCurrentScene()").eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Some("test_scene.json".to_string()));
    }

    #[test]
    fn test_load_scene_success() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        register_scene_api(&lua, Some(mock_manager.clone())).unwrap();

        // Load a new scene
        let result: bool = lua
            .load(r#"return scene.load("new_level.json")"#)
            .eval()
            .unwrap();
        assert!(result); // Should succeed

        // Verify current scene was updated
        let current: Option<String> = lua.load("return scene.getCurrentScene()").eval().unwrap();
        assert_eq!(current, Some("new_level.json".to_string()));
    }

    #[test]
    fn test_load_scene_failure() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        mock_manager.set_fail_load(true);
        register_scene_api(&lua, Some(mock_manager)).unwrap();

        // Should fail when mock manager is set to fail
        let result: bool = lua
            .load(r#"return scene.load("failing_scene.json")"#)
            .eval()
            .unwrap();
        assert!(!result); // Should fail
    }

    #[test]
    fn test_load_additive_success() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        register_scene_api(&lua, Some(mock_manager.clone())).unwrap();

        // Load additive scene
        let result: bool = lua
            .load(r#"return scene.loadAdditive("ui_hud.json")"#)
            .eval()
            .unwrap();
        assert!(result); // Should succeed

        // Current scene should remain unchanged (additive load doesn't replace)
        let current: Option<String> = lua.load("return scene.getCurrentScene()").eval().unwrap();
        assert_eq!(current, Some("test_scene.json".to_string()));
    }

    #[test]
    fn test_load_additive_failure() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        mock_manager.set_fail_load(true);
        register_scene_api(&lua, Some(mock_manager)).unwrap();

        // Should fail when mock manager is set to fail
        let result: bool = lua
            .load(r#"return scene.loadAdditive("failing_ui.json")"#)
            .eval()
            .unwrap();
        assert!(!result); // Should fail
    }

    #[test]
    fn test_unload_scene_success() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        register_scene_api(&lua, Some(mock_manager.clone())).unwrap();

        // Unload current scene
        let result: bool = lua.load("return scene.unload()").eval().unwrap();
        assert!(result); // Should succeed

        // Current scene should be nil after unload
        let current: Option<String> = lua.load("return scene.getCurrentScene()").eval().unwrap();
        assert_eq!(current, None);
    }

    #[test]
    fn test_unload_scene_failure() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        mock_manager.set_fail_unload(true);
        register_scene_api(&lua, Some(mock_manager)).unwrap();

        // Should fail when mock manager is set to fail
        let result: bool = lua.load("return scene.unload()").eval().unwrap();
        assert!(!result); // Should fail
    }

    #[test]
    fn test_scene_load_error_handling() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        mock_manager.set_fail_load(true);
        register_scene_api(&lua, Some(mock_manager)).unwrap();

        // Test that errors are handled gracefully and return false
        lua.load(
            r#"
            local success = scene.load("non_existent.json")
            if not success then
                console.log("Load failed as expected")
            else
                error("Load should have failed")
            end
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_scene_api_comprehensive_workflow() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockSceneManager::new());
        register_scene_api(&lua, Some(mock_manager.clone())).unwrap();

        // Test complete workflow: get -> load -> load additive -> unload
        lua.load(
            r#"
            -- 1. Get initial scene
            local initial = scene.getCurrentScene()
            assert(initial ~= nil, "Should have initial scene")

            -- 2. Load new scene
            local loaded = scene.load("level1.json")
            assert(loaded, "Should load successfully")

            -- 3. Verify scene changed
            local current = scene.getCurrentScene()
            assert(current == "level1.json", "Scene should be level1.json")

            -- 4. Load additive (doesn't change current)
            local additive_loaded = scene.loadAdditive("ui.json")
            assert(additive_loaded, "Should load additive successfully")

            -- 5. Verify current still level1.json
            local still_current = scene.getCurrentScene()
            assert(still_current == "level1.json", "Scene should still be level1.json")

            -- 6. Unload
            local unloaded = scene.unload()
            assert(unloaded, "Should unload successfully")

            -- 7. Verify no current scene
            local final_current = scene.getCurrentScene()
            assert(final_current == nil, "Should have no current scene")
        "#,
        )
        .exec()
        .unwrap();
    }
}