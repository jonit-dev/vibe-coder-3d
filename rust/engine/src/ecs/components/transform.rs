use glam::{Mat4, Quat, Vec3};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone, Copy)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<[f32; 4]>, // quaternion [x, y, z, w]
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            position: Some([0.0, 0.0, 0.0]),
            rotation: Some([0.0, 0.0, 0.0, 1.0]),
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
    pub fn rotation_quat(&self) -> Quat {
        self.rotation
            .map(|r| Quat::from_xyzw(r[0], r[1], r[2], r[3]))
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
