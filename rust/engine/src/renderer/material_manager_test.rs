use super::*;
use vibe_assets::Material;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_color_6_digit() {
        let color = parse_hex_color("#ff0000").unwrap();
        assert_eq!(color, Srgba::new(255, 0, 0, 255));

        let color = parse_hex_color("#00ff00").unwrap();
        assert_eq!(color, Srgba::new(0, 255, 0, 255));

        let color = parse_hex_color("#0000ff").unwrap();
        assert_eq!(color, Srgba::new(0, 0, 255, 255));
    }

    #[test]
    fn test_parse_hex_color_3_digit() {
        let color = parse_hex_color("#f00").unwrap();
        assert_eq!(color, Srgba::new(255, 0, 0, 255));

        let color = parse_hex_color("#0f0").unwrap();
        assert_eq!(color, Srgba::new(0, 255, 0, 255));

        let color = parse_hex_color("#00f").unwrap();
        assert_eq!(color, Srgba::new(0, 0, 255, 255));
    }

    #[test]
    fn test_parse_hex_color_without_hash() {
        let color = parse_hex_color("ff0000").unwrap();
        assert_eq!(color, Srgba::new(255, 0, 0, 255));
    }

    #[test]
    fn test_parse_hex_color_invalid() {
        assert!(parse_hex_color("#ff").is_none());
        assert!(parse_hex_color("#gggggg").is_none());
        assert!(parse_hex_color("invalid").is_none());
    }

    #[test]
    fn test_material_manager_new() {
        let manager = MaterialManager::new();
        assert!(manager.get_material("nonexistent").is_none());
    }

    #[test]
    fn test_material_manager_add_and_get() {
        let mut manager = MaterialManager::new();

        let material = Material {
            id: "test-mat".to_string(),
            name: Some("Test Material".to_string()),
            color: "#ff0000".to_string(),
            metalness: 0.5,
            roughness: 0.3,
            emissive: Some("#00ff00".to_string()),
            emissiveIntensity: 2.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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

        manager.add_material("test-mat".to_string(), material.clone());

        let retrieved = manager.get_material("test-mat").unwrap();
        assert_eq!(retrieved.id, "test-mat");
        assert_eq!(retrieved.color, "#ff0000");
        assert_eq!(retrieved.metalness, 0.5);
        assert_eq!(retrieved.roughness, 0.3);
    }

    #[test]
    fn test_material_manager_clear() {
        let mut manager = MaterialManager::new();

        let material = Material {
            id: "test-mat".to_string(),
            name: Some("Test".to_string()),
            color: "#cccccc".to_string(),
            metalness: 0.0,
            roughness: 0.7,
            emissive: None,
            emissiveIntensity: 0.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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

        manager.add_material("test-mat".to_string(), material);
        assert!(manager.get_material("test-mat").is_some());

        manager.clear();
        assert!(manager.get_material("test-mat").is_none());
    }

    #[test]
    fn test_material_default_values() {
        let material = Material {
            id: "default-test".to_string(),
            name: None,
            color: "#cccccc".to_string(),
            metalness: 0.0,
            roughness: 0.7,
            emissive: None,
            emissiveIntensity: 0.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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

        assert_eq!(material.color, "#cccccc");
        assert_eq!(material.metalness, 0.0);
        assert_eq!(material.roughness, 0.7);
        assert!(material.emissive.is_none());
        assert_eq!(material.emissiveIntensity, 0.0);
    }

    #[test]
    fn test_material_color_rgb_helper() {
        let material = Material {
            id: "color-test".to_string(),
            name: None,
            color: "#ff0000".to_string(),
            metalness: 0.0,
            roughness: 0.7,
            emissive: None,
            emissiveIntensity: 0.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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
        assert_eq!(rgb.x, 1.0);
        assert_eq!(rgb.y, 0.0);
        assert_eq!(rgb.z, 0.0);
    }

    #[test]
    fn test_material_emissive_rgb_helper() {
        let material = Material {
            id: "emissive-test".to_string(),
            name: None,
            color: "#cccccc".to_string(),
            metalness: 0.0,
            roughness: 0.7,
            emissive: Some("#00ff00".to_string()),
            emissiveIntensity: 2.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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

        let emissive_rgb = material.emissive_rgb();
        assert_eq!(emissive_rgb.x, 0.0);
        assert_eq!(emissive_rgb.y, 1.0);
        assert_eq!(emissive_rgb.z, 0.0);
    }

    #[test]
    fn test_material_emissive_rgb_none() {
        let material = Material {
            id: "no-emissive".to_string(),
            name: None,
            color: "#cccccc".to_string(),
            metalness: 0.0,
            roughness: 0.7,
            emissive: None,
            emissiveIntensity: 0.0,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
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

        let emissive_rgb = material.emissive_rgb();
        assert_eq!(emissive_rgb.x, 0.0);
        assert_eq!(emissive_rgb.y, 0.0);
        assert_eq!(emissive_rgb.z, 0.0);
    }
}
