use crate::{
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
                        log::info!("  Applied camera position: {:?}", camera.position);
                        log::debug!("  Camera rotation (quat): {:?}", transform.rotation_quat());
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

        Ok(Self {
            window,
            renderer,
            scene_renderer,
            camera,
            scene,
            timer,
            physics_world,
            physics_accumulator: 0.0,
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
    }

    fn input(&mut self, _event: &WindowEvent) -> bool {
        false
    }

    fn update(&mut self) {
        self.timer.tick();

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

        // Render the scene
        self.scene_renderer.render(
            &mut encoder,
            &view,
            &self.camera,
            &self.renderer.queue,
            &self.renderer.device,
        );

        self.renderer
            .queue
            .submit(std::iter::once(encoder.finish()));
        output.present();

        Ok(())
    }
}
