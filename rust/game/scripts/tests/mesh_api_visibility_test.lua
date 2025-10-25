-- Mesh API Visibility Test
-- Makes different cubes visible/invisible to prove renderer sync works
-- Expected result: Only Cube 0 (green) and Cube 2 (red) visible, Cube 1 (blue) hidden

function onStart()
    console.log("=== Mesh Visibility Test: " .. entity.name .. " ===")

    if not entity.mesh then
        console.log("  [SKIP] No MeshRenderer component")
        return
    end

    -- Cube 0: Stay visible (green)
    if entity.name == "Cube 0" then
        entity.mesh:setVisible(true)
        console.log("  Cube 0 (GREEN): Visible = TRUE")
    end

    -- Cube 1: Make invisible (blue should disappear)
    if entity.name == "Cube 1" then
        entity.mesh:setVisible(false)
        console.log("  Cube 1 (BLUE): Visible = FALSE *** SHOULD BE HIDDEN ***")
    end

    -- Cube 2: Stay visible (red)
    if entity.name == "Cube 2" then
        entity.mesh:setVisible(true)
        console.log("  Cube 2 (RED): Visible = TRUE")
    end

    console.log("=== Visibility Test Complete ===")
end

function onUpdate(deltaTime)
    -- No updates needed
end
