//! Integration tests for the complete event system
//!
//! These tests demonstrate the full event pipeline:
//! SceneEventBus → SceneManager → Lua API → Physics Bridge

#[cfg(test)]
mod tests {
    use crate::{SceneEventBus, EventEnvelope, EventKey, keys};
    use std::sync::{Arc, Mutex};

    #[test]
    fn test_end_to_end_event_flow() {
        // Create event bus
        let event_bus = Arc::new(SceneEventBus::new());

        // Test data
        let entity_a = vibe_scene::EntityId::new(1);
        let entity_b = vibe_scene::EntityId::new(2);
        let test_payload = serde_json::json!({
            "message": "Hello World",
            "value": 42
        });

        // Set up event handlers
        let counter = Arc::new(Mutex::new(0));
        let counter_clone = counter.clone();

        // Global subscriber
        let global_sub_id = event_bus.on_global("test:event", move |_env| {
            let mut c = counter_clone.lock().unwrap();
            *c += 1;
        });

        // Entity-specific subscriber
        let entity_counter = Arc::new(Mutex::new(0));
        let entity_counter_clone = entity_counter.clone();

        let entity_sub_id = event_bus.on_entity(entity_a, "test:event", move |_env| {
            let mut c = entity_counter_clone.lock().unwrap();
            *c += 1;
        });

        // Emit events
        event_bus.emit(keys::SCENE_LOADED, test_payload.clone());
        event_bus.emit_to(entity_a, "test:event", test_payload.clone());
        event_bus.emit_to(entity_b, "test:event", test_payload);

        // Process events
        let mut processed_events = Vec::new();
        event_bus.pump_events(|env| {
            processed_events.push(env.clone());
        });

        // Verify results
        assert_eq!(*counter.lock().unwrap(), 2); // Global handler receives only the 2 "test:event" events
        assert_eq!(*entity_counter.lock().unwrap(), 1); // Entity handler receives only its targeted event
        assert_eq!(processed_events.len(), 3);

        // Test event key constants
        assert_eq!(processed_events[0].key.0, keys::SCENE_LOADED);
        assert_eq!(processed_events[1].key.0, "test:event");
        assert_eq!(processed_events[2].key.0, "test:event");

        // Cleanup
        event_bus.off(global_sub_id);
        event_bus.off(entity_sub_id);

        // Emit another event to verify cleanup worked
        event_bus.emit("test:event", serde_json::json!({}));
        event_bus.pump_events(|_| {});

        // Counters should not have increased since handlers were unsubscribed
        assert_eq!(*counter.lock().unwrap(), 2);
        assert_eq!(*entity_counter.lock().unwrap(), 1);
    }

    #[test]
    fn test_event_key_constants() {
        // Verify all key constants are accessible
        let _keys = vec![
            keys::SCENE_LOADED,
            keys::SCENE_UNLOADED,
            keys::PHYSICS_COLLISION,
            keys::PHYSICS_TRIGGER,
            keys::AUDIO_PLAY,
            keys::AUDIO_STOP,
            keys::GAME_SCORE_CHANGED,
            keys::GAME_STATE_CHANGED,
            keys::UI_SHOW,
            keys::UI_HIDE,
            keys::ENTITY_SPAWNED,
            keys::ENTITY_DESTROYED,
            keys::ENTITY_COMPONENT_ADDED,
            keys::ENTITY_COMPONENT_REMOVED,
        ];

        // Test they can be converted to EventKey
        let event_key: EventKey = keys::PHYSICS_COLLISION.into();
        assert_eq!(event_key.0, "physics:collision");
    }

    #[test]
    fn test_event_envelope_creation() {
        let entity_id = vibe_scene::EntityId::new(42);
        let payload = serde_json::json!({"test": true});

        // Test global event envelope
        let global_envelope = EventEnvelope::new("test:event", payload.clone());
        assert_eq!(global_envelope.key.0, "test:event");
        assert_eq!(global_envelope.target, None);

        // Test targeted event envelope
        let targeted_envelope = EventEnvelope::targeted(entity_id, "test:event", payload);
        assert_eq!(targeted_envelope.key.0, "test:event");
        assert_eq!(targeted_envelope.target, Some(entity_id));
    }

    #[test]
    fn test_scene_event_bus_statistics() {
        let event_bus = SceneEventBus::new();

        // Initially empty
        assert_eq!(event_bus.pending_count(), 0);
        assert_eq!(event_bus.subscription_count(), 0);

        // Add subscription
        let sub_id = event_bus.on_global("test:event", |_| {});
        assert_eq!(event_bus.subscription_count(), 1);

        // Add event
        event_bus.emit("test:event", serde_json::json!({}));
        assert_eq!(event_bus.pending_count(), 1);

        // Process events
        event_bus.pump_events(|_| {});
        assert_eq!(event_bus.pending_count(), 0);

        // Remove subscription
        event_bus.off(sub_id);
        assert_eq!(event_bus.subscription_count(), 0);
    }

    #[test]
    fn test_high_volume_events() {
        let event_bus = SceneEventBus::new();
        let counter = Arc::new(Mutex::new(0));
        let counter_clone = counter.clone();

        // Subscribe
        event_bus.on_global("bulk:test", move |_| {
            let mut c = counter_clone.lock().unwrap();
            *c += 1;
        });

        // Emit many events
        for i in 0..100 {
            event_bus.emit("bulk:test", serde_json::json!({"index": i}));
        }

        // Process all at once
        event_bus.pump_events(|_| {});

        // Verify all were processed
        assert_eq!(*counter.lock().unwrap(), 100);
        assert_eq!(event_bus.pending_count(), 0);
    }

    #[test]
    fn test_multiple_handlers_for_same_event() {
        let event_bus = SceneEventBus::new();
        let counter1 = Arc::new(Mutex::new(0));
        let counter2 = Arc::new(Mutex::new(0));
        let counter3 = Arc::new(Mutex::new(0));

        let counter1_clone = counter1.clone();
        let counter2_clone = counter2.clone();
        let counter3_clone = counter3.clone();

        // Add multiple handlers for the same event
        event_bus.on_global("test:multiple", move |_| {
            let mut c = counter1_clone.lock().unwrap();
            *c += 1;
        });

        event_bus.on_global("test:multiple", move |_| {
            let mut c = counter2_clone.lock().unwrap();
            *c += 1;
        });

        event_bus.on_entity(vibe_scene::EntityId::new(1), "test:multiple", move |_| {
            let mut c = counter3_clone.lock().unwrap();
            *c += 1;
        });

        // Emit targeted event
        event_bus.emit_to(vibe_scene::EntityId::new(1), "test:multiple", serde_json::json!({}));

        // Process events
        event_bus.pump_events(|_| {});

        // All handlers should be called (global + entity-specific)
        assert_eq!(*counter1.lock().unwrap(), 1);
        assert_eq!(*counter2.lock().unwrap(), 1);
        assert_eq!(*counter3.lock().unwrap(), 1);
    }
}