/// Lighting and shadow management utilities
///
/// Handles light collection and shadow map generation for the rendering pipeline.

use three_d::*;

use super::{EnhancedDirectionalLight, EnhancedSpotLight};

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
