-- GameObject API Test Script
-- This script demonstrates runtime entity creation using GameObject.create() and GameObject.createPrimitive()

local spawnTimer = 0
local spawnInterval = 2.0  -- Spawn a new object every 2 seconds
local spawnCount = 0
local maxSpawns = 5  -- Limit to 5 spawns for testing

function onUpdate(dt)
    spawnTimer = spawnTimer + dt

    if spawnTimer >= spawnInterval and spawnCount < maxSpawns then
        spawnTimer = 0
        spawnCount = spawnCount + 1

        -- Calculate spawn position (spread out in a circle)
        local angle = (spawnCount - 1) * (360 / maxSpawns)
        local rad = math.rad(angle)
        local radius = 5
        local x = math.cos(rad) * radius
        local z = math.sin(rad) * radius
        local y = 3 + spawnCount * 0.5  -- Stack them slightly higher each time

        console.log("Spawning object " .. spawnCount .. " at position: " .. x .. ", " .. y .. ", " .. z)

        -- Create a primitive with full options
        local entityId = GameObject.createPrimitive("Sphere", {
            name = "Dynamic Sphere " .. spawnCount,
            transform = {
                position = {x, y, z},
                scale = 0.5
            },
            material = {
                color = string.format("#%02X%02X%02X",
                    math.floor(math.random() * 255),
                    math.floor(math.random() * 255),
                    math.floor(math.random() * 255)),
                metalness = 0.2,
                roughness = 0.6
            },
            physics = {
                body = "dynamic",
                mass = 1.0,
                collider = "sphere"
            }
        })

        console.log("Created entity with ID: " .. entityId)

        if spawnCount == maxSpawns then
            console.log("Reached maximum spawn count. Spawning complete!")
        end
    end
end
