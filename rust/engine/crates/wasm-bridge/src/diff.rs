use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Represents a change to the scene that can be applied incrementally
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SceneDiff {
    /// Add a new entity to the scene
    AddEntity {
        /// Persistent ID of the entity (will be hashed to EntityId)
        persistent_id: String,
        /// Optional numeric ID from editor
        id: Option<u32>,
        /// Entity name
        name: Option<String>,
        /// Parent entity's persistent ID
        parent_persistent_id: Option<String>,
        /// Initial components
        components: Vec<ComponentDiff>,
    },

    /// Remove an entity from the scene
    RemoveEntity {
        /// Persistent ID of the entity to remove
        persistent_id: String,
    },

    /// Update entity metadata (name, parent)
    UpdateEntity {
        /// Persistent ID of the entity to update
        persistent_id: String,
        /// New name (if changed)
        name: Option<String>,
        /// New parent persistent ID (if changed)
        parent_persistent_id: Option<String>,
    },

    /// Add or update a component on an entity
    SetComponent {
        /// Entity persistent ID
        entity_persistent_id: String,
        /// Component to add/update
        component: ComponentDiff,
    },

    /// Remove a component from an entity
    RemoveComponent {
        /// Entity persistent ID
        entity_persistent_id: String,
        /// Component type to remove
        component_type: String,
    },
}

/// Represents a component change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentDiff {
    /// Component type name (e.g., "Transform", "MeshRenderer")
    #[serde(rename = "type")]
    pub component_type: String,
    /// Component data as JSON value
    pub data: Value,
}

/// A batch of diffs with versioning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffBatch {
    /// Sequence number for ordering
    pub sequence: u64,
    /// List of diffs to apply
    pub diffs: Vec<SceneDiff>,
}

impl DiffBatch {
    /// Create a new diff batch with sequence number
    pub fn new(sequence: u64, diffs: Vec<SceneDiff>) -> Self {
        Self { sequence, diffs }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize_add_entity_diff() {
        let diff = SceneDiff::AddEntity {
            persistent_id: "test-entity".to_string(),
            id: Some(1),
            name: Some("Test Entity".to_string()),
            parent_persistent_id: None,
            components: vec![],
        };

        let json = serde_json::to_string(&diff).unwrap();
        assert!(json.contains("AddEntity"));
        assert!(json.contains("test-entity"));
    }

    #[test]
    fn test_serialize_set_component_diff() {
        let diff = SceneDiff::SetComponent {
            entity_persistent_id: "entity-1".to_string(),
            component: ComponentDiff {
                component_type: "Transform".to_string(),
                data: serde_json::json!({
                    "position": [1.0, 2.0, 3.0]
                }),
            },
        };

        let json = serde_json::to_string(&diff).unwrap();
        assert!(json.contains("SetComponent"));
        assert!(json.contains("Transform"));
    }

    #[test]
    fn test_deserialize_diff_batch() {
        let json = r#"{
            "sequence": 42,
            "diffs": [
                {
                    "type": "RemoveEntity",
                    "persistent_id": "old-entity"
                }
            ]
        }"#;

        let batch: DiffBatch = serde_json::from_str(json).unwrap();
        assert_eq!(batch.sequence, 42);
        assert_eq!(batch.diffs.len(), 1);
    }
}
