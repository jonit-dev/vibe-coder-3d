-- BVH Integration Test Script
-- This script tests BVH raycasting functionality and validates results

local bvh_test = {}

-- Test configuration
local config = {
    test_ray_origin = {0, 5, 15},
    test_ray_directions = {
        {0, -0.3, -1},    -- Towards ground near cube
        {0, -0.2, -0.8},  -- Towards center sphere
        {0.13, -0.3, -0.9}, -- Towards tall box
        {1, 0, 0},        -- Away from all objects (should miss)
        {0, 1, 0},        -- Upwards (should miss)
    },
    performance_test_rays = 100,
    log_results = true,
    validate_hits = true
}

-- Expected hit results for validation
local expected_hits = {
    {should_hit = true, approx_distance = 14.5},  -- Ground
    {should_hit = true, approx_distance = 5.0},   -- Center sphere
    {should_hit = true, approx_distance = 7.2},   -- Tall box
    {should_hit = false, approx_distance = 0},    -- Miss
    {should_hit = false, approx_distance = 0}     -- Miss
}

-- Statistics tracking
local stats = {
    total_raycasts = 0,
    successful_hits = 0,
    failed_hits = 0,
    performance_tests = 0,
    errors = 0
}

-- Helper function to compare vectors with tolerance
local function vec3_approx_equal(a, b, tolerance)
    tolerance = tolerance or 0.001
    return math.abs(a[1] - b[1]) < tolerance and
           math.abs(a[2] - b[2]) < tolerance and
           math.abs(a[3] - b[3]) < tolerance
end

-- Helper function to normalize a vector
local function normalize(v)
    local length = math.sqrt(v[1]^2 + v[2]^2 + v[3]^2)
    if length == 0 then return {0, 0, 0} end
    return {v[1]/length, v[2]/length, v[3]/length}
end

-- Test basic raycasting functionality
function bvh_test.test_basic_raycasting()
    print("=== BVH Basic Raycasting Test ===")

    for i, direction in ipairs(config.test_ray_directions) do
        local normalized_dir = normalize(direction)
        local hit = Query.raycast_first(config.test_ray_origin, normalized_dir, 100.0)

        stats.total_raycasts = stats.total_raycasts + 1

        local expected = expected_hits[i]

        if hit then
            stats.successful_hits = stats.successful_hits + 1

            print(string.format("Ray %d: HIT entity %d at distance %.3f", i, hit.entity_id, hit.distance))
            print(string.format("  Hit point: (%.3f, %.3f, %.3f)", hit.point[1], hit.point[2], hit.point[3]))
            print(string.format("  Triangle index: %d", hit.triangle_index))

            -- Validate expected hit
            if config.validate_hits then
                if expected.should_hit then
                    local distance_error = math.abs(hit.distance - expected.approx_distance)
                    if distance_error < 2.0 then  -- Allow 2 units tolerance
                        print(string.format("  ✓ Distance validation passed (error: %.3f)", distance_error))
                    else
                        print(string.format("  ✗ Distance validation failed (error: %.3f, expected ~%.3f)",
                              distance_error, expected.approx_distance))
                        stats.errors = stats.errors + 1
                    end
                else
                    print("  ✗ Unexpected hit (expected miss)")
                    stats.errors = stats.errors + 1
                end
            end
        else
            stats.failed_hits = stats.failed_hits + 1
            print(string.format("Ray %d: MISS", i))

            -- Validate expected miss
            if config.validate_hits and expected.should_hit then
                print("  ✗ Expected hit but got miss")
                stats.errors = stats.errors + 1
            elseif config.validate_hits and not expected.should_hit then
                print("  ✓ Correctly missed")
            end
        end
        print()
    end
end

