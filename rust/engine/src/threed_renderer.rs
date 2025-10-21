use anyhow::{Context as AnyhowContext, Result};
use glam::Vec3 as GlamVec3;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use three_d::*;
use winit::dpi::PhysicalSize;
use winit::window::Window as WinitWindow;

use vibe_ecs_bridge::decoders::{
    CameraComponent, GeometryAsset, Instanced, Light as LightComponent, MeshRenderer, Terrain,
    Transform,
};
use vibe_ecs_bridge::ComponentRegistry;
use vibe_scene::Scene as SceneData;
use vibe_scene::{Entity, EntityId};
use vibe_scene_graph::SceneGraph;

// Import renderer modules
use crate::renderer::coordinate_conversion::threejs_to_threed_position;
use crate::renderer::{
    apply_post_processing, create_camera, generate_terrain, load_camera, load_instanced,
    load_light, load_mesh_renderer, CameraConfig, ColorGradingEffect, DebugLineRenderer,
    EnhancedDirectionalLight, EnhancedSpotLight, LoadedLight, MaterialManager, PostProcessSettings,
    SkyboxRenderer,
};

/// ThreeDRenderer - Rendering backend using three-d library for PBR rendering
///
/// This renderer is focused on core rendering responsibilities:
/// - Managing the rendering context and window
/// - Coordinating the render loop
/// - Managing scene objects (meshes, lights, camera)
/// - Synchronizing with physics
pub struct ThreeDRenderer {
    windowed_context: WindowedContext,
    context: Context,
    camera: Camera,
    camera_config: Option<CameraConfig>,
    scene_graph: Option<SceneGraph>,
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    mesh_entity_ids: Vec<EntityId>, // Parallel array: entity ID for each mesh
    mesh_scales: Vec<GlamVec3>,     // Parallel array: final local scale per mesh
    mesh_base_scales: Vec<GlamVec3>, // Parallel array: primitive/base scale per mesh
    mesh_cast_shadows: Vec<bool>,   // Parallel array: castShadows flag for each mesh
    mesh_receive_shadows: Vec<bool>, // Parallel array: receiveShadows flag for each mesh
    directional_lights: Vec<EnhancedDirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<EnhancedSpotLight>,
    ambient_light: Option<AmbientLight>,
    window_size: (u32, u32),

    // Resource management
    mesh_cache: HashMap<String, CpuMesh>,
    material_manager: MaterialManager,
    component_registry: ComponentRegistry,
    skybox_renderer: SkyboxRenderer,
    debug_line_renderer: DebugLineRenderer,
    hdr_color_texture: Option<Texture2D>,
    hdr_depth_texture: Option<three_d::DepthTexture2D>,
    additional_cameras: Vec<AdditionalCamera>,

    // Camera follow smoothing
    last_camera_position: Vec3,
    last_camera_target: Vec3,
}

struct RenderSettings {
    clear_state: Option<ClearState>,
    render_skybox: bool,
    post_settings: Option<PostProcessSettings>,
}

struct AdditionalCamera {
    camera: Camera,
    config: CameraConfig,
    skybox_renderer: SkyboxRenderer,
    last_position: Vec3,
    last_target: Vec3,
}

struct CameraEntry {
    depth: i32,
    variant: CameraVariant,
}

enum CameraVariant {
    Main,
    Additional(usize),
}

impl ThreeDRenderer {
    /// Initialize the three-d renderer from a winit window
    pub fn new(window: Arc<WinitWindow>) -> Result<Self> {
        log::info!("Initializing three-d renderer...");

        // Create three-d WindowedContext from winit window with MSAA antialiasing
        let size = window.inner_size();
        let windowed_context = WindowedContext::from_winit_window(
            window.as_ref(),
            SurfaceSettings {
                // Enable 4x MSAA for smooth edges on geometry
                multisamples: 4,
                ..Default::default()
            },
        )
        .with_context(|| "Failed to create three-d context from window")?;

        log::info!("  MSAA: 4x (antialiasing enabled)");

        // WindowedContext implements Deref<Target = Context>, so we can clone the context
        let context: Context = windowed_context.clone();

        // Create perspective camera
        let viewport = Viewport::new_at_origo(size.width, size.height);
        let camera = Camera::new_perspective(
            viewport,
            vec3(0.0, 2.0, 5.0), // position
            vec3(0.0, 0.0, 0.0), // target
            vec3(0.0, 1.0, 0.0), // up
            degrees(60.0),       // fov
            0.1,                 // near
            1000.0,              // far
        );

        log::info!("  Viewport: {}x{}", size.width, size.height);
        log::info!("  Camera FOV: 60°, Near: 0.1, Far: 1000.0");

        // Create component registry for decoding ECS components
        let component_registry = vibe_ecs_bridge::decoders::create_default_registry();

        let initial_pos = vec3(0.0, 2.0, 5.0);
        let initial_target = vec3(0.0, 0.0, 0.0);

        let debug_line_renderer = DebugLineRenderer::new(&context);

        Ok(Self {
            windowed_context,
            context,
            camera,
            camera_config: None,
            scene_graph: None,
            meshes: Vec::new(),
            mesh_entity_ids: Vec::new(),
            mesh_scales: Vec::new(),
            mesh_base_scales: Vec::new(),
            mesh_cast_shadows: Vec::new(),
            mesh_receive_shadows: Vec::new(),
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_light: None,
            window_size: (size.width, size.height),
            mesh_cache: HashMap::new(),
            material_manager: MaterialManager::new(),
            component_registry,
            skybox_renderer: SkyboxRenderer::new(),
            debug_line_renderer,
            hdr_color_texture: None,
            hdr_depth_texture: None,
            additional_cameras: Vec::new(),
            last_camera_position: initial_pos,
            last_camera_target: initial_target,
        })
    }

    /// Create a simple test scene with primitives
    pub fn create_test_scene(&mut self) -> Result<()> {
        log::info!("Creating test scene with primitives...");

        // Create a simple cube mesh
        let cpu_mesh = CpuMesh::cube();
        let mesh = Mesh::new(&self.context, &cpu_mesh);

        // Create PBR material
        let material = PhysicalMaterial::new(
            &self.context,
            &CpuMaterial {
                albedo: Srgba::new(200, 100, 100, 255),
                metallic: 0.3,
                roughness: 0.7,
                ..Default::default()
            },
        );

        // Combine mesh and material
        let cube = Gm::new(mesh, material);
        self.meshes.push(cube);
        self.mesh_entity_ids.push(EntityId::new(0)); // Test cube with ID 0
        self.mesh_scales.push(GlamVec3::ONE);
        self.mesh_base_scales.push(GlamVec3::ONE);
        self.mesh_cast_shadows.push(true); // Test cube casts shadows
        self.mesh_receive_shadows.push(true); // Test cube receives shadows

        // Add directional light (enhanced with shadow support)
        let light = EnhancedDirectionalLight::new(
            &self.context,
            1.5,                     // intensity
            Srgba::WHITE,            // color
            &vec3(-1.0, -1.0, -1.0), // direction
            -0.0001,                 // shadow bias
            1.0,                     // shadow radius (PCF)
            2048,                    // shadow map size
            true,                    // cast shadows
        );
        self.directional_lights.push(light);

        // Add ambient light
        self.ambient_light = Some(AmbientLight::new(
            &self.context,
            0.3,          // intensity
            Srgba::WHITE, // color
        ));

        log::info!("  Added cube with PBR material");
        log::info!("  Added directional light");
        log::info!("  Added ambient light");

        Ok(())
    }

