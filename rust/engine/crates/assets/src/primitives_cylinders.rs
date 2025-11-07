/// Cylindrical primitives: cylinder, cone, capsule
///
/// These primitives share a common cylindrical structure via CylindricalBuilder (DRY principle).
/// Matches Three.js CylinderGeometry and ConeGeometry exactly.
use std::f32::consts::PI;

use super::geometry_math::{circle_points_xz, cylindrical_uv};
use super::vertex::Vertex;
use super::vertex_builder::{cap_indices, ring_strip_indices, vertex_pnu};
use super::Mesh;

/// Builder for cylindrical shapes (cylinder, cone, truncated cone)
///
/// This follows the DRY principle - cylinder and cone share 95% of code.
/// This builder is exported so custom shapes can be created with specific parameters.
pub struct CylindricalBuilder {
    radius_top: f32,
    radius_bottom: f32,
    height: f32,
    radial_segments: u32,
    height_segments: u32,
    open_ended: bool,
}

impl CylindricalBuilder {
    /// Create a cylinder (equal top and bottom radius)
    pub fn cylinder(radius: f32, height: f32, radial_segments: u32) -> Self {
        Self {
            radius_top: radius,
            radius_bottom: radius,
            height,
            radial_segments,
            height_segments: 1,
            open_ended: false,
        }
    }

    /// Create a cone (zero top radius)
    pub fn cone(radius: f32, height: f32, radial_segments: u32) -> Self {
        Self {
            radius_top: 0.0,
            radius_bottom: radius,
            height,
            radial_segments,
            height_segments: 1,
            open_ended: false,
        }
    }

    /// Create a truncated cone (different top and bottom radius)
    pub fn truncated_cone(
        radius_top: f32,
        radius_bottom: f32,
        height: f32,
        radial_segments: u32,
    ) -> Self {
        Self {
            radius_top,
            radius_bottom,
            height,
            radial_segments,
            height_segments: 1,
            open_ended: false,
        }
    }

    /// Set whether the cylinder is open-ended (no caps)
    pub fn open_ended(mut self, open: bool) -> Self {
        self.open_ended = open;
        self
    }

    /// Build the mesh
    pub fn build(self) -> Mesh {
        let mut vertices = Vec::new();
        let mut indices = Vec::new();

        let half_height = self.height / 2.0;
        let rings = self.height_segments + 1;

        // Generate side vertices (rings)
        for y_idx in 0..rings {
            let v = y_idx as f32 / self.height_segments as f32;
            let y = half_height - v * self.height;

            // Lerp radius from bottom to top
            let radius = self.radius_bottom + v * (self.radius_top - self.radius_bottom);

            for segment in 0..=self.radial_segments {
                let u = segment as f32 / self.radial_segments as f32;
                let theta = u * 2.0 * PI;

                let x = radius * theta.cos();
                let z = radius * theta.sin();

                // Normal points radially outward
                // For cones, we need to account for the slope
                let slope = (self.radius_bottom - self.radius_top) / self.height;
                let normal_x = theta.cos();
                let normal_y = slope;
                let normal_z = theta.sin();
                let normal_len =
                    (normal_x * normal_x + normal_y * normal_y + normal_z * normal_z).sqrt();
                let normal = [
                    normal_x / normal_len,
                    normal_y / normal_len,
                    normal_z / normal_len,
                ];

                vertices.push(vertex_pnu([x, y, z], normal, [u, v]));
            }
        }

        // Generate side indices
        let segments_plus_one = self.radial_segments + 1;
        for y_idx in 0..self.height_segments {
            let ring_start = y_idx * segments_plus_one;
            let next_ring_start = (y_idx + 1) * segments_plus_one;

            for segment in 0..self.radial_segments {
                let current = ring_start + segment;
                let next = current + 1;
                let current_top = next_ring_start + segment;
                let next_top = current_top + 1;

                // Two triangles forming a quad (CCW)
                indices.extend_from_slice(&[current, next, current_top]);
                indices.extend_from_slice(&[current_top, next, next_top]);
            }
        }

        // Generate caps if not open-ended
        if !self.open_ended {
            let base_vertex_count = vertices.len() as u32;

            // Bottom cap (if radius > 0)
            if self.radius_bottom > 0.0 {
                let center_idx = vertices.len() as u32;
                vertices.push(vertex_pnu(
                    [0.0, -half_height, 0.0],
                    [0.0, -1.0, 0.0],
                    [0.5, 0.5],
                ));

                let cap_start = vertices.len() as u32;
                for segment in 0..=self.radial_segments {
                    let u = segment as f32 / self.radial_segments as f32;
                    let theta = u * 2.0 * PI;

                    let x = self.radius_bottom * theta.cos();
                    let z = self.radius_bottom * theta.sin();

                    // UV coordinates for cap (circular mapping)
                    let cap_u = 0.5 + 0.5 * theta.cos();
                    let cap_v = 0.5 + 0.5 * theta.sin();

                    vertices.push(vertex_pnu(
                        [x, -half_height, z],
                        [0.0, -1.0, 0.0],
                        [cap_u, cap_v],
                    ));
                }

                // Bottom cap indices (CCW from bottom)
                let bottom_indices =
                    cap_indices(center_idx, cap_start, self.radial_segments, false);
                indices.extend(bottom_indices);
            }

            // Top cap (if radius > 0)
            if self.radius_top > 0.0 {
                let center_idx = vertices.len() as u32;
                vertices.push(vertex_pnu(
                    [0.0, half_height, 0.0],
                    [0.0, 1.0, 0.0],
                    [0.5, 0.5],
                ));

                let cap_start = vertices.len() as u32;
                for segment in 0..=self.radial_segments {
                    let u = segment as f32 / self.radial_segments as f32;
                    let theta = u * 2.0 * PI;

                    let x = self.radius_top * theta.cos();
                    let z = self.radius_top * theta.sin();

                    // UV coordinates for cap
                    let cap_u = 0.5 + 0.5 * theta.cos();
                    let cap_v = 0.5 + 0.5 * theta.sin();

                    vertices.push(vertex_pnu(
                        [x, half_height, z],
                        [0.0, 1.0, 0.0],
                        [cap_u, cap_v],
                    ));
                }

                // Top cap indices (CCW from top)
                let top_indices = cap_indices(center_idx, cap_start, self.radial_segments, true);
                indices.extend(top_indices);
            }
        }

        Mesh::new(vertices, indices)
    }
}

