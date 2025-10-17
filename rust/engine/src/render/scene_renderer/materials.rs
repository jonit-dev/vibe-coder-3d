//! Material uniform building - encapsulates material derivation, overrides, and texture flags.
//!
//! This module handles creating MaterialUniform from cached materials and applying inline overrides.

use super::super::material_uniform::{MaterialUniform, TEXTURE_ALBEDO};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use vibe_assets::{Material, MaterialCache};
use vibe_ecs_bridge::MeshRendererMaterialOverride;
use vibe_scene::EntityId;

/// Builder for material uniforms with override support
pub struct MaterialBuilder;

impl MaterialBuilder {
    /// Create MaterialUniform from a material (pure function)
    pub fn from_material(material: &Material) -> MaterialUniform {
        MaterialUniform::from_material(material)
    }

    /// Apply inline override to create a new material (side effect: modifies cache)
    pub fn apply_inline_override(
        material_cache: &mut MaterialCache,
        base_material_id: Option<&str>,
        override_data: &MeshRendererMaterialOverride,
        entity_id: EntityId,
        variant_index: usize,
    ) -> String {
        let mut material = base_material_id
            .and_then(|id| {
                if material_cache.contains(id) {
                    Some(material_cache.get(id).clone())
                } else {
                    None
                }
            })
            .unwrap_or_else(|| material_cache.default().clone());

        // Apply overrides
        if let Some(shader) = override_data.shader.as_ref() {
            material.shader = shader.clone();
        }
        if let Some(material_type) = override_data.material_type.as_ref() {
            material.materialType = material_type.clone();
        }
        if let Some(color) = override_data.color.as_ref() {
            material.color = color.clone();
        }
        if let Some(metalness) = override_data.metalness {
            material.metalness = metalness;
        }
        if let Some(roughness) = override_data.roughness {
            material.roughness = roughness;
        }
        if let Some(normal_scale) = override_data.normal_scale {
            material.normalScale = normal_scale;
        }
        if let Some(occlusion_strength) = override_data.occlusion_strength {
            material.occlusionStrength = occlusion_strength;
        }
        if let Some(texture_offset_x) = override_data.texture_offset_x {
            material.textureOffsetX = texture_offset_x;
        }
        if let Some(texture_offset_y) = override_data.texture_offset_y {
            material.textureOffsetY = texture_offset_y;
        }
        if let Some(texture_repeat_x) = override_data.texture_repeat_x {
            material.textureRepeatX = texture_repeat_x;
        }
        if let Some(texture_repeat_y) = override_data.texture_repeat_y {
            material.textureRepeatY = texture_repeat_y;
        }

        if let Some(emissive) = override_data.emissive.as_ref() {
            material.emissive = Some(emissive.clone());
        }
        if let Some(emissive_intensity) = override_data.emissive_intensity {
            material.emissiveIntensity = emissive_intensity;
        }

        if let Some(albedo_texture) = override_data.albedo_texture.as_ref() {
            material.albedoTexture = Some(albedo_texture.clone());
        }
        if let Some(normal_texture) = override_data.normal_texture.as_ref() {
            material.normalTexture = Some(normal_texture.clone());
        }
        if let Some(metallic_texture) = override_data.metallic_texture.as_ref() {
            material.metallicTexture = Some(metallic_texture.clone());
        }
        if let Some(roughness_texture) = override_data.roughness_texture.as_ref() {
            material.roughnessTexture = Some(roughness_texture.clone());
        }
        if let Some(emissive_texture) = override_data.emissive_texture.as_ref() {
            material.emissiveTexture = Some(emissive_texture.clone());
        }
        if let Some(occlusion_texture) = override_data.occlusion_texture.as_ref() {
            material.occlusionTexture = Some(occlusion_texture.clone());
        }

        if let Some(transparent) = override_data.transparent {
            material.transparent = transparent;
        }
        if let Some(alpha_mode) = override_data.alpha_mode.as_ref() {
            material.alphaMode = alpha_mode.clone();
        }
        if let Some(alpha_cutoff) = override_data.alpha_cutoff {
            material.alphaCutoff = alpha_cutoff;
        }

        let inline_id = Self::generate_inline_material_id(base_material_id, entity_id, variant_index);
        material.id = inline_id.clone();
        if material.name.is_none() {
            material.name = Some(format!("Inline {}", inline_id));
        }

        material_cache.insert(material.clone());
        inline_id
    }

