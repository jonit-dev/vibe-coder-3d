use crate::decoders::PrefabDefinition;
use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;

/// Registry for storing prefab templates
pub struct PrefabRegistry {
    prefabs: HashMap<String, PrefabDefinition>,
}

impl PrefabRegistry {
    pub fn new() -> Self {
        Self {
            prefabs: HashMap::new(),
        }
    }

    /// Register a prefab definition
    pub fn register(&mut self, prefab: PrefabDefinition) {
        self.prefabs.insert(prefab.id.clone(), prefab);
    }

    /// Get a prefab by ID
    pub fn get(&self, prefab_id: &str) -> Option<&PrefabDefinition> {
        self.prefabs.get(prefab_id)
    }

    /// Check if a prefab exists
    pub fn has(&self, prefab_id: &str) -> bool {
        self.prefabs.contains_key(prefab_id)
    }

    /// List all prefabs
    pub fn list(&self) -> Vec<&PrefabDefinition> {
        self.prefabs.values().collect()
    }

    /// Get count of registered prefabs
    pub fn count(&self) -> usize {
        self.prefabs.len()
    }
}

impl Default for PrefabRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse prefabs from scene JSON
pub fn parse_prefabs(prefabs_value: &Value) -> Result<Vec<PrefabDefinition>> {
    if let Some(prefabs_array) = prefabs_value.as_array() {
        let mut definitions = Vec::new();
        for (idx, prefab_value) in prefabs_array.iter().enumerate() {
            match serde_json::from_value::<PrefabDefinition>(prefab_value.clone()) {
                Ok(prefab) => definitions.push(prefab),
                Err(e) => {
                    log::warn!("Failed to parse prefab at index {}: {}", idx, e);
                    // Continue loading other prefabs
                }
            }
        }
        Ok(definitions)
    } else {
        Ok(Vec::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_prefab_registry_new() {
        let registry = PrefabRegistry::new();
        assert_eq!(registry.count(), 0);
    }

    #[test]
    fn test_prefab_registry_register() {
        let mut registry = PrefabRegistry::new();

        let prefab = PrefabDefinition {
            id: "test-prefab".to_string(),
            name: "Test Prefab".to_string(),
            version: 1,
            root: crate::decoders::PrefabEntity {
                name: "Root".to_string(),
                components: HashMap::new(),
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        registry.register(prefab);
        assert_eq!(registry.count(), 1);
        assert!(registry.has("test-prefab"));
    }

    #[test]
    fn test_prefab_registry_get() {
        let mut registry = PrefabRegistry::new();

        let prefab = PrefabDefinition {
            id: "test-prefab".to_string(),
            name: "Test Prefab".to_string(),
            version: 1,
            root: crate::decoders::PrefabEntity {
                name: "Root".to_string(),
                components: HashMap::new(),
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        registry.register(prefab);

        let retrieved = registry.get("test-prefab");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test Prefab");

        assert!(registry.get("nonexistent").is_none());
    }

    #[test]
    fn test_parse_prefabs_valid() {
        let json = json!([
            {
                "id": "simple-cube",
                "name": "Simple Cube",
                "version": 1,
                "root": {
                    "name": "Cube",
                    "components": {
                        "Transform": { "position": [0, 0, 0] }
                    },
                    "children": []
                }
            }
        ]);

        let prefabs = parse_prefabs(&json).unwrap();
        assert_eq!(prefabs.len(), 1);
        assert_eq!(prefabs[0].id, "simple-cube");
        assert_eq!(prefabs[0].name, "Simple Cube");
        assert_eq!(prefabs[0].root.name, "Cube");
    }

    #[test]
    fn test_parse_prefabs_empty() {
        let json = json!([]);
        let prefabs = parse_prefabs(&json).unwrap();
        assert_eq!(prefabs.len(), 0);
    }

    #[test]
    fn test_parse_prefabs_invalid_skipped() {
        let json = json!([
            {
                "id": "valid-prefab",
                "name": "Valid",
                "version": 1,
                "root": {
                    "name": "Root",
                    "components": {},
                    "children": []
                }
            },
            {
                "invalid": "missing required fields"
            },
            {
                "id": "another-valid",
                "name": "Another Valid",
                "version": 1,
                "root": {
                    "name": "Root2",
                    "components": {},
                    "children": []
                }
            }
        ]);

        let prefabs = parse_prefabs(&json).unwrap();
        assert_eq!(prefabs.len(), 2); // Invalid one should be skipped
        assert_eq!(prefabs[0].id, "valid-prefab");
        assert_eq!(prefabs[1].id, "another-valid");
    }
}
