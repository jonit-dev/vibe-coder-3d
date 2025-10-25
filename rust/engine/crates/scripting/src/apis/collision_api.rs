/// Collision API for Lua scripts
///
/// Provides physics collision and trigger event callbacks.
/// Follows the same pattern as EventAPI for Lua callback management.
///
/// TypeScript Reference: src/core/lib/scripting/apis/PhysicsEventsAPI.ts
///
/// ## Usage from Lua
///
/// ```lua
/// function onStart()
///     -- Register collision callbacks
///     entity.collision:onEnter(function(otherEntityId)
///         console.log("Collision with entity: " .. tostring(otherEntityId))
///     end)
///
///     entity.collision:onExit(function(otherEntityId)
///         console.log("Stopped colliding with: " .. tostring(otherEntityId))
///     end)
///
///     -- Register trigger callbacks
///     entity.collision:onTriggerEnter(function(otherEntityId)
///         console.log("Trigger entered: " .. tostring(otherEntityId))
///     end)
/// end
/// ```

use mlua::{Function, Lua, Result as LuaResult, Table};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use vibe_scene::EntityId;

/// Physics event types
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum PhysicsEventType {
    CollisionEnter,
    CollisionExit,
    CollisionStay,
    TriggerEnter,
    TriggerExit,
}

impl std::fmt::Display for PhysicsEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PhysicsEventType::CollisionEnter => write!(f, "collisionEnter"),
            PhysicsEventType::CollisionExit => write!(f, "collisionExit"),
            PhysicsEventType::CollisionStay => write!(f, "collisionStay"),
            PhysicsEventType::TriggerEnter => write!(f, "triggerEnter"),
            PhysicsEventType::TriggerExit => write!(f, "triggerExit"),
        }
    }
}

/// Global collision event bus singleton
/// Maps entity ID to event type to handler IDs
static COLLISION_EVENT_BUS: Lazy<Arc<Mutex<HashMap<u64, HashMap<PhysicsEventType, Vec<u64>>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Handler ID counter for tracking registered handlers
static HANDLER_ID_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| Arc::new(Mutex::new(0)));

/// Handler ID to entity ID and event type mapping for cleanup
static HANDLER_INFO: Lazy<Arc<Mutex<HashMap<u64, (u64, PhysicsEventType)>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Create collision API for an entity
/// Returns a Lua table with callback registration methods
pub fn create_collision_api(lua: &Lua, entity_id: EntityId) -> LuaResult<Table> {
    let collision_table = lua.create_table()?;
    let entity_id_u64 = entity_id.as_u64();

    // collision:onEnter(handler) -> handlerId
    let on_enter_fn = lua.create_function(
        move |lua, (_self, handler): (Table, Function)| {
            let handler_id = register_collision_handler(
                lua,
                entity_id_u64,
                PhysicsEventType::CollisionEnter,
                handler,
            )?;
            Ok(handler_id)
        },
    )?;
    collision_table.set("onEnter", on_enter_fn)?;

    // collision:onExit(handler) -> handlerId
    let on_exit_fn = lua.create_function(
        move |lua, (_self, handler): (Table, Function)| {
            let handler_id = register_collision_handler(
                lua,
                entity_id_u64,
                PhysicsEventType::CollisionExit,
                handler,
            )?;
            Ok(handler_id)
        },
    )?;
    collision_table.set("onExit", on_exit_fn)?;

    // collision:onStay(handler) -> handlerId
    let on_stay_fn = lua.create_function(
        move |lua, (_self, handler): (Table, Function)| {
            let handler_id = register_collision_handler(
                lua,
                entity_id_u64,
                PhysicsEventType::CollisionStay,
                handler,
            )?;
            Ok(handler_id)
        },
    )?;
    collision_table.set("onStay", on_stay_fn)?;

    // collision:onTriggerEnter(handler) -> handlerId
    let on_trigger_enter_fn = lua.create_function(
        move |lua, (_self, handler): (Table, Function)| {
            let handler_id = register_collision_handler(
                lua,
                entity_id_u64,
                PhysicsEventType::TriggerEnter,
                handler,
            )?;
            Ok(handler_id)
        },
    )?;
    collision_table.set("onTriggerEnter", on_trigger_enter_fn)?;

    // collision:onTriggerExit(handler) -> handlerId
    let on_trigger_exit_fn = lua.create_function(
        move |lua, (_self, handler): (Table, Function)| {
            let handler_id = register_collision_handler(
                lua,
                entity_id_u64,
                PhysicsEventType::TriggerExit,
                handler,
            )?;
            Ok(handler_id)
        },
    )?;
    collision_table.set("onTriggerExit", on_trigger_exit_fn)?;

    Ok(collision_table)
}

