/// LOD Component - Per-entity LOD metadata and overrides
///
/// Defines LOD behavior for individual entities, including:
/// - Original and variant paths
/// - Per-entity distance thresholds
/// - Per-entity quality overrides

use serde::{Deserialize, Serialize};

/// LOD quality variants (re-exported from renderer for convenience in scene models)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum LODQuality {
    /// Base optimized model (default)
    Original,
    /// 75% quality variant with minimal visual degradation
    HighFidelity,
    /// 35% quality variant for maximum performance
    LowFidelity,
}

impl Default for LODQuality {
    fn default() -> Self {
        Self::Original
    }
}

/// LOD Component for per-entity LOD configuration
///
/// Attached to entities that use LOD variants. Provides:
/// - Explicit paths to LOD variants (optional, can be computed)
/// - Per-entity distance thresholds (overrides global settings)
/// - Per-entity quality override (forces specific quality)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LODComponent {
    /// Original model path (base path for LOD resolution)
    #[serde(rename = "originalPath")]
    pub original_path: String,

    /// Explicit high fidelity variant path (optional, computed if missing)
    #[serde(
        rename = "highFidelityPath",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub high_fidelity_path: Option<String>,

    /// Explicit low fidelity variant path (optional, computed if missing)
    #[serde(
        rename = "lowFidelityPath",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub low_fidelity_path: Option<String>,

    /// Per-entity distance thresholds [high, low] (overrides global)
    #[serde(
        rename = "distanceThresholds",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub distance_thresholds: Option<[f32; 2]>,

    /// Per-entity quality override (forces specific quality regardless of distance)
    #[serde(
        rename = "overrideQuality",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub override_quality: Option<LODQuality>,

    /// Current active quality (runtime state, not serialized from JSON typically)
    #[serde(
        rename = "currentQuality",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub current_quality: Option<LODQuality>,
}

impl LODComponent {
    /// Create new LOD component with original path
    pub fn new(original_path: String) -> Self {
        Self {
            original_path,
            high_fidelity_path: None,
            low_fidelity_path: None,
            distance_thresholds: None,
            override_quality: None,
            current_quality: None,
        }
    }

    /// Create LOD component with explicit variant paths
    pub fn with_paths(
        original_path: String,
        high_fidelity_path: String,
        low_fidelity_path: String,
    ) -> Self {
        Self {
            original_path,
            high_fidelity_path: Some(high_fidelity_path),
            low_fidelity_path: Some(low_fidelity_path),
            distance_thresholds: None,
            override_quality: None,
            current_quality: None,
        }
    }

    /// Set per-entity distance thresholds
    pub fn with_thresholds(mut self, high: f32, low: f32) -> Self {
        self.distance_thresholds = Some([high, low]);
        self
    }

    /// Set per-entity quality override
    pub fn with_override_quality(mut self, quality: LODQuality) -> Self {
        self.override_quality = Some(quality);
        self
    }

    /// Get the appropriate path for a given quality
    ///
    /// Returns explicit path if available, otherwise returns original_path
    /// (caller should use LODManager to compute variant paths)
    pub fn get_path_for_quality(&self, quality: LODQuality) -> &str {
        match quality {
            LODQuality::Original => &self.original_path,
            LODQuality::HighFidelity => self
                .high_fidelity_path
                .as_deref()
                .unwrap_or(&self.original_path),
            LODQuality::LowFidelity => self
                .low_fidelity_path
                .as_deref()
                .unwrap_or(&self.original_path),
        }
    }

    /// Update current quality (for runtime tracking)
    pub fn set_current_quality(&mut self, quality: LODQuality) {
        self.current_quality = Some(quality);
    }

    /// Check if quality has changed
    pub fn has_quality_changed(&self, new_quality: LODQuality) -> bool {
        self.current_quality.map_or(true, |current| current != new_quality)
    }
}

