-- Collision Logger Script
-- Tests Physics API: collision events (onCollisionEnter, onCollisionExit)

local collisionCount = 0

function onStart()
    console:log("Collision Logger - START")
    console:log("Listening for collision events...")

    -- Register collision event handlers
    if entity.physicsEvents then
        entity.physicsEvents:onCollisionEnter(function(otherEntityId)
            collisionCount = collisionCount + 1
            console:log(string.format("COLLISION ENTER #%d with entity ID: %s", collisionCount, tostring(otherEntityId)))
        end)

        entity.physicsEvents:onCollisionExit(function(otherEntityId)
            console:log(string.format("COLLISION EXIT with entity ID: %s", tostring(otherEntityId)))
        end)
    else
        console:log("WARNING: entity.physicsEvents not available")
    end
end

function onUpdate(deltaTime)
    -- Collision events are handled by callbacks
end
