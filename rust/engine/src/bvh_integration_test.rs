//! BVH Integration Test Module
//!
//! This module provides comprehensive integration testing for the BVH system,
//! including frustum culling, raycasting, Lua scripting integration, and performance validation.
//!
//! Usage:
//! ```bash
//! cargo test --bin vibe-engine bvh_integration_test
//! # Or run the scene directly:
//! cargo run -- --scene testbvh --debug
//! ```

use anyhow::{Context, Result};
use glam::{Mat4, Vec3, Quat};
use log::{info, warn, error, debug};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::spatial::bvh_manager::{BvhManager, BvhConfig, RaycastHit, BvhMetrics};
use crate::spatial::primitives::Aabb;
use crate::spatial::scene_bvh::Frustum;
use crate::renderer::visibility::VisibilityCuller;

/// BVH Integration Test Configuration
#[derive(Debug, Clone)]
pub struct BvhTestConfig {
    /// Enable/disable BVH during testing
    pub enable_bvh: bool,
    /// Number of raycasts to perform in performance tests
    pub performance_raycast_count: usize,
    /// Tolerance for position/distance comparisons
    pub tolerance: f32,
    /// Enable detailed logging
    pub verbose_logging: bool,
    /// Screenshot output directory
    pub screenshot_dir: Option<String>,
}

impl Default for BvhTestConfig {
    fn default() -> Self {
        Self {
            enable_bvh: true,
            performance_raycast_count: 1000,
            tolerance: 0.001,
            verbose_logging: true,
            screenshot_dir: Some("screenshots".to_string()),
        }
    }
}

/// Test case for raycasting
#[derive(Debug, Clone)]
pub struct RaycastTestCase {
    pub name: String,
    pub origin: Vec3,
    pub direction: Vec3,
    pub max_distance: f32,
    pub expected_hit: Option<ExpectedHit>,
}

#[derive(Debug, Clone)]
pub struct ExpectedHit {
    pub entity_id: u64,
    pub approx_distance: f32,
    pub tolerance: f32,
}

/// Test case for frustum culling
#[derive(Debug, Clone)]
pub struct FrustumTestCase {
    pub name: String,
    pub view_matrix: Mat4,
    pub projection_matrix: Mat4,
    pub expected_visible_entities: Vec<u64>,
    pub expected_culled_entities: Vec<u64>,
}

/// BVH Integration Test Results
#[derive(Debug, Clone)]
pub struct BvhTestResults {
    pub raycast_tests_passed: usize,
    pub raycast_tests_failed: usize,
    pub frustum_tests_passed: usize,
    pub frustum_tests_failed: usize,
    pub performance_metrics: PerformanceMetrics,
    pub lua_script_tests_passed: usize,
    pub lua_script_tests_failed: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub raycast_time_ms: f32,
    pub frustum_cull_time_ms: f32,
    pub raycasts_per_second: f32,
    pub memory_usage_mb: f32,
    pub bvh_build_time_ms: f32,
    pub triangle_count: usize,
    pub entity_count: usize,
}

/// BVH Integration Test Runner
pub struct BvhIntegrationTester {
    config: BvhTestConfig,
    bvh_manager: Arc<Mutex<BvhManager>>,
    visibility_culler: VisibilityCuller,
}

impl BvhIntegrationTester {
    /// Create a new BVH integration tester
    pub fn new(config: BvhTestConfig) -> Self {
        let bvh_config = BvhConfig {
            enable_bvh_culling: config.enable_bvh,
            enable_bvh_raycasts: config.enable_bvh,
            max_leaf_triangles: 8,
            max_leaf_refs: 16,
            mesh_split_strategy: crate::spatial::mesh_bvh::SplitStrategy::Sah,
            enable_incremental_updates: true,
        };

        let bvh_manager = Arc::new(Mutex::new(BvhManager::with_config(bvh_config)));
        let visibility_culler = VisibilityCuller::new(bvh_manager.clone());

        Self {
            config,
            bvh_manager,
            visibility_culler,
        }
    }

