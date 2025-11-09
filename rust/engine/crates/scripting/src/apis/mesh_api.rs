/// Mesh API for Lua scripts
///
/// Provides runtime mesh control for visibility, shadows, and rendering properties.
///
/// ## Usage from Lua
///
/// ```lua
/// function onStart()
///     -- Get entity's mesh API
///     local mesh = entity.mesh
///     if mesh then
///         -- Control visibility
///         mesh:setVisible(true)
///
///         -- Control shadows
///         mesh:setCastShadows(true)
///         mesh:setReceiveShadows(true)
///     end
/// end
/// ```
use mlua::prelude::*;
use std::sync::{Arc, Mutex, Weak};
use vibe_ecs_manager::SceneManager;
use vibe_scene::EntityId;

/// Mesh API accessible via entity.mesh in Lua
pub struct MeshAPI {
    entity_id: EntityId,
    scene_manager: Weak<Mutex<SceneManager>>,
}

impl MeshAPI {
    pub fn new(entity_id: EntityId, scene_manager: Weak<Mutex<SceneManager>>) -> Self {
        Self {
            entity_id,
            scene_manager,
        }
    }

    /// Set mesh visibility
    pub fn set_visible(&self, visible: bool) -> LuaResult<()> {
        let scene_manager = self
            .scene_manager
            .upgrade()
            .ok_or_else(|| LuaError::runtime("SceneManager has been dropped"))?;

        let mut mgr = scene_manager
            .lock()
            .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

        let scene_state = mgr.scene_state();

        // Update entity in the live scene
        scene_state
            .with_scene_mut(|scene| {
                // Find entity in the Vec and update it
                let entity = scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(self.entity_id))
                    .ok_or_else(|| {
                        LuaError::runtime(format!("Entity {} not found", self.entity_id.as_u64()))
                    })?;

                if let Some(mesh_renderer) = entity.components.get_mut("MeshRenderer") {
                    // Parse current component data
                    let mut data: serde_json::Value = serde_json::from_value(mesh_renderer.clone())
                        .map_err(|e| {
                            LuaError::runtime(format!("Failed to parse MeshRenderer: {}", e))
                        })?;

                    // Update enabled field
                    if let Some(obj) = data.as_object_mut() {
                        obj.insert("enabled".to_string(), serde_json::Value::Bool(visible));
                        *mesh_renderer = data;
                        log::info!(
                            "Set entity {} ({}) mesh visibility to {}",
                            self.entity_id.as_u64(),
                            entity.name.as_deref().unwrap_or("unknown"),
                            visible
                        );
                    } else {
                        return Err(LuaError::runtime("MeshRenderer component is not an object"));
                    }
                } else {
                    return Err(LuaError::runtime("Entity has no MeshRenderer component"));
                }

                Ok(())
            })
            .map_err(|e: LuaError| e)?;

