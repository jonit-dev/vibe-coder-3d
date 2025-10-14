use glam::Vec3;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
pub struct Material {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,

    // PBR properties
    #[serde(default = "default_color")]
    pub color: String, // Hex color like "#ff0000"

    #[serde(default = "default_metallic")]
    pub metallic: f32,

    #[serde(default = "default_roughness")]
    pub roughness: f32,

    #[serde(default)]
    pub emissive: Option<String>, // Hex color

    #[serde(default = "default_opacity")]
    pub opacity: f32,

    // Shader type
    #[serde(default = "default_shader")]
    pub shader: String,
}

fn default_color() -> String {
    "#cccccc".to_string()
}

fn default_metallic() -> f32 {
    0.0
}

fn default_roughness() -> f32 {
    0.5
}

fn default_opacity() -> f32 {
    1.0
}

fn default_shader() -> String {
    "standard".to_string()
}

impl Material {
    /// Parse hex color to RGB Vec3 (0.0 - 1.0 range)
    pub fn color_rgb(&self) -> Vec3 {
        parse_hex_color(&self.color).unwrap_or(Vec3::new(0.8, 0.8, 0.8))
    }

    /// Parse emissive hex color to RGB Vec3
    pub fn emissive_rgb(&self) -> Vec3 {
        if let Some(ref emissive) = self.emissive {
            parse_hex_color(emissive).unwrap_or(Vec3::ZERO)
        } else {
            Vec3::ZERO
        }
    }
}

/// Parse hex color string (#RRGGBB) to Vec3 with values 0.0-1.0
fn parse_hex_color(hex: &str) -> Option<Vec3> {
    let hex = hex.trim_start_matches('#');

    if hex.len() != 6 {
        return None;
    }

    let r = u8::from_str_radix(&hex[0..2], 16).ok()? as f32 / 255.0;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()? as f32 / 255.0;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()? as f32 / 255.0;

    Some(Vec3::new(r, g, b))
}

pub struct MaterialCache {
    materials: HashMap<String, Material>,
    default_material: Material,
}

impl MaterialCache {
    pub fn new() -> Self {
        let default_material = Material {
            id: "default".to_string(),
            name: Some("Default Material".to_string()),
            color: "#cccccc".to_string(),
            metallic: 0.0,
            roughness: 0.5,
            emissive: None,
            opacity: 1.0,
            shader: "standard".to_string(),
        };

        Self {
            materials: HashMap::new(),
            default_material,
        }
    }

    /// Load materials from scene JSON value
    pub fn load_from_scene(&mut self, materials_value: Option<&serde_json::Value>) {
        if let Some(value) = materials_value {
            if let Ok(materials) = serde_json::from_value::<Vec<Material>>(value.clone()) {
                log::info!("Loading {} materials from scene", materials.len());

                for (idx, material) in materials.iter().enumerate() {
                    let mat_name = material.name.as_ref().unwrap_or(&material.id);
                    log::debug!("Material #{}: '{}'", idx, mat_name);
                    log::debug!("  ID: {}", material.id);
                    log::debug!("  Shader: {}", material.shader);
                    log::debug!(
                        "  Color: {} -> RGB({:.2}, {:.2}, {:.2})",
                        material.color,
                        material.color_rgb().x,
                        material.color_rgb().y,
                        material.color_rgb().z
                    );
                    log::debug!("  Metallic: {}", material.metallic);
                    log::debug!("  Roughness: {}", material.roughness);
                    log::debug!("  Opacity: {}", material.opacity);
                    if let Some(ref emissive) = material.emissive {
                        let emissive_rgb = material.emissive_rgb();
                        log::debug!(
                            "  Emissive: {} -> RGB({:.2}, {:.2}, {:.2})",
                            emissive,
                            emissive_rgb.x,
                            emissive_rgb.y,
                            emissive_rgb.z
                        );
                    }

                    self.materials.insert(material.id.clone(), material.clone());
                }
                log::info!("Successfully loaded {} materials", materials.len());
            } else {
                log::warn!("Failed to parse materials from scene");
            }
        } else {
            log::debug!("No materials in scene, using defaults");
        }
    }

    /// Get material by ID, returns default if not found
    pub fn get(&self, id: &str) -> &Material {
        self.materials.get(id).unwrap_or(&self.default_material)
    }

    /// Get default material
    pub fn default(&self) -> &Material {
        &self.default_material
    }

    /// Check if material exists
    pub fn contains(&self, id: &str) -> bool {
        self.materials.contains_key(id)
    }

    /// Get count of loaded materials
    pub fn len(&self) -> usize {
        self.materials.len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.materials.is_empty()
    }
}

impl Default for MaterialCache {
    fn default() -> Self {
        Self::new()
    }
}
