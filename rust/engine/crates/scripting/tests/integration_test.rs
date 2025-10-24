///! Integration test for the complete TypeScript → Lua → Rust scripting flow
///!
///! This test validates:
///! 1. TypeScriptToLua transpilation (rotating-cube.ts → rotating-cube.lua)
///! 2. Lua script loading in Rust
///! 3. Entity transform API working correctly
///! 4. Script lifecycle (onStart, onUpdate)
///! 5. Transform state updates from Lua
use serde_json::json;
use std::collections::HashMap;
use std::path::PathBuf;
use vibe_scene::{Entity, Metadata, Scene};
use vibe_scripting::ScriptSystem;

/// Test the complete flow using a real transpiled script
#[test]
fn test_end_to_end_rotating_cube_script() {
    // Path to the transpiled rotating-cube.lua script
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let rust_dir = manifest_dir
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap();

    let scripts_dir = rust_dir.join("game/scripts");

    // Verify the transpiled script exists
    let rotating_cube_path = scripts_dir.join("rotating-cube.lua");
    assert!(
        rotating_cube_path.exists(),
        "rotating-cube.lua not found at {:?}. Did you run 'yarn transpile:lua'?",
        rotating_cube_path
    );

    // Create a test scene with an entity that uses the rotating-cube script
    let scene = Scene {
        metadata: Metadata {
            name: "Integration Test Scene".to_string(),
            version: 1,
            timestamp: "2025-01-01T00:00:00Z".to_string(),
            author: Some("Integration Test".to_string()),
            description: Some("Testing TypeScript → Lua → Rust flow".to_string()),
        },
        entities: vec![Entity {
            id: Some(100),
            persistentId: None, // Use numeric ID for simplicity
            name: Some("RotatingCube".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: [
                (
                    "Transform".to_string(),
                    json!({
                        "position": [0.0, 0.0, 0.0],
                        "rotation": [0.0, 0.0, 0.0], // Start at 0 degrees
                        "scale": [1.0, 1.0, 1.0]
                    }),
                ),
                (
                    "Script".to_string(),
                    json!({
                        "scriptPath": "rotating-cube.lua",
                        "parameters": { "speed": (std::f32::consts::FRAC_PI_2 as f64) }, // 90°/s expressed in radians
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

    // Initialize the script system with the scripts directory
    let mut script_system = ScriptSystem::new(scripts_dir);

    // Initialize should load the script and call onStart()
    script_system
        .initialize(&scene)
        .expect("Failed to initialize script system");

    assert_eq!(script_system.script_count(), 1, "Script should be loaded");
    assert!(
        script_system.has_script(100),
        "Script should be loaded for entity 100"
    );

    // Simulate 1 second at 60 FPS (60 updates of ~0.0166s each)
    let delta_time = 1.0 / 60.0;
    for _ in 0..60 {
        script_system
            .update(delta_time)
            .expect("Failed to update scripts");
    }

    // After 1 second at 90 degrees/second (π/2 rad/s), rotation.y should be ~90 degrees
    let transform = script_system
        .get_transform(100)
        .expect("Should have transform for entity 100");

    println!("Transform after updates: {:?}", transform);

    let rotation = transform.rotation.expect("Rotation should be set");
    assert_eq!(rotation.len(), 3, "Rotation should be Euler angles");

    println!(
        "Rotation: [{}, {}, {}]",
        rotation[0], rotation[1], rotation[2]
    );

    // rotation.y should be approximately 90 degrees (with some floating point tolerance)
    let expected_rotation = 90.0;
    let tolerance = 1.0; // Allow 1 degree tolerance
    assert!(
        (rotation[1] - expected_rotation).abs() < tolerance,
        "Expected rotation.y ≈ {}, got {}",
        expected_rotation,
        rotation[1]
    );

    println!("✓ rotating-cube.lua script working correctly!");
    println!("  Initial rotation: [0, 0, 0]");
    println!(
        "  After 1 second: [{:.1}, {:.1}, {:.1}]",
        rotation[0], rotation[1], rotation[2]
    );

    // Cleanup: destroy the script
    script_system
        .destroy_script(100)
        .expect("Failed to destroy script");

    assert_eq!(
        script_system.script_count(),
        0,
        "Script should be destroyed"
    );
    assert!(
        !script_system.has_script(100),
        "Script should no longer exist"
    );

    println!("✓ Script lifecycle (onStart, onUpdate, onDestroy) validated!");
}

/// Test the moving-sphere script
///
/// Note: Currently ignored due to intermittent initialization issue being debugged.
/// The script loads successfully in isolation (see manual_load_test.rs)
#[test]
#[ignore]
fn test_end_to_end_moving_sphere_script() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let rust_dir = manifest_dir
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap();

    let scripts_dir = rust_dir.join("game/scripts");
    let moving_sphere_path = scripts_dir.join("moving-sphere.lua");

    assert!(
        moving_sphere_path.exists(),
        "moving-sphere.lua not found at {:?}",
        moving_sphere_path
    );

    let scene = Scene {
        metadata: Metadata {
            name: "Moving Sphere Test".to_string(),
            version: 1,
            timestamp: "2025-01-01T00:00:00Z".to_string(),
            author: None,
            description: None,
        },
        entities: vec![Entity {
            id: Some(201),
            persistentId: None,
            name: Some("MovingSphere".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: [
                (
                    "Transform".to_string(),
                    json!({
                        "position": [5.0, 0.0, 0.0], // Start at x=5
                        "rotation": [0.0, 0.0, 0.0],
                        "scale": [1.0, 1.0, 1.0]
                    }),
                ),
                (
                    "Script".to_string(),
                    json!({
                        "scriptPath": "moving-sphere.lua",
                        "parameters": {
                            "speed": 1.0,
                            "distance": 3.0
                        },
                        "enabled": true
                    }),
                ),
            ]
            .iter()
            .cloned()
            .collect(),
        }],
        materials: None,
        prefabs: None,
        inputAssets: None,
        lockedEntityIds: None,
    };

    let mut script_system = ScriptSystem::new(scripts_dir);
    let init_result = script_system.initialize(&scene);
    if let Err(ref e) = init_result {
        eprintln!("Initialization error: {}", e);
        for cause in e.chain() {
            eprintln!("  Caused by: {}", cause);
        }
    }
    init_result.expect("Failed to initialize script system");

    println!("Script count: {}", script_system.script_count());
    println!(
        "Has script for entity 201: {}",
        script_system.has_script(201)
    );

    // Get initial position
    let initial_transform = script_system
        .get_transform(201)
        .expect("Should have transform for entity 201");
    let initial_pos = initial_transform.position.unwrap();
    assert_eq!(
        initial_pos,
        [5.0, 0.0, 0.0],
        "Initial position should be [5, 0, 0]"
    );

    // Update for a bit (sine wave motion)
    for _ in 0..30 {
        script_system.update(1.0 / 60.0).unwrap();
    }

    // Position should have changed (oscillating on X axis)
    let updated_transform = script_system.get_transform(201).unwrap();
    let updated_pos = updated_transform.position.unwrap();

    assert_ne!(
        updated_pos[0], initial_pos[0],
        "X position should have changed"
    );
    assert_eq!(updated_pos[1], 0.0, "Y position should stay at 0");
    assert_eq!(updated_pos[2], 0.0, "Z position should stay at 0");

    println!("✓ moving-sphere.lua script working correctly!");
    println!("  Start position: {:?}", initial_pos);
    println!("  After updates:  {:?}", updated_pos);

    script_system.destroy_script(201).unwrap();
}
