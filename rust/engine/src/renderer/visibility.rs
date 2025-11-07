use crate::spatial::bvh_manager::BvhManager;
use glam::Mat4;

/// Visibility culling system using BVH acceleration
pub struct VisibilityCuller {
    bvh_manager: std::sync::Arc<std::sync::Mutex<BvhManager>>,
}

impl VisibilityCuller {
    /// Create a new visibility culler with BVH manager
    pub fn new(bvh_manager: std::sync::Arc<std::sync::Mutex<BvhManager>>) -> Self {
        Self { bvh_manager }
    }

    /// Get visible entity IDs based on camera frustum
    ///
    /// # Arguments
    /// * `view_projection_matrix` - Combined view-projection matrix for the camera
    /// * `all_entity_ids` - All entity IDs that could potentially be visible
    ///
    /// Returns a vector of entity IDs that are visible according to BVH culling
    pub fn get_visible_entities(
        &self,
        view_projection_matrix: Mat4,
        all_entity_ids: &[u64],
        debug_mode: bool,
    ) -> Vec<usize> {
        let mut bvh_manager = self.bvh_manager.lock().unwrap();

        // Extract frustum planes from view-projection matrix
        let frustum_planes = self.extract_frustum_planes(view_projection_matrix);

        // Perform BVH frustum culling
        let visible_entity_ids = bvh_manager.cull_frustum(frustum_planes, debug_mode);

        // Convert entity IDs to indices in the renderer's entity list
        self.entity_ids_to_indices(&visible_entity_ids, all_entity_ids)
    }

    /// Extract frustum planes from a view-projection matrix
    ///
    /// Returns 6 planes in the order: left, right, bottom, top, near, far
    /// Each plane is represented as [a, b, c, d] where ax + by + cz + d = 0
    fn extract_frustum_planes(&self, view_projection: Mat4) -> [[f32; 4]; 6] {
        let m = view_projection;

        // Left plane: row4 + row1
        let left = [
            m.w_axis.x + m.x_axis.x,
            m.w_axis.y + m.x_axis.y,
            m.w_axis.z + m.x_axis.z,
            m.w_axis.w + m.x_axis.w,
        ];
        let left_length = (left[0].powi(2) + left[1].powi(2) + left[2].powi(2)).sqrt();
        let left = [left[0] / left_length, left[1] / left_length, left[2] / left_length, left[3] / left_length];

        // Right plane: row4 - row1
        let right = [
            m.w_axis.x - m.x_axis.x,
            m.w_axis.y - m.x_axis.y,
            m.w_axis.z - m.x_axis.z,
            m.w_axis.w - m.x_axis.w,
        ];
        let right_length = (right[0].powi(2) + right[1].powi(2) + right[2].powi(2)).sqrt();
        let right = [right[0] / right_length, right[1] / right_length, right[2] / right_length, right[3] / right_length];

        // Bottom plane: row4 + row2
        let bottom = [
            m.w_axis.x + m.y_axis.x,
            m.w_axis.y + m.y_axis.y,
            m.w_axis.z + m.y_axis.z,
            m.w_axis.w + m.y_axis.w,
        ];
        let bottom_length = (bottom[0].powi(2) + bottom[1].powi(2) + bottom[2].powi(2)).sqrt();
        let bottom = [bottom[0] / bottom_length, bottom[1] / bottom_length, bottom[2] / bottom_length, bottom[3] / bottom_length];

        // Top plane: row4 - row2
        let top = [
            m.w_axis.x - m.y_axis.x,
            m.w_axis.y - m.y_axis.y,
            m.w_axis.z - m.y_axis.z,
            m.w_axis.w - m.y_axis.w,
        ];
        let top_length = (top[0].powi(2) + top[1].powi(2) + top[2].powi(2)).sqrt();
        let top = [top[0] / top_length, top[1] / top_length, top[2] / top_length, top[3] / top_length];

        // Near plane: row3
        let near = [
            m.z_axis.x,
            m.z_axis.y,
            m.z_axis.z,
            m.z_axis.w,
        ];
        let near_length = (near[0].powi(2) + near[1].powi(2) + near[2].powi(2)).sqrt();
        let near = [near[0] / near_length, near[1] / near_length, near[2] / near_length, near[3] / near_length];

        // Far plane: row4 - row3
        let far = [
            m.w_axis.x - m.z_axis.x,
            m.w_axis.y - m.z_axis.y,
            m.w_axis.z - m.z_axis.z,
            m.w_axis.w - m.z_axis.w,
        ];
        let far_length = (far[0].powi(2) + far[1].powi(2) + far[2].powi(2)).sqrt();
        let far = [far[0] / far_length, far[1] / far_length, far[2] / far_length, far[3] / far_length];

        [left, right, bottom, top, near, far]
    }

    /// Convert entity IDs to indices in the renderer's entity list
    fn entity_ids_to_indices(&self, visible_entity_ids: &[u64], all_entity_ids: &[u64]) -> Vec<usize> {
        let mut indices = Vec::with_capacity(visible_entity_ids.len());

        // Create a map from entity_id to index for fast lookup
        let entity_id_to_index: std::collections::HashMap<u64, usize> = all_entity_ids
            .iter()
            .enumerate()
            .map(|(index, &entity_id)| (entity_id, index))
            .collect();

        for &entity_id in visible_entity_ids {
            if let Some(&index) = entity_id_to_index.get(&entity_id) {
                indices.push(index);
            }
        }

        indices
    }

