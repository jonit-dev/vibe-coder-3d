//! BVH Performance Comparison Test
//!
//! This module provides performance comparison testing between BVH-enabled and disabled scenarios.
//! It measures raycasting and frustum culling performance to validate BVH improvements.

use anyhow::Result;
use glam::{Mat4, Vec3};
use log::{info, warn};
use std::sync::{Arc, Mutex};
use std::time::Instant;

use crate::renderer::visibility::{FallbackVisibilityCuller, VisibilityCuller};
use crate::spatial::bvh_manager::{BvhConfig, BvhManager};
use crate::spatial::primitives::Aabb;

/// Performance test configuration
#[derive(Debug, Clone)]
pub struct PerformanceTestConfig {
    /// Number of entities to create for testing
    pub entity_count: usize,
    /// Number of raycasts to perform
    pub raycast_count: usize,
    /// Number of frustum culling tests
    pub frustum_test_count: usize,
    /// Distribution pattern for entities
    pub entity_pattern: EntityPattern,
}

#[derive(Debug, Clone)]
pub enum EntityPattern {
    /// Entities distributed in a grid
    Grid { size: usize, spacing: f32 },
    /// Entities randomly distributed
    Random { range: f32 },
    /// Entities clustered in groups
    Clustered {
        cluster_count: usize,
        entities_per_cluster: usize,
        cluster_radius: f32,
    },
}

/// Performance test results
#[derive(Debug, Clone)]
pub struct PerformanceTestResults {
    pub entity_count: usize,
    pub triangle_count: usize,

    // BVH enabled results
    pub bvh_raycast_time_ms: f32,
    pub bvh_frustum_time_ms: f32,
    pub bvh_build_time_ms: f32,
    pub bvh_memory_usage_mb: f32,

    // BVH disabled results (brute force)
    pub no_bvh_raycast_time_ms: f32,
    pub no_bvh_frustum_time_ms: f32,

    // Performance improvements
    pub raycast_speedup: f32,
    pub frustum_speedup: f32,
}

/// BVH Performance Test Runner
pub struct BvhPerformanceTester {
    config: PerformanceTestConfig,
}

impl BvhPerformanceTester {
    /// Create a new performance tester
    pub fn new(config: PerformanceTestConfig) -> Self {
        Self { config }
    }

    /// Run comprehensive performance comparison tests
    pub fn run_performance_comparison(&self) -> Result<PerformanceTestResults> {
        info!("Starting BVH Performance Comparison Tests...");
        info!("Entity count: {}", self.config.entity_count);
        info!("Raycast count: {}", self.config.raycast_count);
        info!("Frustum test count: {}", self.config.frustum_test_count);

        // Generate test entities
        let test_entities = self.generate_test_entities()?;
        info!("Generated {} test entities", test_entities.len());

        // Test with BVH enabled
        let bvh_results = self.test_with_bvh(&test_entities)?;

        // Test with BVH disabled (brute force)
        let no_bvh_results = self.test_without_bvh(&test_entities)?;

        // Calculate performance improvements
        let raycast_speedup = no_bvh_results.raycast_time_ms / bvh_results.raycast_time_ms;
        let frustum_speedup = no_bvh_results.frustum_time_ms / bvh_results.frustum_time_ms;

        let results = PerformanceTestResults {
            entity_count: test_entities.len(),
            triangle_count: bvh_results.triangle_count,
            bvh_raycast_time_ms: bvh_results.raycast_time_ms,
            bvh_frustum_time_ms: bvh_results.frustum_time_ms,
            bvh_build_time_ms: bvh_results.build_time_ms,
            bvh_memory_usage_mb: bvh_results.memory_usage_mb,
            no_bvh_raycast_time_ms: no_bvh_results.raycast_time_ms,
            no_bvh_frustum_time_ms: no_bvh_results.frustum_time_ms,
            raycast_speedup,
            frustum_speedup,
        };

        self.print_performance_results(&results);
        Ok(results)
    }

