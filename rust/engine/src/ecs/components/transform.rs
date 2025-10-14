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
    /// Handles both Euler angles [x, y, z] and quaternions [x, y, z, w]
    pub fn rotation_quat(&self) -> Quat {
        self.rotation.as_ref()
            .map(|r| {
                match r.len() {
                    3 => {
                        // Euler angles in radians [x, y, z]
                        Quat::from_euler(glam::EulerRot::XYZ, r[0], r[1], r[2])
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
        Mat4::from_scale_rotation_translation(
            self.scale_vec3(),
            self.rotation_quat(),
            self.position_vec3(),
        )
    }
}
