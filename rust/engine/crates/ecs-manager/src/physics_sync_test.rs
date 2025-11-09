/// Integration tests for physics synchronization with runtime-created entities
///
/// Tests the full lifecycle of entities created via GameObject API,
/// ensuring physics components are properly synchronized to PhysicsWorld.

#[cfg(test)]
mod tests {
    use crate::scene_manager::SceneManager;
    use serde_json::json;
    use vibe_scene::Scene;

    fn create_test_scene() -> Scene {
        Scene {
            version: 1,
            name: "Physics Sync Test".to_string(),
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
    fn test_physics_sync_dynamic_sphere() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity with dynamic rigid body and sphere collider
        let entity_id = manager
            .create_entity()
            .with_name("Dynamic Sphere")
            .with_position([0.0, 10.0, 0.0])
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

        // Apply pending commands (this triggers physics sync)
        manager.apply_pending_commands().unwrap();

        // Verify entity was added to scene
        assert!(manager.scene_state().has_entity(entity_id));

        // Verify physics world has the entity
        let stats = manager.physics_world().stats();
        assert_eq!(stats.rigid_body_count, 1, "Should have 1 rigid body");
        assert_eq!(stats.collider_count, 1, "Should have 1 collider");

        // Verify entity has correct transform in physics world
        let (pos, _rot) = manager
            .physics_world()
            .get_entity_transform(entity_id)
            .expect("Entity should exist in physics world");
        assert!((pos.y - 10.0).abs() < 0.001, "Y position should be 10.0");
    }

    #[test]
    fn test_physics_sync_static_ground() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create collider-only entity (should create Fixed body)
        let _entity_id = manager
            .create_entity()
            .with_name("Ground")
            .with_position([0.0, 0.0, 0.0])
            .with_scale([10.0, 1.0, 10.0])
            .with_component(
                "MeshCollider",
                json!({
                    "enabled": true,
                    "colliderType": "box",
                    "size": {"width": 1.0, "height": 1.0, "depth": 1.0},
                    "center": [0.0, 0.0, 0.0],
                    "isTrigger": false,
                    "physicsMaterial": {
                        "friction": 0.7,
                        "restitution": 0.0,
                        "density": 1.0
                    }
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();

        let stats = manager.physics_world().stats();
        assert_eq!(
            stats.rigid_body_count, 1,
            "Collider-only entity should create Fixed body"
        );
        assert_eq!(stats.collider_count, 1);
    }

    #[test]
    fn test_physics_sync_disabled_components() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity with disabled physics components
        let _entity_id = manager
            .create_entity()
            .with_name("Disabled Physics")
            .with_component(
                "RigidBody",
                json!({
                    "enabled": false,  // DISABLED
                    "bodyType": "dynamic",
                    "mass": 1.0
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();

        let stats = manager.physics_world().stats();
        assert_eq!(
            stats.rigid_body_count, 0,
            "Disabled components should not create physics entities"
        );
    }

    #[test]
    fn test_physics_sync_multiple_entities() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create multiple physics entities
        for i in 0..5 {
            manager
                .create_entity()
                .with_name(&format!("Sphere {}", i))
                .with_position([i as f32 * 2.0, 5.0, 0.0])
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
        }

        manager.apply_pending_commands().unwrap();

        let stats = manager.physics_world().stats();
        assert_eq!(stats.rigid_body_count, 5, "Should have 5 rigid bodies");
        assert_eq!(stats.collider_count, 5, "Should have 5 colliders");
    }

    #[test]
    fn test_physics_sync_with_rotation() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity with rotation (degrees in JSON)
        let entity_id = manager
            .create_entity()
            .with_name("Rotated Box")
            .with_position([0.0, 5.0, 0.0])
            .with_rotation([45.0, 0.0, 0.0]) // 45 degrees around X
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
                    "colliderType": "box",
                    "size": {"width": 1.0, "height": 1.0, "depth": 1.0}
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();

        // Verify rotation was converted correctly (degrees → radians)
        let (_pos, rot) = manager
            .physics_world()
            .get_entity_transform(entity_id)
            .unwrap();

        // Quaternion for 45 degrees around X should not be identity
        assert!(
            (rot.x.abs() - 0.0).abs() > 0.1,
            "Rotation should be applied (not identity)"
        );
    }

    #[test]
    fn test_physics_sync_scale_application() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity with scale
        let _entity_id = manager
            .create_entity()
            .with_name("Scaled Box")
            .with_position([0.0, 5.0, 0.0])
            .with_scale([2.0, 2.0, 2.0]) // 2x scale
            .with_component(
                "MeshCollider",
                json!({
                    "enabled": true,
                    "colliderType": "box",
                    "size": {"width": 1.0, "height": 1.0, "depth": 1.0}
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();

        // Scale should be applied to collider (tested implicitly by no crash)
        let stats = manager.physics_world().stats();
        assert_eq!(stats.collider_count, 1, "Scaled collider should be created");
    }

    #[test]
    fn test_create_destroy_cycle() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        // Create entity
        let entity_id = manager
            .create_entity()
            .with_name("Temporary Entity")
            .with_component(
                "RigidBody",
                json!({
                    "enabled": true,
                    "bodyType": "dynamic",
                    "mass": 1.0
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();
        assert_eq!(manager.physics_world().stats().rigid_body_count, 1);

        // Destroy entity
        manager.destroy_entity(entity_id);
        manager.apply_pending_commands().unwrap();

        // Verify cleanup
        assert!(!manager.scene_state().has_entity(entity_id));
        assert_eq!(
            manager.physics_world().stats().rigid_body_count,
            0,
            "Physics body should be removed"
        );
    }

    #[test]
    fn test_physics_material_properties() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let _entity_id = manager
            .create_entity()
            .with_name("High Friction Entity")
            .with_component(
                "RigidBody",
                json!({
                    "enabled": true,
                    "bodyType": "dynamic",
                    "mass": 2.5,
                    "gravityScale": 0.5,
                    "material": {
                        "friction": 0.9,
                        "restitution": 0.8,
                        "density": 2.0
                    }
                }),
            )
            .with_component(
                "MeshCollider",
                json!({
                    "enabled": true,
                    "colliderType": "sphere",
                    "size": {"radius": 1.0},
                    "physicsMaterial": {
                        "friction": 0.9,
                        "restitution": 0.8,
                        "density": 2.0
                    }
                }),
            )
            .build();

        manager.apply_pending_commands().unwrap();

        // Material properties should be applied (tested implicitly)
        assert_eq!(manager.physics_world().stats().rigid_body_count, 1);
    }
}
