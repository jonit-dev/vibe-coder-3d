/// Transform conversion and manipulation utilities
///
/// Handles conversion between ECS transform components and three-d matrices
use glam::{Quat as GlamQuat, Vec3 as GlamVec3};
use three_d::{radians, Mat4, Vec3};
use vibe_ecs_bridge::decoders::Transform;
use vibe_ecs_bridge::{position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt};

use super::coordinate_conversion::{glam_axis_to_threed, threejs_to_threed_position};
use super::primitive_mesh::primitive_base_scale;

/// Result of transform conversion, containing both three-d matrix and scale info
pub struct ConvertedTransform {
    pub matrix: Mat4,
    pub final_scale: GlamVec3,
    pub base_scale: GlamVec3,
}

/// Convert an ECS Transform component to a three-d transformation matrix
///
/// This handles:
/// - Position, rotation, and scale extraction
/// - Coordinate system conversion (Three.js → three-d)
/// - Primitive base scale application
/// - Detailed logging of the conversion process
pub fn convert_transform_to_matrix(
    transform: &Transform,
    mesh_id: Option<&str>,
) -> ConvertedTransform {
    let base_scale = primitive_base_scale(mesh_id);
    let (matrix, final_scale) = compose_transform_with_base_scale(transform, base_scale);

    let position = position_to_vec3_opt(transform.position.as_ref());
    let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
    let scale = scale_to_vec3_opt(transform.scale.as_ref());

    log_transform_conversion(transform, &position, &rotation, &scale, &base_scale);

    let pos = threejs_to_threed_position(position);
    let (axis, angle) = rotation.to_axis_angle();
    let axis_3d = glam_axis_to_threed(axis);
    let scale_3d = Vec3::new(final_scale.x, final_scale.y, final_scale.z);

    log_coordinate_conversion(&pos, position.z, &axis_3d, angle, &scale_3d);

    ConvertedTransform {
        matrix,
        final_scale,
        base_scale,
    }
}

/// Create a transformation matrix from just primitive base scale (no Transform component)
pub fn create_base_scale_matrix(mesh_id: Option<&str>) -> ConvertedTransform {
    let base_scale = primitive_base_scale(mesh_id);
    let scale_3d = Vec3::new(base_scale.x, base_scale.y, base_scale.z);
    let matrix = Mat4::from_nonuniform_scale(scale_3d.x, scale_3d.y, scale_3d.z);

    ConvertedTransform {
        matrix,
        final_scale: base_scale,
        base_scale,
    }
}

/// Compose a three-d transformation matrix from an ECS transform using a precomputed base scale.
pub fn compose_transform_with_base_scale(
    transform: &Transform,
    base_scale: GlamVec3,
) -> (Mat4, GlamVec3) {
    let position = position_to_vec3_opt(transform.position.as_ref());
    let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
    let scale = scale_to_vec3_opt(transform.scale.as_ref());

    let final_scale = GlamVec3::new(
        scale.x * base_scale.x,
        scale.y * base_scale.y,
        scale.z * base_scale.z,
    );

    let pos = threejs_to_threed_position(position);
    let (axis, angle) = rotation.to_axis_angle();
    let axis_3d = glam_axis_to_threed(axis);
    let scale_3d = Vec3::new(final_scale.x, final_scale.y, final_scale.z);

    let matrix = Mat4::from_translation(pos)
        * Mat4::from_axis_angle(axis_3d, radians(angle))
        * Mat4::from_nonuniform_scale(scale_3d.x, scale_3d.y, scale_3d.z);

    (matrix, final_scale)
}

/// Convert camera transform to position and target vectors
pub fn convert_camera_transform(transform: &Transform) -> (Vec3, Vec3) {
    let pos = position_to_vec3_opt(transform.position.as_ref());
    let rotation = rotation_to_quat_opt(transform.rotation.as_ref());

    log::info!("  Transform (raw JSON):");
    log::info!("    Position:   {:?}", transform.position);
    log::info!("    Rotation:   {:?}", transform.rotation);
    log::info!("  Transform (parsed glam):");
    log::info!("    Position:   {:?}", pos);
    log::info!("    Rotation (quat): {:?}", rotation);

    // Calculate target position from rotation
    // Three.js and three-d both use right-handed, Y-up coordinates with +Z forward.
    let forward_threejs = rotation * glam::Vec3::Z;

    let forward_threed = glam::Vec3::new(forward_threejs.x, forward_threejs.y, forward_threejs.z);
    let pos_threed = glam::Vec3::new(pos.x, pos.y, pos.z);

    // Calculate target in three-d space
    let target_threed = pos_threed + forward_threed;

    log::info!("  Coordinate Conversion:");
    log::info!("    Three.js forward: {:?}", forward_threejs);
    log::info!(
        "    three-d forward:  [{:.2}, {:.2}, {:.2}]",
        forward_threed.x,
        forward_threed.y,
        forward_threed.z
    );
    log::info!(
        "    three-d position: [{:.2}, {:.2}, {:.2}]",
        pos_threed.x,
        pos_threed.y,
        pos_threed.z
    );
    log::info!(
        "    three-d target:   [{:.2}, {:.2}, {:.2}]",
        target_threed.x,
        target_threed.y,
        target_threed.z
    );

    (
        Vec3::new(pos_threed.x, pos_threed.y, pos_threed.z),
        Vec3::new(target_threed.x, target_threed.y, target_threed.z),
    )
}

// Helper logging functions

fn log_transform_conversion(
    transform: &Transform,
    position: &GlamVec3,
    rotation: &GlamQuat,
    scale: &GlamVec3,
    base_scale: &GlamVec3,
) {
    log::info!("  Transform:");
    log::info!("    RAW from JSON:");
    log::info!("      Position: {:?}", transform.position);
    log::info!(
        "      Rotation: {:?} (THREE.JS DEGREES)",
        transform.rotation
    );
    log::info!("      Scale:    {:?}", transform.scale);
    log::info!("");
    log::info!("    CONVERTED (glam):");
    log::info!(
        "      Position: [{:.4}, {:.4}, {:.4}]",
        position.x,
        position.y,
        position.z
    );
    log::info!(
        "      Rotation: [{:.4}, {:.4}, {:.4}, {:.4}] (quat, RADIANS)",
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
    );
    log::info!(
        "      Scale:    [{:.4}, {:.4}, {:.4}]",
        scale.x,
        scale.y,
        scale.z
    );
    log::info!(
        "      Primitive base scale: [{:.4}, {:.4}, {:.4}]",
        base_scale.x,
        base_scale.y,
        base_scale.z
    );
}

fn log_coordinate_conversion(pos: &Vec3, _original_z: f32, axis: &Vec3, angle: f32, scale: &Vec3) {
    log::info!("");
    log::info!("    three-d COORDINATE SYSTEM CONVERSION:");
    log::info!(
        "      Position (three-d): [{:.4}, {:.4}, {:.4}] (no axis flip needed)",
        pos.x,
        pos.y,
        pos.z
    );
    log::info!(
        "      Rotation axis: [{:.4}, {:.4}, {:.4}]",
        axis.x,
        axis.y,
        axis.z
    );
    log::info!(
        "      Rotation angle: {:.4} rad ({:.2}°)",
        angle,
        angle.to_degrees()
    );
    log::info!(
        "      Scale (three-d): [{:.4}, {:.4}, {:.4}] (scene scale × primitive base)",
        scale.x,
        scale.y,
        scale.z
    );
}
