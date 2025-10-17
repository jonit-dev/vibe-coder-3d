//! Draw order sorting - buckets and sorts opaque vs transparent draws.
//!
//! This module handles alpha-based categorization and distance-based sorting for transparency.

use super::super::material_uniform::ALPHA_MODE_BLEND;
use super::super::scene_renderer::RenderableEntity;
use glam::Vec3;

/// Alpha category for draw sorting
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum AlphaCategory {
    Opaque,
    Transparent,
}

/// Draw order sorter
pub struct DrawSorter;

impl DrawSorter {
    /// Bucket and sort entities into opaque and transparent lists (pure function)
    ///
    /// Returns (opaque_indices, transparent_draws) where transparent_draws is sorted back-to-front
    pub fn bucket_and_sort(
        alpha_modes: &[u32],
        entities: &[RenderableEntity],
        camera_pos: Vec3,
    ) -> (Vec<usize>, Vec<(usize, f32)>) {
        let mut opaque_indices: Vec<usize> = Vec::new();
        let mut transparent_draws: Vec<(usize, f32)> = Vec::new();

        for (i, alpha_mode) in alpha_modes.iter().enumerate() {
            if *alpha_mode == ALPHA_MODE_BLEND {
                let position = entities[i].transform.w_axis.truncate();
                let distance = (camera_pos - position).length();
                transparent_draws.push((i, distance));
            } else {
                opaque_indices.push(i);
            }
        }

        // Sort transparent draws back-to-front (farthest first)
        transparent_draws
            .sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        (opaque_indices, transparent_draws)
    }

    /// Categorize alpha mode (pure function)
    pub fn categorize_alpha(alpha_mode: u32) -> AlphaCategory {
        if alpha_mode == ALPHA_MODE_BLEND {
            AlphaCategory::Transparent
        } else {
            AlphaCategory::Opaque
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use glam::Mat4;

    const ALPHA_MODE_OPAQUE: u32 = 0;
    const ALPHA_MODE_MASK: u32 = 1;

    #[test]
    fn test_categorize_alpha_opaque() {
        assert_eq!(
            DrawSorter::categorize_alpha(ALPHA_MODE_OPAQUE),
            AlphaCategory::Opaque
        );
    }

    #[test]
    fn test_categorize_alpha_mask() {
        assert_eq!(
            DrawSorter::categorize_alpha(ALPHA_MODE_MASK),
            AlphaCategory::Opaque
        );
    }

    #[test]
    fn test_categorize_alpha_blend() {
        assert_eq!(
            DrawSorter::categorize_alpha(ALPHA_MODE_BLEND),
            AlphaCategory::Transparent
        );
    }

    #[test]
    fn test_bucket_and_sort_all_opaque() {
        let alpha_modes = vec![ALPHA_MODE_OPAQUE, ALPHA_MODE_MASK, ALPHA_MODE_OPAQUE];
        let entities = vec![
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 0.0)),
                mesh_id: "cube".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(1.0, 0.0, 0.0)),
                mesh_id: "sphere".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(2.0, 0.0, 0.0)),
                mesh_id: "plane".to_string(),
                material_id: None,
                texture_override: None,
            },
        ];
        let camera_pos = Vec3::ZERO;

        let (opaque, transparent) = DrawSorter::bucket_and_sort(&alpha_modes, &entities, camera_pos);

        assert_eq!(opaque.len(), 3);
        assert_eq!(transparent.len(), 0);
        assert_eq!(opaque, vec![0, 1, 2]);
    }

    #[test]
    fn test_bucket_and_sort_all_transparent() {
        let alpha_modes = vec![ALPHA_MODE_BLEND, ALPHA_MODE_BLEND, ALPHA_MODE_BLEND];
        let entities = vec![
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 0.0)),
                mesh_id: "cube".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 5.0)),
                mesh_id: "sphere".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 10.0)),
                mesh_id: "plane".to_string(),
                material_id: None,
                texture_override: None,
            },
        ];
        let camera_pos = Vec3::ZERO;

        let (opaque, transparent) = DrawSorter::bucket_and_sort(&alpha_modes, &entities, camera_pos);

        assert_eq!(opaque.len(), 0);
        assert_eq!(transparent.len(), 3);

        // Should be sorted back-to-front (farthest first)
        assert_eq!(transparent[0].0, 2); // z=10.0
        assert_eq!(transparent[1].0, 1); // z=5.0
        assert_eq!(transparent[2].0, 0); // z=0.0
    }

    #[test]
    fn test_bucket_and_sort_mixed() {
        let alpha_modes = vec![
            ALPHA_MODE_OPAQUE,
            ALPHA_MODE_BLEND,
            ALPHA_MODE_MASK,
            ALPHA_MODE_BLEND,
        ];
        let entities = vec![
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 0.0)),
                mesh_id: "cube1".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 5.0)),
                mesh_id: "glass1".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 2.0)),
                mesh_id: "cube2".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 10.0)),
                mesh_id: "glass2".to_string(),
                material_id: None,
                texture_override: None,
            },
        ];
        let camera_pos = Vec3::ZERO;

        let (opaque, transparent) = DrawSorter::bucket_and_sort(&alpha_modes, &entities, camera_pos);

        assert_eq!(opaque.len(), 2);
        assert_eq!(transparent.len(), 2);
        assert_eq!(opaque, vec![0, 2]); // Indices 0 and 2 are opaque

        // Transparent should be sorted back-to-front
        assert_eq!(transparent[0].0, 3); // z=10.0
        assert_eq!(transparent[1].0, 1); // z=5.0
    }

    #[test]
    fn test_bucket_and_sort_empty() {
        let alpha_modes = vec![];
        let entities = vec![];
        let camera_pos = Vec3::ZERO;

        let (opaque, transparent) = DrawSorter::bucket_and_sort(&alpha_modes, &entities, camera_pos);

        assert_eq!(opaque.len(), 0);
        assert_eq!(transparent.len(), 0);
    }
}
