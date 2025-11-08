use anyhow::{Context as AnyhowContext, Result};
use glam::Vec3 as GlamVec3;
use std::path::PathBuf;
use std::sync::Arc;
use three_d::*;
use winit::window::Window as WinitWindow;

use vibe_ecs_bridge::decoders::{
    CameraComponent, GeometryAsset, Instanced, Light as LightComponent, MeshRenderer, Terrain,
    Transform,
};
use vibe_scene::Scene as SceneData;
use vibe_scene::{Entity, EntityId};

// Re-export MeshRenderState from render coordinator
pub use super::threed_render_coordinator::MeshRenderState;

// Import new modular components
use super::threed_camera_manager::ThreeDCameraManager;
use super::threed_context_state::ThreeDContextState;
use super::threed_light_manager::ThreeDLightManager;
use super::threed_mesh_manager::ThreeDMeshManager;
use super::threed_render_coordinator::ThreeDRenderCoordinator;
use super::threed_scene_loader_state::ThreeDSceneLoaderState;

// Import renderer modules
use crate::renderer::camera_renderer::AdditionalCamera;
use crate::renderer::coordinate_conversion::threejs_to_threed_position;
use crate::renderer::{
    apply_post_processing, create_camera, generate_terrain, load_camera, load_instanced,
    load_light, load_mesh_renderer, CameraConfig, ColorGradingEffect, DebugLineRenderer,
    EnhancedDirectionalLight, EnhancedSpotLight, LODManager, LODSelector, LoadedLight,
    MaterialManager, PostProcessSettings, SkyboxRenderer,
};

/// ThreeDRenderer - Rendering backend using three-d library for PBR rendering
///
/// This renderer now follows Single Responsibility Principle by delegating to specialized modules:
/// - ThreeDContextState: Window, context, and resource management
/// - ThreeDMeshManager: Mesh storage, entity tracking, BVH integration
/// - ThreeDLightManager: Light storage and management
/// - ThreeDCameraManager: Camera state and follow system
/// - ThreeDSceneLoaderState: Scene graph and prefab management
/// - ThreeDRenderCoordinator: Render loop orchestration
pub struct ThreeDRenderer {
    /// Core context and resource management
    context_state: ThreeDContextState,

    /// Mesh management and BVH integration
    mesh_manager: ThreeDMeshManager,

    /// Light management
    light_manager: ThreeDLightManager,

    /// Camera management and follow system
    camera_manager: ThreeDCameraManager,

    /// Scene loading state
    scene_loader_state: ThreeDSceneLoaderState,
}

impl ThreeDRenderer {
    /// Initialize the three-d renderer from a winit window
    pub fn new(window: Arc<WinitWindow>) -> Result<Self> {
        let size = window.inner_size();
        let context_state = ThreeDContextState::new(window)?;
        let mesh_manager = ThreeDMeshManager::new();
        let light_manager = ThreeDLightManager::new();
        let camera_manager = ThreeDCameraManager::new((size.width, size.height));
        let scene_loader_state = ThreeDSceneLoaderState::new();

        Ok(Self {
            context_state,
            mesh_manager,
            light_manager,
            camera_manager,
            scene_loader_state,
        })
    }

    /// Create a simple test scene with primitives
    pub fn create_test_scene(&mut self) -> Result<()> {
        log::info!("Creating test scene with primitives...");

        // Create a simple cube mesh
        let cpu_mesh = CpuMesh::cube();
        let mesh = Mesh::new(self.context_state.context(), &cpu_mesh);

        // Create PBR material
        let material = PhysicalMaterial::new(
            self.context_state.context(),
            &CpuMaterial {
                albedo: Srgba::new(200, 100, 100, 255),
                metallic: 0.3,
                roughness: 0.7,
                ..Default::default()
            },
        );

        // Combine mesh and material
        let cube = Gm::new(mesh, material);
        self.mesh_manager.add_mesh(
            cube,
            EntityId::new(0),
            GlamVec3::ONE,
            GlamVec3::ONE,
            true, // cast shadows
            true, // receive shadows
        );

        // Add test lights
        self.light_manager
            .create_test_lights(self.context_state.context());

        log::info!("  Added cube with PBR material");

        Ok(())
    }

