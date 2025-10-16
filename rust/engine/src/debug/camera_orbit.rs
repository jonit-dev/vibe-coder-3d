use glam::{Vec2, Vec3};
use crate::render::camera::Camera;

/// Orbit camera controller for debug mode
/// Allows mouse-driven rotation, panning, and zooming around a target point
pub struct OrbitController {
    pub enabled: bool,
    pub target: Vec3,
    pub yaw: f32,
    pub pitch: f32,
    pub distance: f32,

    // Sensitivities
    pub orbit_sensitivity: f32,
    pub pan_sensitivity: f32,
    pub zoom_sensitivity: f32,

    // Mouse state
    right_button_pressed: bool,
    middle_button_pressed: bool,
    last_mouse_pos: Option<Vec2>,
}

impl OrbitController {
    /// Create a new orbit controller from an existing camera
    pub fn new_from_camera(camera: &Camera) -> Self {
        // Calculate initial orbit parameters from camera
        let to_camera = camera.position - camera.target;
        let distance = to_camera.length();

        // Calculate yaw and pitch from direction vector
        let direction = to_camera.normalize();
        let yaw = direction.x.atan2(direction.z);
        let pitch = direction.y.asin();

        Self {
            enabled: false,
            target: camera.target,
            yaw,
            pitch,
            distance,
            orbit_sensitivity: 0.005,
            pan_sensitivity: 0.005,
            zoom_sensitivity: 0.1,
            right_button_pressed: false,
            middle_button_pressed: false,
            last_mouse_pos: None,
        }
    }

    /// Handle mouse button press
    pub fn handle_mouse_button(&mut self, button: winit::event::MouseButton, state: winit::event::ElementState) {
        use winit::event::{ElementState, MouseButton};

        match button {
            MouseButton::Right => {
                self.right_button_pressed = state == ElementState::Pressed;
                if state == ElementState::Released {
                    self.last_mouse_pos = None;
                }
            }
            MouseButton::Middle => {
                self.middle_button_pressed = state == ElementState::Pressed;
                if state == ElementState::Released {
                    self.last_mouse_pos = None;
                }
            }
            _ => {}
        }
    }

    /// Handle mouse movement
    pub fn handle_mouse_move(&mut self, position: Vec2) {
        if !self.enabled {
            return;
        }

        if let Some(last_pos) = self.last_mouse_pos {
            let delta = position - last_pos;

            if self.right_button_pressed {
                // Orbit: rotate around target
                self.handle_orbit_delta(delta);
            } else if self.middle_button_pressed {
                // Pan: move target and camera together
                self.handle_pan_delta(delta);
            }
        }

        self.last_mouse_pos = Some(position);
    }

    /// Handle scroll wheel (zoom in/out)
    pub fn handle_scroll(&mut self, delta: f32) {
        if !self.enabled {
            return;
        }

        // Clamp distance to reasonable range
        self.distance = (self.distance - delta * self.zoom_sensitivity * self.distance).clamp(0.1, 1000.0);
    }

    fn handle_orbit_delta(&mut self, delta: Vec2) {
        // Update yaw and pitch based on mouse delta
        self.yaw -= delta.x * self.orbit_sensitivity;
        self.pitch = (self.pitch - delta.y * self.orbit_sensitivity).clamp(
            -std::f32::consts::PI / 2.0 + 0.01, // Avoid gimbal lock
            std::f32::consts::PI / 2.0 - 0.01,
        );
    }

    fn handle_pan_delta(&mut self, delta: Vec2) {
        // Calculate right and up vectors from current orientation
        let forward = Vec3::new(
            self.yaw.sin() * self.pitch.cos(),
            self.pitch.sin(),
            self.yaw.cos() * self.pitch.cos(),
        );
        let right = forward.cross(Vec3::Y).normalize();
        let up = right.cross(forward).normalize();

        // Pan the target point
        let pan_speed = self.pan_sensitivity * self.distance;
        self.target -= right * delta.x * pan_speed;
        self.target += up * delta.y * pan_speed;
    }

