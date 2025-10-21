/// Texture caching and async loading for three-d renderer
///
/// Provides efficient texture loading with caching to avoid duplicate loads
use anyhow::{Context as AnyhowContext, Result};
use std::collections::HashMap;
use std::rc::Rc;
use three_d::CpuTexture;

/// Manages texture caching and async loading
pub struct TextureCache {
    textures: HashMap<String, Rc<CpuTexture>>,
}

impl TextureCache {
    pub fn new() -> Self {
        Self {
            textures: HashMap::new(),
        }
    }

    /// Load a texture from the given path
    /// Returns cached texture if already loaded, otherwise loads from disk
    pub async fn load_texture(&mut self, path: &str) -> Result<Rc<CpuTexture>> {
        // Check cache first
        if let Some(cached) = self.textures.get(path) {
            log::debug!("Texture cache hit: {}", path);
            return Ok(Rc::clone(cached));
        }

        log::info!("Loading texture: {}", path);

        // Load via three_d_asset
        let mut loaded = three_d_asset::io::load_async(&[path])
            .await
            .with_context(|| format!("Failed to load texture from path: {}", path))?;

        let cpu_texture: CpuTexture = loaded
            .deserialize("")
            .with_context(|| format!("Failed to deserialize texture: {}", path))?;

        let rc_texture = Rc::new(cpu_texture);

        self.textures
            .insert(path.to_string(), Rc::clone(&rc_texture));
        log::debug!(
            "Texture cached: {} ({} total in cache)",
            path,
            self.textures.len()
        );

        Ok(rc_texture)
    }

    /// Load a GLTF embedded image directly from raw RGBA data
    /// Used for textures embedded in GLB files
    pub fn load_gltf_image(
        &mut self,
        texture_id: &str,
        rgba_data: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Rc<CpuTexture>> {
        // Check cache first
        if let Some(cached) = self.textures.get(texture_id) {
            log::debug!("GLTF texture cache hit: {}", texture_id);
            return Ok(Rc::clone(cached));
        }

        log::info!(
            "Loading GLTF embedded texture: {} ({}x{})",
            texture_id,
            width,
            height
        );

        // Create CpuTexture from raw RGBA data using three_d's constructor
        // Convert flat RGBA bytes to array of [u8; 4]
        use three_d::TextureData;

        if rgba_data.len() != (width * height * 4) as usize {
            anyhow::bail!(
                "GLTF texture data size mismatch: expected {} bytes, got {}",
                width * height * 4,
                rgba_data.len()
            );
        }

        let rgba_pixels: Vec<[u8; 4]> = rgba_data
            .chunks_exact(4)
            .map(|chunk| [chunk[0], chunk[1], chunk[2], chunk[3]])
            .collect();

        let cpu_texture = CpuTexture {
            data: TextureData::RgbaU8(rgba_pixels),
            width,
            height,
            ..Default::default()
        };

        let rc_texture = Rc::new(cpu_texture);

        self.textures
            .insert(texture_id.to_string(), Rc::clone(&rc_texture));
        log::debug!(
            "GLTF texture cached: {} ({} total in cache)",
            texture_id,
            self.textures.len()
        );

        Ok(rc_texture)
    }

    /// Get a cached texture by path (does not load if missing)
    pub fn get(&self, path: &str) -> Option<Rc<CpuTexture>> {
        self.textures.get(path).map(Rc::clone)
    }

    /// Check if a texture is already cached
    pub fn contains(&self, path: &str) -> bool {
        self.textures.contains_key(path)
    }

    /// Get the number of cached textures
    pub fn len(&self) -> usize {
        self.textures.len()
    }

    /// Check if the cache is empty
    pub fn is_empty(&self) -> bool {
        self.textures.is_empty()
    }

    /// Clear all cached textures
    pub fn clear(&mut self) {
        log::info!("Clearing texture cache ({} textures)", self.textures.len());
        self.textures.clear();
    }
}

impl Default for TextureCache {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_texture_cache_new() {
        let cache = TextureCache::new();
        assert!(cache.is_empty());
        assert_eq!(cache.len(), 0);
    }

    #[test]
    fn test_texture_cache_contains() {
        let cache = TextureCache::new();
        assert!(!cache.contains("test.png"));
    }

    #[test]
    fn test_texture_cache_get_missing() {
        let cache = TextureCache::new();
        assert!(cache.get("nonexistent.png").is_none());
    }

    #[test]
    fn test_texture_cache_clear() {
        let mut cache = TextureCache::new();
        // We can't actually load textures without a context in unit tests,
        // but we can test the clear operation
        cache.clear();
        assert_eq!(cache.len(), 0);
    }
}
