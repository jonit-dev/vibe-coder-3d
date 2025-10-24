//! Physics API - RigidBody, MeshCollider, PhysicsEvents, and CharacterController
//!
//! # Lua API
//!
//! ## entity.rigidBody
//! ```lua
//! -- Get component data
//! local rb = entity.rigidBody:get()
//!
//! -- Set component data
//! entity.rigidBody:set({ mass = 2.0, gravityScale = 0.5 })
//!
//! -- Enable/disable physics
//! entity.rigidBody:enable(true)
//!
//! -- Set body type
//! entity.rigidBody:setBodyType("dynamic") -- "dynamic", "kinematic", or "static"
//!
//! -- Set mass
//! entity.rigidBody:setMass(10.0)
//!
//! -- Set gravity scale
//! entity.rigidBody:setGravityScale(1.0) -- 0 = no gravity, 1 = normal gravity
//!
//! -- Set physics material
//! entity.rigidBody:setPhysicsMaterial(0.5, 0.3, 1.0) -- friction, restitution, density
//!
//! -- Apply force
//! entity.rigidBody:applyForce({10, 0, 0}) -- force vector
//! entity.rigidBody:applyForce({10, 0, 0}, {0, 1, 0}) -- force at point
//!
//! -- Apply impulse
//! entity.rigidBody:applyImpulse({5, 0, 0}) -- impulse vector
//! entity.rigidBody:applyImpulse({5, 0, 0}, {0, 1, 0}) -- impulse at point
//!
//! -- Set/get linear velocity
//! entity.rigidBody:setLinearVelocity({5, 0, 0})
//! local vel = entity.rigidBody:getLinearVelocity() -- returns {x, y, z}
//!
//! -- Set/get angular velocity
//! entity.rigidBody:setAngularVelocity({0, 1, 0})
//! local angVel = entity.rigidBody:getAngularVelocity() -- returns {x, y, z}
//! ```
//!
//! ## entity.meshCollider
//! ```lua
//! -- Enable/disable collider
//! entity.meshCollider:enable(true)
//!
//! -- Set as trigger
//! entity.meshCollider:setTrigger(true)
//!
//! -- Set collider type
//! entity.meshCollider:setType("box") -- "box", "sphere", "capsule", "convex", "mesh", "heightfield"
//!
//! -- Set center offset
//! entity.meshCollider:setCenter(0, 0.5, 0)
//!
//! -- Set box size
//! entity.meshCollider:setBoxSize(2, 2, 2)
//!
//! -- Set sphere radius
//! entity.meshCollider:setSphereRadius(1.0)
//!
//! -- Set capsule size
//! entity.meshCollider:setCapsuleSize(0.5, 2.0) -- radius, height
//! ```
//!
//! ## entity.physicsEvents
//! ```lua
//! -- Register collision callbacks
//! entity.physicsEvents:onCollisionEnter(function(otherEntityId)
//!     console.log("Collision with entity:", otherEntityId)
//! end)
//!
//! entity.physicsEvents:onCollisionExit(function(otherEntityId)
//!     console.log("Collision ended with entity:", otherEntityId)
//! end)
//!
//! -- Register trigger callbacks
//! entity.physicsEvents:onTriggerEnter(function(otherEntityId)
//!     console.log("Trigger entered by entity:", otherEntityId)
//! end)
//!
//! entity.physicsEvents:onTriggerExit(function(otherEntityId)
//!     console.log("Trigger exited by entity:", otherEntityId)
//! end)
//! ```
//!
//! ## entity.controller (Character Controller)
//! ```lua
//! -- Check if grounded
//! if entity.controller:isGrounded() then
//!     console.log("On ground!")
//! end
//!
//! -- Move character
//! entity.controller:move({1, 0}, 5.0, deltaTime) -- inputXZ, speed, deltaTime
//!
//! -- Jump
//! entity.controller:jump(10.0) -- strength
//!
//! -- Set slope limit
//! entity.controller:setSlopeLimit(45.0) -- max degrees
//!
//! -- Set step offset
//! entity.controller:setStepOffset(0.3) -- max step height
//! ```

use mlua::prelude::*;
use serde_json::Value;
use std::sync::Arc;
use vibe_scene::Scene;

use super::entity_mutations::{EntityMutation, EntityMutationBuffer};