    /// Render a frame
    pub fn render(
        &mut self,
        delta_time: f32,
        debug_mode: bool,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        render_state: Option<&MeshRenderState>,
    ) -> Result<()> {
        crate::renderer::scene_utilities::log_first_frame(
            self.mesh_manager.mesh_count(),
            self.light_manager.directional_lights().len(),
            self.light_manager.point_lights().len(),
            self.light_manager.spot_lights().len(),
            self.light_manager.has_ambient_light(),
            self.camera_manager.camera().position(),
            self.camera_manager.camera().target(),
        );

        // Update camera (follow system, etc.)
        self.camera_manager
            .update_camera_follow(self.scene_loader_state.scene_graph_mut(), delta_time);

        // Update BVH system for culling
        self.mesh_manager
            .update_bvh(delta_time)
            .context("Failed to update BVH system")?;

        // Generate shadow maps for lights that cast shadows
        self.mesh_manager
            .generate_shadow_maps(&mut self.light_manager);

        // Render all cameras using coordinator
        {
            // Extract values without borrowing to avoid borrow checker issues
            let (context, window_size) = self.context_state.context_and_window_size_copy();

            // Then call render_cameras with the extracted values
            ThreeDRenderCoordinator::render_cameras(
                &context,
                window_size,
                &mut self.camera_manager,
                &mut self.mesh_manager,
                &mut self.light_manager,
                &mut self.context_state,
                render_state,
                debug_mode,
            )?;
        }

        // Render debug overlay if debug mode is enabled
        if debug_mode {
            let screen = RenderTarget::screen(
                self.context_state.context(),
                self.context_state.window_size().0,
                self.context_state.window_size().1,
            );
            ThreeDRenderCoordinator::render_debug_overlay(
                self.context_state.debug_line_renderer(),
                self.camera_manager.camera(),
                &screen,
                physics_world,
            )?;
        }

        self.context_state.swap_buffers()?;

        Ok(())
    }

    /// Capture a screenshot by rendering to a texture and saving it
    pub fn render_to_screenshot(
        &mut self,
        path: &std::path::Path,
        physics_world: Option<&vibe_physics::PhysicsWorld>,
        render_state: Option<&MeshRenderState>,
        scale: f32,
        quality: u8,
    ) -> Result<()> {
        // Generate shadow maps first (required for proper rendering)
        self.mesh_manager
            .generate_shadow_maps(&mut self.light_manager);

        // Preserve current camera viewports so we can restore them after the capture
        let original_main_viewport = self.camera_manager.camera().viewport();
        let original_additional_viewports: Vec<_> = self
            .camera_manager
            .additional_cameras()
            .iter()
            .map(|cam| cam.camera.viewport())
            .collect();

        // Calculate screenshot viewports
        let window_size = self.context_state.window_size();
        let width = ((window_size.0 as f32) * scale).max(1.0) as u32;
        let height = ((window_size.1 as f32) * scale).max(1.0) as u32;
        let additional_configs: Vec<_> = self
            .camera_manager
            .additional_cameras()
            .iter()
            .map(|cam| cam.config.clone())
            .collect();
        let (screenshot_main_viewport, screenshot_additional_viewports) =
            crate::util::calculate_screenshot_viewports((width, height), &additional_configs);

        // Adjust viewports to match the offscreen render target
        self.camera_manager
            .camera_mut()
            .set_viewport(screenshot_main_viewport);
        for (cam, viewport) in self
            .camera_manager
            .additional_cameras_mut()
            .iter_mut()
            .zip(screenshot_additional_viewports.iter())
        {
            cam.camera.set_viewport(*viewport);
        }

        // Collect data for screenshot rendering
        let context = self.context_state.context();
        let lights = self.light_manager.collect_lights(context);
        // Use camera frustum culling for screenshots as well for consistency
        let visible_indices = self
            .mesh_manager
            .get_visible_mesh_indices_with_camera(
                self.camera_manager.camera(),
                render_state.map(|s| &s.visibility),
                false,
            );
        let visible_meshes: Vec<_> = visible_indices
            .iter()
            .filter_map(|&idx| self.mesh_manager.meshes().get(idx))
            .collect();

        // Delegate to screenshot module
        let result = crate::util::render_to_screenshot(
            self.context_state.context(),
            self.camera_manager.camera(),
            &[], // TODO: Support additional cameras in screenshot
            self.camera_manager.camera_config(),
            self.context_state.skybox_renderer(),
            &visible_meshes,
            &lights,
            render_state,
            window_size,
            path,
            scale,
            quality,
            physics_world,
            Some(self.context_state.debug_line_renderer()),
        );

        // Restore original viewports
        self.camera_manager
            .camera_mut()
            .set_viewport(original_main_viewport);
        for (cam, viewport) in self
            .camera_manager
            .additional_cameras_mut()
            .iter_mut()
            .zip(original_additional_viewports.into_iter())
        {
            cam.camera.set_viewport(viewport);
        }

        result
    }

