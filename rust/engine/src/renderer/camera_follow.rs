/// Camera follow system for smooth target tracking
///
/// Provides functionality for cameras to follow entities in the scene with
/// configurable smoothing, offsets, and control modes (locked/free).
use three_d::*;
use vibe_scene::EntityId;
use vibe_scene_graph::SceneGraph;

use super::CameraConfig;

/// Update camera based on follow system with smoothing
///
/// Checks if the camera should follow a target and applies the follow behavior
/// with optional position and rotation smoothing.
pub fn update_camera_follow(
    camera: &mut Camera,
    config: &CameraConfig,
    scene_graph: Option<&mut SceneGraph>,
    last_position: &mut Vec3,
    last_target: &mut Vec3,
    delta_time: f32,
) {
    if let Some(target_id) = follow_target_if_locked(config) {
        if let Some(target_vec3) = compute_follow_target_position(scene_graph, target_id) {
            apply_follow_to_camera(
                camera,
                config,
                target_vec3,
                last_position,
                last_target,
                delta_time,
            );
        } else {
            log::warn!(
                "Camera follow target entity {} not found in scene",
                target_id
            );
        }
    }
}

/// Determine if camera should follow target based on control mode
///
/// Returns Some(target_id) if camera is in locked mode, None if free mode
fn follow_target_if_locked(config: &CameraConfig) -> Option<u32> {
    let target_id = config.follow_target?;
    match config
        .control_mode
        .as_deref()
        .map(|mode| mode.to_ascii_lowercase())
    {
        Some(ref mode) if mode == "locked" => Some(target_id),
        Some(ref mode) if mode == "free" => None,
        Some(ref mode) => {
            log::warn!(
                "Unknown camera controlMode '{}'; defaulting to locked follow.",
                mode
            );
            Some(target_id)
        }
        None => Some(target_id),
    }
}

/// Compute world position of follow target entity from scene graph
fn compute_follow_target_position(
    scene_graph: Option<&mut SceneGraph>,
    target_id: u32,
) -> Option<Vec3> {
    let graph = scene_graph?;
    let entity_id = EntityId::new(target_id as u64);
    let transform = graph.get_world_transform(entity_id)?;
    let target_pos = transform.w_axis.truncate();
    Some(vec3(target_pos.x, target_pos.y, target_pos.z))
}

/// Apply follow behavior to camera with smoothing
///
/// Updates camera position and target to follow the target entity,
/// with optional smoothing for both position and rotation.
fn apply_follow_to_camera(
    camera: &mut Camera,
    config: &CameraConfig,
    target_vec3: Vec3,
    last_position: &mut Vec3,
    last_target: &mut Vec3,
    delta_time: f32,
) {
    let offset = config.follow_offset.unwrap_or(vec3(0.0, 2.0, -5.0));
    let desired_position = target_vec3 + offset;

    let new_position = if config.enable_smoothing {
        let smoothing_factor = (config.smoothing_speed * delta_time).min(1.0);
        *last_position * (1.0 - smoothing_factor) + desired_position * smoothing_factor
    } else {
        desired_position
    };

    let desired_target = target_vec3;
    let new_target = if config.enable_smoothing {
        let rotation_factor = (config.rotation_smoothing * delta_time).min(1.0);
        *last_target * (1.0 - rotation_factor) + desired_target * rotation_factor
    } else {
        desired_target
    };

    camera.set_view(new_position, new_target, vec3(0.0, 1.0, 0.0));

    *last_position = new_position;
    *last_target = new_target;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::renderer::load_camera;
    use vibe_ecs_bridge::decoders::CameraComponent;

    fn config_with_control(control: Option<&str>) -> CameraConfig {
        let component = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 100.0,
            is_main: true,
            projection_type: "perspective".to_string(),
            orthographic_size: 10.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: control.map(|mode| mode.to_string()),
            enable_smoothing: false,
            follow_target: Some(42),
            follow_offset: None,
            smoothing_speed: 5.0,
            rotation_smoothing: 5.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        };

        load_camera(&component, None)
            .expect("load_camera should succeed")
            .expect("CameraConfig expected")
    }

    #[test]
    fn test_follow_enabled_when_locked() {
        let config = config_with_control(Some("locked"));
        assert_eq!(follow_target_if_locked(&config), Some(42));
    }

    #[test]
    fn test_follow_disabled_when_free() {
        let config = config_with_control(Some("free"));
        assert_eq!(follow_target_if_locked(&config), None);
    }

    #[test]
    fn test_follow_defaults_to_locked_when_unspecified() {
        let config = config_with_control(None);
        assert_eq!(follow_target_if_locked(&config), Some(42));
    }
}
