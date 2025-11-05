/// LOD Selector - Runtime per-frame LOD quality selection
///
/// Handles distance-based LOD quality computation and entity LOD updates.
/// Integrates with LODManager for global config and path resolution.

use super::lod_manager::{get_lod_path_internal, LODManager, LODQuality};
use glam::Vec3 as GlamVec3;
use std::sync::Arc;

/// LOD Selector for runtime quality selection
///
/// Computes appropriate LOD quality based on camera-entity distance
/// and global/per-entity LOD configuration.
pub struct LODSelector {
    pub manager: Arc<LODManager>,
}

impl LODSelector {
    /// Create new LOD selector with given manager
    pub fn new(manager: Arc<LODManager>) -> Self {
        Self { manager }
    }

    /// Update entity LOD quality based on camera distance
    ///
    /// Returns the target quality and resolved LOD path.
    ///
    /// # Arguments
    /// * `camera_pos` - Camera position in world space
    /// * `entity_pos` - Entity position in world space
    /// * `base_path` - Original model path (will be normalized if needed)
    /// * `override_quality` - Per-entity quality override (optional)
    /// * `override_thresholds` - Per-entity distance thresholds (optional)
    ///
    /// # Returns
    /// Tuple of (target_quality, lod_path)
    ///
    /// # Logic
    /// 1. If override_quality provided, use it directly
    /// 2. Otherwise, compute distance and get quality from manager
    /// 3. Resolve LOD path for the target quality
    pub fn update_entity_quality(
        &self,
        camera_pos: GlamVec3,
        entity_pos: GlamVec3,
        base_path: &str,
        override_quality: Option<LODQuality>,
        override_thresholds: Option<[f32; 2]>,
    ) -> (LODQuality, String) {
        // If override quality provided, use it directly
        if let Some(quality) = override_quality {
            let path = get_lod_path_internal(base_path, quality);
            return (quality, path);
        }

        // Compute distance (clamp negative to 0)
        let distance = camera_pos.distance(entity_pos).max(0.0);

        // Get target quality based on distance and thresholds
        let target = if let Some([high, low]) = override_thresholds {
            // Use per-entity thresholds
            self.compute_quality_for_distance(distance, high, low)
        } else {
            // Use global manager settings
            self.manager.get_quality_for_distance(distance)
        };

        let path = get_lod_path_internal(base_path, target);
        (target, path)
    }

    /// Compute quality for distance with given thresholds
    ///
    /// This is a helper for per-entity threshold overrides.
    fn compute_quality_for_distance(&self, distance: f32, high: f32, low: f32) -> LODQuality {
        if distance < high {
            LODQuality::Original
        } else if distance < low {
            LODQuality::HighFidelity
        } else {
            LODQuality::LowFidelity
        }
    }

    /// Batch update multiple entities
    ///
    /// Returns Vec of (entity_index, target_quality, lod_path) for entities that need updates.
    /// Useful for efficient batch processing in render loop.
    pub fn batch_update_entities(
        &self,
        camera_pos: GlamVec3,
        entities: &[(GlamVec3, String, Option<LODQuality>, Option<[f32; 2]>)],
    ) -> Vec<(usize, LODQuality, String)> {
        entities
            .iter()
            .enumerate()
            .map(|(idx, (entity_pos, base_path, override_quality, override_thresholds))| {
                let (quality, path) = self.update_entity_quality(
                    camera_pos,
                    *entity_pos,
                    base_path,
                    *override_quality,
                    *override_thresholds,
                );
                (idx, quality, path)
            })
            .collect()
    }

    /// Check if quality should change for an entity
    ///
    /// Returns true if the new quality differs from current quality.
    pub fn should_update_quality(
        &self,
        current_quality: LODQuality,
        camera_pos: GlamVec3,
        entity_pos: GlamVec3,
        override_quality: Option<LODQuality>,
        override_thresholds: Option<[f32; 2]>,
    ) -> bool {
        // If override quality provided, check if it differs
        if let Some(quality) = override_quality {
            return quality != current_quality;
        }

        // Compute distance and target quality
        let distance = camera_pos.distance(entity_pos).max(0.0);
        let target = if let Some([high, low]) = override_thresholds {
            self.compute_quality_for_distance(distance, high, low)
        } else {
            self.manager.get_quality_for_distance(distance)
        };

        target != current_quality
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lod_selector_override_quality() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);
        let entity_pos = GlamVec3::new(150.0, 0.0, 0.0); // Far away

