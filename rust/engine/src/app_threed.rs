use crate::input::InputManager;
use crate::threed_renderer::ThreeDRenderer;
use crate::util::FrameTimer;
use anyhow::Context;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::create_default_registry;
use vibe_ecs_manager::SceneManager;
use vibe_physics::{populate_physics_world, PhysicsWorld};
use vibe_scene::Scene as SceneData;
use vibe_scripting::ScriptSystem;
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
    script_system: Option<ScriptSystem>,
    input_manager: InputManager,
    physics_accumulator: f32,
    timer: FrameTimer,
    scene: Option<SceneData>,
    scene_manager: Option<Arc<Mutex<SceneManager>>>,
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

        // CRITICAL: Force resize to actual monitor size for fullscreen windows
        // Fullscreen borderless windows report wrong size initially
        let actual_size = window.inner_size();
        log::info!(
            "Window inner_size reports: {}x{}",
            actual_size.width,
            actual_size.height
        );

        if let Some(monitor) = window.current_monitor() {
            let monitor_size = monitor.size();
            log::info!(
                "Actual monitor size: {}x{}",
                monitor_size.width,
                monitor_size.height
            );
            renderer.resize(monitor_size.width, monitor_size.height);
        } else {
            log::warn!("Could not detect monitor, using window-reported size");
            renderer.resize(actual_size.width, actual_size.height);
        }

        // Create test scene with primitives
        renderer.create_test_scene()?;

        // Initialize input manager
        let input_manager = InputManager::new();

        Ok(Self {
            window,
            renderer,
            physics_world: None,
            script_system: None,
            input_manager,
            physics_accumulator: 0.0,
            timer: FrameTimer::new(),
            scene: None,
            scene_manager: None,
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

        // CRITICAL: Force resize to actual monitor size for fullscreen windows
        // Fullscreen borderless windows report wrong size initially
        let actual_size = window.inner_size();
        log::info!(
            "Window inner_size reports: {}x{}",
            actual_size.width,
            actual_size.height
        );

        if let Some(monitor) = window.current_monitor() {
            let monitor_size = monitor.size();
            log::info!(
                "Actual monitor size: {}x{}",
                monitor_size.width,
                monitor_size.height
            );
            renderer.resize(monitor_size.width, monitor_size.height);
        } else {
            log::warn!("Could not detect monitor, using window-reported size");
            renderer.resize(actual_size.width, actual_size.height);
        }

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

        // Initialize input manager
        let input_manager = InputManager::new();

        // Initialize SceneManager for mutable ECS
        log::info!("Initializing scene manager for mutable ECS...");
        let scene_manager = Arc::new(Mutex::new(SceneManager::new(scene.clone())));

        // Initialize script system
        log::info!("Initializing script system...");
        let scripts_base_path = PathBuf::from("../game/scripts");
        let mut script_system = ScriptSystem::new(scripts_base_path);

        // Set input manager for scripts
        script_system.set_input_manager(Arc::new(input_manager.clone()));

        // Set scene manager for GameObject API
        script_system.set_scene_manager(Arc::downgrade(&scene_manager));

        match script_system.initialize(&scene) {
            Ok(_) => {
                log::info!(
                    "Script system initialized with {} scripts",
                    script_system.script_count()
                );
            }
            Err(e) => {
                log::warn!("Failed to initialize script system: {}", e);
            }
        }

        Ok(Self {
            window,
            renderer,
            physics_world: Some(physics_world),
            script_system: Some(script_system),
            input_manager,
            physics_accumulator: 0.0,
            timer: FrameTimer::new(),
            scene: Some(scene),
            scene_manager: Some(scene_manager),
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
                } if window_id == self.window.id() => {
                    // Process input events
                    self.input_manager.process_event(event);

                    // Handle window events
                    match event {
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
                    }
                }
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
            (delay_ms / 16).max(1) as u32 // ~60fps, minimum 1 frame
        } else {
            5 // Default: render 5 frames
        };

        log::info!("Rendering {} warmup frames...", num_warmup_frames);
        for i in 0..num_warmup_frames {
            // Update all systems (scripts, physics, timing)
            self.update();

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
        let delta_time = self.timer.delta_seconds();

        // Log FPS when debug mode is enabled
        if self.debug_mode {
            let fps = self.timer.fps();
            if fps > 0.0 {
                log::debug!("FPS: {:.1}", fps);
            }
        }

        // Update input state
        self.input_manager.update();

        // Script system update
        if let Some(ref mut script_system) = self.script_system {
            if let Err(e) = script_system.update(delta_time) {
                log::error!("Script system update error: {}", e);
            }

            // Sync script transforms back to renderer
            self.renderer.sync_script_transforms(script_system);
        }

        // Physics simulation (if enabled)
        if let Some(ref mut physics_world) = self.physics_world {
            // Fixed timestep physics update (60 Hz)
            const PHYSICS_TIMESTEP: f32 = 1.0 / 60.0;
            self.physics_accumulator += delta_time;

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

        // Apply pending entity commands from scripts (mutable ECS)
        if let Some(ref scene_manager) = self.scene_manager {
            if let Ok(mut mgr) = scene_manager.lock() {
                if let Err(e) = mgr.apply_pending_commands() {
                    log::error!("Failed to apply entity commands: {}", e);
                }
            }
        }

        // Clear frame-based input state at end of frame
        self.input_manager.clear_frame_state();
    }

    fn render(&mut self) -> anyhow::Result<()> {
        let delta_time = self.timer.delta_seconds();
        self.renderer
            .render(delta_time, self.debug_mode, self.physics_world.as_ref())
    }
}
