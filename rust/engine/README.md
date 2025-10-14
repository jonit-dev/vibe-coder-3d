# Rust Engine - Quick Reference

## Quickstart

```bash
# 1. Build the engine (first time takes 5-10 minutes)
yarn rust:build

# 2. Run with test scene (shows colored materials)
yarn rust:engine --scene MaterialTest

# 3. Run with default scene
yarn rust:engine --scene Default

# 4. Run tests to verify everything works
yarn rust:test
```

## Available Commands

| Command                           | Description                   | Speed            |
| --------------------------------- | ----------------------------- | ---------------- |
| `yarn rust:engine --scene <name>` | Run the engine with a scene   | Instant          |
| `yarn rust:build`                 | Build the engine              | 1-5s incremental |
| `yarn rust:test`                  | Run all unit tests (24 tests) | ~1s              |
| `yarn rust:export-schemas`        | Export TS schemas to Rust     | ~1s              |

## Running the Engine

```bash
# Basic usage
yarn rust:engine --scene MaterialTest

# Custom window size
yarn rust:engine --scene Default --width 1920 --height 1080

# All options
yarn rust:engine --scene <SceneName> --width <pixels> --height <pixels>
```

**Controls:**

- `ESC` - Close window
- No camera controls yet (coming soon)

## Development Workflow

### Fast iteration cycle:

```bash
# 1. Edit Rust code in rust/engine/src/
# 2. Build (only changed files recompile - usually 1-5 seconds)
yarn rust:build

# 3. Run to test
yarn rust:engine --scene MaterialTest

# 4. Run tests if you changed logic
yarn rust:test
```

### Faster than full build:

```bash
# Just check for errors (doesn't produce binary, but much faster)
cd rust/engine && cargo check
```

## Build Times Explained

**Why is the first build so slow?**

- Compiles 100+ dependencies (wgpu, winit, serde, etc.)
- Only happens once (or after `cargo clean`)
- ~5-10 minutes depending on your machine

**After the first build:**

- Only changed files recompile
- Usually 1-5 seconds
- Rust uses incremental compilation automatically

**Tips to speed up builds:**

1. Install `mold` linker: `sudo apt install mold` (2-3x faster linking)
2. Use `cargo check` for quick error checking
3. Use `cargo watch` for auto-rebuild on file save

## Scene Files

Scenes are JSON files in `rust/game/scenes/`:

- `Default.json` - Basic test scene
- `MaterialTest.json` - Shows material colors (red cube, green sphere, blue cube)

**Create your own:**

```json
{
  "metadata": {
    "name": "My Scene",
    "version": 1,
    "timestamp": "2025-10-14T00:00:00.000Z"
  },
  "entities": [
    {
      "name": "Red Cube",
      "components": {
        "Transform": {
          "position": [0, 0, 0],
          "rotation": [0, 0, 0, 1],
          "scale": [1, 1, 1]
        },
        "MeshRenderer": {
          "meshId": "cube",
          "materialId": "red-material"
        }
      }
    }
  ],
  "materials": [
    {
      "id": "red-material",
      "color": "#ff0000",
      "metallic": 0.5,
      "roughness": 0.3
    }
  ]
}
```

## What's Implemented

✅ Scene loading from JSON
✅ Entity Component System (Transform, MeshRenderer, Camera)
✅ Material system (PBR: color, metallic, roughness)
✅ Camera component parsing from scenes
✅ Basic PBR lighting
✅ Primitive meshes (cube, sphere, plane)
✅ 24 unit tests with full coverage

## Common Issues

### "Scene not found"

- Check file exists: `rust/game/scenes/<SceneName>.json`
- Scene names are case-sensitive
- No `.json` extension in the command

### Build fails with "cannot find -lanstyle"

```bash
cd rust/engine
rm -rf target
yarn rust:build
```

### Slow every time I build

- First build is always slow (compiling dependencies)
- If every build is slow, check if `target/` directory is being deleted
- Incremental builds should be 1-5 seconds

## Project Structure

```
rust/engine/
├── src/
│   ├── main.rs              # CLI entrypoint
│   ├── app.rs               # Main application loop
│   ├── io/loader.rs         # Scene JSON loading
│   ├── ecs/
│   │   ├── scene.rs         # SceneData, Entity, Metadata
│   │   └── components/      # Transform, MeshRenderer, Camera
│   ├── render/
│   │   ├── renderer.rs      # wgpu initialization
│   │   ├── material.rs      # Material, MaterialCache
│   │   ├── camera.rs        # Camera view/projection
│   │   ├── shader.wgsl      # GPU shader (PBR lighting)
│   │   ├── pipeline.rs      # Render pipeline, InstanceRaw
│   │   ├── scene_renderer.rs # Scene → GPU rendering
│   │   └── primitives.rs    # Cube, sphere, plane meshes
│   └── util/time.rs         # FPS counter
├── Cargo.toml               # Dependencies
└── .cargo/config.toml       # Build optimizations

rust/game/
├── scenes/                  # Scene JSON files
└── schema/                  # TypeScript → Rust schema exports
```

## Debugging

```bash
# See detailed logs
RUST_LOG=debug yarn rust:engine --scene Default

# Very verbose logging
RUST_LOG=trace yarn rust:engine --scene Default

# Show stack trace on crash
RUST_BACKTRACE=1 yarn rust:engine --scene Default

# Combine both
RUST_BACKTRACE=1 RUST_LOG=debug yarn rust:engine --scene Default
```

## Testing

```bash
# Run all tests
yarn rust:test

# Run specific test
cd rust/engine
cargo test test_material_cache

# Run tests with output
cargo test -- --nocapture

# Run tests matching pattern
cargo test material
```

## Code Quality

```bash
# Format code
cd rust/engine && cargo fmt

# Check for issues
cargo clippy

# Fix simple warnings automatically
cargo fix --bin "vibe-engine"
```

## Roadmap (from PRD)

**Phase 4-5 (Next):**

- [ ] Entity hierarchy (parent-child transforms)
- [ ] GLTF model loading
- [ ] Light component rendering
- [ ] Physics integration
- [ ] More component types

**Future:**

- [ ] Hot reloading
- [ ] Camera controls
- [ ] Multiple render passes
- [ ] Post-processing effects

## Performance

Current performance:

- 60 FPS target
- ~100-200 entities before optimization needed
- Materials are per-instance (efficient)
- Meshes are cached and shared

## Architecture Notes

**Data Flow:**

1. JSON Scene → `SceneData` (via serde)
2. `SceneData` → `SceneRenderer` (parse entities/materials)
3. `SceneRenderer` → GPU buffers (vertex + instance data)
4. Render loop → wgpu draw calls → screen

**Key Design Decisions:**

- Materials passed as per-instance data (not textures yet)
- Camera settings applied at initialization (not runtime updates yet)
- Primitive meshes generated procedurally
- All tests use JSON parsing (ensures schema compatibility)

## Getting Help

1. Check this README
2. Read the code comments
3. Run tests: `yarn rust:test`
4. Check `INTEGRATION_AUDIT.md` for current status
5. See `docs/PRDs/4-60-rust-engine-basics.md` for full requirements