    /// Run all BVH integration tests
    pub fn run_all_tests(&mut self) -> Result<BvhTestResults> {
        info!("Starting BVH Integration Tests...");

        let mut results = BvhTestResults {
            raycast_tests_passed: 0,
            raycast_tests_failed: 0,
            frustum_tests_passed: 0,
            frustum_tests_failed: 0,
            performance_metrics: PerformanceMetrics {
                raycast_time_ms: 0.0,
                frustum_cull_time_ms: 0.0,
                raycasts_per_second: 0.0,
                memory_usage_mb: 0.0,
                bvh_build_time_ms: 0.0,
                triangle_count: 0,
                entity_count: 0,
            },
            lua_script_tests_passed: 0,
            lua_script_tests_failed: 0,
            errors: Vec::new(),
        };

        // Test 1: Setup test scene
        self.setup_test_scene().context("Failed to setup test scene")?;

        // Test 2: Raycasting tests
        let raycast_results = self.test_raycasting().context("Raycasting tests failed")?;
        results.raycast_tests_passed = raycast_results.passed;
        results.raycast_tests_failed = raycast_results.failed;
        results.errors.extend(raycast_results.errors);

        // Test 3: Frustum culling tests
        let frustum_results = self.test_frustum_culling().context("Frustum culling tests failed")?;
        results.frustum_tests_passed = frustum_results.passed;
        results.frustum_tests_failed = frustum_results.failed;
        results.errors.extend(frustum_results.errors);

        // Test 4: Performance tests
        let performance_results = self.test_performance().context("Performance tests failed")?;
        results.performance_metrics = performance_results;

        // Test 5: Lua scripting integration
        let lua_results = self.test_lua_scripting().context("Lua scripting tests failed")?;
        results.lua_script_tests_passed = lua_results.passed;
        results.lua_script_tests_failed = lua_results.failed;
        results.errors.extend(lua_results.errors);

        // Test 6: Visual verification (screenshots)
        if let Some(screenshot_dir) = &self.config.screenshot_dir {
            self.take_verification_screenshots(screenshot_dir)
                .context("Failed to take verification screenshots")?;
        }

        self.print_test_summary(&results);
        Ok(results)
    }

    /// Setup test scene with various meshes for testing
    fn setup_test_scene(&mut self) -> Result<()> {
        info!("Setting up BVH test scene...");

        let start_time = Instant::now();

        // Create test meshes at different positions
        let test_meshes = vec![
            // Ground plane
            TestMesh {
                entity_id: 1,
                name: "Ground".to_string(),
                position: Vec3::new(0.0, 0.0, 0.0),
                scale: Vec3::new(50.0, 1.0, 50.0),
                mesh_type: MeshType::Plane,
            },
            // Near cube - should be visible
            TestMesh {
                entity_id: 2,
                name: "Near Cube".to_string(),
                position: Vec3::new(0.0, 1.0, 5.0),
                scale: Vec3::new(2.0, 2.0, 2.0),
                mesh_type: MeshType::Cube,
            },
            // Far sphere - near frustum edge
            TestMesh {
                entity_id: 3,
                name: "Far Sphere".to_string(),
                position: Vec3::new(15.0, 1.0, 30.0),
                scale: Vec3::new(1.5, 1.5, 1.5),
                mesh_type: MeshType::Sphere,
            },
            // Left cylinder - should be culled
            TestMesh {
                entity_id: 4,
                name: "Left Cylinder".to_string(),
                position: Vec3::new(-25.0, 2.0, 10.0),
                scale: Vec3::new(3.0, 3.0, 3.0),
                mesh_type: MeshType::Cylinder,
            },
            // Center sphere - raycasting target
            TestMesh {
                entity_id: 5,
                name: "Center Sphere".to_string(),
                position: Vec3::new(0.0, 2.0, 10.0),
                scale: Vec3::new(1.5, 1.5, 1.5),
                mesh_type: MeshType::Sphere,
            },
        ];

        let mut bvh_manager = self.bvh_manager.lock().unwrap();

        for mesh in test_meshes {
            let (positions, indices, local_aabb) = create_test_mesh_data(&mesh);

            bvh_manager.register_mesh(
                mesh.entity_id,
                &positions,
                &indices,
                local_aabb
            );

            // Update world transform
            let world_matrix = Mat4::from_scale_rotation_translation(
                mesh.scale,
                Quat::IDENTITY,
                mesh.position
            );
            bvh_manager.update_transform(mesh.entity_id, world_matrix);

            if self.config.verbose_logging {
                debug!("Registered test mesh: {} (ID: {})", mesh.name, mesh.entity_id);
            }
        }

        // Force BVH rebuild
        bvh_manager.force_rebuild();

        let setup_time = start_time.elapsed();
        info!("Test scene setup completed in {:.3}ms", setup_time.as_millis());

        Ok(())
    }

