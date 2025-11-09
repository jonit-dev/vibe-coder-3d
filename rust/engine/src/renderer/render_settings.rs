/// Render settings and viewport configuration
///
/// Handles camera viewport calculation and render settings preparation
/// (clear states, skybox, post-processing).
use three_d::*;

use super::camera_loader::CameraConfig;
use super::post_processing::PostProcessSettings;

/// Render settings for a camera pass
pub struct RenderSettings {
    pub clear_state: Option<ClearState>,
    pub render_skybox: bool,
    pub post_settings: Option<PostProcessSettings>,
}

/// Compute viewport from camera configuration and window size
pub fn viewport_from_config(config: &CameraConfig, window_size: (u32, u32)) -> Viewport {
    if let Some(ref rect) = config.viewport_rect {
        let x = (rect.x * window_size.0 as f32) as u32;
        let y = (rect.y * window_size.1 as f32) as u32;
        let width = (rect.width * window_size.0 as f32) as u32;
        let height = (rect.height * window_size.1 as f32) as u32;

        Viewport {
            x: x as i32,
            y: y as i32,
            width: width.max(1),
            height: height.max(1),
        }
    } else {
        Viewport::new_at_origo(window_size.0, window_size.1)
    }
}

/// Prepare render settings (clear state, skybox, post-processing) from camera config
pub fn prepare_render_settings_for(config: &CameraConfig, skybox_loaded: bool) -> RenderSettings {
    const NEUTRAL_GRAY: (f32, f32, f32, f32) = (64.0 / 255.0, 64.0 / 255.0, 64.0 / 255.0, 1.0);

    let solid_color = config
        .background_color
        .unwrap_or((0.0_f32, 0.0_f32, 0.0_f32, 1.0));

    let solid_clear = ClearState::color_and_depth(
        solid_color.0,
        solid_color.1,
        solid_color.2,
        solid_color.3,
        1.0,
    );
    let gray_clear = ClearState::color_and_depth(
        NEUTRAL_GRAY.0,
        NEUTRAL_GRAY.1,
        NEUTRAL_GRAY.2,
        NEUTRAL_GRAY.3,
        1.0,
    );

    let mut render_skybox = false;

    let clear_state = match config
        .clear_flags
        .as_deref()
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_else(|| "solidcolor".to_string())
        .as_str()
    {
        "skybox" => {
            if skybox_loaded {
                render_skybox = true;
                Some(ClearState::depth(1.0))
            } else {
                // No skybox texture - use neutral gray (#404040) to match Three.js
                Some(gray_clear)
            }
        }
        "depthonly" => Some(ClearState::depth(1.0)),
        "dontclear" => None,
        "solidcolor" | "color" => Some(solid_clear),
        other => {
            log::warn!(
                "Unknown clear flag '{}', defaulting to neutral gray clear.",
                other
            );
            Some(gray_clear)
        }
    };

    let post_settings = PostProcessSettings::from_camera(config);

    RenderSettings {
        clear_state,
        render_skybox,
        post_settings,
    }
}
