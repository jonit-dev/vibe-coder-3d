# Three-D Orchestration

## Mandate

- Glue layer that wires ECS scenes + renderer modules into the three-d runtime. These files should contain orchestration only—heavy logic belongs under `src/renderer` or `src/spatial`.

## Key Pieces

- `threed_renderer.rs`: Entry point invoked by CLI. Enforces the "thin orchestrator" rule from `/rust/engine/CLAUDE.md`. When adding new behavior, ask “can this live in renderer::\*?” before touching the file.
- `threed_render_coordinator.rs`: Renders cameras in depth order, handles post-processing, screenshot coordination, and debug overlays. It never owns data; it queries `ThreeD*Manager` helpers.
- `threed_camera_manager.rs`, `threed_mesh_manager.rs`, `threed_light_manager.rs`: Bridge ECS data to three-d handles. They own GPU resources and expose read-only slices used by the coordinator.
- `threed_context_state.rs`: Holds references to context-wide objects (skybox renderer, debug line renderer) so they can be reused across frames.
- `threed_scene_loader_state.rs`: Drives scene loading on a background step; orchestrates renderer::scene_loader and swaps in the resulting managers atomically.

## Workflow Tips

- Keep manager structs `Send + Sync` where possible; scene loading can happen off-thread.
- When state mutations must cross threads, pass through `SceneManager`/`EntityCommandBuffer` rather than mutating managers directly.
- Add tests under `threed_renderer_test.rs` to lock in orchestration behavior (camera sort order, render-state filtering) before changing flow control.
