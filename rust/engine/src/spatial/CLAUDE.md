# Spatial Acceleration

## Purpose

- Houses BVH implementations and geometric helpers used by both the renderer and scripting APIs (raycasts, culling, visibility debugging).

## Modules

- `mesh_bvh.rs`: Builds per-mesh acceleration structures. Split strategies live here (`SplitStrategy::Sah` etc.)—tune them in isolation before touching higher layers.
- `scene_bvh.rs`: Manages top-level BVH over entity references. Works hand-in-hand with `BvhManager` to refit or rebuild when transforms change.
- `bvh_manager.rs`: Orchestrates registration, transform updates, and exposes metrics. Renderer code queries it through `ThreeDMeshManager` to get culled mesh indices.
- `intersect.rs` + `primitives.rs`: Math utilities (AABB, rays, triangle tests). Keep them dependency-free so they can be reused in scripting or tooling crates.
- `scripting_adapter.rs`: Light wrapper that exposes BVH raycasts to Lua without leaking internal types.

## Operational Notes

- BVH activation is gated by `util::bvh_config`; always check `bvh_enabled()` before doing heavy work so builds without the feature stay cheap.
- Keep rebuild thresholds conservative—`BvhManager::update_transform` already filters out tiny changes. If you need stricter tolerances, make them configurable rather than hardcoding.
- When debugging culling, enable the `bvh_debug` renderer module to print hit/miss stats before instrumenting the core BVH math.
