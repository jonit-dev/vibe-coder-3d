-- Collision Visual Test
-- Two cubes collide and change colors to prove collision detection works
-- Expected: Falling cube turns RED on impact, floor cube turns GREEN

function onStart()
    console.log("=== Collision Visual Test: " .. entity.name .. " ===")

    if not entity.collision then
        console.log("  [SKIP] No collision API (no physics)")
        return
    end

    -- Register collision handler to change color on impact
    if entity.name == "Falling Cube" then
        console.log("  Falling Cube: Waiting to hit floor...")
        entity.collision:onEnter(function(otherEntityId)
            console.log("  *** IMPACT! Falling cube hit entity: " .. tostring(otherEntityId))
            console.log("  Changing falling cube to RED")

            -- Change color to red on collision
            if entity.meshRenderer then
                entity.meshRenderer.material:setColor("#ff0000")  -- RED
                console.log("  Color changed to RED!")
            else
                console.log("  [ERROR] No meshRenderer available")
            end
        end)
    end

    if entity.name == "Floor Cube" then
        console.log("  Floor Cube: Waiting to be hit...")
        entity.collision:onEnter(function(otherEntityId)
            console.log("  *** IMPACT! Floor cube hit by entity: " .. tostring(otherEntityId))
            console.log("  Changing floor cube to GREEN")

            -- Change color to green when hit
            if entity.meshRenderer then
                entity.meshRenderer.material:setColor("#00ff00")  -- GREEN
                console.log("  Color changed to GREEN!")
            else
                console.log("  [ERROR] No meshRenderer available")
            end
        end)
    end

    console.log("=== Collision handlers registered ===")
end

function onUpdate(deltaTime)
    -- Physics handles the collision, handlers will fire when cubes collide
end
