///! Event API for Lua scripts
///!
///! Provides an event bus for inter-entity communication using SceneEventBus.
///! Scripts can emit events and listen for events from other entities.
use mlua::{Function, Lua, Result as LuaResult, Table, Value};
use std::sync::{Arc, Mutex};
use vibe_events::{EventEnvelope, EventKey, SceneEventBus, SubscriberId};
use vibe_scene::EntityId;

/// Per-entity subscriptions for cleanup
/// Maps entity ID to subscriber IDs that need cleanup
static ENTITY_SUBSCRIPTIONS: Mutex<std::collections::HashMap<u32, Vec<SubscriberId>>> =
    Mutex::new(std::collections::HashMap::new());

/// Global registry of event buses for cleanup
static EVENT_BUSES: Mutex<std::collections::HashMap<u32, Arc<SceneEventBus>>> =
    Mutex::new(std::collections::HashMap::new());

/// Register event API in the Lua environment
///
/// Creates a global `events` table with:
/// - events:on(eventType, handler) - Register event listener
/// - events:off(handlerId) - Unregister event listener
/// - events:emit(eventType, payload) - Emit event to all listeners
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `entity_id` - The entity ID (for cleanup tracking)
/// * `event_bus` - The SceneEventBus instance
///
/// # Example Lua usage
///
/// ```lua
/// -- Listen for events
/// events:on("player:scored", function(data)
///     console:log("Score:", data.points)
/// end)
///
/// -- Emit events
/// events:emit("player:scored", { points = 100 })
///
/// -- Unregister (usually automatic on entity destroy)
/// events:off(handlerId)
/// ```
pub fn register_event_api(
    lua: &Lua,
    entity_id: u32,
    event_bus: Arc<SceneEventBus>,
) -> LuaResult<()> {
    let events_table = lua.create_table()?;

    // Store event bus in global registry for this entity
    {
        let mut buses = EVENT_BUSES.lock().unwrap();
        buses.insert(entity_id, event_bus.clone());
    }

    // events:on(eventType, handler) -> handlerId
    let entity_id_on = entity_id;
    let event_bus_on = event_bus.clone();
    let on_fn = lua.create_function(
        move |lua, (_self, event_type, handler): (Table, String, Function)| {
            // Create a wrapped handler that calls the Lua function
            let lua_for_handler = lua.clone();
            let event_type_clone = event_type.clone();
            let handler_wrapper = move |envelope: &EventEnvelope| {
                // Convert JSON payload to Lua value
                let lua_payload = match json_to_lua(&lua_for_handler, &envelope.payload) {
                    Ok(value) => value,
                    Err(e) => {
                        log::error!(
                            "[Event API] Failed to convert event payload to Lua: {}",
                            e
                        );
                        return;
                    }
                };

                // Call the Lua handler
                if let Err(e) = handler.call::<()>(lua_payload) {
                    log::error!(
                        "[Event API] Error calling Lua handler for event '{}': {}",
                        event_type_clone,
                        e
                    );
                }
            };

            // Subscribe to the event bus with entity ownership
            let subscriber_id = event_bus_on.on_entity(
                EntityId::from(entity_id_on as u64),
                event_type.clone(),
                handler_wrapper,
            );

            // Store handler in registry to keep it alive
            let handler_registry_key = format!("event_handler_{}_{}", entity_id_on, subscriber_id);
            lua.set_named_registry_value(&handler_registry_key, handler.clone())?;

            // Track subscription for this entity
            {
                let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
                subscriptions
                    .entry(entity_id_on)
                    .or_insert_with(Vec::new)
                    .push(subscriber_id);
            }

            log::debug!(
                "[Event API] Entity {} registered handler {} for event '{}'",
                entity_id_on,
                subscriber_id,
                event_type
            );

            Ok(subscriber_id)
        },
    )?;

    events_table.set("on", on_fn)?;

    // events:off(handlerId)
    let entity_id_off = entity_id;
    let event_bus_off = event_bus.clone();
    let off_fn = lua.create_function(
        move |lua, (_self, handler_id): (Table, SubscriberId)| {
            // Unsubscribe from event bus
            event_bus_off.off(handler_id);

            // Remove from entity subscriptions
            {
                let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
                if let Some(handlers) = subscriptions.get_mut(&entity_id_off) {
                    handlers.retain(|&id| id != handler_id);
                }
            }

            // Remove handler from registry
            let handler_registry_key = format!("event_handler_{}_{}", entity_id_off, handler_id);
            lua.unset_named_registry_value(&handler_registry_key)?;

            log::debug!(
                "[Event API] Entity {} unregistered handler {}",
                entity_id_off,
                handler_id
            );

            Ok(())
        },
    )?;

    events_table.set("off", off_fn)?;

    // events:emit(eventType, payload)
    let event_bus_emit = event_bus.clone();
    let emit_fn = lua.create_function(
        move |lua, (_self, event_type, payload): (Table, String, Value)| {
            // Convert Lua payload to JSON
            let json_payload = match lua_to_json(lua, payload) {
                Ok(value) => value,
                Err(e) => {
                    log::error!(
                        "[Event API] Failed to convert Lua payload to JSON for event '{}': {}",
                        event_type,
                        e
                    );
                    return Ok(());
                }
            };

            log::debug!(
                "[Event API] Entity {} emitting event '{}'",
                entity_id,
                event_type
            );

            // Emit the event globally
            event_bus_emit.emit(event_type, json_payload);

            Ok(())
        },
    )?;

    events_table.set("emit", emit_fn)?;

    // Set as global
    lua.globals().set("events", events_table)?;

    Ok(())
}

