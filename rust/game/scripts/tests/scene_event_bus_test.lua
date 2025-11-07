-- Test script for SceneEventBus integration
-- This script tests that events flow through SceneEventBus correctly

local testResults = {}

function onStart()
    console:log("=== SceneEventBus Test Starting ===")

    -- Test 1: Register event listener
    local handler1 = events:on("test:event", function(data)
        console:log("Handler 1 received event:", data.message)
        table.insert(testResults, "handler1:" .. data.message)
    end)

    -- Test 2: Register another event listener for the same event
    local handler2 = events:on("test:event", function(data)
        console:log("Handler 2 received event:", data.message)
        table.insert(testResults, "handler2:" .. data.message)
    end)

    -- Test 3: Register listener for different event type
    local handler3 = events:on("test:other", function(data)
        console:log("Other handler received:", data.info)
        table.insert(testResults, "other:" .. data.info)
    end)

    -- Store handler IDs for cleanup test
    self.handler1 = handler1
    self.handler2 = handler2
    self.handler3 = handler3

    -- Test 4: Emit events
    console:log("Emitting test:event with message 'hello'")
    events:emit("test:event", { message = "hello" })

    console:log("Emitting test:other with info 'world'")
    events:emit("test:other", { info = "world" })

    console:log("Emitting test:event with message 'again'")
    events:emit("test:event", { message = "again" })

    -- Test 5: Test complex data structures
    console:log("Emitting complex event")
    events:emit("test:event", {
        message = "complex",
        number = 42,
        array = {1, 2, 3},
        nested = { key = "value" }
    })

    console:log("=== SceneEventBus Test Setup Complete ===")
    console:log("Results so far:", #testResults)
end

function onUpdate(deltaTime)
    -- Test 6: Emit events during update
    if not self.emittedUpdate then
        console:log("Emitting update event")
        events:emit("test:update", { frameTime = deltaTime })
        self.emittedUpdate = true
        table.insert(testResults, "update")
    end
end

function onDestroy()
    console:log("=== SceneEventBus Cleanup Test ===")

    -- Test 7: Unsubscribe specific handler
    if self.handler1 then
        console:log("Unsubscribing handler 1")
        events:off(self.handler1)
    end

    -- Test 8: Emit event after unsubscribe - only handler2 should receive it
    console:log("Emitting after unsubscribe")
    events:emit("test:event", { message = "cleanup" })

    -- Test 9: Check final results
    console:log("=== Final Test Results ===")
    for i, result in ipairs(testResults) do
        console:log("Result " .. i .. ":", result)
    end

    -- Expected results:
    -- 1. handler1:hello
    -- 2. handler2:hello
    -- 3. other:world
    -- 4. handler1:again
    -- 5. handler2:again
    -- 6. handler1:complex
    -- 7. handler2:complex
    -- 8. update
    -- 9. handler2:cleanup (only handler2 should receive this)

    local expectedCount = 9
    if #testResults == expectedCount then
        console:log("✅ SceneEventBus test PASSED - received " .. expectedCount .. " events")
    else
        console:log("❌ SceneEventBus test FAILED - expected " .. expectedCount .. " events, got " .. #testResults)
    end

    -- Verify specific events occurred
    local hasHello = false
    local hasWorld = false
    local hasCleanup = false

    for _, result in ipairs(testResults) do
        if result == "handler1:hello" or result == "handler2:hello" then
            hasHello = true
        end
        if result == "other:world" then
            hasWorld = true
        end
        if result == "handler2:cleanup" then
            hasCleanup = true
        end
    end

    if hasHello and hasWorld and hasCleanup then
        console:log("✅ SceneEventBus specific event test PASSED")
    else
        console:log("❌ SceneEventBus specific event test FAILED")
        console:log("  hasHello:", hasHello)
        console:log("  hasWorld:", hasWorld)
        console:log("  hasCleanup:", hasCleanup)
    end
end