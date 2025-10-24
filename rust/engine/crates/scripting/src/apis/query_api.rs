//! Query API for Lua scripts
//!
//! Provides entity querying capabilities for game scripts.
//! - Find entities by name
//! - Find entities by tag
//! - Raycast operations (TODO: requires physics integration)

use mlua::prelude::*;
use std::sync::Arc;
use vibe_scene::Scene;

/// Register query API in Lua global scope
///
/// Provides:
/// - `query.findByName(name: string): number[]` - Find entities by name
/// - `query.findByTag(tag: string): number[]` - Find entities by tag (TODO)
/// - `query.raycastFirst(origin: table, dir: table): table|nil` - Raycast (TODO)
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `scene` - The loaded scene to query
///
/// # Example Lua usage
///
/// ```lua
/// -- Find all entities named "Player"
/// local playerIds = query.findByName("Player")
/// for i, id in ipairs(playerIds) do
///     console.log("Found player: " .. id)
/// end
/// ```
pub fn register_query_api(lua: &Lua, scene: Arc<Scene>) -> LuaResult<()> {
    let globals = lua.globals();
    let query = lua.create_table()?;

    // findByName - Find entities by name
    {
        let scene_clone = Arc::clone(&scene);
        query.set(
            "findByName",
            lua.create_function(move |lua, name: String| {
                log::debug!("Query: Finding entities by name: {}", name);

                let mut found_ids = Vec::new();

                for entity in &scene_clone.entities {
                    if let Some(entity_name) = &entity.name {
                        if entity_name == &name {
                            // Return the entity's numeric ID or persistent ID hash
                            if let Some(entity_id) = entity.entity_id() {
                                found_ids.push(entity_id.as_u64());
                            }
                        }
                    }
                }

                log::debug!("Found {} entities with name '{}'", found_ids.len(), name);

                // Convert to Lua table
                let result = lua.create_table()?;
                for (i, id) in found_ids.iter().enumerate() {
                    result.set(i + 1, *id)?; // Lua arrays are 1-indexed
                }

                Ok(result)
            })?,
        )?;
    }

    // findByTag - Find entities by tag
    {
        let scene_clone = Arc::clone(&scene);
        query.set(
            "findByTag",
            lua.create_function(move |lua, tag: String| {
                log::debug!("Query: Finding entities by tag: {}", tag);
                let mut found_ids = Vec::new();

                // Normalize tag for comparison (lowercase)
                let normalized_tag = tag.to_lowercase();

                for entity in &scene_clone.entities {
                    // Check if entity has the tag
                    if entity.tags.iter().any(|t| t.to_lowercase() == normalized_tag) {
                        if let Some(entity_id) = entity.entity_id() {
                            found_ids.push(entity_id.as_u64());
                        }
                    }
                }

                // Convert to Lua table (1-indexed)
                let result = lua.create_table()?;
                for (i, id) in found_ids.iter().enumerate() {
                    result.set(i + 1, *id)?;
                }

                log::debug!("Found {} entities with tag '{}'", found_ids.len(), tag);
                Ok(result)
            })?,
        )?;
    }

    // raycastFirst - Raycast and find first hit (stub - requires physics integration)
    query.set(
        "raycastFirst",
        lua.create_function(|_, _args: LuaMultiValue| {
            log::debug!("Query: raycastFirst called (not implemented)");
            // TODO: Implement raycasting with physics system
            // For now, return nil
            Ok(LuaNil)
        })?,
    )?;

    // raycastAll - Raycast and find all hits (stub - requires physics integration)
    query.set(
        "raycastAll",
        lua.create_function(|lua, _args: LuaMultiValue| {
            log::debug!("Query: raycastAll called (not implemented)");
            // TODO: Implement raycasting with physics system
            // For now, return empty array
            lua.create_table()
        })?,
    )?;

    globals.set("query", query)?;
    log::debug!("Query API registered");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::collections::HashMap;
    use vibe_scene::{Entity, Metadata};

    fn create_test_scene() -> Scene {
        let entity1 = Entity {
            id: Some(1),
            persistentId: Some("entity-1".to_string()),
            name: Some("Player".to_string()),
            parentPersistentId: None,
            tags: vec!["player".to_string(), "character".to_string()],
            components: HashMap::new(),
        };

        let entity2 = Entity {
            id: Some(2),
            persistentId: Some("entity-2".to_string()),
            name: Some("Enemy".to_string()),
            parentPersistentId: None,
            tags: vec!["enemy".to_string(), "character".to_string()],
            components: HashMap::new(),
        };

        let entity3 = Entity {
            id: Some(3),
            persistentId: Some("entity-3".to_string()),
            name: Some("Player".to_string()), // Duplicate name
            parentPersistentId: None,
            tags: vec!["player".to_string()],
            components: HashMap::new(),
        };

        Scene {
            metadata: Metadata {
                name: "Test Scene".to_string(),
                version: 1,
                timestamp: "2025-01-01T00:00:00Z".to_string(),
                author: None,
                description: None,
            },
            entities: vec![entity1, entity2, entity3],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        }
    }

    #[test]
    fn test_query_api_registration() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());

        assert!(register_query_api(&lua, scene).is_ok());

        // Verify query table exists
        let result: LuaResult<bool> = lua.load("return query ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_find_by_name_single() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find entity with unique name
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByName("Enemy")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 1);
    }

    #[test]
    fn test_find_by_name_multiple() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find entities with duplicate name
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByName("Player")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 2);
    }

    #[test]
    fn test_find_by_name_not_found() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find non-existent entity
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByName("NonExistent")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 0);
    }

    #[test]
    fn test_find_by_name_case_sensitive() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Name search is case-sensitive
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByName("player")  -- lowercase
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 0); // Should not find "Player" (capital P)
    }

    #[test]
    fn test_find_by_tag() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find entities with "player" tag (case-insensitive)
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByTag("player")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 2); // entity1 and entity3 have "player" tag
    }

    #[test]
    fn test_find_by_tag_character() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find entities with "character" tag (both player and enemy have this)
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByTag("character")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 2); // entity1 and entity2 have "character" tag
    }

    #[test]
    fn test_find_by_tag_case_insensitive() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // Find entities with "ENEMY" tag (should work case-insensitively)
        let result: LuaResult<Vec<u64>> = lua
            .load(
                r#"
                local ids = query.findByTag("ENEMY")
                local result = {}
                for i = 1, #ids do
                    table.insert(result, ids[i])
                end
                return result
            "#,
            )
            .eval();

        assert!(result.is_ok());
        let ids = result.unwrap();
        assert_eq!(ids.len(), 1); // entity2 has "enemy" tag
    }

    #[test]
    fn test_raycast_first_stub() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // raycastFirst should return nil (stub)
        let result: LuaResult<bool> = lua
            .load(
                r#"
                local hit = query.raycastFirst({0, 0, 0}, {0, 1, 0})
                return hit == nil
            "#,
            )
            .eval();

        assert!(result.is_ok());
        assert!(result.unwrap()); // Should be nil
    }

    #[test]
    fn test_raycast_all_stub() {
        let lua = Lua::new();
        let scene = Arc::new(create_test_scene());
        register_query_api(&lua, scene).unwrap();

        // raycastAll should return empty array (stub)
        let result: LuaResult<usize> = lua
            .load(
                r#"
                local hits = query.raycastAll({0, 0, 0}, {0, 1, 0})
                return #hits
            "#,
            )
            .eval();

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0); // Stub implementation returns empty
    }
}
