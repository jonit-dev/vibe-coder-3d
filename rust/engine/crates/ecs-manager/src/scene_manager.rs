/// SceneManager - Central coordinator for mutable scene operations
///
/// Owns SceneState, PhysicsWorld, and EntityCommandBuffer.
/// Provides APIs for runtime entity creation, modification, and destruction.
use anyhow::{Context, Result};
use std::sync::Arc;
use vibe_ecs_bridge::ComponentRegistry;
use vibe_events::SceneEventBus;
use vibe_physics::PhysicsWorld;
use vibe_scene::{
    ComponentKindId, EntityCommand, EntityCommandBuffer, EntityId, Scene, SceneState,
};

use crate::entity_builder::EntityBuilder;

/// Central manager for scene mutations and physics synchronization
pub struct SceneManager {
    state: Arc<SceneState>,
    physics_world: PhysicsWorld,
    command_buffer: EntityCommandBuffer,
    registry: ComponentRegistry,
    events: Arc<SceneEventBus>,
}

impl SceneManager {
    /// Create a new SceneManager from a loaded scene
    pub fn new(scene: Scene) -> Self {
        let state = Arc::new(SceneState::new(scene));
        let physics_world = PhysicsWorld::new();
        let registry = vibe_ecs_bridge::create_default_registry();
        let events = Arc::new(SceneEventBus::new());

        Self {
            state,
            physics_world,
            command_buffer: EntityCommandBuffer::new(),
            registry,
            events,
        }
    }

    /// Start building a new entity (fluent API)
    pub fn create_entity(&mut self) -> EntityBuilder {
        EntityBuilder::new(&mut self.command_buffer, self.state.clone())
    }

    /// Queue entity destruction
    pub fn destroy_entity(&mut self, entity_id: EntityId) {
        log::debug!("Queueing entity destruction: {}", entity_id);
        self.command_buffer
            .push(EntityCommand::DestroyEntity { entity_id });
    }

    /// Apply all pending commands atomically
    pub fn apply_pending_commands(&mut self) -> Result<()> {
        if self.command_buffer.is_empty() {
            return Ok(());
        }

        log::debug!("Applying {} pending commands", self.command_buffer.len());

        // Collect commands to avoid borrow checker issues
        let commands: Vec<_> = self.command_buffer.drain().collect();

        for command in commands {
            match command {
                EntityCommand::CreateEntity {
                    entity_id,
                    name,
                    parent_id,
                    components,
                } => {
                    self.handle_create_entity(entity_id, name, parent_id, components)?;
                }
                EntityCommand::DestroyEntity { entity_id } => {
                    self.handle_destroy_entity(entity_id)?;
                }
                EntityCommand::SetComponent {
                    entity_id,
                    component_type,
                    data,
                } => {
                    self.handle_set_component(entity_id, component_type, data)?;
                }
                EntityCommand::RemoveComponent {
                    entity_id,
                    component_type,
                } => {
                    self.handle_remove_component(entity_id, component_type)?;
                }
                EntityCommand::SetParent {
                    entity_id,
                    parent_id,
                } => {
                    self.handle_set_parent(entity_id, parent_id)?;
                }
                EntityCommand::SetActive { entity_id, active } => {
                    self.handle_set_active(entity_id, active)?;
                }
            }
        }

        Ok(())
    }

    /// Get immutable reference to scene state
    pub fn scene_state(&self) -> &Arc<SceneState> {
        &self.state
    }

    /// Get immutable reference to physics world
    pub fn physics_world(&self) -> &PhysicsWorld {
        &self.physics_world
    }

    /// Get mutable reference to physics world
    pub fn physics_world_mut(&mut self) -> &mut PhysicsWorld {
        &mut self.physics_world
    }

    /// Get number of pending commands
    pub fn pending_command_count(&self) -> usize {
        self.command_buffer.len()
    }

    /// Get reference to the event bus
    pub fn events(&self) -> Arc<SceneEventBus> {
        self.events.clone()
    }

