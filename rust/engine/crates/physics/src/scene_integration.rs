use anyhow::{Context, Result};
use glam::{Quat, Vec3};
use vibe_ecs_bridge::{ComponentRegistry, MeshCollider, RigidBody};
use vibe_scene::{Entity, Scene};

use crate::{
    builder::{ColliderBuilder, ColliderSize, RigidBodyBuilder as PhysicsRigidBodyBuilder},
    components::{ColliderType, PhysicsMaterial, RigidBodyType},
    PhysicsWorld,
};

/// Helper to populate a PhysicsWorld from a Scene
pub fn populate_physics_world(
    world: &mut PhysicsWorld,
    scene: &Scene,
    registry: &ComponentRegistry,
) -> Result<usize> {
    let mut entities_added = 0;

    for entity in &scene.entities {
        if let Some(entity_id) = entity.entity_id() {
            // Try to get RigidBody and MeshCollider components
            let rigid_body_opt = get_component::<RigidBody>(entity, "RigidBody", registry);
            let mesh_collider_opt = get_component::<MeshCollider>(entity, "MeshCollider", registry);

            // Skip if no physics components
            if rigid_body_opt.is_none() && mesh_collider_opt.is_none() {
                continue;
            }

            // Get transform
            let (position, rotation, scale) = get_transform(entity, registry);

            // Build rigid body (or fixed body if only collider)
            let rapier_body = if let Some(rb_component) = rigid_body_opt {
                if !rb_component.enabled {
                    continue; // Skip disabled bodies
                }

                build_rigid_body(&rb_component, position, rotation)?
            } else {
                // Collider-only entity needs a fixed body
                PhysicsRigidBodyBuilder::new(RigidBodyType::Fixed)
                    .position(position)
                    .rotation(rotation)
                    .build()
            };

            // Build colliders
            let mut colliders = Vec::new();
            if let Some(mc_component) = mesh_collider_opt {
                if mc_component.enabled {
                    if let Ok(collider) = build_collider(&mc_component, scale) {
                        colliders.push(collider);
                    }
                }
            }

            // Add to physics world
            world.add_entity(entity_id, rapier_body, colliders)?;
            entities_added += 1;

            log::debug!(
                "Added physics entity: {:?} (pos: {:?})",
                entity.name,
                position
            );
        }
    }

    log::info!(
        "Physics world populated: {} entities with physics components",
        entities_added
    );
    Ok(entities_added)
}

/// Get a component from an entity
fn get_component<T: 'static>(
    entity: &Entity,
    component_name: &str,
    registry: &ComponentRegistry,
) -> Option<T> {
    entity
        .components
        .get(component_name)
        .and_then(|value| registry.decode(component_name, value).ok())
        .and_then(|boxed| boxed.downcast::<T>().ok())
        .map(|boxed| *boxed)
}

/// Extract transform from entity (position, rotation, scale)
fn get_transform(entity: &Entity, registry: &ComponentRegistry) -> (Vec3, Quat, Vec3) {
    use vibe_ecs_bridge::Transform;

    if let Some(transform) = get_component::<Transform>(entity, "Transform", registry) {
        let position = transform
            .position
            .map(|p| Vec3::new(p[0], p[1], p[2]))
            .unwrap_or(Vec3::ZERO);

        let rotation = if let Some(ref rot) = transform.rotation {
            if rot.len() == 4 {
                // Quaternion [x, y, z, w]
                Quat::from_xyzw(rot[0], rot[1], rot[2], rot[3])
            } else if rot.len() == 3 {
                // Euler angles [x, y, z] in radians
                Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2])
            } else {
                Quat::IDENTITY
            }
        } else {
            Quat::IDENTITY
        };

        let scale = transform
            .scale
            .map(|s| Vec3::new(s[0], s[1], s[2]))
            .unwrap_or(Vec3::ONE);

        (position, rotation, scale)
    } else {
        (Vec3::ZERO, Quat::IDENTITY, Vec3::ONE)
    }
}

