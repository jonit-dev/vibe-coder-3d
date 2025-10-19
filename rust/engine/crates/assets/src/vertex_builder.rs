/// Vertex builder utilities for DRY vertex generation
///
/// Provides helpers to reduce code duplication when building meshes:
/// - Vertex creation with default values
/// - Index buffer generation for common patterns (quads, triangle fans, etc.)
/// - CCW winding order enforcement
use super::vertex::Vertex;

/// Create a vertex with position and normal, using default UV and tangent
pub fn vertex_pn(position: [f32; 3], normal: [f32; 3]) -> Vertex {
    Vertex {
        position,
        normal,
        uv: [0.0, 0.0],
        tangent: [1.0, 0.0, 0.0, 1.0],
    }
}

/// Create a vertex with position, normal, and UV, using default tangent
pub fn vertex_pnu(position: [f32; 3], normal: [f32; 3], uv: [f32; 2]) -> Vertex {
    Vertex {
        position,
        normal,
        uv,
        tangent: [1.0, 0.0, 0.0, 1.0],
    }
}

/// Generate indices for a quad (2 triangles, CCW winding)
///
/// # Arguments
/// * `base` - Base vertex index
///
/// # Returns
/// Indices for quad: [base, base+1, base+2, base+2, base+3, base]
///
/// Vertex layout:
/// ```text
/// 3---2
/// |   |
/// 0---1
/// ```
pub fn quad_indices(base: u32) -> [u32; 6] {
    [base, base + 1, base + 2, base + 2, base + 3, base]
}

/// Generate indices for a triangle fan
///
/// # Arguments
/// * `center` - Center vertex index
/// * `start` - First perimeter vertex index
/// * `count` - Number of perimeter vertices
///
/// # Returns
/// Vec of indices forming triangles from center to each edge
pub fn triangle_fan_indices(center: u32, start: u32, count: u32) -> Vec<u32> {
    let mut indices = Vec::with_capacity((count * 3) as usize);

    for i in 0..count {
        let next = start + (i + 1) % count;
        indices.extend_from_slice(&[center, start + i, next]);
    }

    indices
}

/// Generate indices for a triangle strip around a ring
///
/// # Arguments
/// * `ring_start` - Starting vertex index of lower ring
/// * `next_ring_start` - Starting vertex index of upper ring
/// * `segments` - Number of segments around the ring
///
/// # Returns
/// Vec of indices forming quads between two rings (CCW winding)
pub fn ring_strip_indices(ring_start: u32, next_ring_start: u32, segments: u32) -> Vec<u32> {
    let mut indices = Vec::with_capacity((segments * 6) as usize);

    for i in 0..segments {
        let current = ring_start + i;
        let next = ring_start + (i + 1) % segments;
        let current_top = next_ring_start + i;
        let next_top = next_ring_start + (i + 1) % segments;

        // Two triangles forming a quad (CCW)
        indices.extend_from_slice(&[current, next, current_top]);
        indices.extend_from_slice(&[current_top, next, next_top]);
    }

    indices
}

/// Generate indices for cylinder/cone caps
///
/// # Arguments
/// * `center` - Center vertex index
/// * `ring_start` - Starting vertex index of the cap ring
/// * `segments` - Number of segments
/// * `top` - True for top cap (CCW from top), false for bottom cap (CCW from bottom)
///
/// # Returns
/// Vec of indices for the cap triangles
pub fn cap_indices(center: u32, ring_start: u32, segments: u32, top: bool) -> Vec<u32> {
    let mut indices = Vec::with_capacity((segments * 3) as usize);

    for i in 0..segments {
        let current = ring_start + i;
        let next = ring_start + (i + 1) % segments;

        if top {
            // Top cap: center -> next -> current (CCW from top view)
            indices.extend_from_slice(&[center, next, current]);
        } else {
            // Bottom cap: center -> current -> next (CCW from bottom view)
            indices.extend_from_slice(&[center, current, next]);
        }
    }

    indices
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vertex_pn() {
        let v = vertex_pn([1.0, 2.0, 3.0], [0.0, 1.0, 0.0]);
        assert_eq!(v.position, [1.0, 2.0, 3.0]);
        assert_eq!(v.normal, [0.0, 1.0, 0.0]);
        assert_eq!(v.uv, [0.0, 0.0]);
    }

    #[test]
    fn test_vertex_pnu() {
        let v = vertex_pnu([1.0, 2.0, 3.0], [0.0, 1.0, 0.0], [0.5, 0.5]);
        assert_eq!(v.position, [1.0, 2.0, 3.0]);
        assert_eq!(v.normal, [0.0, 1.0, 0.0]);
        assert_eq!(v.uv, [0.5, 0.5]);
    }

    #[test]
    fn test_quad_indices() {
        let indices = quad_indices(0);
        assert_eq!(indices, [0, 1, 2, 2, 3, 0]);

        let indices = quad_indices(10);
        assert_eq!(indices, [10, 11, 12, 12, 13, 10]);
    }

    #[test]
    fn test_triangle_fan_indices() {
        let indices = triangle_fan_indices(0, 1, 4);
        assert_eq!(indices.len(), 12); // 4 triangles × 3 indices

        // First triangle: center (0), first (1), second (2)
        assert_eq!(&indices[0..3], &[0, 1, 2]);
        // Last triangle: center (0), fourth (4), first (1) - wraps around
        assert_eq!(&indices[9..12], &[0, 4, 1]);
    }

    #[test]
    fn test_ring_strip_indices() {
        let indices = ring_strip_indices(0, 4, 4);
        assert_eq!(indices.len(), 24); // 4 quads × 6 indices

        // First quad: vertices 0,1,4,5
        assert_eq!(&indices[0..6], &[0, 1, 4, 4, 1, 5]);
    }

    #[test]
    fn test_cap_indices() {
        // Top cap
        let indices = cap_indices(0, 1, 4, true);
        assert_eq!(indices.len(), 12); // 4 triangles × 3 indices

        // First triangle (top view, CCW): center (0), next (2), current (1)
        assert_eq!(&indices[0..3], &[0, 2, 1]);

        // Bottom cap
        let indices = cap_indices(10, 11, 4, false);
        assert_eq!(indices.len(), 12);

        // First triangle (bottom view, CCW): center (10), current (11), next (12)
        assert_eq!(&indices[0..3], &[10, 11, 12]);
    }
}
