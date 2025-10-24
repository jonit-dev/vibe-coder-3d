//! Material API - MeshRenderer material manipulation
//!
//! # Lua API
//!
//! ## entity.meshRenderer
//! ```lua
//! -- Get mesh renderer data
//! local mr = entity.meshRenderer:get()
//! console.log("Mesh ID:", mr.meshId)
//!
//! -- Set mesh renderer properties
//! entity.meshRenderer:set({ meshId = "cube", materialId = "myMaterial" })
//!
//! -- Enable/disable mesh renderer
//! entity.meshRenderer:enable(true)
//!
//! -- Material manipulation
//! entity.meshRenderer.material:setColor("#ff0000") -- hex string
//! entity.meshRenderer.material:setColor(0xff0000) -- hex number
//! entity.meshRenderer.material:setMetalness(0.8) -- 0-1, clamped
//! entity.meshRenderer.material:setRoughness(0.5) -- 0-1, clamped
//! entity.meshRenderer.material:setEmissive("#00ff00", 2.0) -- color, intensity
//! entity.meshRenderer.material:setTexture("albedo", "texture-id-or-path")
//! entity.meshRenderer.material:setTexture("normal", "normal-map-path")
//! -- Supported texture kinds: "albedo", "normal", "metallic", "roughness", "emissive", "occlusion"
//! ```

use mlua::prelude::*;
use serde_json::Value;
use std::sync::Arc;
use vibe_scene::Scene;

use super::entity_mutations::{EntityMutation, EntityMutationBuffer};

/// Register Material API on the entity table
///
/// Creates entity.meshRenderer accessor if the entity has a MeshRenderer component
pub fn register_material_api(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<()> {
    let entity_table: LuaTable = lua.globals().get("entity")?;

    // Only register if entity has MeshRenderer component
    if let Some(entity) = scene.find_entity(vibe_scene::EntityId::new(entity_id)) {
        if entity.has_component("MeshRenderer") {
            let accessor = create_mesh_renderer_accessor(lua, entity_id, scene, mutation_buffer)?;
            entity_table.set("meshRenderer", accessor)?;
        }
    }

    Ok(())
}

/// Create MeshRenderer accessor
fn create_mesh_renderer_accessor(
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
                    if let Some(comp) = entity.get_component_raw("MeshRenderer") {
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
                    component_type: "MeshRenderer".to_string(),
                    data: json_value,
                });
                Ok(())
            })?,
        )?;
    }

    // enable(value) - enable/disable mesh renderer
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "enable",
            lua.create_function(move |_, (_self, enabled): (LuaValue, bool)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshRenderer".to_string(),
                    data: serde_json::json!({ "enabled": enabled }),
                });
                Ok(())
            })?,
        )?;
    }

    // material sub-API
    let material_api = create_material_api(lua, entity_id, mutation_buffer)?;
    accessor.set("material", material_api)?;

    Ok(accessor)
}

/// Create Material manipulation API
fn create_material_api(
    lua: &Lua,
    entity_id: u64,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<LuaTable> {
    let api = lua.create_table()?;

    // setColor(hex) - accepts hex string "#ff0000" or hex number 0xff0000
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setColor",
            lua.create_function(move |_, (_self, color): (LuaValue, LuaValue)| {
                let color_str = match color {
                    LuaValue::String(s) => s.to_str()?.to_string(),
                    LuaValue::Integer(i) => format!("#{:06x}", i),
                    LuaValue::Number(n) => format!("#{:06x}", n as i64),
                    _ => {
                        return Err(LuaError::RuntimeError(
                            "Color must be a hex string or number".to_string(),
                        ))
                    }
                };

                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshRenderer".to_string(),
                    data: serde_json::json!({
                        "material": { "color": color_str }
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    // setMetalness(value) - clamped 0-1
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setMetalness",
            lua.create_function(move |_, (_self, metalness): (LuaValue, f32)| {
                let clamped = metalness.max(0.0).min(1.0);
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshRenderer".to_string(),
                    data: serde_json::json!({
                        "material": { "metalness": clamped }
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    // setRoughness(value) - clamped 0-1
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setRoughness",
            lua.create_function(move |_, (_self, roughness): (LuaValue, f32)| {
                let clamped = roughness.max(0.0).min(1.0);
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshRenderer".to_string(),
                    data: serde_json::json!({
                        "material": { "roughness": clamped }
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    // setEmissive(hex, intensity?) - set emissive color and intensity
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setEmissive",
            lua.create_function(
                move |_, (_self, color, intensity): (LuaValue, LuaValue, Option<f32>)| {
                    let color_str = match color {
                        LuaValue::String(s) => s.to_str()?.to_string(),
                        LuaValue::Integer(i) => format!("#{:06x}", i),
                        LuaValue::Number(n) => format!("#{:06x}", n as i64),
                        _ => {
                            return Err(LuaError::RuntimeError(
                                "Emissive color must be a hex string or number".to_string(),
                            ))
                        }
                    };

                    let mut data = serde_json::json!({
                        "material": { "emissive": color_str }
                    });

                    if let Some(intensity_val) = intensity {
                        data["material"]["emissiveIntensity"] = serde_json::json!(intensity_val);
                    }

                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "MeshRenderer".to_string(),
                        data,
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // setTexture(kind, idOrPath) - set texture for a specific material map
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setTexture",
            lua.create_function(move |_, (_self, kind, path): (LuaValue, String, String)| {
                // Validate texture kind
                let valid_kinds = [
                    "albedo",
                    "normal",
                    "metallic",
                    "roughness",
                    "emissive",
                    "occlusion",
                ];
                if !valid_kinds.contains(&kind.as_str()) {
                    return Err(LuaError::RuntimeError(format!(
                        "Invalid texture kind '{}'. Must be one of: {}",
                        kind,
                        valid_kinds.join(", ")
                    )));
                }

                // Map to camelCase field names matching TypeScript
                let field_name = match kind.as_str() {
                    "albedo" => "albedoTexture",
                    "normal" => "normalTexture",
                    "metallic" => "metallicTexture",
                    "roughness" => "roughnessTexture",
                    "emissive" => "emissiveTexture",
                    "occlusion" => "occlusionTexture",
                    _ => unreachable!(),
                };

                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshRenderer".to_string(),
                    data: serde_json::json!({
                        "material": { field_name: path }
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    Ok(api)
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