    /// Process all pending events. Call once per frame on the main thread.
    pub fn pump_events<F>(&mut self, lua_dispatch: F)
    where
        F: FnMut(&vibe_events::EventEnvelope),
    {
        self.events.pump_events(lua_dispatch);
    }

    /// Immediately set or update a component on an existing entity
    pub fn set_component_immediate(
        &mut self,
        entity_id: EntityId,
        component_type: impl Into<ComponentKindId>,
        data: serde_json::Value,
    ) -> Result<()> {
        self.handle_set_component(entity_id, component_type.into(), data)
    }

    /// Immediately remove a component from an entity
    pub fn remove_component_immediate(
        &mut self,
        entity_id: EntityId,
        component_type: impl Into<ComponentKindId>,
    ) -> Result<()> {
        self.handle_remove_component(entity_id, component_type.into())
    }

    /// Immediately destroy an existing entity
    pub fn destroy_entity_immediate(&mut self, entity_id: EntityId) -> Result<()> {
        self.handle_destroy_entity(entity_id)
    }

    /// Immediately set the active state for an entity
    pub fn set_active_immediate(&mut self, entity_id: EntityId, active: bool) -> Result<()> {
        self.handle_set_active(entity_id, active)
    }

    // Private command handlers

    fn handle_create_entity(
        &mut self,
        entity_id: EntityId,
        name: String,
        parent_id: Option<EntityId>,
        components: Vec<(vibe_scene::ComponentKindId, serde_json::Value)>,
    ) -> Result<()> {
        use std::collections::HashMap;

        log::info!("Creating entity: {} (id: {})", name, entity_id);

        // Build entity - only set numeric ID, no persistentId
        // This ensures entity_id() returns the correct EntityId
        let mut entity = vibe_scene::Entity {
            id: Some(entity_id.as_u64() as u32),
            persistent_id: None, // Don't set persistentId - use numeric ID
            name: Some(name.clone()),
            parent_persistent_id: parent_id.map(|_| format!("runtime-parent")), // Simplified for now
            tags: vec![],
            components: HashMap::new(),
        };

        // Add components (merge Transform fields if multiple Transform components exist)
        for (component_type, data) in components {
            let key = component_type.as_str().to_string();

            // Special handling for Transform component - merge fields instead of overwriting
            if key == "Transform" {
                if let Some(existing) = entity.components.get_mut(&key) {
                    // Merge the new Transform fields into the existing one
                    if let (Some(existing_obj), Some(new_obj)) =
                        (existing.as_object_mut(), data.as_object())
                    {
                        for (field_name, field_value) in new_obj {
                            existing_obj.insert(field_name.clone(), field_value.clone());
                        }
                    }
                } else {
                    entity.components.insert(key, data);
                }
            } else {
                entity.components.insert(key, data);
            }
        }

        // Add to scene
        let added_id = self.state.add_entity(entity);

        // Verify the ID matches
        debug_assert_eq!(added_id, entity_id, "Entity ID mismatch after creation");

        // Emit entity spawned event
        self.events.emit_to(
            entity_id,
            vibe_events::keys::ENTITY_SPAWNED,
            serde_json::json!({
                "entityId": entity_id.as_u64(),
                "name": name
            }),
        );

        // Lifecycle hook: on_entity_created
        self.on_entity_created(entity_id)?;

        Ok(())
    }

    fn handle_destroy_entity(&mut self, entity_id: EntityId) -> Result<()> {
        log::info!("Destroying entity: {}", entity_id);

        // Check if entity exists
        if !self.state.has_entity(entity_id) {
            log::warn!("Attempted to destroy non-existent entity: {}", entity_id);
            return Ok(());
        }

        // Emit entity destroyed event
        self.events.emit_to(
            entity_id,
            vibe_events::keys::ENTITY_DESTROYED,
            serde_json::json!({
                "entityId": entity_id.as_u64()
            }),
        );

        // Lifecycle hook: on_entity_destroyed (before removal)
        self.on_entity_destroyed(entity_id)?;

        // Remove from physics world first
        let _ = self.physics_world.remove_entity(entity_id);

        // Remove from scene
        self.state.remove_entity(entity_id);

        Ok(())
    }

