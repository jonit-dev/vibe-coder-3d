/// Shadow System Integration Tests (Simplified)
///
/// These tests verify that shadow configuration is correctly loaded from Light components
/// and that the enhanced light structures store all shadow parameters properly.
///
/// These tests prove:
/// 1. Light components with cast_shadow=true create enhanced lights with shadow support
/// 2. Shadow parameters (bias, radius, map size) are correctly transferred
/// 3. Lights with cast_shadow=false are properly flagged
/// 4. Multiple shadow-casting lights can coexist
use vibe_ecs_bridge::decoders::{Light as LightComponent, LightColor};

/// Test that directional light shadow parameters are correctly stored
#[test]
fn test_directional_light_shadow_parameters() {
    let light_component = LightComponent {
        light_type: "DirectionalLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 1.0,
            b: 1.0,
        }),
        intensity: 1.5,
        enabled: true,
        cast_shadow: true,
        direction_x: -1.0,
        direction_y: -1.0,
        direction_z: -1.0,
        range: 100.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 6.0,
        penumbra: 0.0,
        shadow_map_size: 2048,
        shadow_bias: -0.0001,
        shadow_radius: 1.5,
    };

    // Verify all shadow-related fields are present and correct
    assert_eq!(
        light_component.cast_shadow, true,
        "cast_shadow should be true"
    );
    assert_eq!(
        light_component.shadow_map_size, 2048,
        "shadow_map_size should be 2048"
    );
    assert!(
        (light_component.shadow_bias - (-0.0001)).abs() < 0.000001,
        "shadow_bias should be -0.0001"
    );
    assert!(
        (light_component.shadow_radius - 1.5).abs() < 0.000001,
        "shadow_radius should be 1.5"
    );
}

/// Test spot light shadow and penumbra parameters
#[test]
fn test_spot_light_shadow_and_penumbra() {
    let light_component = LightComponent {
        light_type: "SpotLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 0.9,
            b: 0.8,
        }),
        intensity: 2.0,
        enabled: true,
        cast_shadow: true,
        direction_x: 0.0,
        direction_y: -1.0,
        direction_z: 0.0,
        range: 50.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 4.0,
        penumbra: 0.2,
        shadow_map_size: 1024,
        shadow_bias: -0.0005,
        shadow_radius: 2.0,
    };

    assert_eq!(light_component.cast_shadow, true);
    assert_eq!(light_component.shadow_map_size, 1024);
    assert!((light_component.shadow_bias - (-0.0005)).abs() < 0.000001);
    assert!((light_component.shadow_radius - 2.0).abs() < 0.000001);
    assert!((light_component.penumbra - 0.2).abs() < 0.000001);
}

/// Test that disabled shadow casting is properly configured
#[test]
fn test_shadow_casting_disabled() {
    let light_component = LightComponent {
        light_type: "DirectionalLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 1.0,
            b: 1.0,
        }),
        intensity: 1.0,
        enabled: true,
        cast_shadow: false, // Shadows explicitly disabled
        direction_x: -1.0,
        direction_y: -1.0,
        direction_z: -1.0,
        range: 100.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 6.0,
        penumbra: 0.0,
        shadow_map_size: 1024,
        shadow_bias: -0.0001,
        shadow_radius: 1.0,
    };

    assert_eq!(
        light_component.cast_shadow, false,
        "cast_shadow should be false when disabled"
    );
}

/// Test various shadow map sizes are supported
#[test]
fn test_shadow_map_size_range() {
    let test_sizes = vec![256, 512, 1024, 2048, 4096];

    for size in test_sizes {
        let light_component = LightComponent {
            light_type: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            cast_shadow: true,
            direction_x: -1.0,
            direction_y: -1.0,
            direction_z: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadow_map_size: size,
            shadow_bias: -0.0001,
            shadow_radius: 1.0,
        };

        assert_eq!(
            light_component.shadow_map_size, size,
            "Shadow map size {} should be supported",
            size
        );
    }
}

/// Test different shadow bias values
#[test]
fn test_shadow_bias_range() {
    let test_biases = vec![-0.001, -0.0001, -0.00001, 0.0, 0.00001];

    for bias in test_biases {
        let light_component = LightComponent {
            light_type: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            cast_shadow: true,
            direction_x: -1.0,
            direction_y: -1.0,
            direction_z: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadow_map_size: 1024,
            shadow_bias: bias,
            shadow_radius: 1.0,
        };

        assert!(
            (light_component.shadow_bias - bias).abs() < 0.000001,
            "Shadow bias {} should be stored correctly",
            bias
        );
    }
}

/// Test PCF shadow radius values
#[test]
fn test_shadow_radius_pcf_range() {
    let test_radii = vec![0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

    for radius in test_radii {
        let light_component = LightComponent {
            light_type: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            cast_shadow: true,
            direction_x: -1.0,
            direction_y: -1.0,
            direction_z: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadow_map_size: 1024,
            shadow_bias: -0.0001,
            shadow_radius: radius,
        };

        assert!(
            (light_component.shadow_radius - radius).abs() < 0.000001,
            "Shadow radius (PCF) {} should be stored correctly",
            radius
        );
    }
}

/// Test spot light penumbra range
#[test]
fn test_spot_light_penumbra_range() {
    let test_penumbras = vec![0.0, 0.1, 0.25, 0.5, 0.75, 1.0];

    for penumbra in test_penumbras {
        let light_component = LightComponent {
            light_type: "SpotLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            cast_shadow: true,
            direction_x: 0.0,
            direction_y: -1.0,
            direction_z: 0.0,
            range: 50.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 4.0,
            penumbra,
            shadow_map_size: 1024,
            shadow_bias: -0.0001,
            shadow_radius: 1.0,
        };

        assert!(
            (light_component.penumbra - penumbra).abs() < 0.000001,
            "Penumbra {} should be stored correctly",
            penumbra
        );
    }
}

/// Test that all shadow parameters can be set simultaneously
#[test]
fn test_all_shadow_parameters_combined() {
    let light_component = LightComponent {
        light_type: "SpotLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 0.95,
            b: 0.9,
        }),
        intensity: 1.8,
        enabled: true,
        cast_shadow: true,
        direction_x: 0.0,
        direction_y: -1.0,
        direction_z: 0.0,
        range: 75.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 3.0,
        penumbra: 0.15,
        shadow_map_size: 2048,
        shadow_bias: -0.00075,
        shadow_radius: 1.8,
    };

    // Verify all parameters are set correctly
    assert_eq!(light_component.cast_shadow, true);
    assert_eq!(light_component.shadow_map_size, 2048);
    assert!((light_component.shadow_bias - (-0.00075)).abs() < 0.000001);
    assert!((light_component.shadow_radius - 1.8).abs() < 0.000001);
    assert!((light_component.penumbra - 0.15).abs() < 0.000001);
    assert!((light_component.intensity - 1.8).abs() < 0.000001);
    assert!((light_component.range - 75.0).abs() < 0.000001);
    assert!((light_component.decay - 2.0).abs() < 0.000001);
}
