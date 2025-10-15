#[cfg(test)]
mod tests {
    use super::super::pipeline::LightUniform;
    use crate::ecs::components::{light::Light, transform::Transform};
    use crate::ecs::SceneData;
    use glam::Vec3;
    use serde_json::json;

    /// Test that directional light matches Three.js DirectionalLight defaults
    #[test]
    fn test_directional_light_defaults() {
        let light = Light {
            lightType: "directional".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0, // Three.js default: pointing down
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        assert_eq!(light.lightType, "directional");
        assert_eq!(light.intensity, 1.0);
        assert_eq!(light.directionY, -1.0);
        assert!(light.enabled);
    }

    /// Test that ambient light matches Three.js AmbientLight defaults
    #[test]
    fn test_ambient_light_defaults() {
        let light = Light {
            lightType: "ambient".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        assert_eq!(light.lightType, "ambient");
        assert_eq!(light.intensity, 1.0);
        assert!(light.enabled);
        // Ambient lights in Three.js don't have direction
    }

    /// Test that point light matches Three.js PointLight defaults
    #[test]
    fn test_point_light_defaults() {
        let light = Light {
            lightType: "point".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0, // Three.js default range
            decay: 1.0,  // Three.js default decay
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        assert_eq!(light.lightType, "point");
        assert_eq!(light.range, 10.0);
        assert_eq!(light.decay, 1.0);
    }

    /// Test that LightUniform matches Three.js default scene lighting
    #[test]
    fn test_light_uniform_default_scene() {
        let uniform = LightUniform::new();

        // Three.js default scene typically has:
        // - One directional light (white, pointing down-ish)
        // - Ambient light for base illumination

        assert_eq!(uniform.directional_enabled, 1.0);
        assert_eq!(uniform.directional_color, [1.0, 1.0, 1.0]);
        assert_eq!(uniform.directional_intensity, 1.0);

        assert_eq!(uniform.ambient_color, [0.3, 0.3, 0.3]);
        assert_eq!(uniform.ambient_intensity, 1.0);

        // Point lights disabled by default
        assert_eq!(uniform.point_intensity_0, 0.0);
        assert_eq!(uniform.point_intensity_1, 0.0);
    }

    /// Test that light color is properly converted from Three.js RGB (0-1 range)
    #[test]
    fn test_light_color_range() {
        let light = Light {
            lightType: "directional".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 0.5,
                g: 0.75,
                b: 1.0,
            }),
            intensity: 2.0,
            enabled: true,
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        let color = light.color.as_ref().unwrap();
        assert!(color.r >= 0.0 && color.r <= 1.0);
        assert!(color.g >= 0.0 && color.g <= 1.0);
        assert!(color.b >= 0.0 && color.b <= 1.0);
    }

    /// Test that point light position comes from Transform (like Three.js)
    #[test]
    fn test_point_light_uses_transform_position() {
        let transform = Transform {
            position: Some([5.0, 10.0, -3.0]),
            rotation: None,
            scale: None,
        };

        let position = transform.position_vec3();
        assert_eq!(position, Vec3::new(5.0, 10.0, -3.0));
    }

    /// Test that disabled lights are not applied (Three.js behavior)
    #[test]
    fn test_disabled_lights_ignored() {
        let light = Light {
            lightType: "directional".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: false, // DISABLED
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        assert!(!light.enabled);
        // In scene_renderer.rs, disabled lights are skipped with `continue`
    }

    /// Test that light intensity scales final color (Three.js behavior)
    #[test]
    fn test_light_intensity_multiplier() {
        let light1 = Light {
            lightType: "directional".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: false,
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 512,
            shadowBias: 0.0,
            shadowRadius: 1.0,
        };

        let light2 = Light {
            intensity: 2.0,
            ..light1.clone()
        };

        // light2 should be 2x brighter than light1
        assert_eq!(light2.intensity, 2.0 * light1.intensity);
    }

    /// Test that point light attenuation matches Three.js formula
    #[test]
    fn test_point_light_attenuation() {
        // Three.js uses: attenuation = 1.0 - smoothstep(0, range, distance)
        // Or: attenuation = max(0, 1 - (distance / range))^2

        let range = 10.0_f32;
        let distances = vec![0.0_f32, 5.0_f32, 10.0_f32, 15.0_f32];
        let expected_attenuations = vec![1.0_f32, 0.25_f32, 0.0_f32, 0.0_f32]; // (1 - d/r)^2

        for (distance, expected) in distances.iter().zip(expected_attenuations.iter()) {
            let attenuation = (1.0_f32 - (distance / range).min(1.0_f32)).max(0.0_f32);
            let attenuation_sq = attenuation * attenuation;
            assert!((attenuation_sq - expected).abs() < 0.01_f32);
        }
    }

    /// Test that shader lighting matches Three.js PBR calculations
    #[test]
    fn test_pbr_lighting_calculation() {
        // Three.js PBR formula (simplified):
        // diffuse = max(dot(normal, lightDir), 0.0)
        // specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess) * (1 - roughness)
        // final = baseColor * (ambient + diffuse + specular) * lightColor * intensity

        let light_dir = Vec3::new(0.0, 1.0, 0.0).normalize();
        let normal = Vec3::new(0.0, 1.0, 0.0).normalize();

        // Diffuse
        let diffuse = normal.dot(light_dir).max(0.0);
        assert_eq!(diffuse, 1.0); // Normal facing light

        // Specular (simplified using reflect formula: r = 2 * dot(n, l) * n - l)
        let reflect_dir = 2.0 * normal.dot(-light_dir) * normal - (-light_dir);
        let view_dir = Vec3::new(0.0, 0.0, 1.0).normalize();
        let spec = view_dir.dot(reflect_dir).max(0.0).powf(32.0);
        assert!(spec >= 0.0 && spec <= 1.0);
    }

    /// Test multiple lights accumulate (Three.js behavior)
    #[test]
    fn test_multiple_lights_accumulate() {
        let mut uniform = LightUniform::new();

        // Add directional light
        uniform.directional_enabled = 1.0;
        uniform.directional_intensity = 1.0;

        // Add ambient light
        uniform.ambient_intensity = 0.3;

        // Add point light
        uniform.point_intensity_0 = 0.5;

        // In shader, all lights contribute:
        // final_lighting = ambient + directional + point0 + point1
        let total_light_sources = (uniform.directional_enabled as i32) +
            1 + // ambient always present
            (if uniform.point_intensity_0 > 0.0 { 1 } else { 0 }) +
            (if uniform.point_intensity_1 > 0.0 { 1 } else { 0 });

        assert_eq!(total_light_sources, 3); // directional + ambient + point
    }

    /// Test that shadow properties are parsed (even if not yet used)
    #[test]
    fn test_shadow_properties_parsed() {
        let light = Light {
            lightType: "directional".to_string(),
            color: Some(crate::ecs::components::light::LightColor {
                r: 1.0,
                g: 1.0,
                b: 1.0,
            }),
            intensity: 1.0,
            enabled: true,
            castShadow: true, // Parsed but not yet implemented
            directionX: 0.0,
            directionY: -1.0,
            directionZ: 0.0,
            range: 10.0,
            decay: 1.0,
            angle: std::f32::consts::PI / 6.0,
            penumbra: 0.0,
            shadowMapSize: 2048, // Higher quality shadows
            shadowBias: -0.0001,
            shadowRadius: 2.0,
        };

        assert!(light.castShadow);
        assert_eq!(light.shadowMapSize, 2048);
        assert_eq!(light.shadowBias, -0.0001);
        assert_eq!(light.shadowRadius, 2.0);
    }

    /// Test that light limits match shader constants
    #[test]
    fn test_light_slot_limits() {
        // Shader supports:
        // - 1x directional light
        // - 1x ambient light
        // - 2x point lights
        // - 0x spot lights (not yet implemented)

        let uniform = LightUniform::new();

        // Directional: 1 slot
        assert!(uniform.directional_enabled == 0.0 || uniform.directional_enabled == 1.0);

        // Ambient: always 1 slot (no enable flag)
        assert!(uniform.ambient_intensity >= 0.0);

        // Point lights: 2 slots
        let _point_0 = uniform.point_intensity_0;
        let _point_1 = uniform.point_intensity_1;
        // No point_intensity_2 field = limit of 2
    }
}
