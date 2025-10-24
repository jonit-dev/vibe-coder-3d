use crate::diff::{DiffBatch, SceneDiff};
use anyhow::{Context, Result};
use std::collections::HashMap;
use vibe_ecs_bridge::ComponentRegistry;
use vibe_scene::{Entity, EntityId, Scene};
use vibe_scene_graph::SceneGraph;

/// Live bridge for applying scene diffs
pub struct LiveBridge {
    /// Current scene state
    scene: Scene,
    /// Scene graph (rebuilt after diffs)
    scene_graph: Option<SceneGraph>,
    /// Component registry for decoding
    registry: ComponentRegistry,
    /// Last applied sequence number
    last_sequence: u64,
}

impl LiveBridge {
    /// Create a new live bridge with empty scene
    pub fn new(registry: ComponentRegistry) -> Self {
        Self {
            scene: Scene {
                version: 1,
                name: String::new(),
                entities: Vec::new(),
                materials: Vec::new(),
                meshes: None,
                metadata: None,
                inputAssets: None,
                lockedEntityIds: None,
            },
            scene_graph: None,
            registry,
            last_sequence: 0,
        }
    }

    /// Load a complete scene from JSON
    pub fn load_scene(&mut self, json: &str) -> Result<()> {
        log::info!("Loading scene from JSON");

        let scene: Scene = serde_json::from_str(json).context("Failed to parse scene JSON")?;

        log::info!("Loaded scene with {} entities", scene.entities.len());

        self.scene = scene;
        self.rebuild_scene_graph()?;
        self.last_sequence = 0;

        Ok(())
    }

    /// Apply a batch of diffs to the scene
    pub fn apply_diff(&mut self, diff_json: &str) -> Result<()> {
        let batch: DiffBatch =
            serde_json::from_str(diff_json).context("Failed to parse diff batch JSON")?;

        // Check sequence ordering (optional: could allow skipping)
        if batch.sequence <= self.last_sequence {
            log::warn!(
                "Skipping stale diff batch: sequence {} <= last {}",
                batch.sequence,
                self.last_sequence
            );
            return Ok(());
        }

        log::debug!(
            "Applying diff batch {} with {} diffs",
            batch.sequence,
            batch.diffs.len()
        );

        for diff in &batch.diffs {
            self.apply_single_diff(diff)?;
        }

        // Rebuild scene graph after all diffs applied
        self.rebuild_scene_graph()?;
        self.last_sequence = batch.sequence;

        Ok(())
    }

    /// Apply a single diff operation
    fn apply_single_diff(&mut self, diff: &SceneDiff) -> Result<()> {
        match diff {
            SceneDiff::AddEntity {
                persistent_id,
                id,
                name,
                parent_persistent_id,
                components,
            } => {
                log::debug!("Adding entity: {}", persistent_id);

                let mut entity = Entity {
                    id: *id,
                    persistentId: Some(persistent_id.clone()),
                    name: name.clone(),
                    parentPersistentId: parent_persistent_id.clone(),
                    tags: vec![],
                    components: HashMap::new(),
                };

                // Add components
                for component in components {
                    entity
                        .components
                        .insert(component.component_type.clone(), component.data.clone());
                }

                self.scene.entities.push(entity);
            }

            SceneDiff::RemoveEntity { persistent_id } => {
                log::debug!("Removing entity: {}", persistent_id);

                let entity_id = EntityId::from_persistent_id(persistent_id);
                self.scene
                    .entities
                    .retain(|e| e.entity_id() != Some(entity_id));
            }

            SceneDiff::UpdateEntity {
                persistent_id,
                name,
                parent_persistent_id,
            } => {
                log::debug!("Updating entity: {}", persistent_id);

                let entity_id = EntityId::from_persistent_id(persistent_id);
                if let Some(entity) = self
                    .scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(entity_id))
                {
                    if let Some(new_name) = name {
                        entity.name = Some(new_name.clone());
                    }
                    if parent_persistent_id.is_some() {
                        entity.parentPersistentId = parent_persistent_id.clone();
                    }
                } else {
                    log::warn!("Entity not found for update: {}", persistent_id);
                }
            }

            SceneDiff::SetComponent {
                entity_persistent_id,
                component,
            } => {
                log::debug!(
                    "Setting component {} on entity {}",
                    component.component_type,
                    entity_persistent_id
                );

                let entity_id = EntityId::from_persistent_id(entity_persistent_id);
                if let Some(entity) = self
                    .scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(entity_id))
                {
                    entity
                        .components
                        .insert(component.component_type.clone(), component.data.clone());
                } else {
                    log::warn!(
                        "Entity not found for component set: {}",
                        entity_persistent_id
                    );
                }
            }

