/// Decorative primitives: star, heart, diamond, cross, tube
///
/// These shapes are commonly used for visual effects, UI elements, and decorative objects.
use std::f32::consts::PI;

use super::vertex::Vertex;
use super::vertex_builder::vertex_pnu;
use super::Mesh;

/// Create a star shape (extruded star polygon)
///
/// Creates a 3D star by extruding a star-shaped polygon along the Z axis.
///
/// # Arguments
/// * `radius_outer` - Outer radius of star points (default: 0.5)
/// * `radius_inner` - Inner radius between points (default: 0.25)
/// * `num_points` - Number of star points (default: 5)
/// * `depth` - Extrusion depth (default: 0.2)
pub fn create_star(
    radius_outer: f32,
    radius_inner: f32,
    num_points: u32,
    depth: f32,
) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_depth = depth / 2.0;
    let angle_step = (2.0 * PI) / (num_points as f32);

    // Generate star profile points (alternating outer and inner radii)
    let mut profile_points = Vec::new();
    for i in 0..(num_points * 2) {
        let angle = (i as f32) * angle_step / 2.0 - PI / 2.0; // Start at top
        let radius = if i % 2 == 0 {
            radius_outer
        } else {
            radius_inner
        };
        profile_points.push([radius * angle.cos(), radius * angle.sin()]);
    }

    // Front face (Z = half_depth)
    let front_normal = [0.0, 0.0, 1.0];
    let front_base_idx = vertices.len() as u32;

    // Center vertex for front face
    vertices.push(vertex_pnu([0.0, 0.0, half_depth], front_normal, [0.5, 0.5]));

    for point in &profile_points {
        let u = (point[0] / radius_outer + 1.0) / 2.0;
        let v = (point[1] / radius_outer + 1.0) / 2.0;
        vertices.push(vertex_pnu([point[0], point[1], half_depth], front_normal, [u, v]));
    }

    // Front face triangles (fan from center)
    for i in 0..(num_points * 2) {
        let next = if i == num_points * 2 - 1 { 0 } else { i + 1 };
        indices.extend_from_slice(&[
            front_base_idx,
            front_base_idx + i + 1,
            front_base_idx + next + 1,
        ]);
    }

    // Back face (Z = -half_depth)
    let back_normal = [0.0, 0.0, -1.0];
    let back_base_idx = vertices.len() as u32;

    vertices.push(vertex_pnu([0.0, 0.0, -half_depth], back_normal, [0.5, 0.5]));

    for point in &profile_points {
        let u = (point[0] / radius_outer + 1.0) / 2.0;
        let v = (point[1] / radius_outer + 1.0) / 2.0;
        vertices.push(vertex_pnu([point[0], point[1], -half_depth], back_normal, [u, v]));
    }

    // Back face triangles (fan from center, reversed winding)
    for i in 0..(num_points * 2) {
        let next = if i == num_points * 2 - 1 { 0 } else { i + 1 };
        indices.extend_from_slice(&[
            back_base_idx,
            back_base_idx + next + 1,
            back_base_idx + i + 1,
        ]);
    }

    // Side faces (connect front and back edges)
    for i in 0..(num_points * 2) {
        let next = if i == num_points * 2 - 1 { 0 } else { i + 1 };

        let p1 = profile_points[i as usize];
        let p2 = profile_points[next as usize];

        // Calculate face normal (perpendicular to edge)
        let edge_x = p2[0] - p1[0];
        let edge_y = p2[1] - p1[1];
        let normal = [edge_y, -edge_x, 0.0];
        let normal_len = (normal[0] * normal[0] + normal[1] * normal[1]).sqrt();
        let normal = [normal[0] / normal_len, normal[1] / normal_len, 0.0];

        let side_base = vertices.len() as u32;
        let u1 = i as f32 / (num_points * 2) as f32;
        let u2 = (i + 1) as f32 / (num_points * 2) as f32;

        vertices.push(vertex_pnu([p1[0], p1[1], half_depth], normal, [u1, 0.0]));
        vertices.push(vertex_pnu([p2[0], p2[1], half_depth], normal, [u2, 0.0]));
        vertices.push(vertex_pnu([p2[0], p2[1], -half_depth], normal, [u2, 1.0]));
        vertices.push(vertex_pnu([p1[0], p1[1], -half_depth], normal, [u1, 1.0]));

        indices.extend_from_slice(&[
            side_base,
            side_base + 1,
            side_base + 2,
            side_base + 2,
            side_base + 3,
            side_base,
        ]);
    }

    Mesh::new(vertices, indices)
}

