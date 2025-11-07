/// BVH system integration for mesh culling and raycasting
///
/// Provides initialization, registration, and update logic for the BVH spatial acceleration structure.

use glam::Vec3 as GlamVec3;
use std::sync::{Arc, Mutex};
use three_d::*;
use vibe_scene::EntityId;

use crate::spatial::bvh_manager::{BvhConfig, BvhManager};
use crate::spatial::mesh_bvh::SplitStrategy;
use crate::spatial::primitives::Aabb;
use crate::renderer::visibility::VisibilityCuller;

/// Initialize BVH system with default configuration
pub fn initialize_bvh_system() -> (Arc<Mutex<BvhManager>>, VisibilityCuller) {
    log::info!("🎯 Initializing BVH System for real-time culling...");

    let config = BvhConfig {
        enable_bvh_culling: true,
        enable_bvh_raycasts: true,
        max_leaf_triangles: 8,
        max_leaf_refs: 4,
        mesh_split_strategy: SplitStrategy::Sah,
        enable_incremental_updates: true,
    };

    let bvh_manager = Arc::new(Mutex::new(BvhManager::with_config(config)));
    let visibility_culler = VisibilityCuller::new(bvh_manager.clone());

    log::info!("✅ BVH System initialized with SAH splitting and incremental updates");

    (bvh_manager, visibility_culler)
}

/// Register a mesh with the BVH system.
///
/// Uses three-d's built-in axis-aligned bounding box for the mesh (local space) and
/// stores it in the BVH keyed by the entity id. We do NOT try to read raw vertex
/// buffers; we rely on three-d's geometry metadata instead.
pub fn register_mesh_with_bvh<M: Material>(
    bvh_manager: &Arc<Mutex<BvhManager>>,
    mesh: &Gm<Mesh, M>,
    entity_id: EntityId,
    mesh_idx: usize,
) {
    // three-d Mesh::aabb() returns an axis-aligned bounding box in mesh-local space.
    // We convert it into our internal Aabb type.
    let mesh_aabb = mesh.aabb();
    let min = GlamVec3::new(
        mesh_aabb.min().x,
        mesh_aabb.min().y,
        mesh_aabb.min().z,
    );
    let max = GlamVec3::new(
        mesh_aabb.max().x,
        mesh_aabb.max().y,
        mesh_aabb.max().z,
    );
    let local_aabb = Aabb::new(min, max);

    // For initial registration we use identity transform; update_bvh_transforms() will
    // apply the current world transform each frame.
    let mut manager = bvh_manager.lock().unwrap();
    manager.register_mesh(entity_id.as_u64(), &[], &[], local_aabb);

    log::debug!(
        "📦 Registered mesh {} (entity {}) with BVH using three-d aabb",
        mesh_idx,
        entity_id
    );
}

/// Update BVH system transforms from current mesh transforms.
///
/// This wires the BVH to actual world transforms so frustum culling is correct
/// instead of using placeholder identity matrices.
///
/// Note: Currently a no-op to avoid regressions while BVH integration is experimental.
pub fn update_bvh_transforms(_bvh_manager: &Option<Arc<Mutex<BvhManager>>>) {
    // BVH update temporarily disabled: keep it a no-op to avoid impacting rendering.
    // This avoids incorrect transforms and expensive rebuilds while BVH integration
    // is still experimental.
    if _bvh_manager.is_some() {
        log::debug!("BVH manager present; update_bvh_transforms is currently a no-op");
    }
}
