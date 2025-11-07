use anyhow::Result;
use std::collections::HashMap;
use three_d::*;
use vibe_scene::EntityId;

use crate::renderer::camera_renderer::{CameraEntry, CameraVariant};
use crate::renderer::{CameraConfig, ColorGradingEffect};

/// Mesh rendering state extracted from scene (visibility, shadows, etc.)
/// This allows passing rendering state without holding a borrow on the full scene.
#[derive(Debug, Clone, Default)]
pub struct MeshRenderState {
    /// Map of entity ID to visibility state (MeshRenderer.enabled)
    pub visibility: HashMap<EntityId, bool>,
}

impl MeshRenderState {
    /// Extract mesh rendering state from scene
    pub fn from_scene(scene: &vibe_scene::Scene) -> Self {
        let mut visibility = HashMap::new();

        for entity in &scene.entities {
            if let Some(entity_id) = entity.entity_id() {
                // Check MeshRenderer.enabled field
                if let Some(mesh_renderer_value) = entity.components.get("MeshRenderer") {
                    if let Ok(mesh_renderer) =
                        serde_json::from_value::<serde_json::Value>(mesh_renderer_value.clone())
                    {
                        if let Some(enabled) =
                            mesh_renderer.get("enabled").and_then(|v| v.as_bool())
                        {
                            visibility.insert(entity_id, enabled);
                        }
                    }
                }
            }
        }

        Self { visibility }
    }
}

/// Coordinates the rendering loop including camera sorting, post-processing, and debug rendering
///
/// Responsibilities:
/// - Render loop orchestration
/// - Multi-camera depth sorting and rendering
/// - Post-processing coordination
/// - Debug overlay rendering
/// - Screenshot capture coordination
pub struct ThreeDRenderCoordinator;

