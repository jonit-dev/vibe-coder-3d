//! Prefab API for Lua scripts
//!
//! Provides runtime prefab instantiation and management capabilities for game scripts.
//! - Instantiate prefabs from scene files
//! - Destroy prefab instances
//! - Prefab pooling support (for performance)

use mlua::prelude::*;
use std::sync::Arc;
use vibe_scene::EntityId;

/// Prefab manager reference for prefab operations
/// This will be passed in from the engine to handle actual prefab loading
pub type PrefabManagerRef = Arc<dyn PrefabManagerProvider + Send + Sync>;

/// Trait for providing prefab management to scripts
/// Engine implements this with real prefab loading capabilities
pub trait PrefabManagerProvider {
    /// Instantiate a prefab from a scene file
    fn instantiate_prefab(&self, prefab_path: &str, position: Option<[f32; 3]>) -> Result<EntityId, String>;

    /// Destroy a prefab instance
    fn destroy_prefab_instance(&self, entity_id: EntityId) -> Result<(), String>;

    /// Get all instances of a specific prefab
    fn get_prefab_instances(&self, prefab_path: &str) -> Vec<EntityId>;

    /// Check if an entity is a prefab instance
    fn is_prefab_instance(&self, entity_id: EntityId) -> bool;

    /// Get the prefab path of an entity instance
    fn get_prefab_path(&self, entity_id: EntityId) -> Option<String>;

    /// Load prefabs from scene data (for script system integration)
    fn load_prefabs_from_scene(&self, prefabs_value: &serde_json::Value) -> Result<(), String> {
        // Default implementation - override in concrete implementations
        Err("load_prefabs_from_scene not implemented".to_string())
    }
}

