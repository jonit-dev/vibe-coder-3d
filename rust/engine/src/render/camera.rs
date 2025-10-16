use glam::{Mat4, Vec3};
use wgpu::Color;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ProjectionType {
    Perspective,
    Orthographic,
}

pub struct Camera {
    pub position: Vec3,
    pub target: Vec3,
    pub up: Vec3,
    pub fov: f32,
    pub aspect: f32,
    pub near: f32,
    pub far: f32,
    pub background_color: Color,
    pub projection_type: ProjectionType,
    pub orthographic_size: f32,
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
            projection_type: ProjectionType::Perspective,
            orthographic_size: 10.0,
        }
    }

    pub fn view_matrix(&self) -> Mat4 {
        Mat4::look_at_rh(self.position, self.target, self.up)
    }

    pub fn projection_matrix(&self) -> Mat4 {
        match self.projection_type {
            ProjectionType::Perspective => {
                // Use GL-style clip space (-1..1 for Z), we'll convert to WGPU below
                Mat4::perspective_rh_gl(self.fov, self.aspect, self.near, self.far)
            }
            ProjectionType::Orthographic => {
                let half_height = self.orthographic_size / 2.0;
                let half_width = half_height * self.aspect;
                // Use GL-style clip space for orthographic as well
                Mat4::orthographic_rh_gl(
                    -half_width,
                    half_width,
                    -half_height,
                    half_height,
                    self.near,
                    self.far,
                )
            }
        }
    }

    pub fn view_projection_matrix(&self) -> Mat4 {
        // Convert GL clip space to WGPU (0..1 depth) and keep Y-up
        // from https://sotrh.github.io/learn-wgpu/beginner/tutorial5-textures/#a-few-changes
        const OPENGL_TO_WGPU_MATRIX: Mat4 = Mat4::from_cols_array(&[
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5, 1.0,
        ]);

        OPENGL_TO_WGPU_MATRIX * self.projection_matrix() * self.view_matrix()
    }

    pub fn update_aspect(&mut self, width: u32, height: u32) {
        self.aspect = width as f32 / height as f32;
    }

    pub fn apply_component(
        &mut self,
        camera_comp: &crate::ecs::components::camera::CameraComponent,
    ) {
        self.fov = camera_comp.fov.to_radians();
        self.near = camera_comp.near;
        self.far = camera_comp.far;

        // Apply projection type
        self.projection_type = match camera_comp.projection_type.as_str() {
            "orthographic" => ProjectionType::Orthographic,
            _ => ProjectionType::Perspective,
        };
        self.orthographic_size = camera_comp.orthographic_size;

        log::info!(
            "Applied camera settings: projection={:?}, fov={:.1}°, near={}, far={}, ortho_size={}",
            self.projection_type,
            camera_comp.fov,
            self.near,
            self.far,
            self.orthographic_size
        );

        // Apply background color if specified, otherwise match Three.js default
        if let Some(ref bg) = camera_comp.background_color {
            self.background_color = Color {
                r: bg.r as f64,
                g: bg.g as f64,
                b: bg.b as f64,
                a: bg.a as f64,
            };
            log::info!(
                "Applied background color: r={}, g={}, b={}, a={}",
                bg.r,
                bg.g,
                bg.b,
                bg.a
            );

            // If alpha is 0 (editor often uses transparent background for skybox),
            // fall back to a dark gray similar to R3F default clear so content is visible.
            if bg.a <= 0.0 {
                self.background_color = Color {
                    r: 0.02,
                    g: 0.02,
                    b: 0.02,
                    a: 1.0,
                };
                log::info!("Background alpha=0 -> using neutral fallback color");
            }
        }
    }
}
