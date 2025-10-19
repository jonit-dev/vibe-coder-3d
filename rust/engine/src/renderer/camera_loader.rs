/// Camera component loading
///
/// Handles loading and creating cameras from ECS components
use anyhow::Result;
use three_d::{degrees, vec3, Camera, Vec3, Viewport};
use vibe_ecs_bridge::decoders::{CameraComponent, Transform, ViewportRect};

use super::transform_utils::convert_camera_transform;

/// Camera configuration extracted from ECS component
#[derive(Debug, Clone)]
pub struct CameraConfig {
    // Basic camera properties
    pub position: Vec3,
    pub target: Vec3,
    pub fov: f32,
    pub near: f32,
    pub far: f32,
    pub is_main: bool,
    pub projection_type: String,
    pub orthographic_size: f32,
    pub depth: i32,

    // Background and clear behavior
    pub clear_flags: Option<String>,
    pub background_color: Option<(f32, f32, f32, f32)>,
    pub skybox_texture: Option<String>,

    // Control & follow
    pub control_mode: Option<String>,
    pub enable_smoothing: bool,
    pub follow_target: Option<u32>,
    pub follow_offset: Option<Vec3>,
    pub smoothing_speed: f32,
    pub rotation_smoothing: f32,

    // Viewport (normalized 0..1)
    pub viewport_rect: Option<ViewportRect>,

    // HDR / Tone Mapping
    pub hdr: bool,
    pub tone_mapping: Option<String>,
    pub tone_mapping_exposure: f32,

    // Post-processing
    pub enable_post_processing: bool,
    pub post_processing_preset: Option<String>,

    // Skybox transforms
    pub skybox_scale: Option<Vec3>,
    pub skybox_rotation: Option<Vec3>,
    pub skybox_repeat: Option<(f32, f32)>,
    pub skybox_offset: Option<(f32, f32)>,
    pub skybox_intensity: f32,
    pub skybox_blur: f32,
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
    log::info!("    Depth:      {}", camera_component.depth);

    // Log advanced features
    if camera_component.viewport_rect.is_some() {
        log::info!("    Viewport Rect: {:?}", camera_component.viewport_rect);
    }
    if camera_component.hdr {
        log::info!("    HDR: enabled");
        log::info!("    Tone Mapping: {:?}", camera_component.tone_mapping);
        log::info!("    Exposure: {}", camera_component.tone_mapping_exposure);
    }
    if camera_component.follow_target.is_some() {
        log::info!("    Follow Target: {:?}", camera_component.follow_target);
        log::info!("    Follow Offset: {:?}", camera_component.follow_offset);
        log::info!(
            "    Smoothing: {} (enabled: {})",
            camera_component.smoothing_speed,
            camera_component.enable_smoothing
        );
    }
    if camera_component.skybox_texture.is_some() {
        log::info!("    Skybox: {:?}", camera_component.skybox_texture);
        log::info!(
            "    Skybox Intensity: {}",
            camera_component.skybox_intensity
        );
    }

    // Extract position and target from transform
    let (position, target) = if let Some(t) = transform {
        convert_camera_transform(t)
    } else {
        log::info!("    Using default position/target (no transform)");
        (vec3(0.0, 2.0, 5.0), vec3(0.0, 0.0, 0.0))
    };

    // Convert background color if present
    let background_color = camera_component
        .background_color
        .as_ref()
        .map(|c| (c.r, c.g, c.b, c.a));

    // Convert follow offset if present
    let follow_offset = camera_component
        .follow_offset
        .map(|offset| vec3(offset[0], offset[1], offset[2]));

    // Convert skybox transforms if present
    let skybox_scale = camera_component
        .skybox_scale
        .map(|s| vec3(s[0], s[1], s[2]));
    let skybox_rotation = camera_component
        .skybox_rotation
        .map(|r| vec3(r[0], r[1], r[2]));
    let skybox_repeat = camera_component.skybox_repeat.map(|r| (r[0], r[1]));
    let skybox_offset = camera_component.skybox_offset.map(|o| (o[0], o[1]));

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
        // Basic properties
        position,
        target,
        fov: camera_component.fov,
        near: camera_component.near,
        far: camera_component.far,
        is_main: camera_component.is_main,
        projection_type: camera_component.projection_type.clone(),
        orthographic_size: camera_component.orthographic_size,
        depth: camera_component.depth,

        // Background and clear behavior
        clear_flags: camera_component.clear_flags.clone(),
        background_color,
        skybox_texture: camera_component.skybox_texture.clone(),

        // Control & follow
        control_mode: camera_component.control_mode.clone(),
        enable_smoothing: camera_component.enable_smoothing,
        follow_target: camera_component.follow_target,
        follow_offset,
        smoothing_speed: camera_component.smoothing_speed,
        rotation_smoothing: camera_component.rotation_smoothing,

        // Viewport
        viewport_rect: camera_component.viewport_rect.clone(),

        // HDR / Tone Mapping
        hdr: camera_component.hdr,
        tone_mapping: camera_component.tone_mapping.clone(),
        tone_mapping_exposure: camera_component.tone_mapping_exposure,

        // Post-processing
        enable_post_processing: camera_component.enable_post_processing,
        post_processing_preset: camera_component.post_processing_preset.clone(),

        // Skybox transforms
        skybox_scale,
        skybox_rotation,
        skybox_repeat,
        skybox_offset,
        skybox_intensity: camera_component.skybox_intensity,
        skybox_blur: camera_component.skybox_blur,
    }))
}

/// Create a three-d Camera from CameraConfig
pub fn create_camera(config: &CameraConfig, window_size: (u32, u32)) -> Camera {
    // Calculate viewport based on viewport_rect if provided
    let viewport = if let Some(ref rect) = config.viewport_rect {
        // Convert normalized 0..1 coordinates to pixel coordinates
        let x = (rect.x * window_size.0 as f32) as u32;
        let y = (rect.y * window_size.1 as f32) as u32;
        let width = (rect.width * window_size.0 as f32) as u32;
        let height = (rect.height * window_size.1 as f32) as u32;

        log::info!(
            "    Viewport: {}x{} at ({}, {}) (from normalized rect: x={}, y={}, width={}, height={})",
            width, height, x, y, rect.x, rect.y, rect.width, rect.height
        );

        Viewport {
            x: x as i32,
            y: y as i32,
            width,
            height,
        }
    } else {
        log::info!(
            "    Viewport: {}x{} (fullscreen)",
            window_size.0,
            window_size.1
        );
        Viewport::new_at_origo(window_size.0, window_size.1)
    };

    // Create camera based on projection type
    let camera = match config.projection_type.as_str() {
        "orthographic" => {
            log::info!(
                "    Creating orthographic camera (size: {})",
                config.orthographic_size
            );
            Camera::new_orthographic(
                viewport,
                config.position,
                config.target,
                vec3(0.0, 1.0, 0.0),
                config.orthographic_size,
                config.near,
                config.far,
            )
        }
        _ => {
            // Default to perspective
            log::info!("    Creating perspective camera (FOV: {}°)", config.fov);
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
    };

    camera
}
