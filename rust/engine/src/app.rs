use crate::{
    ecs::SceneData,
    io,
    render::{Camera, Renderer, SceneRenderer},
    util::FrameTimer,
};
use anyhow::Context;
use std::{path::PathBuf, sync::Arc};
use winit::{
    dpi::PhysicalSize,
    event::*,
    event_loop::EventLoop,
    keyboard::{KeyCode, PhysicalKey},
    window::{Window, WindowBuilder},
};

pub struct App {
    window: Arc<Window>,
    renderer: Renderer,
    scene_renderer: SceneRenderer,
    camera: Camera,
    scene: SceneData,
    timer: FrameTimer,
}

impl App {
    pub async fn new(
        scene_path: PathBuf,
        width: u32,
        height: u32,
        event_loop: &EventLoop<()>,
    ) -> anyhow::Result<Self> {
        // Load the scene
        log::info!("Loading scene...");
        let scene = io::load_scene(scene_path)?;

        // Create window
        log::info!("Creating window...");
        let window = Arc::new(
            WindowBuilder::new()
                .with_title(format!("Vibe Coder Engine - {}", scene.metadata.name))
                .with_inner_size(PhysicalSize::new(width, height))
                .build(event_loop)
                .context("Failed to create window")?,
        );

        // Initialize renderer
        log::info!("Initializing renderer...");
        let renderer = Renderer::new(Arc::clone(&window)).await?;

        // Initialize scene renderer
        log::info!("Initializing scene renderer...");
        let mut scene_renderer = SceneRenderer::new(&renderer.device, &renderer.config);
        scene_renderer.load_scene(&renderer.device, &scene);

        // Initialize camera
        let camera = Camera::new(width, height);

        // Initialize timer
        let timer = FrameTimer::new();

        Ok(Self {
            window,
            renderer,
            scene_renderer,
            camera,
            scene,
            timer,
        })
    }

    pub fn run(mut self, event_loop: EventLoop<()>) -> anyhow::Result<()> {
        let mut last_fps_log = std::time::Instant::now();

        event_loop
            .run(move |event, control_flow| {
                match event {
                    Event::WindowEvent {
                        ref event,
                        window_id,
                    } if window_id == self.window.id() => {
                        if !self.input(event) {
                            match event {
                                WindowEvent::CloseRequested
                                | WindowEvent::KeyboardInput {
                                    event:
                                        KeyEvent {
                                            state: ElementState::Pressed,
                                            physical_key: PhysicalKey::Code(KeyCode::Escape),
                                            ..
                                        },
                                    ..
                                } => {
                                    log::info!("Exit requested");
                                    control_flow.exit();
                                }
                                WindowEvent::Resized(physical_size) => {
                                    self.resize(*physical_size);
                                }
                                WindowEvent::RedrawRequested => {
                                    self.update();

                                    match self.render() {
                                        Ok(_) => {}
                                        Err(wgpu::SurfaceError::Lost) => self.resize(self.renderer.size),
                                        Err(wgpu::SurfaceError::OutOfMemory) => {
                                            log::error!("Out of memory");
                                            control_flow.exit();
                                        }
                                        Err(e) => log::warn!("Render error: {:?}", e),
                                    }

                                    // Log FPS every second
                                    if last_fps_log.elapsed().as_secs_f32() >= 1.0 {
                                        log::info!(
                                            "FPS: {:.1}, Frame time: {:.2}ms",
                                            self.timer.fps(),
                                            self.timer.delta_seconds() * 1000.0
                                        );
                                        last_fps_log = std::time::Instant::now();
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    Event::AboutToWait => {
                        self.window.request_redraw();
                    }
                    _ => {}
                }
            })
            .context("Event loop error")?;

        Ok(())
    }

    fn resize(&mut self, new_size: PhysicalSize<u32>) {
        self.renderer.resize(new_size);
        self.camera.update_aspect(new_size.width, new_size.height);
    }

    fn input(&mut self, _event: &WindowEvent) -> bool {
        false
    }

    fn update(&mut self) {
        self.timer.tick();
    }

    fn render(&mut self) -> Result<(), wgpu::SurfaceError> {
        let output = self.renderer.surface.get_current_texture()?;
        let view = output
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());

        let mut encoder = self
            .renderer
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("Render Encoder"),
            });

        // Render the scene
        self.scene_renderer
            .render(&mut encoder, &view, &self.camera, &self.renderer.queue);

        self.renderer
            .queue
            .submit(std::iter::once(encoder.finish()));
        output.present();

        Ok(())
    }
}
