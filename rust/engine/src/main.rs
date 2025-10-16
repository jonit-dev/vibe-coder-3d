use clap::Parser;
use std::path::PathBuf;

mod app;
mod assets;
mod debug;
mod ecs;
mod io;
mod render;
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
}

fn main() -> anyhow::Result<()> {
    // Load .env early; ignore if missing
    let _ = dotenvy::dotenv();

    // Parse CLI arguments
    let args = Args::parse();

    // Create debug config (merges CLI and env)
    let debug_config = debug::DebugConfig::from_env_and_cli(args.debug);

    // Initialize logger with smart filtering
    // - Default: info level, but silence wgpu_core and wgpu_hal (too verbose)
    // - Debug mode: debug level for our code, info for wgpu
    // - Verbose flag: show everything including wgpu internals
    let filter = if args.verbose {
        // Verbose: show everything at debug/trace level
        if debug_config.is_enabled() {
            "debug,wgpu_core=debug,wgpu_hal=debug"
        } else {
            "info,wgpu_core=debug,wgpu_hal=debug"
        }
    } else {
        // Normal: silence noisy subsystems
        if debug_config.is_enabled() {
            "info,wgpu_core=warn,wgpu_hal=warn,naga=warn,cosmic_text=warn,vibe_engine::render::scene_renderer=warn"
        } else {
            "info,wgpu_core=warn,wgpu_hal=warn,naga=warn,cosmic_text=warn"
        }
    };

    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or(filter)
    ).init();

    // Resolve scene path
    let scene_path = resolve_scene_path(&args.scene)?;
    log::info!("Loading scene from: {}", scene_path.display());

    // Run the application
    pollster::block_on(run(scene_path, args.width, args.height, debug_config))
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

    // Look for the JSON file in rust/game/scenes/
    let scene_dir = PathBuf::from("rust/game/scenes");
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

async fn run(scene_path: PathBuf, width: u32, height: u32, debug_config: debug::DebugConfig) -> anyhow::Result<()> {
    log::info!("Initializing Vibe Coder Engine...");

    // Create event loop
    let event_loop = winit::event_loop::EventLoop::new()
        .map_err(|e| anyhow::anyhow!("Failed to create event loop: {}", e))?;

    // Create the app
    let app = app::App::new(scene_path, width, height, debug_config, &event_loop).await?;

    log::info!("Entering render loop...");
    app.run(event_loop)?;

    Ok(())
}
