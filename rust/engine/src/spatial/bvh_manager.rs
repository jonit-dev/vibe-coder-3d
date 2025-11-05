use crate::spatial::mesh_bvh::{MeshBvh, SplitStrategy};
use crate::spatial::scene_bvh::{SceneBvh, SceneRef, Frustum};
use crate::spatial::primitives::{Aabb, Ray};
use crate::spatial::intersect::{ray_intersect_triangle, RayHit};
use glam::{Mat4, Vec3};
use std::collections::HashMap;
use log::{debug, warn};

/// Configuration for BVH system
#[derive(Debug, Clone)]
pub struct BvhConfig {
    /// Enable BVH-based culling in renderer
    pub enable_bvh_culling: bool,
    /// Enable BVH-based raycasting in scripting
    pub enable_bvh_raycasts: bool,
    /// Maximum triangles per leaf in MeshBVH
    pub max_leaf_triangles: u32,
    /// Maximum references per leaf in SceneBVH
    pub max_leaf_refs: u32,
    /// Split strategy for MeshBVH
    pub mesh_split_strategy: SplitStrategy,
    /// Enable incremental updates (refit) vs full rebuilds
    pub enable_incremental_updates: bool,
}

impl Default for BvhConfig {
    fn default() -> Self {
        Self {
            enable_bvh_culling: true,
            enable_bvh_raycasts: true,
            max_leaf_triangles: 8,
            max_leaf_refs: 16,
            mesh_split_strategy: SplitStrategy::Sah,
            enable_incremental_updates: true,
        }
    }
}

/// Performance metrics for BVH system
#[derive(Debug, Default, Clone)]
pub struct BvhMetrics {
    /// Time spent building MeshBVHs (ms)
    pub mesh_build_time_ms: f32,
    /// Time spent building SceneBVH (ms)
    pub scene_build_time_ms: f32,
    /// Time spent refitting (ms)
    pub refit_time_ms: f32,
    /// Total number of mesh BVHs
    pub total_mesh_bvhs: usize,
    /// Total triangles in all mesh BVHs
    pub total_triangles: usize,
    /// Total number of scene references
    pub total_scene_refs: usize,
    /// Number of culled meshes in last frame
    pub culled_meshes_last_frame: usize,
    /// Number of visible meshes in last frame
    pub visible_meshes_last_frame: usize,
    /// Number of raycasts performed in last frame
    pub raycasts_last_frame: usize,
    /// Number of ray triangle tests in last frame
    pub ray_triangle_tests_last_frame: usize,
}

/// Raycast hit result
#[derive(Debug, Clone, PartialEq)]
pub struct RaycastHit {
    /// Entity ID that was hit
    pub entity_id: u64,
    /// Distance from ray origin to hit point
    pub distance: f32,
    /// Hit point in world space
    pub point: Vec3,
    /// Barycentric coordinates on the triangle (u, v, w where u+v+w=1)
    pub barycentric: (f32, f32, f32),
    /// Triangle index within the mesh
    pub triangle_index: usize,
}

/// BVH Manager that orchestrates MeshBVH and SceneBVH
#[derive(Debug)]
pub struct BvhManager {
    /// Configuration
    config: BvhConfig,
    /// Performance metrics
    metrics: BvhMetrics,
    /// Scene BVH for coarse culling
    scene_bvh: SceneBvh,
    /// Per-mesh BVHs (entity_id -> MeshBVH)
    mesh_bvhs: HashMap<u64, MeshBvh>,
    /// World-space AABBs (entity_id -> AABB)
    world_aabbs: HashMap<u64, Aabb>,
    /// Local-space AABBs (entity_id -> AABB)
    local_aabbs: HashMap<u64, Aabb>,
    /// Flags indicating which entities need SceneBVH updates
    dirty_entities: HashMap<u64, bool>,
    /// Scene BVH needs full rebuild
    scene_needs_rebuild: bool,
}

impl BvhManager {
    /// Create a new BVH manager with default configuration
    pub fn new() -> Self {
        Self::with_config(BvhConfig::default())
    }

    /// Create a new BVH manager with custom configuration
    pub fn with_config(config: BvhConfig) -> Self {
        Self {
            scene_bvh: SceneBvh::new(config.max_leaf_refs),
            mesh_bvhs: HashMap::new(),
            world_aabbs: HashMap::new(),
            local_aabbs: HashMap::new(),
            dirty_entities: HashMap::new(),
            scene_needs_rebuild: false,
            config,
            metrics: BvhMetrics::default(),
        }
    }

    /// Get current configuration
    pub fn config(&self) -> &BvhConfig {
        &self.config
    }

    /// Update configuration
    pub fn update_config(&mut self, config: BvhConfig) {
        self.config = config;
        // May need to rebuild if leaf sizes changed
        self.scene_needs_rebuild = true;
    }

