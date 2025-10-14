#[cfg(test)]
mod tests {
    use super::super::primitives::{create_cube, create_plane, create_sphere};

    #[test]
    fn test_create_cube_vertex_count() {
        let cube = create_cube();

        // Cube should have 24 vertices (4 per face * 6 faces)
        assert_eq!(cube.vertices.len(), 24);
    }

    #[test]
    fn test_create_cube_index_count() {
        let cube = create_cube();

        // Cube should have 36 indices (6 per face * 6 faces)
        assert_eq!(cube.indices.len(), 36);
    }

    #[test]
    fn test_create_cube_triangles() {
        let cube = create_cube();

        // All indices should be valid (< vertex count)
        for &index in &cube.indices {
            assert!((index as usize) < cube.vertices.len());
        }

        // Should form 12 triangles (2 per face * 6 faces)
        assert_eq!(cube.indices.len() % 3, 0);
        assert_eq!(cube.indices.len() / 3, 12);
    }

    #[test]
    fn test_create_cube_normals() {
        let cube = create_cube();

        // Check that normals are unit length
        for vertex in &cube.vertices {
            let normal_length_sq = vertex.normal[0] * vertex.normal[0]
                + vertex.normal[1] * vertex.normal[1]
                + vertex.normal[2] * vertex.normal[2];

            assert!((normal_length_sq - 1.0).abs() < 0.001);
        }
    }

    #[test]
    fn test_create_cube_uvs() {
        let cube = create_cube();

        // Check that UVs are in valid range [0, 1]
        for vertex in &cube.vertices {
            assert!(vertex.uv[0] >= 0.0 && vertex.uv[0] <= 1.0);
            assert!(vertex.uv[1] >= 0.0 && vertex.uv[1] <= 1.0);
        }
    }

    #[test]
    fn test_create_sphere_basic() {
        let sphere = create_sphere(16, 8);

        // Should have vertices
        assert!(sphere.vertices.len() > 0);

        // Should have indices
        assert!(sphere.indices.len() > 0);

        // Indices should be divisible by 3 (triangles)
        assert_eq!(sphere.indices.len() % 3, 0);
    }

    #[test]
    fn test_create_sphere_vertex_count() {
        let segments = 16;
        let rings = 8;
        let sphere = create_sphere(segments, rings);

        // Expected vertex count: (rings + 1) * (segments + 1)
        let expected_vertices = ((rings + 1) * (segments + 1)) as usize;
        assert_eq!(sphere.vertices.len(), expected_vertices);
    }

    #[test]
    fn test_create_sphere_normals_unit_length() {
        let sphere = create_sphere(16, 8);

        // For a unit sphere, normals should be unit length
        for vertex in &sphere.vertices {
            let normal_length_sq = vertex.normal[0] * vertex.normal[0]
                + vertex.normal[1] * vertex.normal[1]
                + vertex.normal[2] * vertex.normal[2];

            assert!((normal_length_sq - 1.0).abs() < 0.001);
        }
    }

    #[test]
    fn test_create_sphere_positions_unit_radius() {
        let sphere = create_sphere(16, 8);

        // For a unit sphere, all positions should be approximately 1.0 from origin
        for vertex in &sphere.vertices {
            let distance_sq = vertex.position[0] * vertex.position[0]
                + vertex.position[1] * vertex.position[1]
                + vertex.position[2] * vertex.position[2];

            assert!((distance_sq - 1.0).abs() < 0.001);
        }
    }

    #[test]
    fn test_create_sphere_uvs() {
        let sphere = create_sphere(16, 8);

        // Check that UVs are in valid range [0, 1]
        for vertex in &sphere.vertices {
            assert!(vertex.uv[0] >= 0.0 && vertex.uv[0] <= 1.0);
            assert!(vertex.uv[1] >= 0.0 && vertex.uv[1] <= 1.0);
        }
    }

    #[test]
    fn test_create_sphere_valid_indices() {
        let sphere = create_sphere(16, 8);

        // All indices should be valid
        for &index in &sphere.indices {
            assert!((index as usize) < sphere.vertices.len());
        }
    }

    #[test]
    fn test_create_plane_vertex_count() {
        let plane = create_plane(10.0);

        // Plane should have 4 vertices (quad)
        assert_eq!(plane.vertices.len(), 4);
    }

    #[test]
    fn test_create_plane_index_count() {
        let plane = create_plane(10.0);

        // Plane should have 6 indices (2 triangles)
        assert_eq!(plane.indices.len(), 6);
    }

    #[test]
    fn test_create_plane_size() {
        let size = 10.0;
        let plane = create_plane(size);
        let half = size / 2.0;

        // Check that vertices are at correct positions
        let positions: Vec<[f32; 3]> = plane.vertices.iter().map(|v| v.position).collect();

        // Should contain corners at ±half
        assert!(positions.contains(&[-half, 0.0, -half]));
        assert!(positions.contains(&[half, 0.0, -half]));
        assert!(positions.contains(&[half, 0.0, half]));
        assert!(positions.contains(&[-half, 0.0, half]));
    }

    #[test]
    fn test_create_plane_normals() {
        let plane = create_plane(10.0);

        // All normals should point up (Y+)
        for vertex in &plane.vertices {
            assert_eq!(vertex.normal[0], 0.0);
            assert_eq!(vertex.normal[1], 1.0);
            assert_eq!(vertex.normal[2], 0.0);
        }
    }

    #[test]
    fn test_create_plane_uvs() {
        let plane = create_plane(10.0);

        // Check that UVs cover the full texture
        let uvs: Vec<[f32; 2]> = plane.vertices.iter().map(|v| v.uv).collect();

        assert!(uvs.contains(&[0.0, 0.0]));
        assert!(uvs.contains(&[1.0, 0.0]));
        assert!(uvs.contains(&[1.0, 1.0]));
        assert!(uvs.contains(&[0.0, 1.0]));
    }

    #[test]
    fn test_create_plane_valid_indices() {
        let plane = create_plane(10.0);

        // All indices should be valid (< 4)
        for &index in &plane.indices {
            assert!((index as usize) < plane.vertices.len());
        }
    }

    #[test]
    fn test_different_sphere_sizes() {
        // Test that different segment/ring counts work
        let small = create_sphere(8, 4);
        let medium = create_sphere(16, 8);
        let large = create_sphere(32, 16);

        assert!(small.vertices.len() < medium.vertices.len());
        assert!(medium.vertices.len() < large.vertices.len());
    }

    #[test]
    fn test_different_plane_sizes() {
        let small = create_plane(1.0);
        let large = create_plane(100.0);

        // Both should have same structure (4 vertices, 6 indices)
        assert_eq!(small.vertices.len(), large.vertices.len());
        assert_eq!(small.indices.len(), large.indices.len());
    }
}
