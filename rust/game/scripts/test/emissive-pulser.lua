-- Emissive Pulser Script
-- Tests Material API: setEmissive with pulsing colors and intensity

local time = 0

function onStart()
    console:log("Emissive Pulser - START")
    console:log("Testing Material API: emissive color and intensity")
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Cycle emissive color through RGB spectrum
    local r = (math.sin(time * 0.7) + 1) * 0.5
    local g = (math.sin(time * 0.9 + 2.094) + 1) * 0.5
    local b = (math.sin(time * 1.1 + 4.189) + 1) * 0.5

    local hexColor = string.format("#%02x%02x%02x",
        math.floor(r * 255),
        math.floor(g * 255),
        math.floor(b * 255))

    -- Pulse intensity between 0.5 and 3.0
    local intensity = 1.75 + math.sin(time * 1.5) * 1.25

    entity.meshRenderer.material:setEmissive(hexColor, intensity)

    -- Rotate the torus
    entity.transform:rotate(deltaTime * 60, 0, deltaTime * 30)

    -- Log status every 2 seconds
    if math.floor(time * 5) % 10 == 0 and math.floor(time * 50) % 10 == 0 then
        console:log(string.format("Time: %.1fs | Emissive: %s | Intensity: %.2f",
            time, hexColor, intensity))
    end
end