-- Test raycasting with multiple hits
function bvh_test.test_multiple_hits()
    print("=== BVH Multiple Hits Test ===")

    local direction = normalize({0, -0.2, -0.8})
    local hits = Query.raycast_all(config.test_ray_origin, direction, 100.0)

    stats.total_raycasts = stats.total_raycasts + 1

    print(string.format("Raycast returned %d hits", #hits))

    for i, hit in ipairs(hits) do
        print(string.format("Hit %d: entity %d at distance %.3f", i, hit.entity_id, hit.distance))
        print(string.format("  Point: (%.3f, %.3f, %.3f)", hit.point[1], hit.point[2], hit.point[3]))
    end

    -- Validate that hits are sorted by distance
    for i = 2, #hits do
        if hits[i].distance < hits[i-1].distance then
            print("✗ Hits are not sorted by distance")
            stats.errors = stats.errors + 1
            break
        end
    end

    if #hits > 0 then
        print("✓ Hits are properly sorted by distance")
    end
    print()
end

-- Performance test with many raycasts
function bvh_test.test_performance()
    print("=== BVH Performance Test ===")

    local start_time = os.clock()

    for i = 1, config.performance_test_rays do
        -- Generate random ray directions
        local theta = math.random() * 2 * math.pi
        local phi = math.random() * math.pi

        local direction = {
            math.sin(phi) * math.cos(theta),
            math.sin(phi) * math.sin(theta),
            math.cos(phi)
        }

        local hit = Query.raycast_first(config.test_ray_origin, direction, 100.0)
        stats.total_raycasts = stats.total_raycasts + 1
    end

    local end_time = os.clock()
    local duration = end_time - start_time

    stats.performance_tests = stats.performance_tests + 1

    print(string.format("Performed %d raycasts in %.3f seconds", config.performance_test_rays, duration))
    print(string.format("Average time per raycast: %.6f seconds", duration / config.performance_test_rays))
    print(string.format("Raycasts per second: %.0f", config.performance_test_rays / duration))

    if duration < 0.1 then  -- Should complete 100 raycasts in less than 0.1 seconds
        print("✓ Performance test passed")
    else
        print("✗ Performance test failed - too slow")
        stats.errors = stats.errors + 1
    end
    print()
end

-- Test frustum culling (if available through query API)
function bvh_test.test_frustum_culling()
    print("=== BVH Frustum Culling Test ===")

    -- This would test frustum culling if the API is exposed to Lua
    -- For now, we'll test if we can query visible entities

    print("Note: Frustum culling test requires Query API extension")
    print("Current test validates raycasting performance as proxy")
    print()
end

-- Print final statistics
function bvh_test.print_summary()
    print("=== BVH Test Summary ===")
    print(string.format("Total raycasts performed: %d", stats.total_raycasts))
    print(string.format("Successful hits: %d", stats.successful_hits))
    print(string.format("Failed hits (misses): %d", stats.failed_hits))
    print(string.format("Performance tests run: %d", stats.performance_tests))
    print(string.format("Errors encountered: %d", stats.errors))

    if stats.errors == 0 then
        print("🎉 All BVH tests passed!")
    else
        print(string.format("❌ %d test failures detected", stats.errors))
    end

    print("=== End BVH Test ===")
end

-- Main test runner
function bvh_test.run_all_tests()
    print("Starting BVH Integration Tests...")
    print("Test origin: (" .. config.test_ray_origin[1] .. ", " ..
          config.test_ray_origin[2] .. ", " .. config.test_ray_origin[3] .. ")")
    print()

    bvh_test.test_basic_raycasting()
    bvh_test.test_multiple_hits()
    bvh_test.test_performance()
    bvh_test.test_frustum_culling()
    bvh_test.print_summary()
end

-- Input handling for interactive testing
function bvh_test.on_input_action(action_name, action_value)
    if action_name == "Test Raycast" and action_value.pressed then
        print("\n--- Manual Raycast Test ---")
        bvh_test.test_basic_raycasting()
    elseif action_name == "Performance Test" and action_value.pressed then
        print("\n--- Manual Performance Test ---")
        bvh_test.test_performance()
    elseif action_name == "Toggle BVH" and action_value.pressed then
        print("\n--- BVH Toggle ---")
        print("Note: BVH toggle requires engine-level support")
        print("Current test assumes BVH is enabled")
    end
end

-- Auto-run tests on script start
function bvh_test.start()
    -- Wait a frame for everything to be initialized
    GameObject.waitForNextFrame(function()
        bvh_test.run_all_tests()
    end)
end

-- Register input callbacks
Input.onAction("Test Raycast", function(action_value)
    bvh_test.on_input_action("Test Raycast", action_value)
end)

Input.onAction("Performance Test", function(action_value)
    bvh_test.on_input_action("Performance Test", action_value)
end)

Input.onAction("Toggle BVH", function(action_value)
    bvh_test.on_input_action("Toggle BVH", action_value)
end)

-- Export for use by other scripts
return bvh_test