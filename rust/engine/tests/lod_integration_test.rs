use std::sync::Arc;
use std::time::Instant;

use vibe_coder_engine::renderer::lod_manager::LODManager;
use vibe_scene::models::LODComponent;

/// Test LOD manager configuration and basic functionality
#[test]
fn test_lod_manager_basic_functionality() -> anyhow::Result<()> {
    let lod_manager = LODManager::global();

    // Test quality configuration
    {
        let mut manager = lod_manager.lock().unwrap();
        manager.set_quality_auto(true);
        assert!(manager.is_auto_switch_enabled());

        manager.set_distance_thresholds(5.0, 15.0);
        let thresholds = manager.get_distance_thresholds();
        assert_eq!(thresholds, (5.0, 15.0));
    }

    // Test quality suffix conversion
    {
        let manager = lod_manager.lock().unwrap();
        let high_suffix = manager.get_quality_suffix(&vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);
        assert_eq!(high_suffix, "_high");

        let low_suffix = manager.get_quality_suffix(&vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);
        assert_eq!(low_suffix, "_low");

        let original_suffix = manager.get_quality_suffix(&vibe_coder_engine::renderer::lod_manager::LODQuality::Original);
        assert_eq!(original_suffix, "");
    }

    Ok(())
}

/// Test LOD performance characteristics
#[test]
fn test_lod_performance_characteristics() -> anyhow::Result<()> {
    let lod_manager = LODManager::global();

    // Configure LOD manager
    {
        let mut manager = lod_manager.lock().unwrap();
        manager.set_distance_thresholds(5.0, 15.0);
        manager.set_quality_auto(true);
    }

    // Performance test: Distance calculations
    let start_time = Instant::now();
    let manager = lod_manager.lock().unwrap();

    for i in 0..1000 {
        let distance = i as f32 * 0.1;
        let quality = manager.select_quality_by_distance(distance);

        // Verify quality makes sense for distance
        match quality {
            vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity => {
                assert!(distance <= 5.0, "High fidelity should be for close objects");
            },
            vibe_coder_engine::renderer::lod_manager::LODQuality::Original => {
                assert!(distance > 5.0 && distance <= 15.0, "Original should be for medium distance");
            },
            vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity => {
                assert!(distance > 15.0, "Low fidelity should be for far objects");
            },
        }
    }

    let duration = start_time.elapsed();

    // Verify performance characteristics
    assert!(duration.as_millis() < 10,
            "LOD quality calculation should be fast, took {}ms", duration.as_millis());

    Ok(())
}

/// Test LOD path resolution
#[test]
fn test_lod_path_resolution() -> anyhow::Result<()> {
    let lod_manager = LODManager::global();

    // Test path resolution for different qualities
    let manager = lod_manager.lock().unwrap();

    // Test original quality (should return original path)
    let original_path = manager.resolve_lod_path("models/test.glb", vibe_coder_engine::renderer::lod_manager::LODQuality::Original);
    assert_eq!(original_path.unwrap(), "models/test.glb");

    // Test high quality path
    let high_path = manager.resolve_lod_path("models/test.glb", vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);
    assert_eq!(high_path.unwrap(), "models/lod/test_high.glb");

    // Test low quality path
    let low_path = manager.resolve_lod_path("models/test.glb", vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);
    assert_eq!(low_path.unwrap(), "models/lod/test_low.glb");

    // Test path with different extensions
    let gltf_path = manager.resolve_lod_path("assets/cube.gltf", vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);
    assert_eq!(gltf_path.unwrap(), "assets/lod/cube_high.gltf");

    Ok(())
}

