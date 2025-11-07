# Rust BVH Reimplementation & Re‑Enablement PRD

Status: Draft  
Last Updated: 2025-11-07

## 1. Overview

### Context & Goals

- Re-enable BVH-based spatial acceleration in Rust for renderer culling and script raycasting with stability guarantees and guardrails.
- Replace O(n) visibility path in `threed_renderer.rs` with BVH-driven selection under feature/runtime toggles.
- Unify culling and ray queries via a single `BvhManager` lifecycle, instrumentation, and debug tooling.
- Deliver measurable speedups while preserving visual correctness and determinism.

### Current Pain Points

- BVH exists but is bypassed: `threed_renderer.rs` currently disables BVH/frustum culling to avoid regressions (gray scenes/stack overflows).
- Cargo feature `bvh-acceleration` exists but is not wired to code paths or cfg gates.
- Mixed/duplicated visibility logic; no runtime switch with safe fallback and metrics to validate.
- Risk of math instability (frustum extraction, recursion) and inadequate test coverage for edge scenes.

## 2. Proposed Solution

### High‑level Summary

- Gate all BVH usage behind a compile-time feature (`bvh-acceleration`) and a runtime switch (env/config) defaulting to safe fallback.
- Route renderer visibility through `VisibilityCuller` backed by `BvhManager`, with immediate fallback to linear filtering on anomalies.
- Harden math and traversal (iterative, epsilon-aware), add extensive metrics and debug logs for safe rollout.
- Integrate raycasting through scripting `query_api` backed by BVH, keeping physics raycasts as fallback.
- Add regression tests and benchmarks; ship with dashboards/log summaries for validation.

### Architecture & Directory Structure

```
rust/engine/
├── Cargo.toml                         # ensure [features] bvh-acceleration; runtime ENV toggle
├── src/
│  ├── spatial/
│  │  ├── bvh_manager.rs              # lifecycle + config + metrics (existing, keep)
│  │  ├── mesh_bvh.rs                 # per-mesh BVH (existing, harden traversal)
│  │  ├── scene_bvh.rs                # scene-level BVH (existing, verify/refit path)
│  │  ├── primitives.rs               # math helpers (existing)
│  │  └── intersect.rs                # intersect utils (existing)
│  └── renderer/
│     ├── bvh_integration.rs          # init, register, update (existing)
│     ├── visibility.rs               # VisibilityCuller (existing)
│     └── threed_renderer.rs          # switch get_visible_mesh_indices → BVH path (edit)
└── crates/
   └── scripting/src/apis/query_api.rs # wire query.raycast* to BvhManager (edit)
```

## 3. Implementation Plan

### Phase 0: Safety Gates & Switches (0.25 day)

1. Wire `#[cfg(feature = "bvh-acceleration")]` around BVH usage sites (renderer path, script API).
2. Add runtime switch `VIBE_BVH=on/off` (env) and JSON engine config override; default to `off` on release builds.
3. On init, log resolved mode: feature on/off + runtime on/off + fallback reason (if any).

### Phase 1: Math & Traversal Hardening (0.5 day)

1. Normalize frustum extraction and plane normalization; clamp NaNs/infs.
2. Ensure iterative (non-recursive) BVH traversals; add epsilon thresholds for slab/Möller–Trumbore.
3. Add overflow guards in index arithmetic and defensive checks on node bounds.

### Phase 2: Renderer Integration (0.75 day)

1. Replace `get_visible_mesh_indices` path with BVH-driven indices when enabled; retain current linear path as fallback.
2. Use `VisibilityCuller::get_visible_entities(view_proj, ids)` and map to indices; verify matrix source.
3. Per-frame: `BvhManager::reset_metrics() → update_transforms() → rebuild_scene_if_needed()` before culling.
4. Add structured logs each N seconds with culled ratio, nodes, candidates, timings (use existing `bvh_debug_logger`).

### Phase 3: Scripting Raycasting (0.5 day)

1. In `query_api.rs`, route `raycastFirst`/`raycastAll` to BVH when enabled; otherwise use physics fallback.
2. Return deterministic sorted hits with entity id, distance, point, triangle index; document differences vs physics.