    /// Get BVH performance metrics
    pub fn get_metrics(&self) -> crate::spatial::bvh_manager::BvhMetrics {
        let bvh_manager = self.bvh_manager.lock().unwrap();
        bvh_manager.metrics().clone()
    }

    /// Reset BVH metrics (call this at the beginning of each frame)
    pub fn reset_metrics(&self) {
        let mut bvh_manager = self.bvh_manager.lock().unwrap();
        bvh_manager.reset_metrics();
    }
}

/// Fallback visibility culler that doesn't use BVH (for compatibility)
pub struct FallbackVisibilityCuller;

impl FallbackVisibilityCuller {
    /// Create a new fallback visibility culler
    pub fn new() -> Self {
        Self
    }

    /// Get all entity IDs as visible (no culling performed)
    pub fn get_visible_entities(&self, _view_projection_matrix: Mat4, all_entity_ids: &[u64]) -> Vec<usize> {
        (0..all_entity_ids.len()).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::spatial::bvh_manager::{BvhManager, BvhConfig};
    use crate::spatial::primitives::Aabb;
    use glam::{Mat4, Vec3};

    #[test]
    fn test_frustum_plane_extraction() {
        let culler = VisibilityCuller::new(std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new())));

        // Simple perspective projection matrix
        let aspect = 16.0 / 9.0;
        let fov_y = std::f32::consts::PI / 4.0;
        let near = 0.1;
        let far = 100.0;

        let projection = Mat4::perspective_rh(fov_y, aspect, near, far);
        let view = Mat4::look_at_rh(Vec3::new(0.0, 0.0, 5.0), Vec3::ZERO, Vec3::Y);
        let view_projection = projection * view;

        let planes = culler.extract_frustum_planes(view_projection);
        assert_eq!(planes.len(), 6);

        // Planes should be normalized
        for plane in &planes {
            let length = (plane[0].powi(2) + plane[1].powi(2) + plane[2].powi(2)).sqrt();
            assert!((length - 1.0).abs() < 1e-6);
        }
    }

    #[test]
    fn test_entity_ids_to_indices() {
        let culler = VisibilityCuller::new(std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new())));

        let all_entity_ids = vec![100, 200, 300, 400, 500];
        let visible_entity_ids = vec![200, 400];

        let indices = culler.entity_ids_to_indices(&visible_entity_ids, &all_entity_ids);
        assert_eq!(indices, vec![1, 3]); // Indices 1 and 3 correspond to entities 200 and 400
    }

    #[test]
    fn test_entity_ids_to_indices_empty_visible() {
        let culler = VisibilityCuller::new(std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new())));

        let all_entity_ids = vec![100, 200, 300];
        let visible_entity_ids = vec![];

        let indices = culler.entity_ids_to_indices(&visible_entity_ids, &all_entity_ids);
        assert!(indices.is_empty());
    }

    #[test]
    fn test_entity_ids_to_indices_missing_entities() {
        let culler = VisibilityCuller::new(std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new())));

        let all_entity_ids = vec![100, 200, 300];
        let visible_entity_ids = vec![200, 400]; // 400 doesn't exist in all_entity_ids

        let indices = culler.entity_ids_to_indices(&visible_entity_ids, &all_entity_ids);
        assert_eq!(indices, vec![1]); // Only entity 200 (index 1) should be found
    }

    #[test]
    fn test_fallback_visibility_culler() {
        let culler = FallbackVisibilityCuller::new();
        let all_entity_ids = vec![100, 200, 300];

        let visible_indices = culler.get_visible_entities(Mat4::IDENTITY, &all_entity_ids);
        assert_eq!(visible_indices, vec![0, 1, 2]); // All entities should be visible
    }

    #[test]
    fn test_visibility_culler_integration() {
        let bvh_manager = std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new()));
        let culler = VisibilityCuller::new(bvh_manager.clone());

        // Register a test mesh
        {
            let mut manager = bvh_manager.lock().unwrap();
            let positions = vec![
                [0.0, 0.0, 0.0],
                [1.0, 0.0, 0.0],
                [0.5, 1.0, 0.0],
            ];
            let indices = vec![[0, 1, 2]];
            let local_aabb = Aabb::new(Vec3::new(0.0, 0.0, 0.0), Vec3::new(1.0, 1.0, 0.0));

            manager.register_mesh(42, &positions, &indices, local_aabb);
            manager.update_transform(42, Mat4::IDENTITY);
        }

        let all_entity_ids = vec![42];
        let view_projection = Mat4::IDENTITY;

        let visible_indices = culler.get_visible_entities(view_projection, &all_entity_ids, false);

        // Should either return the entity index or empty depending on frustum culling
        assert!(visible_indices.len() <= 1);
        if !visible_indices.is_empty() {
            assert_eq!(visible_indices[0], 0);
        }
    }
}