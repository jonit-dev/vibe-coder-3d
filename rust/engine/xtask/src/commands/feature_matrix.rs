use anyhow::Result;

pub fn run() -> Result<()> {
    println!("🎯 Vibe Coder Engine - Feature Matrix");
    println!();

    println!("📦 FEATURE PRESETS:");
    println!();

    print_preset(
        "default",
        "Full-featured build with all modules",
        &["renderer", "physics", "scripting", "audio", "gltf"],
    );

    print_preset("minimal", "Bare minimum - renderer only", &["renderer"]);

    print_preset(
        "renderer",
        "Rendering + asset loading",
        &["renderer", "gltf-support"],
    );

    print_preset(
        "full",
        "Everything enabled explicitly",
        &[
            "renderer",
            "physics",
            "scripting-support",
            "audio-support",
            "gltf-support",
        ],
    );

    println!();
    println!("🔧 AVAILABLE FEATURES:");
    println!();

    print_feature("renderer", "Three-d rendering engine (always recommended)");
    print_feature("physics", "Rapier3D physics simulation");
    print_feature("scripting-support", "Lua scripting runtime (mlua + LuaJIT)");
    print_feature(
        "scripting-hot-reload",
        "Hot reload for Lua scripts (requires scripting-support)",
    );
    print_feature("audio-support", "Spatial audio system (rodio)");
    print_feature("gltf-support", "GLTF model loading");
    print_feature(
        "bvh-acceleration",
        "BVH acceleration structures (experimental)",
    );

    println!();
    println!("💡 USAGE EXAMPLES:");
    println!();
    println!("  # Build with minimal features");
    println!("  cargo xtask build-metrics --preset minimal");
    println!();
    println!("  # Build custom feature set");
    println!("  cargo build --no-default-features --features renderer,physics");
    println!();
    println!("  # Build for distribution");
    println!("  cargo build --profile dist --features full");
    println!();

    Ok(())
}

fn print_preset(name: &str, description: &str, features: &[&str]) {
    println!("  {} → {}", name, description);
    println!("    Features: {}", features.join(", "));
    println!();
}

fn print_feature(name: &str, description: &str) {
    println!("  • {} - {}", name, description);
}
