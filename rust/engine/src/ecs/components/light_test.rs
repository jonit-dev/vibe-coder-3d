#[cfg(test)]
mod tests {
    use super::super::light::*;

    #[test]
    fn test_light_defaults() {
        let light = Light::default();

        assert_eq!(light.light_type, "directional");
        assert!(light.color.is_some());
        assert_eq!(light.intensity, 1.0);
        assert!(light.enabled);
        assert!(light.cast_shadow);
        assert_eq!(light.direction_x, 0.0);
        assert_eq!(light.direction_y, -1.0);
        assert_eq!(light.direction_z, 0.0);
    }

    #[test]
    fn test_light_color_defaults() {
        let color = LightColor::default();

        assert_eq!(color.r, 1.0);
        assert_eq!(color.g, 1.0);
        assert_eq!(color.b, 1.0);
    }

    #[test]
    fn test_light_deserialization_directional() {
        // Test directional light from TypeScript export
        let json = r#"{
            "lightType": "directional",
            "color": {
                "r": 1.0,
                "g": 0.9,
                "b": 0.8
            },
            "intensity": 1.5,
            "enabled": true,
            "castShadow": true,
            "directionX": 0.0,
            "directionY": -1.0,
            "directionZ": 0.0
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert_eq!(light.light_type, "directional");
        assert!(light.color.is_some());
        let color = light.color.unwrap();
        assert_eq!(color.r, 1.0);
        assert_eq!(color.g, 0.9);
        assert_eq!(color.b, 0.8);
        assert_eq!(light.intensity, 1.5);
        assert!(light.enabled);
        assert!(light.cast_shadow);
        assert_eq!(light.direction_x, 0.0);
        assert_eq!(light.direction_y, -1.0);
        assert_eq!(light.direction_z, 0.0);
    }

    #[test]
    fn test_light_deserialization_point() {
        // Test point light with range and decay
        let json = r#"{
            "lightType": "point",
            "color": {
                "r": 1.0,
                "g": 1.0,
                "b": 0.5
            },
            "intensity": 2.0,
            "enabled": true,
            "castShadow": false,
            "range": 20.0,
            "decay": 2.0
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert_eq!(light.light_type, "point");
        assert_eq!(light.intensity, 2.0);
        assert!(light.enabled);
        assert!(!light.cast_shadow);
        assert_eq!(light.range, 20.0);
        assert_eq!(light.decay, 2.0);
    }

    #[test]
    fn test_light_deserialization_spot() {
        // Test spot light with angle and penumbra
        let json = r#"{
            "lightType": "spot",
            "color": {
                "r": 1.0,
                "g": 1.0,
                "b": 1.0
            },
            "intensity": 3.0,
            "enabled": true,
            "castShadow": true,
            "angle": 0.785,
            "penumbra": 0.2,
            "range": 15.0
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert_eq!(light.light_type, "spot");
        assert_eq!(light.intensity, 3.0);
        assert!((light.angle - 0.785).abs() < 0.001);
        assert!((light.penumbra - 0.2).abs() < 0.001);
        assert_eq!(light.range, 15.0);
    }

    #[test]
    fn test_light_deserialization_ambient() {
        // Test ambient light (no direction, range, etc.)
        let json = r#"{
            "lightType": "ambient",
            "color": {
                "r": 0.3,
                "g": 0.3,
                "b": 0.4
            },
            "intensity": 0.5,
            "enabled": true,
            "castShadow": false
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert_eq!(light.light_type, "ambient");
        let color = light.color.unwrap();
        assert!((color.r - 0.3).abs() < 0.001);
        assert!((color.g - 0.3).abs() < 0.001);
        assert!((color.b - 0.4).abs() < 0.001);
        assert_eq!(light.intensity, 0.5);
        assert!(!light.cast_shadow);
    }

    #[test]
    fn test_light_shadow_properties() {
        // Test shadow-related properties
        let json = r#"{
            "lightType": "directional",
            "color": {
                "r": 1.0,
                "g": 1.0,
                "b": 1.0
            },
            "intensity": 1.0,
            "enabled": true,
            "castShadow": true,
            "shadowMapSize": 2048,
            "shadowBias": -0.0002,
            "shadowRadius": 2.0
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert_eq!(light.shadow_map_size, 2048);
        assert!((light.shadow_bias - (-0.0002)).abs() < 0.00001);
        assert_eq!(light.shadow_radius, 2.0);
    }

