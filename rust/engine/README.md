# Vibe Coder 3D Engine (Rust)

Native renderer for Vibe Coder 3D scenes, built with Rust, wgpu, and winit.

## Overview

This is a minimal, high-performance Rust engine that consumes scene JSON files exported from the TypeScript editor and renders them natively using wgpu (WebGPU).

## Features

- **Scene Loading**: Loads uncompressed scene JSON from `rust/game/scenes/`
- **ECS Data Models**: Supports Transform, MeshRenderer, and extensible component system
- **GPU Rendering**: Uses wgpu for cross-platform GPU rendering
- **CLI Interface**: Simple command-line interface for scene selection
- **Performance Monitoring**: Built-in FPS counter and frame timing

## Building

```bash
# From project root
cargo build --manifest-path rust/engine/Cargo.toml

# Or using yarn
yarn rust:engine
```

## Running

```bash
# Run with default scene
cargo run --manifest-path rust/engine/Cargo.toml

# Run specific scene
cargo run --manifest-path rust/engine/Cargo.toml -- --scene Test

# Or using yarn
yarn rust:engine --scene Test

# Custom window size
yarn rust:engine --scene Test --width 1920 --height 1080
```

## Scene Format

The engine consumes full (uncompressed) scene JSON files. Example structure:

```json
{
  "metadata": {
    "name": "Test",
    "version": 1,
    "timestamp": "2025-10-14T00:00:00.000Z"
  },
  "entities": [
    {
      "persistentId": "entity-1",
      "name": "Test Entity",
      "components": {
        "Transform": {
          "position": [0, 0, 0],
          "rotation": [0, 0, 0, 1],
          "scale": [1, 1, 1]
        },
        "MeshRenderer": {
          "meshId": "cube",
          "materialId": "default",
          "enabled": true
        }
      }
    }
  ],
  "materials": [],
  "prefabs": []
}
```

## Architecture

```
rust/engine/
├── src/
│   ├── main.rs              # CLI entrypoint
│   ├── app.rs               # Application lifecycle
│   ├── io/
│   │   └── loader.rs        # JSON scene loading
│   ├── ecs/
│   │   ├── scene.rs         # Scene data models
│   │   └── components/
│   │       ├── transform.rs    # Transform component
│   │       └── mesh_renderer.rs # MeshRenderer component
│   ├── render/
│   │   ├── renderer.rs      # wgpu renderer
│   │   └── camera.rs        # Camera system
│   ├── assets/              # Asset loading (future)
│   └── util/
│       └── time.rs          # Frame timing
```

## Development Roadmap

### Phase 1-3: ✅ Complete
- ✅ Project structure and dependencies
- ✅ CLI with scene loading
- ✅ ECS data models
- ✅ wgpu initialization
- ✅ Window and event loop
- ✅ Clear screen render loop with timing

### Phase 4-5: 🚧 In Progress
- 🚧 Mesh cache and primitive generation
- 🚧 Material pipeline (unlit/PBR)
- 🚧 Scene entity instantiation
- 🚧 Transform hierarchy
- 🚧 Full scene rendering

### Phase 6: 📋 Planned
- 📋 Asset loading (GLTF models)
- 📋 Advanced materials
- 📋 Lighting system
- 📋 Camera controls

## Dependencies

- **wgpu** - Cross-platform GPU API
- **winit** - Window creation and event handling
- **glam** - Math library (vectors, matrices, quaternions)
- **serde/serde_json** - JSON serialization
- **anyhow/thiserror** - Error handling
- **log/env_logger** - Logging
- **clap** - CLI argument parsing

## Performance

Target: 60 FPS on modest hardware with small-to-medium scenes.

Current status: Clear screen loop running at full refresh rate (Phase 3 complete).

## License

Part of Vibe Coder 3D project.
