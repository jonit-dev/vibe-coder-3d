/// LOD (Level of Detail) Manager for Rust engine
///
/// Provides LOD quality management mirroring the TypeScript implementation:
/// - Three named quality tiers: Original, HighFidelity, LowFidelity
/// - Distance-based automatic switching with configurable thresholds
/// - Path resolution utilities for LOD variant files
/// - Global quality configuration with per-entity override support

use std::sync::{Arc, Mutex};

// Re-export LODQuality from vibe_scene
pub use vibe_scene::LODQuality;

/// Extension trait for LODQuality to add utility methods
pub trait LODQualityExt {
    /// Convert quality to suffix string for path resolution
    fn as_suffix(&self) -> &'static str;
    /// Convert suffix string to quality enum
    fn from_suffix(suffix: &str) -> Option<LODQuality>;
}

impl LODQualityExt for LODQuality {
    fn as_suffix(&self) -> &'static str {
        match self {
            LODQuality::Original => "",
            LODQuality::HighFidelity => ".high_fidelity",
            LODQuality::LowFidelity => ".low_fidelity",
        }
    }

    fn from_suffix(suffix: &str) -> Option<Self> {
        match suffix {
            "" => Some(LODQuality::Original),
            ".high_fidelity" => Some(LODQuality::HighFidelity),
            ".low_fidelity" => Some(LODQuality::LowFidelity),
            _ => None,
        }
    }
}

/// LOD configuration matching TypeScript ILODConfig
#[derive(Clone, Debug)]
pub struct LODConfig {
    /// Current global LOD quality setting
    pub quality: LODQuality,
    /// Enable automatic distance-based LOD switching
    pub auto_switch: bool,
    /// Distance thresholds: [high_threshold, low_threshold]
    /// - distance < high: Original
    /// - high <= distance < low: HighFidelity
    /// - distance >= low: LowFidelity
    pub distance_thresholds: [f32; 2],
}

impl Default for LODConfig {
    fn default() -> Self {
        Self {
            quality: LODQuality::Original,
            auto_switch: true, // Auto-switch enabled by default
            distance_thresholds: [50.0, 100.0],
        }
    }
}

/// LOD Manager - Global LOD configuration and path utilities
///
/// Thread-safe singleton-style service for managing LOD settings.
/// Mirrors TypeScript LODManagerClass behavior.
pub struct LODManager {
    config: Mutex<LODConfig>,
}