    fn handle_set_component(
        &mut self,
        entity_id: EntityId,
        component_type: vibe_scene::ComponentKindId,
        data: serde_json::Value,
    ) -> Result<()> {
        log::debug!(
            "Setting component {} on entity {}",
            component_type.as_str(),
            entity_id
        );

        let found = self.state.find_entity_mut(entity_id, |entity| {
            entity
                .components
                .insert(component_type.as_str().to_string(), data);
        });

        if !found {
            log::warn!(
                "Attempted to set component on non-existent entity: {}",
                entity_id
            );
        }

        Ok(())
    }

    fn handle_remove_component(
        &mut self,
        entity_id: EntityId,
        component_type: vibe_scene::ComponentKindId,
    ) -> Result<()> {
        log::debug!(
            "Removing component {} from entity {}",
            component_type.as_str(),
            entity_id
        );

        let found = self.state.find_entity_mut(entity_id, |entity| {
            entity.components.remove(component_type.as_str());
        });

        if !found {
            log::warn!(
                "Attempted to remove component from non-existent entity: {}",
                entity_id
            );
        }

        Ok(())
    }

    fn handle_set_parent(
        &mut self,
        entity_id: EntityId,
        parent_id: Option<EntityId>,
    ) -> Result<()> {
        log::debug!("Setting parent of entity {} to {:?}", entity_id, parent_id);

        let found = self.state.find_entity_mut(entity_id, |entity| {
            entity.parent_persistent_id = parent_id.map(|id| format!("runtime-{}", id.as_u64()));
        });

        if !found {
            log::warn!(
                "Attempted to set parent on non-existent entity: {}",
                entity_id
            );
        }

        Ok(())
    }

    fn handle_set_active(&mut self, entity_id: EntityId, _active: bool) -> Result<()> {
        log::debug!("Setting active state of entity {}", entity_id);

        // TODO: Implement active state tracking in Entity
        // For now, just log

        Ok(())
    }

    // Lifecycle hooks

    fn on_entity_created(&mut self, entity_id: EntityId) -> Result<()> {
        // Check if entity has physics components and sync to physics world
        let has_physics = self.state.with_scene(|scene| {
            scene
                .find_entity(entity_id)
                .map(|e| e.has_component("RigidBody") || e.has_component("MeshCollider"))
                .unwrap_or(false)
        });

        if has_physics {
            log::debug!(
                "Entity {} has physics components, syncing to physics world",
                entity_id
            );
            // Sync entity to physics world
            if let Err(e) = self.sync_entity_to_physics(entity_id) {
                log::warn!("Failed to sync entity {} to physics: {}", entity_id, e);
            }
        }

        Ok(())
    }

