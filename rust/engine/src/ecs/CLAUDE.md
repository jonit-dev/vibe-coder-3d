# ECS Bridge Layer

## Purpose

- Thin compatibility layer so legacy engine code can depend on `vibe_scene`/`vibe_ecs_bridge` without importing crates everywhere.
- Hosts decoded component structs plus smoke-tests that verify JSON ↔ Rust parity.

## Structure

- `mod.rs`: re-exports `SceneData`, `EntityId`, `ComponentRegistry`, etc. Treat this as the single include point for renderer/threed modules.
- `components/`: Each Rust struct mirrors the TS editor component schema (Camera, Light, MeshRenderer, Transform). Keep serialization logic colocated with per-component tests (`*_test.rs`) to catch drift early.
- `scene.rs`: Kept only for backwards compatibility; do not add new logic here—use the crates directly.

## Gotchas

- Decoder code should never mutate scenes in place; rely on `vibe_scene::Scene::normalize` before decoding.
- When introducing a new component type, update `vibe_ecs_bridge` first, then expose it here via `pub use`.
- Tests under this folder run as part of `cargo test --lib`; add focused unit tests instead of relying on integration coverage.
