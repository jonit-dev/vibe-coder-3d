use glam::Vec3;

use super::lines::LineBatch;

const GRID_COLOR: [f32; 3] = [0.5, 0.5, 0.5]; // Gray
const AXIS_X_COLOR: [f32; 3] = [1.0, 0.0, 0.0]; // Red for X axis
const AXIS_Z_COLOR: [f32; 3] = [0.0, 0.0, 1.0]; // Blue for Z axis

/// Generate a ground grid at Y=0
///
/// # Arguments
/// * `batch` - The line batch to add grid lines to
/// * `size` - Total size of the grid (grid extends from -size/2 to +size/2 on X and Z)
/// * `divisions` - Number of divisions along each axis (creates divisions+1 lines per axis)
pub fn append_ground_grid(batch: &mut LineBatch, size: f32, divisions: u32) {
    let half_size = size / 2.0;
    let step = size / divisions as f32;

    // Draw grid lines parallel to X axis (lines along Z direction)
    for i in 0..=divisions {
        let z = -half_size + (i as f32 * step);
        let start = Vec3::new(-half_size, 0.0, z);
        let end = Vec3::new(half_size, 0.0, z);

        // Use special color for center lines (axes)
        let color = if i == divisions / 2 {
            AXIS_Z_COLOR
        } else {
            GRID_COLOR
        };

        batch.add_line(start, end, color);
    }

    // Draw grid lines parallel to Z axis (lines along X direction)
    for i in 0..=divisions {
        let x = -half_size + (i as f32 * step);
        let start = Vec3::new(x, 0.0, -half_size);
        let end = Vec3::new(x, 0.0, half_size);

        // Use special color for center lines (axes)
        let color = if i == divisions / 2 {
            AXIS_X_COLOR
        } else {
            GRID_COLOR
        };

        batch.add_line(start, end, color);
    }
}
