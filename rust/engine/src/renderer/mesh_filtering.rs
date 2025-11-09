/// Mesh visibility filtering utilities
///
/// Handles filtering meshes based on visibility state and entity IDs.
use std::collections::HashMap;
use three_d::*;
use vibe_scene::EntityId;

/// Get indices of visible meshes based on visibility map
///
/// Returns all mesh indices if no visibility map provided, otherwise filters
/// based on visibility flags (only hides explicitly disabled entities).
pub fn get_visible_mesh_indices(
    mesh_count: usize,
    mesh_entity_ids: &[EntityId],
    visibility_map: Option<&HashMap<EntityId, bool>>,
) -> Vec<usize> {
    match visibility_map {
        None => (0..mesh_count).collect(),
        Some(visibility) => (0..mesh_count)
            .filter(|&idx| {
                if let Some(&entity_id) = mesh_entity_ids.get(idx) {
                    // Only hide when explicitly disabled
                    !matches!(visibility.get(&entity_id), Some(false))
                } else {
                    // If we don't know the entity, keep it visible
                    true
                }
            })
            .collect(),
    }
}

/// Get references to visible meshes based on indices
///
/// Helper to convert mesh indices to actual mesh references.
pub fn get_visible_meshes<'a>(
    meshes: &'a [Gm<Mesh, PhysicalMaterial>],
    visible_indices: &[usize],
) -> Vec<&'a Gm<Mesh, PhysicalMaterial>> {
    visible_indices
        .iter()
        .filter_map(|&idx| meshes.get(idx))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_visible_when_no_visibility_map() {
        let indices = get_visible_mesh_indices(5, &[], None);
        assert_eq!(indices, vec![0, 1, 2, 3, 4]);
    }

    #[test]
    fn test_filters_disabled_entities() {
        let entity_ids = vec![EntityId::new(1), EntityId::new(2), EntityId::new(3)];

        let mut visibility = HashMap::new();
        visibility.insert(EntityId::new(2), false); // Hide entity 2

        let indices = get_visible_mesh_indices(3, &entity_ids, Some(&visibility));
        assert_eq!(indices, vec![0, 2]); // Entity at index 1 is hidden
    }

    #[test]
    fn test_keeps_unknown_entities_visible() {
        let entity_ids = vec![EntityId::new(1)];
        let visibility = HashMap::new();

        let indices = get_visible_mesh_indices(3, &entity_ids, Some(&visibility));
        assert_eq!(indices, vec![0, 1, 2]); // All visible (no explicit false)
    }
}
