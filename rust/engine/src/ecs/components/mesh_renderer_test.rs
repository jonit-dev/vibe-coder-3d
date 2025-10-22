#[cfg(test)]
mod tests {
    use super::super::mesh_renderer::MeshRenderer;

    #[test]
    fn test_default_mesh_renderer() {
        let renderer = MeshRenderer::default();

        assert_eq!(renderer.mesh_id, None);
        assert_eq!(renderer.material_id, None);
        assert_eq!(renderer.model_path, None);
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

        assert_eq!(renderer.mesh_id, Some("cube".to_string()));
        assert_eq!(renderer.material_id, Some("metal".to_string()));
        assert_eq!(renderer.model_path, Some("/models/test.glb".to_string()));
        assert!(renderer.enabled);
    }

    #[test]
    fn test_deserialization_partial() {
        let json = r#"{
            "meshId": "sphere"
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.mesh_id, Some("sphere".to_string()));
        assert_eq!(renderer.material_id, None);
        assert_eq!(renderer.model_path, None);
        assert!(renderer.enabled); // Should default to true
    }

    #[test]
    fn test_deserialization_disabled() {
        let json = r#"{
            "meshId": "plane",
            "enabled": false
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.mesh_id, Some("plane".to_string()));
        assert!(!renderer.enabled);
    }

    #[test]
    fn test_clone() {
        let renderer = MeshRenderer {
            mesh_id: Some("cube".to_string()),
            material_id: Some("wood".to_string()),
            model_path: Some("/path/to/model.glb".to_string()),
            enabled: true,
            cast_shadows: true,
            receive_shadows: true,
        };

        let cloned = renderer.clone();

        assert_eq!(cloned.mesh_id, renderer.mesh_id);
        assert_eq!(cloned.material_id, renderer.material_id);
        assert_eq!(cloned.model_path, renderer.model_path);
        assert_eq!(cloned.enabled, renderer.enabled);
    }

    #[test]
    fn test_all_fields_none() {
        let json = r#"{
            "mesh_id": null,
            "material_id": null,
            "model_path": null
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert_eq!(renderer.mesh_id, None);
        assert_eq!(renderer.material_id, None);
        assert_eq!(renderer.model_path, None);
        assert!(renderer.enabled);
    }

    #[test]
    fn test_shadow_properties_default() {
        // Test that shadow properties default to true
        let json = r#"{
            "meshId": "cube"
        }"#;

        let renderer: MeshRenderer = serde_json::from_str(json).unwrap();

        assert!(renderer.cast_shadows);
        assert!(renderer.receive_shadows);
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

        assert_eq!(renderer.mesh_id, Some("cube".to_string()));
        assert_eq!(renderer.material_id, Some("mat1".to_string()));
        assert!(!renderer.cast_shadows);
        assert!(renderer.receive_shadows);
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

        assert_eq!(renderer.mesh_id, Some("sphere".to_string()));
        assert_eq!(renderer.material_id, Some("pbr-material".to_string()));
        assert_eq!(renderer.model_path, Some("/models/sphere.glb".to_string()));
        assert!(renderer.enabled);
        assert!(renderer.cast_shadows);
        assert!(!renderer.receive_shadows);
    }
}
