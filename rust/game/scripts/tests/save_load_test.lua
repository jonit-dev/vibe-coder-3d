-- Save/Load API Test Script
-- Tests all save/load functionality: int, float, string, object persistence

local testsPassed = 0
local testsFailed = 0

function runTest(testName, testFn)
    local success, err = pcall(testFn)
    if success then
        console.log("✓ " .. testName)
        testsPassed = testsPassed + 1
    else
        console.error("✗ " .. testName .. ": " .. tostring(err))
        testsFailed = testsFailed + 1
    end
end

function assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function onStart()
    console.log("=== Save/Load API Test Suite ===")
    console.log("")

    -- Clear any existing save data
    save.clear()

    -- Test 1: Set and get integers
    runTest("Set/Get Int", function()
        save.setInt("playerLevel", 10)
        local level = save.getInt("playerLevel", 0)
        assert(level == 10, "Expected level to be 10, got " .. tostring(level))
    end)

    -- Test 2: Get int with default
    runTest("Get Int Default", function()
        local missing = save.getInt("nonExistent", 42)
        assert(missing == 42, "Expected default value 42, got " .. tostring(missing))
    end)

    -- Test 3: Set and get floats
    runTest("Set/Get Float", function()
        save.setFloat("playerHealth", 85.5)
        local health = save.getFloat("playerHealth", 0.0)
        assert(math.abs(health - 85.5) < 0.01, "Expected health to be 85.5, got " .. tostring(health))
    end)

    -- Test 4: Get float with default
    runTest("Get Float Default", function()
        local missing = save.getFloat("nonExistent", 3.14)
        assert(math.abs(missing - 3.14) < 0.01, "Expected default value 3.14, got " .. tostring(missing))
    end)

    -- Test 5: Set and get strings
    runTest("Set/Get String", function()
        save.setString("playerName", "Hero")
        local name = save.getString("playerName", "Default")
        assert(name == "Hero", "Expected name to be 'Hero', got '" .. tostring(name) .. "'")
    end)

    -- Test 6: Get string with default
    runTest("Get String Default", function()
        local missing = save.getString("nonExistent", "DefaultName")
        assert(missing == "DefaultName", "Expected default value 'DefaultName', got '" .. tostring(missing) .. "'")
    end)

    -- Test 7: Set and get objects
    runTest("Set/Get Object", function()
        local inventory = {
            gold = 100,
            items = {"sword", "shield", "potion"}
        }
        save.setObject("inventory", inventory)

        local loaded = save.getObject("inventory")
        assert(loaded ~= nil, "Expected inventory object to exist")
        assert(loaded.gold == 100, "Expected gold to be 100, got " .. tostring(loaded.gold))
        assert(loaded.items[1] == "sword", "Expected first item to be 'sword', got '" .. tostring(loaded.items[1]) .. "'")
        assert(loaded.items[2] == "shield", "Expected second item to be 'shield', got '" .. tostring(loaded.items[2]) .. "'")
    end)

    -- Test 8: hasKey
    runTest("hasKey", function()
        save.setInt("testKey", 123)
        assert(save.hasKey("testKey"), "Expected testKey to exist")
        assert(not save.hasKey("nonExistent"), "Expected nonExistent to not exist")
    end)

    -- Test 9: deleteKey
    runTest("deleteKey", function()
        save.setString("tempKey", "temporary")
        assert(save.hasKey("tempKey"), "Expected tempKey to exist before deletion")
        save.deleteKey("tempKey")
        assert(not save.hasKey("tempKey"), "Expected tempKey to not exist after deletion")
    end)

    -- Test 10: Complex object with nested data
    runTest("Complex Nested Object", function()
        local playerData = {
            stats = {
                strength = 15,
                agility = 12,
                intelligence = 10
            },
            equipment = {
                weapon = "Sword of Truth",
                armor = "Dragon Scale Mail",
                accessories = {"Ring of Power", "Amulet of Wisdom"}
            },
            questLog = {
                completed = {"Tutorial", "First Quest"},
                active = {"Main Quest", "Side Quest"}
            }
        }

        save.setObject("playerData", playerData)
        local loaded = save.getObject("playerData")

        assert(loaded ~= nil, "Expected playerData to exist")
        assert(loaded.stats.strength == 15, "Expected strength to be 15")
        assert(loaded.equipment.weapon == "Sword of Truth", "Expected weapon to be 'Sword of Truth'")
        assert(loaded.equipment.accessories[1] == "Ring of Power", "Expected first accessory to be 'Ring of Power'")
        assert(loaded.questLog.completed[1] == "Tutorial", "Expected first completed quest to be 'Tutorial'")
    end)

    -- Test 11: Save persistence (manual save/load)
    runTest("Save Persistence", function()
        save.setInt("persistTest", 999)
        local success = save.save()
        assert(success, "Expected save() to succeed")

        -- Clear in-memory data
        save.clear()
        assert(not save.hasKey("persistTest"), "Expected key to be cleared")

        -- Load from disk
        local loadSuccess = save.load()
        assert(loadSuccess, "Expected load() to succeed")

        local value = save.getInt("persistTest", 0)
        assert(value == 999, "Expected persistTest to be 999 after load, got " .. tostring(value))
    end)

    -- Test 12: Multiple value types
    runTest("Multiple Value Types", function()
        save.setInt("score", 1000)
        save.setFloat("accuracy", 0.95)
        save.setString("difficulty", "Hard")
        save.setObject("settings", {graphics = "High", sound = 0.8})

        assert(save.getInt("score", 0) == 1000, "Expected score to be 1000")
        assert(math.abs(save.getFloat("accuracy", 0.0) - 0.95) < 0.01, "Expected accuracy to be 0.95")
        assert(save.getString("difficulty", "") == "Hard", "Expected difficulty to be 'Hard'")

        local settings = save.getObject("settings")
        assert(settings.graphics == "High", "Expected graphics to be 'High'")
        assert(math.abs(settings.sound - 0.8) < 0.01, "Expected sound to be 0.8")
    end)

    -- Test 13: Clear all data
    runTest("Clear All Data", function()
        save.setInt("key1", 1)
        save.setString("key2", "test")
        save.setFloat("key3", 3.14)

        assert(save.hasKey("key1"), "Expected key1 to exist before clear")
        assert(save.hasKey("key2"), "Expected key2 to exist before clear")
        assert(save.hasKey("key3"), "Expected key3 to exist before clear")

        save.clear()

        assert(not save.hasKey("key1"), "Expected key1 to not exist after clear")
        assert(not save.hasKey("key2"), "Expected key2 to not exist after clear")
        assert(not save.hasKey("key3"), "Expected key3 to not exist after clear")
    end)

    -- Print test results
    console.log("")
    console.log("=== Test Results ===")
    console.log("Tests passed: " .. testsPassed)
    console.log("Tests failed: " .. testsFailed)

    if testsFailed == 0 then
        console.log("✓ All tests passed!")
    else
        console.error("✗ Some tests failed")
    end
end

function onUpdate(deltaTime)
    -- No updates needed for this test
end