/// Register a collision handler in the global registry
fn register_collision_handler(
    lua: &Lua,
    entity_id: u64,
    event_type: PhysicsEventType,
    handler: Function,
) -> LuaResult<u64> {
    // Generate unique handler ID
    let handler_id = {
        let mut counter = HANDLER_ID_COUNTER.lock().unwrap();
        *counter += 1;
        *counter
    };

    // Store handler in Lua registry to keep it alive
    let registry_key = format!("collision_handler_{}_{}", entity_id, handler_id);
    lua.set_named_registry_value(&registry_key, handler)?;

    // Track handler info for cleanup
    {
        let mut handler_info = HANDLER_INFO.lock().unwrap();
        handler_info.insert(handler_id, (entity_id, event_type.clone()));
    }

    // Register in global event bus
    {
        let mut event_bus = COLLISION_EVENT_BUS.lock().unwrap();
        let entity_events = event_bus.entry(entity_id).or_insert_with(HashMap::new);
        entity_events
            .entry(event_type.clone())
            .or_insert_with(Vec::new)
            .push(handler_id);
    }

    log::debug!(
        "[Collision API] Entity {} registered handler {} for '{}'",
        entity_id,
        handler_id,
        event_type
    );

    Ok(handler_id)
}

/// Dispatch a physics event to all registered callbacks
/// Called by the physics system when collisions/triggers occur
pub fn dispatch_physics_event(
    lua: &Lua,
    entity_id: EntityId,
    event_type: PhysicsEventType,
    other_entity_id: EntityId,
) -> LuaResult<()> {
    let entity_id_u64 = entity_id.as_u64();
    let other_entity_id_num = other_entity_id.as_u64() as f64;

    let event_bus = COLLISION_EVENT_BUS.lock().unwrap();
    let Some(entity_events) = event_bus.get(&entity_id_u64) else {
        return Ok(()); // No callbacks registered for this entity
    };

    let Some(handler_ids) = entity_events.get(&event_type) else {
        return Ok(()); // No callbacks for this event type
    };

    log::debug!(
        "[Collision API] Dispatching '{}' from entity {} to {} handlers",
        event_type,
        entity_id_u64,
        handler_ids.len()
    );

    // Call all registered handlers
    for &handler_id in handler_ids {
        let registry_key = format!("collision_handler_{}_{}", entity_id_u64, handler_id);
        if let Ok(handler) = lua.named_registry_value::<Function>(&registry_key) {
            if let Err(e) = handler.call::<()>(other_entity_id_num) {
                log::error!(
                    "[Collision API] Error in {} callback for entity {}: {}",
                    event_type,
                    entity_id_u64,
                    e
                );
            }
        } else {
            log::warn!(
                "[Collision API] Handler {} not found in registry for entity {}",
                handler_id,
                entity_id_u64
            );
        }
    }

    Ok(())
}