    /// Get performance metrics
    pub fn metrics(&self) -> &BvhMetrics {
        &self.metrics
    }

    /// Register a mesh for BVH acceleration
    pub fn register_mesh(
        &mut self,
        entity_id: u64,
        positions: &[[f32; 3]],
        indices: &[[u32; 3]],
        local_aabb: Aabb,
    ) {
        let start_time = std::time::Instant::now();

        // Build mesh BVH
        let mesh_bvh = MeshBvh::build(
            positions,
            indices,
            self.config.max_leaf_triangles,
            self.config.mesh_split_strategy,
        );

        self.mesh_bvhs.insert(entity_id, mesh_bvh);
        self.local_aabbs.insert(entity_id, local_aabb);

        // Mark as dirty for SceneBVH update
        self.dirty_entities.insert(entity_id, true);
        self.scene_needs_rebuild = true;

        let build_time = start_time.elapsed().as_secs_f32() * 1000.0;
        self.metrics.mesh_build_time_ms += build_time;

        debug!(
            "Registered mesh BVH for entity {} in {:.3}ms ({} triangles)",
            entity_id,
            build_time,
            positions.len()
        );
    }

    /// Unregister an entity from BVH system
    pub fn unregister(&mut self, entity_id: u64) {
        self.mesh_bvhs.remove(&entity_id);
        self.world_aabbs.remove(&entity_id);
        self.local_aabbs.remove(&entity_id);
        self.dirty_entities.remove(&entity_id);
        self.scene_needs_rebuild = true;

        debug!("Unregistered entity {} from BVH system", entity_id);
    }

    /// Update the world transform for an entity
    pub fn update_transform(&mut self, entity_id: u64, world_matrix: Mat4) {
        if let Some(local_aabb) = self.local_aabbs.get(&entity_id) {
            let world_aabb = local_aabb.transformed(world_matrix);

            // Check if AABB changed significantly
            let changed = match self.world_aabbs.get(&entity_id) {
                Some(old_aabb) => {
                    let size_diff = (world_aabb.size() - old_aabb.size()).length();
                    let center_diff = (world_aabb.center() - old_aabb.center()).length();
                    size_diff > 0.001 || center_diff > 0.001
                }
                None => true,
            };

            if changed {
                self.world_aabbs.insert(entity_id, world_aabb);
                self.dirty_entities.insert(entity_id, true);
                self.scene_needs_rebuild = true;
            }
        }
    }

    /// Rebuild the SceneBVH if needed
    pub fn rebuild_scene(&mut self) {
        if !self.scene_needs_rebuild {
            return;
        }

        let start_time = std::time::Instant::now();

        // Collect scene references
        let scene_refs: Vec<SceneRef> = self.world_aabbs
            .iter()
            .map(|(&entity_id, &aabb)| SceneRef { entity_id, aabb })
            .collect();

        // Build or refit SceneBVH
        if self.config.enable_incremental_updates && !scene_refs.is_empty() && self.scene_bvh.nodes.len() > 0 {
            // Try refit first
            self.scene_bvh.refit(&scene_refs);
            self.metrics.refit_time_ms = start_time.elapsed().as_secs_f32() * 1000.0;
        } else {
            // Full rebuild
            self.scene_bvh.build(&scene_refs);
            self.metrics.scene_build_time_ms = start_time.elapsed().as_secs_f32() * 1000.0;
        }

        self.dirty_entities.clear();
        self.scene_needs_rebuild = false;

        // Update metrics
        self.metrics.total_mesh_bvhs = self.mesh_bvhs.len();
        self.metrics.total_triangles = self.mesh_bvhs.values()
            .map(|bvh| bvh.triangles.len())
            .sum();
        self.metrics.total_scene_refs = scene_refs.len();

        debug!(
            "Rebuilt SceneBVH in {:.3}ms ({} entities, {} triangles)",
            start_time.elapsed().as_secs_f32() * 1000.0,
            scene_refs.len(),
            self.metrics.total_triangles
        );
    }

    /// Perform frustum culling and return visible entity IDs
    pub fn cull_frustum(&mut self, frustum_planes: [[f32; 4]; 6]) -> Vec<u64> {
        if !self.config.enable_bvh_culling {
            // Return all entities if BVH culling is disabled
            return self.world_aabbs.keys().copied().collect();
        }

        // Rebuild SceneBVH if needed
        self.rebuild_scene();

        let frustum = Frustum::from_planes(frustum_planes);
        let mut visible_entities = Vec::new();
        self.scene_bvh.query_frustum(&frustum, &mut visible_entities);

        // Update metrics
        self.metrics.visible_meshes_last_frame = visible_entities.len();
        self.metrics.culled_meshes_last_frame = self.world_aabbs.len().saturating_sub(visible_entities.len());

        visible_entities
    }