/// Register Physics API on the entity table
///
/// Creates entity.rigidBody, entity.meshCollider, entity.physicsEvents, entity.controller
pub fn register_physics_api(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<()> {
    let entity_table: LuaTable = lua.globals().get("entity")?;

    // Register entity.rigidBody
    if let Some(entity) = scene.find_entity(vibe_scene::EntityId::new(entity_id)) {
        if entity.has_component("RigidBody") {
            let accessor =
                create_rigid_body_accessor(lua, entity_id, scene.clone(), mutation_buffer.clone())?;
            entity_table.set("rigidBody", accessor)?;
        }
    }

    // Register entity.meshCollider
    if let Some(entity) = scene.find_entity(vibe_scene::EntityId::new(entity_id)) {
        if entity.has_component("MeshCollider") {
            let accessor = create_mesh_collider_accessor(
                lua,
                entity_id,
                scene.clone(),
                mutation_buffer.clone(),
            )?;
            entity_table.set("meshCollider", accessor)?;
        }
    }

    // Register entity.physicsEvents (always available, even if no RigidBody yet)
    let physics_events = create_physics_events_api(lua, entity_id)?;
    entity_table.set("physicsEvents", physics_events)?;

    // Register entity.controller if CharacterController component exists
    if let Some(entity) = scene.find_entity(vibe_scene::EntityId::new(entity_id)) {
        if entity.has_component("CharacterController") {
            let controller = create_character_controller_api(
                lua,
                entity_id,
                scene.clone(),
                mutation_buffer.clone(),
            )?;
            entity_table.set("controller", controller)?;
        }
    }

    Ok(())
}

/// Create RigidBody accessor
fn create_rigid_body_accessor(
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
                    if let Some(comp) = entity.get_component_raw("RigidBody") {
                        return json_value_to_lua(lua, comp);
                    }
                }
                Ok(LuaValue::Nil)
            })?,
        )?;
    }

    // set(patch) - updates component data
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "set",
            lua.create_function(move |lua, (_self, patch): (LuaValue, LuaTable)| {
                let json_value = lua_table_to_json(lua, patch)?;
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: json_value,
                });
                Ok(())
            })?,
        )?;
    }

    // enable(value)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "enable",
            lua.create_function(move |_, (_self, enabled): (LuaValue, bool)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "enabled": enabled }),
                });
                Ok(())
            })?,
        )?;
    }

    // setBodyType(type)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setBodyType",
            lua.create_function(move |_, (_self, body_type): (LuaValue, String)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "bodyType": body_type }),
                });
                Ok(())
            })?,
        )?;
    }

    // setMass(mass)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setMass",
            lua.create_function(move |_, (_self, mass): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "mass": mass }),
                });
                Ok(())
            })?,
        )?;
    }

    // setGravityScale(scale)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setGravityScale",
            lua.create_function(move |_, (_self, scale): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "gravityScale": scale }),
                });
                Ok(())
            })?,
        )?;
    }

    // setPhysicsMaterial(friction, restitution, density)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setPhysicsMaterial",
            lua.create_function(
                move |_,
                      (_self, friction, restitution, density): (
                    LuaValue,
                    f32,
                    f32,
                    Option<f32>,
                )| {
                    let mut data = serde_json::json!({
                        "friction": friction,
                        "restitution": restitution
                    });
                    if let Some(d) = density {
                        data["density"] = serde_json::json!(d);
                    }
                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "RigidBody".to_string(),
                        data,
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // applyForce(force, point?)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "applyForce",
            lua.create_function(
                move |lua, (_self, force, point): (LuaValue, LuaValue, Option<LuaValue>)| {
                    let force_vec = lua_value_to_vec3(lua, force)?;
                    let point_vec = if let Some(p) = point {
                        Some(lua_value_to_vec3(lua, p)?)
                    } else {
                        None
                    };

                    let mut data = serde_json::json!({ "__applyForce": force_vec });
                    if let Some(p) = point_vec {
                        data["__applyForcePoint"] = serde_json::json!(p);
                    }

                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "RigidBody".to_string(),
                        data,
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // applyImpulse(impulse, point?)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "applyImpulse",
            lua.create_function(
                move |lua, (_self, impulse, point): (LuaValue, LuaValue, Option<LuaValue>)| {
                    let impulse_vec = lua_value_to_vec3(lua, impulse)?;
                    let point_vec = if let Some(p) = point {
                        Some(lua_value_to_vec3(lua, p)?)
                    } else {
                        None
                    };

                    let mut data = serde_json::json!({ "__applyImpulse": impulse_vec });
                    if let Some(p) = point_vec {
                        data["__applyImpulsePoint"] = serde_json::json!(p);
                    }

                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "RigidBody".to_string(),
                        data,
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // setLinearVelocity(vel)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setLinearVelocity",
            lua.create_function(move |lua, (_self, vel): (LuaValue, LuaValue)| {
                let vel_vec = lua_value_to_vec3(lua, vel)?;
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "__setLinearVelocity": vel_vec }),
                });
                Ok(())
            })?,
        )?;
    }

    // getLinearVelocity()
    {
        let scene_clone = scene.clone();
        accessor.set(
            "getLinearVelocity",
            lua.create_function(move |_, _self: LuaValue| {
                if let Some(entity) = scene_clone.find_entity(vibe_scene::EntityId::new(entity_id))
                {
                    if let Some(comp) = entity.get_component_raw("RigidBody") {
                        if let Some(vel) = comp.get("linearVelocity") {
                            if let Some(arr) = vel.as_array() {
                                if arr.len() == 3 {
                                    return Ok((
                                        arr[0].as_f64().unwrap_or(0.0) as f32,
                                        arr[1].as_f64().unwrap_or(0.0) as f32,
                                        arr[2].as_f64().unwrap_or(0.0) as f32,
                                    ));
                                }
                            }
                        }
                    }
                }
                Ok((0.0, 0.0, 0.0))
            })?,
        )?;
    }

    // setAngularVelocity(vel)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setAngularVelocity",
            lua.create_function(move |lua, (_self, vel): (LuaValue, LuaValue)| {
                let vel_vec = lua_value_to_vec3(lua, vel)?;
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "RigidBody".to_string(),
                    data: serde_json::json!({ "__setAngularVelocity": vel_vec }),
                });
                Ok(())
            })?,
        )?;
    }

    // getAngularVelocity()
    {
        let scene_clone = scene;
        accessor.set(
            "getAngularVelocity",
            lua.create_function(move |_, _self: LuaValue| {
                if let Some(entity) = scene_clone.find_entity(vibe_scene::EntityId::new(entity_id))
                {
                    if let Some(comp) = entity.get_component_raw("RigidBody") {
                        if let Some(vel) = comp.get("angularVelocity") {
                            if let Some(arr) = vel.as_array() {
                                if arr.len() == 3 {
                                    return Ok((
                                        arr[0].as_f64().unwrap_or(0.0) as f32,
                                        arr[1].as_f64().unwrap_or(0.0) as f32,
                                        arr[2].as_f64().unwrap_or(0.0) as f32,
                                    ));
                                }
                            }
                        }
                    }
                }
                Ok((0.0, 0.0, 0.0))
            })?,
        )?;
    }

    Ok(accessor)
}