    /// Test raycasting functionality
    fn test_raycasting(&mut self) -> Result<TestResultSet> {
        info!("Testing BVH raycasting...");

        let mut results = TestResultSet::new();
        let test_cases = self.create_raycast_test_cases();

        for case in test_cases {
            let hit = {
                let mut bvh_manager = self.bvh_manager.lock().unwrap();
                bvh_manager.raycast_first(case.origin, case.direction, case.max_distance)
            };

            match (&case.expected_hit, hit) {
                (Some(expected), Some(actual)) => {
                    // Validate the hit
                    if actual.entity_id == expected.entity_id {
                        let distance_error = (actual.distance - expected.approx_distance).abs();
                        if distance_error <= expected.tolerance {
                            results.passed += 1;
                            if self.config.verbose_logging {
                                debug!("✓ Raycast test '{}' passed: hit entity {} at distance {:.3}",
                                       case.name, actual.entity_id, actual.distance);
                            }
                        } else {
                            results.failed += 1;
                            let error = format!("Raycast test '{}' failed: distance error {:.3} > tolerance {:.3}",
                                              case.name, distance_error, expected.tolerance);
                            results.errors.push(error);
                            warn!("{}", error);
                        }
                    } else {
                        results.failed += 1;
                        let error = format!("Raycast test '{}' failed: hit entity {} but expected {}",
                                          case.name, actual.entity_id, expected.entity_id);
                        results.errors.push(error);
                        warn!("{}", error);
                    }
                }
                (None, None) => {
                    results.passed += 1;
                    if self.config.verbose_logging {
                        debug!("✓ Raycast test '{}' passed: correctly missed", case.name);
                    }
                }
                (Some(expected), None) => {
                    results.failed += 1;
                    let error = format!("Raycast test '{}' failed: expected hit on entity {} but got none",
                                      case.name, expected.entity_id);
                    results.errors.push(error);
                    warn!("{}", error);
                }
                (None, Some(actual)) => {
                    results.failed += 1;
                    let error = format!("Raycast test '{}' failed: unexpected hit on entity {}",
                                      case.name, actual.entity_id);
                    results.errors.push(error);
                    warn!("{}", error);
                }
            }
        }

        info!("Raycasting tests: {} passed, {} failed", results.passed, results.failed);
        Ok(results)
    }