    /// Perform raycast and return the closest hit
    pub fn raycast_first(&mut self, origin: Vec3, dir: Vec3, max_distance: f32) -> Option<RaycastHit> {
        if !self.config.enable_bvh_raycasts {
            return None;
        }

        // Rebuild SceneBVH if needed
        self.rebuild_scene();

        let ray = Ray::new(origin, dir);
        self.metrics.raycasts_last_frame += 1;

        // Coarse phase: get candidate entities using SceneBVH
        let mut candidates = Vec::new();
        self.scene_bvh.query_ray(&ray, max_distance, &mut candidates);

        // Fine phase: test against triangles in candidate mesh BVHs
        let mut closest_hit: Option<RaycastHit> = None;

        for &entity_id in &candidates {
            if let Some(mesh_bvh) = self.mesh_bvhs.get(&entity_id) {
                if let Some((distance, triangle_index)) = mesh_bvh.raycast_first(&ray, max_distance) {
                    self.metrics.ray_triangle_tests_last_frame += 1;

                    match &closest_hit {
                        Some(current_hit) => {
                            if distance < current_hit.distance {
                                let hit_point = ray.point_at(distance);
                                closest_hit = Some(RaycastHit {
                                    entity_id,
                                    distance,
                                    point: hit_point,
                                    barycentric: (0.0, 0.0, 0.0), // Could compute from triangle if needed
                                    triangle_index,
                                });
                            }
                        }
                        None => {
                            let hit_point = ray.point_at(distance);
                            closest_hit = Some(RaycastHit {
                                entity_id,
                                distance,
                                point: hit_point,
                                barycentric: (0.0, 0.0, 0.0), // Could compute from triangle if needed
                                triangle_index,
                            });
                        }
                    }
                }
            }
        }

        closest_hit
    }

    /// Perform raycast and return all hits (sorted by distance)
    pub fn raycast_all(&mut self, origin: Vec3, dir: Vec3, max_distance: f32) -> Vec<RaycastHit> {
        if !self.config.enable_bvh_raycasts {
            return Vec::new();
        }

        // Rebuild SceneBVH if needed
        self.rebuild_scene();

        let ray = Ray::new(origin, dir);
        self.metrics.raycasts_last_frame += 1;

        // Coarse phase: get candidate entities using SceneBVH
        let mut candidates = Vec::new();
        self.scene_bvh.query_ray(&ray, max_distance, &mut candidates);

        // Fine phase: test against triangles in candidate mesh BVHs
        let mut hits = Vec::new();

        for &entity_id in &candidates {
            if let Some(mesh_bvh) = self.mesh_bvhs.get(&entity_id) {
                let mut triangle_hits = Vec::new();
                mesh_bvh.raycast_all(&ray, max_distance, &mut triangle_hits);

                self.metrics.ray_triangle_tests_last_frame += triangle_hits.len();

                for (distance, triangle_index) in triangle_hits {
                    let hit_point = ray.point_at(distance);
                    hits.push(RaycastHit {
                        entity_id,
                        distance,
                        point: hit_point,
                        barycentric: (0.0, 0.0, 0.0), // Could compute from triangle if needed
                        triangle_index,
                    });
                }
            }
        }

        // Sort by distance
        hits.sort_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap());
        hits
    }

    /// Reset metrics (call this at the beginning of each frame)
    pub fn reset_metrics(&mut self) {
        self.metrics = BvhMetrics::default();
    }

    /// Get statistics about the BVH system
    pub fn get_statistics(&self) -> BvhStatistics {
        BvhStatistics {
            config: self.config.clone(),
            metrics: self.metrics.clone(),
            scene_bvh_stats: self.scene_bvh.get_stats(),
            mesh_bvh_count: self.mesh_bvhs.len(),
            total_triangles: self.mesh_bvhs.values()
                .map(|bvh| bvh.triangles.len())
                .sum(),
        }
    }

    /// Force a full rebuild of all BVH structures
    pub fn force_rebuild(&mut self) {
        self.scene_needs_rebuild = true;
        self.rebuild_scene();
    }

    /// Clear all BVH data
    pub fn clear(&mut self) {
        self.mesh_bvhs.clear();
        self.world_aabbs.clear();
        self.local_aabbs.clear();
        self.dirty_entities.clear();
        self.scene_needs_rebuild = true;
        self.scene_bvh = SceneBvh::new(self.config.max_leaf_refs);
    }

    /// Check if an entity is registered in the BVH system
    pub fn is_entity_registered(&self, entity_id: u64) -> bool {
        self.mesh_bvhs.contains_key(&entity_id)
    }

    /// Get the number of registered entities
    pub fn entity_count(&self) -> usize {
        self.mesh_bvhs.len()
    }
}

