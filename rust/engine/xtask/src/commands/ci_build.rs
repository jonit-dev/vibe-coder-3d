use anyhow::{Context, Result};
use clap::Parser;

use crate::util::Cmd;

#[derive(Parser, Debug)]
pub struct CiBuildOptions {
    /// Profile to build with (dev-fast, dist)
    #[arg(long, default_value = "dev-fast")]
    pub profile: String,

    /// Feature preset (minimal, default, full)
    #[arg(long, default_value = "default")]
    pub preset: String,

    /// Skip cargo-chef steps (for local testing)
    #[arg(long, default_value = "false")]
    pub skip_chef: bool,
}

pub fn run(opts: CiBuildOptions) -> Result<()> {
    println!("🚀 CI-optimized build");
    println!("  Profile: {}", opts.profile);
    println!("  Preset: {}", opts.preset);
    println!();

    // Check for sccache
    if check_sccache() {
        println!("✅ sccache detected");
    } else {
        println!("⚠️  sccache not found - builds will be slower");
        println!("   Install with: cargo install sccache");
    }

    // Run cargo-chef if not skipped
    if !opts.skip_chef && check_cargo_chef() {
        println!("\n📋 Preparing dependency recipe...");
        Cmd::new("cargo")
            .arg("chef")
            .arg("prepare")
            .arg("--recipe-path")
            .arg("target/recipe.json")
            .run()
            .context("Failed to prepare recipe")?;

        println!("🍳 Cooking dependencies...");
        let mut cook_cmd = Cmd::new("cargo");
        cook_cmd
            .arg("chef")
            .arg("cook")
            .arg("--recipe-path")
            .arg("target/recipe.json");

        if opts.profile != "dev" {
            cook_cmd.arg("--profile").arg(&opts.profile);
        }

        cook_cmd.run().context("Failed to cook dependencies")?;
        println!("✅ Dependencies cached");
    } else if !opts.skip_chef {
        println!("⚠️  cargo-chef not found - skipping dependency caching");
        println!("   Install with: cargo install cargo-chef");
    }

    // Build the project
    println!("\n🔨 Building project...");
    let mut build_cmd = Cmd::new("cargo");
    build_cmd.arg("build").arg("--bin").arg("vibe-engine");

    if opts.profile != "dev" {
        build_cmd.arg("--profile").arg(&opts.profile);
    }

    // Get features for preset
    let features = get_preset_features(&opts.preset)?;
    if !features.is_empty() {
        build_cmd.arg("--no-default-features");
        build_cmd.arg("--features").arg(&features.join(","));
    }

    build_cmd.run().context("Build failed")?;

    println!("\n✨ CI build complete!");

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

fn check_sccache() -> bool {
    std::process::Command::new("sccache")
        .arg("--version")
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}

fn check_cargo_chef() -> bool {
    std::process::Command::new("cargo")
        .arg("chef")
        .arg("--version")
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}
