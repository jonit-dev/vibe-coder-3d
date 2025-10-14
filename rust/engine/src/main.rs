use clap::Parser;
use std::path::PathBuf;

mod app;
mod assets;
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
}

fn main() -> anyhow::Result<()> {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let args = Args::parse();

    // Resolve scene path
    let scene_path = resolve_scene_path(&args.scene)?;
    log::info!("Loading scene from: {}", scene_path.display());

    // Run the application
    pollster::block_on(run(scene_path, args.width, args.height))
}

fn resolve_scene_path(scene: &str) -> anyhow::Result<PathBuf> {
    let path = PathBuf::from(scene);

    // If it's already a valid path with extension, use it directly
    if path.extension().is_some() && path.exists() {
        return Ok(path);
    }

    // Otherwise, treat it as a scene name and look in rust/game/scenes/
    let scene_dir = PathBuf::from("rust/game/scenes");
    let scene_file = scene_dir.join(format!("{}.json", scene));

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

async fn run(scene_path: PathBuf, width: u32, height: u32) -> anyhow::Result<()> {
    log::info!("Initializing Vibe Coder Engine...");

    // Create event loop
    let event_loop = winit::event_loop::EventLoop::new()
        .map_err(|e| anyhow::anyhow!("Failed to create event loop: {}", e))?;

    // Create the app
    let app = app::App::new(scene_path, width, height, &event_loop).await?;

    log::info!("Entering render loop...");
    app.run(event_loop)?;

    Ok(())
}
