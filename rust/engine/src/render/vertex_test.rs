#[cfg(test)]
mod tests {
    use super::super::vertex::{Mesh, Vertex};

    #[test]
    fn test_vertex_creation() {
        let vertex = Vertex {
            position: [1.0, 2.0, 3.0],
            normal: [0.0, 1.0, 0.0],
            uv: [0.5, 0.5],
        };

        assert_eq!(vertex.position, [1.0, 2.0, 3.0]);
        assert_eq!(vertex.normal, [0.0, 1.0, 0.0]);
        assert_eq!(vertex.uv, [0.5, 0.5]);
    }

    #[test]
    fn test_vertex_size() {
        // Verify vertex size matches expected layout (3 + 3 + 2 floats = 8 floats = 32 bytes)
        let size = std::mem::size_of::<Vertex>();
        assert_eq!(size, 32);
    }

    #[test]
    fn test_vertex_desc_array_stride() {
        let desc = Vertex::desc();

        // Array stride should match vertex size
        assert_eq!(desc.array_stride, std::mem::size_of::<Vertex>() as u64);
    }

    #[test]
    fn test_vertex_desc_step_mode() {
        let desc = Vertex::desc();

        // Should use Vertex step mode
        assert_eq!(desc.step_mode, wgpu::VertexStepMode::Vertex);
    }

    #[test]
    fn test_vertex_desc_attributes_count() {
        let desc = Vertex::desc();

        // Should have 3 attributes (position, normal, uv)
        assert_eq!(desc.attributes.len(), 3);
    }

    #[test]
    fn test_vertex_desc_position_attribute() {
        let desc = Vertex::desc();
        let position_attr = &desc.attributes[0];

        assert_eq!(position_attr.offset, 0);
        assert_eq!(position_attr.shader_location, 0);
        assert_eq!(position_attr.format, wgpu::VertexFormat::Float32x3);
    }

    #[test]
    fn test_vertex_desc_normal_attribute() {
        let desc = Vertex::desc();
        let normal_attr = &desc.attributes[1];

        assert_eq!(
            normal_attr.offset,
            std::mem::size_of::<[f32; 3]>() as u64
        );
        assert_eq!(normal_attr.shader_location, 1);
        assert_eq!(normal_attr.format, wgpu::VertexFormat::Float32x3);
    }

    #[test]
    fn test_vertex_desc_uv_attribute() {
        let desc = Vertex::desc();
        let uv_attr = &desc.attributes[2];

        assert_eq!(uv_attr.offset, std::mem::size_of::<[f32; 6]>() as u64);
        assert_eq!(uv_attr.shader_location, 2);
        assert_eq!(uv_attr.format, wgpu::VertexFormat::Float32x2);
    }

    #[test]
    fn test_mesh_new() {
        let vertices = vec![
            Vertex {
                position: [0.0, 0.0, 0.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [1.0, 0.0, 0.0],
                normal: [0.0, 1.0, 0.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.5, 1.0, 0.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.5, 1.0],
            },
        ];

        let indices = vec![0, 1, 2];

        let mesh = Mesh::new(vertices.clone(), indices.clone());

        assert_eq!(mesh.vertices.len(), 3);
        assert_eq!(mesh.indices.len(), 3);
        assert_eq!(mesh.vertices[0].position, [0.0, 0.0, 0.0]);
        assert_eq!(mesh.indices[0], 0);
    }

    #[test]
    fn test_mesh_empty() {
        let mesh = Mesh::new(vec![], vec![]);

        assert_eq!(mesh.vertices.len(), 0);
        assert_eq!(mesh.indices.len(), 0);
    }

    #[test]
    fn test_vertex_copy_clone() {
        let v1 = Vertex {
            position: [1.0, 2.0, 3.0],
            normal: [0.0, 1.0, 0.0],
            uv: [0.5, 0.5],
        };

        let v2 = v1; // Copy
        let v3 = v1.clone(); // Clone

        assert_eq!(v1.position, v2.position);
        assert_eq!(v1.position, v3.position);
        assert_eq!(v1.normal, v2.normal);
        assert_eq!(v1.uv, v2.uv);
    }

    #[test]
    fn test_vertex_pod_zeroable() {
        // Test that Vertex can be zero-initialized
        let vertex: Vertex = bytemuck::Zeroable::zeroed();

        assert_eq!(vertex.position, [0.0, 0.0, 0.0]);
        assert_eq!(vertex.normal, [0.0, 0.0, 0.0]);
        assert_eq!(vertex.uv, [0.0, 0.0]);
    }

    #[test]
    fn test_vertex_bytemuck_cast() {
        let vertices = vec![
            Vertex {
                position: [1.0, 2.0, 3.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.5, 0.5],
            },
            Vertex {
                position: [4.0, 5.0, 6.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.25, 0.75],
            },
        ];

        // Test that vertices can be cast to bytes
        let bytes: &[u8] = bytemuck::cast_slice(&vertices);

        // Should be vertex count * vertex size
        assert_eq!(bytes.len(), vertices.len() * std::mem::size_of::<Vertex>());
    }

    #[test]
    fn test_mesh_large() {
        // Test with a larger mesh
        let vertex_count = 1000;
        let mut vertices = Vec::new();
        let mut indices = Vec::new();

        for i in 0..vertex_count {
            vertices.push(Vertex {
                position: [i as f32, 0.0, 0.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.0, 0.0],
            });
            indices.push(i);
        }

        let mesh = Mesh::new(vertices, indices);

        assert_eq!(mesh.vertices.len(), vertex_count as usize);
        assert_eq!(mesh.indices.len(), vertex_count as usize);
    }
}