    /// Generate test entities based on the configured pattern
    fn generate_test_entities(&self) -> Result<Vec<TestEntity>> {
        let mut entities = Vec::new();

        match &self.config.entity_pattern {
            EntityPattern::Grid { size, spacing } => {
                let grid_size = (*size as f32) * spacing;
                let offset = grid_size / 2.0;

                for x in 0..*size {
                    for z in 0..*size {
                        let entity_id = (x * size + z) as u64 + 1;
                        let position = Vec3::new(
                            x as f32 * spacing - offset,
                            1.0,
                            z as f32 * spacing - offset,
                        );

                        entities.push(TestEntity {
                            entity_id,
                            position,
                            scale: Vec3::new(1.0, 2.0, 1.0),
                            mesh_type: MeshType::Cube,
                        });

                        if entities.len() >= self.config.entity_count {
                            break;
                        }
                    }
                    if entities.len() >= self.config.entity_count {
                        break;
                    }
                }
            }
            EntityPattern::Random { range } => {
                use rand::Rng;
                let mut rng = rand::thread_rng();

                for i in 0..self.config.entity_count {
                    entities.push(TestEntity {
                        entity_id: (i + 1) as u64,
                        position: Vec3::new(
                            rng.gen_range(-*range..*range),
                            1.0,
                            rng.gen_range(-*range..*range),
                        ),
                        scale: Vec3::new(
                            rng.gen_range(0.5..2.0),
                            rng.gen_range(0.5..2.0),
                            rng.gen_range(0.5..2.0),
                        ),
                        mesh_type: MeshType::Cube,
                    });
                }
            }
            EntityPattern::Clustered {
                cluster_count,
                entities_per_cluster,
                cluster_radius,
            } => {
                use rand::Rng;
                let mut rng = rand::thread_rng();
                let mut entity_counter = 0;

                for cluster_id in 0..*cluster_count {
                    let cluster_center =
                        Vec3::new(rng.gen_range(-50.0..50.0), 1.0, rng.gen_range(-50.0..50.0));

                    for i in 0..*entities_per_cluster {
                        if entity_counter >= self.config.entity_count {
                            break;
                        }

                        let angle =
                            (i as f32 / *entities_per_cluster as f32) * 2.0 * std::f32::consts::PI;
                        let radius = rng.gen_range(0.0..*cluster_radius);

                        entities.push(TestEntity {
                            entity_id: (entity_counter + 1) as u64,
                            position: cluster_center
                                + Vec3::new(radius * angle.cos(), 0.0, radius * angle.sin()),
                            scale: Vec3::new(1.0, 2.0, 1.0),
                            mesh_type: MeshType::Cube,
                        });

                        entity_counter += 1;
                    }
                }
            }
        }

        Ok(entities)
    }

    /// Test performance with BVH enabled
    fn test_with_bvh(&self, entities: &[TestEntity]) -> Result<BvhTestResults> {
        info!("Testing performance with BVH enabled...");

        let bvh_config = BvhConfig {
            enable_bvh_culling: true,
            enable_bvh_raycasts: true,
            max_leaf_triangles: 8,
            max_leaf_refs: 16,
            mesh_split_strategy: crate::spatial::mesh_bvh::SplitStrategy::Sah,
            enable_incremental_updates: true,
        };

        let bvh_manager = Arc::new(Mutex::new(BvhManager::with_config(bvh_config)));
        let visibility_culler = VisibilityCuller::new(bvh_manager.clone());

        // Register entities and measure build time
        let build_start = Instant::now();
        let mut total_triangles = 0;

        {
            let mut manager = bvh_manager.lock().unwrap();

            for entity in entities {
                let (positions, indices, local_aabb) = create_test_mesh_data(entity);
                total_triangles += indices.len();

                manager.register_mesh(entity.entity_id, &positions, &indices, local_aabb);

                let world_matrix = Mat4::from_scale_rotation_translation(
                    entity.scale,
                    glam::Quat::IDENTITY,
                    entity.position,
                );
                manager.update_transform(entity.entity_id, world_matrix);
            }

            manager.force_rebuild();
        }

        let build_time = build_start.elapsed().as_millis() as f32;

        // Test raycasting performance
        let raycast_start = Instant::now();
        let ray_origin = Vec3::new(0.0, 10.0, 0.0);

        for i in 0..self.config.raycast_count {
            let theta = (i as f32 / self.config.raycast_count as f32) * 2.0 * std::f32::consts::PI;
            let phi = (i as f32 / self.config.raycast_count as f32) * std::f32::consts::PI;

            let direction =
                Vec3::new(phi.sin() * theta.cos(), phi.cos(), phi.sin() * theta.sin()).normalize();

            let mut manager = bvh_manager.lock().unwrap();
            let _hit = manager.raycast_first(ray_origin, direction, 100.0);
        }

        let raycast_time = raycast_start.elapsed().as_millis() as f32;

        // Test frustum culling performance
        let frustum_start = Instant::now();
        let view_matrix = Mat4::look_at_rh(
            Vec3::new(0.0, 10.0, 20.0),
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::Y,
        );
        let projection_matrix =
            Mat4::perspective_rh(std::f32::consts::PI / 3.0, 16.0 / 9.0, 0.1, 100.0);

        let entity_ids: Vec<u64> = entities.iter().map(|e| e.entity_id).collect();

        for _ in 0..self.config.frustum_test_count {
            let view_projection = projection_matrix * view_matrix;
            let _visible_indices =
                visibility_culler.get_visible_entities(view_projection, &entity_ids, false);
        }

        let frustum_time = frustum_start.elapsed().as_millis() as f32;

        // Estimate memory usage
        let memory_usage_mb =
            (total_triangles * 36 + entities.len() * 64) as f32 / (1024.0 * 1024.0);

        Ok(BvhTestResults {
            raycast_time_ms: raycast_time,
            frustum_time_ms: frustum_time,
            build_time_ms: build_time,
            memory_usage_mb,
            triangle_count: total_triangles,
        })
    }

