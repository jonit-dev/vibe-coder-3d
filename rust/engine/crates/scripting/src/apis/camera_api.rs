//! Camera API - Camera component manipulation
//!
//! # Lua API
//!
//! ## entity.camera
//! ```lua
//! -- Get camera component data
//! local cam = entity.camera:get()
//! console.log("FOV:", cam.fov)
//!
//! -- Set camera properties via partial patch
//! entity.camera:set({ fov = 90, near = 0.1, far = 2000 })
//!
//! -- Set field of view
//! entity.camera:setFov(75)
//!
//! -- Set clipping planes
//! entity.camera:setClipping(0.1, 1000) -- near, far
//!
//! -- Set projection type
//! entity.camera:setProjection("perspective") -- or "orthographic"
//!
//! -- Set as main camera
//! entity.camera:setAsMain(true)
//! ```

use mlua::prelude::*;
use serde_json::Value;
use std::sync::Arc;
use vibe_scene::Scene;

use super::entity_mutations::{EntityMutation, EntityMutationBuffer};

/// Register Camera API on the entity table
///
/// Creates entity.camera accessor if the entity has a Camera component
pub fn register_camera_api(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<()> {
    let entity_table: LuaTable = lua.globals().get("entity")?;

    // Only register if entity has Camera component
    if let Some(entity) = scene.find_entity(vibe_scene::EntityId::new(entity_id)) {
        if entity.has_component("Camera") {
            let accessor = create_camera_accessor(lua, entity_id, scene, mutation_buffer)?;
            entity_table.set("camera", accessor)?;
        }
    }

    Ok(())
}

/// Create Camera accessor
fn create_camera_accessor(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<LuaTable> {
    let accessor = lua.create_table()?;

    // get() - returns component data as table
    {
        let scene_clone = scene.clone();
        accessor.set(
            "get",
            lua.create_function(move |lua, _self: LuaValue| {
                if let Some(entity) = scene_clone.find_entity(vibe_scene::EntityId::new(entity_id))
                {
                    if let Some(comp) = entity.get_component_raw("Camera") {
                        return json_value_to_lua(lua, comp);
                    }
                }
                Ok(LuaValue::Nil)
            })?,
        )?;
    }

    // set(patch) - updates component data via partial patch
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "set",
            lua.create_function(move |lua, (_self, patch): (LuaValue, LuaTable)| {
                let json_value = lua_table_to_json(lua, patch)?;
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "Camera".to_string(),
                    data: json_value,
                });
                Ok(())
            })?,
        )?;
    }

    // setFov(fov) - set field of view (clamped 1-179 degrees)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setFov",
            lua.create_function(move |_, (_self, fov): (LuaValue, f32)| {
                let clamped_fov = fov.max(1.0).min(179.0);
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "Camera".to_string(),
                    data: serde_json::json!({ "fov": clamped_fov }),
                });
                Ok(())
            })?,
        )?;
    }

    // setClipping(near, far) - set near/far clipping planes
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setClipping",
            lua.create_function(move |_, (_self, near, far): (LuaValue, f32, f32)| {
                let clamped_near = near.max(0.01);
                let clamped_far = far.max(clamped_near + 0.1);
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "Camera".to_string(),
                    data: serde_json::json!({
                        "near": clamped_near,
                        "far": clamped_far
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    // setProjection(type) - set projection type
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setProjection",
            lua.create_function(move |_, (_self, proj_type): (LuaValue, String)| {
                // Validate projection type
                if proj_type != "perspective" && proj_type != "orthographic" {
                    return Err(LuaError::RuntimeError(format!(
                        "Invalid projection type '{}'. Must be 'perspective' or 'orthographic'",
                        proj_type
                    )));
                }

                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "Camera".to_string(),
                    data: serde_json::json!({ "projectionType": proj_type }),
                });
                Ok(())
            })?,
        )?;
    }

    // setAsMain(isMain) - set as main camera
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setAsMain",
            lua.create_function(move |_, (_self, is_main): (LuaValue, bool)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "Camera".to_string(),
                    data: serde_json::json!({ "isMain": is_main }),
                });
                Ok(())
            })?,
        )?;
    }

    Ok(accessor)
}

// Helper functions

fn lua_table_to_json(lua: &Lua, table: LuaTable) -> LuaResult<Value> {
    let mut map = serde_json::Map::new();

    for pair in table.pairs::<LuaValue, LuaValue>() {
        let (key, value) = pair?;

        let key_str = match key {
            LuaValue::String(s) => s.to_str()?.to_string(),
            LuaValue::Integer(i) => i.to_string(),
            LuaValue::Number(n) => n.to_string(),
            _ => continue,
        };

        let json_value = lua_value_to_json(lua, value)?;
        map.insert(key_str, json_value);
    }

    Ok(Value::Object(map))
}

fn lua_value_to_json(lua: &Lua, value: LuaValue) -> LuaResult<Value> {
    match value {
        LuaValue::Nil => Ok(Value::Null),
        LuaValue::Boolean(b) => Ok(Value::Bool(b)),
        LuaValue::Integer(i) => Ok(serde_json::json!(i)),
        LuaValue::Number(n) => Ok(serde_json::json!(n)),
        LuaValue::String(s) => Ok(Value::String(s.to_str()?.to_string())),
        LuaValue::Table(t) => {
            let len = t.len()?;
            if len > 0 {
                let mut arr = Vec::new();
                for i in 1..=len {
                    let val: LuaValue = t.get(i)?;
                    arr.push(lua_value_to_json(lua, val)?);
                }
                Ok(Value::Array(arr))
            } else {
                lua_table_to_json(lua, t)
            }
        }
        _ => Ok(Value::Null),
    }
}

fn json_value_to_lua(lua: &Lua, value: &Value) -> LuaResult<LuaValue> {
    match value {
        Value::Null => Ok(LuaValue::Nil),
        Value::Bool(b) => Ok(LuaValue::Boolean(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(LuaValue::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(LuaValue::Number(f))
            } else {
                Ok(LuaValue::Nil)
            }
        }
        Value::String(s) => Ok(LuaValue::String(lua.create_string(s)?)),
        Value::Array(arr) => {
            let table = lua.create_table()?;
            for (i, item) in arr.iter().enumerate() {
                table.set(i + 1, json_value_to_lua(lua, item)?)?;
            }
            Ok(LuaValue::Table(table))
        }
        Value::Object(obj) => {
            let table = lua.create_table()?;
            for (key, val) in obj.iter() {
                table.set(key.as_str(), json_value_to_lua(lua, val)?)?;
            }
            Ok(LuaValue::Table(table))
        }
    }
}