    /// Resolve material ID with optional inline override and caching
    pub fn resolve_material_id(
        material_cache: &mut MaterialCache,
        base_material_id: Option<String>,
        inline_override: Option<&MeshRendererMaterialOverride>,
        entity_id: EntityId,
        variant_index: usize,
        cache: &mut HashMap<Option<String>, String>,
    ) -> Option<String> {
        if let Some(override_data) = inline_override {
            if let Some(existing) = cache.get(&base_material_id) {
                return Some(existing.clone());
            }
            let new_id = Self::apply_inline_override(
                material_cache,
                base_material_id.as_deref(),
                override_data,
                entity_id,
                variant_index,
            );
            cache.insert(base_material_id.clone(), new_id.clone());
            Some(new_id)
        } else {
            base_material_id
        }
    }

    /// Generate unique ID for inline material (pure function)
    fn generate_inline_material_id(
        base_material_id: Option<&str>,
        entity_id: EntityId,
        variant_index: usize,
    ) -> String {
        let mut hasher = DefaultHasher::new();
        hasher.write_u64(entity_id.as_u64());
        hasher.write_usize(variant_index);
        if let Some(id) = base_material_id {
            id.hash(&mut hasher);
        }
        let hash = hasher.finish();
        format!("inline-{hash:x}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_material_default() {
        let material = Material::default();
        let uniform = MaterialBuilder::from_material(&material);

        // Verify default values are preserved
        assert_eq!(uniform.metalness(), material.metalness);
        assert_eq!(uniform.roughness(), material.roughness);
    }

    #[test]
    fn test_generate_inline_material_id_unique() {
        let entity1 = EntityId::from_u64(1);
        let entity2 = EntityId::from_u64(2);

        let id1 = MaterialBuilder::generate_inline_material_id(None, entity1, 0);
        let id2 = MaterialBuilder::generate_inline_material_id(None, entity2, 0);

        assert_ne!(id1, id2, "Different entities should produce different IDs");
    }

    #[test]
    fn test_generate_inline_material_id_variant_index() {
        let entity = EntityId::from_u64(1);

        let id1 = MaterialBuilder::generate_inline_material_id(None, entity, 0);
        let id2 = MaterialBuilder::generate_inline_material_id(None, entity, 1);

        assert_ne!(id1, id2, "Different variant indices should produce different IDs");
    }

    #[test]
    fn test_generate_inline_material_id_base_material() {
        let entity = EntityId::from_u64(1);

        let id1 = MaterialBuilder::generate_inline_material_id(None, entity, 0);
        let id2 = MaterialBuilder::generate_inline_material_id(Some("base"), entity, 0);

        assert_ne!(id1, id2, "Different base materials should produce different IDs");
    }

    #[test]
    fn test_resolve_material_id_without_override() {
        let mut material_cache = MaterialCache::new();
        let mut cache = HashMap::new();

        let result = MaterialBuilder::resolve_material_id(
            &mut material_cache,
            Some("test_material".to_string()),
            None,
            EntityId::from_u64(1),
            0,
            &mut cache,
        );

        assert_eq!(result, Some("test_material".to_string()));
    }

    #[test]
    fn test_resolve_material_id_with_override_caches_result() {
        let mut material_cache = MaterialCache::new();
        let mut cache = HashMap::new();
        let override_data = MeshRendererMaterialOverride {
            metalness: Some(0.8),
            ..Default::default()
        };

        let result1 = MaterialBuilder::resolve_material_id(
            &mut material_cache,
            Some("base".to_string()),
            Some(&override_data),
            EntityId::from_u64(1),
            0,
            &mut cache,
        );

        let result2 = MaterialBuilder::resolve_material_id(
            &mut material_cache,
            Some("base".to_string()),
            Some(&override_data),
            EntityId::from_u64(1),
            0,
            &mut cache,
        );

        assert_eq!(result1, result2, "Should return cached result");
        assert_eq!(cache.len(), 1, "Should have one cached entry");
    }
}
