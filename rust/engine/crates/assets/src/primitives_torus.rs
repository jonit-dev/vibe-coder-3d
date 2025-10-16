/// Torus and torus knot primitives
///
/// Matches Three.js TorusGeometry and TorusKnotGeometry
use std::f32::consts::PI;

use super::vertex::Vertex;
use super::vertex_builder::{ring_strip_indices, vertex_pnu};
use super::Mesh;

/// Generate a torus mesh matching Three.js TorusGeometry(radius, tube, radialSegments, tubularSegments)
///
/// # Arguments
/// * `radius` - Torus major radius (distance from center to tube center, default: 0.5)
/// * `tube` - Tube radius (default: 0.2)
/// * `radial_segments` - Number of segments along tube circumference (default: 16)
/// * `tubular_segments` - Number of segments around torus ring (default: 100)
///
/// # Three.js Match
/// `new THREE.TorusGeometry(0.5, 0.2, 16, 100)` → `create_torus(0.5, 0.2, 16, 100)`
pub fn create_torus(
    radius: f32,
    tube: f32,
    radial_segments: u32,
    tubular_segments: u32,
) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Generate vertices
    for j in 0..=radial_segments {
        let v = j as f32 / radial_segments as f32;
        let phi = v * 2.0 * PI;

        for i in 0..=tubular_segments {
            let u = i as f32 / tubular_segments as f32;
            let theta = u * 2.0 * PI;

            // Position on major circle
            let cos_theta = theta.cos();
            let sin_theta = theta.sin();

            // Position on tube circle
            let cos_phi = phi.cos();
            let sin_phi = phi.sin();

            // Final position
            let x = (radius + tube * cos_phi) * cos_theta;
            let y = (radius + tube * cos_phi) * sin_theta;
            let z = tube * sin_phi;

            // Normal points radially outward from tube center
            let center_x = radius * cos_theta;
            let center_y = radius * sin_theta;
            let center_z = 0.0;

            let normal_x = x - center_x;
            let normal_y = y - center_y;
            let normal_z = z - center_z;
            let normal_len = (normal_x * normal_x + normal_y * normal_y + normal_z * normal_z).sqrt();

            let normal = [
                normal_x / normal_len,
                normal_y / normal_len,
                normal_z / normal_len,
            ];

            vertices.push(vertex_pnu([x, y, z], normal, [u, v]));
        }
    }

    // Generate indices
    for j in 0..radial_segments {
        let ring_start = j * (tubular_segments + 1);
        let next_ring_start = (j + 1) * (tubular_segments + 1);

        let ring_indices = ring_strip_indices(ring_start, next_ring_start, tubular_segments);
        indices.extend(ring_indices);
    }

    Mesh::new(vertices, indices)
}

