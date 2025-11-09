use anyhow::{Context, Result};
use glam::Vec3 as GlamVec3;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use three_d::*;
use vibe_scene::EntityId;

use crate::renderer::EnhancedDirectionalLight;
use crate::renderer::EnhancedSpotLight;

/// Manages all mesh-related state for the renderer
///
/// Responsibilities:
/// - Mesh storage and retrieval
/// - Entity ID tracking (parallel array pattern)
/// - Scale management (final and base scales)
/// - Shadow flags (cast/receive)
/// - BVH integration for culling and raycasting
/// - Loaded entity tracking to prevent duplicates
pub struct ThreeDMeshManager {
    /// All meshes in the scene
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,

    /// Parallel array: entity ID for each mesh
    mesh_entity_ids: Vec<EntityId>,

    /// Parallel array: final local scale per mesh
    mesh_scales: Vec<GlamVec3>,

    /// Parallel array: primitive/base scale per mesh
    mesh_base_scales: Vec<GlamVec3>,

    /// Parallel array: cast_shadows flag for each mesh
    mesh_cast_shadows: Vec<bool>,

    /// Parallel array: receive_shadows flag for each mesh
    mesh_receive_shadows: Vec<bool>,

    /// Track all loaded entities to prevent duplicates
    loaded_entity_ids: HashSet<EntityId>,

    /// BVH System for visibility culling and raycasting
    bvh_manager: Option<Arc<std::sync::Mutex<crate::spatial::bvh_manager::BvhManager>>>,
    visibility_culler: Option<crate::renderer::visibility::VisibilityCuller>,
    bvh_debug_logger: Option<crate::renderer::bvh_debug::BvhDebugLogger>,
    /// Previous visible mesh indices for change detection
    previous_visible_indices: std::collections::HashSet<usize>,
}

impl ThreeDMeshManager {
    pub fn new() -> Self {
        Self {
            meshes: Vec::new(),
            mesh_entity_ids: Vec::new(),
            mesh_scales: Vec::new(),
            mesh_base_scales: Vec::new(),
            mesh_cast_shadows: Vec::new(),
            mesh_receive_shadows: Vec::new(),
            loaded_entity_ids: HashSet::new(),
            bvh_manager: None,
            visibility_culler: None,
            bvh_debug_logger: Some(crate::renderer::bvh_debug::BvhDebugLogger::new(5.0)),
            previous_visible_indices: std::collections::HashSet::new(),
        }
    }

    /// Add a mesh with associated metadata
    pub fn add_mesh(
        &mut self,
        mesh: Gm<Mesh, PhysicalMaterial>,
        entity_id: EntityId,
        final_scale: GlamVec3,
        base_scale: GlamVec3,
        cast_shadows: bool,
        receive_shadows: bool,
    ) -> usize {
        let mesh_idx = self.meshes.len();
        self.meshes.push(mesh);
        self.mesh_entity_ids.push(entity_id);
        self.mesh_scales.push(final_scale);
        self.mesh_base_scales.push(base_scale);
        self.mesh_cast_shadows.push(cast_shadows);
        self.mesh_receive_shadows.push(receive_shadows);

        // Register mesh with BVH system for culling and raycasting
        self.ensure_bvh_initialized();
        if let (Some(ref bvh_manager), Some(mesh)) = (&self.bvh_manager, self.meshes.get(mesh_idx))
        {
            crate::renderer::bvh_integration::register_mesh_with_bvh(
                bvh_manager,
                mesh,
                entity_id,
                mesh_idx,
            );
        }

        mesh_idx
    }

    /// Clear all meshes and reset state
    pub fn clear(&mut self) {
        self.meshes.clear();
        self.mesh_entity_ids.clear();
        self.mesh_scales.clear();
        self.mesh_base_scales.clear();
        self.mesh_cast_shadows.clear();
        self.mesh_receive_shadows.clear();
        self.loaded_entity_ids.clear();
        self.previous_visible_indices.clear();
    }

    /// Get reference to all meshes
    pub fn meshes(&self) -> &[Gm<Mesh, PhysicalMaterial>] {
        &self.meshes
    }

    /// Get mutable reference to all meshes
    pub fn meshes_mut(&mut self) -> &mut Vec<Gm<Mesh, PhysicalMaterial>> {
        &mut self.meshes
    }

