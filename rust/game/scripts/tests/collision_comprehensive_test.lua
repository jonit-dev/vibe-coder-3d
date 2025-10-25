-- Comprehensive Collision API Test
-- Tests collision and trigger events with multiple objects and scenarios

function onStart()
    console.log("=== Comprehensive Collision API Test Started ===")

    -- Check if entity has collision API
    if entity.collision then
        console.log("Entity " .. entity.name .. " has collision API available")

        -- Test different collision/trigger events based on entity name
        if entity.name == "Dynamic Cube Blue" then
            console.log("Setting up collision handlers for Blue Cube...")

            -- Collision enter - change to red when hitting other objects
            entity.collision:onEnter(function(otherEntityId)
                console.log("BLUE CUBE: COLLISION ENTER with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#ff0000")
                end
            end)

            -- Collision exit - change back to blue when collision ends
            entity.collision:onExit(function(otherEntityId)
                console.log("BLUE CUBE: COLLISION EXIT with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#0066ff")
                end
            end)

            -- Trigger enter - make emissive when entering trigger
            entity.collision:onTriggerEnter(function(otherEntityId)
                console.log("BLUE CUBE: TRIGGER ENTER with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setEmissive("#0066ff", 1.0)
                end
            end)

            -- Trigger exit - remove emissive when leaving trigger
            entity.collision:onTriggerExit(function(otherEntityId)
                console.log("BLUE CUBE: TRIGGER EXIT with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setEmissive("#000000", 0.0)
                end
            end)

        elseif entity.name == "Dynamic Cube Red" then
            console.log("Setting up collision handlers for Red Cube...")

            -- Red cube handlers - change roughness on collision
            entity.collision:onEnter(function(otherEntityId)
                console.log("RED CUBE: COLLISION ENTER with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setRoughness(0.9)
                end
            end)

            entity.collision:onExit(function(otherEntityId)
                console.log("RED CUBE: COLLISION EXIT with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setRoughness(0.5)
                end
            end)

        elseif entity.name == "Trigger Volume Green" then
            console.log("Setting up trigger handlers for Green Volume...")

            -- Green trigger handlers - change to lime when triggered
            entity.collision:onTriggerEnter(function(otherEntityId)
                console.log("GREEN TRIGGER: TRIGGER ENTER with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#00ff00")
                end
            end)

            entity.collision:onTriggerExit(function(otherEntityId)
                console.log("GREEN TRIGGER: TRIGGER EXIT with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#008800")
                end
            end)

        elseif entity.name == "Trigger Volume Yellow" then
            console.log("Setting up trigger handlers for Yellow Volume...")

            -- Yellow trigger handlers - change to orange when triggered
            entity.collision:onTriggerEnter(function(otherEntityId)
                console.log("YELLOW TRIGGER: TRIGGER ENTER with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#ff8800")
                end
            end)

            entity.collision:onTriggerExit(function(otherEntityId)
                console.log("YELLOW TRIGGER: TRIGGER EXIT with entity: " .. tostring(otherEntityId))
                if entity.meshRenderer and entity.meshRenderer.material then
                    entity.meshRenderer.material:setColor("#ffff00")
                end
            end)
        end

        console.log("=== Comprehensive Collision API Test Completed Successfully ===")
        console.log("All event handlers registered. Expected behaviors:")
        console.log("- Blue cube: Turns RED on collision, emissive BLUE on trigger")
        console.log("- Red cube: Changes roughness on collision")
        console.log("- Green trigger: Turns LIME when objects enter")
        console.log("- Yellow trigger: Turns ORANGE when objects enter")
        console.log("Watch for collision/trigger events in the console.")
    else
        console.log("Entity " .. entity.name .. " does not have collision API (no physics components)")
        console.log("=== Comprehensive Collision API Test Skipped ===")
    end
end

function onUpdate(deltaTime)
    -- Collision API test only needs to run once
    -- The actual collision events will be dispatched by the physics system
end