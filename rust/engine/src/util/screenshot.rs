/// Screenshot rendering utilities
///
/// Handles offscreen rendering to textures and saving to image files.
/// Supports JPEG and PNG formats with configurable quality and resolution scaling.

use anyhow::{Context as AnyhowContext, Result};
use std::path::Path;
use three_d::*;

use crate::renderer::{CameraConfig, SkyboxRenderer};
use crate::threed::threed_renderer::MeshRenderState;

/// Capture a screenshot by rendering to an offscreen texture and saving it to a file
///
/// # Arguments
/// * `context` - Three-d rendering context
/// * `camera` - Main camera for rendering
/// * `additional_cameras` - Additional cameras (e.g., for split-screen)
/// * `camera_config` - Main camera configuration
/// * `additional_configs` - Additional camera configurations
/// * `meshes` - All scene meshes
/// * `lights` - All scene lights
/// * `skybox_renderer` - Skybox renderer
/// * `additional_skyboxes` - Skybox renderers for additional cameras
/// * `render_state` - Mesh visibility state
/// * `window_size` - Current window dimensions
/// * `path` - Output file path
/// * `scale` - Resolution scale factor (1.0 = window size, 0.5 = half res)
/// * `quality` - JPEG quality (0-100, PNG ignores this)
/// * `physics_world` - Optional physics world for debug overlay
/// * `debug_line_renderer` - Optional debug line renderer
pub fn render_to_screenshot(
    context: &Context,
    camera: &Camera,
    additional_cameras: &[(Camera, CameraConfig, &SkyboxRenderer, Vec3, Vec3)],
    camera_config: Option<&CameraConfig>,
    skybox_renderer: &SkyboxRenderer,
    meshes: &[&Gm<Mesh, PhysicalMaterial>],
    lights: &[&dyn Light],
    render_state: Option<&MeshRenderState>,
    window_size: (u32, u32),
    path: &Path,
    scale: f32,
    quality: u8,
    physics_world: Option<&vibe_physics::PhysicsWorld>,
    debug_line_renderer: Option<&crate::renderer::DebugLineRenderer>,
) -> Result<()> {
    log::info!("Rendering screenshot to: {}", path.display());

    // Calculate scaled dimensions
    let width = ((window_size.0 as f32) * scale).max(1.0) as u32;
    let height = ((window_size.1 as f32) * scale).max(1.0) as u32;

    log::info!("  Resolution: {}x{} (scale: {:.2})", width, height, scale);

    // Create a color texture to render to
    let mut color_texture = Texture2D::new_empty::<[u8; 4]>(
        context,
        width,
        height,
        Interpolation::Nearest,
        Interpolation::Nearest,
        None,
        Wrapping::ClampToEdge,
        Wrapping::ClampToEdge,
    );

    // Create a depth texture
    let mut depth_texture = DepthTexture2D::new::<f32>(
        context,
        width,
        height,
        Wrapping::ClampToEdge,
        Wrapping::ClampToEdge,
    );

    // Create render target
    let render_target = RenderTarget::new(
        color_texture.as_color_target(None),
        depth_texture.as_depth_target(),
    );

    // Clear the render target using camera's background color
    let clear_color = camera_config
        .and_then(|c| c.background_color)
        .unwrap_or((0.0, 0.0, 0.0, 1.0));

    render_target.clear(ClearState::color_and_depth(
        clear_color.0,
        clear_color.1,
        clear_color.2,
        clear_color.3,
        1.0,
    ));

    // Render skybox if enabled
    if let Some(config) = camera_config {
        if config.clear_flags.as_deref() == Some("skybox") {
            skybox_renderer.render(&render_target, camera);
        }
    }

    // Filter visible meshes
    let visible_meshes: Vec<&Gm<Mesh, PhysicalMaterial>> = if let Some(state) = render_state {
        meshes
            .iter()
            .filter(|_mesh| {
                // TODO: Apply visibility filtering based on MeshRenderState
                // For now, include all meshes
                true
            })
            .copied()
            .collect()
    } else {
        meshes.to_vec()
    };

    // Render scene
    render_target.render(camera, &visible_meshes, lights);

    // Render debug overlay if physics world is provided
    if let (Some(physics), Some(debug_renderer)) = (physics_world, debug_line_renderer) {
        use crate::debug::{append_collider_lines, append_ground_grid, LineBatch};

        let mut line_batch = LineBatch::new();
        append_ground_grid(&mut line_batch, 20.0, 20);
        append_collider_lines(physics, &mut line_batch);

        if let Some(debug_mesh) = debug_renderer.create_line_mesh(&line_batch)? {
            render_target.render(camera, &[&debug_mesh], &[]);
        }
    }

    // Read pixels from the render target (RGBA u8 format)
    let pixels: Vec<[u8; 4]> = render_target.read_color();

    // Flatten the pixel data into a byte vec
    let bytes: Vec<u8> = pixels.into_iter().flat_map(|pixel| pixel).collect();

    // Create the image
    let img = image::RgbaImage::from_raw(width, height, bytes)
        .with_context(|| "Failed to create image from pixels")?;

    // Determine output format from file extension
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase());

    match extension.as_deref() {
        Some("jpg") | Some("jpeg") => {
            // Convert RGBA to RGB (JPEG doesn't support alpha)
            let rgb_img = image::DynamicImage::ImageRgba8(img).to_rgb8();

            // Save as JPEG with specified quality
            use image::codecs::jpeg::JpegEncoder;
            let file =
                std::fs::File::create(path).with_context(|| "Failed to create output file")?;
            let mut encoder = JpegEncoder::new_with_quality(file, quality);
            encoder
                .encode(
                    rgb_img.as_raw(),
                    width,
                    height,
                    image::ColorType::Rgb8.into(),
                )
                .with_context(|| "Failed to encode JPEG")?;
            log::info!("Screenshot saved as JPEG (quality: {})", quality);
        }
        Some("png") | None => {
            // Save as PNG (image crate will use default compression)
            img.save(path)
                .with_context(|| format!("Failed to save PNG to {}", path.display()))?;
            log::info!("Screenshot saved as PNG");
        }
        _ => {
            // Fallback to default save for other formats
            img.save(path)
                .with_context(|| format!("Failed to save screenshot to {}", path.display()))?;
            log::info!("Screenshot saved successfully");
        }
    }

    Ok(())
}