    /// Update camera based on follow system and other camera features
    pub fn update_camera_internal(&mut self, delta_time: f32) {
        if let Some(ref config) = self.camera_config.clone() {
            if let Some(target_id) = Self::follow_target_if_locked(&config) {
                let target_vec3 =
                    Self::compute_follow_target_position(self.scene_graph.as_mut(), target_id);
                if let Some(target_vec3) = target_vec3 {
                    Self::apply_follow_to_camera(
                        &mut self.camera,
                        &config,
                        target_vec3,
                        &mut self.last_camera_position,
                        &mut self.last_camera_target,
                        delta_time,
                    );
                } else {
                    log::warn!(
                        "Camera follow target entity {} not found in scene",
                        target_id
                    );
                }
            }
        }

        for idx in 0..self.additional_cameras.len() {
            let follow_target = {
                let cam = &self.additional_cameras[idx];
                Self::follow_target_if_locked(&cam.config)
            };

            if let Some(target_id) = follow_target {
                let target_vec3 =
                    Self::compute_follow_target_position(self.scene_graph.as_mut(), target_id);

                if let Some(target_vec3) = target_vec3 {
                    let (config, camera, last_position, last_target) = {
                        let cam = &mut self.additional_cameras[idx];
                        (
                            &cam.config,
                            &mut cam.camera,
                            &mut cam.last_position,
                            &mut cam.last_target,
                        )
                    };

                    Self::apply_follow_to_camera(
                        camera,
                        config,
                        target_vec3,
                        last_position,
                        last_target,
                        delta_time,
                    );
                } else {
                    log::warn!(
                        "Camera follow target entity {} not found in scene",
                        target_id
                    );
                }
            }
        }
    }

    fn ensure_post_process_targets(&mut self) {
        let (width, height) = self.window_size;

        let recreate_color = match self.hdr_color_texture {
            Some(ref tex) => tex.width() != width || tex.height() != height,
            None => true,
        };

        if recreate_color {
            self.hdr_color_texture = Some(Texture2D::new_empty::<[f32; 4]>(
                &self.context,
                width,
                height,
                Interpolation::Linear,
                Interpolation::Linear,
                Some(Interpolation::Linear),
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            ));
        }

        let recreate_depth = match self.hdr_depth_texture {
            Some(ref tex) => tex.width() != width || tex.height() != height,
            None => true,
        };

        if recreate_depth {
            self.hdr_depth_texture = Some(three_d::DepthTexture2D::new::<f32>(
                &self.context,
                width,
                height,
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            ));
        }
    }

    /// Render a frame
    pub fn render(
        &mut self,
        delta_time: f32,
        debug_mode: bool,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
    ) -> Result<()> {
        self.log_first_frame();

        // Update camera (follow system, etc.)
        self.update_camera_internal(delta_time);

        // Generate shadow maps for lights that cast shadows
        self.generate_shadow_maps();

        let mut camera_entries = Vec::new();
        if let Some(ref config) = self.camera_config {
            camera_entries.push(CameraEntry {
                depth: config.depth,
                variant: CameraVariant::Main,
            });
        }
        for (idx, cam) in self.additional_cameras.iter().enumerate() {
            camera_entries.push(CameraEntry {
                depth: cam.config.depth,
                variant: CameraVariant::Additional(idx),
            });
        }
        camera_entries.sort_by(|a, b| a.depth.cmp(&b.depth));

        let screen = RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);

        for entry in camera_entries {
            match entry.variant {
                CameraVariant::Main => {
                    let Some(ref config) = self.camera_config.clone() else {
                        continue;
                    };
                    let scissor: ScissorBox = self.camera.viewport().into();
                    let settings =
                        Self::prepare_render_settings_for(config, self.skybox_renderer.is_loaded());

                    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
                    if let Some(ref post_settings) = settings.post_settings {
                        if post_settings.apply_tone_mapping {
                            tone_restore =
                                Some((self.camera.tone_mapping, self.camera.color_mapping));
                            self.camera.disable_tone_and_color_mapping();
                        }
                    }

                    if let Some(post_settings) = settings.post_settings.clone() {
                        self.ensure_post_process_targets();

                        // Manually collect light references to avoid borrowing all of self
                        let mut lights: Vec<&dyn Light> = Vec::new();
                        for light in &self.directional_lights {
                            lights.push(light);
                        }
                        for light in &self.point_lights {
                            lights.push(light);
                        }
                        for light in &self.spot_lights {
                            lights.push(light);
                        }
                        if let Some(ref ambient) = self.ambient_light {
                            lights.push(ambient);
                        }

                        {
                            let render_target = {
                                let color_target = self
                                    .hdr_color_texture
                                    .as_mut()
                                    .expect("HDR color texture not initialized")
                                    .as_color_target(None);
                                let depth_target = self
                                    .hdr_depth_texture
                                    .as_mut()
                                    .expect("HDR depth texture not initialized")
                                    .as_depth_target();
                                RenderTarget::new(color_target, depth_target)
                            };

                            if let Some(clear_state) = settings.clear_state {
                                render_target.clear_partially(scissor, clear_state);
                            }

                            if settings.render_skybox {
                                self.skybox_renderer.render(&render_target, &self.camera);
                            }

                            render_target.render(&self.camera, &self.meshes, &lights);
                        }

                        let color_texture =
                            three_d::ColorTexture::Single(self.hdr_color_texture.as_ref().unwrap());
                        let effect = ColorGradingEffect::from(post_settings);
                        apply_post_processing(
                            &screen,
                            effect,
                            &self.camera,
                            color_texture,
                            scissor,
                        );
                    } else {
                        if let Some(clear_state) = settings.clear_state {
                            screen.clear_partially(scissor, clear_state);
                        }

                        if settings.render_skybox {
                            self.skybox_renderer.render(&screen, &self.camera);
                        }

                        let lights = self.collect_lights();
                        screen.render(&self.camera, &self.meshes, &lights);
                    }

                    if let Some((tone, color)) = tone_restore {
                        self.camera.tone_mapping = tone;
                        self.camera.color_mapping = color;
                    }
                }
                CameraVariant::Additional(index) => {
                    if index >= self.additional_cameras.len() {
                        continue;
                    }

                    let config_clone = {
                        let cam = &self.additional_cameras[index];
                        cam.config.clone()
                    };
                    let skybox_loaded = {
                        let cam = &self.additional_cameras[index];
                        cam.skybox_renderer.is_loaded()
                    };
                    let settings = Self::prepare_render_settings_for(&config_clone, skybox_loaded);

                    let scissor: ScissorBox = {
                        let cam = &self.additional_cameras[index];
                        cam.camera.viewport().into()
                    };

                    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
                    if let Some(ref post_settings) = settings.post_settings {
                        if post_settings.apply_tone_mapping {
                            let cam = &mut self.additional_cameras[index];
                            tone_restore =
                                Some((cam.camera.tone_mapping, cam.camera.color_mapping));
                            cam.camera.disable_tone_and_color_mapping();
                        }
                    }

                    if let Some(post_settings) = settings.post_settings.clone() {
                        self.ensure_post_process_targets();

                        // Manually collect light references to avoid borrowing all of self
                        let mut lights: Vec<&dyn Light> = Vec::new();
                        for light in &self.directional_lights {
                            lights.push(light);
                        }
                        for light in &self.point_lights {
                            lights.push(light);
                        }
                        for light in &self.spot_lights {
                            lights.push(light);
                        }
                        if let Some(ref ambient) = self.ambient_light {
                            lights.push(ambient);
                        }

                        {
                            let render_target = {
                                let color_target = self
                                    .hdr_color_texture
                                    .as_mut()
                                    .expect("HDR color texture not initialized")
                                    .as_color_target(None);
                                let depth_target = self
                                    .hdr_depth_texture
                                    .as_mut()
                                    .expect("HDR depth texture not initialized")
                                    .as_depth_target();
                                RenderTarget::new(color_target, depth_target)
                            };

                            if let Some(clear_state) = settings.clear_state {
                                render_target.clear_partially(scissor, clear_state);
                            }

                            if settings.render_skybox {
                                let skybox_renderer =
                                    &self.additional_cameras[index].skybox_renderer;
                                let camera_ref = &self.additional_cameras[index].camera;
                                skybox_renderer.render(&render_target, camera_ref);
                            }

                            let camera_ref = &self.additional_cameras[index].camera;
                            render_target.render(camera_ref, &self.meshes, &lights);
                        }

                        let color_texture =
                            three_d::ColorTexture::Single(self.hdr_color_texture.as_ref().unwrap());
                        let effect = ColorGradingEffect::from(post_settings);
                        let camera_ref = &self.additional_cameras[index].camera;
                        apply_post_processing(&screen, effect, camera_ref, color_texture, scissor);
                    } else {
                        if let Some(clear_state) = settings.clear_state {
                            screen.clear_partially(scissor, clear_state);
                        }

                        if settings.render_skybox {
                            let skybox_renderer = &self.additional_cameras[index].skybox_renderer;
                            let camera_ref = &self.additional_cameras[index].camera;
                            skybox_renderer.render(&screen, camera_ref);
                        }

                        let lights = self.collect_lights();
                        let camera_ref = &self.additional_cameras[index].camera;
                        screen.render(camera_ref, &self.meshes, &lights);
                    }

                    if let Some((tone, color)) = tone_restore {
                        let cam = &mut self.additional_cameras[index];
                        cam.camera.tone_mapping = tone;
                        cam.camera.color_mapping = color;
                    }
                }
            }
        }