        Ok(())
    }

    /// Set whether mesh casts shadows
    pub fn set_cast_shadows(&self, cast_shadows: bool) -> LuaResult<()> {
        let scene_manager = self
            .scene_manager
            .upgrade()
            .ok_or_else(|| LuaError::runtime("SceneManager has been dropped"))?;

        let mut mgr = scene_manager
            .lock()
            .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

        let scene_state = mgr.scene_state();

        scene_state
            .with_scene_mut(|scene| {
                let entity = scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(self.entity_id))
                    .ok_or_else(|| {
                        LuaError::runtime(format!("Entity {} not found", self.entity_id.as_u64()))
                    })?;

                if let Some(mesh_renderer) = entity.components.get_mut("MeshRenderer") {
                    let mut data: serde_json::Value = serde_json::from_value(mesh_renderer.clone())
                        .map_err(|e| {
                            LuaError::runtime(format!("Failed to parse MeshRenderer: {}", e))
                        })?;

                    if let Some(obj) = data.as_object_mut() {
                        obj.insert(
                            "castShadows".to_string(),
                            serde_json::Value::Bool(cast_shadows),
                        );
                        *mesh_renderer = data;
                        log::debug!(
                            "Set entity {} castShadows to {}",
                            self.entity_id.as_u64(),
                            cast_shadows
                        );
                    } else {
                        return Err(LuaError::runtime("MeshRenderer component is not an object"));
                    }
                } else {
                    return Err(LuaError::runtime("Entity has no MeshRenderer component"));
                }

                Ok(())
            })
            .map_err(|e: LuaError| e)?;

        Ok(())
    }

    /// Set whether mesh receives shadows
    pub fn set_receive_shadows(&self, receive_shadows: bool) -> LuaResult<()> {
        let scene_manager = self
            .scene_manager
            .upgrade()
            .ok_or_else(|| LuaError::runtime("SceneManager has been dropped"))?;

        let mut mgr = scene_manager
            .lock()
            .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

        let scene_state = mgr.scene_state();

        scene_state
            .with_scene_mut(|scene| {
                let entity = scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(self.entity_id))
                    .ok_or_else(|| {
                        LuaError::runtime(format!("Entity {} not found", self.entity_id.as_u64()))
                    })?;

                if let Some(mesh_renderer) = entity.components.get_mut("MeshRenderer") {
                    let mut data: serde_json::Value = serde_json::from_value(mesh_renderer.clone())
                        .map_err(|e| {
                            LuaError::runtime(format!("Failed to parse MeshRenderer: {}", e))
                        })?;

                    if let Some(obj) = data.as_object_mut() {
                        obj.insert(
                            "receiveShadows".to_string(),
                            serde_json::Value::Bool(receive_shadows),
                        );
                        *mesh_renderer = data;
                        log::debug!(
                            "Set entity {} receiveShadows to {}",
                            self.entity_id.as_u64(),
                            receive_shadows
                        );
                    } else {
                        return Err(LuaError::runtime("MeshRenderer component is not an object"));
                    }
                } else {
                    return Err(LuaError::runtime("Entity has no MeshRenderer component"));
                }

                Ok(())
            })
            .map_err(|e: LuaError| e)?;

        Ok(())
    }

    /// Check if mesh is visible
    pub fn is_visible(&self) -> LuaResult<bool> {
        let scene_manager = self
            .scene_manager
            .upgrade()
            .ok_or_else(|| LuaError::runtime("SceneManager has been dropped"))?;

        let mgr = scene_manager
            .lock()
            .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

        let scene_state = mgr.scene_state();

        scene_state.with_scene(|scene| {
            let entity = scene
                .entities
                .iter()
                .find(|e| e.entity_id() == Some(self.entity_id))
                .ok_or_else(|| {
                    LuaError::runtime(format!("Entity {} not found", self.entity_id.as_u64()))
                })?;

            if let Some(mesh_renderer) = entity.components.get("MeshRenderer") {
                let data: serde_json::Value = serde_json::from_value(mesh_renderer.clone())
                    .map_err(|e| {
                        LuaError::runtime(format!("Failed to parse MeshRenderer: {}", e))
                    })?;

                if let Some(enabled) = data.get("enabled").and_then(|v| v.as_bool()) {
                    return Ok(enabled);
                }
            }

            Ok(false)
        })
    }
}

impl LuaUserData for MeshAPI {
    fn add_methods<M: LuaUserDataMethods<Self>>(methods: &mut M) {
        methods.add_method("setVisible", |_, this, visible: bool| {
            this.set_visible(visible)
        });

        methods.add_method("setCastShadows", |_, this, cast_shadows: bool| {
            this.set_cast_shadows(cast_shadows)
        });

        methods.add_method("setReceiveShadows", |_, this, receive_shadows: bool| {
            this.set_receive_shadows(receive_shadows)
        });

        methods.add_method("isVisible", |_, this, ()| this.is_visible());
    }
}

// Tests removed - MeshAPI now requires SceneManager which is complex to mock
// Integration tests exist in main engine tests instead
