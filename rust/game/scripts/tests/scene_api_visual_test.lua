-- Scene API Visual Test Script
-- This script demonstrates Scene API functionality by:
-- 1. Displaying the current scene name
-- 2. Testing scene load operations (will log but fail gracefully)
-- 3. Controlling visual indicators based on API results

local sceneName = "Scene API Visual Test"
local loadAttempted = false
local loadResult = false
local timeSinceStart = 0

function onStart()
    console.log("=== Scene API Visual Test Started ===")

    -- Test Scene API - Get current scene
    local currentScene = scene.getCurrentScene()
    console.log("Current scene path:", currentScene or "nil")

    if currentScene then
        console.log("✓ Scene API is working - current scene detected:", currentScene)
        -- Show success by making the indicator green
        setIndicatorColor("success")
    else
        console.log("✗ No current scene detected - Scene API may be in stub mode")
        -- Show error by making the indicator red
        setIndicatorColor("error")
    end

    -- Test scene loading (this should fail gracefully with real implementation)
    console.log("--- Testing Scene Load Operations ---")

    -- Try to load a scene (should return false/log warning)
    local testLoadResult = scene.load("test_level.json")
    console.log("Scene load test result:", testLoadResult and "true" or "false")

    if testLoadResult then
        setIndicatorColor("success") -- Green if load somehow succeeds
        console.log("✓ Scene load returned true (unexpected but noted)")
    else
        setIndicatorColor("test") -- Yellow for expected failure
        console.log("✓ Scene load correctly returned false (expected behavior)")
    end

    -- Test additive loading
    local testAdditiveResult = scene.loadAdditive("ui_overlay.json")
    console.log("Scene additive load result:", testAdditiveResult and "true" or "false")

    -- Test unload operation
    local testUnloadResult = scene.unload()
    console.log("Scene unload result:", testUnloadResult and "true" or "false")

    loadAttempted = true
    loadResult = testLoadResult

    console.log("=== Scene API Tests Completed ===")
end

function onUpdate(deltaTime)
    timeSinceStart = timeSinceStart + deltaTime

    -- Animate the status indicator based on Scene API test results
    animateStatusIndicator(deltaTime)

    -- Periodically test Scene API to show it's responsive
    if timeSinceStart > 2.0 and math.fmod(timeSinceStart, 3.0) < deltaTime then
        local currentScene = scene.getCurrentScene()
        console.log("Scene check at time", string.format("%.1f", timeSinceStart), ":", currentScene or "nil")
    end
end

-- Helper function to set the indicator color based on test results
function setIndicatorColor(status)
    -- This will be implemented by checking entity components
    -- For now, we'll log the intent
    if status == "success" then
        console.log("Setting indicator to GREEN (Scene API working)")
    elseif status == "error" then
        console.log("Setting indicator to RED (Scene API not working)")
    elseif status == "test" then
        console.log("Setting indicator to YELLOW (expected test failure)")
    end
end

-- Animate the status indicator entity
function animateStatusIndicator(deltaTime)
    -- Find the StatusIndicator entity and make it pulse
    local statusIndicator = GameObject.find("StatusIndicator")

    if statusIndicator then
        -- Create a pulsing effect by varying scale
        local pulseScale = 1.0 + 0.2 * math.sin(timeSinceStart * 3.0)
        GameObject.setScale(statusIndicator, {pulseScale, pulseScale, pulseScale})

        -- Rotate the indicator to show activity
        local currentRotation = GameObject.getRotation(statusIndicator)
        if currentRotation then
            GameObject.setRotation(statusIndicator, {
                currentRotation[1],
                currentRotation[2] + deltaTime * 45, -- 45 degrees per second
                currentRotation[3]
            })
        end
    end

    -- Animate the LoadTestIndicator if load was attempted
    if loadAttempted then
        local loadIndicator = GameObject.find("LoadTestIndicator")
        if loadIndicator then
            local bounceHeight = 0.5 + 0.3 * math.abs(math.sin(timeSinceStart * 2.0))
            local currentPos = GameObject.getPosition(loadIndicator)
            if currentPos then
                GameObject.setPosition(loadIndicator, {
                    currentPos[1],
                    bounceHeight,
                    currentPos[3]
                })
            end
        end
    end
end