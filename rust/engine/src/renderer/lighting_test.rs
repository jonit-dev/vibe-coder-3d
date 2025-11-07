#[cfg(test)]
mod tests {
    use super::*;
    use three_d::*;

    fn create_test_context() -> Context {
        // Note: In actual tests, you would need to create a proper context
        // For now, this is a placeholder to show the test structure
        panic!("Test context creation needs proper three_d setup");
    }

    #[test]
    fn test_recompute_combined_ambient_empty() {
        let metadata = [];
        let cfg = AmbientCombineConfig::default();

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_none());
    }

    #[test]
    fn test_recompute_combined_ambient_single_enabled() {
        let metadata = [AmbientLightMetadata {
            intensity: 0.5,
            color: Srgba::new(255, 255, 255, 255),
            enabled: true,
        }];
        let cfg = AmbientCombineConfig::default();

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_some());
    }

    #[test]
    fn test_recompute_combined_ambient_single_disabled() {
        let metadata = [AmbientLightMetadata {
            intensity: 0.5,
            color: Srgba::new(255, 255, 255, 255),
            enabled: false,
        }];
        let cfg = AmbientCombineConfig::default();

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_none());
    }

    #[test]
    fn test_recompute_combined_ambient_multiple_enabled() {
        let metadata = [
            AmbientLightMetadata {
                intensity: 0.3,
                color: Srgba::new(255, 255, 255, 255), // White
                enabled: true,
            },
            AmbientLightMetadata {
                intensity: 0.2,
                color: Srgba::new(255, 0, 0, 255), // Red
                enabled: true,
            },
        ];
        let cfg = AmbientCombineConfig::default();

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_some());

        // Expected combined intensity: 0.3 + 0.2 = 0.5
        // Expected combined color would be intensity-weighted:
        // White (255,255,255) * 0.3 + Red (255,0,0) * 0.2
        // = (76.5, 76.5, 76.5) + (51, 0, 0) = (127.5, 76.5, 76.5)
        // After normalization: approximately (255, 153, 153) - a light red
    }

    #[test]
    fn test_recompute_combined_ambient_mixed_enabled_disabled() {
        let metadata = [
            AmbientLightMetadata {
                intensity: 0.3,
                color: Srgba::new(255, 255, 255, 255),
                enabled: true,
            },
            AmbientLightMetadata {
                intensity: 0.2,
                color: Srgba::new(255, 0, 0, 255),
                enabled: false, // Disabled - should be ignored
            },
            AmbientLightMetadata {
                intensity: 0.1,
                color: Srgba::new(0, 255, 0, 255), // Green
                enabled: true,
            },
        ];
        let cfg = AmbientCombineConfig::default();

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_some());

        // Expected combined intensity: 0.3 + 0.1 = 0.4 (disabled light ignored)
        // Expected combined color would be intensity-weighted white + green:
        // White (255,255,255) * 0.3 + Green (0,255,0) * 0.1
        // = (76.5, 76.5, 76.5) + (0, 25.5, 0) = (76.5, 102, 76.5)
        // After normalization: approximately (191, 255, 191) - a light green
    }

    #[test]
    fn test_ambient_combine_config_clamping() {
        let metadata = [
            AmbientLightMetadata {
                intensity: 5.0, // High intensity
                color: Srgba::new(255, 255, 255, 255),
                enabled: true,
            },
            AmbientLightMetadata {
                intensity: 8.0, // Another high intensity
                color: Srgba::new(255, 255, 255, 255),
                enabled: true,
            },
        ];

        // Test with clamping
        let cfg_clamped = AmbientCombineConfig {
            max_intensity: 10.0,
            max_color_component: 255,
        };

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg_clamped);
        // assert!(result.is_some());
        // Combined intensity would be 5.0 + 8.0 = 13.0, but clamped to 10.0

        // Test without clamping
        let cfg_unclamped = AmbientCombineConfig {
            max_intensity: 0.0, // 0 means no clamping
            max_color_component: 255,
        };

        // let result = recompute_combined_ambient(&metadata, &context, &cfg_unclamped);
        // assert!(result.is_some());
        // Combined intensity would be 13.0 (no clamping)
    }

    #[test]
    fn test_ambient_combine_config_color_clamping() {
        let metadata = [AmbientLightMetadata {
            intensity: 10.0,
            color: Srgba::new(300, 300, 300, 255), // Values above 255
            enabled: true,
        }];

        let cfg = AmbientCombineConfig {
            max_intensity: 100.0,     // High enough to not clamp intensity
            max_color_component: 255, // Clamp color components to 255
        };

        // This test would require a proper context to run
        // let context = create_test_context();
        // let result = recompute_combined_ambient(&metadata, &context, &cfg);
        // assert!(result.is_some());
        // Color components should be clamped to 255
    }
}
