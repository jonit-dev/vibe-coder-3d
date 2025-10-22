/// Integration test for Rust Physics system
/// Verifies that the testphysics scene loads correctly and physics is initialized
use std::path::PathBuf;
use vibe_ecs_bridge::create_default_registry;
use vibe_physics::{populate_physics_world, PhysicsWorld};
use vibe_scene::Scene;

#[test]
fn test_physics_scene_loads_correctly() {
    // Load the testphysics scene
    let scene_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../game/scenes/tests/testphysics.json");

    let json = std::fs::read_to_string(&scene_path).expect("Failed to read testphysics.json");

    let scene: Scene = serde_json::from_str(&json).expect("Failed to parse testphysics.json");

    // Verify scene metadata
    assert_eq!(scene.metadata.name, "testphysics");
    assert_eq!(scene.entities.len(), 6); // camera, 2 lights, plane (ground), cube, sphere

    // Initialize physics world
    let mut physics_world = PhysicsWorld::new();
    let registry = create_default_registry();

    let result = populate_physics_world(&mut physics_world, &scene, &registry);
    assert!(
        result.is_ok(),
        "Failed to populate physics world: {:?}",
        result.err()
    );

    let entities_added = result.unwrap();
    assert_eq!(
        entities_added, 3,
        "Expected 3 physics entities (ground, cube, sphere)"
    );

    // Verify physics world stats
    let stats = physics_world.stats();
    assert_eq!(stats.rigid_body_count, 3, "Expected 3 rigid bodies");
    assert_eq!(stats.collider_count, 3, "Expected 3 colliders");

    // Step the physics simulation
    physics_world.step(1.0 / 60.0);

    // Verify the falling cube has moved
    let falling_cube_id = scene
        .entities
        .iter()
        .find(|e| e.name.as_deref() == Some("Cube 0"))
        .and_then(|e| e.entity_id())
        .expect("Cube 0 entity not found");

    let (position_after, _) = physics_world
        .get_entity_transform(falling_cube_id)
        .expect("Failed to get cube transform");

    // After one timestep, the cube should have fallen slightly
    // Initial Y was 4.25, so it should be less than 4.25 after one step
    assert!(
        position_after.y < 4.25,
        "Cube should have fallen after one physics step, but y={}",
        position_after.y
    );

    println!("✓ testphysics scene loaded successfully");
    println!(
        "✓ Physics world initialized with {} entities",
        entities_added
    );
    println!("✓ Physics simulation running correctly");
    println!("✓ Falling cube position after 1 step: {:?}", position_after);
}

#[test]
fn test_physics_ground_is_fixed() {
    // Load scene
    let scene_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../game/scenes/tests/testphysics.json");
    let json = std::fs::read_to_string(&scene_path).unwrap();
    let scene: Scene = serde_json::from_str(&json).unwrap();

    // Initialize physics
    let mut physics_world = PhysicsWorld::new();
    let registry = create_default_registry();
    populate_physics_world(&mut physics_world, &scene, &registry).unwrap();

    // Get ground entity (Plane 0)
    let ground_id = scene
        .entities
        .iter()
        .find(|e| e.name.as_deref() == Some("Plane 0"))
        .and_then(|e| e.entity_id())
        .expect("Plane 0 entity not found");

    let (position_before, _) = physics_world
        .get_entity_transform(ground_id)
        .expect("Failed to get ground transform");

    // Step physics multiple times
    for _ in 0..60 {
        physics_world.step(1.0 / 60.0);
    }

    let (position_after, _) = physics_world
        .get_entity_transform(ground_id)
        .expect("Failed to get ground transform after stepping");

    // Ground should not have moved (it's a fixed body)
    assert!(
        (position_before.y - position_after.y).abs() < 0.001,
        "Ground should not move, but moved from {} to {}",
        position_before.y,
        position_after.y
    );

    println!("✓ Ground remains fixed after 60 physics steps");
}

#[test]
fn test_physics_bouncy_sphere() {
    // Load scene
    let scene_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../game/scenes/tests/testphysics.json");
    let json = std::fs::read_to_string(&scene_path).unwrap();
    let scene: Scene = serde_json::from_str(&json).unwrap();

    // Initialize physics
    let mut physics_world = PhysicsWorld::new();
    let registry = create_default_registry();
    populate_physics_world(&mut physics_world, &scene, &registry).unwrap();

    // Get sphere entity
    let sphere_id = scene
        .entities
        .iter()
        .find(|e| e.name.as_deref() == Some("sphere"))
        .and_then(|e| e.entity_id())
        .expect("sphere entity not found");

    let (position_initial, _) = physics_world
        .get_entity_transform(sphere_id)
        .expect("Failed to get sphere transform");

    assert!(
        (position_initial.y - 5.25).abs() < 0.1,
        "Sphere should start at y=5.25, but got y={}",
        position_initial.y
    );

    // Step physics for 2 seconds (120 steps)
    for _ in 0..120 {
        physics_world.step(1.0 / 60.0);
    }

    let (position_after, _) = physics_world
        .get_entity_transform(sphere_id)
        .expect("Failed to get sphere transform after simulation");

    // Sphere should have fallen significantly
    assert!(
        position_after.y < position_initial.y,
        "Sphere should have fallen from {} to {}",
        position_initial.y,
        position_after.y
    );

    println!(
        "✓ Sphere fell from y={} to y={}",
        position_initial.y, position_after.y
    );
}
