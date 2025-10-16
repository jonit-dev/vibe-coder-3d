/// Shadow map resources for rendering shadows
/// Manages depth textures, samplers, and matrices for shadow mapping
use wgpu::{Device, Sampler, TextureView};

/// Shadow map configuration
pub struct ShadowConfig {
    /// Size of shadow maps (width and height in pixels)
    pub shadow_map_size: u32,
    /// Depth texture format
    pub depth_format: wgpu::TextureFormat,
    /// Maximum number of shadowed directional lights
    pub max_directional_lights: usize,
    /// Maximum number of shadowed spot lights
    pub max_spot_lights: usize,
}

impl Default for ShadowConfig {
    fn default() -> Self {
        Self {
            shadow_map_size: 2048,
            depth_format: wgpu::TextureFormat::Depth32Float,
            max_directional_lights: 1,
            max_spot_lights: 2,
        }
    }
}

/// Shadow resources for all lights
pub struct ShadowResources {
    pub config: ShadowConfig,
    /// Directional light shadow maps (one per light)
    pub directional_maps: Vec<ShadowMap>,
    /// Spot light shadow maps (one per light)
    pub spot_maps: Vec<ShadowMap>,
    /// Depth comparison sampler for shadow sampling
    pub compare_sampler: Sampler,
}

/// A single shadow map with its depth texture
pub struct ShadowMap {
    pub texture: wgpu::Texture,
    pub view: TextureView,
}

impl ShadowResources {
    pub fn new(device: &Device, config: ShadowConfig) -> Self {
        // Create depth comparison sampler
        let compare_sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("Shadow Compare Sampler"),
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            address_mode_w: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            mipmap_filter: wgpu::FilterMode::Nearest,
            compare: Some(wgpu::CompareFunction::LessEqual),
            ..Default::default()
        });

        // Create directional light shadow maps
        let mut directional_maps = Vec::with_capacity(config.max_directional_lights);
        for i in 0..config.max_directional_lights {
            directional_maps.push(Self::create_shadow_map(
                device,
                &config,
                &format!("Directional Shadow Map {}", i),
            ));
        }

        // Create spot light shadow maps
        let mut spot_maps = Vec::with_capacity(config.max_spot_lights);
        for i in 0..config.max_spot_lights {
            spot_maps.push(Self::create_shadow_map(
                device,
                &config,
                &format!("Spot Shadow Map {}", i),
            ));
        }

        Self {
            config,
            directional_maps,
            spot_maps,
            compare_sampler,
        }
    }

    fn create_shadow_map(device: &Device, config: &ShadowConfig, label: &str) -> ShadowMap {
        let size = wgpu::Extent3d {
            width: config.shadow_map_size,
            height: config.shadow_map_size,
            depth_or_array_layers: 1,
        };

        let texture = device.create_texture(&wgpu::TextureDescriptor {
            label: Some(label),
            size,
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: config.depth_format,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::TEXTURE_BINDING,
            view_formats: &[],
        });

        let view = texture.create_view(&wgpu::TextureViewDescriptor::default());

        ShadowMap { texture, view }
    }

    /// Get shadow map for a directional light by index
    pub fn get_directional_map(&self, index: usize) -> Option<&ShadowMap> {
        self.directional_maps.get(index)
    }

    /// Get shadow map for a spot light by index
    pub fn get_spot_map(&self, index: usize) -> Option<&ShadowMap> {
        self.spot_maps.get(index)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shadow_config_default() {
        let config = ShadowConfig::default();
        assert_eq!(config.shadow_map_size, 2048);
        assert_eq!(config.depth_format, wgpu::TextureFormat::Depth32Float);
        assert_eq!(config.max_directional_lights, 1);
        assert_eq!(config.max_spot_lights, 2);
    }
}