    /// Sync a single entity to the physics world
    /// Called when an entity with physics components is created
    fn sync_entity_to_physics(&mut self, entity_id: EntityId) -> Result<()> {
        use vibe_ecs_bridge::{
            position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt, MeshCollider, RigidBody,
            Transform,
        };
        use vibe_physics::{
            builder::{ColliderBuilder, ColliderSize, RigidBodyBuilder as PhysicsRigidBodyBuilder},
            components::{ColliderType, PhysicsMaterial, RigidBodyType},
        };

        // Get entity from scene
        let entity = self
            .state
            .with_scene(|scene| scene.find_entity(entity_id).cloned())
            .context("Entity not found in scene")?;

        // Get components
        let rigid_body_opt = self.get_component::<RigidBody>(&entity, "RigidBody");
        let mesh_collider_opt = self.get_component::<MeshCollider>(&entity, "MeshCollider");

        // Skip if no physics components
        if rigid_body_opt.is_none() && mesh_collider_opt.is_none() {
            return Ok(());
        }

        // Get transform
        let transform_opt = self.get_component::<Transform>(&entity, "Transform");
        let (position, rotation, scale) = if let Some(transform) = transform_opt {
            (
                position_to_vec3_opt(transform.position.as_ref()),
                rotation_to_quat_opt(transform.rotation.as_ref()),
                scale_to_vec3_opt(transform.scale.as_ref()),
            )
        } else {
            (glam::Vec3::ZERO, glam::Quat::IDENTITY, glam::Vec3::ONE)
        };

        // Build rigid body
        let rapier_body = if let Some(rb_component) = rigid_body_opt {
            if !rb_component.enabled {
                return Ok(()); // Skip disabled bodies
            }

            let body_type = RigidBodyType::from_str(rb_component.get_body_type());
            let mut builder = PhysicsRigidBodyBuilder::new(body_type)
                .position(position)
                .rotation(rotation)
                .mass(rb_component.mass)
                .gravity_scale(rb_component.gravity_scale)
                .can_sleep(rb_component.can_sleep);

            // Apply material if present
            if let Some(ref material) = rb_component.material {
                builder = builder.material(PhysicsMaterial {
                    friction: material.friction,
                    restitution: material.restitution,
                    density: material.density,
                });
            }

            builder.build()
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
                let collider_type = ColliderType::from_str(&mc_component.collider_type);
                let center = glam::Vec3::new(
                    mc_component.center[0],
                    mc_component.center[1],
                    mc_component.center[2],
                );

                let size = ColliderSize {
                    width: mc_component.size.width,
                    height: mc_component.size.height,
                    depth: mc_component.size.depth,
                    radius: mc_component.size.radius,
                    capsule_radius: mc_component.size.capsule_radius,
                    capsule_height: mc_component.size.capsule_height,
                };

                let material = PhysicsMaterial {
                    friction: mc_component.physics_material.friction,
                    restitution: mc_component.physics_material.restitution,
                    density: mc_component.physics_material.density,
                };

                if let Ok(collider) = ColliderBuilder::new(collider_type)
                    .center(center)
                    .size(size)
                    .material(material)
                    .sensor(mc_component.is_trigger)
                    .scale(scale)
                    .build()
                {
                    colliders.push(collider);
                }
            }
        }

        // Add to physics world
        self.physics_world
            .add_entity(entity_id, rapier_body, colliders)?;

        log::info!(
            "Synced entity {} ({:?}) to physics world",
            entity_id,
            entity.name
        );

        Ok(())
    }

    /// Helper to get a component from an entity
    fn get_component<T: 'static>(
        &self,
        entity: &vibe_scene::Entity,
        component_name: &str,
    ) -> Option<T> {
        entity
            .components
            .get(component_name)
            .and_then(|value| self.registry.decode(component_name, value).ok())
            .and_then(|boxed| boxed.downcast::<T>().ok())
            .map(|boxed| *boxed)
    }

    fn on_entity_destroyed(&mut self, entity_id: EntityId) -> Result<()> {
        // Clean up event subscriptions for this entity
        self.events.cleanup_entity(entity_id);

        // Hook for additional cleanup before entity is destroyed
        // Can be extended for custom cleanup

        log::debug!("Cleaned up event subscriptions for entity {}", entity_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_scene() -> Scene {
        Scene {
            version: 1,
            name: "Test Scene".to_string(),
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
    fn test_scene_manager_creation() {
        let scene = create_test_scene();
        let manager = SceneManager::new(scene);

        assert_eq!(manager.pending_command_count(), 0);
    }

    #[test]
    fn test_queue_entity_creation() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let _entity_id = manager.create_entity().with_name("Test Entity").build();

        // Command should be queued
        assert_eq!(manager.pending_command_count(), 1);
    }

    #[test]
    fn test_queue_entity_destruction() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let entity_id = EntityId::new(1);
        manager.destroy_entity(entity_id);

        assert_eq!(manager.pending_command_count(), 1);
    }

    #[test]
    fn test_apply_empty_commands() {
        let scene = create_test_scene();
        let mut manager = SceneManager::new(scene);

        let result = manager.apply_pending_commands();
        assert!(result.is_ok());
    }
}
