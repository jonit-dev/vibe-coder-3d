-- GameObject Collision API Test
-- Tests GameObject API creation with collision event handling

function onStart()
    console.log("=== GameObject Collision API Test Started ===")

    -- Test collision API availability
    if entity.collision then
        console.log("Entity has collision API available")

        -- Register collision handlers
        entity.collision:onEnter(function(otherEntityId)
            console.log("COLLISION ENTER with entity: " .. tostring(otherEntityId))
        end)

        entity.collision:onExit(function(otherEntityId)
            console.log("COLLISION EXIT with entity: " .. tostring(otherEntityId))
        end)
    else
        console.log("Entity does not have collision API")
    end

    -- Test 1: Create dynamic cube that will fall and collide with floor
    console.log("Creating dynamic cube...")
    local cubeId = GameObject.createPrimitive("Cube", "TestCube")
    if cubeId then
        console.log("Created cube with ID: " .. tostring(cubeId))

        -- Set up collision handlers for the new cube
        GameObject.setPosition(cubeId, {0, 3, 0})

        -- Register collision handlers via direct API call (since we can't attach script to created entity)
        console.log("Cube created - it should fall and collide with floor")

        -- Create another cube to test cube-cube collision
        local cubeId2 = GameObject.createPrimitive("Cube", "TestCube2")
        if cubeId2 then
            console.log("Created second cube with ID: " .. tostring(cubeId2))
            GameObject.setPosition(cubeId2, {2, 3, 0})
        end
    else
        console.log("Failed to create cube")
    end

    -- Test 2: Create trigger volume
    console.log("Creating trigger volume...")
    local triggerId = GameObject.createPrimitive("Cube", "TestTrigger")
    if triggerId then
        console.log("Created trigger with ID: " .. tostring(triggerId))
        GameObject.setPosition(triggerId, {0, 2, 0})
        GameObject.setScale(triggerId, {2, 2, 2})
    else
        console.log("Failed to create trigger")
    end

    console.log("=== GameObject Collision API Test Completed ===")
    console.log("Expected behaviors:")
    console.log("- Dynamic cubes created and positioned")
    console.log("- Cubes should fall and collide with floor")
    console.log("- Trigger volume detects objects entering/exiting")
    console.log("Watch console for collision events...")
end

function onUpdate(deltaTime)
    -- GameObject collision test only needs to run once
    -- The actual collision events will be dispatched by the physics system
end