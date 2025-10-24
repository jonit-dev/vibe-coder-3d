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

## Mutable ECS Architecture

### SceneManager & Runtime Entity Mutations

The engine supports runtime entity creation, modification, and destruction through the **command buffer pattern** implemented in `vibe-ecs-manager`.

**Key Components:**

- `SceneManager`: Central coordinator for scene mutations
- `EntityCommandBuffer`: Queues deferred mutations (create, destroy, set component)
- `EntityBuilder`: Fluent API for entity creation
- `SceneState`: Thread-safe scene wrapper (`Arc<Mutex<RwLock<Scene>>>`)

**Pattern:**

```rust
// Queue commands (non-blocking)
let entity_id = manager.create_entity()
    .with_name("Enemy")
    .with_position([0.0, 5.0, 0.0])
    .with_component("RigidBody", json!({ ... }))
    .build();  // Returns EntityId immediately

// Apply at frame end (atomic)
manager.apply_pending_commands()?;
```

**Physics Synchronization:**

- Lifecycle hooks (`on_entity_created`, `on_entity_destroyed`)
- Automatic physics world sync for entities with RigidBody/MeshCollider
- Uses ComponentRegistry for type-safe component decoding

**Documentation:**

- See `/rust/engine/crates/ecs-manager/CLAUDE.md` for full implementation details
- See `/rust/PRDs/mutable-ecs-architecture.md` for original PRD
- **35 tests** covering unit, integration, and stress scenarios

### GameObject Lua API

Runtime entity creation from scripts:

```lua
-- Create entity
local id = GameObject.create("Enemy")
GameObject.setPosition(id, {0, 5, 0})
GameObject.setRotation(id, {0, 45, 0})

-- Create primitive (Box, Sphere, Cylinder, Plane)
local cubeId = GameObject.createPrimitive("Cube", "MyCube")

-- Destroy entity
GameObject.destroy(id)
```

**Implementation**: `/rust/engine/src/apis/gameobject_api.rs`
**Thread Safety**: Uses `Arc<Mutex<SceneManager>>` for shared mutable access

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
