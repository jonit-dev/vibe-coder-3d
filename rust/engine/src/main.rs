use clap::Parser;
use std::path::PathBuf;

mod app_threed;
mod debug;
mod ecs;
mod input;
mod io;
mod renderer;
mod spatial;
mod threed_renderer;
mod util;

/// Vibe Coder 3D Engine - Native renderer for scene JSON
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Scene name or path to load (e.g., "Test" or "rust/game/scenes/Test.json")
    #[arg(short, long, default_value = "Default")]
    scene: String,

    /// Window width
    #[arg(long, default_value_t = 1280)]
    width: u32,

    /// Window height
    #[arg(long, default_value_t = 720)]
    height: u32,

    /// Enable verbose logging
    #[arg(short, long, default_value_t = false)]
    verbose: bool,

    /// Enable debug mode (collider outlines, FPS display, ground grid)
    #[arg(short, long, default_value_t = false)]
    debug: bool,

    /// Take a screenshot and exit (saves to screenshots/<scene_name>.png)
    #[arg(long)]
    screenshot: bool,

    /// Custom screenshot output path (requires --screenshot)
    #[arg(long)]
    screenshot_path: Option<PathBuf>,

    /// Delay in milliseconds before taking screenshot (default: 2000ms)
    #[arg(long, default_value_t = 2000)]
    screenshot_delay: u64,

    /// Screenshot scale factor (0.1 to 1.0) - reduces resolution to save tokens
    #[arg(long, default_value_t = 0.8)]
    screenshot_scale: f32,

    /// JPEG quality (1-100) - only applies if output path ends with .jpg/.jpeg
    #[arg(long, default_value_t = 85)]
    screenshot_quality: u8,

    /// LOD quality level (original, high_fidelity, low_fidelity) - overrides auto-switch
    #[arg(long)]
    lod_quality: Option<String>,

    /// LOD high quality distance threshold (default: 50.0)
    #[arg(long)]
    lod_threshold_high: Option<f32>,

    /// LOD low quality distance threshold (default: 100.0)
    #[arg(long)]
    lod_threshold_low: Option<f32>,

    /// Run BVH integration tests and exit
    #[arg(long)]
    bvh_test: bool,

    /// Run BVH performance comparison tests and exit
    #[arg(long)]
    bvh_performance_test: bool,
}

fn main() -> anyhow::Result<()> {
    // Load .env early; ignore if missing
    let _ = dotenvy::dotenv();

    // Parse CLI arguments
    let args = Args::parse();

    // Initialize logger
    let filter = if args.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(filter)).init();

    // Check if we should run BVH tests
    if args.bvh_test {
        log::info!("Running BVH integration tests...");
        #[cfg(test)]
        {
            use vibe_engine::bvh_integration_test::{BvhIntegrationTester, BvhTestConfig};

            let config = BvhTestConfig {
                enable_bvh: true,
                performance_raycast_count: 1000,
                tolerance: 0.001,
                verbose_logging: args.verbose,
                screenshot_dir: Some("screenshots".to_string()),
            };

            let mut tester = BvhIntegrationTester::new(config);
            match tester.run_all_tests() {
                Ok(results) => {
                    if results.errors.is_empty() {
                        log::info!("✅ All BVH tests passed!");
                        std::process::exit(0);
                    } else {
                        log::error!("❌ {} BVH test failures detected", results.errors.len());
                        std::process::exit(1);
                    }
                }
                Err(e) => {
                    log::error!("BVH test execution failed: {}", e);
                    std::process::exit(1);
                }
            }
        }
        #[cfg(not(test))]
        {
            log::error!("BVH testing requires test compilation. Use `cargo test --bin vibe-engine -- --bvh-test`");
            std::process::exit(1);
        }
    }

    // Check if we should run BVH performance tests
    if args.bvh_performance_test {
        log::info!("Running BVH performance comparison tests...");
        #[cfg(test)]
        {
            use vibe_engine::bvh_performance_test::{BvhPerformanceTester, PerformanceTestConfig, EntityPattern};

            let config = PerformanceTestConfig {
                entity_count: 1000,
                raycast_count: 10000,
                frustum_test_count: 1000,
                entity_pattern: EntityPattern::Grid { size: 32, spacing: 5.0 },
            };

            let tester = BvhPerformanceTester::new(config);
            match tester.run_performance_comparison() {
                Ok(_) => {
                    log::info!("✅ BVH performance tests completed!");
                    std::process::exit(0);
                }
                Err(e) => {
                    log::error!("BVH performance test execution failed: {}", e);
                    std::process::exit(1);
                }
            }
        }
        #[cfg(not(test))]
        {
            log::error!("BVH performance testing requires test compilation. Use `cargo test --bin vibe-engine -- --bvh-performance-test`");
            std::process::exit(1);
        }
    }

    // Run the application
    log::info!("Initializing three-d renderer...");
    pollster::block_on(run(args))
}