/// Build a Rapier rigid body from RigidBody component
fn build_rigid_body(
    component: &RigidBody,
    position: Vec3,
    rotation: Quat,
) -> Result<rapier3d::dynamics::RigidBody> {
    let body_type = RigidBodyType::from_str(component.get_body_type());

    let mut builder = PhysicsRigidBodyBuilder::new(body_type)
        .position(position)
        .rotation(rotation)
        .mass(component.mass)
        .gravity_scale(component.gravityScale)
        .can_sleep(component.canSleep);

    // Apply material if present
    if let Some(ref material) = component.material {
        builder = builder.material(PhysicsMaterial {
            friction: material.friction,
            restitution: material.restitution,
            density: material.density,
        });
    }

    Ok(builder.build())
}

/// Build a Rapier collider from MeshCollider component
fn build_collider(component: &MeshCollider, scale: Vec3) -> Result<rapier3d::geometry::Collider> {
    let collider_type = ColliderType::from_str(&component.colliderType);

    let center = Vec3::new(
        component.center[0],
        component.center[1],
        component.center[2],
    );

    let size = ColliderSize {
        width: component.size.width,
        height: component.size.height,
        depth: component.size.depth,
        radius: component.size.radius,
        capsule_radius: component.size.capsuleRadius,
        capsule_height: component.size.capsuleHeight,
    };

    let material = PhysicsMaterial {
        friction: component.physicsMaterial.friction,
        restitution: component.physicsMaterial.restitution,
        density: component.physicsMaterial.density,
    };

    ColliderBuilder::new(collider_type)
        .center(center)
        .size(size)
        .material(material)
        .sensor(component.isTrigger)
        .scale(scale)
        .build()
        .context("Failed to build collider")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use vibe_ecs_bridge::create_default_registry;
    use vibe_scene::{Metadata, Scene};

    #[test]
    fn test_populate_physics_world_with_rigid_body() {
        let registry = create_default_registry();
        let mut world = PhysicsWorld::new();

        // Create a test scene with one physics entity
        let scene = Scene {
            metadata: Metadata::default(),
            entities: vec![Entity {
                id: Some(1),
                persistentId: Some("test-entity-1".to_string()),
                name: Some("TestEntity".to_string()),
                parentPersistentId: None,
                components: vec![
                    (
                        "Transform".to_string(),
                        json!({"position": [0.0, 5.0, 0.0]}),
                    ),
                    (
                        "RigidBody".to_string(),
                        json!({
                            "enabled": true,
                            "bodyType": "dynamic",
                            "mass": 2.0
                        }),
                    ),
                    (
                        "MeshCollider".to_string(),
                        json!({
                            "enabled": true,
                            "colliderType": "sphere",
                            "size": {"radius": 1.0}
                        }),
                    ),
                ]
                .into_iter()
                .collect(),
            }],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        let result = populate_physics_world(&mut world, &scene, &registry);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        // Verify entity was added
        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 1);
        assert_eq!(stats.collider_count, 1);

        // Verify transform using the entity's actual ID
        let entity_id = scene.entities[0].entity_id().unwrap();
        let (pos, _) = world.get_entity_transform(entity_id).unwrap();
        assert!((pos.y - 5.0).abs() < 0.001);
    }

    #[test]
    fn test_populate_skips_disabled_entities() {
        let registry = create_default_registry();
        let mut world = PhysicsWorld::new();

        let scene = Scene {
            metadata: Metadata::default(),
            entities: vec![Entity {
                id: Some(1),
                persistentId: Some("disabled-entity".to_string()),
                name: Some("Disabled".to_string()),
                parentPersistentId: None,
                components: vec![(
                    "RigidBody".to_string(),
                    json!({"enabled": false, "bodyType": "dynamic"}),
                )]
                .into_iter()
                .collect(),
            }],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        let result = populate_physics_world(&mut world, &scene, &registry);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0); // No entities added

        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 0);
    }

    #[test]
    fn test_collider_only_entity_creates_fixed_body() {
        let registry = create_default_registry();
        let mut world = PhysicsWorld::new();

        let scene = Scene {
            metadata: Metadata::default(),
            entities: vec![Entity {
                id: Some(1),
                persistentId: Some("ground-entity".to_string()),
                name: Some("Ground".to_string()),
                parentPersistentId: None,
                components: vec![(
                    "MeshCollider".to_string(),
                    json!({
                        "enabled": true,
                        "colliderType": "box",
                        "size": {"width": 10.0, "height": 1.0, "depth": 10.0}
                    }),
                )]
                .into_iter()
                .collect(),
            }],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        let result = populate_physics_world(&mut world, &scene, &registry);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 1);
        assert_eq!(stats.collider_count, 1);
    }
}
