-- Prefab API Test
--
-- Tests the prefab API functionality including:
-- - Instantiating prefabs
-- - Getting prefab instances
-- - Checking if entities are prefab instances
-- - Getting prefab paths
-- - Destroying prefab instances

function onStart()
    console.log("=== Prefab API Test Started ===")

    -- Test 1: Try to instantiate a prefab (may fail if no prefabs are loaded)
    console.log("Test 1: Instantiating prefab...")
    local cubeId = prefab.instantiate("test_cube", {x = 0, y = 0, z = 0})

    if cubeId then
        console.log("✅ Successfully instantiated prefab test_cube as entity: " .. cubeId)

        -- Test 2: Check if the entity is a prefab instance
        console.log("Test 2: Checking if entity is prefab instance...")
        local isInstance = prefab.isInstance(cubeId)
        if isInstance then
            console.log("✅ Entity " .. cubeId .. " is correctly identified as prefab instance")
        else
            console.log("❌ Entity " .. cubeId .. " is NOT recognized as prefab instance")
        end

        -- Test 3: Get prefab path
        console.log("Test 3: Getting prefab path...")
        local path = prefab.getPath(cubeId)
        if path then
            console.log("✅ Prefab path for entity " .. cubeId .. ": " .. path)
        else
            console.log("❌ Could not get prefab path for entity " .. cubeId)
        end

        -- Test 4: Get all instances of this prefab
        console.log("Test 4: Getting all instances of prefab...")
        local instances = prefab.getInstances("test_cube")
        console.log("✅ Found " .. #instances .. " instances of test_cube prefab")

        -- Test 5: Try to instantiate another cube at different position
        console.log("Test 5: Instantiating second prefab...")
        local cubeId2 = prefab.instantiate("test_cube", {x = 5, y = 0, z = 0})

        if cubeId2 then
            console.log("✅ Successfully instantiated second prefab as entity: " .. cubeId2)

            -- Check total instances again
            local allInstances = prefab.getInstances("test_cube")
            console.log("✅ Total instances of test_cube prefab: " .. #allInstances)

            -- Test 6: Destroy one instance
            console.log("Test 6: Destroying prefab instance...")
            local destroyed = prefab.destroy(cubeId)
            if destroyed then
                console.log("✅ Successfully destroyed entity " .. cubeId)

                -- Check remaining instances
                local remainingInstances = prefab.getInstances("test_cube")
                console.log("✅ Remaining instances after destroy: " .. #remainingInstances)

                -- Verify destroyed entity is no longer an instance
                local stillInstance = prefab.isInstance(cubeId)
                if not stillInstance then
                    console.log("✅ Destroyed entity is no longer recognized as prefab instance")
                else
                    console.log("❌ Destroyed entity is still recognized as prefab instance")
                end
            else
                console.log("❌ Failed to destroy entity " .. cubeId)
            end
        else
            console.log("❌ Failed to instantiate second prefab")
        end
    else
        console.log("⚠️  Could not instantiate prefab test_cube (this is expected if no prefabs are loaded)")
    end

    -- Test 7: Try to instantiate non-existent prefab
    console.log("Test 7: Testing non-existent prefab...")
    local invalidId = prefab.instantiate("non_existent_prefab")
    if not invalidId then
        console.log("✅ Correctly failed to instantiate non-existent prefab")
    else
        console.log("❌ Unexpectedly succeeded in instantiating non-existent prefab")
    end

    -- Test 8: Try to destroy non-prefab entity
    console.log("Test 8: Testing destroy of non-prefab entity...")
    local fakeEntityId = 999999
    local destroyFailed = prefab.destroy(fakeEntityId)
    if not destroyFailed then
        console.log("✅ Correctly failed to destroy non-prefab entity")
    else
        console.log("❌ Unexpectedly succeeded in destroying non-prefab entity")
    end

    console.log("=== Prefab API Test Completed ===")
end

function onUpdate(deltaTime)
    -- No continuous updates needed for this test
end