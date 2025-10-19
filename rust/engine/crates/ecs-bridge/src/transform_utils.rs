//! Transform conversion utilities
//!
//! This module provides standardized conversions between TypeScript/JSON and Rust
//! transform representations, ensuring consistency across rendering, physics, and
//! other systems.
//!
//! # Critical Convention
//!
//! **TypeScript/JSON stores rotation as Euler angles in DEGREES**
//! **Rust math libraries (glam) expect RADIANS**
//!
//! Always use these utilities to convert rotations to avoid the "degrees vs radians" bug!

use glam::{Quat, Vec3};

/// Convert TypeScript rotation array to Quaternion
///
/// # Format Support
///
/// - 3 elements: Euler angles in **DEGREES** `[x, y, z]` (TypeScript convention)
/// - 4 elements: Quaternion `[x, y, z, w]` (already in correct format)
///
/// # Examples
///
/// ```
/// use vibe_ecs_bridge::transform_utils::rotation_to_quat;
///
/// // Euler angles in degrees (from TypeScript)
/// let quat = rotation_to_quat(&[-90.0, 0.0, 0.0]);
/// // Quaternion representing -90° rotation around X axis
///
/// // Direct quaternion (no conversion needed)
/// let quat = rotation_to_quat(&[0.0, 0.0, 0.0, 1.0]);
/// // Identity quaternion
/// ```
pub fn rotation_to_quat(rotation: &[f32]) -> Quat {
    match rotation.len() {
        3 => {
            // Euler angles in DEGREES from TypeScript
            // Convert to radians for glam
            let x_rad = rotation[0].to_radians();
            let y_rad = rotation[1].to_radians();
            let z_rad = rotation[2].to_radians();

            log::trace!(
                "Transform conversion: Euler [{:.2}°, {:.2}°, {:.2}°] → [{:.4} rad, {:.4} rad, {:.4} rad]",
                rotation[0], rotation[1], rotation[2],
                x_rad, y_rad, z_rad
            );

            // Use XYZ order to match Three.js default
            let quat = Quat::from_euler(glam::EulerRot::XYZ, x_rad, y_rad, z_rad);

            log::trace!(
                "  → Quaternion [{:.4}, {:.4}, {:.4}, {:.4}]",
                quat.x,
                quat.y,
                quat.z,
                quat.w
            );

            quat
        }
        4 => {
            // Quaternion [x, y, z, w] - use directly
            log::trace!(
                "Transform conversion: Quaternion passthrough [{:.4}, {:.4}, {:.4}, {:.4}]",
                rotation[0],
                rotation[1],
                rotation[2],
                rotation[3]
            );
            Quat::from_xyzw(rotation[0], rotation[1], rotation[2], rotation[3])
        }
        _ => {
            log::warn!(
                "Invalid rotation array length: {}, expected 3 (Euler degrees) or 4 (quaternion). Using identity.",
                rotation.len()
            );
            Quat::IDENTITY
        }
    }
}

/// Convert optional TypeScript rotation to Quaternion
///
/// Returns `Quat::IDENTITY` if rotation is None
pub fn rotation_to_quat_opt(rotation: Option<&Vec<f32>>) -> Quat {
    rotation
        .map(|r| rotation_to_quat(r))
        .unwrap_or(Quat::IDENTITY)
}

/// Convert TypeScript position array to Vec3
///
/// # Examples
///
/// ```
/// use vibe_ecs_bridge::transform_utils::position_to_vec3;
///
/// let pos = position_to_vec3(&[1.0, 2.0, 3.0]);
/// assert_eq!(pos, glam::Vec3::new(1.0, 2.0, 3.0));
/// ```
pub fn position_to_vec3(position: &[f32; 3]) -> Vec3 {
    Vec3::new(position[0], position[1], position[2])
}

/// Convert optional TypeScript position to Vec3
///
/// Returns `Vec3::ZERO` if position is None
pub fn position_to_vec3_opt(position: Option<&[f32; 3]>) -> Vec3 {
    position.map(position_to_vec3).unwrap_or(Vec3::ZERO)
}

