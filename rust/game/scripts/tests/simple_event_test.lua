-- Simple test to verify SceneEventBus integration works
-- This will create test output we can verify

local eventCount = 0

function onStart()
    console:log("Starting SceneEventBus test")

    -- Register a simple event listener
    events:on("test:event", function(data)
        eventCount = eventCount + 1
        console:log("Received event #" .. eventCount .. " with data:", data.testValue)
    end)

    -- Test emitting an event immediately
    console:log("Emitting test event")
    events:emit("test:event", { testValue = "hello from SceneEventBus" })

    -- Verify event was received
    if eventCount == 1 then
        console:log("✅ SceneEventBus test PASSED - event received")
    else
        console:log("❌ SceneEventBus test FAILED - expected 1 event, got " .. eventCount)
    end
end

function onDestroy()
    console:log("SceneEventBus test cleanup - total events received:", eventCount)
end