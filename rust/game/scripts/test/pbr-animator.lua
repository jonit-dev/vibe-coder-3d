-- PBR Animator Script
-- Tests Material API: setMetalness and setRoughness

local time = 0

function onStart()
    console:log("PBR Animator - START")
    console:log("Testing Material API: metalness and roughness")

    -- Set a nice gold color
    entity.meshRenderer.material:setColor("#ffd700")
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Oscillate metalness between 0 and 1
    local metalness = (math.sin(time * 0.8) + 1) * 0.5
    entity.meshRenderer.material:setMetalness(metalness)

    -- Oscillate roughness between 0.1 and 0.9 (offset phase)
    local roughness = 0.5 + math.sin(time * 1.2 + 1.5) * 0.4
    entity.meshRenderer.material:setRoughness(roughness)

    -- Rotate the cube
    entity.transform:rotate(0, deltaTime * 45, deltaTime * 30)

    -- Log status every 2 seconds
    if math.floor(time * 5) % 10 == 0 and math.floor(time * 50) % 10 == 0 then
        console:log(string.format("Time: %.1fs | Metalness: %.2f | Roughness: %.2f",
            time, metalness, roughness))
    end
end
