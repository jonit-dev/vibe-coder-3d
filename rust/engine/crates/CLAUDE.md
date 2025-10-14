# Engine Crates

This directory contains internal workspace crates that modularize the engine architecture.

## Structure

- **scene/** - Stable scene model with typed entity/component abstractions
- **ecs-bridge/** - Component registry and decoders for Three.js ECS integration
- **scene-graph/** (planned) - Parent/child DAG and transform propagation
- **assets/** (planned) - Mesh/texture/material caches and loaders
- **render-core/** (planned) - Device, buffers, and common GPU resources
- **render-graph/** (planned) - Pass graph and resource scheduling
- **passes/** (planned) - Individual render passes (geometry, shadow, skybox, post)
- **wasm-bridge/** (planned) - WASM/native live-sync bridge for editor integration

## Design Principles

- **Single Responsibility**: Each crate has one clear purpose
- **Incremental Migration**: Extract from monolithic `src/` gradually
- **Backward Compatibility**: Re-export from engine main for existing code
- **Stable APIs**: Internal crate APIs should remain stable across features
- **Test Coverage**: Each crate must have comprehensive unit tests

## Current Status

### ✅ Implemented

- `vibe-scene`: Stable EntityId, Scene, Entity, and ComponentKindId types
- `vibe-ecs-bridge`: ComponentRegistry, IComponentDecoder trait, decoders for Transform/Camera/Light/MeshRenderer/Material

### 🚧 In Progress

- Integrating registry-backed parsing into main engine

### 📋 Planned

- scene-graph, assets, render-core, render-graph, passes, wasm-bridge crates

## Usage

Add as workspace dependencies in `/rust/engine/Cargo.toml`:

```toml
[dependencies]
vibe-scene = { path = "crates/scene" }
vibe-ecs-bridge = { path = "crates/ecs-bridge" }
```

## Inter-Crate Dependencies

```
vibe-scene (base types)
    ↓
vibe-ecs-bridge (depends on scene)
    ↓
engine (uses both)
```

Keep dependencies acyclic. scene should have no internal dependencies, ecs-bridge can depend on scene, etc.
