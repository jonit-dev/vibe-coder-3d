use glam::Vec3 as GlamVec3;
use three_d::{CpuMesh, Positions, Vector3};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PivotOriginMode {
    Raw,
    BboxCenter,
    BboxBottomCenter,
}

#[derive(Debug, Clone, Copy)]
pub struct PivotInfo {
    pub min: GlamVec3,
    pub max: GlamVec3,
    pub center: GlamVec3,
    pub bounds_size: GlamVec3,
}

/// Compute bounding box information from a slice of positions.
/// Returns None if the positions slice is empty.
pub fn compute_bounds_from_positions(positions: &[Vector3<f32>]) -> Option<PivotInfo> {
    if positions.is_empty() {
        return None;
    }

    let mut min = GlamVec3::new(f32::MAX, f32::MAX, f32::MAX);
    let mut max = GlamVec3::new(f32::MIN, f32::MIN, f32::MIN);

    for pos in positions {
        min.x = min.x.min(pos.x);
        min.y = min.y.min(pos.y);
        min.z = min.z.min(pos.z);
        max.x = max.x.max(pos.x);
        max.y = max.y.max(pos.y);
        max.z = max.z.max(pos.z);
    }

    let center = (min + max) * 0.5;
    let bounds_size = max - min;

    Some(PivotInfo {
        min,
        max,
        center,
        bounds_size,
    })
}

/// Compute the pivot offset vector for a given origin mode.
pub fn pivot_offset_for_mode(info: &PivotInfo, mode: PivotOriginMode) -> GlamVec3 {
    match mode {
        PivotOriginMode::Raw => GlamVec3::ZERO,
        PivotOriginMode::BboxCenter => -info.center,
        PivotOriginMode::BboxBottomCenter => {
            let bottom_center = GlamVec3::new(info.center.x, info.min.y, info.center.z);
            -bottom_center
        }
    }
}

