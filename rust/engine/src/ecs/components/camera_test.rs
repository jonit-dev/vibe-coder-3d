#[cfg(test)]
mod tests {
    use super::super::camera::*;

    #[test]
    fn test_camera_component_defaults() {
        let camera = CameraComponent::default();

        assert_eq!(camera.fov, 60.0);
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 100.0);
        assert_eq!(camera.is_main, false);
        assert_eq!(camera.projection_type, "perspective");
        assert_eq!(camera.orthographic_size, 10.0);
    }

    #[test]
    fn test_camera_component_deserialization() {
        let json = r#"{
            "fov": 90.0,
            "near": 0.5,
            "far": 200.0,
            "isMain": true,
            "projectionType": "perspective"
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert_eq!(camera.fov, 90.0);
        assert_eq!(camera.near, 0.5);
        assert_eq!(camera.far, 200.0);
        assert_eq!(camera.is_main, true);
        assert_eq!(camera.projection_type, "perspective");
    }

    #[test]
    fn test_camera_component_deserialization_with_defaults() {
        let json = r#"{
            "isMain": true
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert_eq!(camera.fov, 60.0);
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 100.0);
        assert_eq!(camera.is_main, true);
    }

    #[test]
    fn test_orthographic_camera() {
        let json = r#"{
            "projectionType": "orthographic",
            "orthographicSize": 20.0,
            "isMain": true
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert_eq!(camera.projection_type, "orthographic");
        assert_eq!(camera.orthographic_size, 20.0);
    }

    #[test]
    fn test_camera_background_color() {
        // Test that backgroundColor is properly parsed from TypeScript
        let json = r#"{
            "fov": 60.0,
            "near": 0.1,
            "far": 100.0,
            "isMain": true,
            "backgroundColor": {
                "r": 0.2,
                "g": 0.4,
                "b": 0.6,
                "a": 1.0
            }
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert!(camera.background_color.is_some());
        let bg = camera.background_color.unwrap();
        assert!((bg.r - 0.2).abs() < 0.001);
        assert!((bg.g - 0.4).abs() < 0.001);
        assert!((bg.b - 0.6).abs() < 0.001);
        assert!((bg.a - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_camera_background_color_default() {
        // Test that backgroundColor defaults to None when not specified
        let json = r#"{
            "fov": 60.0,
            "isMain": true
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert!(camera.background_color.is_none());
    }

    #[test]
    fn test_camera_clear_flags() {
        // Test that clearFlags is properly parsed
        let json = r#"{
            "fov": 60.0,
            "isMain": true,
            "clearFlags": "solidColor"
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert!(camera.clear_flags.is_some());
        assert_eq!(camera.clear_flags.unwrap(), "solidColor");
    }

    #[test]
    fn test_camera_skybox_texture() {
        // Test that skyboxTexture is properly parsed
        let json = r#"{
            "fov": 60.0,
            "isMain": true,
            "skyboxTexture": "/textures/skybox_space.hdr"
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert!(camera.skybox_texture.is_some());
        assert_eq!(camera.skybox_texture.unwrap(), "/textures/skybox_space.hdr");
    }

    #[test]
    fn test_camera_full_typescript_export() {
        // Test a complete Camera export from TypeScript with all currently supported fields
        let json = r#"{
            "fov": 75.0,
            "near": 0.1,
            "far": 1000.0,
            "isMain": true,
            "projectionType": "perspective",
            "orthographicSize": 10.0,
            "clearFlags": "skybox",
            "skyboxTexture": "/textures/sunset.hdr",
            "backgroundColor": {
                "r": 0.1,
                "g": 0.2,
                "b": 0.3,
                "a": 1.0
            }
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert_eq!(camera.fov, 75.0);
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 1000.0);
        assert_eq!(camera.is_main, true);
        assert_eq!(camera.projection_type, "perspective");
        assert_eq!(camera.orthographic_size, 10.0);
        assert_eq!(camera.clear_flags, Some("skybox".to_string()));
        assert_eq!(
            camera.skybox_texture,
            Some("/textures/sunset.hdr".to_string())
        );

        let bg = camera.background_color.unwrap();
        assert!((bg.r - 0.1).abs() < 0.001);
        assert!((bg.g - 0.2).abs() < 0.001);
        assert!((bg.b - 0.3).abs() < 0.001);
        assert!((bg.a - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_camera_all_new_fields_deserialization() {
        // Test all new fields added in Phase 1
        let json = r#"{
            "fov": 75.0,
            "near": 0.5,
            "far": 1500.0,
            "isMain": true,
            "projectionType": "perspective",
            "orthographicSize": 10.0,
            "depth": 5,
            "clearFlags": "skybox",
            "backgroundColor": {
                "r": 0.1,
                "g": 0.2,
                "b": 0.3,
                "a": 1.0
            },
            "skyboxTexture": "/assets/skybox.hdr",
            "controlMode": "locked",
            "enableSmoothing": true,
            "followTarget": 42,
            "followOffset": [0.0, 5.0, -10.0],
            "smoothingSpeed": 3.0,
            "rotationSmoothing": 2.5,
            "viewportRect": {
                "x": 0.0,
                "y": 0.0,
                "width": 0.5,
                "height": 1.0
            },
            "hdr": true,
            "toneMapping": "aces",
            "toneMappingExposure": 1.5,
            "enablePostProcessing": true,
            "postProcessingPreset": "cinematic",
            "skyboxScale": [1.0, 1.0, 1.0],
            "skyboxRotation": [0.0, 45.0, 0.0],
            "skyboxRepeat": [1.0, 1.0],
            "skyboxOffset": [0.0, 0.0],
            "skyboxIntensity": 1.2,
            "skyboxBlur": 0.5
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        // Verify basic fields
        assert_eq!(camera.fov, 75.0);
        assert_eq!(camera.near, 0.5);
        assert_eq!(camera.far, 1500.0);
        assert_eq!(camera.is_main, true);
        assert_eq!(camera.projection_type, "perspective");
        assert_eq!(camera.orthographic_size, 10.0);

        // Verify new fields
        assert_eq!(camera.depth, 5);
        assert_eq!(camera.clear_flags, Some("skybox".to_string()));
        assert_eq!(
            camera.skybox_texture,
            Some("/assets/skybox.hdr".to_string())
        );

        // Verify follow/control fields
        assert_eq!(camera.control_mode, Some("locked".to_string()));
        assert_eq!(camera.enable_smoothing, true);
        assert_eq!(camera.follow_target, Some(42));
        assert_eq!(camera.follow_offset, Some([0.0, 5.0, -10.0]));
        assert_eq!(camera.smoothing_speed, 3.0);
        assert_eq!(camera.rotation_smoothing, 2.5);

        // Verify viewport
        let viewport = camera.viewport_rect.unwrap();
        assert_eq!(viewport.x, 0.0);
        assert_eq!(viewport.y, 0.0);
        assert_eq!(viewport.width, 0.5);
        assert_eq!(viewport.height, 1.0);

        // Verify HDR/tone mapping
        assert_eq!(camera.hdr, true);
        assert_eq!(camera.tone_mapping, Some("aces".to_string()));
        assert_eq!(camera.tone_mapping_exposure, 1.5);

        // Verify post-processing
        assert_eq!(camera.enable_post_processing, true);
        assert_eq!(camera.post_processing_preset, Some("cinematic".to_string()));

        // Verify skybox transforms
        assert_eq!(camera.skybox_scale, Some([1.0, 1.0, 1.0]));
        assert_eq!(camera.skybox_rotation, Some([0.0, 45.0, 0.0]));
        assert_eq!(camera.skybox_repeat, Some([1.0, 1.0]));
        assert_eq!(camera.skybox_offset, Some([0.0, 0.0]));
        assert_eq!(camera.skybox_intensity, 1.2);
        assert_eq!(camera.skybox_blur, 0.5);
    }

    #[test]
    fn test_camera_new_fields_with_defaults() {
        // Test that new fields default correctly when not specified
        let json = r#"{
            "fov": 60.0,
            "isMain": true
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        // All new fields should have sensible defaults
        assert_eq!(camera.depth, 0);
        assert_eq!(camera.clear_flags, None);
        assert_eq!(camera.skybox_texture, None);
        assert_eq!(camera.control_mode, None);
        assert_eq!(camera.enable_smoothing, false);
        assert_eq!(camera.follow_target, None);
        assert_eq!(camera.follow_offset, None);
        assert_eq!(camera.smoothing_speed, 5.0); // default
        assert_eq!(camera.rotation_smoothing, 5.0); // default
        assert_eq!(camera.viewport_rect, None);
        assert_eq!(camera.hdr, false);
        assert_eq!(camera.tone_mapping, None);
        assert_eq!(camera.tone_mapping_exposure, 1.0); // default
        assert_eq!(camera.enable_post_processing, false);
        assert_eq!(camera.post_processing_preset, None);
        assert_eq!(camera.skybox_scale, None);
        assert_eq!(camera.skybox_rotation, None);
        assert_eq!(camera.skybox_repeat, None);
        assert_eq!(camera.skybox_offset, None);
        assert_eq!(camera.skybox_intensity, 1.0); // default
        assert_eq!(camera.skybox_blur, 0.0);
    }
}
