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
}

impl TextureCache {
    pub fn new() -> Self {
        Self {
            textures: HashMap::new(),
            default_texture: None,
        }
    }

    /// Initialize with a default 1x1 white texture
    pub fn initialize_default(&mut self, device: &wgpu::Device, queue: &wgpu::Queue) {
        log::info!("Creating default texture...");

        // 1x1 white texture
        let white_pixel = [255u8, 255, 255, 255];
        let default_texture = self.create_texture_from_bytes(
            device,
            queue,
            &white_pixel,
            1,
            1,
            "default",
        ).expect("Failed to create default texture");

        self.default_texture = Some(default_texture);
        log::info!("Default texture created");
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

        log::info!("Loading texture from RGBA pixels: {} ({}x{})", id, width, height);

        let texture = self.create_texture_from_bytes(
            device,
            queue,
            rgba,
            width,
            height,
            id,
        )?;

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

        let texture = self.create_texture_from_bytes(
            device,
            queue,
            &rgba,
            dimensions.0,
            dimensions.1,
            id,
        )?;

        self.textures.insert(id.to_string(), texture);
        log::info!("Loaded texture '{}' ({}x{})", id, dimensions.0, dimensions.1);

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
        let img = image::open(path)
            .with_context(|| format!("Failed to load image: {}", path))?;

        let rgba = img.to_rgba8();
        let dimensions = rgba.dimensions();

        let texture = self.create_texture_from_bytes(
            device,
            queue,
            &rgba,
            dimensions.0,
            dimensions.1,
            path,
        )?;

        self.textures.insert(path.to_string(), texture);
        log::info!("Loaded texture '{}' ({}x{})", path, dimensions.0, dimensions.1);

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
            self.default_texture.as_ref().expect("Default texture not initialized")
        })
    }

    /// Get default texture
    pub fn default(&self) -> &GpuTexture {
        self.default_texture.as_ref().expect("Default texture not initialized")
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