/// Calculate viewports for screenshot rendering based on camera configurations
///
/// Returns (main_viewport, additional_viewports)
pub fn calculate_screenshot_viewports(
    target_size: (u32, u32),
    additional_configs: &[CameraConfig],
) -> (Viewport, Vec<Viewport>) {
    let main = Viewport::new_at_origo(target_size.0.max(1), target_size.1.max(1));
    let additional = additional_configs
        .iter()
        .map(|config| viewport_from_config(config, target_size))
        .collect();

    (main, additional)
}

/// Create a viewport from camera configuration and target size
fn viewport_from_config(config: &CameraConfig, window_size: (u32, u32)) -> Viewport {
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

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_ecs_bridge::decoders::ViewportRect;

    fn base_camera_config() -> CameraConfig {
        CameraConfig {
            position: vec3(0.0, 0.0, 0.0),
            target: vec3(0.0, 0.0, -1.0),
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            is_main: false,
            projection_type: "perspective".to_string(),
            orthographic_size: 5.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: None,
            enable_smoothing: false,
            follow_target: None,
            follow_offset: None,
            smoothing_speed: 0.0,
            rotation_smoothing: 0.0,
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
        }
    }

    #[test]
    fn test_screenshot_viewports_match_target_size() {
        let (main_viewport, additional) = calculate_screenshot_viewports((1920, 1080), &[]);

        assert_eq!(main_viewport.x, 0);
        assert_eq!(main_viewport.y, 0);
        assert_eq!(main_viewport.width, 1920);
        assert_eq!(main_viewport.height, 1080);
        assert!(additional.is_empty());
    }

    #[test]
    fn test_screenshot_viewports_scale_additional_cameras() {
        let mut config = base_camera_config();
        config.viewport_rect = Some(ViewportRect {
            x: 0.5,
            y: 0.25,
            width: 0.5,
            height: 0.5,
        });

        let (_, additional) = calculate_screenshot_viewports((800, 600), &[config]);
        assert_eq!(additional.len(), 1);
        let vp = additional[0];
        assert_eq!(vp.x, 400);
        assert_eq!(vp.y, 150);
        assert_eq!(vp.width, 400);
        assert_eq!(vp.height, 300);
    }
}
