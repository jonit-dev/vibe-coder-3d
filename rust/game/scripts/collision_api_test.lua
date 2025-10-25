-- Collision API Test
-- Tests the Collision API functionality for physics event callbacks

function onStart()
    console:log("=== Collision API Test Started ===")

    -- Check if entity has collision API
    if entity.collision then
        console:log("Entity has collision API available")

        -- Test collision.onEnter
        console:log("Testing collision.onEnter...")
        entity.collision:onEnter(function(other)
            console:log("Collision entered with entity: " .. tostring(other.id))
        end)

        -- Test collision.onExit
        console:log("Testing collision.onExit...")
        entity.collision:onExit(function(other)
            console:log("Collision exited with entity: " .. tostring(other.id))
        end)

        -- Test collision.onStay
        console:log("Testing collision.onStay...")
        entity.collision:onStay(function(other)
            console:log("Collision staying with entity: " .. tostring(other.id))
        end)

        -- Test collision.onTriggerEnter
        console:log("Testing collision.onTriggerEnter...")
        entity.collision:onTriggerEnter(function(other)
            console:log("Trigger entered with entity: " .. tostring(other.id))
        end)

        -- Test collision.onTriggerExit
        console:log("Testing collision.onTriggerExit...")
        entity.collision:onTriggerExit(function(other)
            console:log("Trigger exited with entity: " .. tostring(other.id))
        end)

        console:log("=== Collision API Test Completed Successfully ===")
    else
        console:log("Entity does not have collision API")
        console:log("=== Collision API Test Skipped ===")
    end
end

function onUpdate(deltaTime)
    -- Collision API test only needs to run once
end