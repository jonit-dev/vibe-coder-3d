/// Coordinate conversion utilities for Three.js ↔ three-d compatibility
///
/// Both runtimes share a right-handed, Y-up coordinate system where +X points
/// right and +Z points forward (toward the viewer). Because the handedness and
/// axis directions already match, most conversions are simple pass-throughs.
use glam::Vec3 as GlamVec3;
use three_d::Vec3;

/// Convert a Three.js position to three-d position.
#[inline]
pub fn threejs_to_threed_position(pos: GlamVec3) -> Vec3 {
    Vec3::new(pos.x, pos.y, pos.z)
}

/// Convert a Three.js direction vector to three-d direction.
#[inline]
pub fn threejs_to_threed_direction(dir_x: f32, dir_y: f32, dir_z: f32) -> Vec3 {
    // Three.js and three-d have different X-axis conventions for light direction.
    // Invert X only to fix mirrored highlights/shadows (Y and Z remain unchanged).
    Vec3::new(-dir_x, dir_y, dir_z)
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
