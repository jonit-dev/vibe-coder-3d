/// Structural primitives: ramps, stairs, spiral stairs
///
/// These shapes are commonly used in game environments for navigation.
use std::f32::consts::PI;

use super::vertex::Vertex;
use super::vertex_builder::vertex_pnu;
use super::Mesh;

/// Create a ramp (inclined plane)
///
/// Creates a triangular prism with one face angled to form a ramp.
///
/// # Arguments
/// * `width` - Width of the ramp (X axis, default: 1.0)
/// * `height` - Height of the ramp (Y axis, default: 1.0)
/// * `depth` - Depth of the ramp (Z axis, default: 1.0)
///
/// # Layout
/// ```text
///     top edge
///    ┌────────┐
///   /│        │
///  / │        │
/// /  │        │
/// └──┴────────┘
///    bottom
/// ```
pub fn create_ramp(width: f32, height: f32, depth: f32) -> Mesh {
    let hw = width / 2.0;
    let hd = depth / 2.0;

    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Bottom face (flat on ground)
    let bottom_normal = [0.0, -1.0, 0.0];
    vertices.push(vertex_pnu([-hw, 0.0, -hd], bottom_normal, [0.0, 0.0])); // 0
    vertices.push(vertex_pnu([hw, 0.0, -hd], bottom_normal, [1.0, 0.0])); // 1
    vertices.push(vertex_pnu([hw, 0.0, hd], bottom_normal, [1.0, 1.0])); // 2
    vertices.push(vertex_pnu([-hw, 0.0, hd], bottom_normal, [0.0, 1.0])); // 3
    indices.extend_from_slice(&[0, 2, 1, 0, 3, 2]);

    // Back face (vertical wall at -Z)
    let back_normal = [0.0, 0.0, -1.0];
    vertices.push(vertex_pnu([-hw, 0.0, -hd], back_normal, [0.0, 1.0])); // 4
    vertices.push(vertex_pnu([hw, 0.0, -hd], back_normal, [1.0, 1.0])); // 5
    vertices.push(vertex_pnu([hw, height, -hd], back_normal, [1.0, 0.0])); // 6
    vertices.push(vertex_pnu([-hw, height, -hd], back_normal, [0.0, 0.0])); // 7
    indices.extend_from_slice(&[4, 5, 6, 6, 7, 4]);

    // Left face (triangle)
    let left_normal = [-1.0, 0.0, 0.0];
    vertices.push(vertex_pnu([-hw, 0.0, -hd], left_normal, [0.0, 1.0])); // 8
    vertices.push(vertex_pnu([-hw, height, -hd], left_normal, [0.0, 0.0])); // 9
    vertices.push(vertex_pnu([-hw, 0.0, hd], left_normal, [1.0, 1.0])); // 10
    indices.extend_from_slice(&[8, 9, 10]);

    // Right face (triangle)
    let right_normal = [1.0, 0.0, 0.0];
    vertices.push(vertex_pnu([hw, 0.0, -hd], right_normal, [0.0, 1.0])); // 11
    vertices.push(vertex_pnu([hw, 0.0, hd], right_normal, [1.0, 1.0])); // 12
    vertices.push(vertex_pnu([hw, height, -hd], right_normal, [0.0, 0.0])); // 13
    indices.extend_from_slice(&[11, 12, 13]);

    // Sloped face (the ramp surface)
    // Calculate normal for the slope (perpendicular to surface)
    let slope_len = (depth * depth + height * height).sqrt();
    let slope_normal = [0.0, depth / slope_len, height / slope_len];
    vertices.push(vertex_pnu([-hw, 0.0, hd], slope_normal, [0.0, 0.0])); // 14
    vertices.push(vertex_pnu([hw, 0.0, hd], slope_normal, [1.0, 0.0])); // 15
    vertices.push(vertex_pnu([hw, height, -hd], slope_normal, [1.0, 1.0])); // 16
    vertices.push(vertex_pnu([-hw, height, -hd], slope_normal, [0.0, 1.0])); // 17
    indices.extend_from_slice(&[14, 15, 16, 16, 17, 14]);

    Mesh::new(vertices, indices)
}

