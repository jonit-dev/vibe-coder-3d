use glam::Vec3 as GlamVec3;
use three_d::*;
use vibe_scene_graph::SceneGraph;

use crate::renderer::camera_renderer::AdditionalCamera;
use crate::renderer::CameraConfig;

/// Manages all camera-related state for the renderer
///
/// Responsibilities:
/// - Main camera state and configuration
/// - Additional cameras (multi-viewport support)
/// - Camera follow system smoothing state
/// - Camera updates and viewport management
pub struct ThreeDCameraManager {
    /// Main rendering camera
    camera: Camera,

    /// Main camera configuration (position, viewport, follow, etc.)
    camera_config: Option<CameraConfig>,

    /// Additional cameras for multi-viewport rendering
    additional_cameras: Vec<AdditionalCamera>,

    /// Camera follow smoothing - last position
    last_camera_position: Vec3,

    /// Camera follow smoothing - last target
    last_camera_target: Vec3,
}

impl ThreeDCameraManager {
    pub fn new(window_size: (u32, u32)) -> Self {
        // Create perspective camera
        let viewport = Viewport::new_at_origo(window_size.0, window_size.1);
        let camera = Camera::new_perspective(
            viewport,
            vec3(0.0, 2.0, 5.0), // position
            vec3(0.0, 0.0, 0.0), // target
            vec3(0.0, 1.0, 0.0), // up
            degrees(60.0),       // fov
            0.1,                 // near
            1000.0,              // far
        );

        log::info!("  Viewport: {}x{}", window_size.0, window_size.1);
        log::info!("  Camera FOV: 60°, Near: 0.1, Far: 1000.0");

        let initial_pos = vec3(0.0, 2.0, 5.0);
        let initial_target = vec3(0.0, 0.0, 0.0);

        Self {
            camera,
            camera_config: None,
            additional_cameras: Vec::new(),
            last_camera_position: initial_pos,
            last_camera_target: initial_target,
        }
    }

    /// Get reference to main camera
    pub fn camera(&self) -> &Camera {
        &self.camera
    }

    /// Get mutable reference to main camera
    pub fn camera_mut(&mut self) -> &mut Camera {
        &mut self.camera
    }

    /// Get camera configuration
    pub fn camera_config(&self) -> Option<&CameraConfig> {
        self.camera_config.as_ref()
    }

    /// Set camera configuration
    pub fn set_camera_config(&mut self, config: CameraConfig) {
        self.last_camera_position = config.position;
        self.last_camera_target = config.target;
        self.camera_config = Some(config);
    }

    /// Get additional cameras
    pub fn additional_cameras(&self) -> &[AdditionalCamera] {
        &self.additional_cameras
    }

    /// Get mutable additional cameras
    pub fn additional_cameras_mut(&mut self) -> &mut Vec<AdditionalCamera> {
        &mut self.additional_cameras
    }

    /// Add an additional camera
    pub fn add_additional_camera(&mut self, camera: AdditionalCamera) {
        self.additional_cameras.push(camera);
    }

    /// Clear additional cameras
    pub fn clear_additional_cameras(&mut self) {
        self.additional_cameras.clear();
    }

    /// Update camera based on follow system
    pub fn update_camera_follow(
        &mut self,
        scene_graph: &mut Option<SceneGraph>,
        delta_time: f32,
    ) {
        // Update main camera
        if let Some(ref config) = self.camera_config.clone() {
            crate::renderer::update_camera_follow(
                &mut self.camera,
                &config,
                scene_graph.as_mut(),
                &mut self.last_camera_position,
                &mut self.last_camera_target,
                delta_time,
            );
        }

        // Update additional cameras follow
        for idx in 0..self.additional_cameras.len() {
            let config = self.additional_cameras[idx].config.clone();
            let cam = &mut self.additional_cameras[idx];
            crate::renderer::update_camera_follow(
                &mut cam.camera,
                &config,
                scene_graph.as_mut(),
                &mut cam.last_position,
                &mut cam.last_target,
                delta_time,
            );
        }
    }

    /// Update camera position and target manually
    pub fn update_camera(&mut self, position: GlamVec3, target: GlamVec3) {
        let pos = vec3(position.x, position.y, position.z);
        let tgt = vec3(target.x, target.y, target.z);
        self.camera.set_view(pos, tgt, vec3(0.0, 1.0, 0.0));
    }

    /// Handle window resize - update camera viewports
    pub fn resize(&mut self, window_size: (u32, u32)) {
        if let Some(ref config) = self.camera_config {
            let viewport = crate::renderer::render_settings::viewport_from_config(config, window_size);
            self.camera.set_viewport(viewport);
        } else {
            self.camera
                .set_viewport(Viewport::new_at_origo(window_size.0, window_size.1));
        }

        for cam in &mut self.additional_cameras {
            let viewport = crate::renderer::render_settings::viewport_from_config(&cam.config, window_size);
            cam.camera.set_viewport(viewport);
        }
    }

    /// Get camera position as glam Vec3
    pub fn camera_position_glam(&self) -> GlamVec3 {
        let pos = self.camera.position();
        GlamVec3::new(pos.x, pos.y, pos.z)
    }

    /// Get camera target as glam Vec3
    pub fn camera_target_glam(&self) -> GlamVec3 {
        let target = self.camera.target();
        GlamVec3::new(target.x, target.y, target.z)
    }
}
