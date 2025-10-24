/// Integration test: TypeScript JSON → Rust deserialization → Script execution
///
/// This test verifies the complete flow:
/// 1. Parse a Script component from TypeScript-generated JSON
/// 2. Deserialize scriptRef and scriptPath fields correctly
/// 3. Load and execute the Lua script
/// 4. Verify transform changes made by the script
use serde_json::json;
use std::io::Write;
use tempfile::TempDir;
use vibe_ecs_bridge::{create_default_registry, ScriptComponent};
use vibe_scene::Scene;
use vibe_scripting::ScriptSystem;

#[test]
fn test_typescript_json_to_rust_script_execution() {
    // Create a temp directory for test files
    let temp_dir = TempDir::new().unwrap();
    let scripts_dir = temp_dir.path().join("scripts");
    std::fs::create_dir(&scripts_dir).unwrap();

    // Create a test Lua script file matching the scriptPath from JSON
    let lua_script_path = scripts_dir.join("entity-3.script.lua");
    let mut lua_file = std::fs::File::create(&lua_script_path).unwrap();
    writeln!(
        lua_file,
        r#"
        function onStart()
            console:log("Script started!")
        end

        function onUpdate(deltaTime)
            entity.transform:setPosition(10, 20, 30)
        end
        "#
    )
    .unwrap();

    // Create JSON matching TypeScript serialization format
    // This is what the TypeScript editor generates
    let scene_json = json!({
        "metadata": {
            "name": "Test Scene",
            "version": 0,
            "timestamp": "2025-01-01T00:00:00Z"
        },
        "entities": [
            {
                "id": 42,
                "name": "TestEntity",
                "components": {
                    "Transform": {
                        "position": [1.0, 2.0, 3.0],
                        "rotation": [0.0, 0.0, 0.0],
                        "scale": [1.0, 1.0, 1.0]
                    },
                    "Script": {
                        "scriptRef": {
                            "scriptId": "entity-3.script",
                            "source": "external",
                            "path": "src/game/scripts/entity-3.script.ts",
                            "codeHash": "8f519ba132d3fc27d673bd4ea088be0c30542fd77207fb981cdf3c58f9d1bbeb",
                            "lastModified": 1761060772089.9998
                        },
                        "lastModified": 1761060772089.9998,
                        "scriptPath": "entity-3.script.lua",
                        "enabled": true,
                        "parameters": {}
                    }
                }
            }
        ]
    });

    // Deserialize JSON to Scene
    let scene: Scene = serde_json::from_value(scene_json).unwrap();

    // Verify deserialization
    assert_eq!(scene.entities.len(), 1);
    let entity = &scene.entities[0];
    assert_eq!(entity.name.as_deref(), Some("TestEntity"));

    // Verify Script component deserialization
    let registry = create_default_registry();
    let script_json = entity.components.get("Script").unwrap();
    let script_any = registry.decode("Script", script_json).unwrap();
    let script = script_any.downcast_ref::<ScriptComponent>().unwrap();

    // Verify scriptRef fields
    assert!(script.scriptRef.is_some());
    let script_ref = script.scriptRef.as_ref().unwrap();
    assert_eq!(script_ref.scriptId, "entity-3.script");
    assert_eq!(script_ref.source, "external");
    assert_eq!(
        script_ref.path.as_deref(),
        Some("src/game/scripts/entity-3.script.ts")
    );

    // Verify scriptPath (Lua file)
    assert_eq!(script.scriptPath.as_deref(), Some("entity-3.script.lua"));

    // Verify get_script_path() returns the Lua path
    assert_eq!(script.get_script_path(), Some("entity-3.script.lua"));

    // Verify get_source_path() returns the TypeScript source
    assert_eq!(
        script.get_source_path(),
        Some("src/game/scripts/entity-3.script.ts")
    );

    // Verify is_external()
    assert!(script.is_external());

    // Initialize ScriptSystem
    let mut system = ScriptSystem::new(scripts_dir.clone());
    system.initialize(&scene).unwrap();

    // Verify script was loaded
    assert_eq!(system.script_count(), 1);
    assert!(system.has_script(42));

    // Update the script
    system.update(0.016).unwrap();

    // Verify transform was modified by the script
    let transform = system.get_transform(42).unwrap();
    assert_eq!(transform.position, Some([10.0, 20.0, 30.0]));

    println!("✅ TypeScript JSON → Rust deserialization → Script execution: SUCCESS");
}

#[test]
fn test_legacy_script_path_compatibility() {
    // Test backward compatibility with old scenes that only have scriptPath
    let temp_dir = TempDir::new().unwrap();
    let scripts_dir = temp_dir.path();

    let lua_script_path = scripts_dir.join("old-script.lua");
    let mut lua_file = std::fs::File::create(&lua_script_path).unwrap();
    writeln!(
        lua_file,
        r#"
        function onStart()
            console:log("Legacy script started!")
        end
        "#
    )
    .unwrap();

    let scene_json = json!({
        "metadata": {
            "name": "Legacy Scene",
            "version": 0,
            "timestamp": "2025-01-01T00:00:00Z"
        },
        "entities": [
            {
                "id": 100,
                "name": "LegacyEntity",
                "components": {
                    "Script": {
                        "scriptPath": "old-script.lua",
                        "enabled": true,
                        "parameters": {}
                    }
                }
            }
        ]
    });

    let scene: Scene = serde_json::from_value(scene_json).unwrap();

    let registry = create_default_registry();
    let script_json = scene.entities[0].components.get("Script").unwrap();
    let script_any = registry.decode("Script", script_json).unwrap();
    let script = script_any.downcast_ref::<ScriptComponent>().unwrap();

    // Verify legacy path works
    assert_eq!(script.scriptPath.as_deref(), Some("old-script.lua"));
    assert_eq!(script.get_script_path(), Some("old-script.lua"));
    assert!(script.scriptRef.is_none());
    assert!(!script.is_external());

    // Verify script loads and runs
    let mut system = ScriptSystem::new(scripts_dir.to_path_buf());
    system.initialize(&scene).unwrap();
    assert_eq!(system.script_count(), 1);

    println!("✅ Legacy scriptPath compatibility: SUCCESS");
}
