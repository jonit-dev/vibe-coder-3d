//! Light uniform building - builds light uniform from scene entities.
//!
//! This module extracts light data from scene entities and constructs LightUniform.

use super::super::pipeline::LightUniform;
use crate::ecs::components::{light::Light, transform::Transform};
use crate::ecs::SceneData;
use glam::Vec3;

/// Output from light extraction
pub struct LightBuildResult {
    pub light_uniform: LightUniform,
    pub directional_shadow_enabled: bool,
    pub directional_shadow_bias: f32,
    pub directional_shadow_radius: f32,
    pub directional_light_direction: Vec3,
}

/// Builder for light uniforms from scene
pub struct LightBuilder;

impl LightBuilder {
    /// Extract lights from scene (pure function)
    pub fn from_scene(scene: &SceneData) -> LightBuildResult {
        let mut light_uniform = LightUniform::new();

        // Parity config defaults
        light_uniform.physically_correct_lights = 1.0; // match Three.js default true in modern renderer
        light_uniform.exposure = 1.0; // toneMappingExposure
        light_uniform.tone_mapping = 1.0; // ACES on

        let mut directional_light_set = false;
        let mut ambient_light_set = false;
        let mut point_light_count = 0;
        let mut dir_shadow_enabled = false;
        let mut dir_shadow_bias = 0.0005;
        let mut dir_shadow_radius = 2.0;
        let mut dir_light_dir = Vec3::new(0.5, -1.0, 0.5);

        for (idx, entity) in scene.entities.iter().enumerate() {
            let unnamed = "Unnamed".to_string();
            let entity_name = entity.name.as_ref().unwrap_or(&unnamed);
            log::debug!("Processing entity #{}: '{}'", idx, entity_name);

            // Check for Light component
            if entity.has_component("Light") {
                if let Some(light) = entity.get_component::<Light>("Light") {
                    log::debug!("  Light component found:");
                    log::debug!("    Type: {}", light.lightType);
                    log::debug!("    Enabled: {}", light.enabled);
                    log::debug!("    Intensity: {}", light.intensity);

                    // Only process enabled lights
                    if !light.enabled {
                        log::debug!("    Skipping (disabled)");
                        continue;
                    }

                    let light_color = light
                        .color
                        .as_ref()
                        .map(|c| [c.r, c.g, c.b])
                        .unwrap_or([1.0, 1.0, 1.0]);

                    match light.lightType.as_str() {
                        "directional" => {
                            if !directional_light_set {
                                log::info!(
                                    "  ✓ Using directional light: intensity={}, color={:?}",
                                    light.intensity,
                                    light_color
                                );
                                light_uniform.directional_direction =
                                    [light.directionX, light.directionY, light.directionZ];
                                light_uniform.directional_intensity = light.intensity;
                                light_uniform.directional_color = light_color;
                                light_uniform.directional_enabled = 1.0;
                                dir_shadow_enabled = light.castShadow;
                                dir_shadow_bias = light.shadowBias;
                                dir_shadow_radius = light.shadowRadius;
                                dir_light_dir =
                                    Vec3::new(light.directionX, light.directionY, light.directionZ);
                                directional_light_set = true;
                            } else {
                                log::debug!("    Skipping (directional light already set)");
                            }
                        }
                        "ambient" => {
                            if !ambient_light_set {
                                log::info!(
                                    "  ✓ Using ambient light: intensity={}, color={:?}",
                                    light.intensity,
                                    light_color
                                );
                                light_uniform.ambient_color = light_color;
                                light_uniform.ambient_intensity = light.intensity;
                                ambient_light_set = true;
                            } else {
                                log::debug!("    Skipping (ambient light already set)");
                            }
                        }
                        "point" => {
                            if point_light_count < 2 {
                                log::info!(
                                    "  ✓ Using point light #{}: intensity={}, range={}, color={:?}",
                                    point_light_count,
                                    light.intensity,
                                    light.range,
                                    light_color
                                );

                                // Get transform for point light position
                                let transform = entity
                                    .get_component::<Transform>("Transform")
                                    .unwrap_or_default();
                                let position = transform.position_vec3();

                                if point_light_count == 0 {
                                    light_uniform.point_position_0 =
                                        [position.x, position.y, position.z];
                                    light_uniform.point_intensity_0 = light.intensity;
                                    light_uniform.point_color_0 = light_color;
                                    light_uniform.point_range_0 = light.range;
                                    light_uniform.point_decay_0 = light.decay;
                                } else {
                                    light_uniform.point_position_1 =
                                        [position.x, position.y, position.z];
                                    light_uniform.point_intensity_1 = light.intensity;
                                    light_uniform.point_color_1 = light_color;
                                    light_uniform.point_range_1 = light.range;
                                    light_uniform.point_decay_1 = light.decay;
                                }
                                point_light_count += 1;
                            } else {
                                log::debug!("    Skipping (max 2 point lights already set)");
                            }
                        }
                        "spot" => {
                            log::info!(
                                "  ✓ Using spot light: intensity={}, angle={}, penumbra={}, range={}, color={:?}",
                                light.intensity,
                                light.angle,
                                light.penumbra,
                                light.range,
                                light_color
                            );

                            // Get transform for spot light position
                            let transform = entity
                                .get_component::<Transform>("Transform")
                                .unwrap_or_default();
                            let position = transform.position_vec3();

                            light_uniform.spot_position = [position.x, position.y, position.z];
                            light_uniform.spot_intensity = light.intensity;
                            light_uniform.spot_direction =
                                [light.directionX, light.directionY, light.directionZ];
                            light_uniform.spot_angle = light.angle;
                            light_uniform.spot_color = light_color;
                            light_uniform.spot_penumbra = light.penumbra;
                            light_uniform.spot_range = light.range;
                            light_uniform.spot_decay = light.decay;
                        }
                        _ => {
                            log::warn!("    Unknown light type: {}", light.lightType);
                        }
                    }
                }
            }
        }

        LightBuildResult {
            light_uniform,
            directional_shadow_enabled: dir_shadow_enabled,
            directional_shadow_bias: dir_shadow_bias,
            directional_shadow_radius: dir_shadow_radius,
            directional_light_direction: dir_light_dir,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ecs::components::light::LightColor;
    use vibe_scene::{Entity, EntityId};

    #[test]
    fn test_from_scene_empty() {
        let scene = SceneData {
            entities: vec![],
            materials: None,
        };
        let result = LightBuilder::from_scene(&scene);

        // Should have defaults
        assert_eq!(result.light_uniform.directional_enabled, 1.0);
        assert_eq!(result.light_uniform.ambient_intensity, 1.0);
    }

    #[test]
    fn test_from_scene_directional_light() {
        let mut entity = Entity::new(EntityId::from_u64(1));
        let light = Light {
            lightType: "directional".to_string(),
            enabled: true,
            intensity: 2.0,
            color: Some(LightColor { r: 1.0, g: 0.5, b: 0.0 }),
            directionX: 1.0,
            directionY: -1.0,
            directionZ: 0.0,
            castShadow: true,
            shadowBias: 0.001,
            shadowRadius: 3.0,
            ..Default::default()
        };
        entity.add_component("Light", light);

        let scene = SceneData {
            entities: vec![entity],
            materials: None,
        };
        let result = LightBuilder::from_scene(&scene);

        assert_eq!(result.light_uniform.directional_intensity, 2.0);
        assert_eq!(result.light_uniform.directional_color, [1.0, 0.5, 0.0]);
        assert_eq!(result.light_uniform.directional_direction, [1.0, -1.0, 0.0]);
        assert_eq!(result.directional_shadow_enabled, true);
        assert_eq!(result.directional_shadow_bias, 0.001);
        assert_eq!(result.directional_shadow_radius, 3.0);
    }

    #[test]
    fn test_from_scene_ambient_light() {
        let mut entity = Entity::new(EntityId::from_u64(1));
        let light = Light {
            lightType: "ambient".to_string(),
            enabled: true,
            intensity: 0.5,
            color: Some(LightColor { r: 0.2, g: 0.2, b: 0.3 }),
            ..Default::default()
        };
        entity.add_component("Light", light);

        let scene = SceneData {
            entities: vec![entity],
            materials: None,
        };
        let result = LightBuilder::from_scene(&scene);

        assert_eq!(result.light_uniform.ambient_intensity, 0.5);
        assert_eq!(result.light_uniform.ambient_color, [0.2, 0.2, 0.3]);
    }

    #[test]
    fn test_from_scene_point_lights() {
        let mut entity1 = Entity::new(EntityId::from_u64(1));
        let mut entity2 = Entity::new(EntityId::from_u64(2));

        let transform1 = Transform {
            position: Some([1.0, 2.0, 3.0]),
            ..Default::default()
        };
        entity1.add_component("Transform", transform1);

        let light1 = Light {
            lightType: "point".to_string(),
            enabled: true,
            intensity: 1.0,
            range: 10.0,
            decay: 2.0,
            ..Default::default()
        };
        entity1.add_component("Light", light1);

        let transform2 = Transform {
            position: Some([4.0, 5.0, 6.0]),
            ..Default::default()
        };
        entity2.add_component("Transform", transform2);

        let light2 = Light {
            lightType: "point".to_string(),
            enabled: true,
            intensity: 1.5,
            range: 15.0,
            decay: 1.0,
            ..Default::default()
        };
        entity2.add_component("Light", light2);

        let scene = SceneData {
            entities: vec![entity1, entity2],
            materials: None,
        };
        let result = LightBuilder::from_scene(&scene);

        assert_eq!(result.light_uniform.point_intensity_0, 1.0);
        assert_eq!(result.light_uniform.point_position_0, [1.0, 2.0, 3.0]);
        assert_eq!(result.light_uniform.point_range_0, 10.0);
        assert_eq!(result.light_uniform.point_decay_0, 2.0);

        assert_eq!(result.light_uniform.point_intensity_1, 1.5);
        assert_eq!(result.light_uniform.point_position_1, [4.0, 5.0, 6.0]);
        assert_eq!(result.light_uniform.point_range_1, 15.0);
        assert_eq!(result.light_uniform.point_decay_1, 1.0);
    }

    #[test]
    fn test_from_scene_disabled_light_ignored() {
        let mut entity = Entity::new(EntityId::from_u64(1));
        let light = Light {
            lightType: "directional".to_string(),
            enabled: false, // Disabled
            intensity: 5.0,
            ..Default::default()
        };
        entity.add_component("Light", light);

        let scene = SceneData {
            entities: vec![entity],
            materials: None,
        };
        let result = LightBuilder::from_scene(&scene);

        // Should use defaults, not the disabled light
        assert_eq!(result.light_uniform.directional_intensity, 1.0);
    }
}
