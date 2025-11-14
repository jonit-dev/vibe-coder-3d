/// Normal calculation with Three.js parity
///
/// Implements smooth normals via triangle-accumulated face normals,
/// matching the Three.js TerrainWorker implementation.
use three_d::Vector3;

/// Calculate smooth normals for terrain mesh via triangle accumulation
///
/// This matches the Three.js implementation:
/// 1. Accumulate face normals to each vertex
/// 2. Normalize the accumulated vectors
///
/// # Arguments
/// * `positions` - Vertex positions (Vector3 array)
/// * `indices` - Triangle indices (u32 array, 3 indices per triangle)
///
/// # Returns
/// Vector of normalized smooth normals, one per vertex
pub fn calculate_smooth_normals(positions: &[Vector3<f32>], indices: &[u32]) -> Vec<Vector3<f32>> {
    let mut normals = vec![Vector3::new(0.0, 0.0, 0.0); positions.len()];

    // Accumulate face normals to vertices
    for triangle in indices.chunks(3) {
        let i0 = triangle[0] as usize;
        let i1 = triangle[1] as usize;
        let i2 = triangle[2] as usize;

        let v0 = positions[i0];
        let v1 = positions[i1];
        let v2 = positions[i2];

        // Edge vectors
        let edge1 = Vector3::new(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z);
        let edge2 = Vector3::new(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z);

        // Cross product for face normal (not normalized, weighted by area)
        let normal = Vector3::new(
            edge1.y * edge2.z - edge1.z * edge2.y,
            edge1.z * edge2.x - edge1.x * edge2.z,
            edge1.x * edge2.y - edge1.y * edge2.x,
        );

        // Accumulate to vertex normals
        normals[i0] = Vector3::new(
            normals[i0].x + normal.x,
            normals[i0].y + normal.y,
            normals[i0].z + normal.z,
        );
        normals[i1] = Vector3::new(
            normals[i1].x + normal.x,
            normals[i1].y + normal.y,
            normals[i1].z + normal.z,
        );
        normals[i2] = Vector3::new(
            normals[i2].x + normal.x,
            normals[i2].y + normal.y,
            normals[i2].z + normal.z,
        );
    }

    // Normalize all accumulated normals
    for normal in &mut normals {
        let length = (normal.x * normal.x + normal.y * normal.y + normal.z * normal.z).sqrt();
        if length > 0.0001 {
            normal.x /= length;
            normal.y /= length;
            normal.z /= length;
        } else {
            // Degenerate case: use up vector
            normal.x = 0.0;
            normal.y = 1.0;
            normal.z = 0.0;
        }
    }

    normals
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flat_plane_normals() {
        // Flat horizontal plane should have normals pointing up
        let positions = vec![
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            Vector3::new(1.0, 0.0, 1.0),
        ];

        let indices = vec![
            0, 2, 1, // First triangle (CCW)
            1, 2, 3, // Second triangle (CCW)
        ];

        let normals = calculate_smooth_normals(&positions, &indices);

        // All normals should point up (0, 1, 0)
        for (i, normal) in normals.iter().enumerate() {
            assert!(
                normal.x.abs() < 0.01,
                "Normal[{}].x should be ~0, got {}",
                i,
                normal.x
            );
            assert!(
                (normal.y - 1.0).abs() < 0.01,
                "Normal[{}].y should be ~1, got {}",
                i,
                normal.y
            );
            assert!(
                normal.z.abs() < 0.01,
                "Normal[{}].z should be ~0, got {}",
                i,
                normal.z
            );
        }
    }

    #[test]
    fn test_normals_normalized() {
        // Simple sloped terrain
        let positions = vec![
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.5, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
        ];

        let indices = vec![0, 2, 1];

        let normals = calculate_smooth_normals(&positions, &indices);

        // All normals should have length ~1.0
        for (i, normal) in normals.iter().enumerate() {
            let length = (normal.x * normal.x + normal.y * normal.y + normal.z * normal.z).sqrt();
            assert!(
                (length - 1.0).abs() < 0.01,
                "Normal[{}] not normalized: length={}",
                i,
                length
            );
        }
    }

    #[test]
    fn test_shared_vertex_averaging() {
        // Two triangles sharing an edge
        // The shared vertices should have averaged normals
        let positions = vec![
            Vector3::new(0.0, 0.0, 0.0),  // Shared
            Vector3::new(1.0, 0.0, 0.0),  // Shared
            Vector3::new(0.5, 1.0, 0.5),  // Top of first triangle
            Vector3::new(0.5, -1.0, 0.5), // Bottom of second triangle
        ];

        let indices = vec![
            0, 1, 2, // First triangle
            0, 3, 1, // Second triangle (shares edge 0-1)
        ];

        let normals = calculate_smooth_normals(&positions, &indices);

        // Shared vertices (0 and 1) should have averaged normals
        // They should be normalized
        for i in 0..2 {
            let length = (normals[i].x * normals[i].x
                + normals[i].y * normals[i].y
                + normals[i].z * normals[i].z)
                .sqrt();
            assert!(
                (length - 1.0).abs() < 0.01,
                "Shared vertex normal[{}] not normalized: length={}",
                i,
                length
            );
        }
    }
}
