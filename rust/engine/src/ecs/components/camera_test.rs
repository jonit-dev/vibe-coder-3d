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
}
