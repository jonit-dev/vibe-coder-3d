/// Material update utilities for runtime material modifications
///
/// Handles updating material properties (color, metalness, roughness, emissive)
/// for entities at runtime, typically driven by script API calls.

use three_d::*;
use vibe_scene::EntityId;

/// Update entity material properties from JSON data
///
/// Finds all meshes belonging to the entity and applies material property updates.
/// Supports: albedo color, metalness, roughness, emissive color, emissive intensity.
pub fn update_entity_material(
    meshes: &mut [Gm<Mesh, PhysicalMaterial>],
    mesh_entity_ids: &[EntityId],
    entity_id: EntityId,
    data: &serde_json::Value,
) {
    use three_d::Srgba;

    log::debug!("update_entity_material called for entity {:?}", entity_id);

    // Find all mesh indices for this entity
    let matching_indices: Vec<usize> = mesh_entity_ids
        .iter()
        .enumerate()
        .filter_map(|(idx, id)| if *id == entity_id { Some(idx) } else { None })
        .collect();

    if matching_indices.is_empty() {
        log::warn!("Entity {:?} has no meshes to update", entity_id);
        return;
    }

    log::debug!(
        "Found {} meshes for entity {:?}",
        matching_indices.len(),
        entity_id
    );

    // Extract material changes from the data
    if let Some(material_obj) = data.get("material").and_then(|v| v.as_object()) {
        for mesh_idx in matching_indices {
            if let Some(mesh) = meshes.get_mut(mesh_idx) {
                // Access material directly (PhysicalMaterial is the second type parameter)
                let material = &mut mesh.material;

                // Update color if present
                if let Some(color_str) = material_obj.get("color").and_then(|v| v.as_str()) {
                    if let Some(color) =
                        crate::renderer::material_manager::parse_hex_color(color_str)
                    {
                        material.albedo = color;
                        log::info!("Updated mesh {} material color to {}", mesh_idx, color_str);
                    }
                }

                // Update metalness if present
                if let Some(metalness) = material_obj.get("metalness").and_then(|v| v.as_f64()) {
                    material.metallic = metalness as f32;
                    log::debug!("Updated mesh {} metalness to {}", mesh_idx, metalness);
                }

                // Update roughness if present
                if let Some(roughness) = material_obj.get("roughness").and_then(|v| v.as_f64()) {
                    material.roughness = roughness as f32;
                    log::debug!("Updated mesh {} roughness to {}", mesh_idx, roughness);
                }

                // Update emissive if present
                if let Some(emissive_str) = material_obj.get("emissive").and_then(|v| v.as_str()) {
                    if let Some(emissive_color) =
                        crate::renderer::material_manager::parse_hex_color(emissive_str)
                    {
                        material.emissive = emissive_color;
                        log::debug!("Updated mesh {} emissive to {}", mesh_idx, emissive_str);
                    }
                }

                // Update emissive intensity if present
                if let Some(intensity) = material_obj
                    .get("emissiveIntensity")
                    .and_then(|v| v.as_f64())
                {
                    let intensity = intensity.max(0.0) as f32;
                    let emissive = material.emissive;
                    let scale = |channel: u8| ((channel as f32 * intensity).clamp(0.0, 255.0)) as u8;
                    material.emissive = Srgba::new(
                        scale(emissive.r),
                        scale(emissive.g),
                        scale(emissive.b),
                        emissive.a,
                    );
                    log::debug!(
                        "Updated mesh {} emissive intensity factor to {}",
                        mesh_idx,
                        intensity
                    );
                }
            }
        }
    }
}
