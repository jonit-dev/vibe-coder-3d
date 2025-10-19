use glam::Vec3;

/// A line vertex with position and color
#[derive(Debug, Clone, Copy)]
pub struct LineVertex {
    pub position: Vec3,
    pub color: [f32; 3],
}

/// A batch of lines for debug rendering
/// Stores line segments as pairs of vertices
pub struct LineBatch {
    pub vertices: Vec<LineVertex>,
}

impl LineBatch {
    /// Create a new empty line batch
    pub fn new() -> Self {
        Self {
            vertices: Vec::new(),
        }
    }

    /// Add a line segment from start to end with the given color
    pub fn add_line(&mut self, start: Vec3, end: Vec3, color: [f32; 3]) {
        self.vertices.push(LineVertex {
            position: start,
            color,
        });
        self.vertices.push(LineVertex {
            position: end,
            color,
        });
    }

    /// Clear all lines from the batch
    pub fn clear(&mut self) {
        self.vertices.clear();
    }

    /// Get the number of lines in the batch
    pub fn line_count(&self) -> usize {
        self.vertices.len() / 2
    }

    /// Add a sphere wireframe approximation using latitude/longitude lines
    pub fn add_sphere(&mut self, center: Vec3, radius: f32, color: [f32; 3], segments: u32) {
        use std::f32::consts::PI;

        // Draw latitude circles
        for lat in 0..segments {
            let theta1 = (lat as f32 / segments as f32) * PI;
            let theta2 = ((lat + 1) as f32 / segments as f32) * PI;

            for lon in 0..segments {
                let phi1 = (lon as f32 / segments as f32) * 2.0 * PI;
                let phi2 = ((lon + 1) as f32 / segments as f32) * 2.0 * PI;

                // Four corners of this quad
                let p1 = center
                    + Vec3::new(
                        radius * theta1.sin() * phi1.cos(),
                        radius * theta1.cos(),
                        radius * theta1.sin() * phi1.sin(),
                    );
                let p2 = center
                    + Vec3::new(
                        radius * theta1.sin() * phi2.cos(),
                        radius * theta1.cos(),
                        radius * theta1.sin() * phi2.sin(),
                    );
                let p3 = center
                    + Vec3::new(
                        radius * theta2.sin() * phi1.cos(),
                        radius * theta2.cos(),
                        radius * theta2.sin() * phi1.sin(),
                    );

                // Draw two edges of the quad
                self.add_line(p1, p2, color);
                self.add_line(p1, p3, color);
            }
        }
    }
}

impl Default for LineBatch {
    fn default() -> Self {
        Self::new()
    }
}