    /// Update the camera based on current orbit parameters
    pub fn update_camera(&self, camera: &mut Camera) {
        if !self.enabled {
            return;
        }

        // Calculate camera position from spherical coordinates
        let x = self.target.x + self.distance * self.yaw.sin() * self.pitch.cos();
        let y = self.target.y + self.distance * self.pitch.sin();
        let z = self.target.z + self.distance * self.yaw.cos() * self.pitch.cos();

        camera.position = Vec3::new(x, y, z);
        camera.target = self.target;
    }

    /// Enable or disable the orbit controller
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
        if !enabled {
            // Reset mouse state when disabled
            self.right_button_pressed = false;
            self.middle_button_pressed = false;
            self.last_mouse_pos = None;
        }
    }

    /// Initialize from the current camera state (useful when toggling on)
    pub fn sync_from_camera(&mut self, camera: &Camera) {
        let to_camera = camera.position - camera.target;
        self.distance = to_camera.length();
        self.target = camera.target;

        if self.distance > 0.01 {
            let direction = to_camera.normalize();
            self.yaw = direction.x.atan2(direction.z);
            self.pitch = direction.y.asin();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_camera() -> Camera {
        Camera {
            position: Vec3::new(0.0, 2.0, 5.0),
            target: Vec3::ZERO,
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: 16.0 / 9.0,
            near: 0.1,
            far: 1000.0,
            background_color: wgpu::Color::BLACK,
            projection_type: crate::render::camera::ProjectionType::Perspective,
            orthographic_size: 10.0,
        }
    }

    #[test]
    fn test_new_from_camera() {
        let camera = create_test_camera();
        let controller = OrbitController::new_from_camera(&camera);

        assert!(!controller.enabled);
        assert_eq!(controller.target, Vec3::ZERO);
        assert!(controller.distance > 0.0);
    }

    #[test]
    fn test_zoom() {
        let camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);
        controller.enabled = true;

        let initial_distance = controller.distance;
        controller.handle_scroll(1.0); // Zoom in
        assert!(controller.distance < initial_distance);

        controller.handle_scroll(-1.0); // Zoom out
        assert!(controller.distance > initial_distance - 0.01);
    }

    #[test]
    fn test_zoom_clamp() {
        let camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);
        controller.enabled = true;

        // Try to zoom in too much
        controller.distance = 0.5;
        controller.handle_scroll(100.0);
        assert!(controller.distance >= 0.1);

        // Try to zoom out too much
        controller.distance = 500.0;
        controller.handle_scroll(-10000.0);
        assert!(controller.distance <= 1000.0);
    }

    #[test]
    fn test_pitch_clamp() {
        let camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);

        // Try to set pitch beyond limits
        controller.handle_orbit_delta(Vec2::new(0.0, 1000.0));
        assert!(controller.pitch < std::f32::consts::PI / 2.0);
        assert!(controller.pitch > -std::f32::consts::PI / 2.0);
    }

    #[test]
    fn test_update_camera() {
        let mut camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);
        controller.enabled = true;

        // Modify orbit parameters
        controller.yaw = 0.0;
        controller.pitch = 0.0;
        controller.distance = 10.0;
        controller.target = Vec3::new(1.0, 2.0, 3.0);

        controller.update_camera(&mut camera);

        // Camera should be updated
        assert_eq!(camera.target, controller.target);
        assert!((camera.position - controller.target).length() - controller.distance < 0.01);
    }

    #[test]
    fn test_sync_from_camera() {
        let camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);

        // Modify camera
        let new_camera = Camera {
            position: Vec3::new(5.0, 5.0, 5.0),
            target: Vec3::new(1.0, 1.0, 1.0),
            ..camera
        };

        controller.sync_from_camera(&new_camera);

        assert_eq!(controller.target, new_camera.target);
        let expected_distance = (new_camera.position - new_camera.target).length();
        assert!((controller.distance - expected_distance).abs() < 0.01);
    }

    #[test]
    fn test_disabled_ignores_input() {
        let camera = create_test_camera();
        let mut controller = OrbitController::new_from_camera(&camera);
        controller.enabled = false;

        let initial_yaw = controller.yaw;
        let initial_distance = controller.distance;

        // Try to input when disabled
        controller.handle_mouse_move(Vec2::new(100.0, 100.0));
        controller.handle_scroll(5.0);

        // Should not have changed
        assert_eq!(controller.yaw, initial_yaw);
        assert_eq!(controller.distance, initial_distance);
    }
}
