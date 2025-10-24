//! Integration test for QueryAPI and EntitiesAPI working together
//!
//! Tests the complete workflow of finding entities by name/tag using QueryAPI,
//! then getting full entity API objects using EntitiesAPI.

use mlua::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use vibe_scene::{Entity, Metadata, Scene};
use vibe_scripting::apis::{register_entities_api, register_query_api};

fn create_test_scene() -> Scene {
    let player = Entity {
        id: Some(1),
        persistentId: Some("player-1".to_string()),
        name: Some("Player".to_string()),
        parentPersistentId: None,
        components: HashMap::new(),
    };

    let enemy1 = Entity {
        id: Some(2),
        persistentId: Some("enemy-1".to_string()),
        name: Some("Enemy".to_string()),
        parentPersistentId: None,
        components: HashMap::new(),
    };

    let enemy2 = Entity {
        id: Some(3),
        persistentId: Some("enemy-2".to_string()),
        name: Some("Enemy".to_string()),
        parentPersistentId: None,
        components: HashMap::new(),
    };

    Scene {
        metadata: Metadata {
            name: "Integration Test Scene".to_string(),
            version: 1,
            timestamp: "2025-01-01T00:00:00Z".to_string(),
            author: None,
            description: None,
        },
        entities: vec![player, enemy1, enemy2],
        materials: None,
        prefabs: None,
        inputAssets: None,
        lockedEntityIds: None,
    }
}

#[test]
fn test_query_then_get_entities() {
    let lua = Lua::new();
    let scene = Arc::new(create_test_scene());

    // Register both APIs
    register_query_api(&lua, Arc::clone(&scene)).unwrap();
    register_entities_api(&lua, Arc::clone(&scene)).unwrap();

    // Test: Use query.findByName to get IDs, then entities.get to get full entity APIs
    let result: LuaResult<usize> = lua
        .load(
            r#"
            -- Find all enemies by name using QueryAPI
            local enemyIds = query.findByName("Enemy")

            -- Verify we got 2 enemy IDs
            if #enemyIds ~= 2 then
                error("Expected 2 enemies, got " .. #enemyIds)
            end

            -- Get full entity APIs using EntitiesAPI
            local enemies = {}
            for i, id in ipairs(enemyIds) do
                local enemy = entities.get(id)
                if enemy then
                    table.insert(enemies, enemy)
                end
            end

            -- Verify we got 2 enemy entity APIs
            if #enemies ~= 2 then
                error("Expected 2 enemy entities, got " .. #enemies)
            end

            -- Verify enemy names
            for i, enemy in ipairs(enemies) do
                if enemy.name ~= "Enemy" then
                    error("Expected enemy name 'Enemy', got '" .. enemy.name .. "'")
                end
            end

            return #enemies
            "#,
        )
        .eval();

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 2);
}

#[test]
fn test_query_findByName_with_entities_fromRef() {
    let lua = Lua::new();
    let scene = Arc::new(create_test_scene());

    // Register both APIs
    register_query_api(&lua, Arc::clone(&scene)).unwrap();
    register_entities_api(&lua, Arc::clone(&scene)).unwrap();

    // Test: Use query.findByName, then entities.fromRef with numeric ID
    let result: LuaResult<String> = lua
        .load(
            r#"
            -- Find player by name
            local playerIds = query.findByName("Player")

            if #playerIds ~= 1 then
                error("Expected 1 player, got " .. #playerIds)
            end

            -- Get player entity using fromRef with numeric ID
            local player = entities.fromRef(playerIds[1])

            if not player then
                error("Failed to get player entity from ID")
            end

            return player.name
            "#,
        )
        .eval();

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "Player");
}

#[test]
fn test_entities_fromRef_with_guid_then_query() {
    let lua = Lua::new();
    let scene = Arc::new(create_test_scene());

    // Register both APIs
    register_query_api(&lua, Arc::clone(&scene)).unwrap();
    register_entities_api(&lua, Arc::clone(&scene)).unwrap();

    // Test: Use entities.fromRef with guid, verify it works
    let result: LuaResult<bool> = lua
        .load(
            r#"
            -- Get entity by GUID
            local enemy = entities.fromRef({ guid = "enemy-1" })

            if not enemy then
                error("Failed to get enemy by GUID")
            end

            -- Verify it's an enemy
            if enemy.name ~= "Enemy" then
                error("Expected enemy name 'Enemy', got '" .. enemy.name .. "'")
            end

            -- Find all enemies
            local allEnemyIds = query.findByName("Enemy")

            -- Verify we found 2 enemies total
            return #allEnemyIds == 2
            "#,
        )
        .eval();

    assert!(result.is_ok());
    assert!(result.unwrap());
}

#[test]
fn test_entities_findByName_returns_entity_apis() {
    let lua = Lua::new();
    let scene = Arc::new(create_test_scene());

    // Register both APIs
    register_query_api(&lua, Arc::clone(&scene)).unwrap();
    register_entities_api(&lua, Arc::clone(&scene)).unwrap();

    // Test: entities.findByName returns full entity APIs, not just IDs
    let result: LuaResult<bool> = lua
        .load(
            r#"
            -- Use entities.findByName (returns entity APIs)
            local enemies = entities.findByName("Enemy")

            if #enemies ~= 2 then
                error("Expected 2 enemies, got " .. #enemies)
            end

            -- Verify they are entity API objects (have id and name fields)
            for i, enemy in ipairs(enemies) do
                if not enemy.id then
                    error("Enemy missing id field")
                end
                if not enemy.name then
                    error("Enemy missing name field")
                end
                if enemy.name ~= "Enemy" then
                    error("Expected enemy name 'Enemy', got '" .. enemy.name .. "'")
                end
            end

            -- Compare with query.findByName (returns IDs)
            local enemyIds = query.findByName("Enemy")

            -- Should return same count
            return #enemies == #enemyIds
            "#,
        )
        .eval();

    assert!(result.is_ok());
    assert!(result.unwrap());
}
