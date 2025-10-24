//! Script System - manages Lua scripts for all entities
//!
//! The ScriptSystem loads scripts from disk, creates per-entity Lua VMs,
//! executes lifecycle methods, and synchronizes transform changes back to the ECS.

use anyhow::{Context, Result};
use mlua::Lua;
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::{ScriptComponent, Transform};
use vibe_scene::{Entity, Scene};

use crate::apis::entity_api::{register_entity_api, EntityTransformState};
use crate::apis::EntityMutationBuffer;
use crate::lua_runtime::{LuaScript, LuaScriptRuntime};

/// Per-entity script instance
struct EntityScript {
    runtime: LuaScriptRuntime,
    script: LuaScript,
    transform_state: Arc<Mutex<EntityTransformState>>,
    mutation_buffer: EntityMutationBuffer,
}

/// Script System - manages all entity scripts
pub struct ScriptSystem {
    /// Map of entity ID to script instance
    scripts: HashMap<u64, EntityScript>,
    /// Base path for script files
    scripts_base_path: PathBuf,
    /// Component registry for decoding Script components
    registry: vibe_ecs_bridge::ComponentRegistry,
    /// Total elapsed time since start (seconds)
    total_time: f64,
    /// Total frames rendered
    frame_count: u64,
    /// Reference to the scene for entity/component queries
    scene: Option<Arc<Scene>>,
}

impl ScriptSystem {
    /// Create a new ScriptSystem
    ///
    /// # Arguments
    ///
    /// * `scripts_base_path` - Base directory containing .lua files
    pub fn new(scripts_base_path: PathBuf) -> Self {
        Self {
            scripts: HashMap::new(),
            scripts_base_path,
            registry: vibe_ecs_bridge::create_default_registry(),
            total_time: 0.0,
            frame_count: 0,
            scene: None,
        }
    }

    /// Initialize the script system from a scene
    ///
    /// Loads and initializes all scripts for entities with ScriptComponent
    ///
    /// # Arguments
    ///
    /// * `scene` - The scene to load scripts from
    pub fn initialize(&mut self, scene: &Scene) -> Result<()> {
        log::info!("Initializing script system...");

        // Store scene reference for entity/component queries
        self.scene = Some(Arc::new(scene.clone()));

        for entity in &scene.entities {
            // Check if entity has a Script component
            if let Some(script_comp_value) = entity.components.get("Script") {
                // Decode the Script component
                let script_comp_any = self
                    .registry
                    .decode("Script", script_comp_value)
                    .context("Failed to decode Script component")?;

                let script_comp = script_comp_any
                    .downcast_ref::<ScriptComponent>()
                    .context("Failed to downcast Script component")?;

                // Skip if disabled or no script path
                if !script_comp.enabled {
                    log::debug!(
                        "Skipping disabled script for entity {}",
                        entity.name.as_deref().unwrap_or("unnamed")
                    );
                    continue;
                }

                if script_comp.get_script_path().is_none() {
                    log::warn!(
                        "Entity {} has Script component but no script path (checked scriptRef and scriptPath)",
                        entity.name.as_deref().unwrap_or("unnamed")
                    );
                    continue;
                }

                // Get entity ID
                if let Some(entity_id) = entity.entity_id() {
                    let eid = entity_id.as_u64();

                    // Load the script
                    if let Err(e) = self.load_entity_script(entity, eid, script_comp) {
                        log::error!(
                            "Failed to load script '{}' for entity {}: {}",
                            script_comp.get_script_path().unwrap_or("unknown"),
                            entity.name.as_deref().unwrap_or("unnamed"),
                            e
                        );
                    }
                } else {
                    eprintln!(
                        "WARNING: Entity '{}' has Script component but no entity ID",
                        entity.name.as_deref().unwrap_or("unnamed")
                    );
                }
            }
        }

        log::info!(
            "Script system initialized with {} scripts",
            self.scripts.len()
        );

        // In debug builds, warn if no scripts were loaded but scene had script components
        #[cfg(debug_assertions)]
        {
            let total_entities_with_scripts = scene
                .entities
                .iter()
                .filter(|e| e.components.contains_key("Script"))
                .count();
            if total_entities_with_scripts > 0 && self.scripts.is_empty() {
                log::warn!(
                    "Scene has {} entities with Script components, but 0 scripts loaded. Check logs for errors.",
                    total_entities_with_scripts
                );
            }
        }

        Ok(())
    }