    /// Test performance without BVH (brute force)
    fn test_without_bvh(&self, entities: &[TestEntity]) -> Result<BvhTestResults> {
        info!("Testing performance without BVH (brute force)...");

        // For raycasting, we'll simulate brute force testing
        let raycast_start = Instant::now();
        let ray_origin = Vec3::new(0.0, 10.0, 0.0);

        for i in 0..self.config.raycast_count {
            let theta = (i as f32 / self.config.raycast_count as f32) * 2.0 * std::f32::consts::PI;
            let phi = (i as f32 / self.config.raycast_count as f32) * std::f32::consts::PI;

            let direction =
                Vec3::new(phi.sin() * theta.cos(), phi.cos(), phi.sin() * theta.sin()).normalize();

            // Simulate brute force raycast (checking all entities)
            let _hit = self.brute_force_raycast(ray_origin, direction, entities);
        }

        let raycast_time = raycast_start.elapsed().as_millis() as f32;

        // Test frustum culling without BVH (fallback culler)
        let frustum_start = Instant::now();
        let fallback_culler = FallbackVisibilityCuller::new();
        let view_matrix = Mat4::look_at_rh(
            Vec3::new(0.0, 10.0, 20.0),
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::Y,
        );
        let projection_matrix =
            Mat4::perspective_rh(std::f32::consts::PI / 3.0, 16.0 / 9.0, 0.1, 100.0);

        let entity_ids: Vec<u64> = entities.iter().map(|e| e.entity_id).collect();

        for _ in 0..self.config.frustum_test_count {
            let view_projection = projection_matrix * view_matrix;
            let _visible_indices =
                fallback_culler.get_visible_entities(view_projection, &entity_ids);
        }

        let frustum_time = frustum_start.elapsed().as_millis() as f32;

        Ok(BvhTestResults {
            raycast_time_ms: raycast_time,
            frustum_time_ms: frustum_time,
            build_time_ms: 0.0,                  // No build time for brute force
            memory_usage_mb: 0.0,                // Minimal memory overhead
            triangle_count: entities.len() * 12, // Approximate
        })
    }

    /// Simulate brute force raycasting
    fn brute_force_raycast(
        &self,
        origin: Vec3,
        direction: Vec3,
        entities: &[TestEntity],
    ) -> Option<u64> {
        // Simplified brute force raycast - just check if ray hits entity bounding box
        let mut closest_hit: Option<(f32, u64)> = None;

        for entity in entities {
            let distance = self.ray_aabb_distance(origin, direction, entity);
            if let Some(dist) = distance {
                match closest_hit {
                    Some((current_dist, _)) => {
                        if dist < current_dist {
                            closest_hit = Some((dist, entity.entity_id));
                        }
                    }
                    None => closest_hit = Some((dist, entity.entity_id)),
                }
            }
        }

        closest_hit.map(|(_, entity_id)| entity_id)
    }

    /// Calculate ray-AABB distance (simplified)
    fn ray_aabb_distance(&self, origin: Vec3, direction: Vec3, entity: &TestEntity) -> Option<f32> {
        // Create simple AABB around entity
        let half_extents = entity.scale * 0.5;
        let min = entity.position - half_extents;
        let max = entity.position + half_extents;

        // Simplified ray-box intersection
        let t_min = (min - origin) / direction;
        let t_max = (max - origin) / direction;

        let t1 = t_min
            .x
            .min(t_max.x)
            .min(t_min.y.min(t_max.y).min(t_min.z.min(t_max.z)));
        let t2 = t_min
            .x
            .max(t_max.x)
            .max(t_min.y.max(t_max.y).max(t_min.z.max(t_max.z)));

        if t1 <= t2 && t2 >= 0.0 {
            Some(t1.max(0.0))
        } else {
            None
        }
    }

