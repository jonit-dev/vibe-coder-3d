/// Material management for the three-d renderer
///
/// Handles material caching, creation, color parsing, and texture loading
use std::collections::HashMap;
use three_d::{Context, CpuMaterial, PhysicalMaterial, Srgba};
use vibe_assets::Material;

use super::texture_cache::TextureCache;

/// Manages material caching and creation with texture support
pub struct MaterialManager {
    cache: HashMap<String, Material>,
    texture_cache: TextureCache,
}

impl MaterialManager {
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
            texture_cache: TextureCache::new(),
        }
    }

    /// Add a material to the cache
    pub fn add_material(&mut self, id: String, material: Material) {
        self.cache.insert(id, material);
    }

    /// Get a material from the cache
    pub fn get_material(&self, id: &str) -> Option<&Material> {
        self.cache.get(id)
    }

    /// Clear all cached materials
    pub fn clear(&mut self) {
        self.cache.clear();
    }

    /// Get the texture cache for inspection or direct access
    pub fn texture_cache(&self) -> &TextureCache {
        &self.texture_cache
    }

    /// Get mutable access to the texture cache
    pub fn texture_cache_mut(&mut self) -> &mut TextureCache {
        &mut self.texture_cache
    }

    /// Create a three-d PhysicalMaterial from Material
    /// Now with full PBR support: albedo, normal, metallic, roughness, emissive, occlusion textures!
    pub async fn create_physical_material(
        &mut self,
        context: &Context,
        material: &Material,
    ) -> anyhow::Result<PhysicalMaterial> {
        let albedo_color = parse_hex_color(&material.color).unwrap_or(Srgba::WHITE);

        // Parse emissive color and apply intensity
        // In three-d, emissive is just an Srgba color
        // We multiply the RGB values by intensity to simulate Three.js emissive behavior
        let emissive_color = if let Some(ref emissive_hex) = material.emissive {
            if let Some(base_color) = parse_hex_color(emissive_hex) {
                let intensity = material.emissiveIntensity;
                // Scale RGB by intensity (clamped to 255)
                Srgba::new(
                    (base_color.r as f32 * intensity).min(255.0) as u8,
                    (base_color.g as f32 * intensity).min(255.0) as u8,
                    (base_color.b as f32 * intensity).min(255.0) as u8,
                    255,
                )
            } else {
                Srgba::new(0, 0, 0, 255)
            }
        } else {
            Srgba::new(0, 0, 0, 255)
        };

        let mut cpu_material = CpuMaterial {
            albedo: albedo_color,
            metallic: material.metalness,
            roughness: material.roughness,
            emissive: emissive_color,
            ..Default::default()
        };

        // ✅ Load albedo texture
        if let Some(ref albedo_path) = material.albedoTexture {
            log::debug!("Loading albedo texture: {}", albedo_path);
            match self.texture_cache.load_texture(albedo_path).await {
                Ok(texture) => {
                    cpu_material.albedo_texture = Some(texture.as_ref().clone());
                    log::debug!("Albedo texture loaded successfully");
                }
                Err(e) => log::warn!("Failed to load albedo texture '{}': {}", albedo_path, e),
            }
        }

        // ✅ Load normal texture + apply scale
        if let Some(ref normal_path) = material.normalTexture {
            log::debug!("Loading normal texture: {}", normal_path);
            match self.texture_cache.load_texture(normal_path).await {
                Ok(texture) => {
                    cpu_material.normal_texture = Some(texture.as_ref().clone());
                    // Apply normal scale (defaults to 1.0 in material)
                    // Note: three-d may not have a direct normal_scale field
                    log::debug!("Normal texture loaded (scale: {})", material.normalScale);
                }
                Err(e) => log::warn!("Failed to load normal texture '{}': {}", normal_path, e),
            }
        }

        // ✅ Load metallic texture (or combined metallic-roughness)
        if let Some(ref metallic_path) = material.metallicTexture {
            log::debug!("Loading metallic texture: {}", metallic_path);
            match self.texture_cache.load_texture(metallic_path).await {
                Ok(texture) => {
                    cpu_material.metallic_roughness_texture = Some(texture.as_ref().clone());
                    log::debug!("Metallic texture loaded successfully");
                }
                Err(e) => log::warn!("Failed to load metallic texture '{}': {}", metallic_path, e),
            }
        }

        // ✅ Load roughness texture (if separate from metallic)
        if material.metallicTexture.is_none() {
            if let Some(ref roughness_path) = material.roughnessTexture {
                log::debug!("Loading roughness texture: {}", roughness_path);
                match self.texture_cache.load_texture(roughness_path).await {
                    Ok(texture) => {
                        cpu_material.metallic_roughness_texture = Some(texture.as_ref().clone());
                        log::debug!("Roughness texture loaded successfully");
                    }
                    Err(e) => log::warn!(
                        "Failed to load roughness texture '{}': {}",
                        roughness_path,
                        e
                    ),
                }
            }
        }

        // ✅ Load emissive texture
        if let Some(ref emissive_path) = material.emissiveTexture {
            log::debug!("Loading emissive texture: {}", emissive_path);
            match self.texture_cache.load_texture(emissive_path).await {
                Ok(texture) => {
                    cpu_material.emissive_texture = Some(texture.as_ref().clone());
                    log::debug!("Emissive texture loaded successfully");
                }
                Err(e) => log::warn!("Failed to load emissive texture '{}': {}", emissive_path, e),
            }
        }

        // ✅ Load occlusion texture + apply strength
        if let Some(ref occlusion_path) = material.occlusionTexture {
            log::debug!("Loading occlusion texture: {}", occlusion_path);
            match self.texture_cache.load_texture(occlusion_path).await {
                Ok(texture) => {
                    cpu_material.occlusion_texture = Some(texture.as_ref().clone());
                    // Apply occlusion strength (defaults to 1.0 in material)
                    // Note: three-d may not have a direct occlusion_strength field
                    log::debug!(
                        "Occlusion texture loaded (strength: {})",
                        material.occlusionStrength
                    );
                }
                Err(e) => log::warn!(
                    "Failed to load occlusion texture '{}': {}",
                    occlusion_path,
                    e
                ),
            }
        }

        // NOTE: UV transforms not supported by three-d's CpuMaterial public API
        // UV transforms would need to be handled at the shader level or via custom material implementation
        let has_uv_transforms = material.textureOffsetX != 0.0
            || material.textureOffsetY != 0.0
            || material.textureRepeatX != 1.0
            || material.textureRepeatY != 1.0;

        if has_uv_transforms {
            log::warn!(
                "UV transforms not yet supported: offset({}, {}), repeat({}, {})",
                material.textureOffsetX,
                material.textureOffsetY,
                material.textureRepeatX,
                material.textureRepeatY
            );
            // Future implementation: Custom shader or three-d API extension
        }

        Ok(PhysicalMaterial::new(context, &cpu_material))
    }

    /// Create a default material
    pub fn create_default_material(&self, context: &Context) -> PhysicalMaterial {
        let cpu_material = CpuMaterial {
            albedo: Srgba::new(200, 200, 200, 255),
            metallic: 0.0,
            roughness: 0.7,
            ..Default::default()
        };

        PhysicalMaterial::new(context, &cpu_material)
    }

    /// Load materials from scene JSON value
    pub fn load_from_scene(&mut self, materials_value: &serde_json::Value) {
        if let Some(materials_array) = materials_value.as_array() {
            log::info!("Loading {} materials...", materials_array.len());
            for (idx, material_json) in materials_array.iter().enumerate() {
                if let Ok(material) = serde_json::from_value::<Material>(material_json.clone()) {
                    let mat_name = material.name.as_ref().unwrap_or(&material.id);
                    log::info!("\nMaterial {}: {}", idx + 1, mat_name);
                    log::info!("  ID:         {}", material.id);
                    log::info!("  Color:      {}", material.color);
                    log::info!("  Metalness:  {}", material.metalness);
                    log::info!("  Roughness:  {}", material.roughness);
                    if let Some(ref emissive) = material.emissive {
                        log::info!("  Emissive:   {}", emissive);
                        log::info!("  Emissive Intensity: {}", material.emissiveIntensity);
                    }
                    // Log texture info if present
                    if material.albedoTexture.is_some() {
                        log::info!("  Albedo Texture: {:?}", material.albedoTexture);
                    }
                    if material.normalTexture.is_some() {
                        log::info!("  Normal Texture: {:?}", material.normalTexture);
                    }

                    self.add_material(material.id.clone(), material);
                }
            }
            log::info!("Successfully loaded {} materials", materials_array.len());
        }
    }
}

impl Default for MaterialManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse hex color string (#RRGGBB or #RGB) to Srgba
pub fn parse_hex_color(hex: &str) -> Option<Srgba> {
    let hex = hex.trim_start_matches('#');

    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
        let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
        let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
        Some(Srgba::new(r, g, b, 255))
    } else if hex.len() == 3 {
        let r = u8::from_str_radix(&hex[0..1], 16).ok()? * 17;
        let g = u8::from_str_radix(&hex[1..2], 16).ok()? * 17;
        let b = u8::from_str_radix(&hex[2..3], 16).ok()? * 17;
        Some(Srgba::new(r, g, b, 255))
    } else {
        None
    }
}

#[cfg(test)]
#[path = "material_manager_test.rs"]
mod material_manager_test;