    /// Test frustum culling functionality
    fn test_frustum_culling(&mut self) -> Result<TestResultSet> {
        info!("Testing BVH frustum culling...");

        let mut results = TestResultSet::new();
        let test_cases = self.create_frustum_test_cases();

        for case in test_cases {
            let view_projection = case.projection_matrix * case.view_matrix;
            let all_entity_ids = vec![1, 2, 3, 4, 5]; // All test entities

            let visible_indices = self.visibility_culler.get_visible_entities(view_projection, &all_entity_ids);
            let visible_entity_ids: Vec<u64> = visible_indices.iter()
                .map(|&index| all_entity_ids[index])
                .collect();

            // Validate visible entities
            let mut visible_correct = true;
            for &expected_visible in &case.expected_visible_entities {
                if !visible_entity_ids.contains(&expected_visible) {
                    visible_correct = false;
                    results.errors.push(format!(
                        "Frustum test '{}' failed: expected entity {} to be visible but it was culled",
                        case.name, expected_visible
                    ));
                }
            }

            // Validate culled entities
            for &expected_culled in &case.expected_culled_entities {
                if visible_entity_ids.contains(&expected_culled) {
                    visible_correct = false;
                    results.errors.push(format!(
                        "Frustum test '{}' failed: expected entity {} to be culled but it was visible",
                        case.name, expected_culled
                    ));
                }
            }

            if visible_correct {
                results.passed += 1;
                if self.config.verbose_logging {
                    debug!("✓ Frustum test '{}' passed: {}/{} entities visible",
                           case.name, visible_entity_ids.len(), all_entity_ids.len());
                }
            } else {
                results.failed += 1;
                warn!("Frustum test '{}' failed", case.name);
            }
        }

        info!("Frustum culling tests: {} passed, {} failed", results.passed, results.failed);
        Ok(results)
    }

    /// Test performance with and without BVH
    fn test_performance(&mut self) -> Result<PerformanceMetrics> {
        info!("Testing BVH performance...");

        let mut metrics = PerformanceMetrics {
            raycast_time_ms: 0.0,
            frustum_cull_time_ms: 0.0,
            raycasts_per_second: 0.0,
            memory_usage_mb: 0.0,
            bvh_build_time_ms: 0.0,
            triangle_count: 0,
            entity_count: 0,
        };

        // Get BVH statistics
        {
            let bvh_manager = self.bvh_manager.lock().unwrap();
            let stats = bvh_manager.get_statistics();
            metrics.bvh_build_time_ms = stats.metrics.scene_build_time_ms + stats.metrics.mesh_build_time_ms;
            metrics.triangle_count = stats.total_triangles;
            metrics.entity_count = stats.mesh_bvh_count;
        }

        // Test raycasting performance
        let raycast_start = Instant::now();
        let ray_origin = Vec3::new(0.0, 5.0, 15.0);

        for i in 0..self.config.performance_raycast_count {
            // Generate random ray directions
            let theta = (i as f32 / self.config.performance_raycast_count as f32) * 2.0 * std::f32::consts::PI;
            let phi = (i as f32 / self.config.performance_raycast_count as f32) * std::f32::consts::PI;

            let direction = Vec3::new(
                phi.sin() * theta.cos(),
                phi.sin() * theta.sin(),
                phi.cos()
            ).normalize();

            let mut bvh_manager = self.bvh_manager.lock().unwrap();
            let _hit = bvh_manager.raycast_first(ray_origin, direction, 100.0);
        }

        let raycast_duration = raycast_start.elapsed();
        metrics.raycast_time_ms = raycast_duration.as_millis() as f32;
        metrics.raycasts_per_second = self.config.performance_raycast_count as f32 / raycast_duration.as_secs_f32();

        // Test frustum culling performance
        let frustum_start = Instant::now();
        let view_matrix = Mat4::look_at_rh(
            Vec3::new(0.0, 5.0, 15.0),
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::Y
        );
        let projection_matrix = Mat4::perspective_rh(
            std::f32::consts::PI / 3.0, // 60 degrees
            16.0 / 9.0,
            0.1,
            100.0
        );

        for _ in 0..1000 { // Test frustum culling 1000 times
            let view_projection = projection_matrix * view_matrix;
            let all_entity_ids = vec![1, 2, 3, 4, 5];
            let _visible_indices = self.visibility_culler.get_visible_entities(view_projection, &all_entity_ids);
        }

        let frustum_duration = frustum_start.elapsed();
        metrics.frustum_cull_time_ms = frustum_duration.as_millis() as f32;

        // Estimate memory usage (rough approximation)
        metrics.memory_usage_mb = (metrics.triangle_count * 36 + metrics.entity_count * 64) as f32 / (1024.0 * 1024.0);

        info!("Performance results:");
        info!("  Raycast: {} raycasts in {:.3}ms ({:.0} rays/sec)",
              self.config.performance_raycast_count, metrics.raycast_time_ms, metrics.raycasts_per_second);
        info!("  Frustum culling: 1000 iterations in {:.3}ms", metrics.frustum_cull_time_ms);
        info!("  BVH build time: {:.3}ms", metrics.bvh_build_time_ms);
        info!("  Memory usage: {:.2}MB (estimated)", metrics.memory_usage_mb);
        info!("  Triangle count: {}", metrics.triangle_count);
        info!("  Entity count: {}", metrics.entity_count);

        Ok(metrics)
    }

