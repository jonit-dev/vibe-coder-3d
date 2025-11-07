/// Debug overlay rendering utilities
///
/// Provides debug visualization including grid, colliders, and other debug geometry.

use anyhow::Result;
use three_d::*;

use super::DebugLineRenderer;

/// Render debug overlay with grid and physics colliders
///
/// Draws ground grid and physics collider outlines for debugging.
pub fn render_debug_overlay(
    debug_line_renderer: &DebugLineRenderer,
    camera: &Camera,
    target: &RenderTarget,
    physics_world: Option<&vibe_physics::PhysicsWorld>,
) -> Result<()> {
    use crate::debug::{append_collider_lines, append_ground_grid, LineBatch};

    let mut line_batch = LineBatch::new();

    // Add ground grid (20x20 units, 20 divisions)
    append_ground_grid(&mut line_batch, 20.0, 20);

    // Add collider outlines if physics world exists
    if let Some(physics_world) = physics_world {
        append_collider_lines(physics_world, &mut line_batch);
    }

    // Render the lines
    if let Some(debug_mesh) = debug_line_renderer.create_line_mesh(&line_batch)? {
        target.render(camera, &[&debug_mesh], &[]);
    }

    Ok(())
}