    /// Update camera position and target
    pub fn update_camera(&mut self, position: glam::Vec3, target: glam::Vec3) {
        self.camera_manager.update_camera(position, target);
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        self.context_state.resize(width, height);
        self.camera_manager.resize(self.context_state.window_size());
    }

    /// Load a full scene from SceneData
    /// Now async to support texture loading!
    pub async fn load_scene(&mut self, scene: &SceneData) -> Result<()> {
        crate::renderer::scene_utilities::log_scene_load_start(scene);
        self.clear_scene();

        // Build scene graph for transform hierarchy and camera follow
        self.scene_loader_state.build_scene_graph(scene)?;

        // Load materials
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("MATERIALS");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if !scene.materials.is_empty() {
            let materials_value = serde_json::Value::Array(scene.materials.clone());
            self.context_state.load_materials(&materials_value);
        } else {
            log::warn!("No materials found in scene");
        }

        // Process prefab definitions and instances
        let prefab_instances = self
            .scene_loader_state
            .process_prefabs(scene, self.context_state.component_registry())?;

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

        crate::renderer::scene_utilities::log_scene_load_summary(
            self.mesh_manager.mesh_count(),
            self.light_manager.directional_lights().len(),
            self.light_manager.point_lights().len(),
            self.light_manager.spot_lights().len(),
            self.light_manager.has_ambient_light(),
        );

        Ok(())
    }

    /// Sync newly created entities to renderer
    /// This is called after SceneManager applies entity commands to add runtime-created entities to the renderer
    pub async fn sync_new_entities(&mut self, scene: &SceneData) -> Result<()> {
        let new_entities = crate::renderer::scene_loader::filter_new_entities(
            &scene.entities,
            self.mesh_manager.loaded_entity_ids(),
        );

        for entity in new_entities {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
            log::info!(
                "Syncing new entity {} ({})",
                entity_id,
                entity.name.as_deref().unwrap_or("unnamed")
            );

            // Load the new entity (handles all component types)
            // Note: load_entity() automatically adds entity_id to loaded_entity_ids
            self.load_entity(entity).await?;
        }

        log::debug!(
            "sync_new_entities: complete, loaded {} total entities",
            self.mesh_manager.loaded_entity_ids().len()
        );
        Ok(())
    }

