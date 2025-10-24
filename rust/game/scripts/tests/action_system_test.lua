--[[
  Action System Test Script

  Demonstrates the Input Action System for high-level input mapping.
  Actions allow you to define semantic inputs (like "Move", "Jump")
  that map to multiple physical inputs (WASD, gamepad, etc.).

  Action maps should be defined in a JSON config file and loaded
  via InputManager.load_action_maps() in the engine.

  Example action map JSON:
  [
    {
      "name": "Gameplay",
      "enabled": true,
      "actions": [
        {
          "name": "Move",
          "type": "vector2",
          "bindings": [
            {
              "type": "composite2d",
              "up": "w",
              "down": "s",
              "left": "a",
              "right": "d"
            }
          ]
        },
        {
          "name": "Jump",
          "type": "button",
          "bindings": [
            {
              "type": "key",
              "key": "space",
              "scale": 1.0
            }
          ]
        },
        {
          "name": "Fire",
          "type": "button",
          "bindings": [
            {
              "type": "mousebutton",
              "button": 0,
              "scale": 1.0
            }
          ]
        }
      ]
    },
    {
      "name": "UI",
      "enabled": false,
      "actions": [
        {
          "name": "Submit",
          "type": "button",
          "bindings": [
            {
              "type": "key",
              "key": "enter",
              "scale": 1.0
            }
          ]
        }
      ]
    }
  ]
]]

local moveSpeed = 5.0

function onStart()
    console.log("=== Action System Test Started ===")
    console.log("This script demonstrates the Input Action System")
    console.log("")
    console.log("Expected Actions (if configured):")
    console.log("  'Gameplay' map:")
    console.log("    - Move (WASD → Vector2)")
    console.log("    - Jump (Space → Button)")
    console.log("    - Fire (Left Click → Button)")
    console.log("  'UI' map (disabled by default):")
    console.log("    - Submit (Enter → Button)")
    console.log("")
    console.log("Press F1 to toggle Gameplay map")
    console.log("Press F2 to toggle UI map")
end

function onUpdate(dt)
    -- Toggle action maps
    if input.isKeyPressed("f1") then
        -- Note: We can't query map state in Lua, so we just toggle
        -- In practice, engine would track this
        input.disableActionMap("Gameplay")
        console.log("Gameplay map disabled (toggled)")
    end

    if input.isKeyPressed("f2") then
        input.enableActionMap("UI")
        console.log("UI map enabled")
    end

    if input.isKeyPressed("f3") then
        input.enableActionMap("Gameplay")
        console.log("Gameplay map enabled")
    end

    -- Polling: Get action value
    local moveValue = input.getActionValue("Gameplay", "Move")

    if type(moveValue) == "table" then
        -- Vector2 action
        local x = moveValue[1] or 0
        local y = moveValue[2] or 0

        if math.abs(x) > 0.1 or math.abs(y) > 0.1 then
            -- Move entity based on action value
            entity.transform.translate(x * moveSpeed * dt, 0, -y * moveSpeed * dt)
            console.log(string.format("Move action: %.2f, %.2f", x, y))
        end
    elseif type(moveValue) == "number" then
        -- Scalar action (shouldn't happen for Move, but handle it)
        if moveValue > 0.1 then
            console.log(string.format("Move action (scalar): %.2f", moveValue))
        end
    end

    -- Boolean check: isActionActive
    if input.isActionActive("Gameplay", "Jump") then
        console.log("Jump action active!")
        -- Apply jump force
        entity.transform.translate(0, 2 * dt, 0)
    end

    if input.isActionActive("Gameplay", "Fire") then
        console.log("Fire action active!")
    end

    if input.isActionActive("UI", "Submit") then
        console.log("UI Submit action active (Enter pressed)")
    end
end

function onDestroy()
    console.log("=== Action System Test Destroyed ===")
end
