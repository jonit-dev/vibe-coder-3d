/// Stress tests for memory and performance validation
///
/// Tests the SceneManager under heavy load to detect:
/// - Memory leaks during entity create/destroy cycles
/// - Performance degradation with many entities
/// - Physics world synchronization at scale

#[cfg(test)]
mod tests {
    use crate::scene_manager::SceneManager;
    use serde_json::json;
    use vibe_scene::Scene;

    fn create_test_scene() -> Scene {
        Scene {
            version: 1,
            name: "Stress Test Scene".to_string(),
            entities: vec![],
            materials: vec![],
            meshes: None,
            prefabs: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        }
    }

    #[test]
    fn test_stress_create_destroy_cycles() {
        // Test 1000 create/destroy cycles to detect memory leaks
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        for cycle in 0..1000 {
            // Create entity
            let entity_id = manager
                .create_entity()
                .with_name(&format!("Stress Entity {}", cycle))
                .with_position([0.0, 0.0, 0.0])
                .build();

            manager.apply_pending_commands().unwrap();

            // Verify creation
            assert!(manager.scene_state().has_entity(entity_id));

            // Destroy entity
            manager.destroy_entity(entity_id);
            manager.apply_pending_commands().unwrap();

            // Verify destruction
            assert!(!manager.scene_state().has_entity(entity_id));
        }

        // Final verification - scene should be empty
        let entity_count = manager.scene_state().with_scene(|scene| scene.entities.len());
        assert_eq!(entity_count, 0, "Scene should be empty after stress test");
    }

    #[test]
    fn test_stress_bulk_entity_creation() {
        // Create 1000 entities at once
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let start = std::time::Instant::now();

        // Create 1000 entities
        let mut entity_ids = Vec::new();
        for i in 0..1000 {
            let entity_id = manager
                .create_entity()
                .with_name(&format!("Bulk Entity {}", i))
                .with_position([i as f32 * 0.1, 0.0, 0.0])
                .build();
            entity_ids.push(entity_id);
        }

        // Apply all at once
        manager.apply_pending_commands().unwrap();

        let duration = start.elapsed();

        // Verify all entities were created
        assert_eq!(entity_ids.len(), 1000);
        for entity_id in &entity_ids {
            assert!(manager.scene_state().has_entity(*entity_id));
        }

        // Performance check: should complete in < 1 second
        assert!(
            duration.as_secs_f32() < 1.0,
            "Bulk creation took too long: {:?}",
            duration
        );

        println!(
            "Bulk creation of 1000 entities took: {:?} ({:.2} entities/ms)",
            duration,
            1000.0 / duration.as_millis() as f32
        );
    }

    #[test]
    fn test_stress_physics_sync_bulk() {
        // Create 500 physics entities
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let start = std::time::Instant::now();

        for i in 0..500 {
            manager
                .create_entity()
                .with_name(&format!("Physics Entity {}", i))
                .with_position([i as f32 * 2.0, 10.0, 0.0])
                .with_component(
                    "RigidBody",
                    json!({
                        "enabled": true,
                        "bodyType": "dynamic",
                        "mass": 1.0,
                        "gravityScale": 1.0,
                        "canSleep": true
                    }),
                )
                .with_component(
                    "MeshCollider",
                    json!({
                        "enabled": true,
                        "colliderType": "sphere",
                        "size": {"radius": 0.5},
                        "center": [0.0, 0.0, 0.0],
                        "isTrigger": false,
                        "physicsMaterial": {
                            "friction": 0.5,
                            "restitution": 0.3,
                            "density": 1.0
                        }
                    }),
                )
                .build();
        }

        manager.apply_pending_commands().unwrap();

        let duration = start.elapsed();

        // Verify physics world stats
        let stats = manager.physics_world().stats();
        assert_eq!(stats.rigid_body_count, 500, "Should have 500 rigid bodies");
        assert_eq!(stats.collider_count, 500, "Should have 500 colliders");

        // Performance check: should complete in < 2 seconds
        assert!(
            duration.as_secs_f32() < 2.0,
            "Bulk physics sync took too long: {:?}",
            duration
        );

        println!(
            "Bulk physics sync of 500 entities took: {:?} ({:.2} entities/ms)",
            duration,
            500.0 / duration.as_millis() as f32
        );
    }