impl LODManager {
    /// Create new LOD manager with default configuration
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            config: Mutex::new(LODConfig::default()),
        })
    }

    /// Set global LOD quality
    ///
    /// NOTE: When manually setting quality, auto-switch is disabled to ensure
    /// the manual setting takes precedence (matches TypeScript behavior)
    pub fn set_quality(&self, quality: LODQuality) {
        let mut config = self.config.lock().unwrap();
        config.quality = quality;
        // Disable auto-switch when manually setting quality
        config.auto_switch = false;
    }

    /// Get current global LOD quality
    pub fn get_quality(&self) -> LODQuality {
        self.config.lock().unwrap().quality
    }

    /// Enable or disable automatic distance-based LOD switching
    pub fn set_auto_switch(&self, enabled: bool) {
        self.config.lock().unwrap().auto_switch = enabled;
    }

    /// Check if auto-switch is enabled
    pub fn is_auto_switch_enabled(&self) -> bool {
        self.config.lock().unwrap().auto_switch
    }

    /// Set distance thresholds for automatic LOD switching
    ///
    /// # Arguments
    /// * `high` - Distance below which Original quality is used
    /// * `low` - Distance above which LowFidelity quality is used
    ///
    /// Quality selection:
    /// - distance < high: Original
    /// - high <= distance < low: HighFidelity
    /// - distance >= low: LowFidelity
    pub fn set_distance_thresholds(&self, high: f32, low: f32) {
        self.config.lock().unwrap().distance_thresholds = [high, low];
    }

    /// Get current distance thresholds
    pub fn get_distance_thresholds(&self) -> [f32; 2] {
        self.config.lock().unwrap().distance_thresholds
    }

    /// Get LOD quality for a given distance (if auto-switch enabled)
    ///
    /// If auto-switch is disabled, returns current global quality.
    /// If enabled, returns quality based on distance thresholds.
    pub fn get_quality_for_distance(&self, distance: f32) -> LODQuality {
        let config = self.config.lock().unwrap();

        if !config.auto_switch {
            return config.quality;
        }

        let high = config.distance_thresholds[0];
        let low = config.distance_thresholds[1];

        if distance < high {
            LODQuality::Original
        } else if distance < low {
            LODQuality::HighFidelity
        } else {
            LODQuality::LowFidelity
        }
    }

    /// Get LOD quality for a given distance with custom thresholds
    ///
    /// Similar to get_quality_for_distance but uses provided thresholds instead of global config.
    /// This allows per-entity threshold overrides.
    ///
    /// # Arguments
    /// * `distance` - Distance from camera to entity
    /// * `thresholds` - [high, low] distance thresholds
    ///
    /// Quality selection:
    /// - distance < high: Original
    /// - high <= distance < low: HighFidelity
    /// - distance >= low: LowFidelity
    pub fn get_quality_for_distance_with_thresholds(
        &self,
        distance: f32,
        thresholds: [f32; 2],
    ) -> LODQuality {
        let high = thresholds[0];
        let low = thresholds[1];

        if distance < high {
            LODQuality::Original
        } else if distance < low {
            LODQuality::HighFidelity
        } else {
            LODQuality::LowFidelity
        }
    }

    /// Get LOD path for a base model path and quality
    ///
    /// Uses global quality if quality parameter is None.
    /// Mirrors TypeScript LODManager.getLODPath() behavior.
    pub fn get_lod_path(&self, base_path: &str, quality: Option<LODQuality>) -> String {
        let q = quality.unwrap_or_else(|| self.get_quality());
        get_lod_path_internal(base_path, q)
    }

    /// Get all LOD paths for a model
    ///
    /// Returns original, high_fidelity, and low_fidelity paths
    pub fn get_all_lod_paths(&self, base_path: &str) -> [String; 3] {
        [
            base_path.to_string(),
            get_lod_path_internal(base_path, LODQuality::HighFidelity),
            get_lod_path_internal(base_path, LODQuality::LowFidelity),
        ]
    }

    /// Get current configuration snapshot
    pub fn get_config(&self) -> LODConfig {
        self.config.lock().unwrap().clone()
    }
}

impl Default for LODManager {
    fn default() -> Self {
        Self {
            config: Mutex::new(LODConfig::default()),
        }
    }
}

/// Internal LOD path resolution function
///
/// Matches TypeScript lodUtils.getLODPath() behavior:
/// - Original quality returns path unchanged
/// - Replaces existing quality suffixes
/// - Maps /glb/ to /lod/ directory
/// - Inserts /lod/ directory if missing
/// - Adds quality suffix before file extension
///
/// # Examples
///
/// ```
/// # use vibe_engine::renderer::lod_manager::{get_lod_path_internal, LODQuality};
/// // Pattern 1: /glb/ directory
/// let path = get_lod_path_internal(
///     "/assets/models/Robot/glb/Robot.glb",
///     LODQuality::HighFidelity
/// );
/// assert_eq!(path, "/assets/models/Robot/lod/Robot.high_fidelity.glb");
///
/// // Pattern 2: No /glb/ directory
/// let path = get_lod_path_internal(
///     "/assets/models/Robot/Robot.glb",
///     LODQuality::LowFidelity
/// );
/// assert_eq!(path, "/assets/models/Robot/lod/Robot.low_fidelity.glb");
///
/// // Pattern 3: Already has quality suffix
/// let path = get_lod_path_internal(
///     "/assets/models/Robot/lod/Robot.high_fidelity.glb",
///     LODQuality::LowFidelity
/// );
/// assert_eq!(path, "/assets/models/Robot/lod/Robot.low_fidelity.glb");
/// ```
pub fn get_lod_path_internal(base_path: &str, quality: LODQuality) -> String {
    use crate::renderer::lod_manager::LODQualityExt;

    // Original quality returns path unchanged
    if matches!(quality, LODQuality::Original) {
        return base_path.to_string();
    }

    // Check if path already has a quality suffix
    let has_high = base_path.contains(".high_fidelity.");
    let has_low = base_path.contains(".low_fidelity.");

    if has_high || has_low {
        // Replace existing suffix with new quality
        // Note: quality.as_suffix() includes the leading dot, so we need to add trailing dot
        let new_suffix = format!("{}.", quality.as_suffix());
        let result = base_path
            .replace(".high_fidelity.", &new_suffix)
            .replace(".low_fidelity.", &new_suffix);

        // Handle case where quality is Original (empty suffix)
        if matches!(quality, LODQuality::Original) {
            return result.replace("..", ".");
        }

        return result;
    }

    // Determine directory structure and transform path
    let mut path = base_path.to_string();

    if path.contains("/glb/") {
        // Pattern: /models/Model/glb/Model.glb -> /models/Model/lod/Model.quality.glb
        path = path.replace("/glb/", "/lod/");
    } else if !path.contains("/lod/") {
        // Pattern: /models/Model/Model.glb -> /models/Model/lod/Model.quality.glb
        // Insert /lod/ before filename
        if let Some(last_slash_idx) = path.rfind('/') {
            let (dir, filename) = path.split_at(last_slash_idx + 1);
            path = format!("{}lod/{}", dir, filename);
        }
    }
    // If already in /lod/ directory, keep as-is

    // Add quality suffix before file extension
    if let Some(last_dot_idx) = path.rfind('.') {
        let (without_ext, ext) = path.split_at(last_dot_idx);
        format!("{}{}{}", without_ext, quality.as_suffix(), ext)
    } else {
        // No extension found, return path as-is (shouldn't happen with proper model files)
        path
    }
}

