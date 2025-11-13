/// 2D screen overlay for debug UI
///
/// Renders text and shapes in screen space (fixed position on screen)
use three_d::*;

/// Simple 2D text overlay renderer
pub struct ScreenOverlay {
    context: Context,
}

impl ScreenOverlay {
    pub fn new(context: &Context) -> Self {
        Self {
            context: context.clone(),
        }
    }

    /// Render text lines on the screen
    pub fn render_text(
        &self,
        target: &RenderTarget,
        lines: &[String],
        position: (f32, f32), // Screen position (0-1 normalized)
        color: Srgba,
    ) -> anyhow::Result<()> {
        let viewport = target.viewport();
        let width = viewport.width as f32;
        let height = viewport.height as f32;

        log::debug!(
            "Screen overlay: viewport {}x{}, position {:?}",
            width,
            height,
            position
        );

        // Convert normalized position to NDC coordinates (-1 to 1)
        // (0, 0) should be top-left, (1, 1) should be bottom-right
        let x_ndc = position.0 * 2.0 - 1.0; // 0 -> -1, 1 -> 1
        let y_ndc = 1.0 - position.1 * 2.0; // 0 -> 1, 1 -> -1 (flip Y for top-left origin)

        // Create simple rectangles for each character
        let mut positions = Vec::new();
        let mut colors_vec = Vec::new();

        let char_width = 0.02; // In NDC space
        let char_height = 0.04; // In NDC space
        let line_height = 0.05; // In NDC space

        for (line_idx, line) in lines.iter().enumerate() {
            let y = y_ndc - line_idx as f32 * line_height;

            for (char_idx, ch) in line.chars().enumerate() {
                if ch == ' ' {
                    continue; // Skip spaces
                }

                let x = x_ndc + char_idx as f32 * char_width;

                // Create a simple quad for each character
                self.add_char_geometry(
                    ch,
                    x,
                    y,
                    char_width,
                    char_height,
                    &mut positions,
                    &mut colors_vec,
                    color,
                );
            }
        }

        if positions.is_empty() {
            log::warn!("Screen overlay: no characters to render");
            return Ok(());
        }

        log::debug!("Screen overlay: rendering {} vertices", positions.len());

        // Create mesh from positions
        let cpu_mesh = CpuMesh {
            positions: Positions::F32(positions),
            colors: Some(colors_vec),
            ..Default::default()
        };

        let mesh = Mesh::new(&self.context, &cpu_mesh);
        let material = ColorMaterial {
            color: Srgba::WHITE,
            render_states: RenderStates {
                depth_test: DepthTest::Always, // Always render on top
                write_mask: WriteMask::COLOR,
                blend: Blend::TRANSPARENCY,
                cull: Cull::Back,
                ..Default::default()
            },
            ..Default::default()
        };

        // Use orthographic camera that covers NDC space (-1 to 1)
        let camera = Camera::new_orthographic(
            viewport,
            vec3(0.0, 0.0, 1.0), // position (looking down -Z)
            vec3(0.0, 0.0, 0.0), // target (at origin)
            vec3(0.0, 1.0, 0.0), // up (Y is up)
            2.0,                 // height (covers -1 to 1)
            0.1,                 // z_near
            10.0,                // z_far
        );

        target.render(&camera, &[&Gm::new(mesh, material)], &[]);
        log::debug!("Screen overlay: rendered successfully");

        Ok(())
    }

    /// Add simple geometry for a character
    fn add_char_geometry(
        &self,
        ch: char,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        positions: &mut Vec<Vec3>,
        colors: &mut Vec<Srgba>,
        color: Srgba,
    ) {
        // Simple filled rectangle for each character
        let w = width * 0.6;
        let h = height * 0.8;

        // Create a quad (2 triangles) in NDC space
        // Triangle 1 (bottom-left, bottom-right, top-left)
        positions.push(vec3(x, y - h, 0.0)); // bottom-left
        positions.push(vec3(x + w, y - h, 0.0)); // bottom-right
        positions.push(vec3(x, y, 0.0)); // top-left

        // Triangle 2 (bottom-right, top-right, top-left)
        positions.push(vec3(x + w, y - h, 0.0)); // bottom-right
        positions.push(vec3(x + w, y, 0.0)); // top-right
        positions.push(vec3(x, y, 0.0)); // top-left

        // Add colors for all vertices
        for _ in 0..6 {
            colors.push(color);
        }

        let _ = ch; // Use the character parameter for future enhancement
    }
}