/// Create a heart shape (bezier-curve extrusion)
///
/// Creates a 3D heart using a parametric heart curve extruded along Z.
///
/// # Arguments
/// * `size` - Overall size of the heart (default: 0.5)
/// * `depth` - Extrusion depth (default: 0.2)
/// * `segments` - Number of segments in the curve (default: 32)
pub fn create_heart(size: f32, depth: f32, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_depth = depth / 2.0;

    // Parametric heart curve: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    let mut profile_points = Vec::new();
    for i in 0..=segments {
        let t = (i as f32 / segments as f32) * 2.0 * PI;
        let x = 16.0 * t.sin().powi(3);
        let y = 13.0 * t.cos() - 5.0 * (2.0 * t).cos() - 2.0 * (3.0 * t).cos() - (4.0 * t).cos();

        // Normalize to size and flip Y (heart points up)
        let scale = size / 20.0;
        profile_points.push([x * scale, -y * scale]);
    }

    // Front face
    let front_normal = [0.0, 0.0, 1.0];
    let front_base_idx = vertices.len() as u32;

    vertices.push(vertex_pnu([0.0, 0.0, half_depth], front_normal, [0.5, 0.5]));

    for point in &profile_points {
        let u = (point[0] / size + 1.0) / 2.0;
        let v = (point[1] / size + 1.0) / 2.0;
        vertices.push(vertex_pnu([point[0], point[1], half_depth], front_normal, [u, v]));
    }

    for i in 0..segments {
        indices.extend_from_slice(&[
            front_base_idx,
            front_base_idx + i + 1,
            front_base_idx + i + 2,
        ]);
    }

    // Back face
    let back_normal = [0.0, 0.0, -1.0];
    let back_base_idx = vertices.len() as u32;

    vertices.push(vertex_pnu([0.0, 0.0, -half_depth], back_normal, [0.5, 0.5]));

    for point in &profile_points {
        let u = (point[0] / size + 1.0) / 2.0;
        let v = (point[1] / size + 1.0) / 2.0;
        vertices.push(vertex_pnu([point[0], point[1], -half_depth], back_normal, [u, v]));
    }

    for i in 0..segments {
        indices.extend_from_slice(&[
            back_base_idx,
            back_base_idx + i + 2,
            back_base_idx + i + 1,
        ]);
    }

    // Side faces
    for i in 0..segments {
        let p1 = profile_points[i as usize];
        let p2 = profile_points[(i + 1) as usize];

        let edge_x = p2[0] - p1[0];
        let edge_y = p2[1] - p1[1];
        let normal = [edge_y, -edge_x, 0.0];
        let normal_len = (normal[0] * normal[0] + normal[1] * normal[1]).sqrt();
        let normal = if normal_len > 0.0001 {
            [normal[0] / normal_len, normal[1] / normal_len, 0.0]
        } else {
            [0.0, 1.0, 0.0]
        };

        let side_base = vertices.len() as u32;
        let u1 = i as f32 / segments as f32;
        let u2 = (i + 1) as f32 / segments as f32;

        vertices.push(vertex_pnu([p1[0], p1[1], half_depth], normal, [u1, 0.0]));
        vertices.push(vertex_pnu([p2[0], p2[1], half_depth], normal, [u2, 0.0]));
        vertices.push(vertex_pnu([p2[0], p2[1], -half_depth], normal, [u2, 1.0]));
        vertices.push(vertex_pnu([p1[0], p1[1], -half_depth], normal, [u1, 1.0]));

        indices.extend_from_slice(&[
            side_base,
            side_base + 1,
            side_base + 2,
            side_base + 2,
            side_base + 3,
            side_base,
        ]);
    }

    Mesh::new(vertices, indices)
}

