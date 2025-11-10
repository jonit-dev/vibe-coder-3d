/// Debug overlay rendering utilities
///
/// Provides debug visualization including grid, colliders, and other debug geometry.
use anyhow::Result;
use three_d::*;

use super::DebugLineRenderer;
use super::{CameraConfig, EnhancedDirectionalLight, ScreenOverlay};

/// Render debug overlay with grid, colliders, gizmos, and UI text
///
/// Draws ground grid, physics collider outlines, visual gizmos for cameras and lights, and control hints
pub fn render_debug_overlay(
    debug_line_renderer: &DebugLineRenderer,
    screen_overlay: &ScreenOverlay,
    camera: &Camera,
    target: &RenderTarget,
    physics_world: Option<&vibe_physics::PhysicsWorld>,
    camera_configs: &[(CameraConfig, bool)], // (config, is_active)
    directional_lights: &[EnhancedDirectionalLight],
    ambient_light_intensity: Option<f32>,
) -> Result<()> {
    use crate::debug::{append_collider_lines, append_ground_grid, LineBatch};
    use crate::renderer::debug_gizmos::{
        append_ambient_light_gizmo, append_camera_gizmo, append_directional_light_gizmo,
    };

    let mut line_batch = LineBatch::new();

    // Add ground grid (20x20 units, 20 divisions)
    append_ground_grid(&mut line_batch, 20.0, 20);

    // Add collider outlines if physics world exists
    if let Some(physics_world) = physics_world {
        append_collider_lines(physics_world, &mut line_batch);
    }

    // Add camera gizmos
    for (config, is_active) in camera_configs {
        append_camera_gizmo(&mut line_batch, config, *is_active);
    }

    // Add directional light gizmos
    for light in directional_lights {
        append_directional_light_gizmo(&mut line_batch, light);
    }

    // Add ambient light gizmo if present
    if let Some(intensity) = ambient_light_intensity {
        append_ambient_light_gizmo(&mut line_batch, intensity);
    }

    // Add 2D screen-space text overlay using lines
    // Position text in screen space (as 3D lines in front of camera)
    add_screen_text_overlay(&mut line_batch, camera);

    // Render the 3D debug lines (grid, colliders, gizmos, and screen text)
    if let Some(debug_mesh) = debug_line_renderer.create_line_mesh(&line_batch)? {
        target.render(camera, &[&debug_mesh], &[]);
    }

    Ok(())
}

/// Add screen-space text overlay positioned relative to camera
fn add_screen_text_overlay(batch: &mut crate::debug::LineBatch, camera: &Camera) {
    use crate::renderer::text_overlay::append_text;
    use glam::Vec3;

    let cam_pos_3d = camera.position();
    let cam_pos = Vec3::new(cam_pos_3d.x, cam_pos_3d.y, cam_pos_3d.z);

    let cam_view_3d = camera.view_direction();
    let cam_view = Vec3::new(cam_view_3d.x, cam_view_3d.y, cam_view_3d.z);

    // Calculate right and up vectors manually
    let world_up = Vec3::new(0.0, 1.0, 0.0);
    let cam_right = cam_view.cross(world_up).normalize();
    let cam_up = cam_right.cross(cam_view).normalize();

    // Draw BIG test lines in very obvious positions
    let red = [1.0, 0.0, 0.0];
    let green = [0.0, 1.0, 0.0];
    let blue = [0.0, 0.0, 1.0];

    // Draw a large cross at origin, high up so it's visible
    batch.add_line(Vec3::new(-5.0, 5.0, 0.0), Vec3::new(5.0, 5.0, 0.0), red);
    batch.add_line(Vec3::new(0.0, 5.0, -5.0), Vec3::new(0.0, 5.0, 5.0), green);
    batch.add_line(Vec3::new(0.0, 3.0, 0.0), Vec3::new(0.0, 7.0, 0.0), blue);

    log::info!("Added 3 test lines for visibility check");

    // Temporarily disable text to isolate the line rendering issue
    // TODO: Re-enable once line rendering is confirmed working
    /*
    let distance = 0.5;
    let text_start = cam_pos
        + cam_view * distance
        - cam_right * 0.4
        + cam_up * 0.35;

    let text_color = [1.0, 1.0, 1.0];
    let text_size = 0.08;
    let line_height = 0.1;

    let lines = vec![
        "DEBUG CONTROLS:",
        "LEFT+DRAG: ROTATE",
        "RIGHT+DRAG: PAN",
        "WHEEL: ZOOM",
        "F3: TOGGLE",
    ];

    for (i, line) in lines.iter().enumerate() {
        let pos = text_start - cam_up * (i as f32 * line_height);
        append_text(batch, line, pos, text_size, text_color);
    }
    */
}
