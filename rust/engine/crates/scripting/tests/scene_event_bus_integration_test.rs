#[cfg(test)]
mod tests {
    use mlua::Lua;
    use serde_json::json;
    use std::sync::Arc;
    use vibe_events::SceneEventBus;
    use vibe_scripting::apis::register_event_api;

    #[test]
    fn test_scene_event_bus_integration() {
        let lua = Lua::new();
        let event_bus = Arc::new(SceneEventBus::new());
        let entity_id = 42;

        // Register the event API
        register_event_api(&lua, entity_id, event_bus.clone()).unwrap();

        // Register a Rust listener to verify events flow through SceneEventBus
        let event_received = Arc::new(std::sync::Mutex::new(false));
        let event_received_clone = event_received.clone();

        event_bus.on_entity(
            vibe_scene::EntityId::new(entity_id as u64),
            "test:event",
            move |envelope| {
                let mut received = event_received_clone.lock().unwrap();
                *received = true;

                // Verify the event payload
                if let Some(data) = envelope.payload.get("testValue") {
                    assert_eq!(data, "hello from SceneEventBus");
                } else {
                    panic!("Expected testValue in event payload");
                }
            },
        );

        // Execute Lua code that emits an event
        let lua_code = r#"
            events:on("test:event", function(data)
                console:log("Lua received event:", data.testValue)
            end)

            events:emit("test:event", { testValue = "hello from SceneEventBus" })
        "#;

        lua.load(lua_code).exec().unwrap();

        // Pump events through SceneEventBus
        event_bus.pump_events(|_envelope| {
            // This is where Lua dispatch would happen in real usage
        });

        // Verify the Rust handler received the event
        let received = event_received.lock().unwrap();
        assert!(*received, "Event should have been received by Rust handler");

        println!("✅ SceneEventBus integration test PASSED");
    }

    #[test]
    fn test_event_cleanup() {
        let lua = Lua::new();
        let event_bus = Arc::new(SceneEventBus::new());
        let entity_id = 123;

        // Register the event API
        register_event_api(&lua, entity_id, event_bus.clone()).unwrap();

        // Subscribe to an event
        let lua_code = r#"
            local handler = events:on("test:cleanup", function(data)
                console:log("Should not reach here")
            end)
            return handler
        "#;

        let handler_id: u64 = lua.load(lua_code).eval().unwrap();

        // Verify the subscription exists
        assert_eq!(event_bus.subscription_count(), 1);

        // Call cleanup
        vibe_scripting::apis::cleanup_event_api(&lua, entity_id).unwrap();

        // Verify the subscription was cleaned up
        assert_eq!(event_bus.subscription_count(), 0);

        // Emit an event - should not reach any handler
        event_bus.emit("test:cleanup", json!({}));

        // Pump events - should not cause any issues
        event_bus.pump_events(|_envelope| {});

        println!("✅ Event cleanup test PASSED");
    }

    #[test]
    fn test_multi_entity_events() {
        let lua1 = Lua::new();
        let lua2 = Lua::new();
        let event_bus = Arc::new(SceneEventBus::new());
        let entity_id1 = 1;
        let entity_id2 = 2;

        // Register event APIs for two different entities
        register_event_api(&lua1, entity_id1, event_bus.clone()).unwrap();
        register_event_api(&lua2, entity_id2, event_bus.clone()).unwrap();

        // Register listeners in each Lua VM
        let lua1_code = r#"
            events:on("test:multi", function(data)
                console:log("Entity 1 received:", data.message)
            end)
        "#;

        let lua2_code = r#"
            events:on("test:multi", function(data)
                console:log("Entity 2 received:", data.message)
            end)
        "#;

        lua1.load(lua1_code).exec().unwrap();
        lua2.load(lua2_code).exec().unwrap();

        // Both entities should receive the event
        event_bus.emit("test:multi", json!({ "message": "broadcast test" }));

        // Pump events
        event_bus.pump_events(|_envelope| {
            // In real implementation, this would dispatch to Lua handlers
        });

        // Both entities should have subscriptions
        assert_eq!(event_bus.subscription_count(), 2);

        println!("✅ Multi-entity events test PASSED");
    }
}
