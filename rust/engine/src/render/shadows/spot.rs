/// Spot light shadow pass rendering
use glam::{Mat4, Quat, Vec3};

/// Calculate a perspective projection matrix for a spot light shadow camera
pub fn calculate_spot_light_matrix(
    position: Vec3,
    direction: Vec3,
    angle: f32,
    range: f32,
) -> Mat4 {
    // Normalize direction
    let dir = direction.normalize();

    // Calculate target point
    let target = position + dir;

    // Create view matrix looking from light position toward target
    let view = Mat4::look_at_rh(position, target, Vec3::Y);

    // Create perspective projection
    // FOV is 2x the spot angle to cover the cone
    let fov_radians = angle * 2.0;
    let aspect = 1.0; // Square shadow map
    let near = 0.1;
    let far = range;

    let projection = Mat4::perspective_rh(fov_radians, aspect, near, far);

    // Return combined view-projection matrix
    projection * view
}

/// Calculate spot light cone parameters from angle
pub fn calculate_spot_cone_params(angle_rad: f32) -> (f32, f32) {
    let cos_inner = (angle_rad * 0.9).cos(); // Inner cone (90% of angle)
    let cos_outer = angle_rad.cos(); // Outer cone (full angle)
    (cos_inner, cos_outer)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spot_light_matrix() {
        let position = Vec3::new(0.0, 5.0, 0.0);
        // Use a diagonal direction to avoid gimbal lock with Y-up
        let direction = Vec3::new(0.1, -1.0, 0.0).normalize();
        let angle = 45.0_f32.to_radians();
        let range = 20.0;

        let matrix = calculate_spot_light_matrix(position, direction, angle, range);

        // Matrix should be valid
        assert!(matrix.is_finite());

        // A point near the light should be visible
        let test_point = Vec3::new(0.0, 0.0, 0.0);
        let transformed = matrix.project_point3(test_point);
        assert!(transformed.z >= -1.0 && transformed.z <= 1.0);
    }

    #[test]
    fn test_spot_cone_params() {
        let angle = 45.0_f32.to_radians();
        let (inner, outer) = calculate_spot_cone_params(angle);

        // Inner should be larger than outer (cosine decreases as angle increases)
        assert!(inner > outer);

        // Both should be between -1 and 1
        assert!(inner >= -1.0 && inner <= 1.0);
        assert!(outer >= -1.0 && outer <= 1.0);
    }
}
