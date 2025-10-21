#[cfg(test)]
mod tests {
    use super::super::math_api::*;
    use mlua::Lua;

    #[test]
    fn test_math_api_registration() {
        let lua = Lua::new();
        assert!(register_math_api(&lua).is_ok());

        // Verify math table still exists
        let result: mlua::Result<bool> = lua.load("return math ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_math_constants() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test PI
        let pi: f64 = lua.load("return math.PI").eval().unwrap();
        assert!((pi - std::f64::consts::PI).abs() < 0.000001);

        // Test E
        let e: f64 = lua.load("return math.E").eval().unwrap();
        assert!((e - std::f64::consts::E).abs() < 0.000001);
    }

    #[test]
    fn test_math_clamp() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test clamping to min
        let result: f64 = lua.load("return math.clamp(-5, 0, 100)").eval().unwrap();
        assert_eq!(result, 0.0);

        // Test clamping to max
        let result: f64 = lua.load("return math.clamp(150, 0, 100)").eval().unwrap();
        assert_eq!(result, 100.0);

        // Test value in range
        let result: f64 = lua.load("return math.clamp(50, 0, 100)").eval().unwrap();
        assert_eq!(result, 50.0);
    }

    #[test]
    fn test_math_lerp() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test lerp at t=0
        let result: f64 = lua.load("return math.lerp(10, 20, 0)").eval().unwrap();
        assert_eq!(result, 10.0);

        // Test lerp at t=1
        let result: f64 = lua.load("return math.lerp(10, 20, 1)").eval().unwrap();
        assert_eq!(result, 20.0);

        // Test lerp at t=0.5
        let result: f64 = lua.load("return math.lerp(10, 20, 0.5)").eval().unwrap();
        assert_eq!(result, 15.0);

        // Test lerp at t=0.25
        let result: f64 = lua.load("return math.lerp(0, 100, 0.25)").eval().unwrap();
        assert_eq!(result, 25.0);
    }

    #[test]
    fn test_math_rad_deg_conversion() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test degToRad
        let result: f64 = lua.load("return math.degToRad(180)").eval().unwrap();
        assert!((result - std::f64::consts::PI).abs() < 0.000001);

        let result: f64 = lua.load("return math.degToRad(90)").eval().unwrap();
        assert!((result - std::f64::consts::PI / 2.0).abs() < 0.000001);

        // Test radToDeg
        let result: f64 = lua
            .load("return math.radToDeg(math.PI)")
            .eval()
            .unwrap();
        assert!((result - 180.0).abs() < 0.000001);

        let result: f64 = lua
            .load("return math.radToDeg(math.PI / 2)")
            .eval()
            .unwrap();
        assert!((result - 90.0).abs() < 0.000001);

        // Test round-trip conversion
        let result: f64 = lua
            .load("return math.radToDeg(math.degToRad(45))")
            .eval()
            .unwrap();
        assert!((result - 45.0).abs() < 0.000001);
    }

    #[test]
    fn test_math_distance() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test distance between origin and (3, 4, 0) = 5
        let result: f64 = lua
            .load("return math.distance(0, 0, 0, 3, 4, 0)")
            .eval()
            .unwrap();
        assert!((result - 5.0).abs() < 0.000001);

        // Test distance between same point = 0
        let result: f64 = lua
            .load("return math.distance(1, 2, 3, 1, 2, 3)")
            .eval()
            .unwrap();
        assert!(result.abs() < 0.000001);

        // Test 3D distance (1,1,1) to (4,5,1) = sqrt(9+16+0) = 5
        let result: f64 = lua
            .load("return math.distance(1, 1, 1, 4, 5, 1)")
            .eval()
            .unwrap();
        assert!((result - 5.0).abs() < 0.000001);
    }

    #[test]
    fn test_math_round() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Test rounding up
        let result: f64 = lua.load("return math.round(2.6)").eval().unwrap();
        assert_eq!(result, 3.0);

        // Test rounding down
        let result: f64 = lua.load("return math.round(2.4)").eval().unwrap();
        assert_eq!(result, 2.0);

        // Test rounding .5 (rounds to nearest even in Rust)
        let result: f64 = lua.load("return math.round(2.5)").eval().unwrap();
        assert!(result == 2.0 || result == 3.0); // Banker's rounding

        // Test negative rounding
        let result: f64 = lua.load("return math.round(-2.6)").eval().unwrap();
        assert_eq!(result, -3.0);
    }

    #[test]
    fn test_math_basic_functions_still_work() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Verify Lua's built-in math functions still work
        let result: f64 = lua.load("return math.sin(0)").eval().unwrap();
        assert!(result.abs() < 0.000001);

        let result: f64 = lua.load("return math.cos(0)").eval().unwrap();
        assert!((result - 1.0).abs() < 0.000001);

        let result: f64 = lua.load("return math.sqrt(16)").eval().unwrap();
        assert_eq!(result, 4.0);

        let result: f64 = lua.load("return math.abs(-5)").eval().unwrap();
        assert_eq!(result, 5.0);
    }

    #[test]
    fn test_math_api_in_gameplay_script() {
        let lua = Lua::new();
        register_math_api(&lua).unwrap();

        // Simulate a gameplay script using math utilities
        let result: f64 = lua
            .load(
                r#"
                -- Calculate clamped health after damage
                local health = 75
                local damage = 25
                health = math.clamp(health - damage, 0, 100)

                -- Lerp towards target position
                local current_x = 0
                local target_x = 100
                local new_x = math.lerp(current_x, target_x, 0.1)

                -- Calculate distance to enemy
                local player_pos = {0, 0, 0}
                local enemy_pos = {3, 4, 0}
                local dist = math.distance(
                    player_pos[1], player_pos[2], player_pos[3],
                    enemy_pos[1], enemy_pos[2], enemy_pos[3]
                )

                return health + new_x + dist  -- 50 + 10 + 5 = 65
            "#,
            )
            .eval()
            .unwrap();

        assert!((result - 65.0).abs() < 0.000001);
    }
}
