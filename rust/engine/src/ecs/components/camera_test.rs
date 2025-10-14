#[cfg(test)]
mod tests {
    use super::super::camera::*;

    #[test]
    fn test_camera_component_defaults() {
        let camera = CameraComponent::default();

        assert_eq!(camera.fov, 60.0);
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 100.0);
        assert_eq!(camera.isMain, false);
        assert_eq!(camera.projectionType, "perspective");
        assert_eq!(camera.orthographicSize, 10.0);
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
        assert_eq!(camera.isMain, true);
        assert_eq!(camera.projectionType, "perspective");
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
        assert_eq!(camera.isMain, true);
    }

    #[test]
    fn test_orthographic_camera() {
        let json = r#"{
            "projectionType": "orthographic",
            "orthographicSize": 20.0,
            "isMain": true
        }"#;

        let camera: CameraComponent = serde_json::from_str(json).unwrap();

        assert_eq!(camera.projectionType, "orthographic");
        assert_eq!(camera.orthographicSize, 20.0);
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

        assert!(camera.backgroundColor.is_some());
        let bg = camera.backgroundColor.unwrap();
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

        assert!(camera.backgroundColor.is_none());
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

        assert!(camera.clearFlags.is_some());
        assert_eq!(camera.clearFlags.unwrap(), "solidColor");
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

        assert!(camera.skyboxTexture.is_some());
        assert_eq!(camera.skyboxTexture.unwrap(), "/textures/skybox_space.hdr");
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
        assert_eq!(camera.isMain, true);
        assert_eq!(camera.projectionType, "perspective");
        assert_eq!(camera.orthographicSize, 10.0);
        assert_eq!(camera.clearFlags, Some("skybox".to_string()));
        assert_eq!(camera.skyboxTexture, Some("/textures/sunset.hdr".to_string()));

        let bg = camera.backgroundColor.unwrap();
        assert!((bg.r - 0.1).abs() < 0.001);
        assert!((bg.g - 0.2).abs() < 0.001);
        assert!((bg.b - 0.3).abs() < 0.001);
        assert!((bg.a - 1.0).abs() < 0.001);
    }
}