    /// Sync physics transforms back to renderer meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        self.mesh_manager.sync_physics_transforms(physics_world);
    }

    /// Sync script transforms back to renderer meshes
    pub fn sync_script_transforms(&mut self, script_system: &vibe_scripting::ScriptSystem) {
        self.mesh_manager.sync_script_transforms(script_system);
    }

    /// Update entity material from script mutation (e.g., material:setColor())
    ///
    /// Updates the material properties for all meshes belonging to the given entity
    pub fn update_entity_material(
        &mut self,
        entity_id: vibe_scene::EntityId,
        data: &serde_json::Value,
    ) {
        self.mesh_manager.update_entity_material(entity_id, data);
    }

    // ===== Private Helper Methods =====

    fn clear_scene(&mut self) {
        // Clear using module methods (simpler and more SRP-compliant)
        self.mesh_manager.clear();
        self.light_manager.clear();
        self.camera_manager.clear_additional_cameras();
        self.scene_loader_state.clear_scene_graph();
        self.context_state.skybox_renderer_mut().clear();
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

        // Check for LOD component
        let lod_component = self.get_component::<vibe_ecs_bridge::LODComponent>(entity, "LOD");

        // Check for MeshRenderer
        if let Some(mesh_renderer) = self.get_component::<MeshRenderer>(entity, "MeshRenderer") {
            self.handle_mesh_renderer(
                entity,
                &mesh_renderer,
                transform.as_ref(),
                lod_component.as_ref(),
            )
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

        // Mark entity as loaded to prevent duplicate loading
        self.mesh_manager.mark_entity_loaded(entity_id);

        Ok(())
    }

    fn get_component<T: 'static>(&self, entity: &Entity, component_name: &str) -> Option<T>
    where
        T: serde::de::DeserializeOwned,
    {
        entity
            .components
            .get(component_name)
            .and_then(|value| {
                self.context_state
                    .component_registry()
                    .decode(component_name, value)
                    .ok()
            })
            .and_then(|boxed| boxed.downcast::<T>().ok())
            .map(|boxed| *boxed)
    }

    async fn handle_mesh_renderer(
        &mut self,
        entity: &Entity,
        mesh_renderer: &MeshRenderer,
        transform: Option<&Transform>,
        lod_component: Option<&vibe_ecs_bridge::LODComponent>,
    ) -> Result<()> {
        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        // Get effective transform (world transform if in scene graph, else local)
        let effective_transform = crate::renderer::entity_loader::get_effective_transform(
            entity_id,
            transform,
            self.scene_loader_state.scene_graph_mut(),
        );

        // Get camera position for LOD distance calculations
        let camera_pos = self.camera_manager.camera_position_glam();

        // Extract needed values from context_state to avoid multiple borrows
        let (context, lod_manager, material_manager) =
            self.context_state.context_lod_and_material_manager_mut();

        let submeshes = crate::renderer::entity_loader::handle_mesh_renderer(
            context,
            entity,
            mesh_renderer,
            effective_transform.as_ref(),
            transform,
            lod_component,
            material_manager,
            lod_manager,
            camera_pos,
        )
        .await?;

        // Handle all submeshes (primitives return 1, GLTF models may return multiple)
        for (gm, final_scale, base_scale) in submeshes.into_iter() {
            self.mesh_manager.add_mesh(
                gm,
                entity_id,
                final_scale,
                base_scale,
                mesh_renderer.cast_shadows,
                mesh_renderer.receive_shadows,
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
        // Extract needed values from context_state to avoid multiple borrows
        let (context, material_manager) = self.context_state.context_and_material_manager_mut();

        // Delegate to entity_loader module
        let result = crate::renderer::entity_loader::handle_geometry_asset(
            context,
            entity,
            geometry_asset,
            transform,
            material_manager,
        )
        .await;

        // Only store if successful
        if let Ok((gm, final_scale, base_scale)) = result {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
            self.mesh_manager.add_mesh(
                gm,
                entity_id,
                final_scale,
                base_scale,
                geometry_asset.cast_shadows,
                geometry_asset.receive_shadows,
            );
        }

        Ok(())
    }

    async fn handle_instanced(
        &mut self,
        entity: &Entity,
        instanced: &Instanced,
        transform: Option<&Transform>,
    ) -> Result<()> {
        // Extract needed values from context_state to avoid multiple borrows
        let (context, material_manager) = self.context_state.context_and_material_manager_mut();

        let instances = crate::renderer::entity_loader::handle_instanced(
            context,
            entity,
            instanced,
            transform,
            material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        // Each instance becomes a separate mesh (three-d doesn't have native GPU instancing)
        for (gm, final_scale, base_scale) in instances.into_iter() {
            self.mesh_manager.add_mesh(
                gm,
                entity_id,
                final_scale,
                base_scale,
                instanced.cast_shadows,
                instanced.receive_shadows,
            );
        }

        Ok(())
    }

    async fn handle_terrain(
        &mut self,
        entity: &Entity,
        terrain: &Terrain,
        transform: Option<&Transform>,
    ) -> Result<()> {
        // Extract needed values from context_state to avoid multiple borrows
        let (context, material_manager) = self.context_state.context_and_material_manager_mut();

        let meshes = crate::renderer::entity_loader::handle_terrain(
            context,
            entity,
            terrain,
            transform,
            material_manager,
        )
        .await?;

        let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));

        for (gm, final_scale, base_scale) in meshes.into_iter() {
            self.mesh_manager.add_mesh(
                gm,
                entity_id,
                final_scale,
                base_scale,
                true, // Terrains cast shadows by default
                true, // Terrains receive shadows by default
            );
        }

        Ok(())
    }

    fn handle_light(
        &mut self,
        light: &LightComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let context = self.context_state.context();

        if let Some(loaded_light) =
            crate::renderer::entity_loader::handle_light(context, light, transform)?
        {
            match loaded_light {
                LoadedLight::Directional(light) => self.light_manager.add_directional_light(light),
                LoadedLight::Point(light) => self.light_manager.add_point_light(light),
                LoadedLight::Spot(light) => self.light_manager.add_spot_light(light),
                LoadedLight::Ambient { light, metadata } => {
                    self.light_manager.add_ambient_light(light, metadata);
                }
            }
        }
        Ok(())
    }

    async fn handle_camera(
        &mut self,
        camera_component: &CameraComponent,
        transform: Option<&Transform>,
    ) -> Result<()> {
        let context = self.context_state.context();
        let window_size = self.context_state.window_size();

        if let Some(result) = crate::renderer::entity_loader::handle_camera(
            context,
            camera_component,
            transform,
            window_size,
        )
        .await?
        {
            if result.config.is_main {
                *self.camera_manager.camera_mut() = result.camera;
                self.camera_manager.set_camera_config(result.config.clone());
                *self.context_state.skybox_renderer_mut() = result.skybox_renderer;
            } else {
                self.camera_manager.add_additional_camera(AdditionalCamera {
                    camera: result.camera,
                    config: result.config.clone(),
                    skybox_renderer: result.skybox_renderer,
                    last_position: result.config.position,
                    last_target: result.config.target,
                });
            }
        }
        Ok(())
    }

    // ========================================================================
    // LOD Management API
    // ========================================================================

    /// Get reference to LOD manager for configuration
    pub fn lod_manager(&self) -> &Arc<LODManager> {
        self.context_state.lod_manager()
    }

    /// Set global LOD quality (disables auto-switch)
    pub fn set_lod_quality(&self, quality: crate::renderer::LODQuality) {
        self.context_state.lod_manager().set_quality(quality);
        log::info!("LOD quality set to: {:?}", quality);
    }

    /// Enable/disable automatic distance-based LOD switching
    pub fn set_lod_auto_switch(&self, enabled: bool) {
        self.context_state.lod_manager().set_auto_switch(enabled);
        log::info!(
            "LOD auto-switch: {}",
            if enabled { "enabled" } else { "disabled" }
        );
    }

    /// Set distance thresholds for LOD switching
    pub fn set_lod_distance_thresholds(&self, high: f32, low: f32) {
        self.context_state
            .lod_manager()
            .set_distance_thresholds(high, low);
        log::info!("LOD thresholds set to: high={}, low={}", high, low);
    }

    /// Get current LOD configuration
    pub fn get_lod_config(&self) -> crate::renderer::LODConfig {
        self.context_state.lod_manager().get_config()
    }
}

#[cfg(test)]
#[path = "threed_renderer_test.rs"]
mod threed_renderer_test;