/// Normalize LOD path back to original form
///
/// Removes quality suffix and maps /lod/ back to /glb/ if present.
/// Mirrors TypeScript lodUtils.normalizeToOriginalPath()
///
/// # Examples
///
/// ```
/// # use vibe_engine::renderer::lod_manager::normalize_to_original_path;
/// let original = normalize_to_original_path(
///     "/assets/models/Robot/lod/Robot.high_fidelity.glb"
/// );
/// assert_eq!(original, "/assets/models/Robot/glb/Robot.glb");
/// ```
pub fn normalize_to_original_path(path: &str) -> String {
    // If already original (no LOD suffix), return as-is
    if !path.contains(".high_fidelity.") && !path.contains(".low_fidelity.") {
        return path.to_string();
    }

    // Remove quality suffix
    let without_quality = path
        .replace(".high_fidelity.", ".")
        .replace(".low_fidelity.", ".");

    // Replace /lod/ with /glb/ if present
    if without_quality.contains("/lod/") {
        without_quality.replace("/lod/", "/glb/")
    } else {
        without_quality
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lod_quality_suffix_conversion() {
        assert_eq!(LODQuality::Original.as_suffix(), "");
        assert_eq!(LODQuality::HighFidelity.as_suffix(), ".high_fidelity");
        assert_eq!(LODQuality::LowFidelity.as_suffix(), ".low_fidelity");

        assert_eq!(LODQuality::from_suffix(""), Some(LODQuality::Original));
        assert_eq!(
            LODQuality::from_suffix(".high_fidelity"),
            Some(LODQuality::HighFidelity)
        );
        assert_eq!(
            LODQuality::from_suffix(".low_fidelity"),
            Some(LODQuality::LowFidelity)
        );
        assert_eq!(LODQuality::from_suffix(".unknown"), None);
    }

    #[test]
    fn test_lod_manager_quality() {
        let manager = LODManager::new();

        // Default quality
        assert_eq!(manager.get_quality(), LODQuality::Original);

        // Set quality
        manager.set_quality(LODQuality::HighFidelity);
        assert_eq!(manager.get_quality(), LODQuality::HighFidelity);

        // Setting quality disables auto-switch
        manager.set_auto_switch(true);
        manager.set_quality(LODQuality::LowFidelity);
        assert!(!manager.is_auto_switch_enabled());
    }

    #[test]
    fn test_lod_manager_auto_switch() {
        let manager = LODManager::new();

        // Default auto-switch enabled (as per requirement)
        assert!(manager.is_auto_switch_enabled());

        // Disable auto-switch
        manager.set_auto_switch(false);
        assert!(!manager.is_auto_switch_enabled());

        // Re-enable auto-switch
        manager.set_auto_switch(true);
        assert!(manager.is_auto_switch_enabled());
    }

    #[test]
    fn test_lod_manager_distance_thresholds() {
        let manager = LODManager::new();

        // Default thresholds
        assert_eq!(manager.get_distance_thresholds(), [50.0, 100.0]);

        // Set custom thresholds
        manager.set_distance_thresholds(30.0, 80.0);
        assert_eq!(manager.get_distance_thresholds(), [30.0, 80.0]);
    }

    #[test]
    fn test_quality_for_distance_auto_switch_disabled() {
        let manager = LODManager::new();
        manager.set_quality(LODQuality::HighFidelity);
        manager.set_auto_switch(false);

        // Should always return global quality when auto-switch disabled
        assert_eq!(
            manager.get_quality_for_distance(0.0),
            LODQuality::HighFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(50.0),
            LODQuality::HighFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(100.0),
            LODQuality::HighFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(1000.0),
            LODQuality::HighFidelity
        );
    }

    #[test]
    fn test_quality_for_distance_auto_switch_enabled() {
        let manager = LODManager::new();
        manager.set_auto_switch(true);
        manager.set_distance_thresholds(50.0, 100.0);

        // distance < high: Original
        assert_eq!(
            manager.get_quality_for_distance(0.0),
            LODQuality::Original
        );
        assert_eq!(
            manager.get_quality_for_distance(25.0),
            LODQuality::Original
        );
        assert_eq!(
            manager.get_quality_for_distance(49.9),
            LODQuality::Original
        );

        // high <= distance < low: HighFidelity
        assert_eq!(
            manager.get_quality_for_distance(50.0),
            LODQuality::HighFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(75.0),
            LODQuality::HighFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(99.9),
            LODQuality::HighFidelity
        );

        // distance >= low: LowFidelity
        assert_eq!(
            manager.get_quality_for_distance(100.0),
            LODQuality::LowFidelity
        );
        assert_eq!(
            manager.get_quality_for_distance(200.0),
            LODQuality::LowFidelity
        );
    }

    #[test]
    fn test_get_lod_path_original_quality() {
        let path = "/assets/models/Robot/glb/Robot.glb";
        assert_eq!(
            get_lod_path_internal(path, LODQuality::Original),
            path
        );
    }

    #[test]
    fn test_get_lod_path_glb_directory() {
        // Pattern: /glb/ -> /lod/
        let base = "/assets/models/Robot/glb/Robot.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb"
        );
        assert_eq!(
            get_lod_path_internal(base, LODQuality::LowFidelity),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb"
        );
    }

    #[test]
    fn test_get_lod_path_no_glb_directory() {
        // Pattern: Insert /lod/ before filename
        let base = "/assets/models/Robot/Robot.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb"
        );
        assert_eq!(
            get_lod_path_internal(base, LODQuality::LowFidelity),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb"
        );
    }

    #[test]
    fn test_get_lod_path_already_has_suffix() {
        // Pattern: Replace existing suffix
        let base = "/assets/models/Robot/lod/Robot.high_fidelity.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::LowFidelity),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb"
        );

        let base = "/assets/models/Robot/lod/Robot.low_fidelity.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb"
        );
    }

    #[test]
    fn test_get_lod_path_multiple_dots_in_filename() {
        // Handle filenames with multiple dots
        let base = "/assets/models/my.complex.model/glb/my.complex.model.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/my.complex.model/lod/my.complex.model.high_fidelity.glb"
        );
    }

    #[test]
    fn test_get_lod_path_different_extensions() {
        // Test with .gltf extension
        let base = "/assets/models/Robot/glb/Robot.gltf";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.gltf"
        );
    }

    #[test]
    fn test_get_lod_path_already_in_lod_directory() {
        // Path already in /lod/ directory without suffix
        let base = "/assets/models/Robot/lod/Robot.glb";
        assert_eq!(
            get_lod_path_internal(base, LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb"
        );
    }

    #[test]
    fn test_normalize_to_original_path() {
        // Test normalization from LOD variants
        assert_eq!(
            normalize_to_original_path("/assets/models/Robot/lod/Robot.high_fidelity.glb"),
            "/assets/models/Robot/glb/Robot.glb"
        );
        assert_eq!(
            normalize_to_original_path("/assets/models/Robot/lod/Robot.low_fidelity.glb"),
            "/assets/models/Robot/glb/Robot.glb"
        );

        // Already original path
        assert_eq!(
            normalize_to_original_path("/assets/models/Robot/glb/Robot.glb"),
            "/assets/models/Robot/glb/Robot.glb"
        );
    }

    #[test]
    fn test_lod_manager_get_all_paths() {
        let manager = LODManager::new();
        let base = "/assets/models/Robot/glb/Robot.glb";
        let paths = manager.get_all_lod_paths(base);

        assert_eq!(paths[0], "/assets/models/Robot/glb/Robot.glb");
        assert_eq!(paths[1], "/assets/models/Robot/lod/Robot.high_fidelity.glb");
        assert_eq!(paths[2], "/assets/models/Robot/lod/Robot.low_fidelity.glb");
    }
}
