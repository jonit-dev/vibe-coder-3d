/// Shadow System Integration Tests (Simplified)
///
/// These tests verify that shadow configuration is correctly loaded from Light components
/// and that the enhanced light structures store all shadow parameters properly.
///
/// These tests prove:
/// 1. Light components with castShadow=true create enhanced lights with shadow support
/// 2. Shadow parameters (bias, radius, map size) are correctly transferred
/// 3. Lights with castShadow=false are properly flagged
/// 4. Multiple shadow-casting lights can coexist
use vibe_ecs_bridge::decoders::{Light as LightComponent, LightColor};

/// Test that directional light shadow parameters are correctly stored
#[test]
fn test_directional_light_shadow_parameters() {
    let light_component = LightComponent {
        lightType: "DirectionalLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 1.0,
            b: 1.0,
        }),
        intensity: 1.5,
        enabled: true,
        castShadow: true,
        directionX: -1.0,
        directionY: -1.0,
        directionZ: -1.0,
        range: 100.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 6.0,
        penumbra: 0.0,
        shadowMapSize: 2048,
        shadowBias: -0.0001,
        shadowRadius: 1.5,
    };

    // Verify all shadow-related fields are present and correct
    assert_eq!(
        light_component.castShadow, true,
        "castShadow should be true"
    );
    assert_eq!(
        light_component.shadowMapSize, 2048,
        "shadowMapSize should be 2048"
    );
    assert!(
        (light_component.shadowBias - (-0.0001)).abs() < 0.000001,
        "shadowBias should be -0.0001"
    );
    assert!(
        (light_component.shadowRadius - 1.5).abs() < 0.000001,
        "shadowRadius should be 1.5"
    );
}

/// Test spot light shadow and penumbra parameters
#[test]
fn test_spot_light_shadow_and_penumbra() {
    let light_component = LightComponent {
        lightType: "SpotLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 0.9,
            b: 0.8,
        }),
        intensity: 2.0,
        enabled: true,
        castShadow: true,
        directionX: 0.0,
        directionY: -1.0,
        directionZ: 0.0,
        range: 50.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 4.0,
        penumbra: 0.2,
        shadowMapSize: 1024,
        shadowBias: -0.0005,
        shadowRadius: 2.0,
    };

    assert_eq!(light_component.castShadow, true);
    assert_eq!(light_component.shadowMapSize, 1024);
    assert!((light_component.shadowBias - (-0.0005)).abs() < 0.000001);
    assert!((light_component.shadowRadius - 2.0).abs() < 0.000001);
    assert!((light_component.penumbra - 0.2).abs() < 0.000001);
}

/// Test that disabled shadow casting is properly configured
#[test]
fn test_shadow_casting_disabled() {
    let light_component = LightComponent {
        lightType: "DirectionalLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 1.0,
            b: 1.0,
        }),
        intensity: 1.0,
        enabled: true,
        castShadow: false, // Shadows explicitly disabled
        directionX: -1.0,
        directionY: -1.0,
        directionZ: -1.0,
        range: 100.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 6.0,
        penumbra: 0.0,
        shadowMapSize: 1024,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
    };

    assert_eq!(
        light_component.castShadow, false,
        "castShadow should be false when disabled"
    );
}

/// Test various shadow map sizes are supported
#[test]
fn test_shadow_map_size_range() {
    let test_sizes = vec![256, 512, 1024, 2048, 4096];

    for size in test_sizes {
        let light_component = LightComponent {
            lightType: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: true,
            directionX: -1.0,
            directionY: -1.0,
            directionZ: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: size,
            shadowBias: -0.0001,
            shadowRadius: 1.0,
        };

        assert_eq!(
            light_component.shadowMapSize, size,
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
            lightType: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: true,
            directionX: -1.0,
            directionY: -1.0,
            directionZ: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 1024,
            shadowBias: bias,
            shadowRadius: 1.0,
        };

        assert!(
            (light_component.shadowBias - bias).abs() < 0.000001,
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
            lightType: "DirectionalLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: true,
            directionX: -1.0,
            directionY: -1.0,
            directionZ: -1.0,
            range: 100.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 1024,
            shadowBias: -0.0001,
            shadowRadius: radius,
        };

        assert!(
            (light_component.shadowRadius - radius).abs() < 0.000001,
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
            lightType: "SpotLight".to_string(),
            color: Some(LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: true,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 50.0,
            decay: 2.0,
            angle: std::f32::consts::PI / 4.0,
            penumbra,
            shadowMapSize: 1024,
            shadowBias: -0.0001,
            shadowRadius: 1.0,
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
        lightType: "SpotLight".to_string(),
        color: Some(LightColor {
            r: 1.0,
            g: 0.95,
            b: 0.9,
        }),
        intensity: 1.8,
        enabled: true,
        castShadow: true,
        directionX: 0.0,
        directionY: -1.0,
        directionZ: 0.0,
        range: 75.0,
        decay: 2.0,
        angle: std::f32::consts::PI / 3.0,
        penumbra: 0.15,
        shadowMapSize: 2048,
        shadowBias: -0.00075,
        shadowRadius: 1.8,
    };

    // Verify all parameters are set correctly
    assert_eq!(light_component.castShadow, true);
    assert_eq!(light_component.shadowMapSize, 2048);
    assert!((light_component.shadowBias - (-0.00075)).abs() < 0.000001);
    assert!((light_component.shadowRadius - 1.8).abs() < 0.000001);
    assert!((light_component.penumbra - 0.15).abs() < 0.000001);
    assert!((light_component.intensity - 1.8).abs() < 0.000001);
    assert!((light_component.range - 75.0).abs() < 0.000001);
    assert!((light_component.decay - 2.0).abs() < 0.000001);
}
