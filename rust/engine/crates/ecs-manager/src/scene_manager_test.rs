/// Integration tests for SceneManager
///
/// Tests the complete lifecycle of entity creation, modification, and destruction.

#[cfg(test)]
mod integration_tests {
    use crate::SceneManager;
    use vibe_scene::{EntityId, Scene};

    fn create_test_scene() -> Scene {
        Scene {
            version: 1,
            name: "Integration Test Scene".to_string(),
            entities: vec![],
            materials: vec![],
            meshes: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        }
    }

    #[test]
    fn test_create_entity_lifecycle() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Initially empty
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            0
        );

        // Create an entity
        let entity_id = manager
            .create_entity()
            .with_name("Test Entity")
            .with_position([0.0, 5.0, 0.0])
            .build();

        // Command queued but not applied yet
        assert_eq!(manager.pending_command_count(), 1);
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            0
        );

        // Apply commands
        manager.apply_pending_commands().unwrap();

        // Entity should now exist
        assert_eq!(manager.pending_command_count(), 0);
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            1
        );
        assert!(manager.scene_state().has_entity(entity_id));
    }

    #[test]
    fn test_destroy_entity_lifecycle() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create an entity
        let entity_id = manager
            .create_entity()
            .with_name("Entity to Destroy")
            .build();

        manager.apply_pending_commands().unwrap();
        assert!(manager.scene_state().has_entity(entity_id));

        // Destroy the entity
        manager.destroy_entity(entity_id);
        assert_eq!(manager.pending_command_count(), 1);

        manager.apply_pending_commands().unwrap();

        // Entity should be gone
        assert!(!manager.scene_state().has_entity(entity_id));
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            0
        );
    }

    #[test]
    fn test_create_multiple_entities() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create multiple entities
        let id1 = manager.create_entity().with_name("Entity 1").build();
        let id2 = manager.create_entity().with_name("Entity 2").build();
        let id3 = manager.create_entity().with_name("Entity 3").build();

        assert_eq!(manager.pending_command_count(), 3);

        manager.apply_pending_commands().unwrap();

        // All entities should exist
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            3
        );
        assert!(manager.scene_state().has_entity(id1));
        assert!(manager.scene_state().has_entity(id2));
        assert!(manager.scene_state().has_entity(id3));
    }

    #[test]
    fn test_create_entity_with_primitive() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let entity_id = manager
            .create_entity()
            .with_name("Cube")
            .with_primitive("cube")
            .with_material("#ff0000", 0.5, 0.5)
            .with_position([0.0, 0.0, 0.0])
            .build();

        manager.apply_pending_commands().unwrap();

        // Verify entity has components
        manager.scene_state().with_scene(|scene| {
            let entity = scene.find_entity(entity_id).unwrap();
            assert_eq!(entity.name.as_deref(), Some("Cube"));
            assert!(entity.has_component("MeshRenderer"));
            assert!(entity.has_component("Material"));
            assert!(entity.has_component("Transform"));
        });
    }

    #[test]
    fn test_create_entity_with_physics() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let entity_id = manager
            .create_entity()
            .with_name("Physics Object")
            .with_primitive("sphere")
            .with_rigidbody("dynamic", 1.0, 1.0)
            .with_collider("sphere")
            .build();

        manager.apply_pending_commands().unwrap();

        // Verify physics components
        manager.scene_state().with_scene(|scene| {
            let entity = scene.find_entity(entity_id).unwrap();
            assert!(entity.has_component("RigidBody"));
            assert!(entity.has_component("MeshCollider"));
        });
    }

    #[test]
    fn test_entity_parenting() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create parent
        let parent_id = manager.create_entity().with_name("Parent").build();

        // Create child
        let child_id = manager
            .create_entity()
            .with_name("Child")
            .with_parent(Some(parent_id))
            .build();

        manager.apply_pending_commands().unwrap();

        // Verify parent-child relationship
        manager.scene_state().with_scene(|scene| {
            let child = scene.find_entity(child_id).unwrap();
            let parent = scene.find_entity(parent_id).unwrap();

            assert_eq!(child.name.as_deref(), Some("Child"));
            assert_eq!(parent.name.as_deref(), Some("Parent"));
            assert!(child.parent_persistent_id.is_some());
        });
    }

    #[test]
    fn test_destroy_nonexistent_entity() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Try to destroy an entity that doesn't exist
        let fake_id = EntityId::new(999);
        manager.destroy_entity(fake_id);

        // Should not panic
        let result = manager.apply_pending_commands();
        assert!(result.is_ok());
    }

    #[test]
    fn test_multiple_command_applications() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // First batch of commands
        let id1 = manager.create_entity().with_name("Entity 1").build();
        manager.apply_pending_commands().unwrap();

        // Second batch of commands
        let id2 = manager.create_entity().with_name("Entity 2").build();
        manager.apply_pending_commands().unwrap();

        // Both entities should exist
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            2
        );
        assert!(manager.scene_state().has_entity(id1));
        assert!(manager.scene_state().has_entity(id2));
    }

    #[test]
    fn test_create_and_destroy_same_frame() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity
        let entity_id = manager.create_entity().with_name("Temporary").build();

        // Destroy it immediately (same frame)
        manager.destroy_entity(entity_id);

        assert_eq!(manager.pending_command_count(), 2);

        // Apply both commands
        manager.apply_pending_commands().unwrap();

        // Entity should not exist (created then destroyed)
        assert!(!manager.scene_state().has_entity(entity_id));
        assert_eq!(
            manager.scene_state().with_scene(|s| s.entities.len()),
            0
        );
    }
}
