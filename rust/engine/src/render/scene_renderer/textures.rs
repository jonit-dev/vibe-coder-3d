//! Texture binding - handles texture view selection, defaults, and texture flags.
//!
//! This module encapsulates texture selection logic for entities, including fallback to defaults.

use super::super::material_uniform::{
    TEXTURE_ALBEDO, TEXTURE_EMISSIVE, TEXTURE_METALLIC, TEXTURE_NORMAL, TEXTURE_OCCLUSION,
    TEXTURE_ROUGHNESS,
};
use vibe_assets::{MaterialCache, TextureCache};

/// Set of 6 texture views and flags for an entity
pub struct TextureSet<'a> {
    pub albedo_view: &'a wgpu::TextureView,
    pub has_albedo: bool,
    pub normal_view: &'a wgpu::TextureView,
    pub has_normal: bool,
    pub metallic_view: &'a wgpu::TextureView,
    pub has_metallic: bool,
    pub roughness_view: &'a wgpu::TextureView,
    pub has_roughness: bool,
    pub emissive_view: &'a wgpu::TextureView,
    pub has_emissive: bool,
    pub occlusion_view: &'a wgpu::TextureView,
    pub has_occlusion: bool,
}

impl<'a> TextureSet<'a> {
    /// Calculate texture flags from availability
    pub fn flags(&self) -> u32 {
        let mut flags = 0;
        if self.has_albedo {
            flags |= TEXTURE_ALBEDO;
        }
        if self.has_normal {
            flags |= TEXTURE_NORMAL;
        }
        if self.has_metallic {
            flags |= TEXTURE_METALLIC;
        }
        if self.has_roughness {
            flags |= TEXTURE_ROUGHNESS;
        }
        if self.has_emissive {
            flags |= TEXTURE_EMISSIVE;
        }
        if self.has_occlusion {
            flags |= TEXTURE_OCCLUSION;
        }
        flags
    }
}

/// Texture view selection and binding
pub struct TextureBinder;

impl TextureBinder {
    /// Pick texture views for an entity with texture override (pure function)
    pub fn pick_with_override<'a>(
        texture_cache: &'a TextureCache,
        texture_override: &str,
    ) -> TextureSet<'a> {
        let has_texture = texture_cache.contains(texture_override);
        let texture = texture_cache.get(texture_override);
        let default_normal = texture_cache.default_normal();
        let default_black = texture_cache.default_black();
        let default_gray = texture_cache.default_gray();
        let default_white = texture_cache.default();

        TextureSet {
            albedo_view: &texture.view,
            has_albedo: has_texture,
            normal_view: &default_normal.view,
            has_normal: false,
            metallic_view: &default_black.view,
            has_metallic: false,
            roughness_view: &default_gray.view,
            has_roughness: false,
            emissive_view: &default_black.view,
            has_emissive: false,
            occlusion_view: &default_white.view,
            has_occlusion: false,
        }
    }

    /// Pick texture views for an entity with material (pure function)
    pub fn pick_with_material<'a>(
        material_cache: &MaterialCache,
        texture_cache: &'a TextureCache,
        material_id: &str,
    ) -> TextureSet<'a> {
        let material = material_cache.get(material_id);
        let default_white = texture_cache.default();
        let default_normal = texture_cache.default_normal();
        let default_black = texture_cache.default_black();
        let default_gray = texture_cache.default_gray();

        let (albedo_view, has_albedo) = material
            .albedoTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_white.view, false));

        let (normal_view, has_normal) = material
            .normalTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_normal.view, false));

        let (metallic_view, has_metallic) = material
            .metallicTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_black.view, false));

        let (roughness_view, has_roughness) = material
            .roughnessTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_gray.view, false));

        let (emissive_view, has_emissive) = material
            .emissiveTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_black.view, false));

        let (occlusion_view, has_occlusion) = material
            .occlusionTexture
            .as_ref()
            .and_then(|id| {
                texture_cache
                    .contains(id)
                    .then(|| (&texture_cache.get(id).view, true))
            })
            .unwrap_or((&default_white.view, false));

        TextureSet {
            albedo_view,
            has_albedo,
            normal_view,
            has_normal,
            metallic_view,
            has_metallic,
            roughness_view,
            has_roughness,
            emissive_view,
            has_emissive,
            occlusion_view,
            has_occlusion,
        }
    }

    /// Pick texture views with defaults (pure function)
    pub fn pick_defaults(texture_cache: &TextureCache) -> TextureSet {
        let default_white = texture_cache.default();
        let default_normal = texture_cache.default_normal();
        let default_black = texture_cache.default_black();
        let default_gray = texture_cache.default_gray();

        TextureSet {
            albedo_view: &default_white.view,
            has_albedo: false,
            normal_view: &default_normal.view,
            has_normal: false,
            metallic_view: &default_black.view,
            has_metallic: false,
            roughness_view: &default_gray.view,
            has_roughness: false,
            emissive_view: &default_black.view,
            has_emissive: false,
            occlusion_view: &default_white.view,
            has_occlusion: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_texture_flags_none() {
        let texture_cache = TextureCache::new();
        let texture_set = TextureBinder::pick_defaults(&texture_cache);
        assert_eq!(texture_set.flags(), 0, "Default textures should have no flags set");
    }

    #[test]
    fn test_texture_flags_albedo_only() {
        let texture_set = TextureSet {
            albedo_view: &wgpu::TextureView::default(),
            has_albedo: true,
            normal_view: &wgpu::TextureView::default(),
            has_normal: false,
            metallic_view: &wgpu::TextureView::default(),
            has_metallic: false,
            roughness_view: &wgpu::TextureView::default(),
            has_roughness: false,
            emissive_view: &wgpu::TextureView::default(),
            has_emissive: false,
            occlusion_view: &wgpu::TextureView::default(),
            has_occlusion: false,
        };
        assert_eq!(
            texture_set.flags(),
            TEXTURE_ALBEDO,
            "Only albedo flag should be set"
        );
    }

    #[test]
    fn test_texture_flags_all() {
        let texture_set = TextureSet {
            albedo_view: &wgpu::TextureView::default(),
            has_albedo: true,
            normal_view: &wgpu::TextureView::default(),
            has_normal: true,
            metallic_view: &wgpu::TextureView::default(),
            has_metallic: true,
            roughness_view: &wgpu::TextureView::default(),
            has_roughness: true,
            emissive_view: &wgpu::TextureView::default(),
            has_emissive: true,
            occlusion_view: &wgpu::TextureView::default(),
            has_occlusion: true,
        };
        let expected =
            TEXTURE_ALBEDO | TEXTURE_NORMAL | TEXTURE_METALLIC | TEXTURE_ROUGHNESS | TEXTURE_EMISSIVE | TEXTURE_OCCLUSION;
        assert_eq!(texture_set.flags(), expected, "All texture flags should be set");
    }
}