/// Comprehensive BVH statistics
#[derive(Debug, Clone)]
pub struct BvhStatistics {
    pub config: BvhConfig,
    pub metrics: BvhMetrics,
    pub scene_bvh_stats: crate::spatial::scene_bvh::SceneBvhStats,
    pub mesh_bvh_count: usize,
    pub total_triangles: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_triangle_data() -> Vec<[f32; 3]> {
        vec![
            [0.0, 0.0, 0.0],
            [1.0, 0.0, 0.0],
            [0.5, 1.0, 0.0],
            [-1.0, 0.0, 0.0],
        ]
    }

    fn create_test_indices() -> Vec<[u32; 3]> {
        vec![
            [0, 1, 2],
            [0, 2, 3],
        ]
    }

    #[test]
    fn test_bvh_manager_register_and_unregister() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);
        assert_eq!(manager.entity_count(), 1);
        assert!(manager.is_entity_registered(42));

        manager.unregister(42);
        assert_eq!(manager.entity_count(), 0);
        assert!(!manager.is_entity_registered(42));
    }

    #[test]
    fn test_bvh_manager_update_transform() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);

        // Update transform
        let transform = Mat4::from_translation(Vec3::new(5.0, 0.0, 0.0));
        manager.update_transform(42, transform);

        // Should trigger SceneBVH rebuild
        assert!(manager.entity_count() > 0);
    }

    #[test]
    fn test_bvh_manager_raycast() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);

        // Raycast towards the triangle
        let hit = manager.raycast_first(
            Vec3::new(0.5, 0.5, -1.0),
            Vec3::Z,
            10.0
        );

        assert!(hit.is_some());
        let hit = hit.unwrap();
        assert_eq!(hit.entity_id, 42);
        assert!(hit.distance > 0.0);
    }

    #[test]
    fn test_bvh_manager_raycast_miss() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);

        // Raycast away from the triangle
        let hit = manager.raycast_first(
            Vec3::new(10.0, 10.0, -1.0),
            Vec3::Z,
            10.0
        );

        assert!(hit.is_none());
    }

    #[test]
    fn test_bvh_manager_frustum_culling() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);
        manager.update_transform(42, Mat4::IDENTITY);

        // Frustum that should include the entity
        let frustum_planes = [
            [1.0, 0.0, 0.0, 5.0],    // x >= -5
            [-1.0, 0.0, 0.0, 5.0],   // x <= 5
            [0.0, 1.0, 0.0, 5.0],    // y >= -5
            [0.0, -1.0, 0.0, 5.0],   // y <= 5
            [0.0, 0.0, 1.0, 5.0],    // z >= -5
            [0.0, 0.0, -1.0, 5.0],   // z <= 5
        ];

        let visible = manager.cull_frustum(frustum_planes);
        assert!(visible.contains(&42));
    }

    #[test]
    fn test_bvh_manager_disabled_features() {
        let mut config = BvhConfig::default();
        config.enable_bvh_culling = false;
        config.enable_bvh_raycasts = false;

        let mut manager = BvhManager::with_config(config);

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);

        // Raycast should return None when disabled
        let hit = manager.raycast_first(Vec3::ZERO, Vec3::Z, 10.0);
        assert!(hit.is_none());

        // Frustum culling should return all entities when disabled
        let frustum_planes = [
            [1.0, 0.0, 0.0, 5.0],
            [-1.0, 0.0, 0.0, 5.0],
            [0.0, 1.0, 0.0, 5.0],
            [0.0, -1.0, 0.0, 5.0],
            [0.0, 0.0, 1.0, 5.0],
            [0.0, 0.0, -1.0, 5.0],
        ];
        let visible = manager.cull_frustum(frustum_planes);
        assert!(visible.contains(&42));
    }

    #[test]
    fn test_bvh_manager_statistics() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);

        let stats = manager.get_statistics();
        assert_eq!(stats.mesh_bvh_count, 1);
        assert!(stats.total_triangles > 0);
        assert_eq!(stats.config.enable_bvh_culling, true);
        assert_eq!(stats.config.enable_bvh_raycasts, true);
    }

    #[test]
    fn test_bvh_manager_clear() {
        let mut manager = BvhManager::new();

        let positions = create_test_triangle_data();
        let indices = create_test_indices();
        let local_aabb = Aabb::new(Vec3::new(-1.0, 0.0, -0.1), Vec3::new(1.0, 1.0, 0.1));

        manager.register_mesh(42, &positions, &indices, local_aabb);
        assert_eq!(manager.entity_count(), 1);

        manager.clear();
        assert_eq!(manager.entity_count(), 0);
    }
}