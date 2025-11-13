use anyhow::{Context, Result};
use clap::Parser;
use std::path::PathBuf;
use std::time::Instant;

use crate::util::Cmd;

#[derive(Parser, Debug)]
pub struct BuildMetricsOptions {
    /// Profile to build with (dev, dev-fast, release, dist)
    #[arg(long, default_value = "dev")]
    pub profile: String,

    /// Feature preset (default, minimal, renderer, full)
    #[arg(long, default_value = "default")]
    pub preset: String,

    /// Enable cargo timings output
    #[arg(long, default_value = "true")]
    pub timings: bool,

    /// Output directory for metrics
    #[arg(long, default_value = "../../generated/build-metrics/latest")]
    pub output_dir: PathBuf,
}

pub fn run(opts: BuildMetricsOptions) -> Result<()> {
    println!("🔨 Running build metrics...");
    println!("  Profile: {}", opts.profile);
    println!("  Preset: {}", opts.preset);
    println!();

    // Create output directory
    std::fs::create_dir_all(&opts.output_dir).context("Failed to create output directory")?;

    // Get feature flags for the preset
    let features = get_preset_features(&opts.preset)?;

    // Build with timing
    let start = Instant::now();

    let mut build_cmd = Cmd::new("cargo");
    build_cmd.arg("build").arg("--bin").arg("vibe-engine");

    // Handle profile (dev is default, others use --profile)
    if opts.profile != "dev" {
        build_cmd.arg("--profile").arg(&opts.profile);
    }

    // Add features
    if !features.is_empty() {
        build_cmd.arg("--no-default-features");
        build_cmd.arg("--features").arg(&features.join(","));
    }

    // Enable cargo timings if requested
    if opts.timings {
        build_cmd.env("CARGO_TIMINGS", "html");
    }

    println!("📦 Building...");
    build_cmd.run().context("Build failed")?;

    let elapsed = start.elapsed();
    println!("✅ Build completed in {:.2}s", elapsed.as_secs_f64());

    // Get binary size
    let binary_path = get_binary_path(&opts.profile)?;
    if binary_path.exists() {
        let metadata = std::fs::metadata(&binary_path)?;
        let size_mb = metadata.len() as f64 / 1_048_576.0;
        println!("📊 Binary size: {:.2} MB", size_mb);

        // Write metrics to file
        let metrics_path = opts.output_dir.join("metrics.json");
        let metrics = serde_json::json!({
            "profile": opts.profile,
            "preset": opts.preset,
            "build_time_secs": elapsed.as_secs_f64(),
            "binary_size_bytes": metadata.len(),
            "binary_size_mb": size_mb,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        std::fs::write(&metrics_path, serde_json::to_string_pretty(&metrics)?)
            .context("Failed to write metrics file")?;

        println!("📝 Metrics written to: {}", metrics_path.display());
    }

    // Check for cargo timings output
    if opts.timings {
        let timings_path = PathBuf::from("target/cargo-timings/cargo-timing.html");
        if timings_path.exists() {
            let dest = opts.output_dir.join("cargo-timing.html");
            std::fs::copy(&timings_path, &dest)?;
            println!("⏱️  Timings HTML: {}", dest.display());
        }
    }

    println!();
    println!("✨ Build metrics complete!");

    Ok(())
}

fn get_preset_features(preset: &str) -> Result<Vec<String>> {
    match preset {
        "default" => Ok(vec![]),
        "minimal" => Ok(vec!["renderer".to_string()]),
        "renderer" => Ok(vec!["renderer".to_string(), "gltf-support".to_string()]),
        "full" => Ok(vec![
            "renderer".to_string(),
            "physics".to_string(),
            "scripting-support".to_string(),
            "audio-support".to_string(),
            "gltf-support".to_string(),
        ]),
        _ => anyhow::bail!("Unknown preset: {}", preset),
    }
}

fn get_binary_path(profile: &str) -> Result<PathBuf> {
    match profile {
        "dev" => Ok(PathBuf::from("target/debug/vibe-engine")),
        "release" | "dist" => Ok(PathBuf::from("target/release/vibe-engine")),
        _ => Ok(PathBuf::from(format!("target/{}/vibe-engine", profile))),
    }
}
