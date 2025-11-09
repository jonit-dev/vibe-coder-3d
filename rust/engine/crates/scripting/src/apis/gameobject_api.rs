/// GameObject API for Lua scripts
///
/// Provides runtime entity creation and destruction APIs.
use mlua::prelude::*;
use std::sync::{Mutex, Weak};
use vibe_ecs_manager::SceneManager;

pub type SceneManagerRef = Weak<Mutex<SceneManager>>;

/// Register GameObject API in Lua environment
///
/// Provides:
/// - GameObject.create(name?) -> entityId
/// - GameObject.createPrimitive(kind, options?) -> entityId
/// - GameObject.destroy(entityRef?) -> void
pub fn register_gameobject_api(lua: &Lua, scene_manager: Option<SceneManagerRef>) -> LuaResult<()> {
    log::info!(
        "Registering GameObject API (scene_manager present: {})",
        scene_manager.is_some()
    );
    let gameobject = lua.create_table()?;

    // GameObject.create(name?, parent?)
    if let Some(manager_weak) = scene_manager.clone() {
        let manager_clone = manager_weak.clone();
        gameobject.set(
            "create",
            lua.create_function(move |_lua, args: LuaMultiValue| {
                let name: Option<String> = args.get(0).and_then(|v: &LuaValue| match v {
                    LuaValue::String(s) => s.to_str().ok().map(|s| s.to_string()),
                    _ => None,
                });

                let manager_rc = manager_clone
                    .upgrade()
                    .ok_or_else(|| LuaError::runtime("SceneManager no longer available"))?;
                let mut mgr = manager_rc
                    .lock()
                    .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

                let entity_id = mgr
                    .create_entity()
                    .with_name(name.unwrap_or_else(|| "Entity".to_string()))
                    .build();

                Ok(entity_id.as_u64() as f64) // Lua uses f64 for numbers
            })?,
        )?;
    } else {
        // No scene manager - stub implementation
        gameobject.set(
            "create",
            lua.create_function(|_, _: LuaMultiValue| -> LuaResult<f64> {
                Err(LuaError::runtime(
                    "GameObject.create not available (mutable ECS not enabled)",
                ))
            })?,
        )?;
    }

    // GameObject.createPrimitive(kind, options?)
    if let Some(manager_weak) = scene_manager.clone() {
        let manager_clone = manager_weak.clone();
        gameobject.set(
            "createPrimitive",
            lua.create_function(move |_lua, (kind, options): (String, Option<LuaTable>)| {
                let manager_rc = manager_clone
                    .upgrade()
                    .ok_or_else(|| LuaError::runtime("SceneManager no longer available"))?;
                let mut mgr = manager_rc
                    .lock()
                    .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

                let mut builder = mgr
                    .create_entity()
                    .with_name(&format!("{} Primitive", kind));

                // Parse options if provided
                if let Some(opts) = options {
                    // Extract name
                    if let Ok(name) = opts.get::<String>("name") {
                        builder = builder.with_name(name);
                    }

                    // Extract transform
                    if let Ok(transform) = opts.get::<LuaTable>("transform") {
                        // Handle position as Lua table
                        if let Ok(pos_table) = transform.get::<LuaTable>("position") {
                            if let Ok(pos_vec) = pos_table
                                .sequence_values::<f32>()
                                .collect::<LuaResult<Vec<_>>>()
                            {
                                if pos_vec.len() == 3 {
                                    builder =
                                        builder.with_position([pos_vec[0], pos_vec[1], pos_vec[2]]);
                                }
                            }
                        }
                        // Handle rotation as Lua table
                        if let Ok(rot_table) = transform.get::<LuaTable>("rotation") {
                            if let Ok(rot_vec) = rot_table
                                .sequence_values::<f32>()
                                .collect::<LuaResult<Vec<_>>>()
                            {
                                if rot_vec.len() == 3 {
                                    builder =
                                        builder.with_rotation([rot_vec[0], rot_vec[1], rot_vec[2]]);
                                }
                            }
                        }
                        if let Ok(scale_val) = transform.get::<LuaValue>("scale") {
                            match scale_val {
                                LuaValue::Number(n) => {
                                    let s = n as f32;
                                    builder = builder.with_scale([s, s, s]);
                                }
                                LuaValue::Table(t) => {
                                    if let Ok(scale_vec) =
                                        t.sequence_values::<f32>().collect::<LuaResult<Vec<_>>>()
                                    {
                                        if scale_vec.len() == 3 {
                                            builder = builder.with_scale([
                                                scale_vec[0],
                                                scale_vec[1],
                                                scale_vec[2],
                                            ]);
                                        }
                                    }
                                }
                                _ => {}
                            }
                        }
                    }

                    // Extract material
                    if let Ok(material) = opts.get::<LuaTable>("material") {
                        let color = material
                            .get::<String>("color")
                            .unwrap_or_else(|_| "#888888".to_string());
                        let metalness = material.get::<f32>("metalness").unwrap_or(0.0);
                        let roughness = material.get::<f32>("roughness").unwrap_or(0.5);
                        builder = builder.with_material(&color, metalness, roughness);
                    }

                    // Extract physics
                    if let Ok(physics) = opts.get::<LuaTable>("physics") {
                        if let Ok(body) = physics.get::<String>("body") {
                            let mass = physics.get::<f32>("mass").unwrap_or(1.0);
                            builder = builder.with_rigidbody(&body, mass, 1.0);
                        }
                        if let Ok(collider) = physics.get::<String>("collider") {
                            builder = builder.with_collider(&collider);
                        }
                    }
                }

                // Add primitive mesh
                builder = builder.with_primitive(&kind);

                let entity_id = builder.build();

                Ok(entity_id.as_u64() as f64)
            })?,
        )?;
    } else {
        gameobject.set(
            "createPrimitive",
            lua.create_function(|_, _: (String, Option<LuaTable>)| -> LuaResult<f64> {
                Err(LuaError::runtime(
                    "GameObject.createPrimitive not available",
                ))
            })?,
        )?;
    }

    // GameObject.destroy(entityRef?)
    if let Some(manager_weak) = scene_manager {
        let manager_clone = manager_weak.clone();
        gameobject.set(
            "destroy",
            lua.create_function(move |_lua, entity_ref: Option<LuaValue>| {
                let manager_rc = manager_clone
                    .upgrade()
                    .ok_or_else(|| LuaError::runtime("SceneManager no longer available"))?;
                let mut mgr = manager_rc
                    .lock()
                    .map_err(|_| LuaError::runtime("SceneManager lock poisoned"))?;

                if let Some(ref_val) = entity_ref {
                    // Parse entity ID from Lua value
                    let entity_id = match ref_val {
                        LuaValue::Number(n) => vibe_scene::EntityId::new(n as u64),
                        _ => {
                            return Err(LuaError::runtime("Invalid entity reference"));
                        }
                    };

                    mgr.destroy_entity(entity_id);
                }

                Ok(())
            })?,
        )?;
    } else {
        gameobject.set(
            "destroy",
            lua.create_function(|_, _: Option<LuaValue>| -> LuaResult<()> {
                Err(LuaError::runtime("GameObject.destroy not available"))
            })?,
        )?;
    }

    lua.globals().set("GameObject", gameobject)?;
    log::info!("GameObject API registered successfully in Lua globals");

    Ok(())
}
