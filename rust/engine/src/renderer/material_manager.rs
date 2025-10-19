/// Material management for the three-d renderer
///
/// Handles material caching, creation, and color parsing

use std::collections::HashMap;
use three_d::{Context, CpuMaterial, PhysicalMaterial, Srgba};

/// Material data loaded from scene JSON
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MaterialData {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub metalness: Option<f32>,
    #[serde(default)]
    pub roughness: Option<f32>,
    #[serde(default)]
    pub emissive: Option<String>,
    #[serde(default, rename = "emissiveIntensity")]
    pub emissive_intensity: Option<f32>,
}

/// Manages material caching and creation
pub struct MaterialManager {
    cache: HashMap<String, MaterialData>,
}

impl MaterialManager {
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }

    /// Add a material to the cache
    pub fn add_material(&mut self, id: String, material: MaterialData) {
        self.cache.insert(id, material);
    }

    /// Get a material from the cache
    pub fn get_material(&self, id: &str) -> Option<&MaterialData> {
        self.cache.get(id)
    }

    /// Clear all cached materials
    pub fn clear(&mut self) {
        self.cache.clear();
    }

    /// Create a three-d PhysicalMaterial from MaterialData
    pub fn create_physical_material(
        &self,
        context: &Context,
        material: &MaterialData,
    ) -> PhysicalMaterial {
        let albedo_color = material
            .color
            .as_ref()
            .and_then(|hex| parse_hex_color(hex))
            .unwrap_or(Srgba::WHITE);

        let cpu_material = CpuMaterial {
            albedo: albedo_color,
            metallic: material.metalness.unwrap_or(0.0),
            roughness: material.roughness.unwrap_or(0.7),
            ..Default::default()
        };

        PhysicalMaterial::new(context, &cpu_material)
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
                if let Ok(material) =
                    serde_json::from_value::<MaterialData>(material_json.clone())
                {
                    if let Some(id) = &material.id {
                        log::info!("\nMaterial {}: {}", idx + 1, id);
                        log::info!("  Color:      {:?}", material.color);
                        log::info!("  Metalness:  {:?}", material.metalness);
                        log::info!("  Roughness:  {:?}", material.roughness);
                        log::info!("  Emissive:   {:?}", material.emissive);
                        log::info!("  Emissive Intensity: {:?}", material.emissive_intensity);
                        self.add_material(id.clone(), material);
                    }
                }
            }
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