/// Register prefab API in Lua global scope
///
/// Provides:
/// - `prefab.instantiate(path: string, position?: table): number|nil` - Instantiate prefab
/// - `prefab.destroy(entityId: number): boolean` - Destroy prefab instance
/// - `prefab.getInstances(path: string): number[]` - Get all instances of prefab
/// - `prefab.isInstance(entityId: number): boolean` - Check if entity is prefab instance
/// - `prefab.getPath(entityId: number): string|nil` - Get prefab path of entity
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `prefab_manager` - Prefab manager for actual prefab operations
///
/// # Example Lua usage
///
/// ```lua
/// -- Spawn enemy at specific position
/// local enemyId = prefab.instantiate("enemies/goblin.json", {x = 10, y = 0, z = 5})
/// if enemyId then
///     console.log("Enemy spawned:", enemyId)
///
///     -- Configure enemy
///     local enemy = entities.fromRef(enemyId)
///     enemy:setComponent("EnemyAI", {
///         patrolPath = {"point1", "point2"},
///         alertRadius = 15.0
///     })
/// else
///     console.log("Failed to spawn enemy")
/// end
///
/// -- Spawn item at current position
/// local itemId = prefab.instantiate("items/health_pack.json")
///
/// -- Destroy enemy when defeated
/// if enemyHealth <= 0 then
///     if prefab.destroy(enemyId) then
///         console.log("Enemy destroyed")
///         -- Spawn explosion effect
///         local explosion = prefab.instantiate("effects/explosion.json", {x = enemyX, y = enemyY, z = enemyZ})
///     end
/// end
///
/// -- Get all enemies for level reset
/// local allEnemies = prefab.getInstances("enemies/goblin.json")
/// for i, enemyId in ipairs(allEnemies) do
///     prefab.destroy(enemyId)
/// end
///
/// -- Check if object is a prefab
/// if prefab.isInstance(someEntityId) then
///     local path = prefab.getPath(someEntityId)
///     console.log("Entity from prefab:", path)
/// end
/// ```
pub fn register_prefab_api(lua: &Lua, prefab_manager: Option<PrefabManagerRef>) -> LuaResult<()> {
    let globals = lua.globals();
    let prefab = lua.create_table()?;

    // prefab.instantiate(path: string, position?: table): number|nil
    {
        let mgr = prefab_manager.clone();
        prefab.set(
            "instantiate",
            lua.create_function(move |lua, (prefab_path, position): (String, Option<LuaTable>)| {
                log::debug!("Prefab API: Instantiating prefab '{}'", prefab_path);

                // Parse position table if provided
                let pos_array = if let Some(pos_table) = position {
                    let x: f32 = pos_table.get("x").unwrap_or(0.0);
                    let y: f32 = pos_table.get("y").unwrap_or(0.0);
                    let z: f32 = pos_table.get("z").unwrap_or(0.0);
                    Some([x, y, z])
                } else {
                    None
                };

                if let Some(ref mgr) = mgr {
                    match mgr.instantiate_prefab(&prefab_path, pos_array) {
                        Ok(entity_id) => {
                            log::info!("Prefab '{}' instantiated as entity {}", prefab_path, entity_id.as_u64());
                            Ok(Some(entity_id.as_u64()))
                        }
                        Err(e) => {
                            log::error!("Failed to instantiate prefab '{}': {}", prefab_path, e);
                            Ok(None)
                        }
                    }
                } else {
                    // Stub mode - return nil
                    log::warn!("Prefab API: instantiate() called in stub mode (no prefab manager)");
                    Ok(None)
                }
            })?,
        )?;
    }

    // prefab.destroy(entityId: number): boolean
    {
        let mgr = prefab_manager.clone();
        prefab.set(
            "destroy",
            lua.create_function(move |_, entity_id: u64| {
                let entity_id = EntityId::new(entity_id);
                log::debug!("Prefab API: Destroying prefab instance {}", entity_id.as_u64());

                if let Some(ref mgr) = mgr {
                    match mgr.destroy_prefab_instance(entity_id) {
                        Ok(()) => {
                            log::info!("Prefab instance {} destroyed successfully", entity_id.as_u64());
                            Ok(true)
                        }
                        Err(e) => {
                            log::error!("Failed to destroy prefab instance {}: {}", entity_id.as_u64(), e);
                            Ok(false)
                        }
                    }
                } else {
                    // Stub mode - always return false
                    log::warn!("Prefab API: destroy() called in stub mode (no prefab manager)");
                    Ok(false)
                }
            })?,
        )?;
    }

    // prefab.getInstances(path: string): number[]
    {
        let mgr = prefab_manager.clone();
        prefab.set(
            "getInstances",
            lua.create_function(move |lua, prefab_path: String| {
                log::debug!("Prefab API: Getting instances of prefab '{}'", prefab_path);

                if let Some(ref mgr) = mgr {
                    let instances = mgr.get_prefab_instances(&prefab_path);
                    log::debug!("Found {} instances of prefab '{}'", instances.len(), prefab_path);

                    // Convert to Lua table (1-indexed)
                    let result = lua.create_table()?;
                    for (i, entity_id) in instances.iter().enumerate() {
                        result.set(i + 1, entity_id.as_u64())?;
                    }
                    Ok(result)
                } else {
                    // Stub mode - return empty array
                    log::warn!("Prefab API: getInstances() called in stub mode (no prefab manager)");
                    lua.create_table()
                }
            })?,
        )?;
    }

    // prefab.isInstance(entityId: number): boolean
    {
        let mgr = prefab_manager.clone();
        prefab.set(
            "isInstance",
            lua.create_function(move |_, entity_id: u64| {
                let entity_id = EntityId::new(entity_id);
                log::debug!("Prefab API: Checking if entity {} is prefab instance", entity_id.as_u64());

                if let Some(ref mgr) = mgr {
                    let is_instance = mgr.is_prefab_instance(entity_id);
                    log::debug!("Entity {} is prefab instance: {}", entity_id.as_u64(), is_instance);
                    Ok(is_instance)
                } else {
                    // Stub mode - always return false
                    log::warn!("Prefab API: isInstance() called in stub mode (no prefab manager)");
                    Ok(false)
                }
            })?,
        )?;
    }

    // prefab.getPath(entityId: number): string|nil
    {
        let mgr = prefab_manager.clone();
        prefab.set(
            "getPath",
            lua.create_function(move |_, entity_id: u64| {
                let entity_id = EntityId::new(entity_id);
                log::debug!("Prefab API: Getting prefab path for entity {}", entity_id.as_u64());

                if let Some(ref mgr) = mgr {
                    if let Some(path) = mgr.get_prefab_path(entity_id) {
                        log::debug!("Entity {} is from prefab '{}'", entity_id.as_u64(), path);
                        Ok(Some(path))
                    } else {
                        log::debug!("Entity {} is not a prefab instance", entity_id.as_u64());
                        Ok(None)
                    }
                } else {
                    // Stub mode - always return nil
                    log::warn!("Prefab API: getPath() called in stub mode (no prefab manager)");
                    Ok(None)
                }
            })?,
        )?;
    }

    globals.set("prefab", prefab)?;
    log::debug!(
        "Prefab API registered ({})",
        if prefab_manager.is_some() {
            "with real PrefabManager"
        } else {
            "stub mode"
        }
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    // Mock prefab manager for testing
    struct MockPrefabManager {
        instances: Mutex<HashMap<String, Vec<EntityId>>>,
        entity_to_prefab: Mutex<HashMap<u64, String>>,
        next_entity_id: Mutex<u64>,
        should_fail_instantiate: Mutex<bool>,
        should_fail_destroy: Mutex<bool>,
    }

    impl MockPrefabManager {
        fn new() -> Self {
            Self {
                instances: Mutex::new(HashMap::new()),
                entity_to_prefab: Mutex::new(HashMap::new()),
                next_entity_id: Mutex::new(1000), // Start from high ID
                should_fail_instantiate: Mutex::new(false),
                should_fail_destroy: Mutex::new(false),
            }
        }

        fn set_fail_instantiate(&self, fail: bool) {
            *self.should_fail_instantiate.lock().unwrap() = fail;
        }

        fn set_fail_destroy(&self, fail: bool) {
            *self.should_fail_destroy.lock().unwrap() = fail;
        }

        fn add_instance(&self, prefab_path: &str, entity_id: u64) {
            let mut instances = self.instances.lock().unwrap();
            instances.entry(prefab_path.to_string()).or_insert_with(Vec::new).push(EntityId::new(entity_id));

            let mut entity_to_prefab = self.entity_to_prefab.lock().unwrap();
            entity_to_prefab.insert(entity_id, prefab_path.to_string());
        }

        fn remove_instance(&self, entity_id: u64) -> Option<String> {
            let mut entity_to_prefab = self.entity_to_prefab.lock().unwrap();
            let prefab_path = entity_to_prefab.remove(&entity_id)?;

            // Remove from instances map
            let mut instances = self.instances.lock().unwrap();
            if let Some(instance_list) = instances.get_mut(&prefab_path) {
                instance_list.retain(|&id| id.as_u64() != entity_id);
                if instance_list.is_empty() {
                    instances.remove(&prefab_path);
                }
            }

            Some(prefab_path)
        }
    }

    impl PrefabManagerProvider for MockPrefabManager {
        fn instantiate_prefab(&self, prefab_path: &str, _position: Option<[f32; 3]>) -> Result<EntityId, String> {
            if *self.should_fail_instantiate.lock().unwrap() {
                Err("Mock instantiate failure".to_string())
            } else {
                let mut next_id = self.next_entity_id.lock().unwrap();
                let entity_id = *next_id;
                *next_id += 1;

                self.add_instance(prefab_path, entity_id);
                Ok(EntityId::new(entity_id))
            }
        }

        fn destroy_prefab_instance(&self, entity_id: EntityId) -> Result<(), String> {
            if *self.should_fail_destroy.lock().unwrap() {
                Err("Mock destroy failure".to_string())
            } else {
                self.remove_instance(entity_id.as_u64());
                Ok(())
            }
        }

        fn get_prefab_instances(&self, prefab_path: &str) -> Vec<EntityId> {
            let instances = self.instances.lock().unwrap();
            instances.get(prefab_path).cloned().unwrap_or_default()
        }

        fn is_prefab_instance(&self, entity_id: EntityId) -> bool {
            let entity_to_prefab = self.entity_to_prefab.lock().unwrap();
            entity_to_prefab.contains_key(&entity_id.as_u64())
        }

        fn get_prefab_path(&self, entity_id: EntityId) -> Option<String> {
            let entity_to_prefab = self.entity_to_prefab.lock().unwrap();
            entity_to_prefab.get(&entity_id.as_u64()).cloned()
        }
    }

    #[test]
    fn test_prefab_api_registration_stub() {
        let lua = Lua::new();
        assert!(register_prefab_api(&lua, None).is_ok());

        // Verify prefab table exists
        let result: LuaResult<bool> = lua.load("return prefab ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_instantiate_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return nil in stub mode
        let result: LuaResult<Option<u64>> = lua
            .load(r#"return prefab.instantiate("enemy.json")"#)
            .eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn test_instantiate_with_position_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return nil in stub mode even with position
        let result: LuaResult<Option<u64>> = lua
            .load(r#"return prefab.instantiate("enemy.json", {x = 10, y = 0, z = 5})"#)
            .eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn test_destroy_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return false in stub mode
        let result: bool = lua
            .load(r#"return prefab.destroy(1234)"#)
            .eval()
            .unwrap();
        assert!(!result);
    }

    #[test]
    fn test_get_instances_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return empty array in stub mode
        lua.load(
            r#"
            local instances = prefab.getInstances("enemy.json")
            assert(#instances == 0, "Should return empty array in stub mode")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_is_instance_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return false in stub mode
        let result: bool = lua
            .load(r#"return prefab.isInstance(1234)"#)
            .eval()
            .unwrap();
        assert!(!result);
    }

    #[test]
    fn test_get_path_stub() {
        let lua = Lua::new();
        register_prefab_api(&lua, None).unwrap();

        // Should return nil in stub mode
        let result: LuaResult<Option<String>> = lua
            .load(r#"return prefab.getPath(1234)"#)
            .eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn test_instantiate_success() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Instantiate prefab
        let result: LuaResult<Option<u64>> = lua
            .load(r#"return prefab.instantiate("enemy.json")"#)
            .eval();
        assert!(result.is_ok());
        let entity_id = result.unwrap();
        assert!(entity_id.is_some());
        assert_eq!(entity_id.unwrap(), 1000); // First ID should be 1000
    }

    #[test]
    fn test_instantiate_with_position() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Instantiate prefab with position
        let result: LuaResult<Option<u64>> = lua
            .load(r#"return prefab.instantiate("enemy.json", {x = 10, y = 5, z = -2})"#)
            .eval();
        assert!(result.is_ok());
        let entity_id = result.unwrap();
        assert!(entity_id.is_some());
        assert_eq!(entity_id.unwrap(), 1000);
    }

    #[test]
    fn test_instantiate_failure() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        mock_manager.set_fail_instantiate(true);
        register_prefab_api(&lua, Some(mock_manager)).unwrap();

        // Should fail when mock manager is set to fail
        let result: LuaResult<Option<u64>> = lua
            .load(r#"return prefab.instantiate("enemy.json")"#)
            .eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), None); // Should return nil on failure
    }

    #[test]
    fn test_destroy_success() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // First instantiate an entity
        mock_manager.add_instance("enemy.json", 1001);

        // Destroy it
        let result: bool = lua
            .load(r#"return prefab.destroy(1001)"#)
            .eval()
            .unwrap();
        assert!(result); // Should succeed

        // Verify it's no longer an instance
        let is_instance: bool = lua
            .load(r#"return prefab.isInstance(1001)"#)
            .eval()
            .unwrap();
        assert!(!is_instance);
    }

    #[test]
    fn test_destroy_failure() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        mock_manager.set_fail_destroy(true);
        register_prefab_api(&lua, Some(mock_manager)).unwrap();

        // Should fail when mock manager is set to fail
        let result: bool = lua
            .load(r#"return prefab.destroy(1001)"#)
            .eval()
            .unwrap();
        assert!(!result); // Should return false on failure
    }

    #[test]
    fn test_get_instances() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Add some instances
        mock_manager.add_instance("enemy.json", 1001);
        mock_manager.add_instance("enemy.json", 1002);
        mock_manager.add_instance("enemy.json", 1003);
        mock_manager.add_instance("item.json", 2001);

        // Get instances of enemy prefab
        lua.load(
            r#"
            local instances = prefab.getInstances("enemy.json")
            assert(#instances == 3, "Should find 3 enemy instances")

                -- Verify specific IDs
                local found_ids = {}
                for i = 1, #instances do
                    found_ids[instances[i]] = true
                end

                assert(found_ids[1001], "Should find ID 1001")
                assert(found_ids[1002], "Should find ID 1002")
                assert(found_ids[1003], "Should find ID 1003")
                assert(not found_ids[2001], "Should not find item ID")
            "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_is_instance() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Add instances
        mock_manager.add_instance("enemy.json", 1001);
        mock_manager.add_instance("item.json", 2001);

        // Test instance checking
        lua.load(
            r#"
            assert(prefab.isInstance(1001), "1001 should be a prefab instance")
            assert(prefab.isInstance(2001), "2001 should be a prefab instance")
            assert(not prefab.isInstance(9999), "9999 should not be a prefab instance")
            "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_get_path() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Add instances
        mock_manager.add_instance("enemy.json", 1001);
        mock_manager.add_instance("item.json", 2001);

        // Test path getting
        lua.load(
            r#"
            local path1 = prefab.getPath(1001)
            assert(path1 == "enemy.json", "1001 should be from enemy.json")

            local path2 = prefab.getPath(2001)
            assert(path2 == "item.json", "2001 should be from item.json")

            local path3 = prefab.getPath(9999)
            assert(path3 == nil, "9999 should return nil (not a prefab)")
            "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_prefab_api_comprehensive_workflow() {
        let lua = Lua::new();
        let mock_manager = Arc::new(MockPrefabManager::new());
        register_prefab_api(&lua, Some(mock_manager.clone())).unwrap();

        // Test complete workflow: instantiate -> check -> get instances -> destroy
        lua.load(
            r#"
            -- 1. Instantiate enemy
            local enemy1 = prefab.instantiate("enemy.json")
            local enemy2 = prefab.instantiate("enemy.json", {x = 10, y = 0, z = 5})
            assert(enemy1 ~= nil, "Enemy 1 should spawn")
            assert(enemy2 ~= nil, "Enemy 2 should spawn")
            assert(enemy1 ~= enemy2, "Should have different IDs")

            -- 2. Check if they are instances
            assert(prefab.isInstance(enemy1), "Enemy 1 should be instance")
            assert(prefab.isInstance(enemy2), "Enemy 2 should be instance")

            -- 3. Get prefab paths
            local path1 = prefab.getPath(enemy1)
            local path2 = prefab.getPath(enemy2)
            assert(path1 == "enemy.json", "Enemy 1 should be from enemy.json")
            assert(path2 == "enemy.json", "Enemy 2 should be from enemy.json")

            -- 4. Get all instances
            local instances = prefab.getInstances("enemy.json")
            assert(#instances == 2, "Should have 2 enemy instances")

            -- 5. Destroy one enemy
            local destroyed = prefab.destroy(enemy1)
            assert(destroyed, "Should destroy enemy1 successfully")

            -- 6. Verify only one left
            local remaining = prefab.getInstances("enemy.json")
            assert(#remaining == 1, "Should have 1 enemy remaining")

            -- 7. Verify enemy1 is no longer instance
            assert(not prefab.isInstance(enemy1), "Enemy 1 should no longer be instance")
            assert(prefab.isInstance(enemy2), "Enemy 2 should still be instance")
            "#,
        )
        .exec()
        .unwrap();
    }
}