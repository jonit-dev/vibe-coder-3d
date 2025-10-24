-- Trigger Logger Script
-- Tests Physics API: trigger events (onTriggerEnter, onTriggerExit)

local triggerCount = 0
local entitiesInTrigger = {}

function onStart()
    console:log("Trigger Logger - START")
    console:log("Listening for trigger events...")

    -- Register trigger event handlers
    if entity.physicsEvents then
        entity.physicsEvents:onTriggerEnter(function(otherEntityId)
            triggerCount = triggerCount + 1
            entitiesInTrigger[otherEntityId] = true
            console:log(string.format("TRIGGER ENTER #%d - Entity ID: %s", triggerCount, tostring(otherEntityId)))
            console:log(string.format("Entities in trigger zone: %d", countEntries(entitiesInTrigger)))
        end)

        entity.physicsEvents:onTriggerExit(function(otherEntityId)
            entitiesInTrigger[otherEntityId] = nil
            console:log(string.format("TRIGGER EXIT - Entity ID: %s", tostring(otherEntityId)))
            console:log(string.format("Entities in trigger zone: %d", countEntries(entitiesInTrigger)))
        end)
    else
        console:log("WARNING: entity.physicsEvents not available")
    end
end

function onUpdate(deltaTime)
    -- Trigger events are handled by callbacks
end

function countEntries(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end
