-- Scene Info Display Script
-- Continuously displays current scene information and Scene API status

local displayText = "Scene API Test\nChecking API Status..."

function onStart()
    console.log("=== Scene Info Display Started ===")

    -- Create a text display above the main test area
    displayText = "Scene: " .. (scene.getCurrentScene() or "Unknown") ..
                   "\nAPI Status: Active"

    console.log("Scene Info Display initialized")
    console.log("Will show scene info and API status")
end

function onUpdate(deltaTime)
    -- Update display with current time and scene info
    local timeString = string.format("%.1f", time.getTime())

    displayText = "Scene: " .. (scene.getCurrentScene() or "Unknown") ..
                   "\nTime: " .. timeString ..
                   "\nAPI Status: Active"
end

-- This script primarily provides visual feedback about Scene API status
-- It shows whether getCurrentScene() returns valid data