/// Convert serde_json::Value to mlua::Value
fn json_to_lua(lua: &Lua, value: &serde_json::Value) -> LuaResult<mlua::Value> {
    match value {
        serde_json::Value::Null => Ok(mlua::Value::Nil),
        serde_json::Value::Bool(b) => Ok(mlua::Value::Boolean(*b)),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(mlua::Value::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(mlua::Value::Number(f))
            } else {
                Ok(mlua::Value::Nil)
            }
        }
        serde_json::Value::String(s) => Ok(mlua::Value::String(lua.create_string(s)?)),
        serde_json::Value::Array(arr) => {
            let table = lua.create_table()?;
            for (i, v) in arr.iter().enumerate() {
                table.set(i + 1, json_to_lua(lua, v)?)?;
            }
            Ok(mlua::Value::Table(table))
        }
        serde_json::Value::Object(obj) => {
            let table = lua.create_table()?;
            for (k, v) in obj {
                table.set(k.as_str(), json_to_lua(lua, v)?)?;
            }
            Ok(mlua::Value::Table(table))
        }
    }
}

/// Convert mlua::Value to serde_json::Value
fn lua_to_json(lua: &Lua, value: mlua::Value) -> LuaResult<serde_json::Value> {
    match value {
        mlua::Value::Nil => Ok(serde_json::Value::Null),
        mlua::Value::Boolean(b) => Ok(serde_json::Value::Bool(b)),
        mlua::Value::Integer(i) => Ok(serde_json::Value::Number(serde_json::Number::from(i))),
        mlua::Value::Number(n) => Ok(serde_json::Value::Number(
            serde_json::Number::from_f64(n).unwrap_or(serde_json::Number::from(0)),
        )),
        mlua::Value::String(s) => Ok(serde_json::Value::String(s.to_str()?.to_string())),
        mlua::Value::Table(table) => {
            // Try to detect if this is an array or object
            let mut is_array = true;
            let mut max_array_index = 0;
            let mut object_pairs = Vec::new();

            for pair in table.clone().pairs::<mlua::Value, mlua::Value>() {
                let (key, value) = pair?;
                match key {
                    mlua::Value::Integer(i) => {
                        if i > 0 && i <= 2147483647 {
                            // Valid array index
                            max_array_index = max_array_index.max(i as usize);
                        } else {
                            is_array = false;
                        }
                        object_pairs.push((i.to_string(), lua_to_json(lua, value)?));
                    }
                    mlua::Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            if i > 0 && i <= 2147483647 {
                                max_array_index = max_array_index.max(i as usize);
                            } else {
                                is_array = false;
                            }
                        } else {
                            is_array = false;
                        }
                        object_pairs.push((n.to_string(), lua_to_json(lua, value)?));
                    }
                    mlua::Value::String(s) => {
                        is_array = false;
                        object_pairs.push((s.to_str()?.to_string(), lua_to_json(lua, value)?));
                    }
                    _ => {
                        is_array = false;
                        object_pairs.push(("[key]".to_string(), lua_to_json(lua, value)?));
                    }
                }
            }

            if is_array && max_array_index > 0 {
                // Treat as array
                let mut arr = Vec::with_capacity(max_array_index);
                for i in 1..=max_array_index {
                    let value = table.get(i)?;
                    arr.push(lua_to_json(lua, value)?);
                }
                Ok(serde_json::Value::Array(arr))
            } else {
                // Treat as object
                let mut obj = serde_json::Map::new();
                for (key, value) in object_pairs {
                    obj.insert(key, value);
                }
                Ok(serde_json::Value::Object(obj))
            }
        }
        mlua::Value::Function(_) => Ok(serde_json::Value::String("[function]".to_string())),
        mlua::Value::Thread(_) => Ok(serde_json::Value::String("[thread]".to_string())),
        mlua::Value::UserData(_) => Ok(serde_json::Value::String("[userdata]".to_string())),
        mlua::Value::LightUserData(_) => Ok(serde_json::Value::String("[lightuserdata]".to_string())),
    }
}