    /// Get entity IDs for all meshes
    pub fn mesh_entity_ids(&self) -> &[EntityId] {
        &self.mesh_entity_ids
    }

    /// Get scales for all meshes
    pub fn mesh_scales(&self) -> &[GlamVec3] {
        &self.mesh_scales
    }

    /// Get mutable scales for all meshes
    pub fn mesh_scales_mut(&mut self) -> &mut Vec<GlamVec3> {
        &mut self.mesh_scales
    }

    /// Get base scales for all meshes
    pub fn mesh_base_scales(&self) -> &[GlamVec3] {
        &self.mesh_base_scales
    }

    /// Get mutable base scales for all meshes
    pub fn mesh_base_scales_mut(&mut self) -> &mut Vec<GlamVec3> {
        &mut self.mesh_base_scales
    }

    /// Get shadow cast flags for all meshes
    pub fn mesh_cast_shadows(&self) -> &[bool] {
        &self.mesh_cast_shadows
    }

    /// Get shadow receive flags for all meshes
    pub fn mesh_receive_shadows(&self) -> &[bool] {
        &self.mesh_receive_shadows
    }

    /// Check if an entity has already been loaded
    pub fn is_entity_loaded(&self, entity_id: EntityId) -> bool {
        self.loaded_entity_ids.contains(&entity_id)
    }

    /// Mark an entity as loaded
    pub fn mark_entity_loaded(&mut self, entity_id: EntityId) {
        self.loaded_entity_ids.insert(entity_id);
    }

    /// Get loaded entity IDs
    pub fn loaded_entity_ids(&self) -> &HashSet<EntityId> {
        &self.loaded_entity_ids
    }

    /// Get mesh count
    pub fn mesh_count(&self) -> usize {
        self.meshes.len()
    }

    /// Ensure BVH system is initialized
    fn ensure_bvh_initialized(&mut self) {
        if self.bvh_manager.is_none() {
            let (bvh_manager, visibility_culler) =
                crate::renderer::bvh_integration::initialize_bvh_system();
            self.bvh_manager = Some(bvh_manager);
            self.visibility_culler = Some(visibility_culler);
        }
    }

    /// Update BVH system for culling
    pub fn update_bvh(&mut self, delta_time: f32) -> Result<()> {
        self.ensure_bvh_initialized();

        // Update BVH transforms with current mesh positions
        crate::renderer::bvh_integration::update_bvh_transforms(
            &self.bvh_manager,
            &self.meshes,
            &self.mesh_entity_ids,
        );

        // Update BVH debug logging
        if let (Some(bvh_manager), Some(ref mut debug_logger)) =
            (&self.bvh_manager, &mut self.bvh_debug_logger)
        {
            let manager = bvh_manager
                .lock()
                .map_err(|_| anyhow::anyhow!("BVH manager mutex poisoned"))?;
            debug_logger.update(delta_time, &manager);
        }

        Ok(())
    }

    /// Generate shadow maps for meshes
    pub fn generate_shadow_maps(
        &self,
        light_manager: &mut super::threed_light_manager::ThreeDLightManager,
    ) {
        let (directional_lights, spot_lights) = light_manager.directional_and_spot_lights_mut();
        crate::renderer::lighting::generate_shadow_maps(
            &self.meshes,
            &self.mesh_cast_shadows,
            directional_lights,
            spot_lights,
        );
    }

    /// Get visible mesh indices based on render state
    pub fn get_visible_mesh_indices(
        &self,
        render_state: Option<&HashMap<EntityId, bool>>,
    ) -> Vec<usize> {
        crate::renderer::mesh_filtering::get_visible_mesh_indices(
            self.meshes.len(),
            &self.mesh_entity_ids,
            render_state,
        )
    }

