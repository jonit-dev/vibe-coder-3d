-- Mesh API Test
-- Tests the Mesh API functionality for entities with MeshRenderer components

function onStart()
    console:log("=== Mesh API Test Started ===")

    -- Check if entity has mesh API
    if entity.mesh then
        console:log("Entity has mesh API available")

        -- Test mesh.isVisible
        console:log("Testing mesh.isVisible...")
        local visible = entity.mesh:isVisible()
        console:log("Initial visibility state: " .. tostring(visible))

        -- Test mesh.setVisible
        console:log("Testing mesh.setVisible...")
        entity.mesh:setVisible(false)
        console:log("Set mesh to invisible")

        local invisible = entity.mesh:isVisible()
        console:log("Visibility after set to false: " .. tostring(invisible))

        -- Set back to visible
        entity.mesh:setVisible(true)
        console:log("Set mesh back to visible")

        local visibleAgain = entity.mesh:isVisible()
        console:log("Visibility after set to true: " .. tostring(visibleAgain))

        -- Test mesh.setCastShadows
        console:log("Testing mesh.setCastShadows...")
        entity.mesh:setCastShadows(true)
        console:log("Set castShadows to true")

        entity.mesh:setCastShadows(false)
        console:log("Set castShadows to false")

        -- Test mesh.setReceiveShadows
        console:log("Testing mesh.setReceiveShadows...")
        entity.mesh:setReceiveShadows(true)
        console:log("Set receiveShadows to true")

        entity.mesh:setReceiveShadows(false)
        console:log("Set receiveShadows to false")

        console:log("=== Mesh API Test Completed Successfully ===")
    else
        console:log("Entity does not have mesh API (no MeshRenderer component)")
        console:log("=== Mesh API Test Skipped ===")
    end
end

function onUpdate(deltaTime)
    -- Mesh API test only needs to run once
end