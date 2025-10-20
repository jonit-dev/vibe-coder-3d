/// Mathematical primitives: helix, mobius strip
///
/// These shapes demonstrate mathematical curves and surfaces.
use std::f32::consts::PI;

use super::vertex::Vertex;
use super::vertex_builder::vertex_pnu;
use super::Mesh;

/// Create a helix (spiral) shape
///
/// Creates a 3D helix by sweeping a circle along a helical path.
///
/// # Arguments
/// * `radius` - Radius of the helix path (default: 0.5)
/// * `height` - Total height of the helix (default: 2.0)
/// * `tube_radius` - Radius of the tube cross-section (default: 0.1)
/// * `coils` - Number of complete turns (default: 3.0)
/// * `segments` - Number of segments per coil (default: 32)
/// * `tube_segments` - Number of segments around tube (default: 8)
pub fn create_helix(
    radius: f32,
    height: f32,
    tube_radius: f32,
    coils: f32,
    segments: u32,
    tube_segments: u32,
) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let total_segments = segments * coils as u32;
    let angle_step = (2.0 * PI * coils) / total_segments as f32;
    let height_step = height / total_segments as f32;

    // Generate helix path and sweep circle along it
    for i in 0..=total_segments {
        let t = i as f32 / total_segments as f32;
        let angle = i as f32 * angle_step;
        let y = i as f32 * height_step - height / 2.0;

        // Helix center point
        let cx = radius * angle.cos();
        let cz = radius * angle.sin();

        // Tangent vector (direction of helix)
        let tangent_x = -radius * angle.sin();
        let tangent_y = height_step * total_segments as f32 / (2.0 * PI * coils);
        let tangent_z = radius * angle.cos();
        let tangent_len =
            (tangent_x * tangent_x + tangent_y * tangent_y + tangent_z * tangent_z).sqrt();
        let tangent = [
            tangent_x / tangent_len,
            tangent_y / tangent_len,
            tangent_z / tangent_len,
        ];

        // Normal vector (points outward from helix center)
        let normal_x = cx / radius;
        let normal_z = cz / radius;
        let normal = [normal_x, 0.0, normal_z];

        // Binormal vector (perpendicular to tangent and normal)
        let binormal = [
            tangent[1] * normal[2] - tangent[2] * normal[1],
            tangent[2] * normal[0] - tangent[0] * normal[2],
            tangent[0] * normal[1] - tangent[1] * normal[0],
        ];

        // Create circle cross-section around helix path
        for j in 0..tube_segments {
            let tube_angle = (j as f32 / tube_segments as f32) * 2.0 * PI;
            let cos_tube = tube_angle.cos();
            let sin_tube = tube_angle.sin();

            // Position on tube circle
            let px = cx + tube_radius * (normal[0] * cos_tube + binormal[0] * sin_tube);
            let py = y + tube_radius * (normal[1] * cos_tube + binormal[1] * sin_tube);
            let pz = cz + tube_radius * (normal[2] * cos_tube + binormal[2] * sin_tube);

            // Normal at this point (points outward from tube)
            let nx = normal[0] * cos_tube + binormal[0] * sin_tube;
            let ny = normal[1] * cos_tube + binormal[1] * sin_tube;
            let nz = normal[2] * cos_tube + binormal[2] * sin_tube;

            let u = t;
            let v = j as f32 / tube_segments as f32;

            vertices.push(vertex_pnu([px, py, pz], [nx, ny, nz], [u, v]));
        }
    }

    // Create triangles connecting the circles
    for i in 0..total_segments {
        for j in 0..tube_segments {
            let next_j = (j + 1) % tube_segments;

            let idx0 = i * tube_segments + j;
            let idx1 = i * tube_segments + next_j;
            let idx2 = (i + 1) * tube_segments + next_j;
            let idx3 = (i + 1) * tube_segments + j;

            indices.extend_from_slice(&[idx0, idx1, idx2, idx2, idx3, idx0]);
        }
    }

    Mesh::new(vertices, indices)
}

/// Create a Mobius strip (non-orientable surface)
///
/// Creates a Mobius strip by twisting a rectangle 180 degrees as it loops.
///
/// # Arguments
/// * `radius` - Radius of the strip's path (default: 0.5)
/// * `width` - Width of the strip (default: 0.3)
/// * `segments` - Number of segments around the loop (default: 64)
pub fn create_mobius_strip(radius: f32, width: f32, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_width = width / 2.0;
    let angle_step = (2.0 * PI) / segments as f32;

    // Generate strip with twist
    for i in 0..=segments {
        let t = i as f32 / segments as f32;
        let angle = i as f32 * angle_step;

        // Center point on the path
        let cx = radius * angle.cos();
        let cz = radius * angle.sin();

        // Twist angle (half twist = 180 degrees = PI radians)
        let twist = angle / 2.0;

        // Normal and binormal for the strip orientation
        let normal_x = angle.cos();
        let normal_z = angle.sin();

        // Rotated binormal (perpendicular to path, with twist)
        let binormal_x = -normal_z * twist.cos();
        let binormal_y = twist.sin();
        let binormal_z = normal_x * twist.cos();

        // Two points across the width of the strip
        for side in 0..2 {
            let offset = if side == 0 { -half_width } else { half_width };

            let px = cx + offset * binormal_x;
            let py = offset * binormal_y;
            let pz = cz + offset * binormal_z;

            // Surface normal (perpendicular to strip surface)
            // For Mobius strip, the normal flips as we go around
            let nx = -twist.sin() * normal_x;
            let ny = twist.cos();
            let nz = -twist.sin() * normal_z;

            let u = t;
            let v = side as f32;

            vertices.push(vertex_pnu([px, py, pz], [nx, ny, nz], [u, v]));
        }
    }

    // Create triangles connecting adjacent segments
    for i in 0..segments {
        let idx0 = i * 2;
        let idx1 = i * 2 + 1;
        let idx2 = ((i + 1) % (segments + 1)) * 2 + 1;
        let idx3 = ((i + 1) % (segments + 1)) * 2;

        indices.extend_from_slice(&[idx0, idx1, idx2, idx2, idx3, idx0]);
    }

    Mesh::new(vertices, indices)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_helix_has_vertices() {
        let mesh = create_helix(0.5, 2.0, 0.1, 3.0, 32, 8);
        assert!(mesh.vertices.len() > 0, "Helix should have vertices");
        assert!(mesh.indices.len() > 0, "Helix should have indices");
        assert_eq!(mesh.indices.len() % 3, 0, "Indices should be triangles");
    }

    #[test]
    fn test_mobius_strip_has_vertices() {
        let mesh = create_mobius_strip(0.5, 0.3, 64);
        assert!(mesh.vertices.len() > 0, "Mobius strip should have vertices");
        assert!(mesh.indices.len() > 0, "Mobius strip should have indices");
    }

    #[test]
    fn test_helix_coil_count() {
        // Test with different coil counts
        let mesh1 = create_helix(0.5, 2.0, 0.1, 1.0, 32, 8);
        let mesh2 = create_helix(0.5, 2.0, 0.1, 2.0, 32, 8);

        // More coils should result in more vertices
        assert!(
            mesh2.vertices.len() >= mesh1.vertices.len(),
            "More coils should not reduce vertex count"
        );
    }
}