fn resolve_scene_path(scene: &str) -> anyhow::Result<PathBuf> {
    let path = PathBuf::from(scene);

    // If it's already a valid JSON path that exists, use it directly
    if path.extension() == Some(std::ffi::OsStr::new("json")) && path.exists() {
        return Ok(path);
    }

    // Strip .tsx extension if present (for compatibility with TypeScript scene names)
    let scene_name = if scene.ends_with(".tsx") {
        &scene[..scene.len() - 4]
    } else {
        scene
    };

    // Look for the JSON file in game/scenes/ (relative to rust/engine)
    let scene_dir = PathBuf::from("../game/scenes");
    let scene_file = scene_dir.join(format!("{}.json", scene_name));

    if scene_file.exists() {
        Ok(scene_file)
    } else {
        anyhow::bail!(
            "Scene not found: {}. Tried: {}",
            scene,
            scene_file.display()
        )
    }
}

async fn run(args: Args) -> anyhow::Result<()> {
    // Create event loop
    let event_loop = winit::event_loop::EventLoop::new();

    // Check if a scene was specified
    let mut app = if args.scene != "Default" {
        // Load specific scene
        let scene_path = resolve_scene_path(&args.scene)?;
        log::info!("Loading scene: {}", scene_path.display());
        app_threed::AppThreeD::with_scene(
            scene_path,
            args.width,
            args.height,
            args.debug,
            &event_loop,
        )?
    } else {
        // Use test scene (POC)
        log::info!("Using test scene (POC mode)");
        app_threed::AppThreeD::new(args.width, args.height, args.debug, &event_loop)?
    };

    // Configure LOD system from CLI arguments
    // Note: auto-switch is enabled by default, manual quality override disables it
    if let Some(quality_str) = &args.lod_quality {
        use crate::renderer::LODQuality;
        let quality = match quality_str.to_lowercase().as_str() {
            "original" => LODQuality::Original,
            "high_fidelity" | "high" => LODQuality::HighFidelity,
            "low_fidelity" | "low" => LODQuality::LowFidelity,
            _ => {
                log::warn!("Invalid LOD quality '{}', using Original", quality_str);
                LODQuality::Original
            }
        };
        app.set_lod_quality(quality); // This disables auto-switch
    }

    // Custom distance thresholds (auto-switch remains enabled)
    if let (Some(high), Some(low)) = (args.lod_threshold_high, args.lod_threshold_low) {
        app.set_lod_distance_thresholds(high, low);
    }

    // Handle screenshot mode
    if args.screenshot {
        let output_path = if let Some(path) = args.screenshot_path {
            path
        } else {
            default_screenshot_path(&args.scene)
        };

        // Validate screenshot scale
        let scale = args.screenshot_scale.clamp(0.1, 1.0);
        if scale != args.screenshot_scale {
            log::warn!(
                "Screenshot scale clamped to valid range: {} -> {}",
                args.screenshot_scale,
                scale
            );
        }

        // Validate JPEG quality
        let quality = args.screenshot_quality.clamp(1, 100);
        if quality != args.screenshot_quality {
            log::warn!(
                "JPEG quality clamped to valid range: {} -> {}",
                args.screenshot_quality,
                quality
            );
        }

        return app.screenshot(output_path, args.screenshot_delay, scale, quality);
    }

    log::info!("Entering render loop...");
    app.run(event_loop);

    Ok(())
}

fn default_screenshot_path(scene: &str) -> PathBuf {
    let scene_name = if scene != "Default" {
        scene.replace(".tsx", "").replace(".json", "")
    } else {
        "Default".to_string()
    };

    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("screenshots")
        .join(format!("{}.jpg", scene_name))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_path_for_scene_json() {
        let path = default_screenshot_path("TestScene.json");
        let expected = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("screenshots")
            .join("TestScene.jpg");
        assert_eq!(path, expected);
    }

    #[test]
    fn default_path_for_scene_tsx() {
        let path = default_screenshot_path("Showcase.tsx");
        let expected = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("screenshots")
            .join("Showcase.jpg");
        assert_eq!(path, expected);
    }

    #[test]
    fn default_path_for_default_scene() {
        let path = default_screenshot_path("Default");
        let expected = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("screenshots")
            .join("Default.jpg");
        assert_eq!(path, expected);
    }
}