### Phase 4: Incremental Updates & Scheduling (0.5 day)

1. Audit `enable_incremental_updates` behavior; prefer refit when possible, full rebuild on topology changes.
2. Batch updates across the frame to amortize rebuild/refit costs; debounce thrashing.

### Phase 5: Diagnostics & Tooling (0.5 day)

1. Expose metrics struct to debug HUD/logs: build/refit ms, culled/visible counts, ray budgets.
2. Add CLI flags to toggle BVH, dump stats, and run micro-benchmarks.

### Phase 6: Tests & Benchmarks (0.5–1.0 day)

1. Unit tests for frustum extraction, aabb/tri intersections, traversal determinism.
2. Integration tests: large scenes, dynamic transforms; ensure no false negatives in visibility.
3. Benchmarks for ray throughput and culling ratios; record results in docs.

## 4. File and Directory Structures

```markdown
/root-directory/
├── rust/engine/src/renderer/
│ ├── threed_renderer.rs # edit: conditional BVH visibility path
│ └── visibility.rs # VisibilityCuller already present
├── rust/engine/src/spatial/
│ ├── bvh_manager.rs # config flags, metrics hardened
│ ├── mesh_bvh.rs # iterative traversal, epsilon handling
│ └── scene_bvh.rs # refit/rebuild verification
└── rust/engine/crates/scripting/src/apis/query_api.rs # BVH raycasts
```

## 5. Technical Details

```rust
// renderer/visibility.rs — runtime toggle example (snake_case)
pub enum VisibilityMode { Linear, Bvh }

pub struct VisibilitySelector {
    mode: VisibilityMode,
    bvh_culler: Option<VisibilityCuller>,
}

impl VisibilitySelector {
    pub fn get_visible_indices(
        &self,
        view_projection: glam::Mat4,
        all_entity_ids: &[u64],
    ) -> Vec<usize> {
        match (&self.mode, &self.bvh_culler) {
            (VisibilityMode::Bvh, Some(culler)) => culler.get_visible_entities(view_projection, all_entity_ids),
            _ => (0..all_entity_ids.len()).collect(),
        }
    }
}
```

```rust
// threed_renderer.rs — switch with cfg + runtime
fn get_visible_mesh_indices(&self, render_state: Option<&MeshRenderState>) -> Vec<usize> {
    #[cfg(feature = "bvh-acceleration")]
    {
        if self.visibility_culler.is_some() && crate::util::bvh_enabled_at_runtime() {
            let vp = self.camera.projection() * self.camera.view();
            let ids: Vec<u64> = self.mesh_entity_ids.iter().map(|id| id.as_u64()).collect();
            return self.visibility_culler.as_ref().unwrap().get_visible_entities(vp, &ids);
        }
    }
    crate::renderer::mesh_filtering::get_visible_mesh_indices(
        self.meshes.len(), &self.mesh_entity_ids, render_state.map(|s| &s.visibility),
    )
}
```

```rust
// scripting/query_api.rs — BVH raycasts with fallback
pub fn raycast_first(origin: glam::Vec3, dir: glam::Vec3, max_distance: f32) -> Option<RaycastHit> {
    #[cfg(feature = "bvh-acceleration")]
    {
        if let Some(ctx) = engine_context() {
            if ctx.bvh_enabled() { return ctx.bvh_manager().lock().unwrap().raycast_first(origin, dir, max_distance); }
        }
    }
    physics::raycast_first(origin, dir, max_distance)
}
```

## 6. Usage Examples

```rust
// Toggle at runtime via ENV
// VIBE_BVH=on ./vibe-engine ...
```

```rust
// Renderer culling flow
let vp = camera.projection() * camera.view();
let indices = visibility_selector.get_visible_indices(vp, &all_entity_ids);
```

```rust
// Script raycast
if let Some(hit) = query::raycast_first(cam_pos, cam_dir, 1000.0) {
    // use hit.entity_id, hit.distance, hit.point
}
```

## 7. Testing Strategy

- Unit Tests
  - Frustum plane extraction normalization; NaN/Inf handling.
  - Ray–triangle and ray–aabb intersection with epsilons; degenerate triangles.
  - Iterative traversal determinism; no recursion depth risks.
