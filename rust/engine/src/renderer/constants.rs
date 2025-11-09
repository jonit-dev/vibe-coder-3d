//! Rendering configuration constants
//!
//! This module contains centralized constants for rendering configuration
//! to prevent magic numbers scattered throughout the codebase.

/// Default field of view in degrees for perspective cameras
pub const DEFAULT_FOV_DEGREES: f32 = 60.0;

/// Default near plane distance for perspective cameras
pub const DEFAULT_NEAR_PLANE: f32 = 0.1;

/// Default far plane distance for perspective cameras
pub const DEFAULT_FAR_PLANE: f32 = 1000.0;

/// Number of MSAA samples for antialiasing
pub const DEFAULT_MSAA_SAMPLES: u32 = 4;

/// Default LOD distance thresholds [high, low]
pub const DEFAULT_LOD_THRESHOLD_HIGH: f32 = 50.0;
pub const DEFAULT_LOD_THRESHOLD_LOW: f32 = 100.0;

/// BVH configuration constants
pub const BVH_MAX_LEAF_TRIANGLES: usize = 8;
pub const BVH_MAX_LEAF_REFS: usize = 4;

/// Default camera position for initial scene setup
pub const DEFAULT_CAMERA_POS_X: f32 = 0.0;
pub const DEFAULT_CAMERA_POS_Y: f32 = 2.0;
pub const DEFAULT_CAMERA_POS_Z: f32 = 5.0;

/// Default camera target (look-at point)
pub const DEFAULT_CAMERA_TARGET_X: f32 = 0.0;
pub const DEFAULT_CAMERA_TARGET_Y: f32 = 0.0;
pub const DEFAULT_CAMERA_TARGET_Z: f32 = 0.0;

/// Default camera up vector
pub const DEFAULT_CAMERA_UP_X: f32 = 0.0;
pub const DEFAULT_CAMERA_UP_Y: f32 = 1.0;
pub const DEFAULT_CAMERA_UP_Z: f32 = 0.0;
