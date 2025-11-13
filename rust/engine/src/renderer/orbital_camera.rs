/// Orbital camera controller for debug mode
///
/// Provides mouse-controlled orbital camera similar to R3F OrbitControls
use three_d::*;
use winit::event::MouseButton;

/// Orbital camera controller state
#[derive(Debug, Clone)]
pub struct OrbitalCamera {
    /// Center point to orbit around
    pub target: Vec3,
    /// Horizontal rotation angle (in radians)
    pub yaw: f32,
    /// Vertical rotation angle (in radians, clamped)
    pub pitch: f32,
    /// Distance from target
    pub distance: f32,
    /// Mouse sensitivity for rotation
    pub rotate_sensitivity: f32,
    /// Mouse sensitivity for panning
    pub pan_sensitivity: f32,
    /// Mouse sensitivity for zoom (wheel)
    pub zoom_sensitivity: f32,
    /// Minimum distance from target
    pub min_distance: f32,
    /// Maximum distance from target
    pub max_distance: f32,
    /// Min pitch angle (radians)
    pub min_pitch: f32,
    /// Max pitch angle (radians)
    pub max_pitch: f32,
    /// Last mouse position for delta calculation
    last_mouse_pos: Option<(f64, f64)>,
    /// Whether we're currently rotating (right mouse button)
    is_rotating: bool,
    /// Whether we're currently panning (middle mouse button)
    is_panning: bool,
}

impl OrbitalCamera {
    /// Create a new orbital camera from an existing camera
    pub fn from_camera(camera: &Camera) -> Self {
        let position = camera.position();
        let target = *camera.target();

        // Calculate initial spherical coordinates
        let offset = position - target;
        let distance = offset.magnitude();
        let yaw = offset.z.atan2(offset.x);
        let pitch = (offset.y / distance).asin();

        Self {
            target,
            yaw,
            pitch,
            distance,
            rotate_sensitivity: 0.005,
            pan_sensitivity: 0.001,
            zoom_sensitivity: 0.1,
            min_distance: 1.0,
            max_distance: 1000.0,
            min_pitch: -std::f32::consts::FRAC_PI_2 + 0.01,
            max_pitch: std::f32::consts::FRAC_PI_2 - 0.01,
            last_mouse_pos: None,
            is_rotating: false,
            is_panning: false,
        }
    }

    /// Handle mouse button press
    pub fn on_mouse_down(&mut self, button: MouseButton, position: (f64, f64)) {
        match button {
            MouseButton::Left => {
                self.is_rotating = true;
                self.last_mouse_pos = Some(position);
                log::info!(
                    "Orbital camera: rotation enabled at ({:.1}, {:.1})",
                    position.0,
                    position.1
                );
            }
            MouseButton::Right => {
                self.is_panning = true;
                self.last_mouse_pos = Some(position);
                log::info!(
                    "Orbital camera: panning enabled at ({:.1}, {:.1})",
                    position.0,
                    position.1
                );
            }
            _ => {}
        }
    }

    /// Handle mouse button release
    pub fn on_mouse_up(&mut self, button: MouseButton) {
        match button {
            MouseButton::Left => {
                self.is_rotating = false;
                self.last_mouse_pos = None;
            }
            MouseButton::Right => {
                self.is_panning = false;
                self.last_mouse_pos = None;
            }
            _ => {}
        }
    }

    /// Handle mouse movement
    pub fn on_mouse_move(&mut self, position: (f64, f64)) {
        if let Some(last_pos) = self.last_mouse_pos {
            let delta_x = (position.0 - last_pos.0) as f32;
            let delta_y = (position.1 - last_pos.1) as f32;

            if self.is_rotating {
                // Rotate around target
                self.yaw -= delta_x * self.rotate_sensitivity;
                self.pitch -= delta_y * self.rotate_sensitivity;

                // Clamp pitch to avoid gimbal lock
                self.pitch = self.pitch.clamp(self.min_pitch, self.max_pitch);

                if delta_x.abs() > 0.1 || delta_y.abs() > 0.1 {
                    log::debug!(
                        "Orbital camera rotating: delta=({:.1}, {:.1}), yaw={:.2}, pitch={:.2}",
                        delta_x,
                        delta_y,
                        self.yaw,
                        self.pitch
                    );
                }
            } else if self.is_panning {
                // Pan the target point
                // Calculate right and up vectors for camera-relative panning
                let forward = self.get_position() - self.target;
                let right = vec3(0.0, 1.0, 0.0).cross(forward).normalize();
                let up = forward.cross(right).normalize();

                let pan_x = right * delta_x * self.pan_sensitivity * self.distance;
                let pan_y = up * delta_y * self.pan_sensitivity * self.distance;

                self.target += pan_x + pan_y;
            }
        }

        self.last_mouse_pos = Some(position);
    }

    /// Handle mouse wheel for zoom
    pub fn on_mouse_wheel(&mut self, delta: f32) {
        let old_distance = self.distance;
        self.distance -= delta * self.zoom_sensitivity * self.distance;
        self.distance = self.distance.clamp(self.min_distance, self.max_distance);

        if (old_distance - self.distance).abs() > 0.01 {
            log::debug!(
                "Orbital camera zoom: distance {:.2} -> {:.2}",
                old_distance,
                self.distance
            );
        }
    }

    /// Get camera position based on spherical coordinates
    pub fn get_position(&self) -> Vec3 {
        let x = self.target.x + self.distance * self.pitch.cos() * self.yaw.cos();
        let y = self.target.y + self.distance * self.pitch.sin();
        let z = self.target.z + self.distance * self.pitch.cos() * self.yaw.sin();
        vec3(x, y, z)
    }

    /// Update a three-d camera with this orbital camera's state
    pub fn update_camera(&self, camera: &mut Camera) {
        let position = self.get_position();
        let up = vec3(0.0, 1.0, 0.0);

        // Update camera view matrix
        camera.set_view(position, self.target, up);
    }

    /// Reset camera state (useful after toggling)
    pub fn reset(&mut self) {
        self.is_rotating = false;
        self.is_panning = false;
        self.last_mouse_pos = None;
    }
}
