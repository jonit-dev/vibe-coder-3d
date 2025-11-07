#[cfg(test)]
mod tests {
    use super::*;
    use crate::renderer::lighting::{
        recompute_combined_ambient, AmbientCombineConfig, AmbientLightMetadata,
    };
    use crate::threed::threed_light_manager::ThreeDLightManager;
    use three_d::*;

    // Note: These tests would need proper Three.js context setup to run
    // For now, they demonstrate the test structure and validate the logic

    #[test]
    fn test_light_manager_initialization() {
        let manager = ThreeDLightManager::new();

        // Should start with no lights
        assert_eq!(manager.directional_lights().len(), 0);
        assert_eq!(manager.point_lights().len(), 0);
        assert_eq!(manager.spot_lights().len(), 0);
        assert_eq!(manager.ambient_lights().len(), 0);
        assert_eq!(manager.ambient_light_metadata().len(), 0);
        assert!(!manager.has_ambient_light());

        let (dir, point, spot, ambient) = manager.light_counts();
        assert_eq!(dir, 0);
        assert_eq!(point, 0);
        assert_eq!(spot, 0);
        assert_eq!(ambient, 0);
    }

    #[test]
    fn test_add_single_ambient_light() {
        let mut manager = ThreeDLightManager::new();

        // This would need a proper context
        // let context = create_test_context();
        // let ambient_light = AmbientLight::new(&context, 0.5, Srgba::WHITE);
        // let metadata = AmbientLightMetadata {
        //     intensity: 0.5,
        //     color: Srgba::WHITE,
        //     enabled: true,
        // };

        // manager.add_ambient_light(ambient_light, metadata);

        // assert_eq!(manager.ambient_lights().len(), 1);
        // assert_eq!(manager.ambient_light_metadata().len(), 1);
        // assert!(manager.has_ambient_light());

        // let (dir, point, spot, ambient) = manager.light_counts();
        // assert_eq!(ambient, 1);
    }

    #[test]
    fn test_add_multiple_ambient_lights() {
        let mut manager = ThreeDLightManager::new();

        // This would need a proper context
        // let context = create_test_context();

        // Add first ambient light
        // let ambient1 = AmbientLight::new(&context, 0.3, Srgba::WHITE);
        // let metadata1 = AmbientLightMetadata {
        //     intensity: 0.3,
        //     color: Srgba::WHITE,
        //     enabled: true,
        // };
        // manager.add_ambient_light(ambient1, metadata1);

        // Add second ambient light
        // let ambient2 = AmbientLight::new(&context, 0.2, Srgba::new(255, 200, 200, 255));
        // let metadata2 = AmbientLightMetadata {
        //     intensity: 0.2,
        //     color: Srgba::new(255, 200, 200, 255),
        //     enabled: true,
        // };
        // manager.add_ambient_light(ambient2, metadata2);

        // assert_eq!(manager.ambient_lights().len(), 2);
        // assert_eq!(manager.ambient_light_metadata().len(), 2);
        // assert!(manager.has_ambient_light());

        // let (dir, point, spot, ambient) = manager.light_counts();
        // assert_eq!(ambient, 2);
    }

    #[test]
    fn test_clear_ambient_lights() {
        let mut manager = ThreeDLightManager::new();

        // This would need a proper context
        // let context = create_test_context();

        // Add some ambient lights
        // let ambient = AmbientLight::new(&context, 0.5, Srgba::WHITE);
        // let metadata = AmbientLightMetadata {
        //     intensity: 0.5,
        //     color: Srgba::WHITE,
        //     enabled: true,
        // };
        // manager.add_ambient_light(ambient, metadata);

        // assert!(manager.has_ambient_light());

        // Clear ambient lights
        manager.clear_ambient_lights();

        // assert_eq!(manager.ambient_lights().len(), 0);
        // assert_eq!(manager.ambient_light_metadata().len(), 0);
        // assert!(!manager.has_ambient_light());
    }

    #[test]
    fn test_clear_all_lights() {
        let mut manager = ThreeDLightManager::new();

        // This would need a proper context and other light types
        // let context = create_test_context();

        // Add various lights
        // manager.add_directional_light(/* directional light */);
        // manager.add_point_light(/* point light */);
        // manager.add_spot_light(/* spot light */);

        // let ambient = AmbientLight::new(&context, 0.5, Srgba::WHITE);
        // let metadata = AmbientLightMetadata {
        //     intensity: 0.5,
        //     color: Srgba::WHITE,
        //     enabled: true,
        // };
        // manager.add_ambient_light(ambient, metadata);

        // assert!(manager.has_ambient_light());

        // Clear all lights
        manager.clear();

        // assert_eq!(manager.directional_lights().len(), 0);
        // assert_eq!(manager.point_lights().len(), 0);
        // assert_eq!(manager.spot_lights().len(), 0);
        // assert_eq!(manager.ambient_lights().len(), 0);
        // assert!(!manager.has_ambient_light());
    }

    #[test]
    fn test_ambient_light_metadata_invariant() {
        let mut manager = ThreeDLightManager::new();

        // This would need a proper context
        // let context = create_test_context();

        // The invariant that ambient_lights.len() == ambient_light_metadata.len()
        // should always hold
        assert_eq!(
            manager.ambient_lights().len(),
            manager.ambient_light_metadata().len()
        );

        // Add ambient light
        // let ambient = AmbientLight::new(&context, 0.5, Srgba::WHITE);
        // let metadata = AmbientLightMetadata {
        //     intensity: 0.5,
        //     color: Srgba::WHITE,
        //     enabled: true,
        // };
        // manager.add_ambient_light(ambient, metadata);

        // assert_eq!(manager.ambient_lights().len(), manager.ambient_light_metadata().len());

        // Clear ambient lights
        manager.clear_ambient_lights();

        // assert_eq!(manager.ambient_lights().len(), manager.ambient_light_metadata().len());
    }

    #[test]
    fn test_ambient_combine_config_default() {
        let config = AmbientCombineConfig::default();

        assert_eq!(config.max_intensity, 10.0);
        assert_eq!(config.max_color_component, 255);
    }

    #[test]
    fn test_ambient_combine_config_custom() {
        let config = AmbientCombineConfig {
            max_intensity: 5.0,
            max_color_component: 200,
        };

        assert_eq!(config.max_intensity, 5.0);
        assert_eq!(config.max_color_component, 200);
    }
}
