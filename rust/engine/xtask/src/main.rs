use anyhow::Result;
use clap::{Parser, Subcommand};

mod commands;
mod util;

#[derive(Parser)]
#[command(name = "xtask")]
#[command(about = "Build tooling and metrics for vibe-coder-engine", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Capture build metrics (timings, size, bloat analysis)
    BuildMetrics(commands::build_metrics::BuildMetricsOptions),

    /// Generate size report and binary diff
    SizeReport(commands::size_report::SizeReportOptions),

    /// Display feature matrix and presets
    FeatureMatrix,

    /// CI-optimized build with caching
    CiBuild(commands::ci_build::CiBuildOptions),
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::BuildMetrics(opts) => commands::build_metrics::run(opts),
        Command::SizeReport(opts) => commands::size_report::run(opts),
        Command::FeatureMatrix => commands::feature_matrix::run(),
        Command::CiBuild(opts) => commands::ci_build::run(opts),
    }
}
