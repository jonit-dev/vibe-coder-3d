-- Mesh API Test
-- Tests mesh visibility and shadow control APIs
-- NOTE: Renderer sync not yet implemented - changes affect scene data but not visible meshes
-- This test proves the API calls work without crashing

function onStart()
    console.log("=== Mesh API Test: " .. entity.name .. " ===")

    if not entity.mesh then
        console.log("  [SKIP] No MeshRenderer component")
        return
    end

    -- Test isVisible
    local visible = entity.mesh:isVisible()
    console.log("  isVisible() = " .. tostring(visible))

    -- Test setVisible
    entity.mesh:setVisible(false)
    console.log("  setVisible(false) - OK")

    local invisible = entity.mesh:isVisible()
    console.log("  isVisible() after set = " .. tostring(invisible))

    entity.mesh:setVisible(true)
    console.log("  setVisible(true) - OK")

    -- Test setCastShadows
    entity.mesh:setCastShadows(false)
    console.log("  setCastShadows(false) - OK")

    entity.mesh:setCastShadows(true)
    console.log("  setCastShadows(true) - OK")

    -- Test setReceiveShadows
    entity.mesh:setReceiveShadows(false)
    console.log("  setReceiveShadows(false) - OK")

    entity.mesh:setReceiveShadows(true)
    console.log("  setReceiveShadows(true) - OK")

    console.log("=== Mesh API Test Completed Successfully ===")
end

function onUpdate(deltaTime)
    -- Test runs once in onStart
end