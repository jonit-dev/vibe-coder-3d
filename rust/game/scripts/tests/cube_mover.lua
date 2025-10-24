--[[
  Simple cube movement test - moves automatically each frame
  This proves the scripting and transform systems work
]]

local elapsed = 0
local moveSpeed = 2.0

function onStart()
    console.log("=== Cube Mover Test Started ===")
    console.log("Cube will move automatically to prove scripting works")
end

function onUpdate(dt)
    elapsed = elapsed + dt

    -- Move cube in a circle pattern
    local radius = 3
    local x = math.sin(elapsed) * radius
    local z = math.cos(elapsed) * radius

    entity.transform.setPosition(x, 2, z)

    -- Rotate cube
    entity.transform.rotate(0, dt * 50, 0)

    if elapsed > 0 and elapsed < 0.1 then
        console.log(string.format("Cube moving: position = (%.2f, %.2f, %.2f)", x, 2, z))
    end
end
