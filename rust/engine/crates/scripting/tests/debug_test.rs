use serde_json::json;
use std::collections::HashMap;
use vibe_ecs_bridge::decoders::{create_default_registry, ScriptComponent};
use vibe_scene::{Entity, Metadata, Scene};

#[test]
fn test_script_component_decoding() {
    let registry = create_default_registry();

    // Create test scene
    let scene = Scene {
        metadata: Metadata {
            name: "Test".to_string(),
            version: 1,
            timestamp: "2025-01-01T00:00:00Z".to_string(),
            author: None,
            description: None,
        },
        entities: vec![Entity {
            id: Some(100),
            persistentId: None,
            name: Some("TestEntity".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: [(
                "Script".to_string(),
                json!({
                    "scriptPath": "test.lua",
                    "parameters": { "speed": 5.0 },
                    "enabled": true
                }),
            )]
            .iter()
            .cloned()
            .collect::<HashMap<_, _>>(),
        }],
        materials: None,
        prefabs: None,
        inputAssets: None,
        lockedEntityIds: None,
    };

    let entity = &scene.entities[0];

    // Check entity_id
    let entity_id = entity.entity_id();
    println!("Entity ID: {:?}", entity_id);
    assert!(entity_id.is_some(), "Entity should have an ID");
    assert_eq!(entity_id.unwrap().as_u64(), 100, "Entity ID should be 100");

    // Check Script component exists
    let script_value = entity.components.get("Script");
    println!("Script component value: {:?}", script_value);
    assert!(script_value.is_some(), "Script component should exist");

    // Try to decode Script component
    let decoded = registry.decode("Script", script_value.unwrap());
    println!("Decoded result: {:?}", decoded);
    assert!(decoded.is_ok(), "Should decode Script component");

    let script_comp_any = decoded.unwrap();
    let script_comp = script_comp_any.downcast_ref::<ScriptComponent>();
    println!("Script component: {:?}", script_comp);
    assert!(script_comp.is_some(), "Should downcast to ScriptComponent");

    let script = script_comp.unwrap();
    println!("  scriptPath: {:?}", script.scriptPath);
    println!("  enabled: {}", script.enabled);
    println!("  parameters: {:?}", script.parameters);

    assert_eq!(script.scriptPath, Some("test.lua".to_string()));
    assert_eq!(script.enabled, true);
}
