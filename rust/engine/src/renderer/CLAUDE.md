# Renderer Modules

## Scope

- Everything here is **specialized rendering logic** that the `threed` orchestrators delegate to. Keep code focused: load/convert assets, manage GPU state, expose utilities. Orchestration belongs in `src/threed`.

## Common Services

- `material_manager.rs`: Central cache for `vibe_assets::Material` ⇒ `three_d::PhysicalMaterial`. All material mutations go through it; renderer code should never instantiate materials directly.
- `mesh_loader.rs` / `instanced_loader.rs`: Handle mesh creation and per-entity GPU handles. Use `mesh_filtering.rs` to compute visibility instead of duplicating boolean logic.
- `camera_loader.rs`, `light_loader.rs`: Convert ECS components, enforce defaults, and encapsulate Three.js → three-d conversions.
- `post_processing.rs` + `post_process_targets.rs`: Apply screen-space passes (color grading, bloom). When adding a pass, connect it here and keep the coordinator thin.
- `physics_sync.rs`: The only place where renderer touches Rapier transforms; expand this module instead of patching `threed_renderer.rs`.
- `lod_manager.rs` / `lod_selector.rs`: Resolve mesh asset paths and quality tiers. Always normalize paths through `get_lod_path_internal` to keep cache keys stable.
- `bvh_debug.rs`, `debug_lines.rs`: Feed debug data into `threed` render passes without leaking three-d internals back upward.

## Guidelines

- Each file should serve one responsibility; when a struct starts coordinating multiple subsystems, move it into `src/threed`.
- New renderer utilities must be unit-tested (`*_test.rs`) and fuzzed with representative scene snippets. For tight loops (LOD, culling) add benches if regressions are suspected.
- Never hold long-lived borrows of the scene graph here—consume primitive data (ids, transforms, materials) and drop the borrow before GPU work begins.

## Integration Points

- `renderer::scene_loader` is invoked from `threed_scene_loader_state` to translate ECS scenes into handles managed by `ThreeD*Manager` structs.
- `renderer::lighting::collect_lights` feeds `ThreeDRenderCoordinator` when sorting by camera depth.
- BVH support flows from `spatial::bvh_manager` → `renderer::mesh_filtering` → `threed_mesh_manager::get_visible_mesh_indices_with_camera`.
