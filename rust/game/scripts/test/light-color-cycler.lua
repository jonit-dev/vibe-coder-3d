-- Light Color Cycler Script
-- Tests Light API: color changes, intensity changes, and position movement

local time = 0
local phase = 0

function onStart()
    console:log("Light Color Cycler - START")
    console:log("Testing Light API: color, intensity, and position")

    -- Verify light component exists
    local light = entity.light:get()
    if light then
        console:log("Initial light type:", light.lightType)
        console:log("Initial intensity:", light.intensity)
    end
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Calculate color components using sine waves at different frequencies
    -- This creates a smooth RGB color cycle
    local r = (math.sin(time * 0.5) + 1) * 0.5
    local g = (math.sin(time * 0.7 + 2.094) + 1) * 0.5  -- offset by 2π/3
    local b = (math.sin(time * 0.9 + 4.189) + 1) * 0.5  -- offset by 4π/3

    -- Set the light color
    entity.light:setColor(r, g, b)

    -- Pulse the intensity between 0.5 and 2.0
    local intensity = 1.0 + math.sin(time * 1.2) * 0.8
    entity.light:setIntensity(intensity)

    -- Move the light in a circular pattern
    local radius = 4
    local x = math.cos(time * 0.3) * radius
    local z = math.sin(time * 0.3) * radius
    local y = 3 + math.sin(time * 0.5) * 1.5  -- Bob up and down

    entity.transform:setPosition(x, y, z)

    -- Log status every 2 seconds
    phase = phase + deltaTime
    if phase >= 2.0 then
        console:log(string.format("Time: %.1fs | Color: (%.2f, %.2f, %.2f) | Intensity: %.2f | Pos: (%.1f, %.1f, %.1f)",
            time, r, g, b, intensity, x, y, z))
        phase = 0
    end
end
