use glam::Vec3;
use serde::Deserialize;
use std::collections::HashMap;

/// Material definition matching Three.js MaterialDefinition
/// Uses camelCase for JSON compatibility with TypeScript
#[allow(non_snake_case)]
#[derive(Debug, Clone, Deserialize)]
pub struct Material {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,

    // PBR properties
    #[serde(default = "default_color")]
    pub color: String, // Hex color like "#ff0000"

    #[serde(default = "default_roughness")]
    pub roughness: f32,

    #[serde(default)]
    pub emissive: Option<String>, // Hex color

    // Shader type
    #[serde(default = "default_shader")]
    pub shader: String,

    // Material type
    #[serde(default = "default_material_type")]
    pub materialType: String,

    // PBR properties (Three.js naming)
    #[serde(default = "default_metallic")]
    pub metalness: f32, // Also support Three.js "metalness"

    #[serde(default)]
    pub emissiveIntensity: f32,

    // Texture maps (optional) - matching Three.js MaterialDefinition
    #[serde(default)]
    pub albedoTexture: Option<String>,

    #[serde(default)]
    pub normalTexture: Option<String>,

    #[serde(default)]
    pub metallicTexture: Option<String>,

    #[serde(default)]
    pub roughnessTexture: Option<String>,

    #[serde(default)]
    pub emissiveTexture: Option<String>,

    #[serde(default)]
    pub occlusionTexture: Option<String>,

    // Texture transform
    #[serde(default = "default_one")]
    pub normalScale: f32,

    #[serde(default = "default_one")]
    pub occlusionStrength: f32,

    #[serde(default)]
    pub textureOffsetX: f32,

    #[serde(default)]
    pub textureOffsetY: f32,

    #[serde(default = "default_one")]
    pub textureRepeatX: f32,

    #[serde(default = "default_one")]
    pub textureRepeatY: f32,

    #[serde(default)]
    pub transparent: bool,

    #[serde(default = "default_alpha_mode")]
    pub alphaMode: String,

    #[serde(default = "default_alpha_cutoff")]
    pub alphaCutoff: f32,
}

fn default_color() -> String {
    "#cccccc".to_string()
}

fn default_metallic() -> f32 {
    0.0
}

fn default_roughness() -> f32 {
    0.7
}

fn default_shader() -> String {
    "standard".to_string()
}

fn default_material_type() -> String {
    "solid".to_string()
}

fn default_one() -> f32 {
    1.0
}

fn default_alpha_mode() -> String {
    "opaque".to_string()
}

fn default_alpha_cutoff() -> f32 {
    0.5
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
            roughness: 0.7,
            emissive: None,
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.0,
            emissiveIntensity: 0.0,
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
                    log::debug!("  Metalness: {}", material.metalness);
                    log::debug!("  Roughness: {}", material.roughness);
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

    /// Insert or replace a material in the cache (used for inline overrides)
    pub fn insert(&mut self, material: Material) {
        log::debug!("Inserting override material '{}'", material.id);
        self.materials.insert(material.id.clone(), material);
    }
}

impl Default for MaterialCache {
    fn default() -> Self {
        Self::new()
    }
}
