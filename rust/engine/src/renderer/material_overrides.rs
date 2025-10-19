/// Material override utilities
///
/// Handles merging inline material overrides with base materials

use vibe_assets::Material;
use vibe_ecs_bridge::decoders::MeshRendererMaterialOverride;

/// Apply material overrides from MeshRenderer.material to a base material
/// Returns a new Material with overrides applied
pub fn apply_material_overrides(
    base_material: &Material,
    overrides: &MeshRendererMaterialOverride,
) -> Material {
    let mut material = base_material.clone();

    // Apply shader override
    if let Some(ref shader) = overrides.shader {
        material.shader = shader.clone();
    }

    // Apply material type override
    if let Some(ref material_type) = overrides.material_type {
        material.materialType = material_type.clone();
    }

    // Apply color override
    if let Some(ref color) = overrides.color {
        material.color = color.clone();
    }

    // Apply PBR property overrides
    if let Some(metalness) = overrides.metalness {
        material.metalness = metalness;
    }

    if let Some(roughness) = overrides.roughness {
        material.roughness = roughness;
    }

    // Apply emissive overrides
    if let Some(ref emissive) = overrides.emissive {
        material.emissive = Some(emissive.clone());
    }

    if let Some(intensity) = overrides.emissive_intensity {
        material.emissiveIntensity = intensity;
    }

    // Apply texture overrides
    if let Some(ref albedo) = overrides.albedo_texture {
        material.albedoTexture = Some(albedo.clone());
    }

    if let Some(ref normal) = overrides.normal_texture {
        material.normalTexture = Some(normal.clone());
    }

    if let Some(normal_scale) = overrides.normal_scale {
        material.normalScale = normal_scale;
    }

    if let Some(ref metallic) = overrides.metallic_texture {
        material.metallicTexture = Some(metallic.clone());
    }

    if let Some(ref roughness) = overrides.roughness_texture {
        material.roughnessTexture = Some(roughness.clone());
    }

    if let Some(ref emissive) = overrides.emissive_texture {
        material.emissiveTexture = Some(emissive.clone());
    }

    if let Some(ref occlusion) = overrides.occlusion_texture {
        material.occlusionTexture = Some(occlusion.clone());
    }

    if let Some(strength) = overrides.occlusion_strength {
        material.occlusionStrength = strength;
    }

    // Apply texture transform overrides
    if let Some(offset_x) = overrides.texture_offset_x {
        material.textureOffsetX = offset_x;
    }

    if let Some(offset_y) = overrides.texture_offset_y {
        material.textureOffsetY = offset_y;
    }

    if let Some(repeat_x) = overrides.texture_repeat_x {
        material.textureRepeatX = repeat_x;
    }

    if let Some(repeat_y) = overrides.texture_repeat_y {
        material.textureRepeatY = repeat_y;
    }

    // Apply transparency overrides
    if let Some(transparent) = overrides.transparent {
        material.transparent = transparent;
    }

    if let Some(ref alpha_mode) = overrides.alpha_mode {
        material.alphaMode = alpha_mode.clone();
    }

    if let Some(alpha_cutoff) = overrides.alpha_cutoff {
        material.alphaCutoff = alpha_cutoff;
    }

    material
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_default_material() -> Material {
        Material {
            id: "base-mat".to_string(),
            name: Some("Base Material".to_string()),
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
        }
    }

    #[test]
    fn test_no_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride::default();

        let result = apply_material_overrides(&base, &overrides);

        // Should be identical to base
        assert_eq!(result.color, base.color);
        assert_eq!(result.metalness, base.metalness);
        assert_eq!(result.roughness, base.roughness);
    }

    #[test]
    fn test_color_override() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            color: Some("#ff0000".to_string()),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(result.color, "#ff0000");
        assert_eq!(result.metalness, base.metalness); // Unchanged
    }

    #[test]
    fn test_pbr_property_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            metalness: Some(1.0),
            roughness: Some(0.2),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(result.metalness, 1.0);
        assert_eq!(result.roughness, 0.2);
        assert_eq!(result.color, base.color); // Unchanged
    }

    #[test]
    fn test_emissive_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            emissive: Some("#00ff00".to_string()),
            emissive_intensity: Some(2.5),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(result.emissive, Some("#00ff00".to_string()));
        assert_eq!(result.emissiveIntensity, 2.5);
    }

    #[test]
    fn test_texture_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            albedo_texture: Some("override_albedo.png".to_string()),
            normal_texture: Some("override_normal.png".to_string()),
            normal_scale: Some(2.0),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(
            result.albedoTexture,
            Some("override_albedo.png".to_string())
        );
        assert_eq!(
            result.normalTexture,
            Some("override_normal.png".to_string())
        );
        assert_eq!(result.normalScale, 2.0);
    }

    #[test]
    fn test_uv_transform_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            texture_offset_x: Some(0.5),
            texture_offset_y: Some(0.25),
            texture_repeat_x: Some(2.0),
            texture_repeat_y: Some(3.0),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(result.textureOffsetX, 0.5);
        assert_eq!(result.textureOffsetY, 0.25);
        assert_eq!(result.textureRepeatX, 2.0);
        assert_eq!(result.textureRepeatY, 3.0);
    }

    #[test]
    fn test_transparency_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            transparent: Some(true),
            alpha_mode: Some("blend".to_string()),
            alpha_cutoff: Some(0.3),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        assert_eq!(result.transparent, true);
        assert_eq!(result.alphaMode, "blend");
        assert_eq!(result.alphaCutoff, 0.3);
    }

    #[test]
    fn test_multiple_overrides() {
        let base = create_default_material();
        let overrides = MeshRendererMaterialOverride {
            color: Some("#ff0000".to_string()),
            metalness: Some(1.0),
            roughness: Some(0.1),
            emissive: Some("#0000ff".to_string()),
            emissive_intensity: Some(3.0),
            albedo_texture: Some("custom.png".to_string()),
            texture_repeat_x: Some(5.0),
            texture_repeat_y: Some(5.0),
            ..Default::default()
        };

        let result = apply_material_overrides(&base, &overrides);

        // All overrides should be applied
        assert_eq!(result.color, "#ff0000");
        assert_eq!(result.metalness, 1.0);
        assert_eq!(result.roughness, 0.1);
        assert_eq!(result.emissive, Some("#0000ff".to_string()));
        assert_eq!(result.emissiveIntensity, 3.0);
        assert_eq!(result.albedoTexture, Some("custom.png".to_string()));
        assert_eq!(result.textureRepeatX, 5.0);
        assert_eq!(result.textureRepeatY, 5.0);

        // Base material fields should remain
        assert_eq!(result.id, base.id);
        assert_eq!(result.shader, base.shader);
    }
}
