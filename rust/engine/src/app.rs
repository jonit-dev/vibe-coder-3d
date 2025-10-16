use crate::{
    debug::{
        append_collider_lines, DebugConfig, DebugHud, DebugProfiler, DebugState, LineBatch,
        LineRenderer, OrbitController,
    },
    ecs::SceneData,
    io,
    render::{Camera, Renderer, SceneRenderer},
    util::FrameTimer,
};
use anyhow::Context;
use std::{path::PathBuf, sync::Arc};
use vibe_ecs_bridge::create_default_registry;
use vibe_physics::{populate_physics_world, PhysicsWorld};
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
    physics_world: PhysicsWorld,
    physics_accumulator: f32,
    debug_state: DebugState,
    debug_camera: Option<Camera>,
    orbit_controller: Option<OrbitController>,
    line_renderer: Option<LineRenderer>,
    line_batch: LineBatch,
    debug_hud: Option<DebugHud>,
    debug_profiler: Option<DebugProfiler>,
}

impl App {
    pub async fn new(
        scene_path: PathBuf,
        width: u32,
        height: u32,
        debug_config: DebugConfig,
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
        let mut scene_renderer =
            SceneRenderer::new(&renderer.device, &renderer.config, &renderer.queue);
        scene_renderer.load_scene(&renderer.device, &renderer.queue, &scene);

        // Initialize camera
        let mut camera = Camera::new(width, height);

        // Find and apply main camera from scene
        log::info!(
            "Searching for main camera in {} entities...",
            scene.entities.len()
        );
        for entity in &scene.entities {
            log::debug!(
                "Checking entity: {:?}, components: {:?}",
                entity.name,
                entity.components.keys()
            );

            if let Some(camera_comp) =
                entity.get_component::<crate::ecs::components::camera::CameraComponent>("Camera")
            {
                log::debug!("Found Camera component - is_main: {}", camera_comp.is_main);
                if camera_comp.is_main {
                    log::info!("Found main camera in scene: {:?}", entity.name);
                    log::debug!("  FOV: {}", camera_comp.fov);
                    log::debug!("  Near: {}", camera_comp.near);
                    log::debug!("  Far: {}", camera_comp.far);
                    log::debug!("  Projection Type: {}", camera_comp.projection_type);
                    log::debug!("  Orthographic Size: {}", camera_comp.orthographic_size);
                    log::debug!("  Clear Flags: {:?}", camera_comp.clear_flags);
                    log::debug!("  Skybox Texture: {:?}", camera_comp.skybox_texture);

                    camera.apply_component(&camera_comp);

                    // Apply camera transform if available
                    if let Some(transform) = entity
                        .get_component::<crate::ecs::components::transform::Transform>("Transform")
                    {
                        log::debug!("  Transform found:");
                        log::debug!("    Position: {:?}", transform.position);
                        log::debug!("    Rotation: {:?}", transform.rotation);
                        log::debug!("    Scale: {:?}", transform.scale);

                        camera.position = transform.position_vec3();

                        // Calculate target from rotation
                        // Default forward is +Z in right-handed coordinate system
                        let rotation = transform.rotation_quat();
                        let forward = rotation * glam::Vec3::new(0.0, 0.0, 1.0);
                        camera.target = camera.position + forward;

                        log::info!("  Applied camera position: {:?}", camera.position);
                        log::info!("  Applied camera target: {:?} (from rotation {:?})", camera.target, rotation);
                        log::debug!("  Camera forward vector: {:?}", forward);
                    }

                    break;
                }
            }
        }

        // Initialize timer
        let timer = FrameTimer::new();

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

        // Initialize debug state and debug subsystems
        let debug_state = DebugState::new(debug_config.is_enabled());
        let (debug_camera, orbit_controller, line_renderer, debug_hud, debug_profiler) =
            if debug_config.is_enabled() {
                log::info!("Debug subsystem initialized");
                log::info!("  Hotkeys:");
                log::info!("    F1 - Toggle HUD");
                log::info!("    F2 - Toggle collider gizmos");
                log::info!("    F3 - Toggle debug camera (RMB=orbit, MMB=pan, scroll=zoom)");
                log::info!("    F4 - Toggle GPU profiler");

                let debug_cam = camera.clone();
                let orbit_ctrl = OrbitController::new_from_camera(&camera);
                let line_rend = LineRenderer::new(&renderer.device, &renderer.config);
                let hud = DebugHud::new(
                    &renderer.device,
                    &renderer.queue,
                    renderer.config.format,
                    width,
                    height,
                );
                let profiler = DebugProfiler::new(&renderer.device);

                (
                    Some(debug_cam),
                    Some(orbit_ctrl),
                    Some(line_rend),
                    Some(hud),
                    Some(profiler),
                )
            } else {
                (None, None, None, None, None)
            };

        Ok(Self {
            window,
            renderer,
            scene_renderer,
            camera,
            scene,
            timer,
            physics_world,
            physics_accumulator: 0.0,
            debug_state,
            debug_camera,
            orbit_controller,
            line_renderer,
            line_batch: LineBatch::new(),
            debug_hud,
            debug_profiler,
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
                                        Err(wgpu::SurfaceError::Lost) => {
                                            self.resize(self.renderer.size)
                                        }
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
        // Recreate depth texture to match new surface size
        self.scene_renderer.depth_texture =
            crate::render::depth_texture::DepthTexture::create(&self.renderer.device, &self.renderer.config);

        // Resize debug HUD if present
        if let Some(ref mut hud) = self.debug_hud {
            hud.resize(new_size.width, new_size.height);
        }
    }

    fn input(&mut self, event: &WindowEvent) -> bool {
        // Handle debug hotkeys
        if self.debug_state.enabled {
            if let WindowEvent::KeyboardInput {
                event: KeyEvent {
                    state: ElementState::Pressed,
                    physical_key: PhysicalKey::Code(key_code),
                    ..
                },
                ..
            } = event {
                match key_code {
                    KeyCode::F1 => {
                        self.debug_state.toggle_hud();
                        return true;
                    }
                    KeyCode::F2 => {
                        self.debug_state.toggle_colliders();
                        return true;
                    }
                    KeyCode::F3 => {
                        self.debug_state.toggle_debug_camera();

                        // Toggle orbit controller when switching to debug camera
                        if let Some(ref mut orbit_ctrl) = self.orbit_controller {
                            orbit_ctrl.set_enabled(self.debug_state.use_debug_camera);

                            if self.debug_state.use_debug_camera {
                                log::info!("Debug camera ENABLED - use Right-click to orbit, Middle-click to pan, Scroll to zoom");

                                // Sync orbit controller from current camera state
                                orbit_ctrl.sync_from_camera(&self.camera);

                                // Create a copy of the camera for debug use
                                if let Some(ref mut debug_cam) = self.debug_camera {
                                    *debug_cam = self.camera.clone();
                                }
                            } else {
                                log::info!("Debug camera DISABLED - using main scene camera");
                            }
                        }

                        return true;
                    }
                    KeyCode::F4 => {
                        self.debug_state.toggle_gpu_profiler();
                        return true;
                    }
                    _ => {}
                }
            }

            // Handle orbit controller mouse input when debug camera is active
            if self.debug_state.use_debug_camera {
                if let Some(ref mut orbit_ctrl) = self.orbit_controller {
                    match event {
                        WindowEvent::MouseInput { button, state, .. } => {
                            orbit_ctrl.handle_mouse_button(*button, *state);
                            return true;
                        }
                        WindowEvent::CursorMoved { position, .. } => {
                            orbit_ctrl.handle_mouse_move(glam::Vec2::new(
                                position.x as f32,
                                position.y as f32,
                            ));
                            return true;
                        }
                        WindowEvent::MouseWheel { delta, .. } => {
                            let scroll_delta = match delta {
                                MouseScrollDelta::LineDelta(_x, y) => *y,
                                MouseScrollDelta::PixelDelta(pos) => pos.y as f32 / 100.0,
                            };
                            orbit_ctrl.handle_scroll(scroll_delta);
                            return true;
                        }
                        _ => {}
                    }
                }
            }
        }

        false
    }

    fn update(&mut self) {
        self.timer.tick();

        // Update debug HUD stats if enabled
        if self.debug_state.show_hud {
            if let Some(ref mut hud) = self.debug_hud {
                let stats = self.physics_world.stats();
                hud.update_stats(
                    self.timer.fps(),
                    self.timer.delta_seconds() * 1000.0, // Convert to ms
                    stats.rigid_body_count,
                    stats.collider_count,
                );
            }
        }

        // Update debug camera if active
        if self.debug_state.use_debug_camera {
            if let (Some(ref mut orbit_ctrl), Some(ref mut debug_cam)) =
                (&mut self.orbit_controller, &mut self.debug_camera)
            {
                orbit_ctrl.update_camera(debug_cam);
            }
        }

        // Fixed timestep physics update (60 Hz)
        const PHYSICS_TIMESTEP: f32 = 1.0 / 60.0;
        self.physics_accumulator += self.timer.delta_seconds();

        // Run physics steps (with max iterations to prevent spiral of death)
        let mut steps = 0;
        const MAX_PHYSICS_STEPS: u32 = 5;

        while self.physics_accumulator >= PHYSICS_TIMESTEP && steps < MAX_PHYSICS_STEPS {
            self.physics_world.step(PHYSICS_TIMESTEP);
            self.physics_accumulator -= PHYSICS_TIMESTEP;
            steps += 1;
        }

        // Sync physics transforms back to renderable entities
        if steps > 0 {
            let stats = self.physics_world.stats();
            let mut any_updated = false;
            for i in 0..stats.rigid_body_count {
                if let Some((entity_id, (position, rotation))) = self
                    .physics_world
                    .entity_to_body
                    .iter()
                    .nth(i)
                    .and_then(|(id, handle)| {
                        self.physics_world.rigid_bodies.get(*handle).map(|body| {
                            let iso = body.position();
                            let pos = glam::Vec3::new(
                                iso.translation.x,
                                iso.translation.y,
                                iso.translation.z,
                            );
                            let rot = glam::Quat::from_xyzw(
                                iso.rotation.i,
                                iso.rotation.j,
                                iso.rotation.k,
                                iso.rotation.w,
                            );
                            (*id, (pos, rot))
                        })
                    })
                {
                    if self
                        .scene_renderer
                        .update_entity_transform(entity_id, position, rotation)
                    {
                        any_updated = true;
                    }
                }
            }

            if any_updated {
                self.scene_renderer
                    .rebuild_instance_buffer(&self.renderer.device);
            }
        }
    }

    fn render(&mut self) -> Result<(), wgpu::SurfaceError> {
        let output = self.renderer.surface.get_current_texture()?;
        let view = output
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());

        let mut encoder =
            self.renderer
                .device
                .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                    label: Some("Render Encoder"),
                });

