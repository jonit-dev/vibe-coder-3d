use crate::threed_renderer::ThreeDRenderer;
use crate::util::FrameTimer;
use anyhow::Context;
use std::path::PathBuf;
use std::sync::Arc;
use vibe_ecs_bridge::create_default_registry;
use vibe_physics::{populate_physics_world, PhysicsWorld};
use vibe_scene::Scene as SceneData;
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
    physics_world: Option<PhysicsWorld>,
    physics_accumulator: f32,
    timer: FrameTimer,
    scene: Option<SceneData>,
    debug_mode: bool,
}

impl AppThreeD {
    /// Create with test scene (primitives)
    pub fn new(
        width: u32,
        height: u32,
        debug_mode: bool,
        event_loop: &EventLoop<()>,
    ) -> anyhow::Result<Self> {
        // Create fullscreen window
        log::info!("Creating fullscreen window for three-d POC...");
        let window = Arc::new(
            WindowBuilder::new()
                .with_title("Vibe Coder Engine - three-d POC")
                .with_fullscreen(Some(winit::window::Fullscreen::Borderless(None)))
                .build(event_loop)
                .context("Failed to create window")?,
        );

        // Initialize three-d renderer
        log::info!("Initializing three-d renderer...");
        let mut renderer = ThreeDRenderer::new(Arc::clone(&window))?;

        // Create test scene with primitives
        renderer.create_test_scene()?;

        Ok(Self {
            window,
            renderer,
            physics_world: None,
            physics_accumulator: 0.0,
            timer: FrameTimer::new(),
            scene: None,
            debug_mode,
        })
    }

    /// Create with a real scene from JSON
    pub fn with_scene(
        scene_path: PathBuf,
        width: u32,
        height: u32,
        debug_mode: bool,
        event_loop: &EventLoop<()>,
    ) -> anyhow::Result<Self> {
        // Create fullscreen window
        log::info!("Creating fullscreen window for three-d scene renderer...");
        let window = Arc::new(
            WindowBuilder::new()
                .with_title(format!(
                    "Vibe Coder Engine - three-d - {}",
                    scene_path.display()
                ))
                .with_fullscreen(Some(winit::window::Fullscreen::Borderless(None)))
                .build(event_loop)
                .context("Failed to create window")?,
        );

        // Initialize three-d renderer
        log::info!("Initializing three-d renderer...");
        let mut renderer = ThreeDRenderer::new(Arc::clone(&window))?;

        // Load scene (async texture loading)
        let scene = crate::io::load_scene(&scene_path)?;
        pollster::block_on(renderer.load_scene(&scene))?;

        // Initialize physics world
        log::info!("Initializing physics world...");
        let mut physics_world = PhysicsWorld::new();
        let registry = create_default_registry();

        match populate_physics_world(&mut physics_world, &scene, &registry) {
            Ok(count) => {
                log::info!("Physics initialized with {} entities", count);
                let stats = physics_world.stats();
                log::info!(
                    "  Rigid bodies: {}, Colliders: {}",
                    stats.rigid_body_count,
                    stats.collider_count
                );
            }
            Err(e) => {
                log::warn!("Failed to populate physics world: {}", e);
            }
        }

        Ok(Self {
            window,
            renderer,
            physics_world: Some(physics_world),
            physics_accumulator: 0.0,
            timer: FrameTimer::new(),
            scene: Some(scene),
            debug_mode,
        })
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
                    self.update();

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

    /// Run in screenshot mode - renders directly to texture and saves
    pub fn screenshot(
        mut self,
        output_path: PathBuf,
        delay_ms: u64,
        scale: f32,
        quality: u8,
    ) -> anyhow::Result<()> {
        log::info!(
            "Screenshot mode enabled - target path: {}, scale: {:.2}, quality: {}",
            output_path.display(),
            scale,
            quality
        );

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create screenshot directory")?;
        }

        // Render multiple frames to ensure everything is initialized and loaded
        let num_warmup_frames = if delay_ms > 0 {
            (delay_ms / 16).max(1) as u32  // ~60fps, minimum 1 frame
        } else {
            5  // Default: render 5 frames
        };

        log::info!("Rendering {} warmup frames...", num_warmup_frames);
        for i in 0..num_warmup_frames {
            // Update physics for each frame
            if let Some(ref mut physics_world) = self.physics_world {
                physics_world.step(1.0 / 60.0);
                self.renderer.sync_physics_transforms(physics_world);
            }

            // Render to screen
            self.render()?;

            // Small delay between frames
            std::thread::sleep(std::time::Duration::from_millis(16)); // ~60fps
        }

        // Capture screenshot after warmup
        log::info!("Capturing screenshot...");
        self.renderer.render_to_screenshot(
            &output_path,
            self.physics_world.as_ref(),
            scale,
            quality,
        )?;

        log::info!("Screenshot complete, exiting...");
        Ok(())
    }

    fn resize(&mut self, new_size: PhysicalSize<u32>) {
        self.renderer.resize(new_size.width, new_size.height);
    }

    fn update(&mut self) {
        self.timer.tick();

        // Log FPS when debug mode is enabled
        if self.debug_mode {
            let fps = self.timer.fps();
            if fps > 0.0 {
                log::debug!("FPS: {:.1}", fps);
            }
        }

        // Physics simulation (if enabled)
        if let Some(ref mut physics_world) = self.physics_world {
            // Fixed timestep physics update (60 Hz)
            const PHYSICS_TIMESTEP: f32 = 1.0 / 60.0;
            self.physics_accumulator += self.timer.delta_seconds();

            // Run physics steps (with max iterations to prevent spiral of death)
            let mut steps = 0;
            const MAX_PHYSICS_STEPS: u32 = 5;

            while self.physics_accumulator >= PHYSICS_TIMESTEP && steps < MAX_PHYSICS_STEPS {
                physics_world.step(PHYSICS_TIMESTEP);
                self.physics_accumulator -= PHYSICS_TIMESTEP;
                steps += 1;
            }

            // Sync physics transforms back to renderer
            if steps > 0 {
                self.renderer.sync_physics_transforms(physics_world);
            }
        }
    }

    fn render(&mut self) -> anyhow::Result<()> {
        let delta_time = self.timer.delta_seconds();
        self.renderer
            .render(delta_time, self.debug_mode, self.physics_world.as_ref())
    }
}