/// Cleanup all event handlers for an entity
///
/// Called when a script is destroyed or entity is removed
pub fn cleanup_event_api(_lua: &Lua, entity_id: u32) -> LuaResult<()> {
    log::debug!(
        "[Event API] Cleaning up event handlers for entity {}",
        entity_id
    );

    // Get all subscriber IDs for this entity
    let subscriber_ids = {
        let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
        subscriptions.remove(&entity_id).unwrap_or_default()
    };

    // Get event bus from global registry
    {
        let mut buses = EVENT_BUSES.lock().unwrap();
        if let Some(event_bus) = buses.remove(&entity_id) {
            // Unsubscribe all handlers
            for subscriber_id in subscriber_ids {
                event_bus.off(subscriber_id);
            }
        }
    }

    Ok(())
}

/// Dispatch an event to Lua handlers from the SceneEventBus
///
/// This function should be called by SceneEventBus.pump_events() to dispatch
/// events to Lua handlers.
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `envelope` - The event envelope to dispatch
pub fn dispatch_event_to_lua(_lua: &Lua, envelope: &EventEnvelope) -> LuaResult<()> {
    log::debug!(
        "[Event API] Dispatching event '{}' to Lua handlers",
        envelope.key.0
    );

    // For now, we'll implement a simple dispatch mechanism that looks up
    // handlers in all Lua VMs. In a more sophisticated implementation,
    // we could maintain a global registry of event handlers.

    // This is a placeholder - the actual dispatch will be handled by the
    // event bus's pump_events method calling the stored Lua handlers
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use mlua::Lua;
    use serde_json::json;

    #[test]
    fn test_json_to_lua_conversion() {
        let lua = Lua::new();

        // Test null
        let result = json_to_lua(&lua, &json!(null)).unwrap();
        assert!(matches!(result, mlua::Value::Nil));

        // Test boolean
        let result = json_to_lua(&lua, &json!(true)).unwrap();
        assert!(matches!(result, mlua::Value::Boolean(true)));

        // Test number
        let result = json_to_lua(&lua, &json!(42)).unwrap();
        assert!(matches!(result, mlua::Value::Integer(42)));

        // Test string
        let result = json_to_lua(&lua, &json!("hello")).unwrap();
        if let mlua::Value::String(s) = result {
            assert_eq!(s.to_str().unwrap(), "hello");
        } else {
            panic!("Expected string");
        }

        // Test array
        let result = json_to_lua(&lua, &json!([1, 2, 3])).unwrap();
        if let mlua::Value::Table(table) = result {
            assert_eq!(table.len().unwrap(), 3);
            assert_eq!(table.get::<_, i32>(1).unwrap(), 1);
            assert_eq!(table.get::<_, i32>(2).unwrap(), 2);
            assert_eq!(table.get::<_, i32>(3).unwrap(), 3);
        } else {
            panic!("Expected table");
        }

        // Test object
        let result = json_to_lua(&lua, &json!({"key": "value"})).unwrap();
        if let mlua::Value::Table(table) = result {
            assert_eq!(table.get::<_, String>("key").unwrap(), "value");
        } else {
            panic!("Expected table");
        }
    }

    #[test]
    fn test_lua_to_json_conversion() {
        let lua = Lua::new();

        // Test nil
        let result = lua_to_json(&lua, mlua::Value::Nil).unwrap();
        assert!(result.is_null());

        // Test boolean
        let result = lua_to_json(&lua, mlua::Value::Boolean(true)).unwrap();
        assert_eq!(result, json!(true));

        // Test number
        let result = lua_to_json(&lua, mlua::Value::Integer(42)).unwrap();
        assert_eq!(result, json!(42));

        // Test string
        let result = lua_to_json(&lua, mlua::Value::String(lua.create_string("hello").unwrap())).unwrap();
        assert_eq!(result, json!("hello"));
    }
}