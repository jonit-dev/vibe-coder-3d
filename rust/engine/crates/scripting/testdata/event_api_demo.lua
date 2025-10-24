-- Event API Demo Script
-- Demonstrates inter-entity communication using the event bus

-- Track received events
local receivedEvents = {}

function onStart()
    console:log("Event API Demo - Starting")

    -- Register handlers for different event types
    local handler1 = events:on("player:scored", function(data)
        console:log("Score event received:", data.points)
        table.insert(receivedEvents, {type = "score", points = data.points})
    end)

    local handler2 = events:on("game:paused", function(data)
        console:log("Game paused!")
        table.insert(receivedEvents, {type = "pause"})
    end)

    -- Emit test events
    events:emit("player:scored", {points = 100})
    events:emit("player:scored", {points = 250})
    events:emit("game:paused", {})

    -- Log results
    console:log("Total events received:", #receivedEvents)
    for i, event in ipairs(receivedEvents) do
        if event.type == "score" then
            console:log("  Event", i, "- Score:", event.points)
        else
            console:log("  Event", i, "- Type:", event.type)
        end
    end
end

function onUpdate(dt)
    -- Could emit frame-based events here
end

function onDestroy()
    console:log("Event API Demo - Cleanup")
    -- Event handlers are automatically cleaned up
end
