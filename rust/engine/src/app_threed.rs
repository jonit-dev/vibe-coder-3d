use crate::input::InputManager;
use crate::renderer::OrbitalCamera;
use crate::threed::threed_renderer::ThreeDRenderer;
use crate::util::FrameTimer;
use anyhow::Context;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::create_default_registry;
use vibe_ecs_manager::SceneManager;
use vibe_physics::character_controller::{
    CharacterControllerComponent, CharacterControllerConfig, CharacterControllerSystem,
};
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
    /// Optional character controller system (enabled when scene contains CharacterController)
    character_controller_system: Option<CharacterControllerSystem>,
    /// Debug orbital camera for free navigation (F3 toggle)
    debug_camera: Option<OrbitalCamera>,
    /// Whether to use the debug camera instead of scene camera
    use_debug_camera: bool,
}

impl AppThreeD {
    /// Apply auto-input to character controllers (WASD + jump) before updating the system
    fn apply_character_controller_auto_input(&mut self) {
        let Some(ref mut cc_system) = self.character_controller_system else {
            return;
        };
        let entity_ids = cc_system.get_all_entity_ids();
        for entity_id in entity_ids {
            if let Some(controller) = cc_system.get_controller_mut(entity_id) {
                // Only handle auto mode; manual mode is expected to be script-driven
                if controller.config.control_mode != "auto" {
                    continue;
                }
                // Resolve mapping (defaults if missing)
                let mapping =
                    controller.config.input_mapping.clone().unwrap_or_else(|| {
                        vibe_physics::character_controller::InputMapping::default()
                    });

                // Horizontal input
                let mut x = 0.0f32;
                let mut z = 0.0f32;
                if self.input_manager.is_key_down(&mapping.left) {
                    x += 1.0;
                }
                if self.input_manager.is_key_down(&mapping.right) {
                    x -= 1.0;
                }
                if self.input_manager.is_key_down(&mapping.forward) {
                    z += 1.0;
                }
                if self.input_manager.is_key_down(&mapping.backward) {
                    z -= 1.0;
                }
                // Normalize to unit length to avoid faster diagonal movement
                let mag = (x * x + z * z).sqrt();
                if mag > 0.0001 {
                    x /= mag;
                    z /= mag;
                } else {
                    x = 0.0;
                    z = 0.0;
                }
                controller.set_move_input([x, z]);

                // Jump on press (edge triggered)
                if self.input_manager.is_key_pressed(&mapping.jump) {
                    controller.request_jump();
                }
            }
        }
    }
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
            character_controller_system: None,
            debug_camera: None,
            use_debug_camera: false,
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

        // Initialize CharacterControllerSystem from scene (if any)
        let mut cc_system = CharacterControllerSystem::new();
        for entity in &scene.entities {
            if !entity.components.contains_key("CharacterController") {
                continue;
            }
            let entity_id = match entity.entity_id() {
                Some(id) => id,
                None => continue,
            };
            if let Some(value) = entity.components.get("CharacterController") {
                match CharacterControllerConfig::from_component(value) {
                    Ok(config) => {
                        let controller = CharacterControllerComponent::new(entity_id, config);
                        cc_system.add_controller(controller);
                    }
                    Err(e) => {
                        log::warn!(
                            "Invalid CharacterController config for entity {:?}: {}",
                            entity.name,
                            e
                        );
                    }
                }
            }
        }
        let has_controllers = !cc_system.get_all_entity_ids().is_empty();
        let character_controller_system = if has_controllers {
            log::info!(
                "CharacterControllerSystem initialized with {} controllers",
                cc_system.get_all_entity_ids().len()
            );
            Some(cc_system)
        } else {
            None
        };

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

        // Set scene manager for Scene API with current scene path
        script_system.set_script_scene_manager(Some(scene_path.to_string_lossy().to_string()));

        // Set up prefab manager for Prefab API
        script_system.setup_prefab_manager();

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

