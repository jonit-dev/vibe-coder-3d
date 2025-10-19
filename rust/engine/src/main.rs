use clap::Parser;
use std::path::PathBuf;

mod app_threed;
mod debug;
mod ecs;
mod io;
mod renderer;
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
}

fn main() -> anyhow::Result<()> {
    // Load .env early; ignore if missing
    let _ = dotenvy::dotenv();

    // Parse CLI arguments
    let args = Args::parse();

    // Initialize logger
    let filter = if args.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(filter)).init();

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
    let app = if args.scene != "Default" {
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

    // Handle screenshot mode
    if args.screenshot {
        let output_path = if let Some(path) = args.screenshot_path {
            path
        } else {
            // Default screenshot path: screenshots/<scene_name>.png
            let scene_name = if args.scene != "Default" {
                args.scene.replace(".tsx", "").replace(".json", "")
            } else {
                "Default".to_string()
            };
            PathBuf::from(format!("screenshots/{}.png", scene_name))
        };

        return app.screenshot(output_path);
    }

    log::info!("Entering render loop...");
    app.run(event_loop);

    Ok(())
}