/// Apply a pivot offset to all vertex positions in a CpuMesh.
/// This shifts the mesh geometry without affecting normals, UVs, or indices.
pub fn apply_pivot_offset(cpu_mesh: &mut CpuMesh, offset: GlamVec3) {
    if offset.length_squared() < 1e-9 {
        return;
    }

    if let Positions::F32(ref mut verts) = cpu_mesh.positions {
        for v in verts.iter_mut() {
            v.x += offset.x;
            v.y += offset.y;
            v.z += offset.z;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_bounds_empty() {
        let positions: Vec<Vector3<f32>> = vec![];
        assert!(compute_bounds_from_positions(&positions).is_none());
    }

    #[test]
    fn test_compute_bounds_single_point() {
        let positions = vec![Vector3::new(1.0, 2.0, 3.0)];
        let info = compute_bounds_from_positions(&positions).unwrap();
        assert_eq!(info.min, GlamVec3::new(1.0, 2.0, 3.0));
        assert_eq!(info.max, GlamVec3::new(1.0, 2.0, 3.0));
        assert_eq!(info.center, GlamVec3::new(1.0, 2.0, 3.0));
        assert_eq!(info.bounds_size, GlamVec3::ZERO);
    }

    #[test]
    fn test_compute_bounds_two_points() {
        let positions = vec![Vector3::new(1.0, 2.0, 3.0), Vector3::new(3.0, 4.0, 5.0)];
        let info = compute_bounds_from_positions(&positions).unwrap();
        assert_eq!(info.min, GlamVec3::new(1.0, 2.0, 3.0));
        assert_eq!(info.max, GlamVec3::new(3.0, 4.0, 5.0));
        assert_eq!(info.center, GlamVec3::new(2.0, 3.0, 4.0));
        assert_eq!(info.bounds_size, GlamVec3::new(2.0, 2.0, 2.0));
    }

    #[test]
    fn test_pivot_offset_raw_mode() {
        let info = PivotInfo {
            min: GlamVec3::new(1.0, 2.0, 3.0),
            max: GlamVec3::new(3.0, 4.0, 5.0),
            center: GlamVec3::new(2.0, 3.0, 4.0),
            bounds_size: GlamVec3::new(2.0, 2.0, 2.0),
        };
        let offset = pivot_offset_for_mode(&info, PivotOriginMode::Raw);
        assert_eq!(offset, GlamVec3::ZERO);
    }

    #[test]
    fn test_pivot_offset_bbox_center() {
        let info = PivotInfo {
            min: GlamVec3::new(1.0, 2.0, 3.0),
            max: GlamVec3::new(3.0, 4.0, 5.0),
            center: GlamVec3::new(2.0, 3.0, 4.0),
            bounds_size: GlamVec3::new(2.0, 2.0, 2.0),
        };
        let offset = pivot_offset_for_mode(&info, PivotOriginMode::BboxCenter);
        assert_eq!(offset, GlamVec3::new(-2.0, -3.0, -4.0));
    }

    #[test]
    fn test_pivot_offset_bbox_bottom_center() {
        let info = PivotInfo {
            min: GlamVec3::new(1.0, 2.0, 3.0),
            max: GlamVec3::new(3.0, 4.0, 5.0),
            center: GlamVec3::new(2.0, 3.0, 4.0),
            bounds_size: GlamVec3::new(2.0, 2.0, 2.0),
        };
        let offset = pivot_offset_for_mode(&info, PivotOriginMode::BboxBottomCenter);
        // Bottom center: (center.x, min.y, center.z) = (2.0, 2.0, 4.0)
        // Offset: -(2.0, 2.0, 4.0)
        assert_eq!(offset, GlamVec3::new(-2.0, -2.0, -4.0));
    }

    #[test]
    fn test_apply_pivot_offset_zero() {
        let mut mesh = CpuMesh {
            positions: Positions::F32(vec![
                Vector3::new(1.0, 2.0, 3.0),
                Vector3::new(3.0, 4.0, 5.0),
            ]),
            ..Default::default()
        };

        let original = mesh.positions.clone();
        apply_pivot_offset(&mut mesh, GlamVec3::ZERO);

        if let (Positions::F32(ref result), Positions::F32(ref orig)) = (&mesh.positions, &original)
        {
            assert_eq!(result, orig);
        }
    }

    #[test]
    fn test_apply_pivot_offset_non_zero() {
        let mut mesh = CpuMesh {
            positions: Positions::F32(vec![
                Vector3::new(1.0, 2.0, 3.0),
                Vector3::new(3.0, 4.0, 5.0),
            ]),
            ..Default::default()
        };

        let offset = GlamVec3::new(-2.0, -3.0, -4.0);
        apply_pivot_offset(&mut mesh, offset);

        if let Positions::F32(ref verts) = mesh.positions {
            assert_eq!(verts[0], Vector3::new(-1.0, -1.0, -1.0));
            assert_eq!(verts[1], Vector3::new(1.0, 1.0, 1.0));
        } else {
            panic!("Expected F32 positions");
        }
    }

    #[test]
    fn test_bbox_center_pivot_symmetric_mesh() {
        let positions = vec![Vector3::new(-1.0, -1.0, -1.0), Vector3::new(1.0, 1.0, 1.0)];

        let info = compute_bounds_from_positions(&positions).unwrap();
        assert_eq!(info.center, GlamVec3::ZERO);

        let offset = pivot_offset_for_mode(&info, PivotOriginMode::BboxCenter);
        assert_eq!(offset, GlamVec3::ZERO);
    }

    #[test]
    fn test_bbox_center_pivot_offset_mesh() {
        // Mesh with positions in [1,3] range on all axes
        let positions = vec![Vector3::new(1.0, 1.0, 1.0), Vector3::new(3.0, 3.0, 3.0)];

        let info = compute_bounds_from_positions(&positions).unwrap();
        assert_eq!(info.center, GlamVec3::new(2.0, 2.0, 2.0));

        let offset = pivot_offset_for_mode(&info, PivotOriginMode::BboxCenter);
        assert_eq!(offset, GlamVec3::new(-2.0, -2.0, -2.0));

        let mut mesh = CpuMesh {
            positions: Positions::F32(positions),
            ..Default::default()
        };

        apply_pivot_offset(&mut mesh, offset);

        if let Positions::F32(ref verts) = mesh.positions {
            // After centering, positions should be symmetric around origin
            assert_eq!(verts[0], Vector3::new(-1.0, -1.0, -1.0));
            assert_eq!(verts[1], Vector3::new(1.0, 1.0, 1.0));
        }
    }
}
