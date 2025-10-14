use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// Stable entity identifier (wraps the persistentId from JSON)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EntityId(u64);

impl EntityId {
    /// Create a new EntityId from a u64
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    /// Create from a persistent ID string (hash it to u64)
    pub fn from_persistent_id(persistent_id: &str) -> Self {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        persistent_id.hash(&mut hasher);
        Self(hasher.finish())
    }

    /// Get the raw u64 value
    pub fn as_u64(&self) -> u64 {
        self.0
    }
}

/// Component kind identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ComponentKindId(String);

impl ComponentKindId {
    pub fn new(kind: impl Into<String>) -> Self {
        Self(kind.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<&str> for ComponentKindId {
    fn from(s: &str) -> Self {
        Self::new(s)
    }
}

impl From<String> for ComponentKindId {
    fn from(s: String) -> Self {
        Self::new(s)
    }
}

/// Scene metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub version: u32,
    pub timestamp: String,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

/// Entity in the scene
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    #[serde(default)]
    pub persistentId: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub parentPersistentId: Option<String>,
    pub components: HashMap<String, Value>,
}

impl Entity {
    /// Get stable entity ID
    pub fn entity_id(&self) -> Option<EntityId> {
        self.persistentId
            .as_ref()
            .map(|id| EntityId::from_persistent_id(id))
    }

    /// Get parent entity ID
    pub fn parent_id(&self) -> Option<EntityId> {
        self.parentPersistentId
            .as_ref()
            .map(|id| EntityId::from_persistent_id(id))
    }

    /// Get a component by type name
    pub fn get_component<T: for<'de> Deserialize<'de>>(&self, component_type: &str) -> Option<T> {
        self.components
            .get(component_type)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
    }

    /// Check if entity has a component
    pub fn has_component(&self, component_type: &str) -> bool {
        self.components.contains_key(component_type)
    }

    /// Get raw component value
    pub fn get_component_raw(&self, component_type: &str) -> Option<&Value> {
        self.components.get(component_type)
    }
}

/// Complete scene data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub metadata: Metadata,
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub materials: Option<Value>,
    #[serde(default)]
    pub prefabs: Option<Value>,
    #[serde(default)]
    pub inputAssets: Option<Value>,
    #[serde(default)]
    pub lockedEntityIds: Option<Vec<u32>>,
}

impl Scene {
    /// Find entity by ID
    pub fn find_entity(&self, id: EntityId) -> Option<&Entity> {
        self.entities.iter().find(|e| e.entity_id() == Some(id))
    }

    /// Find entity by persistent ID string
    pub fn find_entity_by_persistent_id(&self, persistent_id: &str) -> Option<&Entity> {
        self.entities
            .iter()
            .find(|e| e.persistentId.as_deref() == Some(persistent_id))
    }

    /// Get all entities with a specific component
    pub fn entities_with_component(&self, component_type: &str) -> Vec<&Entity> {
        self.entities
            .iter()
            .filter(|e| e.has_component(component_type))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entity_id_from_persistent_id() {
        let id1 = EntityId::from_persistent_id("entity-123");
        let id2 = EntityId::from_persistent_id("entity-123");
        let id3 = EntityId::from_persistent_id("entity-456");

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_entity_id_roundtrip() {
        let id = EntityId::new(12345);
        assert_eq!(id.as_u64(), 12345);
    }

    #[test]
    fn test_component_kind_id() {
        let kind1 = ComponentKindId::from("Transform");
        let kind2 = ComponentKindId::from("Transform");
        let kind3 = ComponentKindId::from("Camera");

        assert_eq!(kind1, kind2);
        assert_ne!(kind1, kind3);
        assert_eq!(kind1.as_str(), "Transform");
    }

    #[test]
    fn test_entity_ids() {
        let entity = Entity {
            persistentId: Some("entity-1".to_string()),
            name: Some("Test".to_string()),
            parentPersistentId: Some("parent-1".to_string()),
            components: HashMap::new(),
        };

        assert!(entity.entity_id().is_some());
        assert!(entity.parent_id().is_some());
    }

    #[test]
    fn test_entity_component_access() {
        let mut components = HashMap::new();
        components.insert(
            "Transform".to_string(),
            serde_json::json!({
                "position": [1.0, 2.0, 3.0]
            }),
        );

        let entity = Entity {
            persistentId: Some("entity-1".to_string()),
            name: Some("Test".to_string()),
            parentPersistentId: None,
            components,
        };

        assert!(entity.has_component("Transform"));
        assert!(!entity.has_component("Camera"));
        assert!(entity.get_component_raw("Transform").is_some());
    }

    #[test]
    fn test_scene_entity_lookup() {
        let entity1 = Entity {
            persistentId: Some("entity-1".to_string()),
            name: Some("Entity1".to_string()),
            parentPersistentId: None,
            components: HashMap::new(),
        };

        let entity2 = Entity {
            persistentId: Some("entity-2".to_string()),
            name: Some("Entity2".to_string()),
            parentPersistentId: None,
            components: HashMap::new(),
        };

        let scene = Scene {
            metadata: Metadata {
                name: "Test Scene".to_string(),
                version: 1,
                timestamp: "2025-01-01T00:00:00Z".to_string(),
                author: None,
                description: None,
            },
            entities: vec![entity1.clone(), entity2.clone()],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        assert!(scene.find_entity_by_persistent_id("entity-1").is_some());
        assert!(scene.find_entity_by_persistent_id("entity-2").is_some());
        assert!(scene.find_entity_by_persistent_id("entity-3").is_none());

        let id1 = EntityId::from_persistent_id("entity-1");
        assert!(scene.find_entity(id1).is_some());
    }

    #[test]
    fn test_scene_query_by_component() {
        let mut components = HashMap::new();
        components.insert("Transform".to_string(), serde_json::json!({}));

        let entity1 = Entity {
            persistentId: Some("entity-1".to_string()),
            name: Some("HasTransform".to_string()),
            parentPersistentId: None,
            components: components.clone(),
        };

        let entity2 = Entity {
            persistentId: Some("entity-2".to_string()),
            name: Some("NoTransform".to_string()),
            parentPersistentId: None,
            components: HashMap::new(),
        };

        let scene = Scene {
            metadata: Metadata {
                name: "Test Scene".to_string(),
                version: 1,
                timestamp: "2025-01-01T00:00:00Z".to_string(),
                author: None,
                description: None,
            },
            entities: vec![entity1, entity2],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        let with_transform = scene.entities_with_component("Transform");
        assert_eq!(with_transform.len(), 1);
        assert_eq!(with_transform[0].name.as_deref(), Some("HasTransform"));
    }
}
