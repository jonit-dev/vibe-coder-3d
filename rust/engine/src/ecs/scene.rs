use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct SceneData {
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

#[derive(Debug, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub version: u32,
    pub timestamp: String,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
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
}
