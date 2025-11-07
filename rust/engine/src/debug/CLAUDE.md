# Debug Visualization Module

## Role

- Hosts lightweight helpers for drawing physics/debug overlays without polluting renderer logic.
- `mod.rs` simply re-exports `append_*` helpers so the rest of the engine depends on one module.

## Key Components

- `lines.rs`: Defines `LineBatch` and `LineVertex`. Treat it as an append-only buffer; clear it every frame to avoid unbounded GPU uploads.
- `colliders.rs`: Walks the Rapier `PhysicsWorld` to emit primitive wireframes. When adding a new collider type keep the conversion local and reuse `LineBatch` helpers (e.g. `add_sphere`) instead of baking geometry elsewhere.
- `grid.rs`: Responsible only for ground-plane guides. Anything camera-dependent belongs in renderer debug overlays instead.

## Usage Notes

- Build the line batch on the CPU side, then feed it into `renderer::debug_lines::DebugLineRenderer`.
- Avoid borrowing Rapier structures for longer than necessary; iterate, emit lines, drop borrows before rendering to keep physics and render phases decoupled.
- Keep colors/constants centralized here to maintain consistent debugging palette across HUDs.
