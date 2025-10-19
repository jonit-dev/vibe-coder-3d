/// Environment primitives: tree, rock, bush, grass
///
/// These shapes are commonly used for procedural environment generation.
/// Note: For production use, GLTF models are recommended for better visual quality.
use std::f32::consts::PI;

use super::vertex::Vertex;
use super::vertex_builder::vertex_pnu;
use super::Mesh;

/// Create a simple tree shape
///
/// Creates a stylized tree with a cylindrical trunk and conical foliage.
///
/// # Arguments
/// * `trunk_radius` - Radius of the trunk (default: 0.1)
/// * `trunk_height` - Height of the trunk (default: 1.0)
/// * `foliage_radius` - Radius of foliage cone base (default: 0.5)
/// * `foliage_height` - Height of foliage cone (default: 1.0)
/// * `segments` - Number of segments around circumference (default: 8)
pub fn create_tree(
    trunk_radius: f32,
    trunk_height: f32,
    foliage_radius: f32,
    foliage_height: f32,
    segments: u32,
) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let angle_step = (2.0 * PI) / segments as f32;

    // --- Trunk (cylinder) ---

    // Bottom cap
    let trunk_bottom_center_idx = vertices.len() as u32;
    vertices.push(vertex_pnu([0.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.5, 0.5]));

    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let x = trunk_radius * angle.cos();
        let z = trunk_radius * angle.sin();
        vertices.push(vertex_pnu([x, 0.0, z], [0.0, -1.0, 0.0], [0.0, 0.0]));
    }

    for i in 0..segments {
        let next = (i + 1) % segments;
        indices.extend_from_slice(&[
            trunk_bottom_center_idx,
            trunk_bottom_center_idx + next + 1,
            trunk_bottom_center_idx + i + 1,
        ]);
    }

    // Trunk sides
    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let next_angle = ((i + 1) % segments) as f32 * angle_step;

        let x1 = trunk_radius * angle.cos();
        let z1 = trunk_radius * angle.sin();
        let x2 = trunk_radius * next_angle.cos();
        let z2 = trunk_radius * next_angle.sin();

        let normal1 = [angle.cos(), 0.0, angle.sin()];
        let normal2 = [next_angle.cos(), 0.0, next_angle.sin()];

        let side_base = vertices.len() as u32;
        vertices.push(vertex_pnu([x1, 0.0, z1], normal1, [0.0, 0.0]));
        vertices.push(vertex_pnu([x2, 0.0, z2], normal2, [1.0, 0.0]));
        vertices.push(vertex_pnu([x2, trunk_height, z2], normal2, [1.0, 1.0]));
        vertices.push(vertex_pnu([x1, trunk_height, z1], normal1, [0.0, 1.0]));

        indices.extend_from_slice(&[
            side_base,
            side_base + 1,
            side_base + 2,
            side_base + 2,
            side_base + 3,
            side_base,
        ]);
    }

    // Top cap
    let trunk_top_center_idx = vertices.len() as u32;
    vertices.push(vertex_pnu(
        [0.0, trunk_height, 0.0],
        [0.0, 1.0, 0.0],
        [0.5, 0.5],
    ));

    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let x = trunk_radius * angle.cos();
        let z = trunk_radius * angle.sin();
        vertices.push(vertex_pnu([x, trunk_height, z], [0.0, 1.0, 0.0], [0.0, 0.0]));
    }

    for i in 0..segments {
        let next = (i + 1) % segments;
        indices.extend_from_slice(&[
            trunk_top_center_idx,
            trunk_top_center_idx + i + 1,
            trunk_top_center_idx + next + 1,
        ]);
    }

    // --- Foliage (cone) ---

    let foliage_base_y = trunk_height;
    let foliage_tip_y = trunk_height + foliage_height;

    // Bottom cap
    let foliage_bottom_center_idx = vertices.len() as u32;
    vertices.push(vertex_pnu(
        [0.0, foliage_base_y, 0.0],
        [0.0, -1.0, 0.0],
        [0.5, 0.5],
    ));

    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let x = foliage_radius * angle.cos();
        let z = foliage_radius * angle.sin();
        vertices.push(vertex_pnu([x, foliage_base_y, z], [0.0, -1.0, 0.0], [0.0, 0.0]));
    }

    for i in 0..segments {
        let next = (i + 1) % segments;
        indices.extend_from_slice(&[
            foliage_bottom_center_idx,
            foliage_bottom_center_idx + next + 1,
            foliage_bottom_center_idx + i + 1,
        ]);
    }

    // Cone sides
    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let next_angle = ((i + 1) % segments) as f32 * angle_step;

        let x1 = foliage_radius * angle.cos();
        let z1 = foliage_radius * angle.sin();
        let x2 = foliage_radius * next_angle.cos();
        let z2 = foliage_radius * next_angle.sin();

        // Normal for cone (pointing outward and up)
        let slope = foliage_radius / foliage_height;
        let normal_y = slope / (1.0 + slope * slope).sqrt();
        let normal_xz = 1.0 / (1.0 + slope * slope).sqrt();

        let normal1 = [normal_xz * angle.cos(), normal_y, normal_xz * angle.sin()];
        let normal2 = [
            normal_xz * next_angle.cos(),
            normal_y,
            normal_xz * next_angle.sin(),
        ];

        let cone_base = vertices.len() as u32;
        vertices.push(vertex_pnu([x1, foliage_base_y, z1], normal1, [0.0, 0.0]));
        vertices.push(vertex_pnu([x2, foliage_base_y, z2], normal2, [1.0, 0.0]));
        vertices.push(vertex_pnu([0.0, foliage_tip_y, 0.0], normal2, [0.5, 1.0]));

        indices.extend_from_slice(&[cone_base, cone_base + 1, cone_base + 2]);
    }

    Mesh::new(vertices, indices)
}

