#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use vibe_scene::{Entity, Metadata};

    fn create_test_scene() -> Scene {
        let entity1 = Entity {
            id: Some(1),
            persistent_id: Some("entity-1".to_string()),
            name: Some("Player".to_string()),
            parent_persistent_id: None,
            tags: vec!["player".to_string(), "character".to_string()],
            components: HashMap::new(),
        };

        let entity2 = Entity {
            id: Some(2),
            persistent_id: Some("entity-2".to_string()),
            name: Some("Enemy".to_string()),
            parent_persistent_id: None,
            tags: vec!["enemy".to_string(), "character".to_string()],
            components: HashMap::new(),
        };

        let entity3 = Entity {
            id: Some(3),
            persistent_id: Some("entity-3".to_string()),
            name: Some("Player".to_string()), // Duplicate name
            parent_persistent_id: None,
            tags: vec!["player".to_string()],
            components: HashMap::new(),
        };

        Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![entity1, entity2, entity3],
            materials: vec![],
            meshes: None,
            prefabs: None,
            metadata: None,
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