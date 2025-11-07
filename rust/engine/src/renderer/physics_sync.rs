/// Physics and script transform synchronization
///
/// Handles syncing physics body transforms and script-driven transforms
/// back to renderer meshes, supporting multi-submesh entities (e.g., GLTF models).

use glam::Vec3 as GlamVec3;
use three_d::*;
use vibe_scene::EntityId;

/// Sync physics transforms to renderer meshes
///
/// Updates mesh transforms for all entities with physics bodies.
/// Supports entities with multiple submeshes (e.g., GLTF models).
pub fn sync_physics_transforms(
    meshes: &mut [Gm<Mesh, PhysicalMaterial>],
    mesh_entity_ids: &[EntityId],
    mesh_scales: &[GlamVec3],
    physics_world: &vibe_physics::PhysicsWorld,
) {
    // Iterate through all entities with physics bodies
    for (entity_id, body_handle) in physics_world.entity_to_body.iter() {
        if let Some(body) = physics_world.rigid_bodies.get(*body_handle) {
            // A single entity (especially GLTF models) may expand to multiple submeshes,
            // so update every mesh that references this physics body.
            for (mesh_idx, &mesh_entity_id) in mesh_entity_ids.iter().enumerate() {
                if mesh_entity_id == *entity_id {
                    if let Some(mesh) = meshes.get_mut(mesh_idx) {
                        let scale = mesh_scales
                            .get(mesh_idx)
                            .copied()
                            .unwrap_or(GlamVec3::ONE);
                        let translation = body.translation();
                        // No logging for physics sync - too noisy
                        update_mesh_from_physics(mesh, body, scale);
                    }
                }
            }
        }
    }
}

/// Sync script transforms to renderer meshes
///
/// Updates mesh transforms for all entities with script-driven transforms.
/// Supports entities with multiple submeshes (e.g., GLTF models).
pub fn sync_script_transforms(
    meshes: &mut [Gm<Mesh, PhysicalMaterial>],
    mesh_entity_ids: &[EntityId],
    mesh_scales: &mut [GlamVec3],
    mesh_base_scales: &[GlamVec3],
    script_system: &vibe_scripting::ScriptSystem,
) {
    let entity_ids = script_system.entity_ids();
    log::debug!(
        "sync_script_transforms: {} entities with scripts",
        entity_ids.len()
    );
    log::debug!(
        "  Renderer has {} meshes with IDs: {:?}",
        mesh_entity_ids.len(),
        mesh_entity_ids
    );

    // Get all entity IDs that have scripts
    for entity_id in entity_ids {
        // Get the transform from the script system
        if let Some(transform) = script_system.take_transform_if_dirty(entity_id) {
            log::debug!(
                "  Script entity {}: rotation={:?}",
                entity_id,
                transform.rotation
            );

            // The entity_id from script system is now u64 (PersistentId hash)
            let entity_id_obj = EntityId::new(entity_id);
            log::debug!(
                "    Looking for EntityId({}) in renderer mesh list",
                entity_id
            );

            // Collect all mesh indices for this entity (GLTF models may have multiple submeshes)
            let matching_indices: Vec<usize> = mesh_entity_ids
                .iter()
                .enumerate()
                .filter_map(|(idx, id)| {
                    let matches = *id == entity_id_obj;
                    log::debug!(
                        "      Comparing {:?} == {:?}: {}",
                        id,
                        entity_id_obj,
                        matches
                    );
                    matches.then_some(idx)
                })
                .collect();

            if matching_indices.is_empty() {
                log::warn!(
                    "  Entity {} has script but no mesh found in renderer",
                    entity_id
                );
                continue;
            }

            for mesh_idx in matching_indices {
                log::debug!("    Updating mesh at index {}", mesh_idx);
                let base_scale = mesh_base_scales
                    .get(mesh_idx)
                    .copied()
                    .unwrap_or(GlamVec3::ONE);
                let (transform_mat, final_scale) =
                    crate::renderer::transform_utils::compose_transform_with_base_scale(
                        &transform, base_scale,
                    );

                if let Some(mesh) = meshes.get_mut(mesh_idx) {
                    mesh.set_transformation(transform_mat);
                    mesh_scales[mesh_idx] = final_scale;
                    log::debug!("    Transform applied successfully");
                }
            }
        }
    }
}

/// Update mesh transform from physics body
///
/// Converts physics body position/rotation to mesh transformation matrix
fn update_mesh_from_physics(
    mesh: &mut Gm<Mesh, PhysicalMaterial>,
    body: &rapier3d::dynamics::RigidBody,
    scale: GlamVec3,
) {
    // Get position and rotation from physics
    let iso = body.position();
    let translation = iso.translation;
    let rotation = iso.rotation;

    // Physics runs in the same coordinate system as the renderer, so we can use
    // the translation directly.
    let position = vec3(translation.x, translation.y, translation.z);

    // Convert nalgebra quaternion to glam quaternion, then to axis-angle
    let glam_quat = glam::Quat::from_xyzw(rotation.i, rotation.j, rotation.k, rotation.w);
    let (axis, angle) = glam_quat.to_axis_angle();
    let axis_3d = vec3(axis.x, axis.y, axis.z);
    let scale_vec = vec3(scale.x, scale.y, scale.z);

    // Build transformation matrix
    let transform_mat = Mat4::from_translation(position)
        * Mat4::from_axis_angle(axis_3d, radians(angle))
        * Mat4::from_nonuniform_scale(scale_vec.x, scale_vec.y, scale_vec.z);

    // Update mesh transformation
    mesh.set_transformation(transform_mat);
}