/// Create a rock shape (irregular deformed sphere)
///
/// Creates a rock-like shape by deforming a sphere with pseudo-random perturbations.
///
/// # Arguments
/// * `radius` - Base radius of the rock (default: 0.5)
/// * `irregularity` - Amount of deformation (0.0 = sphere, 1.0 = very irregular, default: 0.3)
/// * `segments` - Number of segments (default: 16)
pub fn create_rock(radius: f32, irregularity: f32, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    // Simple pseudo-random function (deterministic based on position)
    let pseudo_random = |x: f32, y: f32, z: f32| -> f32 {
        let dot = x * 12.9898 + y * 78.233 + z * 45.164;
        (dot.sin() * 43758.5453).fract()
    };

    // Create icosphere-like structure
    let rings = segments;
    let sectors = segments * 2;

    // Top vertex
    let top_idx = vertices.len() as u32;
    let top_perturb = 1.0 + (pseudo_random(0.0, 1.0, 0.0) - 0.5) * irregularity;
    vertices.push(vertex_pnu(
        [0.0, radius * top_perturb, 0.0],
        [0.0, 1.0, 0.0],
        [0.5, 0.0],
    ));

    // Middle rings
    for ring in 1..rings {
        let theta = (ring as f32 / rings as f32) * PI;
        let sin_theta = theta.sin();
        let cos_theta = theta.cos();

        for sector in 0..sectors {
            let phi = (sector as f32 / sectors as f32) * 2.0 * PI;
            let sin_phi = phi.sin();
            let cos_phi = phi.cos();

            let x = sin_theta * cos_phi;
            let y = cos_theta;
            let z = sin_theta * sin_phi;

            // Add irregularity
            let perturb = 1.0 + (pseudo_random(x, y, z) - 0.5) * irregularity;

            let px = radius * x * perturb;
            let py = radius * y * perturb;
            let pz = radius * z * perturb;

            // Approximate normal (pointing outward)
            let normal_len = (px * px + py * py + pz * pz).sqrt();
            let normal = [px / normal_len, py / normal_len, pz / normal_len];

            let u = sector as f32 / sectors as f32;
            let v = ring as f32 / rings as f32;

            vertices.push(vertex_pnu([px, py, pz], normal, [u, v]));
        }
    }

    // Bottom vertex
    let bottom_idx = vertices.len() as u32;
    let bottom_perturb = 1.0 + (pseudo_random(0.0, -1.0, 0.0) - 0.5) * irregularity;
    vertices.push(vertex_pnu(
        [0.0, -radius * bottom_perturb, 0.0],
        [0.0, -1.0, 0.0],
        [0.5, 1.0],
    ));

    // Top cap triangles
    for sector in 0..sectors {
        let next_sector = (sector + 1) % sectors;
        indices.extend_from_slice(&[top_idx, 1 + sector, 1 + next_sector]);
    }

    // Middle rings
    for ring in 0..(rings - 2) {
        let ring_start = 1 + ring * sectors;
        let next_ring_start = 1 + (ring + 1) * sectors;

        for sector in 0..sectors {
            let next_sector = (sector + 1) % sectors;

            let idx0 = ring_start + sector;
            let idx1 = ring_start + next_sector;
            let idx2 = next_ring_start + next_sector;
            let idx3 = next_ring_start + sector;

            indices.extend_from_slice(&[idx0, idx1, idx2, idx2, idx3, idx0]);
        }
    }

    // Bottom cap triangles
    let last_ring_start = 1 + (rings - 2) * sectors;
    for sector in 0..sectors {
        let next_sector = (sector + 1) % sectors;
        indices.extend_from_slice(&[bottom_idx, last_ring_start + next_sector, last_ring_start + sector]);
    }

    Mesh::new(vertices, indices)
}

/// Create a bush shape (spherical foliage cluster)
///
/// Creates a bush-like shape using a low-poly deformed sphere.
///
/// # Arguments
/// * `radius` - Radius of the bush (default: 0.5)
/// * `segments` - Number of segments (default: 8)
pub fn create_bush(radius: f32, segments: u32) -> Mesh {
    // Bush is essentially a low-poly sphere with slight irregularity
    create_rock(radius, 0.15, segments)
}