- Integration Tests
  - Large scenes (≥ 5k meshes) with camera motion: no false negatives, stable culling ratios.
  - Dynamic transforms; verify refit correctness and rebuild scheduling.
  - Raycast throughput benchmarks; correctness vs. baseline physics.

## 8. Edge Cases

| Edge Case                      | Remediation                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| Degenerate/near-zero triangles | Filter or robust epsilon in Möller–Trumbore.                   |
| Extremely large coordinates    | Use f32 tolerances; clamp distances; validate AABB expansion.  |
| Dynamic skinned meshes         | Conservative AABBs; opt-out of mesh BVH; rebuild on keyframes. |
| Transform thrashing            | Debounce updates; batch refit; periodic full rebuild.          |
| Camera near-plane issues       | Correct plane normalization; avoid NaNs; safe defaults.        |

## 9. Sequence Diagram

```mermaid
sequenceDiagram
  participant Renderer
  participant VisibilityCuller
  participant BvhManager
  participant SceneBvh
  participant MeshBvh

  Renderer->>BvhManager: update_transforms(); rebuild_if_needed()
  Renderer->>VisibilityCuller: get_visible_entities(view_proj, ids)
  VisibilityCuller->>BvhManager: cull_frustum(frustum)
  BvhManager->>SceneBvh: query_frustum(frustum)
  SceneBvh-->>BvhManager: visible entity_ids
  BvhManager-->>VisibilityCuller: indices
  VisibilityCuller-->>Renderer: visible indices

  Renderer->>BvhManager: (optional) raycast*
  BvhManager->>SceneBvh: query_ray(ray)
  SceneBvh-->>BvhManager: candidates
  loop candidates
    BvhManager->>MeshBvh: raycast_first/all
    MeshBvh-->>BvhManager: hits
  end
  BvhManager-->>Renderer: best hit / hits
```

## 10. Risks & Mitigations

| Risk                                       | Mitigation                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Visual regressions from aggressive culling | Start behind feature + runtime off; immediate fallback; comprehensive tests. |
| Build stalls on complex meshes             | Progressive builds; cache MeshBVH; cap per-frame work.                       |
| Memory overhead                            | Compact node layout; share MeshBVH across instances; metrics budget.         |
| Math instability (NaNs/overflow)           | Normalize planes; clamp; iterative traversal; defensive checks.              |
| Divergence vs. physics raycasts            | Keep physics fallback; document scope; integration tests.                    |

## 11. Timeline

- Total: ~3.5–4.5 days engineering
  - Phase 0: 0.25 day
  - Phase 1: 0.5 day
  - Phase 2: 0.75 day
  - Phase 3: 0.5 day
  - Phase 4: 0.5 day
  - Phase 5: 0.5 day
  - Phase 6: 0.5–1.0 day

## 12. Acceptance Criteria

- Renderer uses BVH path when feature enabled and runtime toggle on; otherwise falls back seamlessly.
- No false negatives in visibility across test scenes; manual QA shows no gray/empty frames.
- ≥40% culled ratio in benchmark scenes; stable frame times; no stack overflows.
- `query.raycastFirst/All` backed by BVH return deterministic, sorted results with parity notes documented.
- Metrics exposed (build/refit ms, ray budgets, culled/visible counts) and logged every N seconds.
- Cargo feature `bvh-acceleration` actively gates code paths; default runtime toggle off in release.

## 13. Conclusion

Re-enabling BVH in Rust with robust gating, hardened math, and strong diagnostics restores the intended acceleration benefits while minimizing regression risk. The plan aligns renderer, scripting, and spatial systems under one lifecycle and provides measurable, testable performance gains.

## 14. Assumptions & Dependencies

- `glam` for math, `parry3d` primitives; existing `three-d` renderer pipeline.
- `BvhManager`, `VisibilityCuller`, and BVH modules exist and will be hardened but not redesigned.
- Scripting `query_api` is available for wiring raycasts; physics remains as fallback.
- Build/CI can run feature‑gated tests and benchmarks.
