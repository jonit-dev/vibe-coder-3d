/// SceneManager - Central coordinator for mutable scene operations
///
/// Owns SceneState, PhysicsWorld, and EntityCommandBuffer.
/// Provides APIs for runtime entity creation, modification, and destruction.

use anyhow::{Context, Result};
use std::sync::Arc;
use vibe_physics::PhysicsWorld;
use vibe_scene::{EntityCommand, EntityCommandBuffer, EntityId, Scene, SceneState};

use crate::entity_builder::EntityBuilder;

/// Central manager for scene mutations and physics synchronization
pub struct SceneManager {
    state: Arc<SceneState>,
    physics_world: PhysicsWorld,
    command_buffer: EntityCommandBuffer,
}

impl SceneManager {
    /// Create a new SceneManager from a loaded scene
    pub fn new(scene: Scene) -> Self {
        let state = Arc::new(SceneState::new(scene));
        let physics_world = PhysicsWorld::new();

        Self {
            state,
            physics_world,
            command_buffer: EntityCommandBuffer::new(),
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

        log::debug!(
            "Applying {} pending commands",
            self.command_buffer.len()
        );

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
            persistentId: None, // Don't set persistentId - use numeric ID
            name: Some(name.clone()),
            parentPersistentId: parent_id.map(|_| format!("runtime-parent")), // Simplified for now
            tags: vec![],
            components: HashMap::new(),
        };

        // Add components
        for (component_type, data) in components {
            entity
                .components
                .insert(component_type.as_str().to_string(), data);
        }

        // Add to scene
        let added_id = self.state.add_entity(entity);

        // Verify the ID matches
        debug_assert_eq!(added_id, entity_id, "Entity ID mismatch after creation");

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

        // Lifecycle hook: on_entity_destroyed (before removal)
        self.on_entity_destroyed(entity_id)?;

        // Remove from physics world first
        self.physics_world.remove_entity(entity_id);

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
            entity.parentPersistentId = parent_id.map(|id| format!("runtime-{}", id.as_u64()));
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
            // TODO: Implement physics sync in Phase 5
        }

        Ok(())
    }

    fn on_entity_destroyed(&mut self, _entity_id: EntityId) -> Result<()> {
        // Hook for cleanup before entity is destroyed
        // Currently just logs, can be extended for custom cleanup
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
