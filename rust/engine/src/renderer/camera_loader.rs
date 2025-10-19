/// Camera component loading
///
/// Handles loading and creating cameras from ECS components

use anyhow::Result;
use three_d::{degrees, vec3, Camera, Vec3, Viewport};
use vibe_ecs_bridge::decoders::{CameraComponent, Transform};

use super::transform_utils::convert_camera_transform;

/// Camera configuration extracted from ECS component
pub struct CameraConfig {
    pub position: Vec3,
    pub target: Vec3,
    pub fov: f32,
    pub near: f32,
    pub far: f32,
}

/// Load a camera component and extract configuration
pub fn load_camera(
    camera_component: &CameraComponent,
    transform: Option<&Transform>,
) -> Result<Option<CameraConfig>> {
    log::info!("  Camera:");
    log::info!("    Is Main:    {}", camera_component.is_main);
    log::info!(
        "    FOV:        {}° (DEGREES, no conversion needed)",
        camera_component.fov
    );
    log::info!("    Near Plane: {}", camera_component.near);
    log::info!("    Far Plane:  {}", camera_component.far);
    log::info!("    Projection: {:?}", camera_component.projection_type);

    // Only load if this is the main camera
    if !camera_component.is_main {
        log::info!("    Skipping non-main camera");
        return Ok(None);
    }

    // Extract position and target from transform
    let (position, target) = if let Some(t) = transform {
        convert_camera_transform(t)
    } else {
        log::info!("    Using default position/target (no transform)");
        (vec3(0.0, 2.0, 5.0), vec3(0.0, 0.0, 0.0))
    };

    log::info!("  Final Camera Configuration:");
    log::info!(
        "    Position: [{:.2}, {:.2}, {:.2}]",
        position.x,
        position.y,
        position.z
    );
    log::info!(
        "    Target:   [{:.2}, {:.2}, {:.2}]",
        target.x,
        target.y,
        target.z
    );
    log::info!("    Up:       [0.00, 1.00, 0.00]");

    Ok(Some(CameraConfig {
        position,
        target,
        fov: camera_component.fov,
        near: camera_component.near,
        far: camera_component.far,
    }))
}

/// Create a three-d Camera from CameraConfig
pub fn create_camera(config: &CameraConfig, window_size: (u32, u32)) -> Camera {
    let viewport = Viewport::new_at_origo(window_size.0, window_size.1);

    log::info!("    Viewport: {}x{}", window_size.0, window_size.1);

    Camera::new_perspective(
        viewport,
        config.position,
        config.target,
        vec3(0.0, 1.0, 0.0),
        degrees(config.fov),
        config.near,
        config.far,
    )
}