    /// Convert serde_json::Value to mlua::Value
    fn json_to_lua(lua: &Lua, value: &Value) -> mlua::Result<mlua::Value> {
        match value {
            Value::Null => Ok(mlua::Value::Nil),
            Value::Bool(b) => Ok(mlua::Value::Boolean(*b)),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    Ok(mlua::Value::Integer(i))
                } else if let Some(f) = n.as_f64() {
                    Ok(mlua::Value::Number(f))
                } else {
                    Ok(mlua::Value::Nil)
                }
            }
            Value::String(s) => Ok(mlua::Value::String(lua.create_string(s)?)),
            Value::Array(arr) => {
                let table = lua.create_table()?;
                for (i, v) in arr.iter().enumerate() {
                    table.set(i + 1, Self::json_to_lua(lua, v)?)?;
                }
                Ok(mlua::Value::Table(table))
            }
            Value::Object(obj) => {
                let table = lua.create_table()?;
                for (k, v) in obj {
                    table.set(k.as_str(), Self::json_to_lua(lua, v)?)?;
                }
                Ok(mlua::Value::Table(table))
            }
        }
    }

    /// Load a script for a specific entity
    fn load_entity_script(
        &mut self,
        entity: &Entity,
        entity_id: u64,
        script_comp: &ScriptComponent,
    ) -> Result<()> {
        let entity_name = entity.name.as_deref().unwrap_or("unnamed").to_string();

        let script_path = script_comp.get_script_path().context(
            "Script component missing script path (checked scriptRef.path and scriptPath)",
        )?;

        log::info!(
            "Loading Lua script for entity {} (ID {}): {}",
            entity_name,
            entity_id,
            script_path
        );

        // Create Lua VM
        let runtime = LuaScriptRuntime::new().context("Failed to create Lua runtime")?;

        // Initialize transform state from entity's Transform component
        let transform_state = if let Some(transform_value) = entity.components.get("Transform") {
            let transform_any = self
                .registry
                .decode("Transform", transform_value)
                .context("Failed to decode Transform component")?;

            let transform = transform_any
                .downcast_ref::<Transform>()
                .context("Failed to downcast Transform component")?;

            EntityTransformState::from_transform(transform)
        } else {
            EntityTransformState::default()
        };

        let transform_state = Arc::new(Mutex::new(transform_state));

        // Register console API for logging
        crate::apis::register_console_api(runtime.lua())
            .with_context(|| {
                format!(
                    "Failed to register console API for entity '{}' (ID {})",
                    entity_name, entity_id
                )
            })?;

        // Create mutation buffer for this entity
        let mutation_buffer = EntityMutationBuffer::new();

        // Register entity API with transform state, scene reference, and mutation buffer
        let scene_ref = self
            .scene
            .clone()
            .context("Scene not initialized in ScriptSystem")?;

        register_entity_api(
            runtime.lua(),
            entity_id,
            entity_name.clone(),
            transform_state.clone(),
            scene_ref,
            mutation_buffer.clone(),
        )
        .with_context(|| {
            format!(
                "Failed to register entity API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register input API (stubs)
        crate::apis::register_input_api(runtime.lua()).with_context(|| {
            format!(
                "Failed to register input API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register timer API (placeholder)
        crate::apis::register_timer_api(runtime.lua()).with_context(|| {
            format!(
                "Failed to register timer API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register math API
        crate::apis::register_math_api(runtime.lua()).with_context(|| {
            format!(
                "Failed to register math API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register time API (will be updated per frame)
        crate::apis::register_time_api(
            runtime.lua(),
            crate::apis::TimeInfo::default(),
        )
        .with_context(|| {
            format!(
                "Failed to register time API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register event API for inter-entity communication
        crate::apis::register_event_api(runtime.lua(), entity_id as u32).with_context(|| {
            format!(
                "Failed to register event API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register query API for entity/scene queries
        let scene_ref_for_query = self
            .scene
            .clone()
            .context("Scene not initialized for QueryAPI")?;
        crate::apis::register_query_api(runtime.lua(), scene_ref_for_query).with_context(|| {
            format!(
                "Failed to register query API for entity '{}' (ID {})",
                entity_name, entity_id
            )
        })?;

        // Register entities API for entity lookups and references
        let scene_ref_for_entities = self
            .scene
            .clone()
            .context("Scene not initialized for EntitiesAPI")?;
        crate::apis::register_entities_api(runtime.lua(), scene_ref_for_entities).with_context(
            || {
                format!(
                    "Failed to register entities API for entity '{}' (ID {})",
                    entity_name, entity_id
                )
            },
        )?;

        // Register script parameters as a global Lua table
        let params_lua = Self::json_to_lua(runtime.lua(), &script_comp.parameters)
            .map_err(|e| anyhow::anyhow!("Failed to convert parameters to Lua: {}", e))?;
        runtime
            .lua()
            .globals()
            .set("parameters", params_lua)
            .map_err(|e| anyhow::anyhow!("Failed to set parameters global: {}", e))?;

        // Load the .lua file
        let full_path = self.scripts_base_path.join(script_path);
        let script = runtime
            .load_script(&full_path)
            .with_context(|| format!("Failed to load script: {}", script_path))?;

        // Call onStart()
        log::debug!("Calling onStart() for entity '{}' (ID {})", entity_name, entity_id);
        script
            .call_on_start(runtime.lua())
            .with_context(|| {
                format!(
                    "Error in onStart() for entity '{}' (ID {})",
                    entity_name, entity_id
                )
            })?;

        // Store for later updates
        self.scripts.insert(
            entity_id,
            EntityScript {
                runtime,
                script,
                transform_state,
                mutation_buffer,
            },
        );

        log::debug!("Successfully loaded script for entity {}", entity_name);
        Ok(())
    }

    /// Update all scripts
    ///
    /// Calls onUpdate(deltaTime) for all active scripts and updates time API
    ///
    /// # Arguments
    ///
    /// * `delta_time` - Time elapsed since last frame in seconds
    ///
    /// # TypeScript Parity
    ///
    /// TypeScript flow: useFrame gives seconds → multiply by 1000 → ScriptSystem divides by 1000 → scripts get seconds
    /// Rust flow: FrameTimer gives seconds → pass directly → scripts get seconds
    /// Both approaches result in scripts receiving deltaTime in seconds
    pub fn update(&mut self, delta_time: f32) -> Result<()> {
        // Update time tracking
        self.total_time += delta_time as f64;
        self.frame_count += 1;

        log::debug!(
            "ScriptSystem::update called with {} scripts, delta_time={:.4}s, total_time={:.2}s, frame={}",
            self.scripts.len(),
            delta_time,
            self.total_time,
            self.frame_count
        );

        // Create time info for this frame
        let time_info = crate::apis::TimeInfo {
            time: self.total_time,
            delta_time: delta_time as f64,
            frame_count: self.frame_count,
        };

        for (entity_id, entity_script) in &self.scripts {
            // Update time API for this entity's Lua VM
            if let Err(e) = crate::apis::update_time_api(entity_script.runtime.lua(), time_info) {
                log::error!(
                    "Failed to update time API for entity {}: {}",
                    entity_id,
                    e
                );
                continue;
            }

            log::trace!("Calling onUpdate() for entity {} (delta: {:.4}s)", entity_id, delta_time);
            if let Err(e) = entity_script
                .script
                .call_on_update(entity_script.runtime.lua(), delta_time)
            {
                log::error!(
                    "Error in onUpdate() for entity {}: {}",
                    entity_id,
                    e
                );
                // Continue processing other scripts even if one fails
            }
        }
        Ok(())
    }

    /// Get the current transform state for an entity
    ///
    /// This allows the engine to read transform changes made by scripts
    ///
    /// # Arguments
    ///
    /// * `entity_id` - The entity ID
    ///
    /// # Returns
    ///
    /// The current transform state if the entity has a script
    pub fn get_transform(&self, entity_id: u64) -> Option<Transform> {
        self.scripts
            .get(&entity_id)
            .map(|entity_script| entity_script.transform_state.lock().unwrap().to_transform())
    }

    /// Destroy a script for a specific entity
    ///
    /// Calls onDestroy() and removes the script from the system
    ///
    /// # Arguments
    ///
    /// * `entity_id` - The entity ID
    pub fn destroy_script(&mut self, entity_id: u64) -> Result<()> {
        if let Some(entity_script) = self.scripts.remove(&entity_id) {
            log::debug!("Calling onDestroy() for entity {}", entity_id);
            entity_script
                .script
                .call_on_destroy(entity_script.runtime.lua())
                .with_context(|| {
                    format!("Error in onDestroy() for entity {}", entity_id)
                })?;

            // Cleanup event handlers for this entity
            crate::apis::cleanup_event_api(entity_script.runtime.lua(), entity_id as u32)
                .with_context(|| {
                    format!("Error cleaning up event API for entity {}", entity_id)
                })?;

            log::debug!("Successfully destroyed script for entity {}", entity_id);
        }
        Ok(())
    }

    /// Get the number of active scripts
    pub fn script_count(&self) -> usize {
        self.scripts.len()
    }

    /// Check if an entity has a script loaded
    pub fn has_script(&self, entity_id: u64) -> bool {
        self.scripts.contains_key(&entity_id)
    }

    /// Get all entity IDs that have scripts loaded
    pub fn entity_ids(&self) -> Vec<u64> {
        self.scripts.keys().copied().collect()
    }
}

impl Drop for ScriptSystem {
    fn drop(&mut self) {
        // Call onDestroy for all scripts when system is dropped
        let entity_ids: Vec<u64> = self.scripts.keys().copied().collect();
        for entity_id in entity_ids {
            if let Err(e) = self.destroy_script(entity_id) {
                log::error!("Error destroying script for entity {}: {}", entity_id, e);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::io::Write;
    use tempfile::{NamedTempFile, TempDir};

    fn create_test_scene_with_script(script_path: &str) -> Scene {
        Scene {
            metadata: vibe_scene::Metadata {
                name: "Test Scene".to_string(),
                version: 0,
                timestamp: "2025-01-01T00:00:00Z".to_string(),
                author: None,
                description: None,
            },
            entities: vec![Entity {
                id: Some(42),
                persistentId: None, // Don't set persistentId so entity_id() uses numeric id
                name: Some("TestEntity".to_string()),
                parentPersistentId: None,
                tags: vec![],
                components: [
                    (
                        "Transform".to_string(),
                        json!({
                            "position": [1.0, 2.0, 3.0],
                            "rotation": [0.0, 0.0, 0.0],
                            "scale": [1.0, 1.0, 1.0]
                        }),
                    ),
                    (
                        "Script".to_string(),
                        json!({
                            "scriptPath": script_path,
                            "parameters": { "speed": 5.0 },
                            "enabled": true
                        }),
                    ),
                ]
                .iter()
                .cloned()
                .collect(),
            }],
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        }
    }

    #[test]
    fn test_script_system_creation() {
        let temp_dir = TempDir::new().unwrap();
        let system = ScriptSystem::new(temp_dir.path().to_path_buf());
        assert_eq!(system.script_count(), 0);
    }

    #[test]
    fn test_script_system_initialize() {
        let temp_dir = TempDir::new().unwrap();

        // Create a test script file
        let script_path = temp_dir.path().join("test.lua");
        let mut script_file = std::fs::File::create(&script_path).unwrap();
        writeln!(
            script_file,
            r#"
            function onStart()
                print("Started!")
            end

            function onUpdate(deltaTime)
                entity.transform:translate(deltaTime, 0, 0)
            end
            "#
        )
        .unwrap();

        // Create scene
        let scene = create_test_scene_with_script("test.lua");

        // Initialize script system
        let mut system = ScriptSystem::new(temp_dir.path().to_path_buf());
        system.initialize(&scene).unwrap();

        assert_eq!(system.script_count(), 1);
        assert!(system.has_script(42));
    }

    #[test]
    fn test_script_update_modifies_transform() {
        let temp_dir = TempDir::new().unwrap();

        // Create a script that modifies position
        let script_path = temp_dir.path().join("mover.lua");
        let mut script_file = std::fs::File::create(&script_path).unwrap();
        writeln!(
            script_file,
            r#"
            function onUpdate(deltaTime)
                entity.transform:setPosition(10, 20, 30)
            end
            "#
        )
        .unwrap();

        let scene = create_test_scene_with_script("mover.lua");
        let mut system = ScriptSystem::new(temp_dir.path().to_path_buf());
        system.initialize(&scene).unwrap();

        // Update the script
        system.update(0.016).unwrap();

        // Check transform was modified
        let transform = system.get_transform(42).unwrap();
        assert_eq!(transform.position, Some([10.0, 20.0, 30.0]));
    }

    #[test]
    fn test_script_destroy() {
        let temp_dir = TempDir::new().unwrap();

        let script_path = temp_dir.path().join("test.lua");
        let mut script_file = std::fs::File::create(&script_path).unwrap();
        writeln!(
            script_file,
            r#"
            function onStart()
            end

            function onDestroy()
                print("Destroyed!")
            end
            "#
        )
        .unwrap();

        let scene = create_test_scene_with_script("test.lua");
        let mut system = ScriptSystem::new(temp_dir.path().to_path_buf());
        system.initialize(&scene).unwrap();

        assert_eq!(system.script_count(), 1);

        // Destroy the script
        system.destroy_script(42).unwrap();

        assert_eq!(system.script_count(), 0);
        assert!(!system.has_script(42));
    }

    #[test]
    fn test_script_system_drop_calls_on_destroy() {
        let temp_dir = TempDir::new().unwrap();

        let script_path = temp_dir.path().join("test.lua");
        let mut script_file = std::fs::File::create(&script_path).unwrap();
        writeln!(
            script_file,
            r#"
            function onStart()
            end

            function onDestroy()
                print("Cleanup!")
            end
            "#
        )
        .unwrap();

        let scene = create_test_scene_with_script("test.lua");
        let mut system = ScriptSystem::new(temp_dir.path().to_path_buf());
        system.initialize(&scene).unwrap();

        // Drop the system (should call onDestroy)
        drop(system);

        // Test passes if no panics occur
    }
}
