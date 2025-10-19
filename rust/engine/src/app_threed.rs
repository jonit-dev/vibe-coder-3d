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
}

impl AppThreeD {
    /// Create with test scene (primitives)
    pub fn new(width: u32, height: u32, event_loop: &EventLoop<()>) -> anyhow::Result<Self> {
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

        Ok(Self {
            window,
            renderer,
            physics_world: None,
            physics_accumulator: 0.0,
            timer: FrameTimer::new(),
            scene: None,
        })
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
                .with_title(format!(
                    "Vibe Coder Engine - three-d - {}",
                    scene_path.display()
                ))
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

    /// Run in screenshot mode - renders one frame, captures window, and exits
    pub fn screenshot(mut self, output_path: PathBuf) -> anyhow::Result<()> {
        log::info!(
            "Screenshot mode enabled - target path: {}",
            output_path.display()
        );

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create screenshot directory")?;
        }

        // Render one frame to the screen
        log::info!("Rendering frame...");
        self.render()?;

        // Give the window system a moment to display the frame
        std::thread::sleep(std::time::Duration::from_millis(200));

        // Get window title for capture
        let window_title = self.window.title();
        log::info!("Capturing window: {}", window_title);

        // Capture the window screenshot
        self.renderer
            .capture_window_screenshot(&window_title, &output_path)?;

        log::info!("Screenshot complete, exiting...");
        Ok(())
    }

    fn resize(&mut self, new_size: PhysicalSize<u32>) {
        self.renderer.resize(new_size.width, new_size.height);
    }

    fn update(&mut self) {
        self.timer.tick();

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
        self.renderer.render()
    }
}