            SceneDiff::RemoveComponent {
                entity_persistent_id,
                component_type,
            } => {
                log::debug!(
                    "Removing component {} from entity {}",
                    component_type,
                    entity_persistent_id
                );

                let entity_id = EntityId::from_persistent_id(entity_persistent_id);
                if let Some(entity) = self
                    .scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(entity_id))
                {
                    entity.components.remove(component_type);
                } else {
                    log::warn!(
                        "Entity not found for component removal: {}",
                        entity_persistent_id
                    );
                }
            }
        }

        Ok(())
    }

    /// Rebuild scene graph from current scene state
    fn rebuild_scene_graph(&mut self) -> Result<()> {
        log::debug!("Rebuilding scene graph");

        let graph = SceneGraph::build(&self.scene).context("Failed to rebuild scene graph")?;

        log::debug!(
            "Scene graph rebuilt with {} entities",
            graph.entity_ids().len()
        );

        self.scene_graph = Some(graph);
        Ok(())
    }

    /// Get reference to current scene
    pub fn scene(&self) -> &Scene {
        &self.scene
    }

    /// Get reference to scene graph (if built)
    pub fn scene_graph(&self) -> Option<&SceneGraph> {
        self.scene_graph.as_ref()
    }

    /// Get mutable reference to scene graph (if built)
    pub fn scene_graph_mut(&mut self) -> Option<&mut SceneGraph> {
        self.scene_graph.as_mut()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_ecs_bridge::create_default_registry;

    #[test]
    fn test_load_empty_scene() {
        let registry = create_default_registry();
        let mut bridge = LiveBridge::new(registry);

        let json = r#"{"entities": [], "metadata": {}}"#;
        bridge.load_scene(json).unwrap();

        assert_eq!(bridge.scene().entities.len(), 0);
    }

    #[test]
    fn test_add_entity_diff() {
        let registry = create_default_registry();
        let mut bridge = LiveBridge::new(registry);

        // Start with empty scene
        bridge
            .load_scene(r#"{"entities": [], "metadata": {}}"#)
            .unwrap();

        // Add entity via diff
        let diff_json = r#"{
            "sequence": 1,
            "diffs": [{
                "type": "AddEntity",
                "persistent_id": "test-entity",
                "id": 1,
                "name": "Test Entity",
                "parent_persistent_id": null,
                "components": []
            }]
        }"#;

        bridge.apply_diff(diff_json).unwrap();

        assert_eq!(bridge.scene().entities.len(), 1);
        assert_eq!(
            bridge.scene().entities[0].name,
            Some("Test Entity".to_string())
        );
    }

    #[test]
    fn test_remove_entity_diff() {
        let registry = create_default_registry();
        let mut bridge = LiveBridge::new(registry);

        // Start with scene containing one entity
        let json = r#"{
            "entities": [{
                "persistentId": "entity-to-remove",
                "id": 1,
                "name": "Doomed Entity",
                "components": {}
            }],
            "metadata": {}
        }"#;
        bridge.load_scene(json).unwrap();
        assert_eq!(bridge.scene().entities.len(), 1);

        // Remove entity via diff
        let diff_json = r#"{
            "sequence": 1,
            "diffs": [{
                "type": "RemoveEntity",
                "persistent_id": "entity-to-remove"
            }]
        }"#;

        bridge.apply_diff(diff_json).unwrap();

        assert_eq!(bridge.scene().entities.len(), 0);
    }

    #[test]
    fn test_set_component_diff() {
        let registry = create_default_registry();
        let mut bridge = LiveBridge::new(registry);

        // Start with entity
        let json = r#"{
            "entities": [{
                "persistentId": "test-entity",
                "id": 1,
                "components": {}
            }],
            "metadata": {}
        }"#;
        bridge.load_scene(json).unwrap();

        // Add component via diff
        let diff_json = r#"{
            "sequence": 1,
            "diffs": [{
                "type": "SetComponent",
                "entity_persistent_id": "test-entity",
                "component": {
                    "type": "Transform",
                    "data": {
                        "position": [1.0, 2.0, 3.0]
                    }
                }
            }]
        }"#;

        bridge.apply_diff(diff_json).unwrap();

        let entity = &bridge.scene().entities[0];
        assert!(entity.components.contains_key("Transform"));
    }

    #[test]
    fn test_stale_sequence_rejected() {
        let registry = create_default_registry();
        let mut bridge = LiveBridge::new(registry);

        bridge
            .load_scene(r#"{"entities": [], "metadata": {}}"#)
            .unwrap();

        // Apply sequence 5
        let diff_json = r#"{
            "sequence": 5,
            "diffs": []
        }"#;
        bridge.apply_diff(diff_json).unwrap();
        assert_eq!(bridge.last_sequence, 5);

        // Try to apply sequence 3 (should be skipped)
        let stale_diff = r#"{
            "sequence": 3,
            "diffs": [{
                "type": "AddEntity",
                "persistent_id": "stale-entity",
                "id": 99,
                "name": "Should Not Appear",
                "parent_persistent_id": null,
                "components": []
            }]
        }"#;

        bridge.apply_diff(stale_diff).unwrap();

        // Entity should not have been added
        assert_eq!(bridge.scene().entities.len(), 0);
        assert_eq!(bridge.last_sequence, 5);
    }
}
