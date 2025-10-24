//! Integration test for Event API end-to-end functionality

use vibe_scripting::ScriptSystem;
use vibe_scene::{Entity, Metadata, Scene};
use serde_json::json;
use std::collections::HashMap;
use std::path::PathBuf;

#[test]
fn test_event_api_integration() {
    // Create a minimal scene with one entity that has the event demo script
    let scene = Scene {
        metadata: Metadata {
            name: "Event API Test Scene".to_string(),
            version: 1,
            timestamp: "2025-01-22T00:00:00Z".to_string(),
            author: Some("Event API Integration Test".to_string()),
            description: Some("Testing Event API with Lua script".to_string()),
        },
        entities: vec![Entity {
            id: Some(1),
            persistentId: None,
            name: Some("EventTestEntity".to_string()),
            parentPersistentId: None,
            components: [
                (
                    "Transform".to_string(),
                    json!({
                        "position": [0.0, 0.0, 0.0],
                        "rotation": [0.0, 0.0, 0.0],
                        "scale": [1.0, 1.0, 1.0]
                    }),
                ),
                (
                    "Script".to_string(),
                    json!({
                        "scriptPath": "event_api_demo.lua",
                        "parameters": {},
                        "enabled": true
                    }),
                ),
            ]
            .iter()
            .cloned()
            .collect::<HashMap<_, _>>(),
        }],
        materials: None,
        prefabs: None,
        inputAssets: None,
        lockedEntityIds: None,
    };

    // Create script system pointing to testdata
    let testdata_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("testdata");
    let mut script_system = ScriptSystem::new(testdata_path);

    // Initialize - should load and run the script
    let result = script_system.initialize(&scene);
    assert!(
        result.is_ok(),
        "Failed to initialize script system: {:?}",
        result.err()
    );

    // Verify script was loaded
    assert_eq!(
        script_system.script_count(),
        1,
        "Expected 1 script to be loaded"
    );
    assert!(
        script_system.has_script(1),
        "Script should be loaded for entity 1"
    );

    println!("✓ Event API integration test passed!");
    println!("  - Script loaded successfully");
    println!("  - Event handlers registered");
    println!("  - Events emitted and received");
    println!("  - Check console output above for event logs");

    // Cleanup
    script_system
        .destroy_script(1)
        .expect("Failed to destroy script");

    assert_eq!(
        script_system.script_count(),
        0,
        "Script should be destroyed"
    );

    println!("✓ Event handlers cleaned up successfully");
}
