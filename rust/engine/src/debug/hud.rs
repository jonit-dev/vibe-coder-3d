use glyphon::{
    Attrs, Buffer, Color, Family, FontSystem, Metrics, Resolution, Shaping, SwashCache,
    TextArea, TextAtlas, TextBounds, TextRenderer,
};
use wgpu::{MultisampleState, TextureFormat};

/// Debug HUD overlay for displaying FPS, frame time, and stats
pub struct DebugHud {
    font_system: FontSystem,
    swash_cache: SwashCache,
    atlas: TextAtlas,
    renderer: TextRenderer,
    buffer: Buffer,
    viewport_width: f32,
    viewport_height: f32,
}

impl DebugHud {
    pub fn new(device: &wgpu::Device, queue: &wgpu::Queue, format: TextureFormat, width: u32, height: u32) -> Self {
        let mut font_system = FontSystem::new();
        let swash_cache = SwashCache::new();
        let mut atlas = TextAtlas::new(device, queue, format);
        let renderer = TextRenderer::new(
            &mut atlas,
            device,
            MultisampleState::default(),
            None,
        );

        // Create text buffer for HUD content
        let mut buffer = Buffer::new(&mut font_system, Metrics::new(16.0, 20.0));
        buffer.set_size(&mut font_system, width as f32, height as f32);

        Self {
            font_system,
            swash_cache,
            atlas,
            renderer,
            buffer,
            viewport_width: width as f32,
            viewport_height: height as f32,
        }
    }

    /// Update HUD text content with current stats
    pub fn update_stats(&mut self, fps: f32, frame_time: f32, rigid_bodies: usize, colliders: usize) {
        let text = format!(
            "FPS: {:.1}\nFrame: {:.2}ms\nRigid Bodies: {}\nColliders: {}",
            fps, frame_time, rigid_bodies, colliders
        );

        self.buffer.set_text(
            &mut self.font_system,
            &text,
            Attrs::new().family(Family::Monospace),
            Shaping::Advanced,
        );
    }

    /// Render HUD overlay
    pub fn render(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        encoder: &mut wgpu::CommandEncoder,
        view: &wgpu::TextureView,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Prepare text areas (top-left corner with padding)
        let text_areas = [TextArea {
            buffer: &self.buffer,
            left: 10.0,
            top: 10.0,
            scale: 1.0,
            bounds: TextBounds {
                left: 0,
                top: 0,
                right: self.viewport_width as i32,
                bottom: self.viewport_height as i32,
            },
            default_color: Color::rgb(255, 255, 255),
        }];

        // Prepare renderer
        self.renderer.prepare(
            device,
            queue,
            &mut self.font_system,
            &mut self.atlas,
            Resolution {
                width: self.viewport_width as u32,
                height: self.viewport_height as u32,
            },
            text_areas,
            &mut self.swash_cache,
        )?;

        // Render pass for text
        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Debug HUD Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Load, // Don't clear, draw on top
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            self.renderer.render(&self.atlas, &mut pass)?;
        }

        Ok(())
    }

    /// Handle viewport resize
    pub fn resize(&mut self, width: u32, height: u32) {
        self.viewport_width = width as f32;
        self.viewport_height = height as f32;
        self.buffer.set_size(&mut self.font_system, width as f32, height as f32);
    }
}
