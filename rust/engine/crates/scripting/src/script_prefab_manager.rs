//! Prefab Manager for Script API
//!
//! Provides runtime prefab instantiation capabilities for Lua scripts.
//! Loads prefabs from scene files and manages spawned instances.

use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::{parse_prefabs, PrefabDefinition, PrefabRegistry};
use vibe_scene::{Entity, EntityId};

/// Prefab manager for script API
///
/// Implements PrefabManagerProvider to allow Lua scripts to instantiate prefabs
/// from scene files at runtime.
pub struct ScriptPrefabManager {
    /// Registry of loaded prefabs
    registry: Arc<Mutex<PrefabRegistry>>,
    /// Map of entity ID to prefab path for tracking instances
    instances: Arc<Mutex<HashMap<u64, String>>>,
    /// Base path for resolving relative prefab paths
    base_path: PathBuf,
    /// Next entity ID to assign (simplified - in real implementation this would come from ECS)
    next_entity_id: Arc<Mutex<u64>>,
}

impl ScriptPrefabManager {
    /// Create a new script prefab manager
    pub fn new(base_path: PathBuf) -> Self {
        Self {
            registry: Arc::new(Mutex::new(PrefabRegistry::new())),
            instances: Arc::new(Mutex::new(HashMap::new())),
            base_path,
            next_entity_id: Arc::new(Mutex::new(10000)), // Start from high ID range
        }
    }

    /// Load prefabs from a scene file
    pub fn load_prefabs_from_scene(&self, scene_path: &Path) -> Result<()> {
        log::info!("Loading prefabs from scene: {}", scene_path.display());

        // Read scene file
        let scene_content = std::fs::read_to_string(scene_path)
            .with_context(|| format!("Failed to read scene file: {}", scene_path.display()))?;

        // Parse JSON
        let scene_json: serde_json::Value = serde_json::from_str(&scene_content)
            .with_context(|| format!("Failed to parse scene JSON: {}", scene_path.display()))?;

        // Extract prefabs from scene
        if let Some(prefabs_value) = scene_json.get("prefabs") {
            let prefab_definitions = parse_prefabs(prefabs_value)
                .with_context(|| "Failed to parse prefabs from scene")?;

            let mut registry = self.registry.lock().unwrap();
            for prefab in prefab_definitions {
                log::info!("Registering prefab: {}", prefab.id);
                registry.register(prefab);
            }

            log::info!("Loaded {} prefabs from scene", registry.count());
        } else {
            log::info!("No prefabs found in scene: {}", scene_path.display());
        }

        Ok(())
    }

    /// Load prefabs from a specific prefab path relative to base path
    pub fn load_prefabs_from_path(&self, prefab_path: &str) -> Result<()> {
        // Try to resolve as relative path first
        let full_path = self.base_path.join(prefab_path);

        if full_path.exists() {
            self.load_prefabs_from_scene(&full_path)
        } else {
            // Try as absolute path
            let abs_path = PathBuf::from(prefab_path);
            if abs_path.exists() {
                self.load_prefabs_from_scene(&abs_path)
            } else {
                Err(anyhow::anyhow!("Prefab file not found: {}", prefab_path))
            }
        }
    }

    /// Generate a unique entity ID
    fn generate_entity_id(&self) -> u64 {
        let mut next_id = self.next_entity_id.lock().unwrap();
        let id = *next_id;
        *next_id += 1;
        id
    }

    /// Convert a PrefabDefinition to a scene Entity
    fn prefab_entity_to_scene_entity(&self, prefab_entity: &vibe_ecs_bridge::PrefabEntity, entity_id: u64) -> Entity {
        let entity = Entity {
            id: Some(entity_id.try_into().unwrap()),
            persistent_id: None,
            name: Some(prefab_entity.name.clone()),
            parent_persistent_id: None,
            tags: prefab_entity.tags.clone(),
            components: prefab_entity.components.clone(),
        };

        // Recursively add children
        for child in &prefab_entity.children {
            let child_id = self.generate_entity_id();
            let mut child_entity = self.prefab_entity_to_scene_entity(child, child_id);
            // Set parent relationship
            child_entity.parent_persistent_id = Some(format!("entity-{}", entity_id));
            // In a real implementation, we'd need to add children to scene
        }

        entity
    }

