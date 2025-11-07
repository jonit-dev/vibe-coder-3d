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
    // three-d Mesh::aabb() returns an axis-aligned bounding box transformed into world space.
    // We'll convert it into our internal Aabb representation (also world space at registration time).
    let local_aabb = convert_threed_aabb(mesh.aabb());

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
pub fn update_bvh_transforms<M: Material>(
    bvh_manager: &Option<Arc<Mutex<BvhManager>>>,
    meshes: &[Gm<Mesh, M>],
    entity_ids: &[EntityId],
) {
    if let Some(ref manager) = bvh_manager {
        let mut bvh = manager.lock().unwrap();

        for (mesh, &entity_id) in meshes.iter().zip(entity_ids.iter()) {
            // Get the mesh's current world-space AABB directly from three-d
            let world_aabb = convert_threed_aabb(mesh.aabb());
            let center = world_aabb.center();
            let size = world_aabb.size();

            // No logging for BVH reads - too noisy

            // Update the BVH with the new world-space AABB
            bvh.update_world_aabb(entity_id.as_u64(), world_aabb);
        }
    }
}

fn convert_threed_aabb(aabb: three_d::AxisAlignedBoundingBox) -> Aabb {
    let min = GlamVec3::new(aabb.min().x, aabb.min().y, aabb.min().z);
    let max = GlamVec3::new(aabb.max().x, aabb.max().y, aabb.max().z);
    Aabb::new(min, max)
}
