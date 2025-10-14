#[cfg(test)]
mod tests {
    use super::super::material::*;
    use glam::Vec3;

    #[test]
    fn test_parse_hex_color_red() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#ff0000".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(1.0, 0.0, 0.0));
    }

    #[test]
    fn test_parse_hex_color_green() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#00ff00".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.0, 1.0, 0.0));
    }

    #[test]
    fn test_parse_hex_color_blue() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#0000ff".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.0, 0.0, 1.0));
    }

    #[test]
    fn test_parse_hex_color_gray() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#808080".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let rgb = material.color_rgb();
        // 0x80 = 128 / 255 ≈ 0.502
        assert!((rgb.x - 0.502).abs() < 0.01);
        assert!((rgb.y - 0.502).abs() < 0.01);
        assert!((rgb.z - 0.502).abs() < 0.01);
    }

    #[test]
    fn test_parse_invalid_hex_color() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "invalid".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        // Should fallback to default gray
        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.8, 0.8, 0.8));
    }

    #[test]
    fn test_material_cache_default() {
        let cache = MaterialCache::new();
        let default_mat = cache.default();

        assert_eq!(default_mat.id, "default");
        assert_eq!(default_mat.metallic, 0.0);
        assert_eq!(default_mat.roughness, 0.5);
    }

    #[test]
    fn test_material_cache_load_from_json() {
        let json = serde_json::json!([
            {
                "id": "mat1",
                "name": "Red Material",
                "color": "#ff0000",
                "metallic": 0.5,
                "roughness": 0.3
            },
            {
                "id": "mat2",
                "name": "Blue Material",
                "color": "#0000ff",
                "metallic": 0.8,
                "roughness": 0.2
            }
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        assert_eq!(cache.len(), 2);

        let mat1 = cache.get("mat1");
        assert_eq!(mat1.id, "mat1");
        assert_eq!(mat1.color, "#ff0000");
        assert_eq!(mat1.metallic, 0.5);
        assert_eq!(mat1.roughness, 0.3);

        let mat2 = cache.get("mat2");
        assert_eq!(mat2.id, "mat2");
        assert_eq!(mat2.color, "#0000ff");
        assert_eq!(mat2.metallic, 0.8);
        assert_eq!(mat2.roughness, 0.2);
    }

    #[test]
    fn test_material_cache_get_missing_returns_default() {
        let cache = MaterialCache::new();
        let mat = cache.get("nonexistent");

        assert_eq!(mat.id, "default");
    }

    #[test]
    fn test_material_deserialization() {
        let json = r##"{
            "id": "test-mat",
            "name": "Test Material",
            "color": "#ff00ff",
            "metallic": 0.7,
            "roughness": 0.4,
            "opacity": 1.0,
            "shader": "standard"
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.id, "test-mat");
        assert_eq!(material.name, Some("Test Material".to_string()));
        assert_eq!(material.color, "#ff00ff");
        assert_eq!(material.metallic, 0.7);
        assert_eq!(material.roughness, 0.4);
        assert_eq!(material.opacity, 1.0);
        assert_eq!(material.shader, "standard");
    }

    #[test]
    fn test_material_deserialization_with_defaults() {
        let json = r##"{
            "id": "minimal-mat"
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.id, "minimal-mat");
        assert_eq!(material.color, "#cccccc");
        assert_eq!(material.metallic, 0.0);
        assert_eq!(material.roughness, 0.5);
        assert_eq!(material.opacity, 1.0);
        assert_eq!(material.shader, "standard");
    }

    #[test]
    fn test_emissive_color_parsing() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#ffffff".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: Some("#ff0000".to_string()),
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let emissive = material.emissive_rgb();
        assert_eq!(emissive, Vec3::new(1.0, 0.0, 0.0));
    }

    #[test]
    fn test_emissive_none_returns_zero() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#ffffff".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        let emissive = material.emissive_rgb();
        assert_eq!(emissive, Vec3::ZERO);
    }
}