    /// Register an instantiated prefab instance
    fn register_instance(&self, entity_id: EntityId, prefab_path: &str) {
        let mut instances = self.instances.lock().unwrap();
        instances.insert(entity_id.as_u64(), prefab_path.to_string());
        log::debug!("Registered prefab instance: {} from prefab '{}'", entity_id.as_u64(), prefab_path);
    }

    /// Unregister a prefab instance
    fn unregister_instance(&self, entity_id: EntityId) -> Option<String> {
        let mut instances = self.instances.lock().unwrap();
        let prefab_path = instances.remove(&entity_id.as_u64());
        log::debug!("Unregistered prefab instance: {} (was from prefab: {:?})", entity_id.as_u64(), prefab_path);
        prefab_path
    }

    /// Load prefabs from scene data (for script system integration)
    pub fn load_prefabs_from_scene_data(&self, prefabs_value: &serde_json::Value) -> Result<(), String> {
        load_prefabs_from_scene_value(self, prefabs_value).map_err(|e| e.to_string())
    }
}

impl crate::apis::prefab_api::PrefabManagerProvider for ScriptPrefabManager {
    fn instantiate_prefab(&self, prefab_path: &str, position: Option<[f32; 3]>) -> Result<EntityId, String> {
        log::info!("Instantiating prefab '{}' at position: {:?}", prefab_path, position);

        // Try to load prefabs from the path if not already loaded
        if let Err(e) = self.load_prefabs_from_path(prefab_path) {
            log::warn!("Failed to load prefabs from '{}': {}", prefab_path, e);
        }

        // Get prefab from registry
        let registry = self.registry.lock().unwrap();

        // Extract prefab ID from path (use filename without extension)
        let prefab_id = Path::new(prefab_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(prefab_path);

        if let Some(prefab) = registry.get(prefab_id) {
            // Generate entity ID for root instance
            let entity_id = self.generate_entity_id();
            let entity_id_obj = EntityId::new(entity_id);

            // Convert prefab to scene entity
            let mut scene_entity = self.prefab_entity_to_scene_entity(&prefab.root, entity_id);

            // Apply position override if provided
            if let Some(pos) = position {
                if let Some(transform_value) = scene_entity.components.get_mut("Transform") {
                    if let Some(transform_obj) = transform_value.as_object_mut() {
                        transform_obj.insert("position".to_string(), serde_json::Value::Array(
                            pos.iter().map(|&v| serde_json::Value::Number(serde_json::Number::from_f64(v as f64).unwrap())).collect()
                        ));
                    }
                } else {
                    // Add Transform component if it doesn't exist
                    scene_entity.components.insert("Transform".to_string(), serde_json::json!({
                        "position": pos,
                        "rotation": [0.0, 0.0, 0.0],
                        "scale": [1.0, 1.0, 1.0]
                    }));
                }
            }

            // Register the instance
            self.register_instance(entity_id_obj, prefab_path);

            log::info!("Successfully instantiated prefab '{}' as entity {}", prefab_id, entity_id);
            Ok(entity_id_obj)
        } else {
            let error = format!("Prefab '{}' not found in registry", prefab_id);
            log::error!("{}", error);
            Err(error)
        }
    }

    fn destroy_prefab_instance(&self, entity_id: EntityId) -> Result<(), String> {
        log::info!("Destroying prefab instance {}", entity_id.as_u64());

        // Check if this is a prefab instance
        if let Some(prefab_path) = self.unregister_instance(entity_id) {
            log::info!("Destroyed prefab instance {} from prefab '{}'", entity_id.as_u64(), prefab_path);
            Ok(())
        } else {
            let error = format!("Entity {} is not a prefab instance", entity_id.as_u64());
            log::warn!("{}", error);
            Err(error)
        }
    }

    fn get_prefab_instances(&self, prefab_path: &str) -> Vec<EntityId> {
        let instances = self.instances.lock().unwrap();
        let matching_instances: Vec<EntityId> = instances
            .iter()
            .filter(|(_, path)| *path == prefab_path)
            .map(|(&id, _)| EntityId::new(id))
            .collect();

        log::debug!("Found {} instances of prefab '{}'", matching_instances.len(), prefab_path);
        matching_instances
    }

    fn is_prefab_instance(&self, entity_id: EntityId) -> bool {
        let instances = self.instances.lock().unwrap();
        let is_instance = instances.contains_key(&entity_id.as_u64());
        log::debug!("Entity {} is prefab instance: {}", entity_id.as_u64(), is_instance);
        is_instance
    }

    fn get_prefab_path(&self, entity_id: EntityId) -> Option<String> {
        let instances = self.instances.lock().unwrap();
        let prefab_path = instances.get(&entity_id.as_u64()).cloned();
        log::debug!("Entity {} prefab path: {:?}", entity_id.as_u64(), prefab_path);
        prefab_path
    }

    fn load_prefabs_from_scene(&self, prefabs_value: &serde_json::Value) -> Result<(), String> {
        self.load_prefabs_from_scene_data(prefabs_value)
    }
}

/// Create a script prefab manager with default configuration
pub fn create_script_prefab_manager() -> Arc<dyn crate::apis::prefab_api::PrefabManagerProvider + Send + Sync> {
    let base_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let manager = ScriptPrefabManager::new(base_path.clone());

    // Note: Prefabs will be loaded from the current scene at runtime
    // The script system will need to provide scene prefabs to the manager
    log::info!("Script prefab manager created - will load prefabs from scene at runtime");

    Arc::new(manager)
}

/// Load prefabs from a scene's prefab array
pub fn load_prefabs_from_scene_value(
    manager: &ScriptPrefabManager,
    prefabs_value: &serde_json::Value,
) -> Result<()> {
    if let Some(prefabs_array) = prefabs_value.as_array() {
        let prefab_definitions = parse_prefabs(prefabs_value)?;
        let mut registry = manager.registry.lock().unwrap();

        for prefab in prefab_definitions {
            log::info!("Registering prefab from scene: {}", prefab.id);
            registry.register(prefab);
        }

        log::info!("Loaded {} prefabs from scene", registry.count());
    } else {
        log::info!("No prefabs found in scene");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_scene_with_prefabs(temp_dir: &TempDir) -> PathBuf {
        let scene_path = temp_dir.path().join("test_scene.json");
        let scene_data = json!({
            "version": 0,
            "name": "Test Scene",
            "entities": [],
            "materials": [],
            "prefabs": [
                {
                    "id": "test_cube",
                    "root": {
                        "name": "TestCube",
                        "tags": ["test"],
                        "components": {
                            "Transform": {
                                "position": [0.0, 0.0, 0.0],
                                "rotation": [0.0, 0.0, 0.0],
                                "scale": [1.0, 1.0, 1.0]
                            },
                            "MeshRenderer": {
                                "meshId": "cube",
                                "materialId": "default"
                            }
                        },
                        "children": []
                    }
                }
            ]
        });

        fs::write(&scene_path, scene_data.to_string()).unwrap();
        scene_path
    }

    #[test]
    fn test_prefab_manager_creation() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Should have empty registry initially
        assert_eq!(manager.registry.lock().unwrap().len(), 0);
        assert_eq!(manager.instances.lock().unwrap().len(), 0);
    }

    #[test]
    fn test_load_prefabs_from_scene() {
        let temp_dir = TempDir::new().unwrap();
        let scene_path = create_test_scene_with_prefabs(&temp_dir);
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Load prefabs from scene
        manager.load_prefabs_from_scene(&scene_path).unwrap();

        // Should have loaded one prefab
        assert_eq!(manager.registry.lock().unwrap().len(), 1);
        assert!(manager.registry.lock().unwrap().has("test_cube"));
    }

    #[test]
    fn test_instantiate_prefab() {
        let temp_dir = TempDir::new().unwrap();
        let scene_path = create_test_scene_with_prefabs(&temp_dir);
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Load prefabs first
        manager.load_prefabs_from_scene(&scene_path).unwrap();

        // Instantiate prefab
        let entity_id = manager.instantiate_prefab("test_cube", Some([1.0, 2.0, 3.0])).unwrap();
        assert!(entity_id.as_u64() >= 10000);

        // Check that instance is registered
        assert!(manager.is_prefab_instance(entity_id));
        assert_eq!(manager.get_prefab_path(entity_id), Some("test_cube".to_string()));

        let instances = manager.get_prefab_instances("test_cube");
        assert_eq!(instances.len(), 1);
        assert_eq!(instances[0].as_u64(), entity_id.as_u64());
    }

    #[test]
    fn test_destroy_prefab_instance() {
        let temp_dir = TempDir::new().unwrap();
        let scene_path = create_test_scene_with_prefabs(&temp_dir);
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Load and instantiate prefab
        manager.load_prefabs_from_scene(&scene_path).unwrap();
        let entity_id = manager.instantiate_prefab("test_cube", None).unwrap();

        // Destroy instance
        let result = manager.destroy_prefab_instance(entity_id);
        assert!(result.is_ok());

        // Should no longer be registered
        assert!(!manager.is_prefab_instance(entity_id));
        assert_eq!(manager.get_prefab_path(entity_id), None);
        assert_eq!(manager.get_prefab_instances("test_cube").len(), 0);
    }

    #[test]
    fn test_instantiate_nonexistent_prefab() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Try to instantiate non-existent prefab
        let result = manager.instantiate_prefab("nonexistent", None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found in registry"));
    }

    #[test]
    fn test_destroy_non_prefab_entity() {
        let temp_dir = TempDir::new().unwrap();
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Try to destroy non-prefab entity
        let fake_entity_id = EntityId::new(999);
        let result = manager.destroy_prefab_instance(fake_entity_id);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a prefab instance"));
    }

    #[test]
    fn test_multiple_instances() {
        let temp_dir = TempDir::new().unwrap();
        let scene_path = create_test_scene_with_prefabs(&temp_dir);
        let manager = ScriptPrefabManager::new(temp_dir.path().to_path_buf());

        // Load prefabs
        manager.load_prefabs_from_scene(&scene_path).unwrap();

        // Create multiple instances
        let id1 = manager.instantiate_prefab("test_cube", Some([0.0, 0.0, 0.0])).unwrap();
        let id2 = manager.instantiate_prefab("test_cube", Some([1.0, 0.0, 0.0])).unwrap();
        let id3 = manager.instantiate_prefab("test_cube", Some([2.0, 0.0, 0.0])).unwrap();

        // Should have 3 instances
        let instances = manager.get_prefab_instances("test_cube");
        assert_eq!(instances.len(), 3);

        // All should be registered as prefab instances
        assert!(manager.is_prefab_instance(id1));
        assert!(manager.is_prefab_instance(id2));
        assert!(manager.is_prefab_instance(id3));

        // Destroy one instance
        manager.destroy_prefab_instance(id2).unwrap();
        assert_eq!(manager.get_prefab_instances("test_cube").len(), 2);
        assert!(manager.is_prefab_instance(id1));
        assert!(!manager.is_prefab_instance(id2));
        assert!(manager.is_prefab_instance(id3));
    }
}