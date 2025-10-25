-- Scene and Prefab API Test Script
-- Tests the new Scene API and Prefab API functionality
-- This script demonstrates:
-- 1. Scene API: getCurrentScene, load, loadAdditive, unload
-- 2. Prefab API: instantiate, destroy, getInstances, isInstance, getPath

function onStart()
    console.log("=== Scene & Prefab API Test Started ===")

    -- Test Scene API (stub mode - should work but return nil/false)
    console.log("--- Testing Scene API ---")

    local currentScene = scene.getCurrentScene()
    console.log("Current scene:", currentScene or "nil")

    -- Try to load a scene (should return false in stub mode)
    local loadResult = scene.load("test_scene.json")
    console.log("Scene load result:", loadResult and "true" or "false")

    -- Try to load additive (should return false in stub mode)
    local loadAdditiveResult = scene.loadAdditive("ui_overlay.json")
    console.log("Scene load additive result:", loadAdditiveResult and "true" or "false")

    -- Try to unload (should return false in stub mode)
    local unloadResult = scene.unload()
    console.log("Scene unload result:", unloadResult and "true" or "false")

    console.log("Scene API tests completed")

    -- Test Prefab API (stub mode - should work but return nil/false)
    console.log("--- Testing Prefab API ---")

    -- Try to instantiate a prefab (should return nil in stub mode)
    local prefab1 = prefab.instantiate("enemy.json")
    console.log("Prefab instantiate 1:", prefab1 or "nil")

    -- Try to instantiate with position (should return nil in stub mode)
    local prefab2 = prefab.instantiate("enemy.json", {x = 5, y = 0, z = 10})
    console.log("Prefab instantiate 2 (with position):", prefab2 or "nil")

    -- Try to instantiate item prefab
    local itemPrefab = prefab.instantiate("item.json", {x = -3, y = 1, z = 0})
    console.log("Item prefab instantiate:", itemPrefab or "nil")

    -- Get instances of specific prefab (should return empty array in stub mode)
    local enemyInstances = prefab.getInstances("enemy.json")
    console.log("Enemy prefab instances count:", #enemyInstances)

    local itemInstances = prefab.getInstances("item.json")
    console.log("Item prefab instances count:", #itemInstances)

    -- Check if entities are prefab instances (should return false in stub mode)
    if prefab1 then
        local isInstance1 = prefab.isInstance(prefab1)
        console.log("Prefab1 is instance:", isInstance1 and "true" or "false")

        local path1 = prefab.getPath(prefab1)
        console.log("Prefab1 path:", path1 or "nil")
    end

    if prefab2 then
        local isInstance2 = prefab.isInstance(prefab2)
        console.log("Prefab2 is instance:", isInstance2 and "true" or "false")

        local path2 = prefab.getPath(prefab2)
        console.log("Prefab2 path:", path2 or "nil")
    end

    if itemPrefab then
        local isItemInstance = prefab.isInstance(itemPrefab)
        console.log("Item prefab is instance:", isItemInstance and "true" or "false")

        local itemPath = prefab.getPath(itemPrefab)
        console.log("Item prefab path:", itemPath or "nil")
    end

    -- Test destroy operations (should return false in stub mode)
    if prefab1 then
        local destroyResult1 = prefab.destroy(prefab1)
        console.log("Destroy prefab1 result:", destroyResult1 and "true" or "false")
    end

    if prefab2 then
        local destroyResult2 = prefab.destroy(prefab2)
        console.log("Destroy prefab2 result:", destroyResult2 and "true" or "false")
    end

    if itemPrefab then
        local destroyItemResult = prefab.destroy(itemPrefab)
        console.log("Destroy item prefab result:", destroyItemResult and "true" or "false")
    end

    console.log("Prefab API tests completed")

    -- Test error handling (invalid operations)
    console.log("--- Testing Error Handling ---")

    -- Try to destroy non-existent entity (should return false)
    local destroyInvalid = prefab.destroy(999999)
    console.log("Destroy invalid entity result:", destroyInvalid and "true" or "false")

    -- Check if non-existent entity is instance (should return false)
    local isInvalidInstance = prefab.isInstance(999999)
    console.log("Invalid entity is instance:", isInvalidInstance and "true" or "false")

    -- Get path of non-existent entity (should return nil)
    local invalidPath = prefab.getPath(999999)
    console.log("Invalid entity path:", invalidPath or "nil")

    -- Get instances of non-existent prefab (should return empty array)
    local invalidInstances = prefab.getInstances("non_existent.json")
    console.log("Invalid prefab instances count:", #invalidInstances)

    console.log("Error handling tests completed")

    -- Test mesh visibility (this should work)
    console.log("--- Testing Mesh API (should work) ---")

    if entity.mesh then
        console.log("Entity has mesh component")

        local isVisible = entity.mesh:isVisible()
        console.log("Initial mesh visibility:", isVisible and "true" or "false")

        -- Test visibility changes
        entity.mesh:setVisible(false)
        console.log("Set mesh visibility to false")

        entity.mesh:setVisible(true)
        console.log("Set mesh visibility back to true")

        -- Test shadow casting
        entity.mesh:setCastShadows(true)
        console.log("Set mesh to cast shadows")

        entity.mesh:setReceiveShadows(true)
        console.log("Set mesh to receive shadows")

        console.log("Mesh API tests completed")
    else
        console.log("Entity does not have mesh component - skipping mesh API tests")
    end

    console.log("=== All Scene & Prefab API Tests Completed ===")
end

function onUpdate(deltaTime)
    -- This test doesn't need per-frame updates
    -- All API tests are performed in onStart()
end