        // Override should take precedence regardless of distance
        let (quality, path) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            Some(LODQuality::Original),
            None,
        );

        assert_eq!(quality, LODQuality::Original);
        assert_eq!(path, "/assets/models/Robot/glb/Robot.glb");
    }

    #[test]
    fn test_lod_selector_distance_based() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);

        // Close distance: Original
        let entity_pos = GlamVec3::new(25.0, 0.0, 0.0);
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::Original);

        // Medium distance: HighFidelity
        let entity_pos = GlamVec3::new(75.0, 0.0, 0.0);
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::HighFidelity);

        // Far distance: LowFidelity
        let entity_pos = GlamVec3::new(150.0, 0.0, 0.0);
        let (quality, path) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::LowFidelity);
        assert_eq!(path, "/assets/models/Robot/lod/Robot.low_fidelity.glb");
    }

    #[test]
    fn test_lod_selector_per_entity_thresholds() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);
        let entity_pos = GlamVec3::new(60.0, 0.0, 0.0);

        // With global thresholds: HighFidelity (50 < 60 < 100)
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::HighFidelity);

        // With per-entity thresholds [30, 70]: LowFidelity (60 >= 70? no, 60 >= 30 and < 70)
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            Some([30.0, 70.0]),
        );
        assert_eq!(quality, LODQuality::HighFidelity);

        // With per-entity thresholds [30, 50]: LowFidelity (60 >= 50)
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            Some([30.0, 50.0]),
        );
        assert_eq!(quality, LODQuality::LowFidelity);
    }

    #[test]
    fn test_lod_selector_auto_switch_disabled() {
        let manager = LODManager::new();
        manager.set_quality(LODQuality::LowFidelity);
        manager.set_auto_switch(false);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);
        let entity_pos = GlamVec3::new(10.0, 0.0, 0.0); // Very close

        // Should use global quality regardless of distance
        let (quality, path) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::LowFidelity);
        assert_eq!(path, "/assets/models/Robot/lod/Robot.low_fidelity.glb");
    }

    #[test]
    fn test_lod_selector_negative_distance() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(100.0, 0.0, 0.0);
        let entity_pos = GlamVec3::new(100.0, 0.0, 0.0); // Same position

        // Distance should be clamped to 0
        let (quality, _) = selector.update_entity_quality(
            camera_pos,
            entity_pos,
            "/assets/models/Robot/glb/Robot.glb",
            None,
            None,
        );
        assert_eq!(quality, LODQuality::Original); // < 50
    }

    #[test]
    fn test_should_update_quality() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);

        // Current: Original, Distance: 25 -> Original (no update)
        let entity_pos = GlamVec3::new(25.0, 0.0, 0.0);
        assert!(!selector.should_update_quality(
            LODQuality::Original,
            camera_pos,
            entity_pos,
            None,
            None
        ));

        // Current: Original, Distance: 75 -> HighFidelity (update needed)
        let entity_pos = GlamVec3::new(75.0, 0.0, 0.0);
        assert!(selector.should_update_quality(
            LODQuality::Original,
            camera_pos,
            entity_pos,
            None,
            None
        ));

        // Current: HighFidelity, Override: Original (update needed)
        assert!(selector.should_update_quality(
            LODQuality::HighFidelity,
            camera_pos,
            entity_pos,
            Some(LODQuality::Original),
            None
        ));
    }

    #[test]
    fn test_batch_update_entities() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        let selector = LODSelector::new(manager);
        let camera_pos = GlamVec3::new(0.0, 0.0, 0.0);

        let entities = vec![
            (
                GlamVec3::new(25.0, 0.0, 0.0),
                "/assets/models/A/glb/A.glb".to_string(),
                None,
                None,
            ),
            (
                GlamVec3::new(75.0, 0.0, 0.0),
                "/assets/models/B/glb/B.glb".to_string(),
                None,
                None,
            ),
            (
                GlamVec3::new(150.0, 0.0, 0.0),
                "/assets/models/C/glb/C.glb".to_string(),
                None,
                None,
            ),
        ];

        let results = selector.batch_update_entities(camera_pos, &entities);

        assert_eq!(results.len(), 3);
        assert_eq!(results[0].1, LODQuality::Original);
        assert_eq!(results[1].1, LODQuality::HighFidelity);
        assert_eq!(results[2].1, LODQuality::LowFidelity);
    }
}