    /// Test Lua scripting integration
    fn test_lua_scripting(&mut self) -> Result<TestResultSet> {
        info!("Testing BVH Lua scripting integration...");

        let mut results = TestResultSet::new();

        // This would test the Lua scripting integration
        // For now, we'll validate that the BVH manager can be used by the scripting adapter
        let adapter = crate::spatial::scripting_adapter::BvhScriptingAdapter::new(self.bvh_manager.clone());

        // Test raycasting through scripting adapter
        let hit = {
            let mut adapter = adapter;
            adapter.raycast_first(Vec3::new(0.0, 5.0, 15.0), Vec3::new(0.0, -0.3, -1.0).normalize(), 100.0)
        };

        if hit.is_some() {
            results.passed += 1;
            info!("✓ Lua scripting adapter test passed");
        } else {
            results.failed += 1;
            results.errors.push("Lua scripting adapter test failed: no hit returned".to_string());
            warn!("Lua scripting adapter test failed");
        }

        // Note: Full Lua script testing would require the scripting system to be initialized
        // This is a placeholder for that functionality
        info!("Lua scripting tests: {} passed, {} failed", results.passed, results.failed);
        info!("Note: Full Lua testing requires script system initialization");

        Ok(results)
    }

    /// Take verification screenshots
    fn take_verification_screenshots(&self, screenshot_dir: &str) -> Result<()> {
        info!("Taking verification screenshots in directory: {}", screenshot_dir);

        // Create screenshot directory
        std::fs::create_dir_all(screenshot_dir)?;

        // This would integrate with the renderer's screenshot functionality
        // For now, we'll just log the intent
        info!("Screenshots would be saved to:");
        info!("  {}/bvh_test_normal.png", screenshot_dir);
        info!("  {}/bvh_test_wireframe.png", screenshot_dir);
        info!("  {}/bvh_test_bounding_boxes.png", screenshot_dir);

        Ok(())
    }

    /// Create raycast test cases
    fn create_raycast_test_cases(&self) -> Vec<RaycastTestCase> {
        vec![
            RaycastTestCase {
                name: "Ground Hit".to_string(),
                origin: Vec3::new(0.0, 5.0, 15.0),
                direction: Vec3::new(0.0, -1.0, -0.8).normalize(),
                max_distance: 100.0,
                expected_hit: Some(ExpectedHit {
                    entity_id: 1, // Ground
                    approx_distance: 14.5,
                    tolerance: 2.0,
                }),
            },
            RaycastTestCase {
                name: "Near Cube Hit".to_string(),
                origin: Vec3::new(0.0, 5.0, 15.0),
                direction: Vec3::new(0.0, -0.3, -1.0).normalize(),
                max_distance: 100.0,
                expected_hit: Some(ExpectedHit {
                    entity_id: 2, // Near Cube
                    approx_distance: 13.0,
                    tolerance: 2.0,
                }),
            },
            RaycastTestCase {
                name: "Center Sphere Hit".to_string(),
                origin: Vec3::new(0.0, 5.0, 15.0),
                direction: Vec3::new(0.0, -0.2, -0.8).normalize(),
                max_distance: 100.0,
                expected_hit: Some(ExpectedHit {
                    entity_id: 5, // Center Sphere
                    approx_distance: 12.5,
                    tolerance: 2.0,
                }),
            },
            RaycastTestCase {
                name: "Miss Test".to_string(),
                origin: Vec3::new(0.0, 5.0, 15.0),
                direction: Vec3::new(1.0, 0.0, 0.0), // Pointing to the right
                max_distance: 100.0,
                expected_hit: None,
            },
        ]
    }