/// Create stairs
///
/// Creates a series of steps arranged vertically.
///
/// # Arguments
/// * `width` - Width of the stairs (X axis, default: 1.0)
/// * `height` - Total height of the stairs (Y axis, default: 1.0)
/// * `depth` - Total depth of the stairs (Z axis, default: 1.0)
/// * `num_steps` - Number of steps (default: 5)
pub fn create_stairs(width: f32, height: f32, depth: f32, num_steps: u32) -> Mesh {
    let hw = width / 2.0;
    let step_height = height / num_steps as f32;
    let step_depth = depth / num_steps as f32;

    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    for step in 0..num_steps {
        let y_base = step as f32 * step_height;
        let y_top = (step + 1) as f32 * step_height;
        let z_front = -(depth / 2.0) + step as f32 * step_depth;
        let z_back = z_front + step_depth;

        let base_idx = vertices.len() as u32;

        // Top face of step
        let top_normal = [0.0, 1.0, 0.0];
        vertices.push(vertex_pnu([-hw, y_top, z_front], top_normal, [0.0, 0.0]));
        vertices.push(vertex_pnu([hw, y_top, z_front], top_normal, [1.0, 0.0]));
        vertices.push(vertex_pnu([hw, y_top, z_back], top_normal, [1.0, 1.0]));
        vertices.push(vertex_pnu([-hw, y_top, z_back], top_normal, [0.0, 1.0]));
        indices.extend_from_slice(&[
            base_idx,
            base_idx + 1,
            base_idx + 2,
            base_idx + 2,
            base_idx + 3,
            base_idx,
        ]);

        // Front face (riser)
        let front_normal = [0.0, 0.0, -1.0];
        let riser_base = vertices.len() as u32;
        vertices.push(vertex_pnu([-hw, y_base, z_front], front_normal, [0.0, 1.0]));
        vertices.push(vertex_pnu([hw, y_base, z_front], front_normal, [1.0, 1.0]));
        vertices.push(vertex_pnu([hw, y_top, z_front], front_normal, [1.0, 0.0]));
        vertices.push(vertex_pnu([-hw, y_top, z_front], front_normal, [0.0, 0.0]));
        indices.extend_from_slice(&[
            riser_base,
            riser_base + 1,
            riser_base + 2,
            riser_base + 2,
            riser_base + 3,
            riser_base,
        ]);

        // Left face
        if step == 0 || step == num_steps - 1 {
            let left_normal = [-1.0, 0.0, 0.0];
            let left_base = vertices.len() as u32;
            vertices.push(vertex_pnu([-hw, y_base, z_front], left_normal, [0.0, 1.0]));
            vertices.push(vertex_pnu([-hw, y_top, z_front], left_normal, [0.0, 0.0]));
            vertices.push(vertex_pnu([-hw, y_top, z_back], left_normal, [1.0, 0.0]));
            vertices.push(vertex_pnu([-hw, y_base, z_front], left_normal, [0.0, 1.0]));
            indices.extend_from_slice(&[
                left_base,
                left_base + 1,
                left_base + 2,
                left_base + 2,
                left_base + 3,
                left_base,
            ]);

            // Right face
            let right_normal = [1.0, 0.0, 0.0];
            let right_base = vertices.len() as u32;
            vertices.push(vertex_pnu([hw, y_base, z_front], right_normal, [0.0, 1.0]));
            vertices.push(vertex_pnu([hw, y_base, z_front], right_normal, [0.0, 1.0]));
            vertices.push(vertex_pnu([hw, y_top, z_back], right_normal, [1.0, 0.0]));
            vertices.push(vertex_pnu([hw, y_top, z_front], right_normal, [0.0, 0.0]));
            indices.extend_from_slice(&[
                right_base,
                right_base + 3,
                right_base + 2,
                right_base + 2,
                right_base + 1,
                right_base,
            ]);
        }
    }

    Mesh::new(vertices, indices)
}