/// Test LOD manager configuration and global state
#[test]
fn test_lod_manager_configuration() -> anyhow::Result<()> {
    let lod_manager = LODManager::global();

    // Test quality configuration
    {
        let mut manager = lod_manager.lock().unwrap();
        manager.set_quality(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);
        assert_eq!(manager.get_quality(), vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);

        manager.set_quality_auto(true);
        assert!(manager.is_auto_switch_enabled());
    }

    // Test distance threshold configuration
    {
        let mut manager = lod_manager.lock().unwrap();
        manager.set_distance_thresholds(3.0, 12.0);
        let thresholds = manager.get_distance_thresholds();
        assert_eq!(thresholds, (3.0, 12.0));
    }

    // Test thread safety with concurrent access
    let manager_clone = lod_manager.clone();
    let handle = std::thread::spawn(move || {
        let mut manager = manager_clone.lock().unwrap();
        manager.set_quality(vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);
    });

    handle.join().unwrap();

    let manager = lod_manager.lock().unwrap();
    assert_eq!(manager.get_quality(), vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);

    Ok(())
}

/// Test LOD component functionality
#[test]
fn test_lod_component() -> anyhow::Result<()> {
    // Test LOD component builder
    let lod_component = LODComponent::builder()
        .with_path("models/test.glb".to_string())
        .with_high_quality_path("models/lod/test_high.glb".to_string())
        .with_low_quality_path("models/lod/test_low.glb".to_string())
        .with_distance_thresholds(5.0, 15.0)
        .with_quality_override(Some(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity))
        .build();

    assert_eq!(lod_component.path, "models/test.glb");
    assert_eq!(lod_component.high_quality_path, Some("models/lod/test_high.glb".to_string()));
    assert_eq!(lod_component.low_quality_path, Some("models/lod/test_low.glb".to_string()));
    assert_eq!(lod_component.distance_thresholds, (5.0, 15.0));
    assert_eq!(lod_component.quality_override, Some(vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity));

    // Test serialization
    let json = serde_json::to_value(&lod_component)?;
    let deserialized: LODComponent = serde_json::from_value(json)?;
    assert_eq!(deserialized.path, lod_component.path);

    Ok(())
}

/// Test LOD distance calculation edge cases
#[test]
fn test_lod_distance_edge_cases() -> anyhow::Result<()> {
    let lod_manager = LODManager::global();

    {
        let mut manager = lod_manager.lock().unwrap();
        manager.set_distance_thresholds(5.0, 15.0);
    }

    let manager = lod_manager.lock().unwrap();

    // Test exact threshold boundaries
    let at_high_threshold = manager.select_quality_by_distance(5.0);
    assert_eq!(at_high_threshold, vibe_coder_engine::renderer::lod_manager::LODQuality::Original);

    let at_low_threshold = manager.select_quality_by_distance(15.0);
    assert_eq!(at_low_threshold, vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);

    // Test very small distances
    let very_close = manager.select_quality_by_distance(0.001);
    assert_eq!(very_close, vibe_coder_engine::renderer::lod_manager::LODQuality::HighFidelity);

    // Test very large distances
    let very_far = manager.select_quality_by_distance(1000.0);
    assert_eq!(very_far, vibe_coder_engine::renderer::lod_manager::LODQuality::LowFidelity);

    Ok(())
}

#[cfg(test)]
mod benchmarks {
    use super::*;

    /// Benchmark LOD quality calculation performance
    #[test]
    fn benchmark_lod_quality_calculation() -> anyhow::Result<()> {
        let lod_manager = LODManager::global();

        {
            let mut manager = lod_manager.lock().unwrap();
            manager.set_distance_thresholds(5.0, 15.0);
        }

        // Benchmark performance
        let start_time = Instant::now();
        let manager = lod_manager.lock().unwrap();

        for i in 0..10000 {
            let distance = i as f32 * 0.01;
            let _quality = manager.select_quality_by_distance(distance);
        }

        let duration = start_time.elapsed();

        println!("LOD quality calculation for 10,000 distances: {:?}", duration);
        println!("Calculations per second: {:.0}", 10000.0 / duration.as_secs_f64());

        assert!(duration.as_millis() < 10,
                "LOD processing of 10,000 distances should be under 10ms, took {}ms", duration.as_millis());

        Ok(())
    }
}