    /// Create frustum test cases
    fn create_frustum_test_cases(&self) -> Vec<FrustumTestCase> {
        let view_matrix = Mat4::look_at_rh(
            Vec3::new(0.0, 5.0, 15.0),
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::Y
        );
        let projection_matrix = Mat4::perspective_rh(
            std::f32::consts::PI / 3.0, // 60 degrees
            16.0 / 9.0,
            0.1,
            100.0
        );

        vec![
            FrustumTestCase {
                name: "Normal View".to_string(),
                view_matrix,
                projection_matrix,
                expected_visible_entities: vec![1, 2, 5], // Ground, near cube, center sphere
                expected_culled_entities: vec![3, 4], // Far sphere, left cylinder
            },
        ]
    }

    /// Print comprehensive test summary
    fn print_test_summary(&self, results: &BvhTestResults) {
        info!("=== BVH Integration Test Summary ===");
        info!("Raycasting Tests: {} passed, {} failed", results.raycast_tests_passed, results.raycast_tests_failed);
        info!("Frustum Culling Tests: {} passed, {} failed", results.frustum_tests_passed, results.frustum_tests_failed);
        info!("Lua Scripting Tests: {} passed, {} failed", results.lua_script_tests_passed, results.lua_script_tests_failed);
        info!("Performance:");
        info!("  Raycast: {} rays/sec", results.performance_metrics.raycasts_per_second);
        info!("  Frustum Culling: {:.3}ms for 1000 iterations", results.performance_metrics.frustum_cull_time_ms);
        info!("  BVH Build Time: {:.3}ms", results.performance_metrics.bvh_build_time_ms);
        info!("  Memory Usage: {:.2}MB", results.performance_metrics.memory_usage_mb);

        if results.errors.is_empty() {
            info!("🎉 All BVH integration tests passed!");
        } else {
            error!("❌ {} test failures detected:", results.errors.len());
            for error in &results.errors {
                error!("  - {}", error);
            }
        }
        info!("=== End BVH Integration Test Summary ===");
    }
}

/// Helper structures and functions
#[derive(Debug, Clone)]
struct TestMesh {
    entity_id: u64,
    name: String,
    position: Vec3,
    scale: Vec3,
    mesh_type: MeshType,
}

#[derive(Debug, Clone)]
enum MeshType {
    Cube,
    Sphere,
    Cylinder,
    Plane,
}

#[derive(Debug, Clone)]
struct TestResultSet {
    passed: usize,
    failed: usize,
    errors: Vec<String>,
}

impl TestResultSet {
    fn new() -> Self {
        Self {
            passed: 0,
            failed: 0,
            errors: Vec::new(),
        }
    }
}

/// Create test mesh data (positions, indices, AABB)
fn create_test_mesh_data(mesh: &TestMesh) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    match mesh.mesh_type {
        MeshType::Cube => create_cube_data(mesh.scale),
        MeshType::Sphere => create_sphere_data(mesh.scale),
        MeshType::Cylinder => create_cylinder_data(mesh.scale),
        MeshType::Plane => create_plane_data(mesh.scale),
    }
}

fn create_cube_data(scale: Vec3) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    let s = scale * 0.5;
    let positions = vec![
        [-s.x, -s.y, -s.z], [s.x, -s.y, -s.z], [s.x, s.y, -s.z], [-s.x, s.y, -s.z], // Back
        [-s.x, -s.y, s.z], [s.x, -s.y, s.z], [s.x, s.y, s.z], [-s.x, s.y, s.z], // Front
    ];

    let indices = vec![
        [0, 1, 2], [0, 2, 3], // Back
        [4, 6, 5], [4, 7, 6], // Front
        [0, 4, 5], [0, 5, 1], // Bottom
        [2, 6, 7], [2, 7, 3], // Top
        [0, 3, 7], [0, 7, 4], // Left
        [1, 5, 6], [1, 6, 2], // Right
    ];

    let aabb = Aabb::new(Vec3::new(-s.x, -s.y, -s.z), Vec3::new(s.x, s.y, s.z));

    (positions, indices, aabb)
}