/// Create MeshCollider accessor
fn create_mesh_collider_accessor(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<LuaTable> {
    let accessor = lua.create_table()?;

    // get()
    {
        let scene_clone = scene.clone();
        accessor.set(
            "get",
            lua.create_function(move |lua, _self: LuaValue| {
                if let Some(entity) = scene_clone.find_entity(vibe_scene::EntityId::new(entity_id))
                {
                    if let Some(comp) = entity.get_component_raw("MeshCollider") {
                        return json_value_to_lua(lua, comp);
                    }
                }
                Ok(LuaValue::Nil)
            })?,
        )?;
    }

    // set(patch)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "set",
            lua.create_function(move |lua, (_self, patch): (LuaValue, LuaTable)| {
                let json_value = lua_table_to_json(lua, patch)?;
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: json_value,
                });
                Ok(())
            })?,
        )?;
    }

    // enable(value)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "enable",
            lua.create_function(move |_, (_self, enabled): (LuaValue, bool)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({ "enabled": enabled }),
                });
                Ok(())
            })?,
        )?;
    }

    // setTrigger(isTrigger)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setTrigger",
            lua.create_function(move |_, (_self, is_trigger): (LuaValue, bool)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({ "isTrigger": is_trigger }),
                });
                Ok(())
            })?,
        )?;
    }

    // setType(type)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setType",
            lua.create_function(move |_, (_self, collider_type): (LuaValue, String)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({ "type": collider_type }),
                });
                Ok(())
            })?,
        )?;
    }

    // setCenter(x, y, z)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setCenter",
            lua.create_function(move |_, (_self, x, y, z): (LuaValue, f32, f32, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({ "center": [x, y, z] }),
                });
                Ok(())
            })?,
        )?;
    }

    // setBoxSize(width, height, depth)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setBoxSize",
            lua.create_function(
                move |_, (_self, width, height, depth): (LuaValue, f32, f32, f32)| {
                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "MeshCollider".to_string(),
                        data: serde_json::json!({ "boxSize": [width, height, depth] }),
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // setSphereRadius(radius)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setSphereRadius",
            lua.create_function(move |_, (_self, radius): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({ "sphereRadius": radius }),
                });
                Ok(())
            })?,
        )?;
    }

    // setCapsuleSize(radius, height)
    {
        let buffer = mutation_buffer.clone();
        accessor.set(
            "setCapsuleSize",
            lua.create_function(move |_, (_self, radius, height): (LuaValue, f32, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "MeshCollider".to_string(),
                    data: serde_json::json!({
                        "capsuleRadius": radius,
                        "capsuleHeight": height
                    }),
                });
                Ok(())
            })?,
        )?;
    }

    Ok(accessor)
}

