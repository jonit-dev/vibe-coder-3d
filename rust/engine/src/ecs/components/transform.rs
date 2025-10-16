use glam::{Mat4, Quat, Vec3};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>, // Can be [x, y, z] (Euler) or [x, y, z, w] (quaternion)
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            position: Some([0.0, 0.0, 0.0]),
            rotation: Some(vec![0.0, 0.0, 0.0]),
            scale: Some([1.0, 1.0, 1.0]),
        }
    }
}

impl Transform {
    /// Get position as Vec3
    pub fn position_vec3(&self) -> Vec3 {
        self.position
            .map(|p| Vec3::new(p[0], p[1], p[2]))
            .unwrap_or(Vec3::ZERO)
    }

    /// Get rotation as Quat
    /// Handles both Euler angles [x, y, z] (in DEGREES from TS) and quaternions [x, y, z, w]
    pub fn rotation_quat(&self) -> Quat {
        self.rotation
            .as_ref()
            .map(|r| {
                match r.len() {
                    3 => {
                        // Euler angles in DEGREES [x, y, z] - TypeScript stores rotation in degrees
                        // Convert to radians for glam
                        let x_rad = r[0].to_radians();
                        let y_rad = r[1].to_radians();
                        let z_rad = r[2].to_radians();
                        let quat = Quat::from_euler(glam::EulerRot::XYZ, x_rad, y_rad, z_rad);
                        log::trace!(
                            "Transform rotation: euler_deg=[{:.1}, {:.1}, {:.1}] -> euler_rad=[{:.3}, {:.3}, {:.3}] -> quat=[{:.3}, {:.3}, {:.3}, {:.3}]",
                            r[0], r[1], r[2],
                            x_rad, y_rad, z_rad,
                            quat.x, quat.y, quat.z, quat.w
                        );
                        quat
                    }
                    4 => {
                        // Quaternion [x, y, z, w]
                        Quat::from_xyzw(r[0], r[1], r[2], r[3])
                    }
                    _ => {
                        log::warn!("Invalid rotation array length: {}, using identity", r.len());
                        Quat::IDENTITY
                    }
                }
            })
            .unwrap_or(Quat::IDENTITY)
    }

    /// Get scale as Vec3
    pub fn scale_vec3(&self) -> Vec3 {
        self.scale
            .map(|s| Vec3::new(s[0], s[1], s[2]))
            .unwrap_or(Vec3::ONE)
    }

    /// Get the transformation matrix
    pub fn matrix(&self) -> Mat4 {
        let pos = self.position_vec3();
        let rot = self.rotation_quat();
        let scale = self.scale_vec3();

        log::trace!(
            "Transform matrix: pos=[{:.2}, {:.2}, {:.2}], scale=[{:.2}, {:.2}, {:.2}]",
            pos.x, pos.y, pos.z,
            scale.x, scale.y, scale.z
        );

        Mat4::from_scale_rotation_translation(scale, rot, pos)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;

    #[test]
    fn test_euler_degrees_to_radians_conversion() {
        // Test that TypeScript degrees are correctly converted to radians
        let transform = Transform {
            position: None,
            rotation: Some(vec![90.0, 0.0, 0.0]), // 90 degrees pitch
            scale: None,
        };

        let quat = transform.rotation_quat();

        // 90 degrees around X should be PI/2 radians
        let expected = Quat::from_euler(glam::EulerRot::XYZ, PI / 2.0, 0.0, 0.0);

        // Compare quaternions with tolerance
        assert!((quat.x - expected.x).abs() < 0.001);
        assert!((quat.y - expected.y).abs() < 0.001);
        assert!((quat.z - expected.z).abs() < 0.001);
        assert!((quat.w - expected.w).abs() < 0.001);
    }

    #[test]
    fn test_plane_rotation_negative_90_degrees() {
        // Test the specific case from testphysics.json: plane with -90 degree rotation
        let transform = Transform {
            position: None,
            rotation: Some(vec![-90.0, 0.0, 0.0]), // -90 degrees around X (plane horizontal)
            scale: None,
        };

        let quat = transform.rotation_quat();

        // -90 degrees around X should be -PI/2 radians
        let expected = Quat::from_euler(glam::EulerRot::XYZ, -PI / 2.0, 0.0, 0.0);

        assert!((quat.x - expected.x).abs() < 0.001);
        assert!((quat.y - expected.y).abs() < 0.001);
        assert!((quat.z - expected.z).abs() < 0.001);
        assert!((quat.w - expected.w).abs() < 0.001);
    }

    #[test]
    fn test_quaternion_passthrough() {
        // Test that quaternions (4 values) are used directly without conversion
        let transform = Transform {
            position: None,
            rotation: Some(vec![0.0, 0.0, 0.0, 1.0]), // Identity quaternion
            scale: None,
        };

        let quat = transform.rotation_quat();

        assert_eq!(quat.x, 0.0);
        assert_eq!(quat.y, 0.0);
        assert_eq!(quat.z, 0.0);
        assert_eq!(quat.w, 1.0);
    }

    #[test]
    fn test_zero_euler_degrees() {
        // Test that [0, 0, 0] degrees gives identity quaternion
        let transform = Transform {
            position: None,
            rotation: Some(vec![0.0, 0.0, 0.0]),
            scale: None,
        };

        let quat = transform.rotation_quat();
        let identity = Quat::IDENTITY;

        assert!((quat.x - identity.x).abs() < 0.001);
        assert!((quat.y - identity.y).abs() < 0.001);
        assert!((quat.z - identity.z).abs() < 0.001);
        assert!((quat.w - identity.w).abs() < 0.001);
    }

    #[test]
    fn test_full_360_degree_rotation() {
        // Test 360 degrees is equivalent to 0 degrees
        let transform_360 = Transform {
            position: None,
            rotation: Some(vec![360.0, 0.0, 0.0]),
            scale: None,
        };

        let transform_0 = Transform {
            position: None,
            rotation: Some(vec![0.0, 0.0, 0.0]),
            scale: None,
        };

        let quat_360 = transform_360.rotation_quat();
        let quat_0 = transform_0.rotation_quat();

        // They should be very close (within floating point tolerance)
        assert!((quat_360.x - quat_0.x).abs() < 0.001);
        assert!((quat_360.y - quat_0.y).abs() < 0.001);
        assert!((quat_360.z - quat_0.z).abs() < 0.001);
        assert!((quat_360.w - quat_0.w).abs() < 0.001);
    }
}