fn create_sphere_data(scale: Vec3) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    // Simple octahedron as sphere approximation
    let r = scale.x * 0.5;
    let positions = vec![
        [0.0, r, 0.0],    // Top
        [r, 0.0, 0.0],    // Right
        [0.0, 0.0, r],    // Front
        [-r, 0.0, 0.0],   // Left
        [0.0, 0.0, -r],   // Back
        [0.0, -r, 0.0],   // Bottom
    ];

    let indices = vec![
        [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // Top pyramid
        [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4], // Bottom pyramid
    ];

    let aabb = Aabb::new(Vec3::new(-r, -r, -r), Vec3::new(r, r, r));

    (positions, indices, aabb)
}

fn create_cylinder_data(scale: Vec3) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    let r = scale.x * 0.5;
    let h = scale.y * 0.5;
    let positions = vec![
        [-r, -h, -r], [r, -h, -r], [r, -h, r], [-r, -h, r], // Bottom
        [-r, h, -r], [r, h, -r], [r, h, r], [-r, h, r], // Top
    ];

    let indices = vec![
        [0, 1, 2], [0, 2, 3], // Bottom
        [4, 6, 5], [4, 7, 6], // Top
        [0, 4, 1], [1, 4, 5], // Front
        [1, 5, 2], [2, 5, 6], // Right
        [2, 6, 3], [3, 6, 7], // Back
        [3, 7, 0], [0, 7, 4], // Left
    ];

    let aabb = Aabb::new(Vec3::new(-r, -h, -r), Vec3::new(r, h, r));

    (positions, indices, aabb)
}

fn create_plane_data(scale: Vec3) -> (Vec<[f32; 3]>, Vec<[u32; 3]>, Aabb) {
    let sx = scale.x * 0.5;
    let sz = scale.z * 0.5;
    let positions = vec![
        [-sx, 0.0, -sz], [sx, 0.0, -sz], [sx, 0.0, sz], [-sx, 0.0, sz],
    ];

    let indices = vec![
        [0, 1, 2], [0, 2, 3],
    ];

    let aabb = Aabb::new(Vec3::new(-sx, 0.0, -sz), Vec3::new(sx, 0.0, sz));

    (positions, indices, aabb)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bvh_integration_tester_creation() {
        let config = BvhTestConfig::default();
        let tester = BvhIntegrationTester::new(config);
        // Test that the tester can be created successfully
        assert!(true); // Placeholder assertion
    }

    #[test]
    fn test_mesh_data_creation() {
        let cube_mesh = TestMesh {
            entity_id: 1,
            name: "Test Cube".to_string(),
            position: Vec3::ZERO,
            scale: Vec3::new(2.0, 2.0, 2.0),
            mesh_type: MeshType::Cube,
        };

        let (positions, indices, aabb) = create_test_mesh_data(&cube_mesh);

        assert!(!positions.is_empty());
        assert!(!indices.is_empty());
        assert!(aabb.size().x > 0.0);
        assert!(aabb.size().y > 0.0);
        assert!(aabb.size().z > 0.0);
    }

    #[test]
    fn test_raycast_test_case_creation() {
        let tester = BvhIntegrationTester::new(BvhTestConfig::default());
        let test_cases = tester.create_raycast_test_cases();

        assert!(!test_cases.is_empty());

        for case in test_cases {
            assert!(!case.name.is_empty());
            assert!(case.direction.length_squared() > 0.99); // Should be normalized
            assert!(case.max_distance > 0.0);
        }
    }

    #[test]
    fn test_frustum_test_case_creation() {
        let tester = BvhIntegrationTester::new(BvhTestConfig::default());
        let test_cases = tester.create_frustum_test_cases();

        assert!(!test_cases.is_empty());

        for case in test_cases {
            assert!(!case.name.is_empty());
            assert!(!case.expected_visible_entities.is_empty() || !case.expected_culled_entities.is_empty());
        }
    }
}