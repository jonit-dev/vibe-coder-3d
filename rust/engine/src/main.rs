use clap::Parser;
use std::path::PathBuf;

// NOTE: Old wgpu renderer has compatibility issues with winit 0.28
// Conditionally compile it only when not using three-d
#[cfg(not(feature = "threed-only"))]
mod app;
mod app_threed;
#[cfg(not(feature = "threed-only"))]
mod debug;
mod ecs;
mod io;
#[cfg(not(feature = "threed-only"))]
mod render;
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

    /// Enable debug mode (overrides DEBUG_MODE env var)
    #[arg(long, default_value_t = false)]
    debug: bool,

    /// Enable verbose logging (shows wgpu/debug logs)
    #[arg(short, long, default_value_t = false)]
    verbose: bool,

    /// Use three-d renderer (POC mode)
    #[arg(long, default_value_t = false)]
    threed: bool,
}

fn main() -> anyhow::Result<()> {
    // Load .env early; ignore if missing
    let _ = dotenvy::dotenv();

    // Parse CLI arguments
    let args = Args::parse();

    // Create debug config (merges CLI and env)
    #[cfg(not(feature = "threed-only"))]
    let debug_config = debug::DebugConfig::from_env_and_cli(args.debug);
    #[cfg(feature = "threed-only")]
    let _debug_enabled = args.debug;  // For future use

    // Initialize logger with smart filtering
    #[cfg(not(feature = "threed-only"))]
    let filter = if args.verbose {
        if debug_config.is_enabled() {
            "debug,wgpu_core=debug,wgpu_hal=debug"
        } else {
            "info,wgpu_core=debug,wgpu_hal=debug"
        }
    } else {
        if debug_config.is_enabled() {
            "info,wgpu_core=warn,wgpu_hal=warn,naga=warn,cosmic_text=warn,vibe_engine::render::scene_renderer=warn"
        } else {
            "info,wgpu_core=warn,wgpu_hal=warn,naga=warn,cosmic_text=warn"
        }
    };

    #[cfg(feature = "threed-only")]
    let filter = if args.verbose {
        "debug"
    } else {
        "info"
    };

    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or(filter)
    ).init();

    // Run the application with appropriate renderer
    if args.threed {
        log::info!("Using three-d renderer");
        pollster::block_on(run_threed(args))
    } else {
        #[cfg(not(feature = "threed-only"))]
        {
            // Resolve scene path
            let scene_path = resolve_scene_path(&args.scene)?;
            log::info!("Loading scene from: {}", scene_path.display());
            pollster::block_on(run(scene_path, args.width, args.height, debug_config))
        }
        #[cfg(feature = "threed-only")]
        {
            anyhow::bail!("Old wgpu renderer is disabled. Use --threed flag.")
        }
    }
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

#[cfg(not(feature = "threed-only"))]
async fn run(scene_path: PathBuf, width: u32, height: u32, debug_config: debug::DebugConfig) -> anyhow::Result<()> {
    log::info!("Initializing Vibe Coder Engine...");

    // Create event loop
    let event_loop = winit::event_loop::EventLoop::new();

    // Create the app
    let app = app::App::new(scene_path, width, height, debug_config, &event_loop).await?;

    log::info!("Entering render loop...");
    app.run(event_loop);

    Ok(())
}

async fn run_threed(args: Args) -> anyhow::Result<()> {
    log::info!("Initializing three-d renderer...");

    // Create event loop
    let event_loop = winit::event_loop::EventLoop::new();

    // Check if a scene was specified
    let app = if args.scene != "Default" {
        // Load specific scene
        let scene_path = resolve_scene_path(&args.scene)?;
        log::info!("Loading scene: {}", scene_path.display());
        app_threed::AppThreeD::with_scene(scene_path, args.width, args.height, &event_loop)?
    } else {
        // Use test scene (POC)
        log::info!("Using test scene (POC mode)");
        app_threed::AppThreeD::new(args.width, args.height, &event_loop)?
    };

    log::info!("Entering render loop...");
    app.run(event_loop);

    Ok(())
}
