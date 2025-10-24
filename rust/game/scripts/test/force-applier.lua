-- Force Applier Script
-- Tests Physics API: applyForce, applyImpulse, setLinearVelocity, setAngularVelocity

local time = 0
local impulseTimer = 0
local forceTimer = 0

function onStart()
    console:log("Force Applier - START")
    console:log("Testing Physics API: forces, impulses, velocities")

    -- Check if rigidbody exists
    local rb = entity.rigidBody:get()
    if rb then
        console:log("RigidBody mass:", rb.mass)
        console:log("RigidBody type:", rb.bodyType)
    end
end

function onUpdate(deltaTime)
    time = time + deltaTime
    impulseTimer = impulseTimer + deltaTime
    forceTimer = forceTimer + deltaTime

    -- Apply upward impulse every 3 seconds
    if impulseTimer >= 3.0 then
        local upwardImpulse = {0, 8, 0}
        entity.rigidBody:applyImpulse(upwardImpulse)
        console:log(string.format("Applied upward impulse at time %.1fs", time))
        impulseTimer = 0
    end

    -- Apply sideways force continuously (creates circular motion)
    if forceTimer >= 0.1 then
        local pos = entity.transform:getPosition()
        -- Force perpendicular to position vector creates circular motion
        local forceX = -pos.z * 2
        local forceZ = pos.x * 2
        entity.rigidBody:applyForce({forceX, 0, forceZ})
        forceTimer = 0
    end

    -- Every 5 seconds, add some angular velocity for spin
    if math.floor(time) % 5 == 0 and math.floor(time * 10) % 10 == 0 then
        entity.rigidBody:setAngularVelocity({0, 5, 0})
        console:log("Added angular velocity")
    end

    -- Log velocity every 2 seconds
    if math.floor(time * 5) % 10 == 0 and math.floor(time * 50) % 10 == 0 then
        local vel = entity.rigidBody:getLinearVelocity()
        local angVel = entity.rigidBody:getAngularVelocity()
        if vel and angVel then
            console:log(string.format("Linear: (%.1f, %.1f, %.1f) | Angular: (%.1f, %.1f, %.1f)",
                vel.x or vel[1] or 0,
                vel.y or vel[2] or 0,
                vel.z or vel[3] or 0,
                angVel.x or angVel[1] or 0,
                angVel.y or angVel[2] or 0,
                angVel.z or angVel[3] or 0))
        end
    end
end
