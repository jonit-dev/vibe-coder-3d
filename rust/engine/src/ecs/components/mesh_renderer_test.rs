#[cfg(test)]
mod tests {
    use super::super::mesh_renderer::MeshRenderer;

    #[test]
    fn test_default_mesh_renderer() {
        let renderer = MeshRenderer::default();

        assert_eq!(renderer.meshId, None);
        assert_eq!(renderer.materialId, None);
        assert_eq!(renderer.modelPath, None);
        assert!(renderer.enabled);
    }

    #[test]
    fn test_enabled_default() {
        // Test that enabled defaults to true when not specified
        let json = r#"{}"#;
        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert!(renderer.enabled);
    }

    #[test]
    fn test_deserialization_full() {
        let json = r#"{
            "meshId": "cube",
            "materialId": "metal",
            "modelPath": "/models/test.glb",
            "enabled": true
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, Some("cube".to_string()));
        assert_eq!(renderer.materialId, Some("metal".to_string()));
        assert_eq!(renderer.modelPath, Some("/models/test.glb".to_string()));
        assert!(renderer.enabled);
    }

    #[test]
    fn test_deserialization_partial() {
        let json = r#"{
            "meshId": "sphere"
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, Some("sphere".to_string()));
        assert_eq!(renderer.materialId, None);
        assert_eq!(renderer.modelPath, None);
        assert!(renderer.enabled); // Should default to true
    }

    #[test]
    fn test_deserialization_disabled() {
        let json = r#"{
            "meshId": "plane",
            "enabled": false
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, Some("plane".to_string()));
        assert!(!renderer.enabled);
    }

    #[test]
    fn test_clone() {
        let renderer = MeshRenderer {
            meshId: Some("cube".to_string()),
            materialId: Some("wood".to_string()),
            modelPath: Some("/path/to/model.glb".to_string()),
            enabled: true,
            castShadows: true,
            receiveShadows: true,
        };

        let cloned = renderer.clone();

        assert_eq!(cloned.meshId, renderer.meshId);
        assert_eq!(cloned.materialId, renderer.materialId);
        assert_eq!(cloned.modelPath, renderer.modelPath);
        assert_eq!(cloned.enabled, renderer.enabled);
    }

    #[test]
    fn test_all_fields_none() {
        let json = r#"{
            "meshId": null,
            "materialId": null,
            "modelPath": null
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, None);
        assert_eq!(renderer.materialId, None);
        assert_eq!(renderer.modelPath, None);
        assert!(renderer.enabled);
    }

    #[test]
    fn test_shadow_properties_default() {
        // Test that shadow properties default to true
        let json = r#"{
            "meshId": "cube"
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert!(renderer.castShadows);
        assert!(renderer.receiveShadows);
    }

    #[test]
    fn test_shadow_properties_explicit() {
        // Test explicit shadow property values from TypeScript
        let json = r#"{
            "meshId": "cube",
            "materialId": "mat1",
            "castShadows": false,
            "receiveShadows": true
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, Some("cube".to_string()));
        assert_eq!(renderer.materialId, Some("mat1".to_string()));
        assert!(!renderer.castShadows);
        assert!(renderer.receiveShadows);
    }

    #[test]
    fn test_full_serialization_from_typescript() {
        // Test a complete MeshRenderer as exported from TypeScript editor
        let json = r#"{
            "meshId": "sphere",
            "materialId": "pbr-material",
            "modelPath": "/models/sphere.glb",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": false
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.meshId, Some("sphere".to_string()));
        assert_eq!(renderer.materialId, Some("pbr-material".to_string()));
        assert_eq!(renderer.modelPath, Some("/models/sphere.glb".to_string()));
        assert!(renderer.enabled);
        assert!(renderer.castShadows);
        assert!(!renderer.receiveShadows);
    }
}
