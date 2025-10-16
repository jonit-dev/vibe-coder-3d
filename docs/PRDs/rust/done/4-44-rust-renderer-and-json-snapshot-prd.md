# PRD: Rust Renderer & JSON Snapshot Generation

## Overview

- **Goal**: Integrate a Rust/WASM renderer for Play mode while keeping the React/r3f GUI editor. Establish a neutral, generated JSON runtime artifact (and optional binary) as the contract between TS/BitECS ECS and Rust.
- **Why**: TSX is ideal for authoring and type safety, but Rust cannot parse TSX. JSON provides portability and debuggability; a compact binary minimizes Play latency.

## Scope

- Generate `*.scene.json` snapshots on Save for all scenes in `src/game/scenes/*` (e.g., `exampleMultiFile.tsx`).
- Optional: Generate `*.scene.postcard` binary snapshots in build or on Play for performance.
- Consume JSON/binary snapshots in Rust via WASM FFI.
- Do not change authoring flow; TSX remains the source of truth.

## Functional Requirements

1. On Save in the editor:
   - Validate TSX scene (Zod) and serialize to a normalized JSON snapshot with stable IDs/handles.
   - Write to `src/game/scenes/.snapshots/<sceneId>.scene.json`.
   - Emit editor events/logs on success/failure.
2. On Play:
   - Load the latest JSON snapshot for the active scene (or import TSX and normalize).
   - Optionally transcode to binary (`postcard`) client-side before sending to WASM.
   - Initialize Rust renderer with canvas; send snapshot and subsequent diffs.
3. Versioning & schema:
   - Include `metadata.version`, `timestamp`, and a `schemaVersion` in JSON.
   - Maintain a Zod schema (`ISceneSnapshot`) and Serde schema in Rust (`SceneSnapshot`).
4. Diffs (optional, stretch):
   - Emit minimal add/update/remove diffs for live editing in Play.

## Non‑Functional Requirements

- Snapshot generation must complete in <50ms for typical scenes (1–2k entities) on dev hardware.
- JSON size target: <5 MB typical; binary target: <50% of JSON size.
- Deterministic output ordering for stable diffs in CI.

## Data Contract

JSON file structure (illustrative):

```json
{
  "schemaVersion": 1,
  "metadata": { "name": "ExampleMultiFile", "version": 1, "timestamp": "..." },
  "entities": [
    {
      "id": 2,
      "name": "Ground",
      "transform": { "matrix": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      "mesh": { "meshId": "cube", "materialId": "farm-grass" }
    }
  ],
  "materials": [],
  "textures": [],
  "lights": [],
  "camera": {
    "view": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "proj": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
}
```

- TS: `ISceneSnapshot` (Zod) mirrors this structure.
- Rust: `SceneSnapshot` (Serde) mirrors, with `#[serde(rename_all = "camelCase")]`.

## Editor Changes

- Add Save pipeline step:
  - TSX module → validate (Zod) → normalize → JSON snapshot write.
- Setting: enable/disable snapshot generation and binary emission.
- Display last snapshot time and file path in status area.

## Git & Paths

- Output directory: `src/game/scenes/.snapshots/`.
- Git policy (default ignore):
  - Add to `.gitignore`:
    - `src/game/scenes/.snapshots/*.scene.json`
    - `src/game/scenes/.snapshots/*.scene.postcard`
- CI may publish snapshots as build artifacts (not tracked in git).

## WASM Interface (Summary)

- Functions: `init`, `set_canvas`, `resize`, `load_scene(bytes)`, `apply_diff(bytes)`, `update_input(bytes)`, `tick(dt)`, `read_metrics()`, `shutdown`.
- Payloads: `postcard` (preferred) or JSON (dev mode).

## Success Metrics

- Play latency to first frame with Rust <= current r3f editor path.
- 1.5–2× faster frame times on medium scenes vs JS path on WebGPU devices.
- No data mismatches between TSX editor view and Rust Play view for supported features.

## Risks & Mitigations

- JSON drift vs TSX: mitigate with Zod validation and snapshot tests.
- Large payloads: use deduplication, handles, and binary format for Play.
- Browser/WebGPU variance: maintain r3f fallback.

## Milestones

1. Snapshot pipeline working (JSON only).
2. Rust loads JSON via Serde (dev path) and renders basic meshes.
3. Binary path (postcard) wired for Play with resource caching.
4. Diffs and performance instrumentation.

## Open Questions

- How much of material graphs to materialize in snapshot vs reference external registries?
- Do we snapshot animation state or stream it separately?
