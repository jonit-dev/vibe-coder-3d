use bytemuck::{Pod, Zeroable};
use glam::{Vec2, Vec3};

#[repr(C)]
#[derive(Copy, Clone, Debug, Pod, Zeroable)]
pub struct Vertex {
    pub position: [f32; 3],
    pub normal: [f32; 3],
    pub uv: [f32; 2],
    pub tangent: [f32; 4],
}

impl Vertex {
    pub fn desc() -> wgpu::VertexBufferLayout<'static> {
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Vertex>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &[
                // Position
                wgpu::VertexAttribute {
                    offset: 0,
                    shader_location: 0,
                    format: wgpu::VertexFormat::Float32x3,
                },
                // Normal
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 3]>() as wgpu::BufferAddress,
                    shader_location: 1,
                    format: wgpu::VertexFormat::Float32x3,
                },
                // UV
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 6]>() as wgpu::BufferAddress,
                    shader_location: 2,
                    format: wgpu::VertexFormat::Float32x2,
                },
                // Tangent (xyz) + handedness (w)
                wgpu::VertexAttribute {
                    offset: std::mem::size_of::<[f32; 8]>() as wgpu::BufferAddress,
                    shader_location: 3,
                    format: wgpu::VertexFormat::Float32x4,
                },
            ],
        }
    }
}

pub struct Mesh {
    pub vertices: Vec<Vertex>,
    pub indices: Vec<u32>,
}

impl Mesh {
    pub fn new(vertices: Vec<Vertex>, indices: Vec<u32>) -> Self {
        let mut mesh = Self { vertices, indices };
        compute_tangents(&mut mesh.vertices, &mesh.indices);
        mesh
    }
}

fn compute_tangents(vertices: &mut [Vertex], indices: &[u32]) {
    if vertices.is_empty() || indices.len() < 3 {
        for vertex in vertices.iter_mut() {
            vertex.tangent = [1.0, 0.0, 0.0, 1.0];
        }
        return;
    }

    let mut tan1 = vec![Vec3::ZERO; vertices.len()];
    let mut tan2 = vec![Vec3::ZERO; vertices.len()];

    for triangle in indices.chunks_exact(3) {
        let i0 = triangle[0] as usize;
        let i1 = triangle[1] as usize;
        let i2 = triangle[2] as usize;

        if i0 >= vertices.len() || i1 >= vertices.len() || i2 >= vertices.len() {
            continue;
        }

        let p0 = Vec3::from_array(vertices[i0].position);
        let p1 = Vec3::from_array(vertices[i1].position);
        let p2 = Vec3::from_array(vertices[i2].position);

        let uv0 = Vec2::from_array(vertices[i0].uv);
        let uv1 = Vec2::from_array(vertices[i1].uv);
        let uv2 = Vec2::from_array(vertices[i2].uv);

        let delta_pos1 = p1 - p0;
        let delta_pos2 = p2 - p0;
        let delta_uv1 = uv1 - uv0;
        let delta_uv2 = uv2 - uv0;

        let denom = delta_uv1.x * delta_uv2.y - delta_uv1.y * delta_uv2.x;
        if denom.abs() < 1e-6 {
            continue;
        }
        let r = 1.0 / denom;

        let tangent = (delta_pos1 * delta_uv2.y - delta_pos2 * delta_uv1.y) * r;
        let bitangent = (delta_pos2 * delta_uv1.x - delta_pos1 * delta_uv2.x) * r;

        tan1[i0] += tangent;
        tan1[i1] += tangent;
        tan1[i2] += tangent;

        tan2[i0] += bitangent;
        tan2[i1] += bitangent;
        tan2[i2] += bitangent;
    }

    for (i, vertex) in vertices.iter_mut().enumerate() {
        let normal = Vec3::from_array(vertex.normal).normalize_or_zero();
        let mut tangent = tan1[i];

        if tangent.length_squared() < 1e-10 {
            // Fallback tangent orthogonal to normal
            let fallback = if normal.x.abs() > 0.9 {
                Vec3::new(0.0, 0.0, 1.0)
            } else {
                Vec3::new(1.0, 0.0, 0.0)
            };
            tangent = (fallback - normal * normal.dot(fallback)).normalize_or_zero();
            vertex.tangent = [tangent.x, tangent.y, tangent.z, 1.0];
            continue;
        }

        tangent = (tangent - normal * normal.dot(tangent)).normalize_or_zero();
        if tangent.length_squared() < 1e-10 {
            tangent = Vec3::new(1.0, 0.0, 0.0);
        }

        let bitangent = tan2[i];
        let handedness = if normal.cross(tangent).dot(bitangent) < 0.0 {
            -1.0
        } else {
            1.0
        };

        vertex.tangent = [tangent.x, tangent.y, tangent.z, handedness];
    }
}
