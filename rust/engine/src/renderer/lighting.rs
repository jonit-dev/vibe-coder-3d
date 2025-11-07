/// Lighting and shadow management utilities
///
/// Handles light collection and shadow map generation for the rendering pipeline.
use three_d::*;

use super::{EnhancedDirectionalLight, EnhancedSpotLight};

/// Configuration for ambient light combination
#[derive(Debug, Clone)]
pub struct AmbientCombineConfig {
    pub max_intensity: f32,      // e.g. 0.0 = no clamp, or 10.0 default safety
    pub max_color_component: u8, // e.g. 255
}

impl Default for AmbientCombineConfig {
    fn default() -> Self {
        Self {
            max_intensity: 10.0,
            max_color_component: 255,
        }
    }
}

/// Metadata for ambient lights to track authoring-time parameters
#[derive(Debug, Clone)]
pub struct AmbientLightMetadata {
    pub intensity: f32,
    pub color: Srgba,
    pub enabled: bool, // mirrors component state; disabled lights excluded from combination
}

/// Collect all lights from the scene into a single vector
///
/// Combines directional, point, spot, and ambient lights for rendering.
pub fn collect_lights<'a>(
    directional_lights: &'a [EnhancedDirectionalLight],
    point_lights: &'a [PointLight],
    spot_lights: &'a [EnhancedSpotLight],
    ambient_light: &'a Option<AmbientLight>,
) -> Vec<&'a dyn Light> {
    let mut lights: Vec<&dyn Light> = Vec::new();

    for light in directional_lights {
        lights.push(light);
    }
    for light in point_lights {
        lights.push(light);
    }
    for light in spot_lights {
        lights.push(light);
    }
    if let Some(ref ambient) = ambient_light {
        lights.push(ambient);
    }

    lights
}

