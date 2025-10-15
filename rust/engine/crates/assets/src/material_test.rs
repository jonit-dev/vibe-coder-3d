#[cfg(test)]
mod tests {
    use super::super::material::*;
    use glam::Vec3;

    // ===== Material Struct Tests =====

    #[test]
    fn test_material_defaults() {
        let json = r##"{"id": "test"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.id, "test");
        assert_eq!(material.color, "#cccccc");
        assert_eq!(material.roughness, 0.7);
        assert_eq!(material.metalness, 0.0);
        assert_eq!(material.shader, "standard");
        assert_eq!(material.materialType, "solid");
        assert_eq!(material.emissiveIntensity, 0.0);
        assert_eq!(material.normalScale, 1.0);
        assert_eq!(material.occlusionStrength, 1.0);
        assert_eq!(material.textureOffsetX, 0.0);
        assert_eq!(material.textureOffsetY, 0.0);
        assert_eq!(material.textureRepeatX, 1.0);
        assert_eq!(material.textureRepeatY, 1.0);
        assert_eq!(material.transparent, false);
        assert_eq!(material.alphaMode, "opaque");
        assert_eq!(material.alphaCutoff, 0.5);
    }

    #[test]
    fn test_material_full_deserialization() {
        let json = r##"{
            "id": "test-mat",
            "name": "Test Material",
            "color": "#ff0000",
            "roughness": 0.3,
            "emissive": "#00ff00",
            "shader": "pbr",
            "materialType": "metallic",
            "metalness": 0.8,
            "emissiveIntensity": 2.0,
            "albedoTexture": "albedo.png",
            "normalTexture": "normal.png",
            "metallicTexture": "metallic.png",
            "roughnessTexture": "roughness.png",
            "emissiveTexture": "emissive.png",
            "occlusionTexture": "occlusion.png",
            "normalScale": 1.5,
            "occlusionStrength": 0.8,
            "textureOffsetX": 0.5,
            "textureOffsetY": 0.25,
            "textureRepeatX": 2.0,
            "textureRepeatY": 3.0,
            "transparent": true,
            "alphaMode": "blend",
            "alphaCutoff": 0.3
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.id, "test-mat");
        assert_eq!(material.name, Some("Test Material".to_string()));
        assert_eq!(material.color, "#ff0000");
        assert_eq!(material.roughness, 0.3);
        assert_eq!(material.emissive, Some("#00ff00".to_string()));
        assert_eq!(material.shader, "pbr");
        assert_eq!(material.materialType, "metallic");
        assert_eq!(material.metalness, 0.8);
        assert_eq!(material.emissiveIntensity, 2.0);
        assert_eq!(material.albedoTexture, Some("albedo.png".to_string()));
        assert_eq!(material.normalTexture, Some("normal.png".to_string()));
        assert_eq!(material.metallicTexture, Some("metallic.png".to_string()));
        assert_eq!(material.roughnessTexture, Some("roughness.png".to_string()));
        assert_eq!(material.emissiveTexture, Some("emissive.png".to_string()));
        assert_eq!(material.occlusionTexture, Some("occlusion.png".to_string()));
        assert_eq!(material.normalScale, 1.5);
        assert_eq!(material.occlusionStrength, 0.8);
        assert_eq!(material.textureOffsetX, 0.5);
        assert_eq!(material.textureOffsetY, 0.25);
        assert_eq!(material.textureRepeatX, 2.0);
        assert_eq!(material.textureRepeatY, 3.0);
        assert_eq!(material.transparent, true);
        assert_eq!(material.alphaMode, "blend");
        assert_eq!(material.alphaCutoff, 0.3);
    }

    // ===== Color Parsing Tests =====

    #[test]
    fn test_color_rgb_red() {
        let material = Material {
            id: "test".to_string(),
            name: None,
            color: "#ff0000".to_string(),
            roughness: 0.7,
            emissive: None,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.0,
            emissiveIntensity: 0.0,
            albedoTexture: None,
            normalTexture: None,
            metallicTexture: None,
            roughnessTexture: None,
            emissiveTexture: None,
            occlusionTexture: None,
            normalScale: 1.0,
            occlusionStrength: 1.0,
            textureOffsetX: 0.0,
            textureOffsetY: 0.0,
            textureRepeatX: 1.0,
            textureRepeatY: 1.0,
            transparent: false,
            alphaMode: "opaque".to_string(),
            alphaCutoff: 0.5,
        };

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(1.0, 0.0, 0.0));
    }

    #[test]
    fn test_color_rgb_green() {
        let json = r##"{"id": "test", "color": "#00ff00"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.0, 1.0, 0.0));
    }

    #[test]
    fn test_color_rgb_blue() {
        let json = r##"{"id": "test", "color": "#0000ff"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.0, 0.0, 1.0));
    }

    #[test]
    fn test_color_rgb_gray() {
        let json = r##"{"id": "test", "color": "#808080"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        // 0x80 = 128 / 255 ≈ 0.502
        assert!((rgb.x - 0.502).abs() < 0.01);
        assert!((rgb.y - 0.502).abs() < 0.01);
        assert!((rgb.z - 0.502).abs() < 0.01);
    }

    #[test]
    fn test_color_rgb_white() {
        let json = r##"{"id": "test", "color": "#ffffff"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(1.0, 1.0, 1.0));
    }

    #[test]
    fn test_color_rgb_black() {
        let json = r##"{"id": "test", "color": "#000000"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        assert_eq!(rgb, Vec3::new(0.0, 0.0, 0.0));
    }

    #[test]
    fn test_color_rgb_invalid_fallback() {
        let json = r##"{"id": "test", "color": "invalid"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        // Should fallback to default gray (0.8, 0.8, 0.8)
        assert_eq!(rgb, Vec3::new(0.8, 0.8, 0.8));
    }

    #[test]
    fn test_color_rgb_short_hex_fallback() {
        let json = r##"{"id": "test", "color": "#fff"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let rgb = material.color_rgb();
        // Should fallback to default gray
        assert_eq!(rgb, Vec3::new(0.8, 0.8, 0.8));
    }

    // ===== Emissive Color Tests =====

    #[test]
    fn test_emissive_rgb_with_color() {
        let json = r##"{"id": "test", "emissive": "#ff0000"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let emissive = material.emissive_rgb();
        assert_eq!(emissive, Vec3::new(1.0, 0.0, 0.0));
    }

    #[test]
    fn test_emissive_rgb_none() {
        let json = r##"{"id": "test"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let emissive = material.emissive_rgb();
        assert_eq!(emissive, Vec3::ZERO);
    }

    #[test]
    fn test_emissive_rgb_invalid_fallback() {
        let json = r##"{"id": "test", "emissive": "invalid"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let emissive = material.emissive_rgb();
        // Should fallback to zero
        assert_eq!(emissive, Vec3::ZERO);
    }

    // ===== MaterialCache Tests =====

    #[test]
    fn test_material_cache_new() {
        let cache = MaterialCache::new();

        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
        assert_eq!(cache.default().id, "default");
    }

    #[test]
    fn test_material_cache_default_trait() {
        let cache: MaterialCache = Default::default();

        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
        assert_eq!(cache.default().id, "default");
    }

    #[test]
    fn test_material_cache_default_material_values() {
        let cache = MaterialCache::new();
        let default_mat = cache.default();

        assert_eq!(default_mat.id, "default");
        assert_eq!(default_mat.name, Some("Default Material".to_string()));
        assert_eq!(default_mat.color, "#cccccc");
        assert_eq!(default_mat.roughness, 0.7);
        assert_eq!(default_mat.metalness, 0.0);
        assert_eq!(default_mat.emissiveIntensity, 0.0);
        assert_eq!(default_mat.shader, "standard");
        assert_eq!(default_mat.materialType, "solid");
        assert_eq!(default_mat.transparent, false);
        assert_eq!(default_mat.alphaMode, "opaque");
        assert_eq!(default_mat.alphaCutoff, 0.5);
    }

    #[test]
    fn test_material_cache_load_from_scene() {
        let json = serde_json::json!([
            {
                "id": "mat1",
                "name": "Red Material",
                "color": "#ff0000",
                "metalness": 0.5,
                "roughness": 0.3
            },
            {
                "id": "mat2",
                "name": "Blue Material",
                "color": "#0000ff",
                "metalness": 0.8,
                "roughness": 0.2,
                "emissive": "#ffffff",
                "emissiveIntensity": 1.5
            }
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        assert_eq!(cache.len(), 2);
        assert!(!cache.is_empty());

        let mat1 = cache.get("mat1");
        assert_eq!(mat1.id, "mat1");
        assert_eq!(mat1.name, Some("Red Material".to_string()));
        assert_eq!(mat1.color, "#ff0000");
        assert_eq!(mat1.metalness, 0.5);
        assert_eq!(mat1.roughness, 0.3);

        let mat2 = cache.get("mat2");
        assert_eq!(mat2.id, "mat2");
        assert_eq!(mat2.name, Some("Blue Material".to_string()));
        assert_eq!(mat2.color, "#0000ff");
        assert_eq!(mat2.metalness, 0.8);
        assert_eq!(mat2.roughness, 0.2);
        assert_eq!(mat2.emissive, Some("#ffffff".to_string()));
        assert_eq!(mat2.emissiveIntensity, 1.5);
    }

    #[test]
    fn test_material_cache_load_from_scene_with_textures() {
        let json = serde_json::json!([
            {
                "id": "textured",
                "albedoTexture": "textures/albedo.png",
                "normalTexture": "textures/normal.png",
                "metallicTexture": "textures/metallic.png",
                "roughnessTexture": "textures/roughness.png"
            }
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        assert_eq!(cache.len(), 1);

        let mat = cache.get("textured");
        assert_eq!(mat.id, "textured");
        assert_eq!(mat.albedoTexture, Some("textures/albedo.png".to_string()));
        assert_eq!(mat.normalTexture, Some("textures/normal.png".to_string()));
        assert_eq!(
            mat.metallicTexture,
            Some("textures/metallic.png".to_string())
        );
        assert_eq!(
            mat.roughnessTexture,
            Some("textures/roughness.png".to_string())
        );
    }

    #[test]
    fn test_material_cache_load_from_scene_none() {
        let mut cache = MaterialCache::new();
        cache.load_from_scene(None);

        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
    }

    #[test]
    fn test_material_cache_load_from_scene_invalid_json() {
        let json = serde_json::json!({
            "not": "an array"
        });

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        // Should not load anything on invalid format
        assert_eq!(cache.len(), 0);
    }

    #[test]
    fn test_material_cache_get_existing() {
        let json = serde_json::json!([
            {"id": "mat1", "color": "#ff0000"}
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        let mat = cache.get("mat1");
        assert_eq!(mat.id, "mat1");
        assert_eq!(mat.color, "#ff0000");
    }

    #[test]
    fn test_material_cache_get_missing_returns_default() {
        let cache = MaterialCache::new();
        let mat = cache.get("nonexistent");

        assert_eq!(mat.id, "default");
        assert_eq!(mat.color, "#cccccc");
    }

    #[test]
    fn test_material_cache_contains() {
        let json = serde_json::json!([
            {"id": "mat1"}
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        assert!(cache.contains("mat1"));
        assert!(!cache.contains("mat2"));
        assert!(!cache.contains("default")); // default is not in the cache map
    }

    #[test]
    fn test_material_cache_insert_new() {
        let mut cache = MaterialCache::new();

        let material = Material {
            id: "custom".to_string(),
            name: Some("Custom Material".to_string()),
            color: "#ff00ff".to_string(),
            roughness: 0.5,
            emissive: None,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.3,
            emissiveIntensity: 0.0,
            albedoTexture: None,
            normalTexture: None,
            metallicTexture: None,
            roughnessTexture: None,
            emissiveTexture: None,
            occlusionTexture: None,
            normalScale: 1.0,
            occlusionStrength: 1.0,
            textureOffsetX: 0.0,
            textureOffsetY: 0.0,
            textureRepeatX: 1.0,
            textureRepeatY: 1.0,
            transparent: false,
            alphaMode: "opaque".to_string(),
            alphaCutoff: 0.5,
        };

        cache.insert(material);

        assert_eq!(cache.len(), 1);
        assert!(cache.contains("custom"));

        let retrieved = cache.get("custom");
        assert_eq!(retrieved.id, "custom");
        assert_eq!(retrieved.color, "#ff00ff");
        assert_eq!(retrieved.metalness, 0.3);
    }

    #[test]
    fn test_material_cache_insert_override() {
        let json = serde_json::json!([
            {"id": "mat1", "color": "#ff0000", "metalness": 0.5}
        ]);

        let mut cache = MaterialCache::new();
        cache.load_from_scene(Some(&json));

        // Verify original
        let original = cache.get("mat1");
        assert_eq!(original.color, "#ff0000");
        assert_eq!(original.metalness, 0.5);

        // Insert override
        let override_mat = Material {
            id: "mat1".to_string(),
            name: Some("Override Material".to_string()),
            color: "#00ff00".to_string(),
            roughness: 0.9,
            emissive: None,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.8,
            emissiveIntensity: 0.0,
            albedoTexture: None,
            normalTexture: None,
            metallicTexture: None,
            roughnessTexture: None,
            emissiveTexture: None,
            occlusionTexture: None,
            normalScale: 1.0,
            occlusionStrength: 1.0,
            textureOffsetX: 0.0,
            textureOffsetY: 0.0,
            textureRepeatX: 1.0,
            textureRepeatY: 1.0,
            transparent: false,
            alphaMode: "opaque".to_string(),
            alphaCutoff: 0.5,
        };

        cache.insert(override_mat);

        // Should still have only 1 material (replaced, not added)
        assert_eq!(cache.len(), 1);

        // Verify override
        let overridden = cache.get("mat1");
        assert_eq!(overridden.color, "#00ff00");
        assert_eq!(overridden.metalness, 0.8);
        assert_eq!(overridden.roughness, 0.9);
    }

    // ===== Texture Transform Tests =====

    #[test]
    fn test_texture_transform_defaults() {
        let json = r##"{"id": "test"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.textureOffsetX, 0.0);
        assert_eq!(material.textureOffsetY, 0.0);
        assert_eq!(material.textureRepeatX, 1.0);
        assert_eq!(material.textureRepeatY, 1.0);
        assert_eq!(material.normalScale, 1.0);
        assert_eq!(material.occlusionStrength, 1.0);
    }

    #[test]
    fn test_texture_transform_custom_values() {
        let json = r##"{
            "id": "test",
            "textureOffsetX": 0.5,
            "textureOffsetY": 0.25,
            "textureRepeatX": 2.0,
            "textureRepeatY": 3.0,
            "normalScale": 1.5,
            "occlusionStrength": 0.7
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.textureOffsetX, 0.5);
        assert_eq!(material.textureOffsetY, 0.25);
        assert_eq!(material.textureRepeatX, 2.0);
        assert_eq!(material.textureRepeatY, 3.0);
        assert_eq!(material.normalScale, 1.5);
        assert_eq!(material.occlusionStrength, 0.7);
    }

    // ===== Alpha/Transparency Tests =====

    #[test]
    fn test_alpha_defaults() {
        let json = r##"{"id": "test"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.transparent, false);
        assert_eq!(material.alphaMode, "opaque");
        assert_eq!(material.alphaCutoff, 0.5);
    }

    #[test]
    fn test_alpha_transparent() {
        let json = r##"{
            "id": "test",
            "transparent": true,
            "alphaMode": "blend"
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.transparent, true);
        assert_eq!(material.alphaMode, "blend");
    }

    #[test]
    fn test_alpha_mask() {
        let json = r##"{
            "id": "test",
            "alphaMode": "mask",
            "alphaCutoff": 0.3
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.alphaMode, "mask");
        assert_eq!(material.alphaCutoff, 0.3);
    }

    // ===== Edge Cases =====

    #[test]
    fn test_material_clone() {
        let json = r##"{"id": "test", "color": "#ff0000"}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        let cloned = material.clone();

        assert_eq!(cloned.id, material.id);
        assert_eq!(cloned.color, material.color);
    }

    #[test]
    fn test_material_cache_multiple_loads() {
        let json1 = serde_json::json!([
            {"id": "mat1", "color": "#ff0000"}
        ]);

        let json2 = serde_json::json!([
            {"id": "mat2", "color": "#00ff00"}
        ]);

        let mut cache = MaterialCache::new();

        cache.load_from_scene(Some(&json1));
        assert_eq!(cache.len(), 1);

        // Second load should add to the cache (materials accumulate)
        cache.load_from_scene(Some(&json2));
        assert_eq!(cache.len(), 2);
        assert!(cache.contains("mat1"));
        assert!(cache.contains("mat2"));
    }

    #[test]
    fn test_material_empty_name() {
        let json = r##"{"id": "test", "name": ""}"##;
        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.name, Some("".to_string()));
    }

    #[test]
    fn test_material_zero_values() {
        let json = r##"{
            "id": "test",
            "roughness": 0.0,
            "metalness": 0.0,
            "emissiveIntensity": 0.0,
            "normalScale": 0.0,
            "occlusionStrength": 0.0,
            "alphaCutoff": 0.0
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.roughness, 0.0);
        assert_eq!(material.metalness, 0.0);
        assert_eq!(material.emissiveIntensity, 0.0);
        assert_eq!(material.normalScale, 0.0);
        assert_eq!(material.occlusionStrength, 0.0);
        assert_eq!(material.alphaCutoff, 0.0);
    }

    #[test]
    fn test_material_max_values() {
        let json = r##"{
            "id": "test",
            "roughness": 1.0,
            "metalness": 1.0,
            "emissiveIntensity": 100.0,
            "normalScale": 10.0,
            "occlusionStrength": 1.0,
            "alphaCutoff": 1.0
        }"##;

        let material: Material = serde_json::from_str(json).unwrap();

        assert_eq!(material.roughness, 1.0);
        assert_eq!(material.metalness, 1.0);
        assert_eq!(material.emissiveIntensity, 100.0);
        assert_eq!(material.normalScale, 10.0);
        assert_eq!(material.occlusionStrength, 1.0);
        assert_eq!(material.alphaCutoff, 1.0);
    }
}