/// Clean up all collision handlers for an entity
/// Should be called when entity is destroyed
pub fn cleanup_collision_api(entity_id: EntityId) {
    let entity_id_u64 = entity_id.as_u64();

    // Remove from event bus
    {
        let mut event_bus = COLLISION_EVENT_BUS.lock().unwrap();
        event_bus.remove(&entity_id_u64);
    }

    // Remove handler info entries and Lua registry entries
    let handlers_to_remove: Vec<u64> = {
        let mut handler_info = HANDLER_INFO.lock().unwrap();
        handler_info
            .iter()
            .filter(|(_, (eid, _))| *eid == entity_id_u64)
            .map(|(handler_id, _)| *handler_id)
            .collect()
    };

    // Note: We can't remove from Lua registry here without a Lua instance
    // This cleanup happens when the script context is destroyed
    {
        let mut handler_info = HANDLER_INFO.lock().unwrap();
        for handler_id in &handlers_to_remove {
            handler_info.remove(handler_id);
        }
    }

    log::debug!(
        "[Collision API] Cleaned up {} handlers for entity {}",
        handlers_to_remove.len(),
        entity_id_u64
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_scene::Entity;

    #[test]
    fn test_create_collision_api() {
        let lua = Lua::new();
        let entity_id = EntityId::new(42);

        let collision_api = create_collision_api(&lua, entity_id).unwrap();

        // Verify all methods exist
        let has_on_enter: bool = lua
            .load("return type(collision_api.onEnter) == 'function'")
            .eval()
            .unwrap();
        assert!(has_on_enter);

        let has_on_exit: bool = lua
            .load("return type(collision_api.onExit) == 'function'")
            .eval()
            .unwrap();
        assert!(has_on_exit);

        let has_on_stay: bool = lua
            .load("return type(collision_api.onStay) == 'function'")
            .eval()
            .unwrap();
        assert!(has_on_stay);

        let has_on_trigger_enter: bool = lua
            .load("return type(collision_api.onTriggerEnter) == 'function'")
            .eval()
            .unwrap();
        assert!(has_on_trigger_enter);

        let has_on_trigger_exit: bool = lua
            .load("return type(collision_api.onTriggerExit) == 'function'")
            .eval()
            .unwrap();
        assert!(has_on_trigger_exit);
    }

    #[test]
    fn test_collision_callback_registration() {
        let lua = Lua::new();
        let entity_id = EntityId::new(42);

        lua.globals().set("collision", create_collision_api(&lua, entity_id).unwrap()).unwrap();

        // Create a counter to track callback invocations
        lua.globals().set("collision_count", 0).unwrap();

        // Register a callback that increments counter
        lua.load(
            r#"
            local handler_id = collision.onEnter(function(otherId)
                collision_count = collision_count + 1
            end)
            return handler_id
            "#,
        )
        .call()
        .unwrap();

        // Verify callback was registered
        let event_bus = COLLISION_EVENT_BUS.lock().unwrap();
        let entity_events = event_bus.get(&entity_id.as_u64()).unwrap();
        let handlers = entity_events.get(&PhysicsEventType::CollisionEnter).unwrap();
        assert_eq!(handlers.len(), 1);
    }

    #[test]
    fn test_dispatch_physics_event() {
        let lua = Lua::new();
        let entity_id = EntityId::new(1);
        let other_entity_id = EntityId::new(2);

        lua.globals().set("collision", create_collision_api(&lua, entity_id).unwrap()).unwrap();

        // Create a counter to track callback invocations
        lua.globals().set("collision_count", 0).unwrap();

        // Register a callback that increments counter
        lua.load(
            r#"
            collision.onEnter(function(otherId)
                collision_count = collision_count + 1
            end)
            "#,
        )
        .exec()
        .unwrap();

        // Dispatch event
        dispatch_physics_event(
            &lua,
            entity_id,
            PhysicsEventType::CollisionEnter,
            other_entity_id,
        )
        .unwrap();

        // Verify callback was called
        let count: i32 = lua.globals().get("collision_count").unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_cleanup_collision_api() {
        let entity_id = EntityId::new(42);

        // Add some handlers first (we'll use the internal API for testing)
        {
            let mut event_bus = COLLISION_EVENT_BUS.lock().unwrap();
            let entity_events = event_bus.entry(entity_id.as_u64()).or_insert_with(HashMap::new);
            entity_events
                .entry(PhysicsEventType::CollisionEnter)
                .or_insert_with(Vec::new)
                .push(123);
            entity_events
                .entry(PhysicsEventType::CollisionExit)
                .or_insert_with(Vec::new)
                .push(456);

            let mut handler_info = HANDLER_INFO.lock().unwrap();
            handler_info.insert(123, (entity_id.as_u64(), PhysicsEventType::CollisionEnter));
            handler_info.insert(456, (entity_id.as_u64(), PhysicsEventType::CollisionExit));
        }

        // Verify handlers exist
        {
            let event_bus = COLLISION_EVENT_BUS.lock().unwrap();
            assert!(event_bus.contains_key(&entity_id.as_u64()));
        }

        // Clean up
        cleanup_collision_api(entity_id);

        // Verify handlers removed
        {
            let event_bus = COLLISION_EVENT_BUS.lock().unwrap();
            assert!(!event_bus.contains_key(&entity_id.as_u64()));
        }
    }

    #[test]
    fn test_physics_event_type_display() {
        assert_eq!(PhysicsEventType::CollisionEnter.to_string(), "collisionEnter");
        assert_eq!(PhysicsEventType::CollisionExit.to_string(), "collisionExit");
        assert_eq!(PhysicsEventType::CollisionStay.to_string(), "collisionStay");
        assert_eq!(PhysicsEventType::TriggerEnter.to_string(), "triggerEnter");
        assert_eq!(PhysicsEventType::TriggerExit.to_string(), "triggerExit");
    }
}