/// Generate a cylinder mesh matching Three.js CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
///
/// # Arguments
/// * `radius` - Cylinder radius (default: 0.5)
/// * `height` - Cylinder height (default: 1.0)
/// * `radial_segments` - Number of segments around circumference (default: 32)
///
/// # Three.js Match
/// `new THREE.CylinderGeometry(0.5, 0.5, 1, 32)` → `create_cylinder(0.5, 1.0, 32)`
pub fn create_cylinder(radius: f32, height: f32, radial_segments: u32) -> Mesh {
    CylindricalBuilder::cylinder(radius, height, radial_segments).build()
}

/// Generate a cone mesh matching Three.js ConeGeometry(radius, height, radialSegments)
///
/// # Arguments
/// * `radius` - Base radius (default: 0.5)
/// * `height` - Cone height (default: 1.0)
/// * `radial_segments` - Number of segments around base (default: 32)
///
/// # Three.js Match
/// `new THREE.ConeGeometry(0.5, 1, 32)` → `create_cone(0.5, 1.0, 32)`
pub fn create_cone(radius: f32, height: f32, radial_segments: u32) -> Mesh {
    CylindricalBuilder::cone(radius, height, radial_segments).build()
}

/// Generate a capsule mesh matching Three.js CapsuleGeometry(radius, length, capSegments, radialSegments)
///
/// A capsule is a cylinder with hemispherical caps on each end.
///
/// # Arguments
/// * `radius` - Capsule radius (default: 0.3)
/// * `length` - Length of cylindrical section (default: 0.4)
/// * `cap_segments` - Latitude segments per hemisphere cap (default: 4)
/// * `radial_segments` - Circumference segments (default: 16)
///
/// # Three.js Match
/// `new THREE.CapsuleGeometry(0.3, 0.4, 4, 16)` → `create_capsule(0.3, 0.4, 4, 16)`
pub fn create_capsule(radius: f32, length: f32, cap_segments: u32, radial_segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let half_length = length / 2.0;

    // Generate cylindrical body (without caps)
    for y_idx in 0..=1 {
        let y = if y_idx == 0 {
            -half_length
        } else {
            half_length
        };

        for segment in 0..=radial_segments {
            let u = segment as f32 / radial_segments as f32;
            let theta = u * 2.0 * PI;

            let x = radius * theta.cos();
            let z = radius * theta.sin();

            let normal = [theta.cos(), 0.0, theta.sin()];
            let uv = [u, y_idx as f32];

            vertices.push(vertex_pnu([x, y, z], normal, uv));
        }
    }

    // Body indices
    let body_indices = ring_strip_indices(0, radial_segments + 1, radial_segments);
    indices.extend(body_indices);

    // Generate bottom hemisphere cap
    // Parameterization mirrors the top cap but extends downward from the cylinder edge.
    // t in [0, PI/2]: t = 0 at the cylinder edge (full radius), t = PI/2 at the tip (radius 0)
    let bottom_cap_start = vertices.len() as u32;
    for ring in 0..=cap_segments {
        let t = (ring as f32 / cap_segments as f32) * (PI / 2.0);
        let sin_t = t.sin();
        let cos_t = t.cos();
        let y = -half_length - radius * sin_t;

        for segment in 0..=radial_segments {
            let u = segment as f32 / radial_segments as f32;
            let theta = u * 2.0 * PI;
            let sin_theta = theta.sin();
            let cos_theta = theta.cos();

            let x = radius * cos_t * cos_theta;
            let z = radius * cos_t * sin_theta;

            // Outward/downward normal for bottom hemisphere
            let normal = [cos_t * cos_theta, -sin_t, cos_t * sin_theta];
            let uv_v = 1.0 - (ring as f32 / cap_segments as f32) * 0.5;

            vertices.push(vertex_pnu([x, y, z], normal, [u, uv_v]));
        }
    }

    // Bottom cap indices - reverse winding order for correct face orientation
    for ring in 0..cap_segments {
        let ring_start = bottom_cap_start + ring * (radial_segments + 1);
        let next_ring_start = ring_start + radial_segments + 1;
        let mut ring_indices = ring_strip_indices(ring_start, next_ring_start, radial_segments);
        // Reverse winding order for bottom cap (flip every triangle)
        for i in (0..ring_indices.len()).step_by(3) {
            if i + 2 < ring_indices.len() {
                ring_indices.swap(i + 1, i + 2);
            }
        }
        indices.extend(ring_indices);
    }

    // Generate top hemisphere cap
    let top_cap_start = vertices.len() as u32;
    for ring in 0..=cap_segments {
        let phi = (ring as f32 / cap_segments as f32) * (PI / 2.0);
        let sin_phi = phi.sin();
        let cos_phi = phi.cos();
        let y = half_length + radius * sin_phi;

        for segment in 0..=radial_segments {
            let u = segment as f32 / radial_segments as f32;
            let theta = u * 2.0 * PI;
            let sin_theta = theta.sin();
            let cos_theta = theta.cos();

            let x = radius * cos_phi * cos_theta;
            let z = radius * cos_phi * sin_theta;

            // Normal for sphere
            let normal = [cos_phi * cos_theta, sin_phi, cos_phi * sin_theta];
            let uv_v = 0.5 + (ring as f32 / cap_segments as f32) * 0.5;

            vertices.push(vertex_pnu([x, y, z], normal, [u, uv_v]));
        }
    }

    // Top cap indices
    for ring in 0..cap_segments {
        let ring_start = top_cap_start + ring * (radial_segments + 1);
        let next_ring_start = ring_start + radial_segments + 1;
        let ring_indices = ring_strip_indices(ring_start, next_ring_start, radial_segments);
        indices.extend(ring_indices);
    }

    Mesh::new(vertices, indices)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cylinder_vertex_count() {
        let mesh = create_cylinder(0.5, 1.0, 32);

        // Side: (height_segments+1) * (radial_segments+1) = 2 * 33 = 66
        // Bottom cap: 1 center + 33 ring = 34
        // Top cap: 1 center + 33 ring = 34
        // Total: 66 + 34 + 34 = 134
        assert_eq!(mesh.vertices.len(), 134);

        // Side indices: height_segments * radial_segments * 6 = 1 * 32 * 6 = 192
        // Bottom cap: 32 * 3 = 96
        // Top cap: 32 * 3 = 96
        // Total: 192 + 96 + 96 = 384
        assert_eq!(mesh.indices.len(), 384);
    }

    #[test]
    fn test_cone_vertex_count() {
        let mesh = create_cone(0.5, 1.0, 32);

        // Side: 2 * 33 = 66 (including degenerate top ring)
        // Bottom cap: 1 + 33 = 34
        // No top cap (radius = 0)
        // Total: 66 + 34 = 100
        assert_eq!(mesh.vertices.len(), 100);
    }

    #[test]
    fn test_capsule_vertex_count() {
        let mesh = create_capsule(0.3, 0.4, 4, 16);

        // Body: 2 * 17 = 34
        // Bottom cap: (4+1) * 17 = 85
        // Top cap: (4+1) * 17 = 85
        // Total: 34 + 85 + 85 = 204
        assert_eq!(mesh.vertices.len(), 204);
    }

    #[test]
    fn test_cylinder_normals_unit_length() {
        let mesh = create_cylinder(0.5, 1.0, 8);

        for vertex in &mesh.vertices {
            let normal = vertex.normal;
            let len_sq = normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2];
            let len = len_sq.sqrt();
            assert!((len - 1.0).abs() < 0.01, "Normal not unit length: {}", len);
        }
    }

    #[test]
    fn test_cylinder_uv_bounds() {
        let mesh = create_cylinder(0.5, 1.0, 32);

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
    fn test_cone_base_radius() {
        let mesh = create_cone(1.0, 2.0, 8);

        // Check that bottom ring has radius ~1.0
        let mut found_bottom = false;
        for vertex in &mesh.vertices {
            if (vertex.position[1] + 1.0).abs() < 0.01 {
                // Near bottom (y = -1.0)
                let radius = (vertex.position[0] * vertex.position[0]
                    + vertex.position[2] * vertex.position[2])
                    .sqrt();
                if (radius - 1.0).abs() < 0.01 {
                    found_bottom = true;
                    break;
                }
            }
        }
        assert!(found_bottom, "Cone base radius incorrect");
    }
}
