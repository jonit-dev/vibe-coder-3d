use anyhow::{Context, Result};
use clap::Parser;
use std::path::PathBuf;

use crate::util::Cmd;

#[derive(Parser, Debug)]
pub struct SizeReportOptions {
    /// Profile to analyze (dev, release, dist)
    #[arg(long, default_value = "release")]
    pub profile: String,

    /// Output directory for report
    #[arg(long, default_value = "../../generated/build-metrics/latest")]
    pub output_dir: PathBuf,
}

pub fn run(opts: SizeReportOptions) -> Result<()> {
    println!("📏 Generating size report...");
    println!("  Profile: {}", opts.profile);
    println!();

    // Create output directory
    std::fs::create_dir_all(&opts.output_dir).context("Failed to create output directory")?;

    // Get binary path
    let binary_path = get_binary_path(&opts.profile)?;
    if !binary_path.exists() {
        anyhow::bail!(
            "Binary not found: {}. Please build first.",
            binary_path.display()
        );
    }

    // Get binary size
    let metadata = std::fs::metadata(&binary_path)?;
    let size_mb = metadata.len() as f64 / 1_048_576.0;
    println!("📦 Binary: {}", binary_path.display());
    println!("📊 Size: {:.2} MB ({} bytes)", size_mb, metadata.len());

    // Try to run cargo-bloat if available
    if check_cargo_bloat() {
        println!("\n🔍 Running cargo bloat analysis...");

        let bloat_output = opts.output_dir.join("bloat-crates.txt");
        let mut bloat_cmd = Cmd::new("cargo");
        bloat_cmd
            .arg("bloat")
            .arg("--release")
            .arg("--crates")
            .arg("-n")
            .arg("20");

        match bloat_cmd.run_piped_to_file(&bloat_output) {
            Ok(_) => println!("✅ Bloat report: {}", bloat_output.display()),
            Err(e) => println!("⚠️  Bloat analysis failed: {}", e),
        }
    } else {
        println!("\n⚠️  cargo-bloat not installed. Install with:");
        println!("    cargo install cargo-bloat");
    }

    // Generate summary report
    let report_path = opts.output_dir.join("size-report.json");
    let report = serde_json::json!({
        "profile": opts.profile,
        "binary_path": binary_path.display().to_string(),
        "size_bytes": metadata.len(),
        "size_mb": size_mb,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    });

    std::fs::write(&report_path, serde_json::to_string_pretty(&report)?)
        .context("Failed to write report")?;

    println!("\n📝 Report written to: {}", report_path.display());
    println!("✨ Size report complete!");

    Ok(())
}

fn get_binary_path(profile: &str) -> Result<PathBuf> {
    match profile {
        "dev" => Ok(PathBuf::from("target/debug/vibe-engine")),
        "release" | "dist" => Ok(PathBuf::from("target/release/vibe-engine")),
        _ => Ok(PathBuf::from(format!("target/{}/vibe-engine", profile))),
    }
}

fn check_cargo_bloat() -> bool {
    std::process::Command::new("cargo")
        .arg("bloat")
        .arg("--version")
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}