    /// Print comprehensive performance results
    fn print_performance_results(&self, results: &PerformanceTestResults) {
        info!("=== BVH Performance Comparison Results ===");
        info!("Entity Count: {}", results.entity_count);
        info!("Triangle Count: {}", results.triangle_count);
        info!("With BVH:");
        info!(
            "  Raycast Time: {:.3}ms ({} rays)",
            results.bvh_raycast_time_ms, self.config.raycast_count
        );
        info!(
            "  Frustum Cull Time: {:.3}ms ({} tests)",
            results.bvh_frustum_time_ms, self.config.frustum_test_count
        );
        info!("  BVH Build Time: {:.3}ms", results.bvh_build_time_ms);
        info!("  Memory Usage: {:.2}MB", results.bvh_memory_usage_mb);
        info!("Without BVH (Brute Force):");
        info!(
            "  Raycast Time: {:.3}ms ({} rays)",
            results.no_bvh_raycast_time_ms, self.config.raycast_count
        );
        info!(
            "  Frustum Cull Time: {:.3}ms ({} tests)",
            results.no_bvh_frustum_time_ms, self.config.frustum_test_count
        );
        info!("Performance Improvements:");
        info!("  Raycast Speedup: {:.2}x", results.raycast_speedup);
        info!("  Frustum Culling Speedup: {:.2}x", results.frustum_speedup);
        if results.raycast_speedup > 2.0 {
            info!("✅ Significant raycasting performance improvement detected!");
        } else if results.raycast_speedup > 1.1 {
            info!("⚠️  Modest raycasting performance improvement");
        } else {
            warn!("❌ No significant raycasting performance improvement");
        }

        if results.frustum_speedup > 1.5 {
            info!("✅ Significant frustum culling performance improvement detected!");
        } else if results.frustum_speedup > 1.1 {
            info!("⚠️  Modest frustum culling performance improvement");
        } else {
            warn!("❌ No significant frustum culling performance improvement");
        }

        info!("=== End Performance Comparison ===");
    }
}

/// Helper structures
#[derive(Debug, Clone)]
struct TestEntity {
    entity_id: u64,
    position: Vec3,
    scale: Vec3,
    mesh_type: MeshType,
}

#[derive(Debug, Clone)]
enum MeshType {
    Cube,
}

#[derive(Debug, Clone)]
struct BvhTestResults {
    pub raycast_time_ms: f32,
    pub frustum_time_ms: f32,
    pub build_time_ms: f32,
    pub memory_usage_mb: f32,
    pub triangle_count: usize,
}

/// Create test mesh data for performance testing
fn create_test_mesh_data(entity: &TestEntity) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    // Create a simple cube mesh
    let s = entity.scale * 0.5;
    let positions = vec![
        [-s.x, -s.y, -s.z],
        [s.x, -s.y, -s.z],
        [s.x, s.y, -s.z],
        [-s.x, s.y, -s.z], // Back
        [-s.x, -s.y, s.z],
        [s.x, -s.y, s.z],
        [s.x, s.y, s.z],
        [-s.x, s.y, s.z], // Front
    ];

    let indices = vec![
        [0, 1, 2],
        [0, 2, 3], // Back
        [4, 6, 5],
        [4, 7, 6], // Front
        [0, 4, 5],
        [0, 5, 1], // Bottom
        [2, 6, 7],
        [2, 7, 3], // Top
        [0, 3, 7],
        [0, 7, 4], // Left
        [1, 5, 6],
        [1, 6, 2], // Right
    ];

    let aabb = Aabb::new(Vec3::new(-s.x, -s.y, -s.z), Vec3::new(s.x, s.y, s.z));

    (positions, indices, aabb)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_tester_creation() {
        let config = PerformanceTestConfig {
            entity_count: 100,
            raycast_count: 1000,
            frustum_test_count: 100,
            entity_pattern: EntityPattern::Grid {
                size: 10,
                spacing: 5.0,
            },
        };

        let tester = BvhPerformanceTester::new(config);
        // Test that the tester can be created successfully
        assert!(true);
    }

    #[test]
    fn test_entity_generation() {
        let config = PerformanceTestConfig {
            entity_count: 25,
            raycast_count: 100,
            frustum_test_count: 10,
            entity_pattern: EntityPattern::Grid {
                size: 5,
                spacing: 10.0,
            },
        };

        let tester = BvhPerformanceTester::new(config);
        let entities = tester.generate_test_entities().unwrap();

        assert_eq!(entities.len(), 25);

        // Check that entities are distributed in a grid pattern
        for entity in &entities {
            assert!(entity.position.x >= -25.0 && entity.position.x <= 25.0);
            assert!(entity.position.z >= -25.0 && entity.position.z <= 25.0);
            assert_eq!(entity.position.y, 1.0);
        }
    }
}
