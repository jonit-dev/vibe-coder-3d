use super::vertex::{Mesh, Vertex};

/// Generate a cube mesh (1x1x1 centered at origin) to match Three.js BoxGeometry(1,1,1)
pub fn create_cube() -> Mesh {
    let vertices = vec![
        // Front face (z = 0.5)
        Vertex {
            position: [-0.5, -0.5, 0.5],
            normal: [0.0, 0.0, 1.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, -0.5, 0.5],
            normal: [0.0, 0.0, 1.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, 0.5],
            normal: [0.0, 0.0, 1.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, 0.5, 0.5],
            normal: [0.0, 0.0, 1.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        // Back face (z = -0.5)
        Vertex {
            position: [0.5, -0.5, -0.5],
            normal: [0.0, 0.0, -1.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, -0.5, -0.5],
            normal: [0.0, 0.0, -1.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, 0.5, -0.5],
            normal: [0.0, 0.0, -1.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, -0.5],
            normal: [0.0, 0.0, -1.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        // Top face (y = 0.5)
        Vertex {
            position: [-0.5, 0.5, 0.5],
            normal: [0.0, 1.0, 0.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, 0.5],
            normal: [0.0, 1.0, 0.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, -0.5],
            normal: [0.0, 1.0, 0.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, 0.5, -0.5],
            normal: [0.0, 1.0, 0.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        // Bottom face (y = -0.5)
        Vertex {
            position: [-0.5, -0.5, -0.5],
            normal: [0.0, -1.0, 0.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, -0.5, -0.5],
            normal: [0.0, -1.0, 0.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, -0.5, 0.5],
            normal: [0.0, -1.0, 0.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, -0.5, 0.5],
            normal: [0.0, -1.0, 0.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        // Right face (x = 0.5)
        Vertex {
            position: [0.5, -0.5, 0.5],
            normal: [1.0, 0.0, 0.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, -0.5, -0.5],
            normal: [1.0, 0.0, 0.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, -0.5],
            normal: [1.0, 0.0, 0.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [0.5, 0.5, 0.5],
            normal: [1.0, 0.0, 0.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        // Left face (x = -0.5)
        Vertex {
            position: [-0.5, -0.5, -0.5],
            normal: [-1.0, 0.0, 0.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, -0.5, 0.5],
            normal: [-1.0, 0.0, 0.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, 0.5, 0.5],
            normal: [-1.0, 0.0, 0.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-0.5, 0.5, -0.5],
            normal: [-1.0, 0.0, 0.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
    ];

    let indices = vec![
        0, 1, 2, 2, 3, 0, // Front
        4, 5, 6, 6, 7, 4, // Back
        8, 9, 10, 10, 11, 8, // Top
        12, 13, 14, 14, 15, 12, // Bottom
        16, 17, 18, 18, 19, 16, // Right
        20, 21, 22, 22, 23, 20, // Left
    ];

    Mesh::new(vertices, indices)
}

/// Generate a sphere mesh (UV sphere) matching Three.js default radius = 0.5
pub fn create_sphere(segments: u32, rings: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Generate vertices
    for ring in 0..=rings {
        let phi = std::f32::consts::PI * ring as f32 / rings as f32;
        let sin_phi = phi.sin();
        let cos_phi = phi.cos();

        for segment in 0..=segments {
            let theta = 2.0 * std::f32::consts::PI * segment as f32 / segments as f32;
            let sin_theta = theta.sin();
            let cos_theta = theta.cos();

            // Radius 0.5 to match Three.js <sphereGeometry args={[0.5, ...]}>
            let r = 0.5;
            let x = r * sin_phi * cos_theta;
            let y = r * cos_phi;
            let z = r * sin_phi * sin_theta;

            let u = segment as f32 / segments as f32;
            let v = ring as f32 / rings as f32;

            vertices.push(Vertex {
                position: [x, y, z],
                normal: [x, y, z], // For unit sphere, normal = position
                uv: [u, v],
                tangent: [0.0, 0.0, 0.0, 1.0],
            });
        }
    }

    // Generate indices
    for ring in 0..rings {
        for segment in 0..segments {
            let current = ring * (segments + 1) + segment;
            let next = current + segments + 1;

            indices.push(current);
            indices.push(next);
            indices.push(current + 1);

            indices.push(current + 1);
            indices.push(next);
            indices.push(next + 1);
        }
    }

    Mesh::new(vertices, indices)
}

/// Generate a plane mesh matching Three.js PlaneGeometry(1,1)
/// Orientation: XY plane facing +Z (so no -90 deg X rotation needed)
pub fn create_plane(size: f32) -> Mesh {
    let half = size / 2.0;
    log::debug!(
        "Creating plane: size={}, half={}, bounds=[{}, {}] to [{}, {}]",
        size,
        half,
        -half,
        -half,
        half,
        half
    );

    let vertices = vec![
        Vertex {
            position: [-half, -half, 0.0],
            normal: [0.0, 0.0, 1.0],
            uv: [0.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [half, -half, 0.0],
            normal: [0.0, 0.0, 1.0],
            uv: [1.0, 1.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [half, half, 0.0],
            normal: [0.0, 0.0, 1.0],
            uv: [1.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
        Vertex {
            position: [-half, half, 0.0],
            normal: [0.0, 0.0, 1.0],
            uv: [0.0, 0.0],
            tangent: [0.0, 0.0, 0.0, 1.0],
        },
    ];

    let indices = vec![0, 1, 2, 2, 3, 0];

    Mesh::new(vertices, indices)
}
