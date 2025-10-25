use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

// Export new modules for mutable ECS
pub mod entity_commands;
pub mod scene_state;

// Re-export key types
pub use entity_commands::{EntityCommand, EntityCommandBuffer};
pub use scene_state::SceneState;

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

impl std::fmt::Display for EntityId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
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
    #[serde(default = "default_scene_name")]
    pub name: String,
    #[serde(default)]
    pub version: u32,
    #[serde(default = "default_timestamp")]
    pub timestamp: String,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

fn default_scene_name() -> String {
    "Untitled Scene".to_string()
}

fn default_timestamp() -> String {
    "2025-01-01T00:00:00Z".to_string()
}

impl Default for Metadata {
    fn default() -> Self {
        Self {
            name: default_scene_name(),
            version: 0,
            timestamp: default_timestamp(),
            author: None,
            description: None,
        }
    }
}

/// Entity in the scene
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    /// Numeric entity ID from the editor (not used for stable references)
    #[serde(default)]
    pub id: Option<u32>,
    /// Direct persistentId field (optional, for compatibility)
    #[serde(default)]
    pub persistentId: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub parentPersistentId: Option<String>,
    /// Tags for categorization and querying
    #[serde(default)]
    pub tags: Vec<String>,
    pub components: HashMap<String, Value>,
}

impl Entity {
    /// Get stable entity ID - tries multiple sources
    pub fn entity_id(&self) -> Option<EntityId> {
        // First try direct persistentId field
        if let Some(ref id) = self.persistentId {
            return Some(EntityId::from_persistent_id(id));
        }

        // Then check PersistentId component
        if let Some(component) = self.components.get("PersistentId") {
            if let Some(obj) = component.as_object() {
                if let Some(id_value) = obj.get("id") {
                    if let Some(id_str) = id_value.as_str() {
                        return Some(EntityId::from_persistent_id(id_str));
                    }
                }
            }
        }

        // Fallback to numeric id if available (for old scenes)
        self.id.map(|numeric_id| EntityId::new(numeric_id as u64))
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
#[allow(non_snake_case)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    #[serde(default)]
    pub version: u32,
    #[serde(default = "default_scene_name")]
    pub name: String,
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub materials: Vec<Value>,
    #[serde(default)]
    pub meshes: Option<Value>,
    #[serde(default)]
    pub metadata: Option<Value>,
    #[serde(default)]
    pub inputAssets: Option<Value>,
    #[serde(default)]
    pub lockedEntityIds: Option<Vec<u32>>,
}

impl Scene {
    /// Normalize scene by extracting version/name from metadata if not at root level
    pub fn normalize(&mut self) {
        // If version/name are missing at root but present in metadata, extract them
        if self.version == 0 || self.name.is_empty() || self.name == default_scene_name() {
            if let Some(metadata_value) = &self.metadata {
                if let Ok(metadata) = serde_json::from_value::<Metadata>(metadata_value.clone()) {
                    if self.version == 0 && metadata.version != 0 {
                        self.version = metadata.version;
                    }
                    if (self.name.is_empty() || self.name == default_scene_name()) && !metadata.name.is_empty() {
                        self.name = metadata.name;
                    }
                }
            }
        }
    }

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
            id: None,
            persistentId: Some("entity-1".to_string()),
            name: Some("Test".to_string()),
            parentPersistentId: Some("parent-1".to_string()),
            tags: vec![],
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
            id: None,
            persistentId: Some("entity-1".to_string()),
            name: Some("Test".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components,
        };

        assert!(entity.has_component("Transform"));
        assert!(!entity.has_component("Camera"));
        assert!(entity.get_component_raw("Transform").is_some());
    }

    #[test]
    fn test_scene_entity_lookup() {
        let entity1 = Entity {
            id: None,
            persistentId: Some("entity-1".to_string()),
            name: Some("Entity1".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: HashMap::new(),
        };

        let entity2 = Entity {
            id: None,
            persistentId: Some("entity-2".to_string()),
            name: Some("Entity2".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: HashMap::new(),
        };

        let scene = Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![entity1.clone(), entity2.clone()],
            materials: vec![],
            meshes: None,
            metadata: None,
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
            id: None,
            persistentId: Some("entity-1".to_string()),
            name: Some("HasTransform".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: components.clone(),
        };

        let entity2 = Entity {
            id: None,
            persistentId: Some("entity-2".to_string()),
            name: Some("NoTransform".to_string()),
            parentPersistentId: None,
            tags: vec![],
            components: HashMap::new(),
        };

        let scene = Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![entity1, entity2],
            materials: vec![],
            meshes: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        };

        let with_transform = scene.entities_with_component("Transform");
        assert_eq!(with_transform.len(), 1);
        assert_eq!(with_transform[0].name.as_deref(), Some("HasTransform"));
    }
}