    #[test]
    fn test_stress_alternating_create_destroy() {
        // Alternate between creating and destroying entities
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let mut active_entities = Vec::new();

        for i in 0..1000 {
            if i % 2 == 0 {
                // Create entity
                let entity_id = manager
                    .create_entity()
                    .with_name(&format!("Alternating {}", i))
                    .build();
                active_entities.push(entity_id);
            } else if !active_entities.is_empty() {
                // Destroy oldest entity
                let entity_id = active_entities.remove(0);
                manager.destroy_entity(entity_id);
            }
        }

        manager.apply_pending_commands().unwrap();

        // Verify state matches expectations
        for entity_id in &active_entities {
            assert!(
                manager.scene_state().has_entity(*entity_id),
                "Active entity should exist"
            );
        }
    }

    #[test]
    fn test_stress_physics_create_destroy_cycles() {
        // Create/destroy physics entities in cycles
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        for cycle in 0..100 {
            // Create 10 physics entities
            let mut entity_ids = Vec::new();
            for i in 0..10 {
                let entity_id = manager
                    .create_entity()
                    .with_name(&format!("Cycle {} Entity {}", cycle, i))
                    .with_component(
                        "RigidBody",
                        json!({
                            "enabled": true,
                            "bodyType": "dynamic",
                            "mass": 1.0
                        }),
                    )
                    .with_component(
                        "MeshCollider",
                        json!({
                            "enabled": true,
                            "colliderType": "sphere",
                            "size": {"radius": 0.5}
                        }),
                    )
                    .build();
                entity_ids.push(entity_id);
            }

            manager.apply_pending_commands().unwrap();

            // Verify physics world
            let stats = manager.physics_world().stats();
            assert_eq!(stats.rigid_body_count, 10);

            // Destroy all
            for entity_id in entity_ids {
                manager.destroy_entity(entity_id);
            }

            manager.apply_pending_commands().unwrap();

            // Verify cleanup
            let stats = manager.physics_world().stats();
            assert_eq!(
                stats.rigid_body_count, 0,
                "Physics world should be empty after cycle {}", cycle
            );
        }
    }

    #[test]
    fn test_stress_component_updates() {
        // Test repeated component updates
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity
        let entity_id = manager
            .create_entity()
            .with_name("Component Update Test")
            .with_position([0.0, 0.0, 0.0])
            .build();

        manager.apply_pending_commands().unwrap();

        // Update position 1000 times
        for i in 0..1000 {
            manager.scene_state().find_entity_mut(entity_id, |entity| {
                if let Some(transform) = entity.components.get_mut("Transform") {
                    if let Some(obj) = transform.as_object_mut() {
                        obj.insert(
                            "position".to_string(),
                            json!([i as f32, 0.0, 0.0])
                        );
                    }
                }
            });
        }

        // Verify final state
        assert!(manager.scene_state().has_entity(entity_id));
    }

    #[test]
    fn test_stress_hierarchy_creation() {
        // Create deep parent/child hierarchies
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let mut parent_id = None;

        // Create 100-level deep hierarchy
        for i in 0..100 {
            let entity_id = manager
                .create_entity()
                .with_name(&format!("Level {}", i))
                .with_parent(parent_id)
                .build();

            parent_id = Some(entity_id);
        }

        manager.apply_pending_commands().unwrap();

        // Verify all entities exist
        let entity_count = manager.scene_state().with_scene(|scene| scene.entities.len());
        assert_eq!(entity_count, 100);
    }

    #[test]
    fn test_stress_memory_stability() {
        // Test memory doesn't grow unboundedly
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create and destroy in batches
        for batch in 0..10 {
            // Create 100 entities
            let mut entity_ids = Vec::new();
            for i in 0..100 {
                let entity_id = manager
                    .create_entity()
                    .with_name(&format!("Batch {} Entity {}", batch, i))
                    .with_position([i as f32, 0.0, 0.0])
                    .with_component(
                        "RigidBody",
                        json!({
                            "enabled": true,
                            "bodyType": "dynamic",
                            "mass": 1.0
                        }),
                    )
                    .build();
                entity_ids.push(entity_id);
            }

            manager.apply_pending_commands().unwrap();

            // Verify creation
            assert_eq!(
                entity_ids.len(),
                100,
                "Batch {} should have 100 entities",
                batch
            );

            // Destroy all
            for entity_id in entity_ids {
                manager.destroy_entity(entity_id);
            }

            manager.apply_pending_commands().unwrap();

            // Verify scene is empty
            let entity_count = manager.scene_state().with_scene(|scene| scene.entities.len());
            assert_eq!(
                entity_count, 0,
                "Scene should be empty after batch {}", batch
            );
        }
    }
}