impl ThreeDRenderCoordinator {
    /// Helper function to collect lights and filter visible meshes
    /// Extracts common pattern used in both post-processing and direct rendering paths
    fn collect_lights_and_filter_meshes<'a>(
        meshes: &'a [Gm<Mesh, PhysicalMaterial>],
        mesh_entity_ids: &[EntityId],
        directional_lights: &'a [crate::renderer::EnhancedDirectionalLight],
        point_lights: &'a [PointLight],
        spot_lights: &'a [crate::renderer::EnhancedSpotLight],
        ambient_light: &'a Option<AmbientLight>,
        render_state: Option<&MeshRenderState>,
    ) -> (Vec<&'a dyn Light>, Vec<&'a Gm<Mesh, PhysicalMaterial>>) {
        let lights = crate::renderer::lighting::collect_lights(
            directional_lights,
            point_lights,
            spot_lights,
            ambient_light,
        );

        // Extract visible mesh indices
        let visible_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
            meshes.len(),
            mesh_entity_ids,
            render_state.map(|s| &s.visibility),
        );

        let visible_meshes: Vec<_> = visible_indices
            .iter()
            .filter_map(|&idx| meshes.get(idx))
            .collect();

        (lights, visible_meshes)
    }

    /// Render all cameras in depth order
    pub fn render_cameras(
        context: &Context,
        window_size: (u32, u32),
        camera_manager: &mut super::threed_camera_manager::ThreeDCameraManager,
        mesh_manager: &super::threed_mesh_manager::ThreeDMeshManager,
        light_manager: &super::threed_light_manager::ThreeDLightManager,
        context_state: &mut super::threed_context_state::ThreeDContextState,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        // Build camera entries sorted by depth
        let mut camera_entries = Vec::new();
        if let Some(ref config) = camera_manager.camera_config() {
            camera_entries.push(CameraEntry {
                depth: config.depth,
                variant: CameraVariant::Main,
            });
        }
        for (idx, cam) in camera_manager.additional_cameras().iter().enumerate() {
            camera_entries.push(CameraEntry {
                depth: cam.config.depth,
                variant: CameraVariant::Additional(idx),
            });
        }
        camera_entries.sort_by(|a, b| a.depth.cmp(&b.depth));

        let screen = RenderTarget::screen(context, window_size.0, window_size.1);

        // Process each camera
        for entry in camera_entries {
            match entry.variant {
                CameraVariant::Main => {
                    let config = match camera_manager.camera_config() {
                        Some(c) => c.clone(),
                        None => continue,
                    };

                    // Extract all needed data from managers before any mutable borrows
                    let skybox_loaded = context_state.skybox_renderer().is_loaded();
                    let meshes = mesh_manager.meshes();
                    let mesh_entity_ids = mesh_manager.mesh_entity_ids();
                    let directional_lights = light_manager.directional_lights();
                    let point_lights = light_manager.point_lights();
                    let spot_lights = light_manager.spot_lights();
                    let ambient_light = light_manager.ambient_light_ref();

                    Self::render_single_camera_with_state(
                        context,
                        &screen,
                        camera_manager.camera_mut(),
                        &config,
                        context_state,
                        skybox_loaded,
                        meshes,
                        mesh_entity_ids,
                        directional_lights,
                        point_lights,
                        spot_lights,
                        ambient_light,
                        render_state,
                    )?;
                }
                CameraVariant::Additional(index) => {
                    if index >= camera_manager.additional_cameras().len() {
                        continue;
                    }

                    // Clone config and get skybox info before mutably borrowing
                    let (config, skybox_loaded) = {
                        let cam = &camera_manager.additional_cameras()[index];
                        (cam.config.clone(), cam.skybox_renderer.is_loaded())
                    };

                    let meshes = mesh_manager.meshes();
                    let mesh_entity_ids = mesh_manager.mesh_entity_ids();
                    let directional_lights = light_manager.directional_lights();
                    let point_lights = light_manager.point_lights();
                    let spot_lights = light_manager.spot_lights();
                    let ambient_light = light_manager.ambient_light_ref();

                    // Get mutable HDR textures before other mutable borrows
                    let (hdr_color, hdr_depth) = context_state.hdr_textures_mut();

                    // Now we can mutably borrow
                    let additional_cameras = camera_manager.additional_cameras_mut();
                    let cam = &mut additional_cameras[index];

                    Self::render_single_camera(
                        context,
                        &screen,
                        &mut cam.camera,
                        &config,
                        &cam.skybox_renderer,
                        meshes,
                        mesh_entity_ids,
                        directional_lights,
                        point_lights,
                        spot_lights,
                        ambient_light,
                        hdr_color,
                        hdr_depth,
                        render_state,
                    )?;
                }
            }
        }

        Ok(())
    }

    /// Render a single camera with context_state (for main camera)
    fn render_single_camera_with_state(
        context: &Context,
        screen: &RenderTarget,
        camera: &mut Camera,
        config: &CameraConfig,
        context_state: &mut super::threed_context_state::ThreeDContextState,
        _skybox_loaded: bool,
        meshes: &[Gm<Mesh, PhysicalMaterial>],
        mesh_entity_ids: &[EntityId],
        directional_lights: &[crate::renderer::EnhancedDirectionalLight],
        point_lights: &[PointLight],
        spot_lights: &[crate::renderer::EnhancedSpotLight],
        ambient_light: &Option<AmbientLight>,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        let (skybox_renderer, hdr_color, hdr_depth) = context_state.skybox_and_hdr_textures_mut();

        Self::render_single_camera(
            context,
            screen,
            camera,
            config,
            skybox_renderer,
            meshes,
            mesh_entity_ids,
            directional_lights,
            point_lights,
            spot_lights,
            ambient_light,
            hdr_color,
            hdr_depth,
            render_state,
        )
    }

    /// Render a single camera (main or additional)
    fn render_single_camera(
        context: &Context,
        screen: &RenderTarget,
        camera: &mut Camera,
        config: &CameraConfig,
        skybox_renderer: &crate::renderer::SkyboxRenderer,
        meshes: &[Gm<Mesh, PhysicalMaterial>],
        mesh_entity_ids: &[EntityId],
        directional_lights: &[crate::renderer::EnhancedDirectionalLight],
        point_lights: &[PointLight],
        spot_lights: &[crate::renderer::EnhancedSpotLight],
        ambient_light: &Option<AmbientLight>,
        hdr_color_texture: &mut Option<Texture2D>,
        hdr_depth_texture: &mut Option<three_d::DepthTexture2D>,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        let scissor: ScissorBox = camera.viewport().into();
        let settings = crate::renderer::render_settings::prepare_render_settings_for(
            config,
            skybox_renderer.is_loaded(),
        );

        let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;
        if let Some(ref post_settings) = settings.post_settings {
            if post_settings.apply_tone_mapping {
                tone_restore = Some((camera.tone_mapping, camera.color_mapping));
                camera.disable_tone_and_color_mapping();
            }
        }

        if let Some(post_settings) = settings.post_settings.clone() {
            // Ensure HDR textures exist
            if let Some(new_texture) = crate::renderer::post_process_targets::ensure_color_texture(
                context,
                hdr_color_texture.as_ref(),
                (camera.viewport().width, camera.viewport().height),
            ) {
                *hdr_color_texture = Some(new_texture);
            }
            if let Some(new_texture) = crate::renderer::post_process_targets::ensure_depth_texture(
                context,
                hdr_depth_texture.as_ref(),
                (camera.viewport().width, camera.viewport().height),
            ) {
                *hdr_depth_texture = Some(new_texture);
            }

            // Collect lights and filter visible meshes using helper function
            let (lights, visible_meshes) = Self::collect_lights_and_filter_meshes(
                meshes,
                mesh_entity_ids,
                directional_lights,
                point_lights,
                spot_lights,
                ambient_light,
                render_state,
            );

            {
                let render_target = {
                    let color_target = hdr_color_texture
                        .as_mut()
                        .ok_or_else(|| anyhow::anyhow!("HDR color texture not initialized"))?
                        .as_color_target(None);
                    let depth_target = hdr_depth_texture
                        .as_mut()
                        .ok_or_else(|| anyhow::anyhow!("HDR depth texture not initialized"))?
                        .as_depth_target();
                    RenderTarget::new(color_target, depth_target)
                };

                if let Some(clear_state) = settings.clear_state {
                    render_target.clear_partially(scissor, clear_state);
                }

                if settings.render_skybox {
                    skybox_renderer.render(&render_target, camera);
                }

                // visible_meshes already collected by helper function
                render_target.render(camera, &visible_meshes, &lights);
            }

            let color_texture = three_d::ColorTexture::Single(
                hdr_color_texture
                    .as_ref()
                    .ok_or_else(|| anyhow::anyhow!("HDR color texture not initialized"))?
            );
            let effect = ColorGradingEffect::from(post_settings);
            crate::renderer::apply_post_processing(screen, effect, camera, color_texture, scissor);
        } else {
            if let Some(clear_state) = settings.clear_state {
                screen.clear_partially(scissor, clear_state);
            }

            if settings.render_skybox {
                skybox_renderer.render(screen, camera);
            }

            // Use the same helper function to avoid DRY violation
            let (lights, visible_meshes) = Self::collect_lights_and_filter_meshes(
                meshes,
                mesh_entity_ids,
                directional_lights,
                point_lights,
                spot_lights,
                ambient_light,
                render_state,
            );
            screen.render(camera, &visible_meshes, &lights);
        }

        if let Some((tone, color)) = tone_restore {
            camera.tone_mapping = tone;
            camera.color_mapping = color;
        }

        Ok(())
    }

    /// Render debug overlay (grid, colliders, etc.)
    pub fn render_debug_overlay(
        debug_line_renderer: &crate::renderer::DebugLineRenderer,
        camera: &Camera,
        target: &RenderTarget,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
    ) -> Result<()> {
        crate::renderer::debug_rendering::render_debug_overlay(
            debug_line_renderer,
            camera,
            target,
            physics_world,
        )
    }
}