/// Create spiral stairs
///
/// Creates a circular staircase that spirals around a central axis.
///
/// # Arguments
/// * `radius` - Radius of the spiral (default: 1.0)
/// * `height` - Total height of the stairs (default: 2.0)
/// * `num_steps` - Number of steps (default: 12)
/// * `turns` - Number of complete 360° rotations (default: 1.0)
pub fn create_spiral_stairs(radius: f32, height: f32, num_steps: u32, turns: f32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let step_height = height / num_steps as f32;
    let angle_per_step = (turns * 2.0 * PI) / num_steps as f32;
    let inner_radius = radius * 0.3; // Leave space for central pillar
    let step_width = radius - inner_radius;

    for step in 0..num_steps {
        let y_base = step as f32 * step_height;
        let y_top = (step + 1) as f32 * step_height;
        let angle_start = step as f32 * angle_per_step;
        let angle_end = (step + 1) as f32 * angle_per_step;

        let cos_start = angle_start.cos();
        let sin_start = angle_start.sin();
        let cos_end = angle_end.cos();
        let sin_end = angle_end.sin();

        let base_idx = vertices.len() as u32;

        // Top face of step (trapezoid)
        let top_normal = [0.0, 1.0, 0.0];
        vertices.push(vertex_pnu(
            [inner_radius * cos_start, y_top, inner_radius * sin_start],
            top_normal,
            [0.0, 0.0],
        ));
        vertices.push(vertex_pnu(
            [radius * cos_start, y_top, radius * sin_start],
            top_normal,
            [1.0, 0.0],
        ));
        vertices.push(vertex_pnu(
            [radius * cos_end, y_top, radius * sin_end],
            top_normal,
            [1.0, 1.0],
        ));
        vertices.push(vertex_pnu(
            [inner_radius * cos_end, y_top, inner_radius * sin_end],
            top_normal,
            [0.0, 1.0],
        ));
        indices.extend_from_slice(&[
            base_idx,
            base_idx + 1,
            base_idx + 2,
            base_idx + 2,
            base_idx + 3,
            base_idx,
        ]);

        // Outer edge (riser)
        let outer_normal = [cos_start, 0.0, sin_start];
        let outer_base = vertices.len() as u32;
        vertices.push(vertex_pnu(
            [radius * cos_start, y_base, radius * sin_start],
            outer_normal,
            [0.0, 1.0],
        ));
        vertices.push(vertex_pnu(
            [radius * cos_start, y_top, radius * sin_start],
            outer_normal,
            [0.0, 0.0],
        ));
        vertices.push(vertex_pnu(
            [radius * cos_end, y_top, radius * sin_end],
            outer_normal,
            [1.0, 0.0],
        ));
        vertices.push(vertex_pnu(
            [radius * cos_end, y_base, radius * sin_end],
            outer_normal,
            [1.0, 1.0],
        ));
        indices.extend_from_slice(&[
            outer_base,
            outer_base + 1,
            outer_base + 2,
            outer_base + 2,
            outer_base + 3,
            outer_base,
        ]);
    }

    Mesh::new(vertices, indices)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ramp_has_vertices() {
        let mesh = create_ramp(1.0, 1.0, 1.0);
        assert!(mesh.vertices.len() > 0, "Ramp should have vertices");
        assert!(mesh.indices.len() > 0, "Ramp should have indices");
    }

    #[test]
    fn test_stairs_vertex_count() {
        let mesh = create_stairs(1.0, 1.0, 1.0, 5);
        assert!(mesh.vertices.len() > 0, "Stairs should have vertices");
        assert!(mesh.indices.len() > 0, "Stairs should have indices");
    }

    #[test]
    fn test_spiral_stairs_vertex_count() {
        let mesh = create_spiral_stairs(1.0, 2.0, 12, 1.0);
        assert!(
            mesh.vertices.len() > 0,
            "Spiral stairs should have vertices"
        );
        assert!(mesh.indices.len() > 0, "Spiral stairs should have indices");
    }
}
