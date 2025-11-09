use std::time::Instant;

use vibe_coder_engine::renderer::lod_manager::LODManager;
use vibe_scene::models::LODComponent;

/// Test LOD manager configuration and basic functionality
#[test]
fn test_lod_manager_basic_functionality() -> anyhow::Result<()> {
    let lod_manager = LODManager::new();

    // Test quality configuration
    lod_manager.set_auto_switch(true);
    assert!(lod_manager.is_auto_switch_enabled());

    lod_manager.set_distance_thresholds(5.0, 15.0);
    let thresholds = lod_manager.get_distance_thresholds();
    assert_eq!(thresholds, [5.0, 15.0]);

    Ok(())
}

/// Test LOD performance characteristics
#[test]
fn test_lod_performance_characteristics() -> anyhow::Result<()> {
    let lod_manager = LODManager::new();

    // Configure LOD manager
    lod_manager.set_distance_thresholds(5.0, 15.0);
    lod_manager.set_auto_switch(true);

    // Performance test: Distance calculations
    let start_time = Instant::now();

    for i in 0..1000 {
        let distance = i as f32 * 0.1;
        let quality = lod_manager.get_quality_for_distance(distance);

        // Verify quality makes sense for distance
        match quality {
            vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity => {
                assert!(distance <= 5.0, "High fidelity should be for close objects");
            }
            vibe_coder_engine::renderer::lod_manager::LODQuality::Original => {
                assert!(
                    distance > 5.0 && distance <= 15.0,
                    "Original should be for medium distance"
                );
            }
            vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity => {
                assert!(distance > 15.0, "Low fidelity should be for far objects");
            }
        }
    }

    let duration = start_time.elapsed();

    // Verify performance characteristics
    assert!(
        duration.as_millis() < 10,
        "LOD quality calculation should be fast, took {}ms",
        duration.as_millis()
    );

    Ok(())
}

/// Test LOD path resolution
#[test]
fn test_lod_path_resolution() -> anyhow::Result<()> {
    let lod_manager = LODManager::new();

    // Test path resolution for different qualities

    // Test original quality (should return original path)
    let original_path = lod_manager.get_lod_path(
        "models/test.glb",
        Some(vibe_coder_engine::renderer::lod_manager::LODQuality::Original),
    );
    assert_eq!(original_path, "models/test.glb");

    // Test high quality path
    let high_path = lod_manager.get_lod_path(
        "models/test.glb",
        Some(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity),
    );
    assert_eq!(high_path, "models/lod/test_high.glb");

    // Test low quality path
    let low_path = lod_manager.get_lod_path(
        "models/test.glb",
        Some(vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity),
    );
    assert_eq!(low_path, "models/lod/test_low.glb");

    // Test path with different extensions
    let gltf_path = lod_manager.get_lod_path(
        "assets/cube.gltf",
        Some(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity),
    );
    assert_eq!(gltf_path, "assets/lod/cube_high.gltf");

    Ok(())
}

/// Test LOD manager configuration and global state
#[test]
fn test_lod_manager_configuration() -> anyhow::Result<()> {
    let lod_manager = LODManager::new();

    // Test quality configuration
    lod_manager.set_quality(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);
    assert_eq!(
        lod_manager.get_quality(),
        vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity
    );

    lod_manager.set_auto_switch(true);
    assert!(lod_manager.is_auto_switch_enabled());

    // Test distance threshold configuration
    lod_manager.set_distance_thresholds(3.0, 12.0);
    let thresholds = lod_manager.get_distance_thresholds();
    assert_eq!(thresholds, [3.0, 12.0]);

    // Test thread safety with concurrent access
    let manager_clone = lod_manager.clone();
    let handle = std::thread::spawn(move || {
        manager_clone
            .set_quality(vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);
    });

    handle.join();

    assert_eq!(
        lod_manager.get_quality(),
        vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity
    );

    Ok(())
}

/// Test LOD component functionality
#[test]
fn test_lod_component() -> anyhow::Result<()> {
    // Test LOD component creation
    let lod_component = LODComponent::with_paths(
        "models/test.glb".to_string(),
        "models/lod/test_high.glb".to_string(),
        "models/lod/test_low.glb".to_string(),
    );

    assert_eq!(lod_component.original_path, "models/test.glb");
    assert_eq!(
        lod_component.high_fidelity_path,
        Some("models/lod/test_high.glb".to_string())
    );
    assert_eq!(
        lod_component.low_fidelity_path,
        Some("models/lod/test_low.glb".to_string())
    );

    // Test serialization
    let json = serde_json::to_value(&lod_component)?;
    let deserialized: LODComponent = serde_json::from_value(json)?;
    assert_eq!(deserialized.original_path, lod_component.original_path);

    Ok(())
}

/// Test LOD distance calculation edge cases
#[test]
fn test_lod_distance_edge_cases() -> anyhow::Result<()> {
    let lod_manager = LODManager::new();

    lod_manager.set_distance_thresholds(5.0, 15.0);

    // Test exact threshold boundaries
    let at_high_threshold = lod_manager.get_quality_for_distance(5.0);
    assert_eq!(
        at_high_threshold,
        vibe_coder_engine::renderer::lod_manager::LODQuality::Original
    );

    let at_low_threshold = lod_manager.get_quality_for_distance(15.0);
    assert_eq!(
        at_low_threshold,
        vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity
    );

    // Test very small distances
    let very_close = lod_manager.get_quality_for_distance(0.001);
    assert_eq!(
        very_close,
        vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity
    );

    // Test very large distances
    let very_far = lod_manager.get_quality_for_distance(1000.0);
    assert_eq!(
        very_far,
        vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity
    );

    Ok(())
}

#[cfg(test)]
mod benchmarks {
    use super::*;

    /// Benchmark LOD quality calculation performance
    #[test]
    fn benchmark_lod_quality_calculation() -> anyhow::Result<()> {
        let lod_manager = LODManager::new();

        lod_manager.set_distance_thresholds(5.0, 15.0);

        // Benchmark performance
        let start_time = Instant::now();

        for i in 0..10000 {
            let distance = i as f32 * 0.01;
            let _quality = lod_manager.get_quality_for_distance(distance);
        }

        let duration = start_time.elapsed();

        println!(
            "LOD quality calculation for 10,000 distances: {:?}",
            duration
        );
        println!(
            "Calculations per second: {:.0}",
            10000.0 / duration.as_secs_f64()
        );

        assert!(
            duration.as_millis() < 10,
            "LOD processing of 10,000 distances should be under 10ms, took {}ms",
            duration.as_millis()
        );

        Ok(())
    }
}
