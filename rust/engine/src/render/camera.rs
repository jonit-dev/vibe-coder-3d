use glam::{Mat4, Vec3};
use wgpu::Color;

pub struct Camera {
    pub position: Vec3,
    pub target: Vec3,
    pub up: Vec3,
    pub fov: f32,
    pub aspect: f32,
    pub near: f32,
    pub far: f32,
    pub background_color: Color,
}

impl Camera {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            position: Vec3::new(0.0, 2.0, 5.0),
            target: Vec3::ZERO,
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: width as f32 / height as f32,
            near: 0.1,
            far: 1000.0,
            background_color: Color {
                r: 0.1,
                g: 0.2,
                b: 0.3,
                a: 1.0,
            },
        }
    }

    pub fn view_matrix(&self) -> Mat4 {
        Mat4::look_at_rh(self.position, self.target, self.up)
    }

    pub fn projection_matrix(&self) -> Mat4 {
        Mat4::perspective_rh(self.fov, self.aspect, self.near, self.far)
    }

    pub fn view_projection_matrix(&self) -> Mat4 {
        self.projection_matrix() * self.view_matrix()
    }

    pub fn update_aspect(&mut self, width: u32, height: u32) {
        self.aspect = width as f32 / height as f32;
    }

    pub fn apply_component(&mut self, camera_comp: &crate::ecs::components::camera::CameraComponent) {
        self.fov = camera_comp.fov.to_radians();
        self.near = camera_comp.near;
        self.far = camera_comp.far;

        // Apply background color if specified
        if let Some(ref bg) = camera_comp.backgroundColor {
            self.background_color = Color {
                r: bg.r as f64,
                g: bg.g as f64,
                b: bg.b as f64,
                a: bg.a as f64,
            };
            log::info!("Applied background color: r={}, g={}, b={}, a={}", bg.r, bg.g, bg.b, bg.a);
        }
    }
}
