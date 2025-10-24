--[[
  Input API Test Script

  This script demonstrates all Input API features:
  - Keyboard input (down, pressed, released)
  - Mouse input (buttons, position, delta, wheel)
  - Mouse pointer lock
  - Action system (WASD movement, etc.)

  Attach this script to any entity to test input functionality.
]]

local moveSpeed = 5.0
local rotateSpeed = 2.0

function onStart()
    console.log("=== Input Test Script Started ===")
    console.log("Controls:")
    console.log("  WASD - Move entity")
    console.log("  Arrow Keys - Rotate entity")
    console.log("  Space - Jump (prints to console)")
    console.log("  Mouse - Look around")
    console.log("  Mouse Wheel - Scale entity")
    console.log("  Left Click - Print mouse position")
end

function onUpdate(dt)
    -- Keyboard: WASD Movement (isKeyDown - continuous)
    local moved = false

    if input.isKeyDown("w") then
        entity.transform.translate(0, 0, -moveSpeed * dt)
        moved = true
    end
    if input.isKeyDown("s") then
        entity.transform.translate(0, 0, moveSpeed * dt)
        moved = true
    end
    if input.isKeyDown("a") then
        entity.transform.translate(-moveSpeed * dt, 0, 0)
        moved = true
    end
    if input.isKeyDown("d") then
        entity.transform.translate(moveSpeed * dt, 0, 0)
        moved = true
    end

    if moved then
        console.log(string.format("Position: %.2f, %.2f, %.2f",
            entity.transform.position[1],
            entity.transform.position[2],
            entity.transform.position[3]))
    end

    -- Keyboard: Arrow Keys Rotation (isKeyDown - continuous)
    if input.isKeyDown("up") then
        entity.transform.rotate(-rotateSpeed * dt, 0, 0)
    end
    if input.isKeyDown("down") then
        entity.transform.rotate(rotateSpeed * dt, 0, 0)
    end
    if input.isKeyDown("left") then
        entity.transform.rotate(0, -rotateSpeed * dt, 0)
    end
    if input.isKeyDown("right") then
        entity.transform.rotate(0, rotateSpeed * dt, 0)
    end

    -- Keyboard: Space Jump (isKeyPressed - single trigger)
    if input.isKeyPressed("space") then
        console.log("JUMP! (Space pressed)")
    end

    -- Keyboard: isKeyReleased example
    if input.isKeyReleased("shift") then
        console.log("Shift key released")
    end

    -- Mouse: Button States
    if input.isMouseButtonPressed(0) then
        local pos = input.mousePosition()
        console.log(string.format("Left Click at: %.0f, %.0f", pos[1], pos[2]))
    end

    if input.isMouseButtonDown(2) then
        console.log("Right mouse button held")
    end

    -- Mouse: Delta Movement
    local delta = input.mouseDelta()
    if math.abs(delta[1]) > 0.5 or math.abs(delta[2]) > 0.5 then
        -- Rotate entity based on mouse movement
        entity.transform.rotate(-delta[2] * 0.001, -delta[1] * 0.001, 0)
    end

    -- Mouse: Wheel Scaling
    local wheel = input.mouseWheel()
    if wheel ~= 0 then
        local scale = entity.transform.scale
        local newScale = scale[1] + wheel * 0.1
        newScale = math.max(0.1, math.min(newScale, 5.0)) -- Clamp 0.1 to 5.0
        entity.transform.setScale(newScale, newScale, newScale)
        console.log(string.format("Scale: %.2f (wheel: %.2f)", newScale, wheel))
    end

    -- Mouse: Pointer Lock Toggle
    if input.isKeyPressed("l") then
        if input.isPointerLocked() then
            input.unlockPointer()
            console.log("Pointer unlocked")
        else
            input.lockPointer()
            console.log("Pointer locked (FPS mode)")
        end
    end
end

function onDestroy()
    console.log("=== Input Test Script Destroyed ===")
end
