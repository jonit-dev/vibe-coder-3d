use anyhow::Context;
use std::collections::HashMap;
use std::path::Path;
use wgpu::util::DeviceExt;

/// Cached GPU texture with view and sampler
pub struct GpuTexture {
    pub texture: wgpu::Texture,
    pub view: wgpu::TextureView,
    pub sampler: wgpu::Sampler,
}

/// Cache for loaded textures
pub struct TextureCache {
    textures: HashMap<String, GpuTexture>,
    default_texture: Option<GpuTexture>,
    default_normal: Option<GpuTexture>,
    default_black: Option<GpuTexture>,
    default_gray: Option<GpuTexture>,
}

impl TextureCache {
    pub fn new() -> Self {
        Self {
            textures: HashMap::new(),
            default_texture: None,
            default_normal: None,
            default_black: None,
            default_gray: None,
        }
    }

    /// Initialize with default textures (white, normal, black, gray)
    pub fn initialize_default(&mut self, device: &wgpu::Device, queue: &wgpu::Queue) {
        log::info!("Creating default textures...");

        // 1x1 white texture (for albedo/emissive fallback)
        let white_pixel = [255u8, 255, 255, 255];
        let default_texture = self
            .create_texture_from_bytes(device, queue, &white_pixel, 1, 1, "default_white")
            .expect("Failed to create default white texture");
        self.default_texture = Some(default_texture);

        // 1x1 normal map (flat normal pointing up: 128, 128, 255)
        let normal_pixel = [128u8, 128, 255, 255];
        let default_normal = self
            .create_texture_from_bytes(device, queue, &normal_pixel, 1, 1, "default_normal")
            .expect("Failed to create default normal texture");
        self.default_normal = Some(default_normal);

        // 1x1 black texture (for occlusion/metallic fallback)
        let black_pixel = [0u8, 0, 0, 255];
        let default_black = self
            .create_texture_from_bytes(device, queue, &black_pixel, 1, 1, "default_black")
            .expect("Failed to create default black texture");
        self.default_black = Some(default_black);

        // 1x1 gray texture (for roughness fallback - 0.7 roughness = ~179 in 0-255 range)
        let gray_pixel = [179u8, 179, 179, 255];
        let default_gray = self
            .create_texture_from_bytes(device, queue, &gray_pixel, 1, 1, "default_gray")
            .expect("Failed to create default gray texture");
        self.default_gray = Some(default_gray);

        log::info!("Default textures created (white, normal, black, gray)");
    }

    /// Load texture from raw RGBA pixels
    pub fn load_from_rgba_pixels(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        rgba: &[u8],
        width: u32,
        height: u32,
        id: &str,
    ) -> anyhow::Result<()> {
        // Check if already loaded
        if self.textures.contains_key(id) {
            log::debug!("Texture '{}' already cached", id);
            return Ok(());
        }

        log::info!(
            "Loading texture from RGBA pixels: {} ({}x{})",
            id,
            width,
            height
        );

        let texture = self.create_texture_from_bytes(device, queue, rgba, width, height, id)?;

        self.textures.insert(id.to_string(), texture);
        log::info!("Loaded texture '{}' ({}x{})", id, width, height);

        Ok(())
    }

    /// Load texture from raw image data (PNG, JPEG, etc.)
    pub fn load_from_image_data(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        image_data: &[u8],
        id: &str,
    ) -> anyhow::Result<()> {
        // Check if already loaded
        if self.textures.contains_key(id) {
            log::debug!("Texture '{}' already cached", id);
            return Ok(());
        }

        log::info!("Loading texture from image data: {}", id);

        // Decode image
        let img = image::load_from_memory(image_data)
            .with_context(|| format!("Failed to decode image data for: {}", id))?;

        let rgba = img.to_rgba8();
        let dimensions = rgba.dimensions();

        let texture =
            self.create_texture_from_bytes(device, queue, &rgba, dimensions.0, dimensions.1, id)?;

        self.textures.insert(id.to_string(), texture);
        log::info!(
            "Loaded texture '{}' ({}x{})",
            id,
            dimensions.0,
            dimensions.1
        );

        Ok(())
    }

    /// Load texture from file path
    pub fn load_from_file(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        path: &str,
    ) -> anyhow::Result<()> {
        // Check if already loaded
        if self.textures.contains_key(path) {
            log::debug!("Texture '{}' already cached", path);
            return Ok(());
        }

        log::info!("Loading texture from: {}", path);

        // Load image from file
        let img = image::open(path).with_context(|| format!("Failed to load image: {}", path))?;

        let rgba = img.to_rgba8();
        let dimensions = rgba.dimensions();

        let texture =
            self.create_texture_from_bytes(device, queue, &rgba, dimensions.0, dimensions.1, path)?;

        self.textures.insert(path.to_string(), texture);
        log::info!(
            "Loaded texture '{}' ({}x{})",
            path,
            dimensions.0,
            dimensions.1
        );

        Ok(())
    }

    /// Create texture from raw RGBA bytes
    fn create_texture_from_bytes(
        &self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        rgba: &[u8],
        width: u32,
        height: u32,
        label: &str,
    ) -> anyhow::Result<GpuTexture> {
        let size = wgpu::Extent3d {
            width,
            height,
            depth_or_array_layers: 1,
        };

        let texture = device.create_texture(&wgpu::TextureDescriptor {
            label: Some(label),
            size,
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8UnormSrgb,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });

        queue.write_texture(
            wgpu::ImageCopyTexture {
                texture: &texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            rgba,
            wgpu::ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(4 * width),
                rows_per_image: Some(height),
            },
            size,
        );

        let view = texture.create_view(&wgpu::TextureViewDescriptor::default());

        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            address_mode_u: wgpu::AddressMode::Repeat,
            address_mode_v: wgpu::AddressMode::Repeat,
            address_mode_w: wgpu::AddressMode::Repeat,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            mipmap_filter: wgpu::FilterMode::Linear,
            ..Default::default()
        });

        Ok(GpuTexture {
            texture,
            view,
            sampler,
        })
    }

    /// Get texture by path, returns default if not found
    pub fn get(&self, path: &str) -> &GpuTexture {
        self.textures.get(path).unwrap_or_else(|| {
            self.default_texture
                .as_ref()
                .expect("Default texture not initialized")
        })
    }

    /// Get default white texture
    pub fn default(&self) -> &GpuTexture {
        self.default_texture
            .as_ref()
            .expect("Default texture not initialized")
    }

    /// Get default normal map texture (flat normal)
    pub fn default_normal(&self) -> &GpuTexture {
        self.default_normal
            .as_ref()
            .expect("Default normal texture not initialized")
    }

    /// Get default black texture (for metallic/occlusion)
    pub fn default_black(&self) -> &GpuTexture {
        self.default_black
            .as_ref()
            .expect("Default black texture not initialized")
    }

    /// Get default gray texture (for roughness)
    pub fn default_gray(&self) -> &GpuTexture {
        self.default_gray
            .as_ref()
            .expect("Default gray texture not initialized")
    }

    /// Check if texture exists
    pub fn contains(&self, path: &str) -> bool {
        self.textures.contains_key(path)
    }

    /// Get count of loaded textures
    pub fn len(&self) -> usize {
        self.textures.len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.textures.is_empty()
    }
}

impl Default for TextureCache {
    fn default() -> Self {
        Self::new()
    }
}
