use crate::spatial::bvh_manager::{BvhManager, BvhStatistics};
use log::info;

/// BVH debug logger for displaying metrics and statistics via logging
pub struct BvhDebugLogger {
    enabled: bool,
    log_interval_seconds: f32,
    time_since_last_log: f32,
}

impl BvhDebugLogger {
    /// Create a new BVH debug logger
    pub fn new(log_interval_seconds: f32) -> Self {
        Self {
            enabled: true,
            log_interval_seconds,
            time_since_last_log: 0.0,
        }
    }

    /// Enable or disable BVH debug logging
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    /// Check if debug logging is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Update the logger and log statistics if interval has passed
    pub fn update(&mut self, delta_time: f32, bvh_manager: &BvhManager) {
        if !self.enabled {
            return;
        }

        self.time_since_last_log += delta_time;

        if self.time_since_last_log >= self.log_interval_seconds {
            self.log_statistics(bvh_manager);
            self.time_since_last_log = 0.0;
        }
    }

    /// Log BVH statistics
    pub fn log_statistics(&self, bvh_manager: &BvhManager) {
        let stats = bvh_manager.get_statistics();
        let metrics = &stats.metrics;

        info!("=== BVH System Statistics ===");
        info!("Mesh BVHs: {} | Total Triangles: {} | Scene Refs: {}",
              stats.mesh_bvh_count, stats.total_triangles, stats.metrics.total_scene_refs);

        if metrics.mesh_build_time_ms > 0.0 || metrics.scene_build_time_ms > 0.0 {
            info!("Build Times - Mesh: {:.3}ms | Scene: {:.3}ms | Refit: {:.3}ms",
                  metrics.mesh_build_time_ms, metrics.scene_build_time_ms, metrics.refit_time_ms);
        }

        if metrics.visible_meshes_last_frame > 0 || metrics.culled_meshes_last_frame > 0 {
            let efficiency = if stats.metrics.total_scene_refs > 0 {
                (metrics.visible_meshes_last_frame as f32 / stats.metrics.total_scene_refs as f32) * 100.0
            } else {
                0.0
            };
            info!("Last Frame - Visible: {} | Culled: {} | Efficiency: {:.1}%",
                  metrics.visible_meshes_last_frame, metrics.culled_meshes_last_frame, efficiency);
        }

        if metrics.raycasts_last_frame > 0 {
            info!("Raycasts: {} | Ray-Triangle Tests: {}",
                  metrics.raycasts_last_frame, metrics.ray_triangle_tests_last_frame);
        }

        info!("Scene BVH - Nodes: {} | Internal: {} | Leaves: {} | Max Depth: {}",
              stats.scene_bvh_stats.node_count,
              stats.scene_bvh_stats.internal_node_count,
              stats.scene_bvh_stats.leaf_node_count,
              stats.scene_bvh_stats.max_depth);

        info!("Scene BVH - Refs per Leaf: {} to {}",
              stats.scene_bvh_stats.min_refs_per_leaf,
              stats.scene_bvh_stats.max_refs_per_leaf);

        info!("==============================");
    }

    /// Log a summary of BVH configuration
    pub fn log_configuration(&self, bvh_manager: &BvhManager) {
        let config = bvh_manager.config();
        info!("BVH Configuration:");
        info!("  - Culling Enabled: {}", config.enable_bvh_culling);
        info!("  - Raycasting Enabled: {}", config.enable_bvh_raycasts);
        info!("  - Max Leaf Triangles: {}", config.max_leaf_triangles);
        info!("  - Max Leaf Refs: {}", config.max_leaf_refs);
        info!("  - Mesh Split Strategy: {:?}", config.mesh_split_strategy);
        info!("  - Incremental Updates: {}", config.enable_incremental_updates);
    }

    /// Force immediate logging of statistics
    pub fn log_now(&self, bvh_manager: &BvhManager) {
        if self.enabled {
            self.log_statistics(bvh_manager);
        }
    }
}

impl Default for BvhDebugLogger {
    fn default() -> Self {
        Self::new(5.0) // Log every 5 seconds by default
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_debug_logger_creation() {
        let logger = BvhDebugLogger::new(1.0);
        assert!(logger.is_enabled());
        assert_eq!(logger.log_interval_seconds, 1.0);
    }

    #[test]
    fn test_debug_logger_enable_disable() {
        let mut logger = BvhDebugLogger::new(1.0);
        assert!(logger.is_enabled());

        logger.set_enabled(false);
        assert!(!logger.is_enabled());

        logger.set_enabled(true);
        assert!(logger.is_enabled());
    }

    #[test]
    fn test_debug_logger_default() {
        let logger = BvhDebugLogger::default();
        assert!(logger.is_enabled());
        assert_eq!(logger.log_interval_seconds, 5.0);
    }

    #[test]
    fn test_debug_logger_update_timing() {
        let mut logger = BvhDebugLogger::new(1.0);

        // Mock BVH manager for testing
        let bvh_manager = BvhManager::new();

        // Update with small delta time (should not log yet)
        logger.update(0.5, &bvh_manager);
        // Can't easily test logging without capturing logs

        // Update past the interval (should log)
        logger.update(0.6, &bvh_manager);
        // Can't easily test logging without capturing logs
    }
}