/// Generate a torus knot mesh matching Three.js TorusKnotGeometry
///
/// # Arguments
/// * `radius` - Major radius (default: 0.4)
/// * `tube` - Tube radius (default: 0.1)
/// * `tubular_segments` - Segments along the knot path (default: 64)
/// * `radial_segments` - Segments around tube (default: 8)
/// * `p` - Number of times the knot winds around the torus (default: 2)
/// * `q` - Number of times the knot winds through the torus hole (default: 3)
///
/// # Three.js Match
/// `new THREE.TorusKnotGeometry(0.4, 0.1, 64, 8, 2, 3)` → `create_torus_knot(0.4, 0.1, 64, 8, 2, 3)`
pub fn create_torus_knot(
    radius: f32,
    tube: f32,
    tubular_segments: u32,
    radial_segments: u32,
    p: u32,
    q: u32,
) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Helper function to compute position on torus knot
    let calculate_position_on_curve = |t: f32| -> [f32; 3] {
        let p_float = p as f32;
        let q_float = q as f32;
        let u = t * p_float;
        let v = t * q_float;

        let qu_over_p = q_float / p_float * t;
        let cos_qu = qu_over_p.cos();
        let sin_qu = qu_over_p.sin();

        let cs = (1.5 + cos_qu).cos();
        let ss = (1.5 + cos_qu).sin();

        [
            radius * (2.0 + cs) * 0.5 * u.cos(),
            radius * (2.0 + cs) * u.sin() * 0.5,
            radius * ss * 0.5,
        ]
    };

    // Generate vertices
    for i in 0..=tubular_segments {
        let u = i as f32 / tubular_segments as f32;
        let t = u * 2.0 * PI;

        // Current point on curve
        let p1 = calculate_position_on_curve(t);

        // Next point on curve (for tangent calculation)
        let t_next = (u + 0.01) * 2.0 * PI;
        let p2 = calculate_position_on_curve(t_next);

        // Tangent (derivative of curve)
        let tangent_x = p2[0] - p1[0];
        let tangent_y = p2[1] - p1[1];
        let tangent_z = p2[2] - p1[2];
        let tangent_len = (tangent_x * tangent_x + tangent_y * tangent_y + tangent_z * tangent_z).sqrt();
        let tangent = [
            tangent_x / tangent_len,
            tangent_y / tangent_len,
            tangent_z / tangent_len,
        ];

        // Compute normal (perpendicular to tangent)
        let normal = if tangent[0].abs() > 0.9 {
            [0.0, 1.0, 0.0]
        } else {
            [1.0, 0.0, 0.0]
        };

        // Binormal (cross product of tangent and normal)
        let binormal_x = tangent[1] * normal[2] - tangent[2] * normal[1];
        let binormal_y = tangent[2] * normal[0] - tangent[0] * normal[2];
        let binormal_z = tangent[0] * normal[1] - tangent[1] * normal[0];
        let binormal_len = (binormal_x * binormal_x + binormal_y * binormal_y + binormal_z * binormal_z).sqrt();
        let binormal = [
            binormal_x / binormal_len,
            binormal_y / binormal_len,
            binormal_z / binormal_len,
        ];

        // Recompute normal (cross product of binormal and tangent)
        let normal_x = binormal[1] * tangent[2] - binormal[2] * tangent[1];
        let normal_y = binormal[2] * tangent[0] - binormal[0] * tangent[2];
        let normal_z = binormal[0] * tangent[1] - binormal[1] * tangent[0];

        // Generate tube vertices around this point
        for j in 0..=radial_segments {
            let v = j as f32 / radial_segments as f32;
            let phi = v * 2.0 * PI;

            let cos_phi = phi.cos();
            let sin_phi = phi.sin();

            // Point on tube circle
            let offset_x = tube * (cos_phi * normal_x + sin_phi * binormal[0]);
            let offset_y = tube * (cos_phi * normal_y + sin_phi * binormal[1]);
            let offset_z = tube * (cos_phi * normal_z + sin_phi * binormal[2]);

            let x = p1[0] + offset_x;
            let y = p1[1] + offset_y;
            let z = p1[2] + offset_z;

            // Normal for tube
            let tube_normal = [
                cos_phi * normal_x + sin_phi * binormal[0],
                cos_phi * normal_y + sin_phi * binormal[1],
                cos_phi * normal_z + sin_phi * binormal[2],
            ];

            vertices.push(vertex_pnu([x, y, z], tube_normal, [u, v]));
        }
    }

    // Generate indices
    for i in 0..tubular_segments {
        let ring_start = i * (radial_segments + 1);
        let next_ring_start = (i + 1) * (radial_segments + 1);

        let ring_indices = ring_strip_indices(ring_start, next_ring_start, radial_segments);
        indices.extend(ring_indices);
    }

    Mesh::new(vertices, indices)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_torus_vertex_count() {
        let mesh = create_torus(0.5, 0.2, 16, 100);

        // Vertices: (radial_segments+1) * (tubular_segments+1) = 17 * 101 = 1717
        assert_eq!(mesh.vertices.len(), 1717);

        // Indices: radial_segments * tubular_segments * 6 = 16 * 100 * 6 = 9600
        assert_eq!(mesh.indices.len(), 9600);
    }

    #[test]
    fn test_torus_knot_vertex_count() {
        let mesh = create_torus_knot(0.4, 0.1, 64, 8, 2, 3);

        // Vertices: (tubular_segments+1) * (radial_segments+1) = 65 * 9 = 585
        assert_eq!(mesh.vertices.len(), 585);

        // Indices: tubular_segments * radial_segments * 6 = 64 * 8 * 6 = 3072
        assert_eq!(mesh.indices.len(), 3072);
    }

    #[test]
    fn test_torus_normals_unit_length() {
        let mesh = create_torus(0.5, 0.2, 8, 16);

        for vertex in &mesh.vertices {
            let normal = vertex.normal;
            let len_sq = normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2];
            let len = len_sq.sqrt();
            assert!((len - 1.0).abs() < 0.01, "Normal not unit length: {}", len);
        }
    }

    #[test]
    fn test_torus_uv_bounds() {
        let mesh = create_torus(0.5, 0.2, 16, 100);

        for vertex in &mesh.vertices {
            assert!(
                vertex.uv[0] >= 0.0 && vertex.uv[0] <= 1.0,
                "UV u out of bounds: {}",
                vertex.uv[0]
            );
            assert!(
                vertex.uv[1] >= 0.0 && vertex.uv[1] <= 1.0,
                "UV v out of bounds: {}",
                vertex.uv[1]
            );
        }
    }

    #[test]
    fn test_torus_major_radius() {
        let mesh = create_torus(1.0, 0.1, 8, 16);

        // Check that some vertices are approximately at major radius distance from origin
        let mut found_major_radius = false;
        for vertex in &mesh.vertices {
            let radius_xy = (vertex.position[0] * vertex.position[0]
                           + vertex.position[1] * vertex.position[1]).sqrt();

            // Tube center should be at major radius ± tube radius
            if (radius_xy - 1.0).abs() < 0.15 {
                found_major_radius = true;
                break;
            }
        }
        assert!(found_major_radius, "Torus major radius incorrect");
    }
}