/// Convert TypeScript scale array to Vec3
///
/// # Examples
///
/// ```
/// use vibe_ecs_bridge::transform_utils::scale_to_vec3;
///
/// let scale = scale_to_vec3(&[2.0, 2.0, 2.0]);
/// assert_eq!(scale, glam::Vec3::new(2.0, 2.0, 2.0));
/// ```
pub fn scale_to_vec3(scale: &[f32; 3]) -> Vec3 {
    Vec3::new(scale[0], scale[1], scale[2])
}

/// Convert optional TypeScript scale to Vec3
///
/// Returns `Vec3::ONE` if scale is None
pub fn scale_to_vec3_opt(scale: Option<&[f32; 3]>) -> Vec3 {
    scale.map(scale_to_vec3).unwrap_or(Vec3::ONE)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;

    #[test]
    fn test_euler_degrees_to_radians() {
        // 90 degrees around X should equal PI/2 radians
        let quat = rotation_to_quat(&[90.0, 0.0, 0.0]);
        let expected = Quat::from_euler(glam::EulerRot::XYZ, PI / 2.0, 0.0, 0.0);

        assert!((quat.x - expected.x).abs() < 0.001);
        assert!((quat.y - expected.y).abs() < 0.001);
        assert!((quat.z - expected.z).abs() < 0.001);
        assert!((quat.w - expected.w).abs() < 0.001);
    }

    #[test]
    fn test_negative_rotation() {
        // -90 degrees around X (plane rotation)
        let quat = rotation_to_quat(&[-90.0, 0.0, 0.0]);
        let expected = Quat::from_euler(glam::EulerRot::XYZ, -PI / 2.0, 0.0, 0.0);

        assert!((quat.x - expected.x).abs() < 0.001);
        assert!((quat.y - expected.y).abs() < 0.001);
        assert!((quat.z - expected.z).abs() < 0.001);
        assert!((quat.w - expected.w).abs() < 0.001);
    }

    #[test]
    fn test_quaternion_passthrough() {
        // Quaternion input should be used directly
        let quat = rotation_to_quat(&[0.0, 0.707, 0.0, 0.707]);
        assert!((quat.x - 0.0).abs() < 0.001);
        assert!((quat.y - 0.707).abs() < 0.001);
        assert!((quat.z - 0.0).abs() < 0.001);
        assert!((quat.w - 0.707).abs() < 0.001);
    }

    #[test]
    fn test_zero_rotation() {
        let quat = rotation_to_quat(&[0.0, 0.0, 0.0]);
        let identity = Quat::IDENTITY;

        assert!((quat.x - identity.x).abs() < 0.001);
        assert!((quat.y - identity.y).abs() < 0.001);
        assert!((quat.z - identity.z).abs() < 0.001);
        assert!((quat.w - identity.w).abs() < 0.001);
    }

    #[test]
    fn test_invalid_length_returns_identity() {
        let quat = rotation_to_quat(&[1.0, 2.0]); // Invalid: only 2 elements
        assert_eq!(quat, Quat::IDENTITY);
    }

    #[test]
    fn test_position_conversion() {
        let pos = position_to_vec3(&[1.0, 2.0, 3.0]);
        assert_eq!(pos, Vec3::new(1.0, 2.0, 3.0));
    }

    #[test]
    fn test_scale_conversion() {
        let scale = scale_to_vec3(&[2.0, 3.0, 4.0]);
        assert_eq!(scale, Vec3::new(2.0, 3.0, 4.0));
    }

    #[test]
    fn test_optional_conversions() {
        assert_eq!(rotation_to_quat_opt(None), Quat::IDENTITY);
        assert_eq!(position_to_vec3_opt(None), Vec3::ZERO);
        assert_eq!(scale_to_vec3_opt(None), Vec3::ONE);
    }
}
