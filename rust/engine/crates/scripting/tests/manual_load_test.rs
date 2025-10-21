use std::path::PathBuf;
use vibe_scripting::LuaScriptRuntime;

#[test]
fn test_manually_load_moving_sphere() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let rust_dir = manifest_dir
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let script_path = rust_dir.join("game/scripts/moving-sphere.lua");

    eprintln!("Loading script from: {:?}", script_path);
    assert!(script_path.exists(), "Script file must exist");

    let runtime = LuaScriptRuntime::new().unwrap();
    let result = runtime.load_script(&script_path);

    if let Err(ref e) = result {
        eprintln!("Error loading moving-sphere.lua:");
        eprintln!("  {}", e);
        for cause in e.chain().skip(1) {
            eprintln!("  Caused by: {}", cause);
        }
    }

    assert!(result.is_ok(), "Should load moving-sphere.lua successfully");
    let script = result.unwrap();
    assert!(script.has_on_update(), "Should have onUpdate function");

    eprintln!("✓ moving-sphere.lua loaded successfully");
}
