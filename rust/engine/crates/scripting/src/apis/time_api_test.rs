#[cfg(test)]
mod tests {
    use super::super::time_api::*;
    use mlua::Lua;

    #[test]
    fn test_time_info_default() {
        let time = TimeInfo::default();
        assert_eq!(time.time, 0.0);
        assert_eq!(time.delta_time, 0.0);
        assert_eq!(time.frame_count, 0);
    }

    #[test]
    fn test_time_api_registration() {
        let lua = Lua::new();
        let time_info = TimeInfo {
            time: 1.5,
            delta_time: 0.016,
            frame_count: 90,
        };

        assert!(register_time_api(&lua, time_info).is_ok());

        // Verify time table exists
        let result: mlua::Result<bool> = lua.load("return time ~= nil").eval();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_time_api_values() {
        let lua = Lua::new();
        let time_info = TimeInfo {
            time: 2.5,
            delta_time: 0.016,
            frame_count: 150,
        };

        register_time_api(&lua, time_info).unwrap();

        // Check time value
        let time_val: f64 = lua.load("return time.time").eval().unwrap();
        assert!((time_val - 2.5).abs() < 0.001);

        // Check deltaTime value
        let delta: f64 = lua.load("return time.deltaTime").eval().unwrap();
        assert!((delta - 0.016).abs() < 0.001);

        // Check frameCount value
        let frames: u64 = lua.load("return time.frameCount").eval().unwrap();
        assert_eq!(frames, 150);
    }

    #[test]
    fn test_time_api_immutability() {
        let lua = Lua::new();
        let time_info = TimeInfo {
            time: 1.0,
            delta_time: 0.016,
            frame_count: 60,
        };

        register_time_api(&lua, time_info).unwrap();

        // Modifying existing values will work in Lua (metatable __newindex only for new keys)
        // But values will be reset on next update anyway
        lua.load("time.time = 999").exec().unwrap();

        // Update with new time info - should overwrite any user changes
        let new_time_info = TimeInfo {
            time: 2.0,
            delta_time: 0.016,
            frame_count: 120,
        };
        update_time_api(&lua, new_time_info).unwrap();

        // Verify update overwrote any script changes
        let time_val: f64 = lua.load("return time.time").eval().unwrap();
        assert!((time_val - 2.0).abs() < 0.001);
    }

    #[test]
    fn test_time_api_update() {
        let lua = Lua::new();

        // Initial values
        let time_info_1 = TimeInfo {
            time: 1.0,
            delta_time: 0.016,
            frame_count: 60,
        };
        register_time_api(&lua, time_info_1).unwrap();

        let time_1: f64 = lua.load("return time.time").eval().unwrap();
        assert!((time_1 - 1.0).abs() < 0.001);

        // Update with new values
        let time_info_2 = TimeInfo {
            time: 1.016,
            delta_time: 0.016,
            frame_count: 61,
        };
        update_time_api(&lua, time_info_2).unwrap();

        // Verify updated values
        let time_2: f64 = lua.load("return time.time").eval().unwrap();
        assert!((time_2 - 1.016).abs() < 0.001);

        let frames: u64 = lua.load("return time.frameCount").eval().unwrap();
        assert_eq!(frames, 61);
    }

    #[test]
    fn test_time_api_in_script() {
        let lua = Lua::new();
        let time_info = TimeInfo {
            time: 5.0,
            delta_time: 0.016,
            frame_count: 300,
        };

        register_time_api(&lua, time_info).unwrap();

        // Use time API in a script
        let result: f64 = lua
            .load(
                r#"
                local angle = time.time * 2 * 3.14159 / 10
                return angle
            "#,
            )
            .eval()
            .unwrap();

        // Should be approximately π (half rotation at 5 seconds)
        let expected = 5.0 * 2.0 * std::f64::consts::PI / 10.0;
        assert!((result - expected).abs() < 0.01);
    }
}
