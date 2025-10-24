///! Event API for Lua scripts
///!
///! Provides an event bus for inter-entity communication.
///! Scripts can emit events and listen for events from other entities.
use mlua::{Function, Lua, Result as LuaResult, Table, Value};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Type alias for event handlers
type EventHandler = Arc<dyn Fn(Vec<Value>) + Send + Sync>;

/// Global event bus singleton
/// Maps event types to lists of handler functions
static EVENT_BUS: Lazy<Arc<Mutex<HashMap<String, Vec<EventHandler>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Handler ID counter for tracking registered handlers
static HANDLER_ID_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| Arc::new(Mutex::new(0)));

/// Per-entity subscriptions for cleanup
/// Maps entity ID to handler IDs that need cleanup
static ENTITY_SUBSCRIPTIONS: Lazy<Arc<Mutex<HashMap<u32, Vec<u64>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Handler ID to event type mapping for cleanup
static HANDLER_TO_EVENT: Lazy<Arc<Mutex<HashMap<u64, String>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Register event API in the Lua environment
///
/// Creates a global `events` table with:
/// - events:on(eventType, handler) - Register event listener
/// - events:off(eventType, handler) - Unregister event listener
/// - events:emit(eventType, payload) - Emit event to all listeners
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `entity_id` - The entity ID (for cleanup tracking)
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
/// events:off("player:scored", handler)
/// ```
pub fn register_event_api(lua: &Lua, entity_id: u32) -> LuaResult<()> {
    let events_table = lua.create_table()?;

    // events:on(eventType, handler) -> handlerId
    let entity_id_on = entity_id;
    let on_fn = lua.create_function(
        move |lua, (_self, event_type, handler): (Table, String, Function)| {
            // Generate unique handler ID
            let handler_id = {
                let mut counter = HANDLER_ID_COUNTER.lock().unwrap();
                *counter += 1;
                *counter
            };

            // Store handler in registry to keep it alive
            let registry_key = format!("event_handler_{}_{}", entity_id_on, handler_id);
            lua.set_named_registry_value(&registry_key, handler.clone())?;

            // Track subscription for this entity
            {
                let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
                subscriptions
                    .entry(entity_id_on)
                    .or_insert_with(Vec::new)
                    .push(handler_id);
            }

            // Track which event type this handler ID belongs to
            {
                let mut handler_map = HANDLER_TO_EVENT.lock().unwrap();
                handler_map.insert(handler_id, event_type.clone());
            }

            // Create a wrapped handler that calls the Lua function
            // Clone event_type for the closure
            let event_type_for_log = event_type.clone();
            let handler_wrapper: EventHandler = Arc::new(move |_args: Vec<Value>| {
                // Note: We can't actually call the Lua function from Rust thread-safe context
                // This is handled differently in the emit function
                log::debug!(
                    "[Event API] Handler {} registered for '{}'",
                    handler_id,
                    event_type_for_log
                );
            });

            // Register the handler in the event bus
            {
                let mut bus = EVENT_BUS.lock().unwrap();
                bus.entry(event_type.clone())
                    .or_insert_with(Vec::new)
                    .push(handler_wrapper);
            }

            log::debug!(
                "[Event API] Entity {} registered handler {} for event '{}'",
                entity_id_on,
                handler_id,
                event_type
            );

            Ok(handler_id)
        },
    )?;

    events_table.set("on", on_fn)?;

    // events:off(eventType, handlerId)
    let entity_id_off = entity_id;
    let off_fn = lua.create_function(
        move |lua, (_self, event_type, handler_id): (Table, String, u64)| {
            // Remove from handler map
            {
                let mut handler_map = HANDLER_TO_EVENT.lock().unwrap();
                handler_map.remove(&handler_id);
            }

            // Remove from entity subscriptions
            {
                let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
                if let Some(handlers) = subscriptions.get_mut(&entity_id_off) {
                    handlers.retain(|&id| id != handler_id);
                }
            }

            // Remove from registry
            let registry_key = format!("event_handler_{}_{}", entity_id_off, handler_id);
            lua.unset_named_registry_value(&registry_key)?;

            log::debug!(
                "[Event API] Entity {} unregistered handler {} from event '{}'",
                entity_id_off,
                handler_id,
                event_type
            );

            Ok(())
        },
    )?;

    events_table.set("off", off_fn)?;

    // events:emit(eventType, payload)
    let emit_fn = lua.create_function(
        move |lua, (_self, event_type, payload): (Table, String, Value)| {
            // Get all registered handlers for this event type
            let handler_count = {
                let bus = EVENT_BUS.lock().unwrap();
                bus.get(&event_type)
                    .map(|handlers| handlers.len())
                    .unwrap_or(0)
            };

            if handler_count == 0 {
                log::debug!("[Event API] No handlers for event '{}'", event_type);
                return Ok(());
            }

            log::debug!(
                "[Event API] Emitting event '{}' to {} handlers",
                event_type,
                handler_count
            );

            // Call all handlers registered for this event type
            // We need to get the handlers from the Lua registry and call them
            let subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
            let handler_map = HANDLER_TO_EVENT.lock().unwrap();

            for (entity_id, handler_ids) in subscriptions.iter() {
                for handler_id in handler_ids {
                    // Check if this handler is for the event we're emitting
                    if let Some(handler_event_type) = handler_map.get(handler_id) {
                        if handler_event_type == &event_type {
                            // Get handler from registry
                            let registry_key =
                                format!("event_handler_{}_{}", entity_id, handler_id);
                            if let Ok(handler) = lua.named_registry_value::<Function>(&registry_key)
                            {
                                // Call the handler with the payload
                                if let Err(e) = handler.call::<()>(payload.clone()) {
                                    log::error!(
                                        "[Event API] Error calling handler {} for event '{}': {}",
                                        handler_id,
                                        event_type,
                                        e
                                    );
                                }
                            }
                        }
                    }
                }
            }

            Ok(())
        },
    )?;

    events_table.set("emit", emit_fn)?;

    // Set as global
    lua.globals().set("events", events_table)?;

    Ok(())
}

/// Cleanup all event handlers for an entity
///
/// Called when a script is destroyed or entity is removed
pub fn cleanup_event_api(lua: &Lua, entity_id: u32) -> LuaResult<()> {
    log::debug!(
        "[Event API] Cleaning up event handlers for entity {}",
        entity_id
    );

    // Get all handler IDs for this entity
    let handler_ids = {
        let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
        subscriptions.remove(&entity_id).unwrap_or_default()
    };

    // Remove each handler from the registry and handler map
    for handler_id in handler_ids {
        // Remove from handler map
        {
            let mut handler_map = HANDLER_TO_EVENT.lock().unwrap();
            handler_map.remove(&handler_id);
        }

        // Remove from Lua registry
        let registry_key = format!("event_handler_{}_{}", entity_id, handler_id);
        lua.unset_named_registry_value(&registry_key)?;
    }

    Ok(())
}

/// Clear all event handlers (for testing)
#[cfg(test)]
pub fn clear_all_events() {
    let mut bus = EVENT_BUS.lock().unwrap();
    bus.clear();

    let mut subscriptions = ENTITY_SUBSCRIPTIONS.lock().unwrap();
    subscriptions.clear();

    let mut handler_map = HANDLER_TO_EVENT.lock().unwrap();
    handler_map.clear();

    let mut counter = HANDLER_ID_COUNTER.lock().unwrap();
    *counter = 0;
}
