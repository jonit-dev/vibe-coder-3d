-- Collision API Test
-- Tests the Collision API functionality for entities with physics components

function onStart()
    console.log("=== Collision API Test Started ===")

    -- Check if entity has collision API
    if entity.collision then
        console.log("Entity has collision API available")

        -- Test collision.onEnter - change material to red on collision
        console.log("Testing collision.onEnter...")
        local onEnterHandlerId = entity.collision:onEnter(function(otherEntityId)
            console.log("COLLISION ENTER with entity: " .. tostring(otherEntityId))
            -- Change color to red to visualize collision
            if entity.meshRenderer and entity.meshRenderer.material then
                entity.meshRenderer.material:setColor("#ff0000")
            end
        end)
        console.log("Registered onEnter handler with ID: " .. tostring(onEnterHandlerId))

        -- Test collision.onExit - change material to blue when collision ends
        console.log("Testing collision.onExit...")
        local onExitHandlerId = entity.collision:onExit(function(otherEntityId)
            console.log("COLLISION EXIT with entity: " .. tostring(otherEntityId))
            -- Change color back to blue when collision ends
            if entity.meshRenderer and entity.meshRenderer.material then
                entity.meshRenderer.material:setColor("#0066ff")
            end
        end)
        console.log("Registered onExit handler with ID: " .. tostring(onExitHandlerId))

        -- Test collision.onStay
        console.log("Testing collision.onStay...")
        local onStayHandlerId = entity.collision:onStay(function(otherEntityId)
            console.log("COLLISION STAY with entity: " .. tostring(otherEntityId))
        end)
        console.log("Registered onStay handler with ID: " .. tostring(onStayHandlerId))

        -- Test collision.onTriggerEnter
        console.log("Testing collision.onTriggerEnter...")
        local onTriggerEnterHandlerId = entity.collision:onTriggerEnter(function(otherEntityId)
            console.log("TRIGGER ENTER with entity: " .. tostring(otherEntityId))
        end)
        console.log("Registered onTriggerEnter handler with ID: " .. tostring(onTriggerEnterHandlerId))

        -- Test collision.onTriggerExit
        console.log("Testing collision.onTriggerExit...")
        local onTriggerExitHandlerId = entity.collision:onTriggerExit(function(otherEntityId)
            console.log("TRIGGER EXIT with entity: " .. tostring(otherEntityId))
        end)
        console.log("Registered onTriggerExit handler with ID: " .. tostring(onTriggerExitHandlerId))

        console.log("=== Collision API Test Completed Successfully ===")
        console.log("All event handlers registered. Cube should turn RED on collision with floor.")
        console.log("Watch for collision events in the console.")
    else
        console.log("Entity does not have collision API (no physics components)")
        console.log("=== Collision API Test Skipped ===")
    end
end

function onUpdate(deltaTime)
    -- Collision API test only needs to run once
    -- The actual collision events will be dispatched by the physics system
end