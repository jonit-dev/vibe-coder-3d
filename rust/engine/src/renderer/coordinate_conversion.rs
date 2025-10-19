/// Coordinate conversion utilities for Three.js ↔ three-d compatibility
///
/// Three.js uses a right-handed coordinate system with +Z forward, +X right
/// three-d uses a right-handed coordinate system with -Z forward, +X right
///
/// CRITICAL: When converting camera forward vectors, we must negate BOTH X and Z
/// to prevent horizontal mirroring. For object positions, we only negate Z.
///
/// This module provides utilities to convert between these systems

use glam::Vec3 as GlamVec3;
use three_d::Vec3;

/// Convert a Three.js position to three-d position by flipping the Z axis
///
/// Three.js: +Z is forward
/// three-d: -Z is forward
#[inline]
pub fn threejs_to_threed_position(pos: GlamVec3) -> Vec3 {
    Vec3::new(pos.x, pos.y, -pos.z)
}

/// Convert a Three.js direction vector to three-d direction by flipping the Z axis
#[inline]
pub fn threejs_to_threed_direction(dir_x: f32, dir_y: f32, dir_z: f32) -> Vec3 {
    Vec3::new(dir_x, dir_y, -dir_z)
}

/// Convert glam Vec3 to three-d Vec3 (no coordinate conversion, just type conversion)
#[inline]
pub fn glam_to_threed_vec3(v: GlamVec3) -> Vec3 {
    Vec3::new(v.x, v.y, v.z)
}

/// Convert glam quaternion axis to three-d Vec3
#[inline]
pub fn glam_axis_to_threed(axis: GlamVec3) -> Vec3 {
    Vec3::new(axis.x, axis.y, axis.z)
}