        // Enable orbital camera by default in debug mode
        let use_debug_camera = debug_mode;
        if use_debug_camera {
            log::info!("╔════════════════════════════════════════════════════════════╗");
            log::info!("║          DEBUG MODE - ORBITAL CAMERA ENABLED               ║");
            log::info!("╠════════════════════════════════════════════════════════════╣");
            log::info!("║  LEFT MOUSE + DRAG   : Rotate camera around target        ║");
            log::info!("║  RIGHT MOUSE + DRAG  : Pan camera                          ║");
            log::info!("║  MOUSE WHEEL         : Zoom in/out                         ║");
            log::info!("║  F3                  : Toggle orbital camera on/off        ║");
            log::info!("╚════════════════════════════════════════════════════════════╝");
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
            character_controller_system,
            debug_camera: None,
            use_debug_camera,
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
                        WindowEvent::KeyboardInput {
                            input:
                                KeyboardInput {
                                    state: ElementState::Pressed,
                                    virtual_keycode: Some(VirtualKeyCode::F3),
                                    ..
                                },
                            ..
                        } => {
                            // Toggle debug camera only in debug mode
                            if self.debug_mode {
                                self.use_debug_camera = !self.use_debug_camera;

                                if self.use_debug_camera {
                                    // Initialize debug camera from current scene camera if needed
                                    if self.debug_camera.is_none() {
                                        if let Some(scene_camera) = self.renderer.get_main_camera()
                                        {
                                            self.debug_camera =
                                                Some(OrbitalCamera::from_camera(&scene_camera));
                                        }
                                    }
                                    log::info!(
                                        "✓ Orbital camera ENABLED (Left-click + drag to rotate)"
                                    );
                                } else {
                                    // Reset orbital camera state when switching back
                                    if let Some(ref mut debug_cam) = self.debug_camera {
                                        debug_cam.reset();
                                    }
                                    log::info!("✗ Orbital camera DISABLED (using scene camera)");
                                }
                            }
                        }
                        WindowEvent::MouseInput { state, button, .. } => {
                            // Forward mouse events to orbital camera when active
                            if self.use_debug_camera && self.debug_mode {
                                log::debug!(
                                    "Mouse button event: {:?} {:?}, debug_camera active",
                                    button,
                                    state
                                );
                                if let Some(ref mut debug_cam) = self.debug_camera {
                                    let mouse_pos = self.input_manager.mouse_position();
                                    match state {
                                        ElementState::Pressed => {
                                            debug_cam.on_mouse_down(*button, mouse_pos);
                                        }
                                        ElementState::Released => {
                                            debug_cam.on_mouse_up(*button);
                                        }
                                    }
                                } else {
                                    log::warn!("Debug camera is None!");
                                }
                            } else {
                                log::debug!(
                                    "Mouse button ignored: use_debug_camera={}, debug_mode={}",
                                    self.use_debug_camera,
                                    self.debug_mode
                                );
                            }
                        }
                        WindowEvent::CursorMoved { position, .. } => {
                            // Forward mouse movement to orbital camera when active
                            if self.use_debug_camera && self.debug_mode {
                                if let Some(ref mut debug_cam) = self.debug_camera {
                                    debug_cam.on_mouse_move((position.x, position.y));
                                }
                            }
                        }
                        WindowEvent::MouseWheel { delta, .. } => {
                            // Forward mouse wheel to orbital camera when active
                            if self.use_debug_camera && self.debug_mode {
                                log::debug!("Mouse wheel event: {:?}, debug_camera active", delta);
                                if let Some(ref mut debug_cam) = self.debug_camera {
                                    let wheel_delta = match delta {
                                        MouseScrollDelta::LineDelta(_x, y) => *y,
                                        MouseScrollDelta::PixelDelta(pos) => (pos.y as f32) / 100.0,
                                    };
                                    log::debug!("Forwarding wheel delta: {}", wheel_delta);
                                    debug_cam.on_mouse_wheel(wheel_delta);
                                }
                            } else {
                                log::debug!(
                                    "Mouse wheel ignored: use_debug_camera={}, debug_mode={}",
                                    self.use_debug_camera,
                                    self.debug_mode
                                );
                            }
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
        for _i in 0..num_warmup_frames {
            // Update all systems (scripts, physics, timing)
            self.update();

            // Render to screen
            self.render()?;

            // Small delay between frames
            std::thread::sleep(std::time::Duration::from_millis(16)); // ~60fps
        }

        // Extract mesh rendering state for screenshot
        let render_state = if let Some(ref scene_manager) = self.scene_manager {
            if let Ok(mgr) = scene_manager.lock() {
                let scene_state = mgr.scene_state();
                Some(scene_state.with_scene(|scene| {
                    crate::threed::threed_renderer::MeshRenderState::from_scene(scene)
                }))
            } else {
                None
            }
        } else {
            self.scene
                .as_ref()
                .map(|scene| crate::threed::threed_renderer::MeshRenderState::from_scene(scene))
        };

        // Capture screenshot after warmup
        log::info!("Capturing screenshot...");
        self.renderer.render_to_screenshot(
            &output_path,
            self.physics_world.as_ref(),
            render_state.as_ref(),
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

            // Drain and apply all mutations from scripts (material:setColor(), etc.)
            let mutations = script_system.drain_all_mutations();
            if !mutations.is_empty() {
                let mut scene_manager_guard =
                    self.scene_manager.as_ref().and_then(|mgr| mgr.lock().ok());

                for mutation in &mutations {
                    if let Some(scene) = self.scene.as_mut() {
                        Self::apply_mutation_to_scene(scene, mutation);
                    }

                    if let Some(mgr) = scene_manager_guard.as_mut() {
                        if let Err(e) = Self::apply_mutation_to_scene_manager(mgr, mutation) {
                            log::error!("Failed to apply mutation via SceneManager: {}", e);
                        }
                    }

                    if let vibe_scripting::EntityMutation::SetComponent {
                        entity_id,
                        component_type,
                        data,
                    } = mutation
                    {
                        if component_type == "MeshRenderer" {
                            self.renderer.update_entity_material(*entity_id, data);
                        }
                    }
                }
            }
        }

        // Physics simulation (if enabled)
        // Feed auto input into controllers BEFORE physics step (avoids borrow conflicts)
        self.apply_character_controller_auto_input();

        if let Some(ref mut physics_world) = self.physics_world {
            // Run CharacterControllerSystem before stepping physics (preferred)
            if let Some(ref mut cc_system) = self.character_controller_system {
                cc_system.update(physics_world, delta_time);
            } else {
                // Fallback: simple input-driven movement (legacy)
                Self::apply_character_controller_inputs(
                    delta_time,
                    self.scene.as_ref(),
                    &self.input_manager,
                    physics_world,
                );
            }

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

            // Process collision events and dispatch to scripts
            if steps > 0 {
                // Process collision events from physics world
                let collision_events: Vec<_> = physics_world.poll_events().collect();

                if !collision_events.is_empty() {
                    if let Some(ref mut script_system) = self.script_system {
                        for event in collision_events {
                            match event {
                                vibe_physics::CollisionEvent::ContactStarted {
                                    entity_a,
                                    entity_b,
                                } => {
                                    // Dispatch collision enter events to both entities
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_a,
                                        entity_b,
                                        "collisionEnter",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch collision enter event: {}",
                                            e
                                        );
                                    }
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_b,
                                        entity_a,
                                        "collisionEnter",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch collision enter event: {}",
                                            e
                                        );
                                    }
                                }
                                vibe_physics::CollisionEvent::ContactEnded {
                                    entity_a,
                                    entity_b,
                                } => {
                                    // Dispatch collision exit events to both entities
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_a,
                                        entity_b,
                                        "collisionExit",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch collision exit event: {}",
                                            e
                                        );
                                    }
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_b,
                                        entity_a,
                                        "collisionExit",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch collision exit event: {}",
                                            e
                                        );
                                    }
                                }
                                vibe_physics::CollisionEvent::TriggerStarted {
                                    entity_a,
                                    entity_b,
                                } => {
                                    // Dispatch trigger enter events to both entities
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_a,
                                        entity_b,
                                        "triggerEnter",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch trigger enter event: {}",
                                            e
                                        );
                                    }
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_b,
                                        entity_a,
                                        "triggerEnter",
                                    ) {
                                        log::error!(
                                            "Failed to dispatch trigger enter event: {}",
                                            e
                                        );
                                    }
                                }
                                vibe_physics::CollisionEvent::TriggerEnded {
                                    entity_a,
                                    entity_b,
                                } => {
                                    // Dispatch trigger exit events to both entities
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_a,
                                        entity_b,
                                        "triggerExit",
                                    ) {
                                        log::error!("Failed to dispatch trigger exit event: {}", e);
                                    }
                                    if let Err(e) = script_system.dispatch_collision_event(
                                        entity_b,
                                        entity_a,
                                        "triggerExit",
                                    ) {
                                        log::error!("Failed to dispatch trigger exit event: {}", e);
                                    }
                                }
                            }
                        }
                    }
                }

                // Sync physics transforms back to renderer
                self.renderer.sync_physics_transforms(physics_world);
            }
        }

        // Apply pending entity commands from scripts (mutable ECS)
        if let Some(ref scene_manager) = self.scene_manager {
            if let Ok(mut mgr) = scene_manager.lock() {
                if let Err(e) = mgr.apply_pending_commands() {
                    log::error!("Failed to apply entity commands: {}", e);
                }

                // Sync newly created entities to renderer (async operation)
                let scene_state = mgr.scene_state();
                let sync_result = scene_state
                    .with_scene(|scene| pollster::block_on(self.renderer.sync_new_entities(scene)));
                if let Err(e) = sync_result {
                    log::error!("Failed to sync new entities to renderer: {}", e);
                }
            }
        }

        // Clear frame-based input state at end of frame
        self.input_manager.clear_frame_state();
    }

    /// Minimal engine-side character controller to mirror TS auto mode.
    ///
    /// Moves any entity that has a CharacterController component and a
    /// kinematic rigid body using simple WASD + Space input. This is a
    /// stopgap until a full Rapier KinematicCharacterController is wired.
    fn apply_character_controller_inputs(
        delta_time: f32,
        scene: Option<&SceneData>,
        input_manager: &InputManager,
        physics_world: &mut PhysicsWorld,
    ) {
        let scene = match scene {
            Some(s) => s,
            None => return,
        };

        // Helper to read a float field from component JSON
        fn read_number(
            map: &serde_json::Map<String, serde_json::Value>,
            key: &str,
            default_v: f32,
        ) -> f32 {
            map.get(key)
                .and_then(|v| v.as_f64())
                .map(|v| v as f32)
                .unwrap_or(default_v)
        }

        for entity in &scene.entities {
            // Only consider entities with CharacterController component
            if !entity.components.contains_key("CharacterController") {
                continue;
            }

            let entity_id = match entity.entity_id() {
                Some(id) => id,
                None => continue,
            };

            // Must have a kinematic rigid body already registered in physics
            let body_handle = match physics_world.entity_to_body.get(&entity_id).copied() {
                Some(h) => h,
                None => continue,
            };

            let is_kinematic = physics_world
                .rigid_bodies
                .get(body_handle)
                .map(|b| b.body_type() == rapier3d::prelude::RigidBodyType::KinematicPositionBased)
                .unwrap_or(false);
            if !is_kinematic {
                continue;
            }

            // Read optional settings
            let (
                max_speed,
                _jump_strength,
                input_forward,
                input_backward,
                input_left,
                input_right,
                input_jump,
            ) = {
                if let Some(cc) = entity
                    .components
                    .get("CharacterController")
                    .and_then(|v| v.as_object())
                {
                    let speed = read_number(cc, "maxSpeed", 6.0);
                    let jump = read_number(cc, "jumpStrength", 6.5);

                    // Input mapping defaults
                    let (mut f, mut b, mut l, mut r, mut j) = ("w", "s", "a", "d", "space");
                    if let Some(mapping) = cc.get("inputMapping").and_then(|m| m.as_object()) {
                        if let Some(s) = mapping.get("forward").and_then(|v| v.as_str()) {
                            f = s;
                        }
                        if let Some(s) = mapping.get("backward").and_then(|v| v.as_str()) {
                            b = s;
                        }
                        if let Some(s) = mapping.get("left").and_then(|v| v.as_str()) {
                            l = s;
                        }
                        if let Some(s) = mapping.get("right").and_then(|v| v.as_str()) {
                            r = s;
                        }
                        if let Some(s) = mapping.get("jump").and_then(|v| v.as_str()) {
                            j = if s == " " { "space" } else { s };
                        }
                    }

                    (
                        speed,
                        jump,
                        f.to_string(),
                        b.to_string(),
                        l.to_string(),
                        r.to_string(),
                        j.to_string(),
                    )
                } else {
                    (
                        6.0,
                        6.5,
                        "w".to_string(),
                        "s".to_string(),
                        "a".to_string(),
                        "d".to_string(),
                        "space".to_string(),
                    )
                }
            };

            // Aggregate input into world XZ movement (Three.js/three-d both Y-up, +Z forward)
            let forward = input_manager.is_key_down(&input_forward);
            let backward = input_manager.is_key_down(&input_backward);
            let left = input_manager.is_key_down(&input_left);
            let right = input_manager.is_key_down(&input_right);
            let jump = input_manager.is_key_down(&input_jump);

            let mut move_x = 0.0_f32;
            let mut move_z = 0.0_f32;
            // Match TypeScript calculateMovementDirection: forward=+Z, backward=-Z, left=+X, right=-X
            if forward {
                move_z += 1.0;
            }
            if backward {
                move_z -= 1.0;
            }
            if left {
                move_x += 1.0;
            }
            if right {
                move_x -= 1.0;
            }

            if move_x != 0.0 || move_z != 0.0 || jump {
                let (mut position, rotation) = physics_world
                    .get_entity_transform(entity_id)
                    .unwrap_or((glam::Vec3::ZERO, glam::Quat::IDENTITY));

                // Normalize horizontal direction and scale by speed and delta.
                let dir = glam::Vec3::new(move_x, 0.0, move_z);
                let dir = if dir.length_squared() > 0.0 {
                    dir.normalize()
                } else {
                    dir
                };
                position += dir * max_speed * delta_time;

                // Simple jump impulse (no gravity integration here; kinematic body)
                if jump {
                    position.y += 0.1 * _jump_strength; // small hop for visual feedback
                }

                physics_world.set_entity_transform(entity_id, position, rotation);
            }
        }
    }

    fn apply_mutation_to_scene(scene: &mut SceneData, mutation: &vibe_scripting::EntityMutation) {
        match mutation {
            vibe_scripting::EntityMutation::SetComponent {
                entity_id,
                component_type,
                data,
            } => {
                if let Some(entity) = scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(*entity_id))
                {
                    if let Some(existing_component) = entity.components.get_mut(component_type) {
                        if let (Some(existing_obj), Some(new_obj)) =
                            (existing_component.as_object_mut(), data.as_object())
                        {
                            for (key, value) in new_obj {
                                existing_obj.insert(key.clone(), value.clone());
                            }
                            log::debug!(
                                "Applied SetComponent mutation: entity {:?}, component {}",
                                entity_id,
                                component_type
                            );
                        } else {
                            *existing_component = data.clone();
                            log::debug!(
                                "Replaced component: entity {:?}, component {}",
                                entity_id,
                                component_type
                            );
                        }
                    } else {
                        entity
                            .components
                            .insert(component_type.clone(), data.clone());
                        log::debug!(
                            "Created component: entity {:?}, component {}",
                            entity_id,
                            component_type
                        );
                    }
                } else {
                    log::warn!("SetComponent mutation: entity {:?} not found", entity_id);
                }
            }
            vibe_scripting::EntityMutation::RemoveComponent {
                entity_id,
                component_type,
            } => {
                if let Some(entity) = scene
                    .entities
                    .iter_mut()
                    .find(|e| e.entity_id() == Some(*entity_id))
                {
                    entity.components.remove(component_type);
                    log::debug!(
                        "Removed component: entity {:?}, component {}",
                        entity_id,
                        component_type
                    );
                } else {
                    log::warn!("RemoveComponent mutation: entity {:?} not found", entity_id);
                }
            }
            vibe_scripting::EntityMutation::DestroyEntity { entity_id } => {
                scene.entities.retain(|e| e.entity_id() != Some(*entity_id));
                log::debug!("Destroyed entity: {:?}", entity_id);
            }
            vibe_scripting::EntityMutation::SetActive { entity_id, active } => {
                log::trace!(
                    "SetActive mutation not yet implemented: entity {:?}, active={}",
                    entity_id,
                    active
                );
            }
        }
    }

    fn apply_mutation_to_scene_manager(
        scene_manager: &mut SceneManager,
        mutation: &vibe_scripting::EntityMutation,
    ) -> anyhow::Result<()> {
        match mutation {
            vibe_scripting::EntityMutation::SetComponent {
                entity_id,
                component_type,
                data,
            } => scene_manager.set_component_immediate(
                *entity_id,
                component_type.as_str(),
                data.clone(),
            ),
            vibe_scripting::EntityMutation::RemoveComponent {
                entity_id,
                component_type,
            } => scene_manager.remove_component_immediate(*entity_id, component_type.as_str()),
            vibe_scripting::EntityMutation::DestroyEntity { entity_id } => {
                scene_manager.destroy_entity_immediate(*entity_id)
            }
            vibe_scripting::EntityMutation::SetActive { entity_id, active } => {
                scene_manager.set_active_immediate(*entity_id, *active)
            }
        }
    }

    fn render(&mut self) -> anyhow::Result<()> {
        let delta_time = self.timer.delta_seconds();

        // Initialize debug camera on first frame if in debug mode
        if self.use_debug_camera && self.debug_mode && self.debug_camera.is_none() {
            if let Some(scene_camera) = self.renderer.get_main_camera() {
                self.debug_camera = Some(OrbitalCamera::from_camera(&scene_camera));
                log::info!("Orbital camera initialized from scene camera");
            }
        }

        // Update main camera from debug orbital camera if active
        if self.use_debug_camera && self.debug_mode {
            if let Some(ref debug_cam) = self.debug_camera {
                // Get current main camera and update it with orbital camera state
                if let Some(mut camera) = self.renderer.get_main_camera() {
                    debug_cam.update_camera(&mut camera);
                    self.renderer.set_main_camera(camera);
                }
            }
        }

        // Get current scene state for runtime ECS sync
        // Extract mesh rendering state without holding a borrow on the scene
        let render_state = if let Some(ref scene_manager) = self.scene_manager {
            if let Ok(mgr) = scene_manager.lock() {
                let scene_state = mgr.scene_state();
                Some(scene_state.with_scene(|scene| {
                    crate::threed::threed_renderer::MeshRenderState::from_scene(scene)
                }))
            } else {
                None
            }
        } else {
            // Fallback to static scene
            self.scene
                .as_ref()
                .map(|scene| crate::threed::threed_renderer::MeshRenderState::from_scene(scene))
        };

        // Render with extracted state (no borrow conflicts)
        self.renderer.render(
            delta_time,
            self.debug_mode,
            self.physics_world.as_ref(),
            render_state.as_ref(),
        )
    }

    // ========================================================================
    // LOD Configuration API (delegates to renderer)
    // ========================================================================

    /// Set global LOD quality
    pub fn set_lod_quality(&mut self, quality: crate::renderer::LODQuality) {
        self.renderer.set_lod_quality(quality);
    }

    /// Enable/disable automatic distance-based LOD switching
    pub fn set_lod_auto_switch(&mut self, enabled: bool) {
        self.renderer.set_lod_auto_switch(enabled);
    }

    /// Set distance thresholds for LOD switching
    pub fn set_lod_distance_thresholds(&mut self, high: f32, low: f32) {
        self.renderer.set_lod_distance_thresholds(high, low);
    }
}
