use crate::ecs::SceneData;
use crate::threed_renderer::ThreeDRenderer;
use anyhow::Context;
use std::path::PathBuf;
use std::sync::Arc;
use winit::{
    dpi::PhysicalSize,
    event::*,
    event_loop::{ControlFlow, EventLoop},
    window::{Window, WindowBuilder},
};

/// POC App using three-d renderer for testing
pub struct AppThreeD {
    window: Arc<Window>,
    renderer: ThreeDRenderer,
}

impl AppThreeD {
    /// Create with test scene (primitives)
    pub fn new(
        width: u32,
        height: u32,
        event_loop: &EventLoop<()>,
    ) -> anyhow::Result<Self> {
        // Create window
        log::info!("Creating window for three-d POC...");
        let window = Arc::new(
            WindowBuilder::new()
                .with_title("Vibe Coder Engine - three-d POC")
                .with_inner_size(PhysicalSize::new(width, height))
                .build(event_loop)
                .context("Failed to create window")?,
        );

        // Initialize three-d renderer
        log::info!("Initializing three-d renderer...");
        let mut renderer = ThreeDRenderer::new(Arc::clone(&window))?;

        // Create test scene with primitives
        renderer.create_test_scene()?;

        Ok(Self { window, renderer })
    }

    /// Create with a real scene from JSON
    pub fn with_scene(
        scene_path: PathBuf,
        width: u32,
        height: u32,
        event_loop: &EventLoop<()>,
    ) -> anyhow::Result<Self> {
        // Create window
        log::info!("Creating window for three-d scene renderer...");
        let window = Arc::new(
            WindowBuilder::new()
                .with_title(format!("Vibe Coder Engine - three-d - {}", scene_path.display()))
                .with_inner_size(PhysicalSize::new(width, height))
                .build(event_loop)
                .context("Failed to create window")?,
        );

        // Initialize three-d renderer
        log::info!("Initializing three-d renderer...");
        let mut renderer = ThreeDRenderer::new(Arc::clone(&window))?;

        // Load scene
        let scene = crate::io::load_scene(&scene_path)?;
        renderer.load_scene(&scene)?;

        Ok(Self { window, renderer })
    }

    pub fn run(mut self, event_loop: EventLoop<()>) {
        event_loop.run(move |event, _, control_flow| {
            *control_flow = ControlFlow::Poll;

            match event {
                Event::WindowEvent {
                    ref event,
                    window_id,
                } if window_id == self.window.id() => match event {
                    WindowEvent::CloseRequested => {
                        log::info!("Exit requested");
                        *control_flow = ControlFlow::Exit;
                    }
                    WindowEvent::KeyboardInput {
                        input:
                            KeyboardInput {
                                state: ElementState::Pressed,
                                virtual_keycode: Some(VirtualKeyCode::Escape),
                                ..
                            },
                        ..
                    } => {
                        log::info!("Exit requested (Escape key)");
                        *control_flow = ControlFlow::Exit;
                    }
                    WindowEvent::Resized(physical_size) => {
                        self.resize(*physical_size);
                    }
                    _ => {}
                },
                Event::RedrawRequested(_) => {
                    if let Err(e) = self.render() {
                        log::error!("Render error: {}", e);
                        *control_flow = ControlFlow::Exit;
                    }
                }
                Event::MainEventsCleared => {
                    self.window.request_redraw();
                }
                _ => {}
            }
        })
    }

    fn resize(&mut self, new_size: PhysicalSize<u32>) {
        self.renderer.resize(new_size.width, new_size.height);
    }

    fn render(&mut self) -> anyhow::Result<()> {
        self.renderer.render()
    }
}