        // Render debug overlay if debug mode is enabled
        if debug_mode {
            let screen =
                RenderTarget::screen(&self.context, self.window_size.0, self.window_size.1);
            self.render_debug_overlay(&screen, physics_world)?;
        }

        self.windowed_context
            .swap_buffers()
            .with_context(|| "Failed to swap buffers")?;

        Ok(())
    }

    /// Capture a screenshot by rendering to a texture and saving it
    pub fn render_to_screenshot(
        &mut self,
        path: &std::path::Path,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        scale: f32,
        quality: u8,
    ) -> Result<()> {
        log::info!("Rendering screenshot to: {}", path.display());

        // Generate shadow maps first (required for proper rendering)
        self.generate_shadow_maps();

        // Calculate scaled dimensions
        let width = ((self.window_size.0 as f32) * scale).max(1.0) as u32;
        let height = ((self.window_size.1 as f32) * scale).max(1.0) as u32;

        log::info!("  Resolution: {}x{} (scale: {:.2})", width, height, scale);

        // Preserve current camera viewports so we can restore them after the capture
        let original_main_viewport = self.camera.viewport();
        let original_additional_viewports: Vec<_> = self
            .additional_cameras
            .iter()
            .map(|cam| cam.camera.viewport())
            .collect();

        // Adjust viewports to match the offscreen render target so the capture fills the frame
        let additional_configs: Vec<_> = self
            .additional_cameras
            .iter()
            .map(|cam| cam.config.clone())
            .collect();
        let (screenshot_main_viewport, screenshot_additional_viewports) =
            Self::screenshot_viewports((width, height), &additional_configs);

        self.camera.set_viewport(screenshot_main_viewport);
        for (cam, viewport) in self
            .additional_cameras
            .iter_mut()
            .zip(screenshot_additional_viewports.iter())
        {
            cam.camera.set_viewport(*viewport);
        }

        let result = (|| -> Result<()> {
            // Create a color texture to render to
            let mut color_texture = Texture2D::new_empty::<[u8; 4]>(
                &self.context,
                width,
                height,
                Interpolation::Nearest,
                Interpolation::Nearest,
                None,
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            );

            // Create a depth texture
            let mut depth_texture = DepthTexture2D::new::<f32>(
                &self.context,
                width,
                height,
                Wrapping::ClampToEdge,
                Wrapping::ClampToEdge,
            );

            // Create render target
            let render_target = RenderTarget::new(
                color_texture.as_color_target(None),
                depth_texture.as_depth_target(),
            );

            // Clear the render target using camera's background color
            let clear_color = self
                .camera_config
                .as_ref()
                .and_then(|c| c.background_color)
                .unwrap_or((0.0, 0.0, 0.0, 1.0));

            render_target.clear(ClearState::color_and_depth(
                clear_color.0,
                clear_color.1,
                clear_color.2,
                clear_color.3,
                1.0,
            ));

            // Render skybox if enabled
            if let Some(ref config) = self.camera_config {
                if config.clear_flags.as_deref() == Some("skybox") {
                    self.skybox_renderer.render(&render_target, &self.camera);
                }
            }

            // Collect lights and render scene
            let lights = self.collect_lights();
            render_target.render(&self.camera, &self.meshes, &lights);

            // Render debug overlay if physics world is provided
            if let Some(physics) = physics_world {
                self.render_debug_overlay(&render_target, Some(physics))?;
            }

            // Read pixels from the render target (RGBA u8 format)
            let pixels: Vec<[u8; 4]> = render_target.read_color();

            // Flatten the pixel data into a byte vec
            let bytes: Vec<u8> = pixels.into_iter().flat_map(|pixel| pixel).collect();

            // Create the image
            let img = image::RgbaImage::from_raw(width, height, bytes)
                .with_context(|| "Failed to create image from pixels")?;

            // Determine output format from file extension
            let extension = path
                .extension()
                .and_then(|e| e.to_str())
                .map(|s| s.to_lowercase());

            match extension.as_deref() {
                Some("jpg") | Some("jpeg") => {
                    // Convert RGBA to RGB (JPEG doesn't support alpha)
                    let rgb_img = image::DynamicImage::ImageRgba8(img).to_rgb8();

                    // Save as JPEG with specified quality
                    use image::codecs::jpeg::JpegEncoder;
                    let file = std::fs::File::create(path)
                        .with_context(|| "Failed to create output file")?;
                    let mut encoder = JpegEncoder::new_with_quality(file, quality);
                    encoder
                        .encode(
                            rgb_img.as_raw(),
                            width,
                            height,
                            image::ColorType::Rgb8.into(),
                        )
                        .with_context(|| "Failed to encode JPEG")?;
                    log::info!("Screenshot saved as JPEG (quality: {})", quality);
                }
                Some("png") | None => {
                    // Save as PNG (image crate will use default compression)
                    img.save(path)
                        .with_context(|| format!("Failed to save PNG to {}", path.display()))?;
                    log::info!("Screenshot saved as PNG");
                }
                _ => {
                    // Fallback to default save for other formats
                    img.save(path).with_context(|| {
                        format!("Failed to save screenshot to {}", path.display())
                    })?;
                    log::info!("Screenshot saved successfully");
                }
            }

            Ok(())
        })();

        // Restore original viewports to leave runtime rendering untouched
        self.camera.set_viewport(original_main_viewport);
        for (cam, viewport) in self
            .additional_cameras
            .iter_mut()
            .zip(original_additional_viewports.into_iter())
        {
            cam.camera.set_viewport(viewport);
        }

        result
    }

    fn screenshot_viewports(
        target_size: (u32, u32),
        additional_configs: &[CameraConfig],
    ) -> (Viewport, Vec<Viewport>) {
        let main = Viewport::new_at_origo(target_size.0.max(1), target_size.1.max(1));
        let additional = additional_configs
            .iter()
            .map(|config| Self::viewport_from_config(config, target_size))
            .collect();

        (main, additional)
    }

    /// Update camera position and target
    pub fn update_camera(&mut self, position: glam::Vec3, target: glam::Vec3) {
        let pos = vec3(position.x, position.y, position.z);
        let tgt = vec3(target.x, target.y, target.z);
        self.camera.set_view(pos, tgt, vec3(0.0, 1.0, 0.0));
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        log::info!("Resizing renderer to {}x{}", width, height);

        // CRITICAL: Resize the three-d context to match the new window size
        // Without this, the framebuffer size won't match the window and rendering will be clipped
        self.windowed_context
            .resize(PhysicalSize::new(width, height));

        self.window_size = (width, height);
        self.hdr_color_texture = None;
        self.hdr_depth_texture = None;

        if let Some(ref config) = self.camera_config {
            let viewport = Self::viewport_from_config(config, self.window_size);
            self.camera.set_viewport(viewport);
        } else {
            self.camera
                .set_viewport(Viewport::new_at_origo(width, height));
        }

        for cam in &mut self.additional_cameras {
            let viewport = Self::viewport_from_config(&cam.config, self.window_size);
            cam.camera.set_viewport(viewport);
        }
    }

    fn viewport_from_config(config: &CameraConfig, window_size: (u32, u32)) -> Viewport {
        if let Some(ref rect) = config.viewport_rect {
            let x = (rect.x * window_size.0 as f32) as u32;
            let y = (rect.y * window_size.1 as f32) as u32;
            let width = (rect.width * window_size.0 as f32) as u32;
            let height = (rect.height * window_size.1 as f32) as u32;

            Viewport {
                x: x as i32,
                y: y as i32,
                width: width.max(1),
                height: height.max(1),
            }
        } else {
            Viewport::new_at_origo(window_size.0, window_size.1)
        }
    }

    fn prepare_render_settings_for(config: &CameraConfig, skybox_loaded: bool) -> RenderSettings {
        const NEUTRAL_GRAY: (f32, f32, f32, f32) = (64.0 / 255.0, 64.0 / 255.0, 64.0 / 255.0, 1.0);

        let solid_color = config
            .background_color
            .unwrap_or((0.0_f32, 0.0_f32, 0.0_f32, 1.0));

        let solid_clear = ClearState::color_and_depth(
            solid_color.0,
            solid_color.1,
            solid_color.2,
            solid_color.3,
            1.0,
        );
        let gray_clear = ClearState::color_and_depth(
            NEUTRAL_GRAY.0,
            NEUTRAL_GRAY.1,
            NEUTRAL_GRAY.2,
            NEUTRAL_GRAY.3,
            1.0,
        );

        let mut render_skybox = false;

        let clear_state = match config
            .clear_flags
            .as_deref()
            .map(|s| s.to_ascii_lowercase())
            .unwrap_or_else(|| "solidcolor".to_string())
            .as_str()
        {
            "skybox" => {
                if skybox_loaded {
                    render_skybox = true;
                    Some(ClearState::depth(1.0))
                } else {
                    Some(gray_clear)
                }
            }
            "depthonly" => Some(ClearState::depth(1.0)),
            "dontclear" => None,
            "solidcolor" | "color" => Some(solid_clear),
            other => {
                log::warn!(
                    "Unknown clear flag '{}', defaulting to neutral gray clear.",
                    other
                );
                Some(gray_clear)
            }
        };

        let post_settings = PostProcessSettings::from_camera(config);

        RenderSettings {
            clear_state,
            render_skybox,
            post_settings,
        }
    }

    fn follow_target_if_locked(config: &CameraConfig) -> Option<u32> {
        let target_id = config.follow_target?;
        match config
            .control_mode
            .as_deref()
            .map(|mode| mode.to_ascii_lowercase())
        {
            Some(ref mode) if mode == "locked" => Some(target_id),
            Some(ref mode) if mode == "free" => None,
            Some(ref mode) => {
                log::warn!(
                    "Unknown camera controlMode '{}'; defaulting to locked follow.",
                    mode
                );
                Some(target_id)
            }
            None => Some(target_id),
        }
    }

    fn compute_follow_target_position(
        scene_graph: Option<&mut SceneGraph>,
        target_id: u32,
    ) -> Option<Vec3> {
        let graph = scene_graph?;
        let entity_id = EntityId::new(target_id as u64);
        let transform = graph.get_world_transform(entity_id)?;
        let target_pos = transform.w_axis.truncate();
        Some(vec3(target_pos.x, target_pos.y, target_pos.z))
    }

    fn apply_follow_to_camera(
        camera: &mut Camera,
        config: &CameraConfig,
        target_vec3: Vec3,
        last_position: &mut Vec3,
        last_target: &mut Vec3,
        delta_time: f32,
    ) {
        let offset = config.follow_offset.unwrap_or(vec3(0.0, 2.0, -5.0));
        let desired_position = target_vec3 + offset;

        let new_position = if config.enable_smoothing {
            let smoothing_factor = (config.smoothing_speed * delta_time).min(1.0);
            *last_position * (1.0 - smoothing_factor) + desired_position * smoothing_factor
        } else {
            desired_position
        };

        let desired_target = target_vec3;
        let new_target = if config.enable_smoothing {
            let rotation_factor = (config.rotation_smoothing * delta_time).min(1.0);
            *last_target * (1.0 - rotation_factor) + desired_target * rotation_factor
        } else {
            desired_target
        };

        camera.set_view(new_position, new_target, vec3(0.0, 1.0, 0.0));

        *last_position = new_position;
        *last_target = new_target;
    }

    /// Load a full scene from SceneData
    /// Now async to support texture loading!
    pub async fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        self.log_scene_load_start(scene);
        self.clear_scene();

        // Build scene graph for transform hierarchy and camera follow
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("SCENE GRAPH");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        let scene_graph = SceneGraph::build(scene)?;
        log::info!(
            "Scene graph built with {} entities",
            scene_graph.entity_count()
        );
        self.scene_graph = Some(scene_graph);

        // Load materials
        self.load_materials(scene);

        // Load and register prefabs
        let mut prefab_registry = vibe_ecs_bridge::PrefabRegistry::new();
        let mut prefab_instances: Vec<Entity> = Vec::new();

        if let Some(prefabs_value) = &scene.prefabs {
            log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log::info!("PREFABS");
            log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            match vibe_ecs_bridge::parse_prefabs(prefabs_value) {
                Ok(prefabs) => {
                    log::info!("Found {} prefab definition(s)", prefabs.len());
                    for prefab in prefabs {
                        log::info!("  • {} (v{}): {}", prefab.id, prefab.version, prefab.name);
                        prefab_registry.register(prefab);
                    }
                }
                Err(e) => {
                    log::warn!("Failed to parse prefabs: {}", e);
                }
            }
        }

        // Process PrefabInstance components and instantiate prefabs
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("PREFAB INSTANCES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        for entity in &scene.entities {
            if let Some(prefab_instance) =
                self.get_component::<vibe_ecs_bridge::PrefabInstance>(entity, "PrefabInstance")
            {
                log::info!("  Instantiating prefab: {}", prefab_instance.prefabId);

                // Extract instance Transform to position the prefab
                let instance_transform = entity.components.get("Transform");

                match prefab_registry.get(&prefab_instance.prefabId) {
                    Some(prefab) => {
                        match vibe_ecs_bridge::instantiate_prefab(
                            prefab,
                            entity.persistentId.clone(),
                            prefab_instance.overridePatch.as_ref(),
                            instance_transform,
                            &prefab_instance.instanceUuid,
                            &self.component_registry,
                        ) {
                            Ok(instances) => {
                                log::info!("    → Created {} entity/entities", instances.len());
                                prefab_instances.extend(instances);
                            }
                            Err(e) => {
                                log::warn!(
                                    "    Failed to instantiate prefab {}: {}",
                                    prefab_instance.prefabId,
                                    e
                                );
                            }
                        }
                    }
                    None => {
                        log::warn!("    Prefab not found: {}", prefab_instance.prefabId);
                    }
                }
            }
        }

        // Rebuild scene graph with prefab instances included
        if !prefab_instances.is_empty() {
            log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log::info!("REBUILDING SCENE GRAPH WITH PREFAB INSTANCES");
            log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log::info!("  Original entities: {}", scene.entities.len());
            log::info!("  Prefab instances: {}", prefab_instances.len());

            // Create merged scene with both original entities and prefab instances
            let mut full_scene = scene.clone();
            full_scene.entities.extend(prefab_instances.clone());

            // Rebuild scene graph to include prefab hierarchies
            self.scene_graph = Some(SceneGraph::build(&full_scene)?);
            log::info!(
                "  Scene graph rebuilt with {} total entities",
                full_scene.entities.len()
            );
        }

        // Process entities
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("ENTITIES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Process original scene entities
        for entity in &scene.entities {
            self.load_entity(entity).await?;
        }

        // Process instantiated prefab entities
        for entity in &prefab_instances {
            self.load_entity(entity).await?;
        }

        self.log_scene_load_summary();

        Ok(())
    }

    /// Sync physics transforms back to renderer meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        // Iterate through all entities with physics bodies
        for (entity_id, body_handle) in physics_world.entity_to_body.iter() {
            // Get the rigid body
            if let Some(body) = physics_world.rigid_bodies.get(*body_handle) {
                // Find mesh index for this entity
                if let Some(mesh_idx) = self.mesh_entity_ids.iter().position(|&id| id == *entity_id)
                {
                    self.update_mesh_from_physics(mesh_idx, body);
                }
            }
        }
    }

    /// Sync script transforms back to renderer meshes
    pub fn sync_script_transforms(&mut self, script_system: &vibe_scripting::ScriptSystem) {
        use vibe_scene::EntityId;

        let entity_ids = script_system.entity_ids();
        log::debug!(
            "sync_script_transforms: {} entities with scripts",
            entity_ids.len()
        );
        log::debug!(
            "  Renderer has {} meshes with IDs: {:?}",
            self.mesh_entity_ids.len(),
            self.mesh_entity_ids
        );

        // Get all entity IDs that have scripts
        for entity_id in entity_ids {
            // Get the transform from the script system
            if let Some(transform) = script_system.get_transform(entity_id) {
                log::debug!(
                    "  Script entity {}: rotation={:?}",
                    entity_id,
                    transform.rotation
                );

                // The entity_id from script system is now u64 (PersistentId hash)
                let entity_id_obj = EntityId::new(entity_id);
                log::debug!(
                    "    Looking for EntityId({}) in renderer mesh list",
                    entity_id
                );

                // Collect all mesh indices for this entity (GLTF models may have multiple submeshes)
                let matching_indices: Vec<usize> = self
                    .mesh_entity_ids
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, id)| {
                        let matches = *id == entity_id_obj;
                        log::debug!(
                            "      Comparing {:?} == {:?}: {}",
                            id,
                            entity_id_obj,
                            matches
                        );
                        matches.then_some(idx)
                    })
                    .collect();

                if matching_indices.is_empty() {
                    log::warn!(
                        "  Entity {} has script but no mesh found in renderer",
                        entity_id
                    );
                    continue;
                }

                for mesh_idx in matching_indices {
                    log::debug!("    Updating mesh at index {}", mesh_idx);
                    let base_scale = self
                        .mesh_base_scales
                        .get(mesh_idx)
                        .copied()
                        .unwrap_or(GlamVec3::ONE);
                    let (transform_mat, final_scale) =
                        crate::renderer::transform_utils::compose_transform_with_base_scale(
                            &transform, base_scale,
                        );

                    if let Some(mesh) = self.meshes.get_mut(mesh_idx) {
                        mesh.set_transformation(transform_mat);
                        self.mesh_scales[mesh_idx] = final_scale;
                        log::debug!("    Transform applied successfully");
                    }
                }
            }
        }
    }

    /// Render debug visualizations (grid, colliders, etc.) when debug mode is enabled
    pub fn render_debug_overlay(
        &mut self,
        target: &RenderTarget,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
    ) -> Result<()> {
        use crate::debug::{append_collider_lines, append_ground_grid, LineBatch};

        let mut line_batch = LineBatch::new();

        // Add ground grid (20x20 units, 20 divisions)
        append_ground_grid(&mut line_batch, 20.0, 20);

        // Add collider outlines if physics world exists
        if let Some(physics_world) = physics_world {
            append_collider_lines(physics_world, &mut line_batch);
        }

        // Render the lines
        if let Some(debug_mesh) = self.debug_line_renderer.create_line_mesh(&line_batch)? {
            target.render(&self.camera, &[&debug_mesh], &[]);
        }

        Ok(())
    }

    // ===== Private Helper Methods =====

    fn clear_scene(&mut self) {
        self.meshes.clear();
        self.mesh_entity_ids.clear();
        self.mesh_scales.clear();
        self.mesh_base_scales.clear();
        self.mesh_cast_shadows.clear();
        self.mesh_receive_shadows.clear();
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;
        self.skybox_renderer.clear();
    }

    fn load_materials(&mut self, scene: &SceneData) {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if let Some(materials_value) = &scene.materials {
            self.material_manager.load_from_scene(materials_value);
        } else {
            log::warn!("No materials found in scene");
        }
    }

    async fn load_entity(&mut self, entity: &Entity) -> Result<()> {
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        log::info!(
            "\n[Entity {}] \"{}\"",
            entity_id,
            entity.name.as_deref().unwrap_or("unnamed")
        );

        // Try to get Transform component
        let transform = self.get_component::<Transform>(entity, "Transform");

        // Check for MeshRenderer
        if let Some(mesh_renderer) = self.get_component::<MeshRenderer>(entity, "MeshRenderer") {
            self.handle_mesh_renderer(entity, &mesh_renderer, transform.as_ref())
                .await?;
        }

        // Check for GeometryAsset
        if let Some(geometry_asset) = self.get_component::<GeometryAsset>(entity, "GeometryAsset") {
            self.handle_geometry_asset(entity, &geometry_asset, transform.as_ref())
                .await?;
        }

        // Check for Instanced
        if let Some(instanced) = self.get_component::<Instanced>(entity, "Instanced") {
            self.handle_instanced(entity, &instanced, transform.as_ref())
                .await?;
        }

        // Check for Terrain
        if let Some(terrain) = self.get_component::<Terrain>(entity, "Terrain") {
            self.handle_terrain(entity, &terrain, transform.as_ref())
                .await?;
        }

        // Check for Light
        if let Some(light) = self.get_component::<LightComponent>(entity, "Light") {
            self.handle_light(&light, transform.as_ref())?;
        }

        // Check for Camera
        if let Some(camera) = self.get_component::<CameraComponent>(entity, "Camera") {
            self.handle_camera(&camera, transform.as_ref()).await?;
        }

        Ok(())
    }

    fn get_component<T: 'static>(&self, entity: &Entity, component_name: &str) -> Option<T>
    where
        T: serde::de::DeserializeOwned,
    {
        entity
            .components
            .get(component_name)
            .and_then(|value| self.component_registry.decode(component_name, value).ok())
            .and_then(|boxed| boxed.downcast::<T>().ok())
            .map(|boxed| *boxed)
    }

    async fn handle_mesh_renderer(
        &mut self,
        entity: &Entity,
        mesh_renderer: &MeshRenderer,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        // Try to get world transform from scene graph (for parent-child hierarchies)
        let effective_transform = if let Some(scene_graph) = &mut self.scene_graph {
            if let Some(world_matrix) = scene_graph.get_world_transform(entity_id) {
                // Decompose world matrix into TRS components
                let (scale, rotation, translation) = world_matrix.to_scale_rotation_translation();

                // Create a Transform with world values
                Some(Transform {
                    position: Some([translation.x, translation.y, translation.z]),
                    rotation: Some(vec![rotation.x, rotation.y, rotation.z, rotation.w]), // Quaternion XYZW
                    scale: Some([scale.x, scale.y, scale.z]),
                })
            } else {
                // Entity not in scene graph, use local transform
                transform.cloned()
            }
        } else {
            // No scene graph, use local transform
            transform.cloned()
        };

        let submeshes = load_mesh_renderer(
            &self.context,
            entity,
            mesh_renderer,
            effective_transform.as_ref(),
            &mut self.material_manager,
        )
        .await?;

        // Handle all submeshes (primitives return 1, GLTF models may return multiple)
        for (idx, (gm, final_scale, base_scale)) in submeshes.into_iter().enumerate() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(mesh_renderer.castShadows);
            self.mesh_receive_shadows.push(mesh_renderer.receiveShadows);

            if let Some(transform) = transform {
                let ts_position =
                    vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
                let converted = threejs_to_threed_position(ts_position);
                log::info!(
                    "    Submesh {} transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
                    idx,
                    ts_position.x,
                    ts_position.y,
                    ts_position.z,
                    converted.x,
                    converted.y,
                    converted.z
                );
            } else {
                log::info!(
                    "    Submesh {} transform: no Transform component, using primitive base scale only",
                    idx
                );
            }

            log::info!(
                "      Shadows → cast: {}, receive: {}, final scale [{:.2}, {:.2}, {:.2}]",
                mesh_renderer.castShadows,
                mesh_renderer.receiveShadows,
                final_scale.x,
                final_scale.y,
                final_scale.z
            );
        }

        Ok(())
    }

    async fn handle_geometry_asset(
        &mut self,
        entity: &Entity,
        geometry_asset: &GeometryAsset,
        transform: Option<&Transform>,
    ) -> Result<()> {
        use crate::renderer::mesh_loader::convert_geometry_meta_to_cpu_mesh;

        log::info!("  GeometryAsset:");
        log::info!("    Path:        {:?}", geometry_asset.path);
        log::info!("    Geometry ID: {:?}", geometry_asset.geometryId);
        log::info!("    Material ID: {:?}", geometry_asset.materialId);
        log::info!("    Enabled:     {}", geometry_asset.enabled);

        if !geometry_asset.enabled {
            log::info!("    Skipping disabled geometry asset");
            return Ok(());
        }

        // 1. Load the geometry metadata from path
        // Resolve path: TypeScript stores paths like "/src/game/geometry/file.shape.json"
        // Geometry files are synced from src/game/geometry/ to rust/game/geometry/ via yarn rust:sync-assets
        // Since we run from rust/engine/, we load from ../game/geometry/
        let resolved_path = if geometry_asset.path.starts_with("/src/game/geometry/") {
            // Extract just the filename from the TypeScript path
            let filename = geometry_asset
                .path
                .strip_prefix("/src/game/geometry/")
                .unwrap_or(&geometry_asset.path);
            PathBuf::from("../game/geometry").join(filename)
        } else if geometry_asset.path.starts_with('/') {
            // Legacy fallback: strip leading slash and use relative path
            let relative_path = geometry_asset
                .path
                .strip_prefix('/')
                .unwrap_or(&geometry_asset.path);
            PathBuf::from("../..").join(relative_path)
        } else {
            PathBuf::from(&geometry_asset.path)
        };

        log::info!("    Resolved path: {}", resolved_path.display());

        let geometry_meta =
            vibe_assets::GeometryMeta::from_file(&resolved_path).with_context(|| {
                format!("Failed to load geometry metadata: {}", geometry_asset.path)
            })?;

        log::info!(
            "    Loaded metadata: {} vertices, {} indices",
            geometry_meta.vertex_count().unwrap_or(0),
            geometry_meta.index_count().unwrap_or(0)
        );

        // 2. Convert to CpuMesh
        let cpu_mesh = convert_geometry_meta_to_cpu_mesh(&geometry_meta)?;

        // 3. Create GPU mesh
        let mut mesh = Mesh::new(&self.context, &cpu_mesh);

        // 4. Get or create material
        let material = if let Some(material_id) = &geometry_asset.materialId {
            if let Some(material_data) = self.material_manager.get_material(material_id) {
                log::info!("    Using material: {}", material_id);
                let material_clone = material_data.clone();
                self.material_manager
                    .create_physical_material(&self.context, &material_clone)
                    .await?
            } else {
                log::warn!("    Material '{}' not found, using default", material_id);
                self.material_manager.create_default_material(&self.context)
            }
        } else {
            log::info!("    Using default material");
            self.material_manager.create_default_material(&self.context)
        };

        // 5. Apply transform
        let (final_scale, base_scale) = if let Some(transform) = transform {
            let converted =
                crate::renderer::transform_utils::convert_transform_to_matrix(transform, None);
            mesh.set_transformation(converted.matrix);

            let ts_position = vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
            let converted_pos = threejs_to_threed_position(ts_position);
            log::info!(
                "    Transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
                ts_position.x,
                ts_position.y,
                ts_position.z,
                converted_pos.x,
                converted_pos.y,
                converted_pos.z
            );

            (converted.final_scale, converted.base_scale)
        } else {
            log::info!("    No Transform component, using identity transform");
            (GlamVec3::ONE, GlamVec3::ONE)
        };

        // 6. Store in parallel arrays
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        self.meshes.push(Gm::new(mesh, material));
        self.mesh_entity_ids.push(entity_id);
        self.mesh_scales.push(final_scale);
        self.mesh_base_scales.push(base_scale);
        self.mesh_cast_shadows.push(geometry_asset.castShadows);
        self.mesh_receive_shadows
            .push(geometry_asset.receiveShadows);

        log::info!(
            "    GeometryAsset loaded → cast shadows: {}, receive shadows: {}, final scale [{:.2}, {:.2}, {:.2}]",
            geometry_asset.castShadows,
            geometry_asset.receiveShadows,
            final_scale.x,
            final_scale.y,
            final_scale.z
        );

        Ok(())
    }

    async fn handle_instanced(
        &mut self,
        entity: &Entity,
        instanced: &Instanced,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let instances = load_instanced(
            &self.context,
            entity,
            instanced,
            transform,
            &mut self.material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
        let instance_count = instances.len();

        // Each instance becomes a separate mesh (three-d doesn't have native GPU instancing)
        for (idx, (gm, final_scale, base_scale)) in instances.into_iter().enumerate() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(instanced.castShadows);
            self.mesh_receive_shadows.push(instanced.receiveShadows);

            if idx < 3 {
                log::info!(
                    "    Instance {}: shadows (cast: {}, recv: {}), scale [{:.2}, {:.2}, {:.2}]",
                    idx,
                    instanced.castShadows,
                    instanced.receiveShadows,
                    final_scale.x,
                    final_scale.y,
                    final_scale.z
                );
            }
        }

        if instance_count > 3 {
            log::info!("    ... and {} more instances added", instance_count - 3);
        }

        Ok(())
    }

    async fn handle_terrain(
        &mut self,
        entity: &Entity,
        terrain: &Terrain,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let meshes = generate_terrain(
            &self.context,
            entity,
            terrain,
            transform,
            &mut self.material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        for (gm, final_scale, base_scale) in meshes.into_iter() {
            self.meshes.push(gm);
            self.mesh_entity_ids.push(entity_id);
            self.mesh_scales.push(final_scale);
            self.mesh_base_scales.push(base_scale);
            self.mesh_cast_shadows.push(true); // Terrains cast shadows by default
            self.mesh_receive_shadows.push(true); // Terrains receive shadows by default

            log::info!(
                "    Terrain mesh added: scale [{:.2}, {:.2}, {:.2}]",
                final_scale.x,
                final_scale.y,
                final_scale.z
            );
        }

        Ok(())
    }

    fn handle_light(
        &mut self,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(loaded_light) = load_light(&self.context, light, transform)? {
            match loaded_light {
                LoadedLight::Directional(light) => self.directional_lights.push(light),
                LoadedLight::Point(light) => self.point_lights.push(light),
                LoadedLight::Spot(light) => self.spot_lights.push(light),
                LoadedLight::Ambient(light) => self.ambient_light = Some(light),
            }
        }
        Ok(())
    }

    async fn handle_camera(
        &mut self,
        camera_component: &CameraComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        if let Some(config) = load_camera(camera_component, transform)? {
            let mut camera = create_camera(&config, self.window_size);
            camera.tone_mapping = parse_tone_mapping(config.tone_mapping.as_deref());
            camera.color_mapping = ColorMapping::ComputeToSrgb;

            let mut skybox_renderer = SkyboxRenderer::new();
            if config.skybox_texture.is_some() {
                if let Err(err) = skybox_renderer
                    .load_from_config(&self.context, &config)
                    .await
                {
                    log::warn!("Failed to load skybox texture: {}", err);
                    skybox_renderer.clear();
                }
            }

            if config.is_main {
                self.camera = camera;
                self.camera_config = Some(config.clone());
                self.skybox_renderer = skybox_renderer;
                self.last_camera_position = config.position;
                self.last_camera_target = config.target;

                log::info!(
                    "    Main camera loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}], clearFlags={:?}, background={:?}",
                    config.position.x,
                    config.position.y,
                    config.position.z,
                    config.target.x,
                    config.target.y,
                    config.target.z,
                    config.clear_flags,
                    config.background_color
                );
            } else {
                self.additional_cameras.push(AdditionalCamera {
                    camera,
                    config: config.clone(),
                    skybox_renderer,
                    last_position: config.position,
                    last_target: config.target,
                });

                log::info!(
                    "    Additional camera (depth {}) loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}]",
                    config.depth,
                    config.position.x,
                    config.position.y,
                    config.position.z,
                    config.target.x,
                    config.target.y,
                    config.target.z
                );
            }
        }
        Ok(())
    }

    fn collect_lights(&self) -> Vec<&dyn Light> {
        let mut lights: Vec<&dyn Light> = Vec::new();

        for light in &self.directional_lights {
            lights.push(light);
        }
        for light in &self.point_lights {
            lights.push(light);
        }
        for light in &self.spot_lights {
            lights.push(light);
        }
        if let Some(ref ambient) = self.ambient_light {
            lights.push(ambient);
        }

        lights
    }

    /// Helper method to render with lights, splitting borrows properly
    fn render_scene_with_lights(
        &self,
        render_target: &RenderTarget,
        camera: &Camera,
        meshes: &[Gm<Mesh, PhysicalMaterial>],
    ) {
        let lights = self.collect_lights();
        render_target.render(camera, meshes, &lights);
    }

    fn generate_shadow_maps(&mut self) {
        // Extract mesh geometries for shadow casting, filtering by castShadows flag
        let geometries: Vec<&dyn Geometry> = self
            .meshes
            .iter()
            .zip(self.mesh_cast_shadows.iter())
            .filter(|(_, &casts_shadow)| casts_shadow)
            .map(|(gm, _)| &gm.geometry as &dyn Geometry)
            .collect();

        if geometries.is_empty() {
            log::debug!("No shadow-casting meshes in scene");
            return;
        }

        log::debug!(
            "Generating shadow maps for {} shadow-casting meshes",
            geometries.len()
        );

        // Generate shadow maps for directional lights that cast shadows
        for light in &mut self.directional_lights {
            if light.cast_shadow {
                light.generate_shadow_map(light.shadow_map_size, geometries.clone());
            }
        }

        // Generate shadow maps for spot lights that cast shadows
        for light in &mut self.spot_lights {
            if light.cast_shadow {
                light.generate_shadow_map(light.shadow_map_size, geometries.clone());
            }
        }
    }

    fn update_mesh_from_physics(&mut self, mesh_idx: usize, body: &rapier3d::dynamics::RigidBody) {
        // Get position and rotation from physics
        let iso = body.position();
        let translation = iso.translation;
        let rotation = iso.rotation;

        // Physics runs in the same coordinate system as the renderer, so we can use
        // the translation directly.
        let position = vec3(translation.x, translation.y, translation.z);

        // Convert nalgebra quaternion to glam quaternion, then to axis-angle
        let glam_quat = glam::Quat::from_xyzw(rotation.i, rotation.j, rotation.k, rotation.w);
        let (axis, angle) = glam_quat.to_axis_angle();
        let axis_3d = vec3(axis.x, axis.y, axis.z);
        let scale = self
            .mesh_scales
            .get(mesh_idx)
            .copied()
            .unwrap_or(GlamVec3::ONE);
        let scale_vec = vec3(scale.x, scale.y, scale.z);

        // Build transformation matrix
        let transform_mat = Mat4::from_translation(position)
            * Mat4::from_axis_angle(axis_3d, radians(angle))
            * Mat4::from_nonuniform_scale(scale_vec.x, scale_vec.y, scale_vec.z);

        // Update mesh transformation
        self.meshes[mesh_idx].set_transformation(transform_mat);
    }

    // ===== Logging Methods =====

    fn log_first_frame(&self) {
        static mut FIRST_FRAME: bool = true;
        unsafe {
            if FIRST_FRAME {
                log::info!("=== FIRST FRAME RENDER ===");
                log::info!("  Meshes: {}", self.meshes.len());
                log::info!("  Directional lights: {}", self.directional_lights.len());
                log::info!("  Point lights: {}", self.point_lights.len());
                log::info!("  Spot lights: {}", self.spot_lights.len());
                log::info!(
                    "  Ambient light: {}",
                    if self.ambient_light.is_some() {
                        "yes"
                    } else {
                        "no"
                    }
                );
                log::info!("  Camera position: {:?}", self.camera.position());
                log::info!("  Camera target: {:?}", self.camera.target());
                log::info!("=========================");
                FIRST_FRAME = false;
            }
        }
    }

    fn log_scene_load_start(&self, scene: &SceneData) {
        log::info!("═══════════════════════════════════════════════════════════");
        log::info!("RUST SCENE LOAD: {}", scene.metadata.name);
        log::info!("═══════════════════════════════════════════════════════════");

        log::info!("Scene Metadata:");
        log::info!("  Name: {}", scene.metadata.name);
        log::info!("  Version: {}", scene.metadata.version);
        if let Some(desc) = &scene.metadata.description {
            log::info!("  Description: {}", desc);
        }
        log::info!("  Total Entities: {}", scene.entities.len());
    }

    fn log_scene_load_summary(&self) {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("SCENE LOAD SUMMARY");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("Meshes:             {}", self.meshes.len());
        log::info!("Directional Lights: {}", self.directional_lights.len());
        log::info!("Point Lights:       {}", self.point_lights.len());
        log::info!("Spot Lights:        {}", self.spot_lights.len());
        log::info!(
            "Ambient Light:      {}",
            if self.ambient_light.is_some() {
                "yes"
            } else {
                "no"
            }
        );
        log::info!("═══════════════════════════════════════════════════════════");
        log::info!("END RUST SCENE LOAD");
        log::info!("═══════════════════════════════════════════════════════════\n");
    }
}