/// Create a diamond shape (faceted gem)
///
/// Creates a gem-like diamond with a flat top, beveled edges, and pointed bottom.
///
/// # Arguments
/// * `radius` - Radius of the diamond (default: 0.5)
/// * `height` - Total height (default: 0.8)
/// * `table_ratio` - Ratio of flat top to radius (default: 0.4)
/// * `segments` - Number of segments around circumference (default: 8)
pub fn create_diamond(radius: f32, height: f32, table_ratio: f32, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let table_radius = radius * table_ratio;
    let girdle_y = height * 0.3; // Widest point
    let table_y = height * 0.5; // Top flat surface
    let culet_y = -height * 0.5; // Bottom point

    let angle_step = (2.0 * PI) / segments as f32;

    // Top point (table center)
    let table_center_idx = vertices.len() as u32;
    vertices.push(vertex_pnu([0.0, table_y, 0.0], [0.0, 1.0, 0.0], [0.5, 0.5]));

    // Table edge vertices
    let table_base_idx = vertices.len() as u32;
    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let x = table_radius * angle.cos();
        let z = table_radius * angle.sin();
        let u = (x / radius + 1.0) / 2.0;
        let v = (z / radius + 1.0) / 2.0;
        vertices.push(vertex_pnu([x, table_y, z], [0.0, 1.0, 0.0], [u, v]));
    }

    // Table triangles
    for i in 0..segments {
        let next = (i + 1) % segments;
        indices.extend_from_slice(&[
            table_center_idx,
            table_base_idx + i,
            table_base_idx + next,
        ]);
    }

    // Girdle (widest point)
    let girdle_base_idx = vertices.len() as u32;
    for i in 0..segments {
        let angle = i as f32 * angle_step;
        let x = radius * angle.cos();
        let z = radius * angle.sin();

        // Normal points outward and slightly up
        let normal = [x / radius, 0.3, z / radius];
        let normal_len = (normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]).sqrt();
        let normal = [normal[0] / normal_len, normal[1] / normal_len, normal[2] / normal_len];

        let u = i as f32 / segments as f32;
        vertices.push(vertex_pnu([x, girdle_y, z], normal, [u, 0.5]));
    }

    // Crown facets (table to girdle)
    for i in 0..segments {
        let next = (i + 1) % segments;

        let p1 = [
            table_radius * (i as f32 * angle_step).cos(),
            table_y,
            table_radius * (i as f32 * angle_step).sin(),
        ];
        let p2 = [
            table_radius * ((i + 1) as f32 * angle_step).cos(),
            table_y,
            table_radius * ((i + 1) as f32 * angle_step).sin(),
        ];
        let p3 = [
            radius * ((i + 1) as f32 * angle_step).cos(),
            girdle_y,
            radius * ((i + 1) as f32 * angle_step).sin(),
        ];
        let p4 = [
            radius * (i as f32 * angle_step).cos(),
            girdle_y,
            radius * (i as f32 * angle_step).sin(),
        ];

        // Calculate facet normal
        let v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        let v2 = [p4[0] - p1[0], p4[1] - p1[1], p4[2] - p1[2]];
        let normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
        ];
        let normal_len = (normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]).sqrt();
        let normal = [normal[0] / normal_len, normal[1] / normal_len, normal[2] / normal_len];

        let crown_base = vertices.len() as u32;
        vertices.push(vertex_pnu(p1, normal, [0.0, 0.0]));
        vertices.push(vertex_pnu(p2, normal, [1.0, 0.0]));
        vertices.push(vertex_pnu(p3, normal, [1.0, 1.0]));
        vertices.push(vertex_pnu(p4, normal, [0.0, 1.0]));

        indices.extend_from_slice(&[
            crown_base,
            crown_base + 1,
            crown_base + 2,
            crown_base + 2,
            crown_base + 3,
            crown_base,
        ]);
    }

    // Bottom point (culet)
    let culet_idx = vertices.len() as u32;
    vertices.push(vertex_pnu([0.0, culet_y, 0.0], [0.0, -1.0, 0.0], [0.5, 0.5]));

    // Pavilion facets (girdle to culet)
    for i in 0..segments {
        let next = (i + 1) % segments;
        let angle1 = i as f32 * angle_step;
        let angle2 = next as f32 * angle_step;

        let p1 = [radius * angle1.cos(), girdle_y, radius * angle1.sin()];
        let p2 = [radius * angle2.cos(), girdle_y, radius * angle2.sin()];
        let p3 = [0.0, culet_y, 0.0];

        // Calculate facet normal
        let v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        let v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
        let normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
        ];
        let normal_len = (normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]).sqrt();
        let normal = [normal[0] / normal_len, normal[1] / normal_len, normal[2] / normal_len];

        let pavilion_base = vertices.len() as u32;
        vertices.push(vertex_pnu(p1, normal, [0.0, 0.0]));
        vertices.push(vertex_pnu(p2, normal, [1.0, 0.0]));
        vertices.push(vertex_pnu(p3, normal, [0.5, 1.0]));

        indices.extend_from_slice(&[pavilion_base, pavilion_base + 1, pavilion_base + 2]);
    }

    Mesh::new(vertices, indices)
}

