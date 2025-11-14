/// Terrain utilities with Three.js parity
use three_d::Vector3;

/// Align terrain to ground level by subtracting minimum Y
///
/// This matches the Three.js behavior where the terrain baseline
/// is adjusted so the lowest point is at Y=0.
///
/// # Arguments
/// * `positions` - Mutable array of vertex positions
///
/// # Returns
/// The minimum Y value that was subtracted (for debugging/logging)
pub fn align_ground_level(positions: &mut [Vector3<f32>]) -> f32 {
    let mut min_y = f32::INFINITY;

    // Find minimum Y
    for pos in positions.iter() {
        if pos.y < min_y {
            min_y = pos.y;
        }
    }

    // Subtract minimum from all Y values
    if min_y.is_finite() && min_y != 0.0 {
        for pos in positions.iter_mut() {
            pos.y -= min_y;
        }
    }

    min_y
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_align_ground_level_positive_offset() {
        let mut positions = vec![
            Vector3::new(0.0, 5.0, 0.0),
            Vector3::new(1.0, 7.0, 0.0),
            Vector3::new(0.0, 6.0, 1.0),
        ];

        let min_y = align_ground_level(&mut positions);

        assert_eq!(min_y, 5.0);
        assert_eq!(positions[0].y, 0.0);
        assert_eq!(positions[1].y, 2.0);
        assert_eq!(positions[2].y, 1.0);
    }

    #[test]
    fn test_align_ground_level_negative_offset() {
        let mut positions = vec![
            Vector3::new(0.0, -2.0, 0.0),
            Vector3::new(1.0, 1.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
        ];

        let min_y = align_ground_level(&mut positions);

        assert_eq!(min_y, -2.0);
        assert_eq!(positions[0].y, 0.0);
        assert_eq!(positions[1].y, 3.0);
        assert_eq!(positions[2].y, 2.0);
    }

    #[test]
    fn test_align_ground_level_already_aligned() {
        let mut positions = vec![
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 1.0, 0.0),
            Vector3::new(0.0, 2.0, 1.0),
        ];

        let original = positions.clone();
        let min_y = align_ground_level(&mut positions);

        assert_eq!(min_y, 0.0);
        // Should not modify positions if already aligned
        for (i, pos) in positions.iter().enumerate() {
            assert_eq!(pos.y, original[i].y);
        }
    }

    #[test]
    fn test_align_ground_level_preserves_xz() {
        let mut positions = vec![
            Vector3::new(1.0, 5.0, 2.0),
            Vector3::new(3.0, 7.0, 4.0),
            Vector3::new(5.0, 6.0, 6.0),
        ];

        let original_x: Vec<f32> = positions.iter().map(|p| p.x).collect();
        let original_z: Vec<f32> = positions.iter().map(|p| p.z).collect();

        align_ground_level(&mut positions);

        // X and Z should be unchanged
        for (i, pos) in positions.iter().enumerate() {
            assert_eq!(pos.x, original_x[i]);
            assert_eq!(pos.z, original_z[i]);
        }
    }
}