/// Recompute combined ambient light from multiple ambient light metadata
///
/// Converts many authored ambient lights into a single effective AmbientLight
/// that matches Three.js behavior while remaining numerically stable.
///
/// # Arguments
/// * `metadata` - Array of ambient light metadata including intensity, color, and enabled state
/// * `context` - Three.js context needed for creating the combined ambient light
/// * `cfg` - Configuration for combination behavior (clamping, etc.)
///
/// # Returns
/// * `Some(AmbientLight)` - Combined ambient light if any lights are enabled
/// * `None` - No ambient light if all lights are disabled or empty
///
/// # Combination Algorithm
/// - Intensities from all enabled lights are summed
/// - Colors are combined using intensity-weighted addition
/// - Result is clamped according to configuration to prevent extreme values
/// - Disabled or zero-intensity lights are ignored
pub fn recompute_combined_ambient(
    metadata: &[AmbientLightMetadata],
    context: &Context,
    cfg: &AmbientCombineConfig,
) -> Option<AmbientLight> {
    let mut total_intensity = 0.0f32;
    let mut any_enabled = false;

    log::debug!("recompute_combined_ambient: processing {} ambient lights", metadata.len());

    // First pass: calculate total intensity
    for m in metadata {
        if !m.enabled {
            continue;
        }
        any_enabled = true;
        total_intensity += m.intensity;
    }

    if !any_enabled {
        return None;
    }

    // Calculate intensity-weighted additive color combination
    // Normalize colors to 0-1 range, multiply by intensity, then sum
    // This matches Three.js behavior where each ambient light contributes color * intensity
    let mut acc_r = 0.0f32;
    let mut acc_g = 0.0f32;
    let mut acc_b = 0.0f32;

    for (i, m) in metadata.iter().enumerate() {
        log::debug!("  Ambient light {}: enabled={}, intensity={}, color=({},{},{})",
                   i, m.enabled, m.intensity, m.color.r, m.color.g, m.color.b);
        if !m.enabled {
            continue;
        }

        // Normalize color from 0-255 to 0-1 range
        let r_norm = m.color.r as f32 / 255.0;
        let g_norm = m.color.g as f32 / 255.0;
        let b_norm = m.color.b as f32 / 255.0;

        // Each light contributes: normalized_color * intensity
        // These contributions are additive
        acc_r += r_norm * m.intensity;
        acc_g += g_norm * m.intensity;
        acc_b += b_norm * m.intensity;

        log::debug!("    Normalized color: ({:.3},{:.3},{:.3}), contribution: ({:.3},{:.3},{:.3})",
                   r_norm, g_norm, b_norm,
                   r_norm * m.intensity, g_norm * m.intensity, b_norm * m.intensity);
    }

    let max_intensity = if cfg.max_intensity > 0.0 {
        cfg.max_intensity
    } else {
        f32::INFINITY
    };
    let clamped_intensity = total_intensity.min(max_intensity);

    if clamped_intensity <= 0.0 {
        return None;
    }

    // Convert accumulated color contributions back to 0-255 range
    // The accumulated values (acc_r, acc_g, acc_b) represent: sum(color_i * intensity_i)
    // three_d's AmbientLight will do: ambientColor = color * intensity
    // So we need: color * intensity = sum(color_i * intensity_i)
    // Therefore: color = sum(color_i * intensity_i) / intensity
    // But wait - we want the final ambientColor to be sum(color_i * intensity_i)
    // So we should set: intensity = 1.0, color = sum(color_i * intensity_i)
    // OR: intensity = sum(intensity_i), color = sum(color_i * intensity_i) / sum(intensity_i)
    // 
    // Actually, looking at the shader, ambientColor is multiplied by surface_color,
    // so we want ambientColor to represent the total contribution.
    // Let's use: intensity = sum(intensity_i), color = average weighted by intensity
    let avg_r = if total_intensity > 0.0 {
        acc_r / total_intensity
    } else {
        0.0
    };
    let avg_g = if total_intensity > 0.0 {
        acc_g / total_intensity
    } else {
        0.0
    };
    let avg_b = if total_intensity > 0.0 {
        acc_b / total_intensity
    } else {
        0.0
    };

    // Clamp normalized color to prevent overflow
    let max_c_norm = cfg.max_color_component as f32 / 255.0;
    let final_r_norm = avg_r.min(max_c_norm).max(0.0);
    let final_g_norm = avg_g.min(max_c_norm).max(0.0);
    let final_b_norm = avg_b.min(max_c_norm).max(0.0);

    // Convert back to 0-255 for Srgba
    let final_r = (final_r_norm * 255.0).min(255.0).max(0.0);
    let final_g = (final_g_norm * 255.0).min(255.0).max(0.0);
    let final_b = (final_b_norm * 255.0).min(255.0).max(0.0);

    log::debug!("  Accumulated color contributions (0-1): r={:.3}, g={:.3}, b={:.3}", acc_r, acc_g, acc_b);
    log::debug!("  Average color (normalized by intensity): r={:.3}, g={:.3}, b={:.3}", avg_r, avg_g, avg_b);
    log::debug!("  Final total intensity: {}", total_intensity);
    log::debug!("  Final clamped intensity: {}", clamped_intensity);
    log::debug!("  Final color (0-255): r={:.1}, g={:.1}, b={:.1}", final_r, final_g, final_b);
    log::debug!("  Expected ambientColor in shader: r={:.3}, g={:.3}, b={:.3} (color * intensity)",
               final_r_norm * clamped_intensity, final_g_norm * clamped_intensity, final_b_norm * clamped_intensity);

    let color = Srgba::new(
        final_r as u8,
        final_g as u8,
        final_b as u8,
        255,
    );

    log::info!("============ CREATING COMBINED AMBIENT LIGHT ============");
    log::info!("  Total intensity: {}", total_intensity);
    log::info!("  Clamped intensity: {}", clamped_intensity);
    log::info!("  Final color: RGB({}, {}, {}) in 0-255 range", color.r, color.g, color.b);
    log::info!("  Final color normalized: ({:.3}, {:.3}, {:.3}) in 0-1 range",
               color.r as f32 / 255.0, color.g as f32 / 255.0, color.b as f32 / 255.0);
    log::info!("  Expected shader ambientColor = color_norm * intensity:");
    log::info!("    RGB({:.3}, {:.3}, {:.3})",
               (color.r as f32 / 255.0) * clamped_intensity,
               (color.g as f32 / 255.0) * clamped_intensity,
               (color.b as f32 / 255.0) * clamped_intensity);
    log::info!("========================================================");

    Some(AmbientLight::new(context, clamped_intensity, color))
}

#[cfg(test)]
#[path = "lighting_test.rs"]
mod lighting_test;

/// Generate shadow maps for all shadow-casting lights
///
/// Filters meshes by cast_shadows flag and generates shadow maps
/// for directional and spot lights that have shadow casting enabled.
pub fn generate_shadow_maps(
    meshes: &[Gm<Mesh, PhysicalMaterial>],
    mesh_cast_shadows: &[bool],
    directional_lights: &mut [EnhancedDirectionalLight],
    spot_lights: &mut [EnhancedSpotLight],
) {
    // Extract mesh geometries for shadow casting, filtering by cast_shadows flag
    let geometries: Vec<&dyn Geometry> = meshes
        .iter()
        .zip(mesh_cast_shadows.iter())
        .filter(|(_, &casts_shadow)| casts_shadow)
        .map(|(gm, _)| &gm.geometry as &dyn Geometry)
        .collect();

    if geometries.is_empty() {
        log::debug!("No shadow-casting meshes in scene");
        return;
    }

    log::debug!(
        "Generating shadow maps for {} shadow-casting meshes",
        geometries.len()
    );

    // Generate shadow maps for directional lights that cast shadows
    for light in directional_lights {
        if light.cast_shadow {
            light.generate_shadow_map(light.shadow_map_size, geometries.clone());
        }
    }

    // Generate shadow maps for spot lights that cast shadows
    for light in spot_lights {
        if light.cast_shadow {
            light.generate_shadow_map(light.shadow_map_size, geometries.clone());
        }
    }
}
