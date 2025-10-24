-- Camera Animator Script
-- Tests Camera API: FOV changes, clipping planes, position/rotation animation

local time = 0
local fovPhase = 0
local orbitRadius = 10
local orbitSpeed = 0.2
local bobSpeed = 0.3
local bobHeight = 2

function onStart()
    console:log("Camera Animator - START")
    console:log("Testing Camera API: FOV, clipping, position, rotation")

    -- Get initial camera settings
    local cam = entity.camera:get()
    if cam then
        console:log("Initial FOV:", cam.fov)
        console:log("Initial near/far:", cam.near, cam.far)
        console:log("Projection type:", cam.projectionType)
    end
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Animate FOV between 30 and 120 degrees (fish-eye to telephoto)
    local fov = 60 + math.sin(time * 0.5) * 40
    entity.camera:setFov(fov)

    -- Animate clipping planes to show near/far culling effects
    -- Near plane oscillates between 0.1 and 5
    local near = 0.1 + (math.sin(time * 0.3) + 1) * 2.5
    -- Far plane oscillates between 30 and 100
    local far = 65 + math.sin(time * 0.4) * 35
    entity.camera:setClipping(near, far)

    -- Orbit camera around the scene
    local angle = time * orbitSpeed
    local x = math.cos(angle) * orbitRadius
    local z = math.sin(angle) * orbitRadius
    local y = 3 + math.sin(time * bobSpeed) * bobHeight

    entity.transform:setPosition(x, y, z)

    -- Always look at the center
    entity.transform:lookAt(0, 1, 0)

    -- Log status every 2 seconds
    fovPhase = fovPhase + deltaTime
    if fovPhase >= 2.0 then
        console:log(string.format("Time: %.1fs | FOV: %.1f | Near: %.2f | Far: %.1f | Pos: (%.1f, %.1f, %.1f)",
            time, fov, near, far, x, y, z))
        fovPhase = 0
    end
end