        // Use debug camera if active, otherwise use main camera
        let active_camera = if self.debug_state.use_debug_camera {
            self.debug_camera.as_ref().unwrap_or(&self.camera)
        } else {
            &self.camera
        };

        // Render the scene
        self.scene_renderer.render(
            &mut encoder,
            &view,
            active_camera,
            &self.renderer.queue,
            &self.renderer.device,
        );

        // Render debug collider gizmos if enabled
        if self.debug_state.show_colliders {
            if let Some(ref mut line_renderer) = self.line_renderer {
                // Clear and rebuild line batch from physics world
                self.line_batch.clear();
                append_collider_lines(&self.physics_world, &mut self.line_batch);

                if !self.line_batch.is_empty() {
                    // Update camera matrix
                    line_renderer.update_camera(&self.renderer.queue, active_camera);

                    // Upload line vertices
                    line_renderer.upload(
                        &self.renderer.device,
                        &self.renderer.queue,
                        &self.line_batch,
                    );

                    // Create render pass for lines
                    {
                        let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                            label: Some("Debug Lines Render Pass"),
                            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                                view: &view,
                                resolve_target: None,
                                ops: wgpu::Operations {
                                    load: wgpu::LoadOp::Load, // Don't clear, draw on top
                                    store: wgpu::StoreOp::Store,
                                },
                            })],
                            depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                                view: &self.scene_renderer.depth_texture.view,
                                depth_ops: Some(wgpu::Operations {
                                    load: wgpu::LoadOp::Load, // Use existing depth
                                    store: wgpu::StoreOp::Store,
                                }),
                                stencil_ops: None,
                            }),
                            timestamp_writes: None,
                            occlusion_query_set: None,
                        });

                        line_renderer.draw(&mut render_pass, self.line_batch.vertex_count());
                    }
                }
            }
        }

        // Render debug HUD if enabled
        if self.debug_state.show_hud {
            if let Some(ref mut hud) = self.debug_hud {
                if let Err(e) = hud.render(
                    &self.renderer.device,
                    &self.renderer.queue,
                    &mut encoder,
                    &view,
                ) {
                    log::warn!("Failed to render debug HUD: {}", e);
                }
            }
        }

        self.renderer
            .queue
            .submit(std::iter::once(encoder.finish()));
        output.present();

        Ok(())
    }
}