    #[test]
    fn test_light_partial_deserialization() {
        // Test that missing optional fields use defaults
        let json = r#"{
            "lightType": "directional",
            "color": {
                "r": 1.0,
                "g": 1.0,
                "b": 1.0
            },
            "intensity": 1.0,
            "enabled": true,
            "castShadow": true
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        // Verify defaults are applied
        assert_eq!(light.direction_y, -1.0); // Default direction
        assert_eq!(light.range, 10.0); // Default range
        assert_eq!(light.decay, 1.0); // Default decay
        assert!((light.angle - std::f32::consts::PI / 6.0).abs() < 0.001); // Default angle
        assert!((light.penumbra - 0.1).abs() < 0.001); // Default penumbra
        assert_eq!(light.shadow_map_size, 1024); // Default shadow map size
    }

    #[test]
    fn test_light_disabled() {
        // Test disabled light
        let json = r#"{
            "lightType": "point",
            "color": {
                "r": 1.0,
                "g": 1.0,
                "b": 1.0
            },
            "intensity": 1.0,
            "enabled": false,
            "castShadow": false
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        assert!(!light.enabled);
        assert!(!light.cast_shadow);
    }

    #[test]
    fn test_light_clone() {
        let light = Light {
            light_type: "spot".to_string(),
            color: Some(LightColor {
                r: 0.8,
                g: 0.7,
                b: 0.6,
            }),
            intensity: 2.5,
            enabled: true,
            cast_shadow: true,
            direction_x: 1.0,
            direction_y: -1.0,
            direction_z: 0.0,
            range: 25.0,
            decay: 1.5,
            angle: 0.5,
            penumbra: 0.3,
            shadow_map_size: 2048,
            shadow_bias: -0.0003,
            shadow_radius: 1.5,
        };

        let cloned = light.clone();

        assert_eq!(cloned.light_type, light.light_type);
        assert_eq!(cloned.intensity, light.intensity);
        assert_eq!(cloned.range, light.range);
        assert_eq!(cloned.angle, light.angle);
    }

    #[test]
    fn test_light_full_typescript_export() {
        // Test a complete Light export from TypeScript with all fields
        let json = r#"{
            "lightType": "directional",
            "color": {
                "r": 1.0,
                "g": 0.95,
                "b": 0.9
            },
            "intensity": 1.2,
            "enabled": true,
            "castShadow": true,
            "directionX": 0.5,
            "directionY": -1.0,
            "directionZ": 0.3,
            "range": 100.0,
            "decay": 1.0,
            "angle": 0.523599,
            "penumbra": 0.1,
            "shadowMapSize": 4096,
            "shadowBias": -0.0001,
            "shadowRadius": 1.0
        }"#;

        let light: Light = serde_json::from_str(json).unwrap();

        // Verify all fields are properly parsed
        assert_eq!(light.light_type, "directional");

        let color = light.color.unwrap();
        assert_eq!(color.r, 1.0);
        assert!((color.g - 0.95).abs() < 0.001);
        assert!((color.b - 0.9).abs() < 0.001);

        assert!((light.intensity - 1.2).abs() < 0.001);
        assert!(light.enabled);
        assert!(light.cast_shadow);

        assert!((light.direction_x - 0.5).abs() < 0.001);
        assert!((light.direction_y - (-1.0)).abs() < 0.001);
        assert!((light.direction_z - 0.3).abs() < 0.001);

        assert_eq!(light.range, 100.0);
        assert_eq!(light.decay, 1.0);
        assert!((light.angle - 0.523599).abs() < 0.001);
        assert!((light.penumbra - 0.1).abs() < 0.001);

        assert_eq!(light.shadow_map_size, 4096);
        assert!((light.shadow_bias - (-0.0001)).abs() < 0.00001);
        assert_eq!(light.shadow_radius, 1.0);
    }
}
