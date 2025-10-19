# Vibe Coder Engine Architecture

## Overview

This is the main Rust rendering engine that bridges the TypeScript editor with native GPU rendering via three-d.

## ⚠️ CRITICAL: Renderer Architecture and SRP

### threed_renderer.rs Status

**CURRENT SIZE**: 686 lines (OVER 500-line limit!)
**METHODS**: 19
**STATUS**: ⚠️ **REFACTORING NEEDED**

### Core Principle: Orchestration, Not Implementation

`ThreeDRenderer` should be a **thin orchestration layer** that delegates to specialized modules:

```
ThreeDRenderer (thin orchestration)
    ├── MaterialManager (src/renderer/material_manager.rs)
    ├── SkyboxRenderer (src/renderer/skybox.rs)
    ├── SceneGraph (vibe-scene-graph crate)
    ├── camera_loader (src/renderer/camera_loader.rs)
    ├── mesh_loader (src/renderer/mesh_loader.rs)
    ├── light_loader (src/renderer/light_loader.rs)
    └── post_processing (src/renderer/post_processing.rs) ← NEW
```

### Strict Rules

**❌ NEVER add to threed_renderer.rs:**

- New processing logic (extract to module)
- Helper functions >10 lines (extract to module)
- New resource management (create manager struct)
- Inline algorithms (extract to dedicated module)

**✅ ALWAYS delegate:**

- Material operations → `MaterialManager`
- Skybox rendering → `SkyboxRenderer`
- Mesh loading → `mesh_loader::load_mesh_renderer()`
- Light setup → `light_loader::load_light()`
- Camera setup → `camera_loader::load_camera()`
- Post-processing → `PostProcessor` (when implemented)

### Current Violations (Need Refactoring)

1. **`sync_physics_transforms`** (30 lines) - Should be in `physics_sync.rs`
2. **`capture_window_screenshot`** (35 lines) - Should be in `util/screenshot.rs`
3. **Inline scene loading logic** - Should delegate more to `scene_loader.rs`

### Hard Limits

- **File size**: Max 700 lines before mandatory refactoring
- **Method size**: Max 50 lines (extract helpers if larger)
- **Struct fields**: If adding >2 new fields, create a manager struct instead

### Refactoring Checklist

Before adding ANY code to `threed_renderer.rs`:

- [ ] Is this pure orchestration? (calling other modules)
- [ ] Could this be a function in an existing module?
- [ ] Would this create a new responsibility?
- [ ] Would this add >20 lines to the file?

If ANY checkbox is NO → **Extract to a module!**

## Module Structure

```
src/
├── threed_renderer.rs        (686 lines) ⚠️ Orchestration only
├── renderer/                 ✅ Specialized modules
│   ├── camera_loader.rs      (100 lines) ✅
│   ├── material_manager.rs   (150 lines) ✅
│   ├── mesh_loader.rs        (90 lines) ✅
│   ├── light_loader.rs       (140 lines) ✅
│   ├── skybox.rs             (314 lines) ✅
│   ├── post_processing.rs    (300 lines) ⚠️ Needs API fixes
│   ├── enhanced_lights.rs    (200 lines) ✅
│   └── ...
└── util/
    └── (extract screenshot.rs here)
```

## Integration Status

See `/rust/engine/INTEGRATION_AUDIT.md` for full TypeScript ↔ Rust parity status.

## Testing

All modules must have unit tests in `<module>_test.rs` files.

Run tests:

```bash
cargo test --lib
```

## Related Documentation

- `/rust/CLAUDE.md` - General Rust guidelines
- `/rust/engine/INTEGRATION_AUDIT.md` - TS/Rust parity tracking
- `/rust/engine/THREE_D_MIGRATION_PRD.md` - Migration plan