/// Create PhysicsEvents API
fn create_physics_events_api(lua: &Lua, _entity_id: u64) -> LuaResult<LuaTable> {
    let api = lua.create_table()?;

    // NOTE: Physics events are placeholder stubs for now
    // In a full implementation, these would interact with a physics engine event system

    // onCollisionEnter(callback)
    api.set(
        "onCollisionEnter",
        lua.create_function(|_, (_self, _callback): (LuaValue, LuaFunction)| {
            log::warn!("PhysicsEvents::onCollisionEnter not yet implemented in Rust engine");
            // Return unsubscribe function (stub)
            Ok(())
        })?,
    )?;

    // onCollisionExit(callback)
    api.set(
        "onCollisionExit",
        lua.create_function(|_, (_self, _callback): (LuaValue, LuaFunction)| {
            log::warn!("PhysicsEvents::onCollisionExit not yet implemented in Rust engine");
            Ok(())
        })?,
    )?;

    // onTriggerEnter(callback)
    api.set(
        "onTriggerEnter",
        lua.create_function(|_, (_self, _callback): (LuaValue, LuaFunction)| {
            log::warn!("PhysicsEvents::onTriggerEnter not yet implemented in Rust engine");
            Ok(())
        })?,
    )?;

    // onTriggerExit(callback)
    api.set(
        "onTriggerExit",
        lua.create_function(|_, (_self, _callback): (LuaValue, LuaFunction)| {
            log::warn!("PhysicsEvents::onTriggerExit not yet implemented in Rust engine");
            Ok(())
        })?,
    )?;

    Ok(api)
}

/// Create CharacterController API
fn create_character_controller_api(
    lua: &Lua,
    entity_id: u64,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<LuaTable> {
    let api = lua.create_table()?;

    // isGrounded()
    {
        let scene_clone = scene.clone();
        api.set(
            "isGrounded",
            lua.create_function(move |_, _self: LuaValue| {
                if let Some(entity) = scene_clone.find_entity(vibe_scene::EntityId::new(entity_id))
                {
                    if let Some(comp) = entity.get_component_raw("CharacterController") {
                        if let Some(grounded) = comp.get("isGrounded") {
                            if let Some(b) = grounded.as_bool() {
                                return Ok(b);
                            }
                        }
                    }
                }
                Ok(false)
            })?,
        )?;
    }

    // move(inputXZ, speed, deltaTime)
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "move",
            lua.create_function(
                move |lua, (_self, input, speed, delta): (LuaValue, LuaValue, f32, f32)| {
                    let input_vec = lua_value_to_vec2(lua, input)?;
                    buffer.push(EntityMutation::SetComponent {
                        entity_id: vibe_scene::EntityId::new(entity_id),
                        component_type: "CharacterController".to_string(),
                        data: serde_json::json!({
                            "__move": { "input": input_vec, "speed": speed, "delta": delta }
                        }),
                    });
                    Ok(())
                },
            )?,
        )?;
    }

    // jump(strength)
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "jump",
            lua.create_function(move |_, (_self, strength): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "CharacterController".to_string(),
                    data: serde_json::json!({ "__jump": strength }),
                });
                Ok(())
            })?,
        )?;
    }

    // setSlopeLimit(maxDegrees)
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setSlopeLimit",
            lua.create_function(move |_, (_self, max_degrees): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "CharacterController".to_string(),
                    data: serde_json::json!({ "slopeLimit": max_degrees }),
                });
                Ok(())
            })?,
        )?;
    }

    // setStepOffset(value)
    {
        let buffer = mutation_buffer.clone();
        api.set(
            "setStepOffset",
            lua.create_function(move |_, (_self, value): (LuaValue, f32)| {
                buffer.push(EntityMutation::SetComponent {
                    entity_id: vibe_scene::EntityId::new(entity_id),
                    component_type: "CharacterController".to_string(),
                    data: serde_json::json!({ "stepOffset": value }),
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

fn lua_value_to_vec3(lua: &Lua, value: LuaValue) -> LuaResult<[f32; 3]> {
    match value {
        LuaValue::Table(t) => {
            let x: f32 = t.get(1)?;
            let y: f32 = t.get(2)?;
            let z: f32 = t.get(3)?;
            Ok([x, y, z])
        }
        _ => Err(LuaError::RuntimeError(
            "Expected table with 3 numbers for vec3".to_string(),
        )),
    }
}

fn lua_value_to_vec2(lua: &Lua, value: LuaValue) -> LuaResult<[f32; 2]> {
    match value {
        LuaValue::Table(t) => {
            let x: f32 = t.get(1)?;
            let y: f32 = t.get(2)?;
            Ok([x, y])
        }
        _ => Err(LuaError::RuntimeError(
            "Expected table with 2 numbers for vec2".to_string(),
        )),
    }
}