fn parse_tone_mapping(mode: Option<&str>) -> ToneMapping {
    match mode.unwrap_or("aces").to_ascii_lowercase().as_str() {
        "none" | "linear" => ToneMapping::None,
        "reinhard" => ToneMapping::Reinhard,
        "cineon" | "filmic" => ToneMapping::Filmic,
        "aces" => ToneMapping::Aces,
        other => {
            log::warn!("Unknown tone mapping mode '{}', defaulting to ACES", other);
            ToneMapping::Aces
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use three_d::vec3;
    use vibe_ecs_bridge::decoders::ViewportRect;

    fn base_camera_config() -> CameraConfig {
        CameraConfig {
            position: vec3(0.0, 0.0, 0.0),
            target: vec3(0.0, 0.0, -1.0),
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            is_main: false,
            projection_type: "perspective".to_string(),
            orthographic_size: 5.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: None,
            enable_smoothing: false,
            follow_target: None,
            follow_offset: None,
            smoothing_speed: 0.0,
            rotation_smoothing: 0.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        }
    }

    #[test]
    fn screenshot_viewports_match_target_size() {
        let (main_viewport, additional) = ThreeDRenderer::screenshot_viewports((1920, 1080), &[]);

        assert_eq!(main_viewport.x, 0);
        assert_eq!(main_viewport.y, 0);
        assert_eq!(main_viewport.width, 1920);
        assert_eq!(main_viewport.height, 1080);
        assert!(additional.is_empty());
    }

    #[test]
    fn screenshot_viewports_scale_additional_cameras() {
        let mut config = base_camera_config();
        config.viewport_rect = Some(ViewportRect {
            x: 0.5,
            y: 0.25,
            width: 0.5,
            height: 0.5,
        });

        let (_, additional) = ThreeDRenderer::screenshot_viewports((800, 600), &[config]);
        assert_eq!(additional.len(), 1);
        let vp = additional[0];
        assert_eq!(vp.x, 400);
        assert_eq!(vp.y, 150);
        assert_eq!(vp.width, 400);
        assert_eq!(vp.height, 300);
    }
}

#[cfg(test)]
mod follow_tests {
    use super::*;
    use crate::renderer::load_camera;
    use vibe_ecs_bridge::decoders::CameraComponent;

    fn config_with_control(control: Option<&str>) -> CameraConfig {
        let component = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 100.0,
            is_main: true,
            projection_type: "perspective".to_string(),
            orthographic_size: 10.0,
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: control.map(|mode| mode.to_string()),
            enable_smoothing: false,
            follow_target: Some(42),
            follow_offset: None,
            smoothing_speed: 5.0,
            rotation_smoothing: 5.0,
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: 1.0,
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: 1.0,
            skybox_blur: 0.0,
        };

        load_camera(&component, None)
            .expect("load_camera should succeed")
            .expect("CameraConfig expected")
    }

    #[test]
    fn follow_enabled_when_locked() {
        let config = config_with_control(Some("locked"));
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), Some(42));
    }

    #[test]
    fn follow_disabled_when_free() {
        let config = config_with_control(Some("free"));
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), None);
    }

    #[test]
    fn follow_defaults_to_locked_when_unspecified() {
        let config = config_with_control(None);
        assert_eq!(ThreeDRenderer::follow_target_if_locked(&config), Some(42));
    }
}

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