impl Default for LODComponent {
    fn default() -> Self {
        Self::new(String::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lod_component_creation() {
        let component = LODComponent::new("/assets/models/Robot/glb/Robot.glb".to_string());
        assert_eq!(component.original_path, "/assets/models/Robot/glb/Robot.glb");
        assert!(component.high_fidelity_path.is_none());
        assert!(component.low_fidelity_path.is_none());
        assert!(component.distance_thresholds.is_none());
        assert!(component.override_quality.is_none());
    }

    #[test]
    fn test_lod_component_with_paths() {
        let component = LODComponent::with_paths(
            "/assets/models/Robot/glb/Robot.glb".to_string(),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb".to_string(),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb".to_string(),
        );
        assert_eq!(component.original_path, "/assets/models/Robot/glb/Robot.glb");
        assert_eq!(
            component.high_fidelity_path.as_deref(),
            Some("/assets/models/Robot/lod/Robot.high_fidelity.glb")
        );
        assert_eq!(
            component.low_fidelity_path.as_deref(),
            Some("/assets/models/Robot/lod/Robot.low_fidelity.glb")
        );
    }

    #[test]
    fn test_lod_component_builder_pattern() {
        let component = LODComponent::new("/assets/models/Robot/glb/Robot.glb".to_string())
            .with_thresholds(30.0, 80.0)
            .with_override_quality(LODQuality::HighFidelity);

        assert_eq!(component.distance_thresholds, Some([30.0, 80.0]));
        assert_eq!(component.override_quality, Some(LODQuality::HighFidelity));
    }

    #[test]
    fn test_get_path_for_quality() {
        let component = LODComponent::with_paths(
            "/assets/models/Robot/glb/Robot.glb".to_string(),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb".to_string(),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb".to_string(),
        );

        assert_eq!(
            component.get_path_for_quality(LODQuality::Original),
            "/assets/models/Robot/glb/Robot.glb"
        );
        assert_eq!(
            component.get_path_for_quality(LODQuality::HighFidelity),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb"
        );
        assert_eq!(
            component.get_path_for_quality(LODQuality::LowFidelity),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb"
        );
    }

    #[test]
    fn test_get_path_for_quality_no_variants() {
        let component = LODComponent::new("/assets/models/Robot/glb/Robot.glb".to_string());

        // Should fall back to original path when variants not specified
        assert_eq!(
            component.get_path_for_quality(LODQuality::Original),
            "/assets/models/Robot/glb/Robot.glb"
        );
        assert_eq!(
            component.get_path_for_quality(LODQuality::HighFidelity),
            "/assets/models/Robot/glb/Robot.glb"
        );
        assert_eq!(
            component.get_path_for_quality(LODQuality::LowFidelity),
            "/assets/models/Robot/glb/Robot.glb"
        );
    }

    #[test]
    fn test_quality_change_tracking() {
        let mut component = LODComponent::new("/assets/models/Robot/glb/Robot.glb".to_string());

        // Initially, any quality is a change
        assert!(component.has_quality_changed(LODQuality::Original));

        // Set current quality
        component.set_current_quality(LODQuality::Original);
        assert!(!component.has_quality_changed(LODQuality::Original));
        assert!(component.has_quality_changed(LODQuality::HighFidelity));

        // Change quality
        component.set_current_quality(LODQuality::HighFidelity);
        assert!(component.has_quality_changed(LODQuality::Original));
        assert!(!component.has_quality_changed(LODQuality::HighFidelity));
    }

    #[test]
    fn test_lod_component_serialization() {
        let component = LODComponent::with_paths(
            "/assets/models/Robot/glb/Robot.glb".to_string(),
            "/assets/models/Robot/lod/Robot.high_fidelity.glb".to_string(),
            "/assets/models/Robot/lod/Robot.low_fidelity.glb".to_string(),
        )
        .with_thresholds(30.0, 80.0);

        let json = serde_json::to_string(&component).unwrap();
        assert!(json.contains("originalPath"));
        assert!(json.contains("highFidelityPath"));
        assert!(json.contains("lowFidelityPath"));
        assert!(json.contains("distanceThresholds"));

        let deserialized: LODComponent = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.original_path, component.original_path);
        assert_eq!(
            deserialized.high_fidelity_path,
            component.high_fidelity_path
        );
        assert_eq!(deserialized.low_fidelity_path, component.low_fidelity_path);
        assert_eq!(
            deserialized.distance_thresholds,
            component.distance_thresholds
        );
    }
}