/// Create a cross shape (3D plus sign)
///
/// Creates a 3D cross by composing three perpendicular boxes.
///
/// # Arguments
/// * `arm_length` - Length of each arm (default: 1.0)
/// * `arm_width` - Width/thickness of arms (default: 0.3)
pub fn create_cross(arm_length: f32, arm_width: f32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_len = arm_length / 2.0;
    let half_width = arm_width / 2.0;

    // Helper to add a box with given center and dimensions
    let mut add_box = |cx: f32, cy: f32, cz: f32, sx: f32, sy: f32, sz: f32| {
        let base_idx = vertices.len() as u32;

        // 8 corners of the box
        let corners = [
            [cx - sx, cy - sy, cz - sz],
            [cx + sx, cy - sy, cz - sz],
            [cx + sx, cy + sy, cz - sz],
            [cx - sx, cy + sy, cz - sz],
            [cx - sx, cy - sy, cz + sz],
            [cx + sx, cy - sy, cz + sz],
            [cx + sx, cy + sy, cz + sz],
            [cx - sx, cy + sy, cz + sz],
        ];

        // 6 faces with proper normals and UVs
        let faces = [
            ([0, 1, 2, 3], [0.0, 0.0, -1.0]), // Front (-Z)
            ([5, 4, 7, 6], [0.0, 0.0, 1.0]),  // Back (+Z)
            ([4, 0, 3, 7], [-1.0, 0.0, 0.0]), // Left (-X)
            ([1, 5, 6, 2], [1.0, 0.0, 0.0]),  // Right (+X)
            ([4, 5, 1, 0], [0.0, -1.0, 0.0]), // Bottom (-Y)
            ([3, 2, 6, 7], [0.0, 1.0, 0.0]),  // Top (+Y)
        ];

        for (face_indices, normal) in &faces {
            let face_base = vertices.len() as u32;
            for &corner_idx in face_indices {
                let pos = corners[corner_idx];
                vertices.push(vertex_pnu(pos, *normal, [0.0, 0.0]));
            }
            indices.extend_from_slice(&[
                face_base,
                face_base + 1,
                face_base + 2,
                face_base + 2,
                face_base + 3,
                face_base,
            ]);
        }
    };

    // Vertical arm (Y axis)
    add_box(0.0, 0.0, 0.0, half_width, half_len, half_width);

    // Horizontal arm 1 (X axis)
    add_box(0.0, 0.0, 0.0, half_len, half_width, half_width);

    // Horizontal arm 2 (Z axis)
    add_box(0.0, 0.0, 0.0, half_width, half_width, half_len);

    Mesh::new(vertices, indices)
}

/// Create a tube shape (curved cylinder)
///
/// Creates a tube by sweeping a circle along a curved path.
/// For simplicity, this creates a torus (tube bent into a circle).
///
/// # Arguments
/// * `radius` - Radius of the tube path (default: 0.5)
/// * `tube_radius` - Radius of the tube cross-section (default: 0.1)
/// * `radial_segments` - Segments around the path (default: 32)
/// * `tubular_segments` - Segments around the tube (default: 16)
pub fn create_tube(
    radius: f32,
    tube_radius: f32,
    radial_segments: u32,
    tubular_segments: u32,
) -> Mesh {
    // For now, use torus as it's a tube bent into a circle
    // A proper tube would need a path parameter (Bezier curve, etc.)
    use super::primitives_torus::create_torus;
    create_torus(radius, tube_radius, tubular_segments, radial_segments)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_star_has_vertices() {
        let mesh = create_star(0.5, 0.25, 5, 0.2);
        assert!(mesh.vertices.len() > 0, "Star should have vertices");
        assert!(mesh.indices.len() > 0, "Star should have indices");
        assert_eq!(mesh.indices.len() % 3, 0, "Indices should be triangles");
    }

    #[test]
    fn test_heart_has_vertices() {
        let mesh = create_heart(0.5, 0.2, 32);
        assert!(mesh.vertices.len() > 0, "Heart should have vertices");
        assert!(mesh.indices.len() > 0, "Heart should have indices");
    }

    #[test]
    fn test_diamond_has_vertices() {
        let mesh = create_diamond(0.5, 0.8, 0.4, 8);
        assert!(mesh.vertices.len() > 0, "Diamond should have vertices");
        assert!(mesh.indices.len() > 0, "Diamond should have indices");
    }

    #[test]
    fn test_cross_has_vertices() {
        let mesh = create_cross(1.0, 0.3);
        assert!(mesh.vertices.len() > 0, "Cross should have vertices");
        assert!(mesh.indices.len() > 0, "Cross should have indices");
    }

    #[test]
    fn test_tube_has_vertices() {
        let mesh = create_tube(0.5, 0.1, 32, 16);
        assert!(mesh.vertices.len() > 0, "Tube should have vertices");
        assert!(mesh.indices.len() > 0, "Tube should have indices");
    }
}