/// Create grass blades
///
/// Creates a cluster of grass blades using simple quad geometry.
///
/// # Arguments
/// * `blade_width` - Width of each grass blade (default: 0.05)
/// * `blade_height` - Height of each grass blade (default: 0.3)
/// * `num_blades` - Number of grass blades in cluster (default: 5)
pub fn create_grass(blade_width: f32, blade_height: f32, num_blades: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_width = blade_width / 2.0;

    // Simple pseudo-random for blade positioning
    let pseudo_random = |i: u32, seed: f32| -> f32 {
        let x = (i as f32 + seed) * 12.9898;
        (x.sin() * 43758.5453).fract()
    };

    for i in 0..num_blades {
        // Random offset and rotation for each blade
        let offset_x = (pseudo_random(i, 1.0) - 0.5) * blade_width * 2.0;
        let offset_z = (pseudo_random(i, 2.0) - 0.5) * blade_width * 2.0;
        let rotation = pseudo_random(i, 3.0) * 2.0 * PI;

        let cos_rot = rotation.cos();
        let sin_rot = rotation.sin();

        // Blade vertices (quad, slightly curved)
        let base_idx = vertices.len() as u32;

        // Bottom vertices
        let bx1 = offset_x + (-half_width) * cos_rot;
        let bz1 = offset_z + (-half_width) * sin_rot;
        let bx2 = offset_x + half_width * cos_rot;
        let bz2 = offset_z + half_width * sin_rot;

        // Top vertices (slight inward curve)
        let top_curve = 0.8;
        let tx1 = offset_x + (-half_width * top_curve) * cos_rot;
        let tz1 = offset_z + (-half_width * top_curve) * sin_rot;
        let tx2 = offset_x + (half_width * top_curve) * cos_rot;
        let tz2 = offset_z + (half_width * top_curve) * sin_rot;

        // Normal (facing forward, perpendicular to blade)
        let normal = [-sin_rot, 0.0, cos_rot];

        vertices.push(vertex_pnu([bx1, 0.0, bz1], normal, [0.0, 0.0]));
        vertices.push(vertex_pnu([bx2, 0.0, bz2], normal, [1.0, 0.0]));
        vertices.push(vertex_pnu([tx2, blade_height, tz2], normal, [1.0, 1.0]));
        vertices.push(vertex_pnu([tx1, blade_height, tz1], normal, [0.0, 1.0]));

        // Two triangles (double-sided by duplicating with reversed winding)
        indices.extend_from_slice(&[
            base_idx,
            base_idx + 1,
            base_idx + 2,
            base_idx + 2,
            base_idx + 3,
            base_idx,
        ]);

        // Back face (reversed winding, same vertices but negative normal)
        let back_normal = [sin_rot, 0.0, -cos_rot];
        let back_base = vertices.len() as u32;

        vertices.push(vertex_pnu([bx1, 0.0, bz1], back_normal, [0.0, 0.0]));
        vertices.push(vertex_pnu([bx2, 0.0, bz2], back_normal, [1.0, 0.0]));
        vertices.push(vertex_pnu([tx2, blade_height, tz2], back_normal, [1.0, 1.0]));
        vertices.push(vertex_pnu([tx1, blade_height, tz1], back_normal, [0.0, 1.0]));

        indices.extend_from_slice(&[
            back_base,
            back_base + 3,
            back_base + 2,
            back_base + 2,
            back_base + 1,
            back_base,
        ]);
    }

    Mesh::new(vertices, indices)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tree_has_vertices() {
        let mesh = create_tree(0.1, 1.0, 0.5, 1.0, 8);
        assert!(mesh.vertices.len() > 0, "Tree should have vertices");
        assert!(mesh.indices.len() > 0, "Tree should have indices");
    }

    #[test]
    fn test_rock_has_vertices() {
        let mesh = create_rock(0.5, 0.3, 16);
        assert!(mesh.vertices.len() > 0, "Rock should have vertices");
        assert!(mesh.indices.len() > 0, "Rock should have indices");
    }

    #[test]
    fn test_bush_has_vertices() {
        let mesh = create_bush(0.5, 8);
        assert!(mesh.vertices.len() > 0, "Bush should have vertices");
        assert!(mesh.indices.len() > 0, "Bush should have indices");
    }

    #[test]
    fn test_grass_has_vertices() {
        let mesh = create_grass(0.05, 0.3, 5);
        assert!(mesh.vertices.len() > 0, "Grass should have vertices");
        assert!(mesh.indices.len() > 0, "Grass should have indices");
    }

    #[test]
    fn test_rock_irregularity() {
        let sphere = create_rock(0.5, 0.0, 16);
        let rock = create_rock(0.5, 0.5, 16);

        // Both should have same vertex count but different positions
        assert_eq!(
            sphere.vertices.len(),
            rock.vertices.len(),
            "Irregularity should not change vertex count"
        );
    }
}
