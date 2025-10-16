/// Shared mathematical utilities for geometry generation
///
/// This module provides DRY utilities for common geometric operations:
/// - Circle point generation
/// - Normal vector calculations
/// - UV coordinate unwrapping
/// - Tangent space generation
use std::f32::consts::PI;

use glam::Vec3;

/// Generate points along a circle in the XZ plane
///
/// # Arguments
/// * `radius` - Circle radius
/// * `segments` - Number of segments (points)
/// * `y` - Y coordinate for the circle
///
/// # Returns
/// Vec of (x, y, z) positions for each segment
pub fn circle_points_xz(radius: f32, segments: u32, y: f32) -> Vec<[f32; 3]> {
    (0..segments)
        .map(|i| {
            let theta = 2.0 * PI * i as f32 / segments as f32;
            let x = radius * theta.cos();
            let z = radius * theta.sin();
            [x, y, z]
        })
        .collect()
}

/// Generate points along a circle in the XY plane
///
/// # Arguments
/// * `radius` - Circle radius
/// * `segments` - Number of segments (points)
/// * `z` - Z coordinate for the circle
///
/// # Returns
/// Vec of (x, y, z) positions for each segment
pub fn circle_points_xy(radius: f32, segments: u32, z: f32) -> Vec<[f32; 3]> {
    (0..segments)
        .map(|i| {
            let theta = 2.0 * PI * i as f32 / segments as f32;
            let x = radius * theta.cos();
            let y = radius * theta.sin();
            [x, y, z]
        })
        .collect()
}

/// Compute normal vector from three points (CCW winding)
///
/// # Arguments
/// * `p0`, `p1`, `p2` - Three points forming a triangle (CCW order)
///
/// # Returns
/// Normalized normal vector pointing outward
pub fn compute_face_normal(p0: [f32; 3], p1: [f32; 3], p2: [f32; 3]) -> [f32; 3] {
    let v0 = Vec3::from_array(p0);
    let v1 = Vec3::from_array(p1);
    let v2 = Vec3::from_array(p2);

    let edge1 = v1 - v0;
    let edge2 = v2 - v0;

    let normal = edge1.cross(edge2).normalize_or_zero();
    normal.to_array()
}

/// Generate cylindrical UV coordinates
///
/// # Arguments
/// * `segment` - Current segment index [0, segments)
/// * `ring` - Current ring index [0, rings]
/// * `segments` - Total segments around circumference
/// * `rings` - Total rings along height
///
/// # Returns
/// UV coordinates [u, v] in range [0, 1]
pub fn cylindrical_uv(segment: u32, ring: u32, segments: u32, rings: u32) -> [f32; 2] {
    let u = segment as f32 / segments as f32;
    let v = ring as f32 / rings as f32;
    [u, v]
}

/// Generate spherical UV coordinates
///
/// # Arguments
/// * `segment` - Current segment index (longitude)
/// * `ring` - Current ring index (latitude)
/// * `segments` - Total longitude segments
/// * `rings` - Total latitude rings
///
/// # Returns
/// UV coordinates [u, v] in range [0, 1]
pub fn spherical_uv(segment: u32, ring: u32, segments: u32, rings: u32) -> [f32; 2] {
    let u = segment as f32 / segments as f32;
    let v = ring as f32 / rings as f32;
    [u, v]
}

/// Normalize a vector, returning zero vector if magnitude is too small
pub fn safe_normalize(v: [f32; 3]) -> [f32; 3] {
    Vec3::from_array(v).normalize_or_zero().to_array()
}

/// Compute average normal from multiple face normals (for smooth shading)
pub fn average_normals(normals: &[[f32; 3]]) -> [f32; 3] {
    if normals.is_empty() {
        return [0.0, 1.0, 0.0];
    }

    let sum = normals
        .iter()
        .fold(Vec3::ZERO, |acc, &n| acc + Vec3::from_array(n));

    let avg = sum / normals.len() as f32;
    avg.normalize_or_zero().to_array()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circle_points_xz() {
        let points = circle_points_xz(1.0, 4, 0.0);
        assert_eq!(points.len(), 4);

        // First point should be at (1, 0, 0) approximately
        assert!((points[0][0] - 1.0).abs() < 0.001);
        assert!((points[0][2]).abs() < 0.001);
    }

    #[test]
    fn test_compute_face_normal() {
        // CCW triangle in XY plane, normal should point +Z
        let p0 = [0.0, 0.0, 0.0];
        let p1 = [1.0, 0.0, 0.0];
        let p2 = [0.0, 1.0, 0.0];

        let normal = compute_face_normal(p0, p1, p2);

        assert!((normal[0]).abs() < 0.001);
        assert!((normal[1]).abs() < 0.001);
        assert!((normal[2] - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_cylindrical_uv() {
        let uv = cylindrical_uv(0, 0, 4, 2);
        assert_eq!(uv, [0.0, 0.0]);

        let uv = cylindrical_uv(4, 2, 4, 2);
        assert_eq!(uv, [1.0, 1.0]);

        let uv = cylindrical_uv(2, 1, 4, 2);
        assert_eq!(uv, [0.5, 0.5]);
    }

    #[test]
    fn test_safe_normalize() {
        let v = safe_normalize([3.0, 4.0, 0.0]);
        let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
        assert!((len - 1.0).abs() < 0.001);

        // Zero vector should stay zero
        let v = safe_normalize([0.0, 0.0, 0.0]);
        assert_eq!(v, [0.0, 0.0, 0.0]);
    }

    #[test]
    fn test_average_normals() {
        let normals = vec![[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];

        let avg = average_normals(&normals);

        // Should be approximately (1/√3, 1/√3, 1/√3)
        let expected = 1.0 / 3.0_f32.sqrt();
        assert!((avg[0] - expected).abs() < 0.001);
        assert!((avg[1] - expected).abs() < 0.001);
        assert!((avg[2] - expected).abs() < 0.001);
    }
}
