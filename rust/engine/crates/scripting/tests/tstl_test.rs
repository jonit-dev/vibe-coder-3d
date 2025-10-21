/// Test TypeScriptToLua module loading
use std::path::PathBuf;
use vibe_scripting::LuaScriptRuntime;

#[test]
fn test_load_tstl_rotating_cube() {
    // Find the actual transpiled script
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let rust_dir = manifest_dir
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let script_path = rust_dir.join("game/scripts/rotating-cube.lua");

    assert!(
        script_path.exists(),
        "rotating-cube.lua not found at {:?}",
        script_path
    );

    // Create runtime
    let runtime = LuaScriptRuntime::new().unwrap();

    // Try to load the script
    let result = runtime.load_script(&script_path);

    if let Err(ref e) = result {
        eprintln!("Failed to load script: {}", e);
        eprintln!("Error chain:");
        for cause in e.chain() {
            eprintln!("  - {}", cause);
        }
    }

    assert!(result.is_ok(), "Should successfully load TSTL module");

    let script = result.unwrap();

    // Verify it has onUpdate (the main function used in rotating-cube)
    assert!(script.has_on_update(), "Should have onUpdate function");
}
