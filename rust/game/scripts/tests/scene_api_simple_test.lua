-- Simple Scene API Test
-- Verifies Scene API integration with visual feedback

local currentScenePath = nil
local testsPassed = 0
local testsTotal = 4
local time = 0

function onStart()
    console.log("=== SCENE API INTEGRATION TEST ===")

    -- TEST 1: getCurrentScene()
    console.log("TEST 1: scene.getCurrentScene()")
    currentScenePath = scene.getCurrentScene()

    if currentScenePath then
        console.log("PASS - Current scene:")
        console.log(currentScenePath)
        testsPassed = testsPassed + 1
    else
        console.log("FAIL - No current scene returned")
    end

    -- TEST 2: load() - should return false (not implemented at runtime)
    console.log("TEST 2: scene.load()")
    local loadResult = scene.load("test.json")
    if not loadResult then
        console.log("PASS - Load correctly returned false")
        testsPassed = testsPassed + 1
    else
        console.log("FAIL - Load should return false")
    end

    -- TEST 3: loadAdditive() - should return false
    console.log("TEST 3: scene.loadAdditive()")
    local additiveResult = scene.loadAdditive("ui.json")
    if not additiveResult then
        console.log("PASS - LoadAdditive correctly returned false")
        testsPassed = testsPassed + 1
    else
        console.log("FAIL - LoadAdditive should return false")
    end

    -- TEST 4: unload() - should return false
    console.log("TEST 4: scene.unload()")
    local unloadResult = scene.unload()
    if not unloadResult then
        console.log("PASS - Unload correctly returned false")
        testsPassed = testsPassed + 1
    else
        console.log("FAIL - Unload should return false")
    end

    -- Summary
    console.log("===================")
    console.log("TESTS PASSED:")
    console.log(testsPassed)
    console.log("TESTS TOTAL:")
    console.log(testsTotal)

    if testsPassed == testsTotal then
        console.log("ALL TESTS PASSED - Scene API is integrated!")
    else
        console.log("SOME TESTS FAILED")
    end
    console.log("===================")
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Animate status sphere
    local sphere = GameObject.find("StatusSphere")
    if sphere then
        local scale = 1.0 + 0.2 * math.sin(time * 4.0)
        GameObject.setScale(sphere, {scale, scale, scale})

        local rot = GameObject.getRotation(sphere)
        if rot then
            GameObject.setRotation(sphere, {rot[1], rot[2] + deltaTime * 60, rot[3]})
        end
    end
end
