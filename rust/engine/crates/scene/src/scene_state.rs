/// Mutable scene wrapper with interior mutability
///
/// Provides controlled mutation APIs for runtime entity operations
/// while maintaining thread-safety through Mutex.

use super::{Entity, EntityId, Scene};
use std::sync::Mutex;

/// Wrapper around Scene providing mutable access via interior mutability
pub struct SceneState {
    scene: Mutex<Scene>,
    next_entity_id: Mutex<u32>,
}

impl SceneState {
    /// Create a new SceneState from an existing Scene
    pub fn new(scene: Scene) -> Self {
        // Find the maximum existing entity ID
        let max_id = scene
            .entities
            .iter()
            .filter_map(|e| e.id)
            .max()
            .unwrap_or(0);

        Self {
            scene: Mutex::new(scene),
            next_entity_id: Mutex::new(max_id + 1),
        }
    }

    /// Generate a new unique entity ID
    pub fn generate_entity_id(&self) -> EntityId {
        let mut next_id = self.next_entity_id.lock().unwrap();
        let id = *next_id;
        *next_id += 1;
        EntityId::new(id as u64)
    }

    /// Access scene immutably
    pub fn with_scene<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&Scene) -> R,
    {
        f(&self.scene.lock().unwrap())
    }

    /// Access scene mutably
    pub fn with_scene_mut<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut Scene) -> R,
    {
        f(&mut self.scene.lock().unwrap())
    }

    /// Add an entity to the scene
    pub fn add_entity(&self, entity: Entity) -> EntityId {
        let entity_id = entity.entity_id().expect("Entity must have ID");
        let mut scene = self.scene.lock().unwrap();
        scene.entities.push(entity);
        entity_id
    }

    /// Remove an entity from the scene
    pub fn remove_entity(&self, entity_id: EntityId) -> Option<Entity> {
        let mut scene = self.scene.lock().unwrap();
        let pos = scene
            .entities
            .iter()
            .position(|e| e.entity_id() == Some(entity_id))?;
        Some(scene.entities.remove(pos))
    }

    /// Find and mutate an entity
    pub fn find_entity_mut<F>(&self, entity_id: EntityId, f: F) -> bool
    where
        F: FnOnce(&mut Entity),
    {
        let mut scene = self.scene.lock().unwrap();
        if let Some(entity) = scene
            .entities
            .iter_mut()
            .find(|e| e.entity_id() == Some(entity_id))
        {
            f(entity);
            true
        } else {
            false
        }
    }

    /// Check if an entity exists
    pub fn has_entity(&self, entity_id: EntityId) -> bool {
        let scene = self.scene.lock().unwrap();
        scene
            .entities
            .iter()
            .any(|e| e.entity_id() == Some(entity_id))
    }

    /// Get entity count
    pub fn entity_count(&self) -> usize {
        let scene = self.scene.lock().unwrap();
        scene.entities.len()
    }

    /// Get all entity IDs
    pub fn entity_ids(&self) -> Vec<EntityId> {
        let scene = self.scene.lock().unwrap();
        scene
            .entities
            .iter()
            .filter_map(|e| e.entity_id())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;
    use std::collections::HashMap;

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

    fn create_test_entity(id: u32, name: &str) -> Entity {
        Entity {
            id: Some(id),
            persistent_id: Some(format!("entity-{}", id)),
            name: Some(name.to_string()),
            parent_persistent_id: None,
            tags: vec![],
            components: HashMap::new(),
        }
    }

    #[test]
    fn test_scene_state_creation() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        assert_eq!(state.entity_count(), 0);
    }

    #[test]
    fn test_generate_entity_id() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        let id1 = state.generate_entity_id();
        let id2 = state.generate_entity_id();

        assert_ne!(id1, id2);
        assert!(id2.as_u64() > id1.as_u64());
    }

    #[test]
    fn test_add_entity() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        let entity = create_test_entity(1, "Test Entity");
        let entity_id = state.add_entity(entity);

        // EntityId is based on persistentId hash
        let expected_id = EntityId::from_persistent_id("entity-1");
        assert_eq!(entity_id, expected_id);
        assert_eq!(state.entity_count(), 1);
        assert!(state.has_entity(entity_id));
    }

    #[test]
    fn test_remove_entity() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        let entity = create_test_entity(1, "Test Entity");
        let entity_id = state.add_entity(entity);

        assert_eq!(state.entity_count(), 1);

        let removed = state.remove_entity(entity_id);
        assert!(removed.is_some());
        assert_eq!(state.entity_count(), 0);
        assert!(!state.has_entity(entity_id));
    }

    #[test]
    fn test_remove_nonexistent_entity() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        let removed = state.remove_entity(EntityId::new(999));
        assert!(removed.is_none());
    }

    #[test]
    fn test_find_entity_mut() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        let entity = create_test_entity(1, "Test Entity");
        let entity_id = state.add_entity(entity);

        let found = state.find_entity_mut(entity_id, |entity| {
            entity.name = Some("Modified Name".to_string());
        });

        assert!(found);

        state.with_scene(|scene| {
            let entity = scene.entities.iter().find(|e| e.id == Some(1)).unwrap();
            assert_eq!(entity.name, Some("Modified Name".to_string()));
        });
    }

    #[test]
    fn test_entity_ids() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        state.add_entity(create_test_entity(1, "Entity 1"));
        state.add_entity(create_test_entity(2, "Entity 2"));
        state.add_entity(create_test_entity(3, "Entity 3"));

        let ids = state.entity_ids();
        assert_eq!(ids.len(), 3);

        // EntityIds are based on persistentId hash, not numeric id
        let expected_ids: Vec<EntityId> = vec![
            EntityId::from_persistent_id("entity-1"),
            EntityId::from_persistent_id("entity-2"),
            EntityId::from_persistent_id("entity-3"),
        ];

        for expected_id in expected_ids {
            assert!(ids.contains(&expected_id), "Expected to find {:?} in {:?}", expected_id, ids);
        }
    }

    #[test]
    fn test_with_scene() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        state.add_entity(create_test_entity(1, "Test Entity"));

        let count = state.with_scene(|scene| scene.entities.len());
        assert_eq!(count, 1);
    }

    #[test]
    fn test_with_scene_mut() {
        let scene = create_test_scene();
        let state = SceneState::new(scene);

        state.with_scene_mut(|scene| {
            scene.name = "Modified Scene".to_string();
        });

        let name = state.with_scene(|scene| scene.name.clone());
        assert_eq!(name, "Modified Scene");
    }
}
