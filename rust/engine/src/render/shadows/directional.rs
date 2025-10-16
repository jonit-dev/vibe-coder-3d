/// Directional light shadow pass rendering
use glam::{Mat4, Vec3};

/// Calculate an orthographic projection matrix for a directional light shadow camera
/// This creates a view frustum that encompasses the scene from the light's perspective
pub fn calculate_directional_light_matrix(
    light_direction: Vec3,
    scene_center: Vec3,
    scene_radius: f32,
) -> Mat4 {
    // Normalize light direction
    let light_dir = light_direction.normalize();

    // Calculate light position (looking at scene center from the light's direction)
    let light_position = scene_center - light_dir * scene_radius * 2.0;

    // Calculate view matrix (looking from light toward scene)
    let view = Mat4::look_at_rh(light_position, scene_center, Vec3::Y);

    // Create orthographic projection that covers the scene
    // Using a square frustum centered on the scene
    let half_size = scene_radius * 1.5; // Add margin
    let projection = Mat4::orthographic_rh(
        -half_size,
        half_size,
        -half_size,
        half_size,
        -scene_radius * 2.0, // near
        scene_radius * 4.0,  // far
    );

    // Return combined view-projection matrix
    projection * view
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_directional_light_matrix() {
        // Use a diagonal light direction to avoid gimbal lock with Y-up
        let light_dir = Vec3::new(0.5, -1.0, 0.5); // Diagonal down
        let scene_center = Vec3::ZERO;
        let scene_radius = 10.0;

        let matrix = calculate_directional_light_matrix(light_dir, scene_center, scene_radius);

        // Matrix should be valid (not NaN or infinite)
        assert!(matrix.is_finite());

        // The matrix should transform a point at the scene center to somewhere visible
        let transformed = matrix.project_point3(scene_center);
        assert!(transformed.z >= -1.0 && transformed.z <= 1.0);
    }
}