    /// Get visible mesh indices using BVH frustum culling
    pub fn get_visible_mesh_indices_with_camera(
        &mut self,
        camera: &three_d::Camera,
        render_state: Option<&HashMap<EntityId, bool>>,
        debug_mode: bool,
    ) -> Vec<usize> {
        // First filter by render state (MeshRenderer.enabled)
        let state_filtered_indices = crate::renderer::mesh_filtering::get_visible_mesh_indices(
            self.meshes.len(),
            &self.mesh_entity_ids,
            render_state,
        );

        // If BVH culling is not available, return state-filtered results
        if self.visibility_culler.is_none() {
            log::debug!("BVH culling not available, using state filtering only");
            return state_filtered_indices;
        }

        // Perform BVH frustum culling
        let view_projection_threed = camera.projection() * camera.view();

        // Convert three_d::Matrix4 to glam::Mat4
        let view_projection = glam::Mat4::from_cols_array_2d(&[
            [
                view_projection_threed.x.x,
                view_projection_threed.x.y,
                view_projection_threed.x.z,
                view_projection_threed.x.w,
            ],
            [
                view_projection_threed.y.x,
                view_projection_threed.y.y,
                view_projection_threed.y.z,
                view_projection_threed.y.w,
            ],
            [
                view_projection_threed.z.x,
                view_projection_threed.z.y,
                view_projection_threed.z.z,
                view_projection_threed.z.w,
            ],
            [
                view_projection_threed.w.x,
                view_projection_threed.w.y,
                view_projection_threed.w.z,
                view_projection_threed.w.w,
            ],
        ]);

        let all_entity_ids: Vec<u64> = self.mesh_entity_ids.iter().map(|id| id.as_u64()).collect();

        let bvh_visible_indices = if let Some(ref culler) = self.visibility_culler {
            culler.get_visible_entities(view_projection, &all_entity_ids, debug_mode)
        } else {
            state_filtered_indices.clone()
        };

        // Intersect: must pass both render state AND frustum culling
        let final_indices: Vec<usize> = state_filtered_indices
            .into_iter()
            .filter(|idx| bvh_visible_indices.contains(idx))
            .collect();

        // Log culling results only when visibility changes
        let total = self.meshes.len();
        let culled_count = total - final_indices.len();
        let current_visible_set: std::collections::HashSet<usize> =
            final_indices.iter().copied().collect();

        if current_visible_set != self.previous_visible_indices && debug_mode {
            if culled_count > 0 {
                log::info!(
                    "🔍 BVH Culling: {}/{} meshes visible, {} culled (changed)",
                    final_indices.len(),
                    total,
                    culled_count
                );

                // Log details of culled entities
                for (idx, entity_id) in self.mesh_entity_ids.iter().enumerate() {
                    let in_frustum = bvh_visible_indices.contains(&idx);
                    let in_render_state = !render_state
                        .and_then(|state| state.get(entity_id))
                        .map(|&enabled| !enabled)
                        .unwrap_or(false);

                    if !in_frustum && in_render_state {
                        log::info!(
                            "  ❌ CULLED OUT: Entity {} (mesh {}) - outside frustum",
                            entity_id,
                            idx
                        );
                    } else if in_frustum && in_render_state {
                        log::info!("  ✅ VISIBLE: Entity {} (mesh {})", entity_id, idx);
                    }
                }
            } else {
                log::info!(
                    "🔍 BVH Culling: All {}/{} meshes visible (changed)",
                    final_indices.len(),
                    total
                );
            }
        }

        // Update previous state for next frame
        self.previous_visible_indices = current_visible_set;

        final_indices
    }

    /// Sync physics transforms to meshes
    pub fn sync_physics_transforms(&mut self, physics_world: &vibe_physics::PhysicsWorld) {
        crate::renderer::physics_sync::sync_physics_transforms(
            &mut self.meshes,
            &self.mesh_entity_ids,
            &self.mesh_scales,
            physics_world,
        );
    }

    /// Sync script transforms to meshes
    pub fn sync_script_transforms(&mut self, script_system: &vibe_scripting::ScriptSystem) {
        crate::renderer::physics_sync::sync_script_transforms(
            &mut self.meshes,
            &self.mesh_entity_ids,
            &mut self.mesh_scales,
            &self.mesh_base_scales,
            script_system,
        );
    }

    /// Update entity material from script mutation
    pub fn update_entity_material(&mut self, entity_id: EntityId, data: &serde_json::Value) {
        crate::renderer::material_update::update_entity_material(
            &mut self.meshes,
            &self.mesh_entity_ids,
            entity_id,
            data,
        );
    }
}

impl Default for ThreeDMeshManager {
    fn default() -> Self {
        Self::new()
    }
}
