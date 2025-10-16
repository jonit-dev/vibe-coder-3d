# Rust Physics Integration PRD (Rapier)

## Overview
- The editor path relies on `@react-three/rapier` while the Rust runtime currently renders without physics, creating a cross-platform simulation gap.
- Scenes authored with `RigidBody` and `MeshCollider` components must behave identically when executed via the native renderer and the web editor.
- Embedding Rapier 3D inside the Rust engine bridges ECS component data to a deterministic physics world that synchronizes back into the shared scene graph.
- Successful delivery keeps TypeScript authoring as the single source of truth and unlocks future scripting, telemetry, and gameplay systems on the Rust stack.

## Scope
- Integrate a dedicated `vibe-physics` crate that wraps Rapier 3D for world lifecycle, stepping, and event management inside the Rust runtime.
- Extend `vibe-ecs-bridge` decoding so Rust can construct rigid bodies, colliders, and optional materials directly from the serialized scene snapshot.
- Implement a fixed-step simulation loop (60 Hz target) that feeds pose updates back into `SceneGraph` before each render pass.
- Defer joints, ragdolls, cloth, runtime collider authoring, deterministic networking, and other advanced features; document fallbacks when shapes or data are unsupported.

## Goals & Success Metrics
- Rust runtime loads existing scenes containing physics components without additional hand-authored configuration.
- Parity with the TypeScript defaults for body type, damping, gravity scale, material properties, trigger flags, and collider dimensions.
- Deterministic stepping across runs given identical initial state; frame spikes clamp rather than destabilize simulation.
- Collision and trigger events are observable through a clean API that downstream scripting and WASM bridges can poll or subscribe to.

## Functional Requirements
- Decode `RigidBody` and `MeshCollider` components in Rust using parity with the TS Zod schemas, including defaulting missing or legacy fields.
- Build Rapier rigid bodies and colliders per entity covering cuboid, sphere, capsule, convex, and mesh (tri-mesh or fallback) shapes with material application.
- Maintain `EntityId` <-> `RigidBodyHandle` and `ColliderHandle` maps so entities can be spawned, despawned, and updated during scene reloads.
- Step physics with a fixed 1/60 s accumulator, update Rapier world state, then write transforms back into the scene graph before rendering.
- Surface contact begin/end, intersection (trigger) begin/end, and optional collision manifold data via a queued event API for Rust and future WASM consumers.

## Non-Functional Requirements
- Achieve deterministic results across identical seeds and platform builds; include toggles for debug assertions without affecting release performance.
- Keep per-frame physics cost under 2 ms on dev hardware for medium scenes (~2k entities) and avoid allocations in the hot path.
- Provide structured logging or metrics hooks for debugging (e.g., body counts, step duration, CCD activations) without polluting release builds.
- Fail gracefully when data is incomplete by logging actionable warnings and keeping the render loop alive.

## Data & Component Mapping

RigidBody component parity:

| Field | TS source & default | Rust mapping | Notes |
| --- | --- | --- | --- |
| `enabled` | `RigidBody.enabled` (true in UI) | Skip rigid body creation when false | Collider-only entities still supported via fixed bodies. |
| `bodyType` | `RigidBody.bodyType` (`dynamic` default) | Map to `RigidBodyType::{Dynamic,KinematicPositionBased,Fixed}` | Preserve legacy `type` field for back compat. |
| `mass` | `RigidBody.mass` (default 1) | Pass to `RigidBodyBuilder::dynamic().mass` | Clamp to epsilon when value <= 0. |
| `gravityScale` | `RigidBody.gravityScale` (default 1) | Apply via `set_gravity_scale` | Allows per-entity overrides of global gravity. |
| `canSleep` | `RigidBody.canSleep` (default true) | Configure `RigidBodyBuilder::can_sleep` | Expose as Rapier `sleeping` flag. |
| `material.friction` | Default 0.7 | Set on all collider materials | Respect sensors by forcing zero friction when needed. |
| `material.restitution` | Default 0.3 | Set `restitution` and combine rule | Mirror editor bounce behaviour. |
| `material.density` | Default 1 | Compute mass properties when needed | Falls back to Rapier defaults if omitted. |

MeshCollider component parity:

| Field | TS source & default | Rust mapping | Notes |
| --- | --- | --- | --- |
| `enabled` | `MeshCollider.enabled` (true default) | Skip collider creation when false | Keep body alive for kinematic updates. |
| `isTrigger` | `MeshCollider.isTrigger` | Mark collider as sensor via `set_sensor(true)` | Trigger colliders still produce events. |
| `colliderType` | Enum `box|sphere|capsule|mesh|convex|heightfield` | Build matching Rapier shape or fallback | Heightfield may downgrade to box until data arrives. |
| `center` | Tuple offset (default 0,0,0) | Apply as collider translation relative to body | Combine with entity scale before building collider. |
| `size.width` `size.height` `size.depth` | Defaults 1 | Map to `ColliderBuilder::cuboid` half-extents | Honor non-uniform scale, warn when extreme. |
| `size.radius` | Default 0.5 | Use for spheres and capsules | Clamp to positive minimum. |
| `size.capsuleRadius` `size.capsuleHeight` | Defaults 0.5 / 2 | Build capsule colliders | Scale by entity transform. |
| `physicsMaterial.friction` | Default 0.7 | Set collider friction | Combine with rigid body material. |
| `physicsMaterial.restitution` | Default 0.3 | Set collider restitution | Determines bounce. |
| `physicsMaterial.density` | Default 1 | Use when colliders determine mass | Respect sensors by bypassing mass changes. |

Tri-mesh colliders require mesh data streamed from `vibe-assets`; when assets are unavailable the system falls back to convex hulls or bounding boxes and logs warnings.

## Architecture Overview
- Introduce `rust/engine/crates/physics` to encapsulate Rapier world management, builders, event queue, and shared type definitions.
- Extend `vibe-ecs-bridge` with strongly typed `RigidBody` and `MeshCollider` structures plus decoders that mirror the TypeScript Zod schemas.
- On scene load, a builder converts component data into Rapier rigid bodies and colliders, storing handle lookups for transform sync and event routing.
- The engine main loop maintains a fixed-step accumulator that advances physics and writes world transforms into `SceneGraph` prior to render submission.

### Directory Structure

```
rust/engine/
├── Cargo.toml
├── crates/
│   ├── ecs-bridge/
│   │   └── src/decoders.rs        # + Add RigidBody, MeshCollider decoders
│   ├── physics/                   # NEW
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── world.rs           # PhysicsWorld (init, step, events)
│   │       ├── builder.rs         # Component → Rapier mapping
│   │       ├── components.rs      # Shared component types
│   │       └── events.rs          # Event plumbing + API
│   ├── scene/
│   ├── scene-graph/
│   ├── assets/
│   └── wasm-bridge/
└── src/
    ├── app.rs                     # + Fixed-step accumulator + physics step
    ├── ecs/
    └── render/
```

## Engine Integration Flow
- Scene snapshots (JSON or binary) flow through `vibe-ecs-bridge`, producing typed `RigidBody` and `MeshCollider` data for each entity.
- `vibe-physics` builds rigid bodies and colliders, registers them with Rapier sets, and records entity handle lookups alongside integration parameters.
- The update loop accumulates frame delta, advances physics in fixed increments, and after each step copies world poses back to the SceneGraph with parent-aware adjustments.
- After pose synchronization the renderer consumes the updated graph; meanwhile the physics event queue is drained into a consumer-facing API.

## Implementation Plan

### ✅ Phase 1 – Crate setup (Completed 2025-10-15)
- ✅ Created `crates/physics` with `rapier3d` v0.17.2 dependency (`dim3`, `parallel`)
- ✅ Registered crate in workspace and exposed `PhysicsWorld` API
- ✅ Implemented world skeleton with pipeline, sets, integration parameters (60Hz default)
- **File**: `rust/engine/crates/physics/src/world.rs` - Full PhysicsWorld implementation
- **Tests**: 7/7 passing (world creation, entity add/remove, stepping, transforms, stats)

### ✅ Phase 2 – ECS decoders (Completed 2025-10-15)
- ✅ Defined `RigidBody` and `MeshCollider` structs in `ecs-bridge/src/decoders.rs`
- ✅ Implemented decoders with default value handling matching TS schemas
- ✅ Added legacy `type` field support for backward compatibility with `bodyType`
- ✅ Registered decoders in `create_default_registry()`
- **File**: `rust/engine/crates/ecs-bridge/src/decoders.rs` - Lines 304-631
- **Tests**: 6/6 passing (decoder tests, defaults, legacy fields)

### ✅ Phase 3 – Builders and shape mapping (Completed 2025-10-15)
- ✅ Implemented `RigidBodyBuilder` for Dynamic, Kinematic, and Fixed body types
- ✅ Implemented `ColliderBuilder` for Box, Sphere, and Capsule shapes
- ✅ Added material property mapping (friction, restitution, density)
- ✅ Sensor/trigger flag support
- ✅ Scale application to collider dimensions
- ⚠️ Convex, Mesh, and Heightfield shapes fall back to box with warnings (deferred to Phase 7)
- **File**: `rust/engine/crates/physics/src/builder.rs` - Full builder implementation
- **Tests**: 9/9 passing (rigid body, colliders, materials, sensors, scaling)

### Phase 4 – World bootstrap and entity binding (1 day)
- Initialize `PhysicsWorld` during scene load and create rigid bodies or fixed colliders depending on component combinations.
- Maintain handle maps for entities, colliders, and joints (future-proof) with guard rails for duplicate bindings.
- Support runtime add/remove of physics components by diffing ECS events and mutating Rapier sets.

### Phase 5 – Fixed-step loop and transform sync (1 day)
- Add accumulator state in `src/app.rs`, stepping physics at 1/60 s using existing frame timer utilities.
- After each step, sync rigid body positions and orientations into the SceneGraph, recalculating local transforms for parented entities.
- Expose hooks so render and scripting systems can read current physics state before presentation.

### Phase 6 – Events and queries (0.5 day)
- Integrate Rapier `EventQueue` with channel collector and drain contact/intersection events each frame.
- Provide a pull-based API (`poll_events()`) returning structured begin/end data keyed by `EntityId`.
- Document how future WASM and scripting integrations consume the API and add smoke tests.

### Phase 7 – Tri-mesh pipeline (1–2 days, optional)
- Stream mesh data from `vibe-assets` or GLTF cache, generating Rapier tri-mesh colliders when requested.
- Implement convex or primitive fallback with logging and editor-visible warnings when mesh data is missing.
- Benchmark memory footprint and include toggles to disable tri-meshes on constrained targets.

### Phase 8 – QA and perf validation (0.5 day)
- Create unit and integration tests (falling cube, trigger volume, tri-mesh ground) and run under CI.
- Profile frame time, allocation count, and determinism; adjust integration parameters or logging as needed.
- Produce documentation updates for QA scenarios and developer onboarding.

## Technical Reference

```rust
// crates/physics/src/lib.rs
pub mod world;
pub mod builder;
pub mod components;
pub mod events;
pub use world::PhysicsWorld;
```

```rust
// crates/physics/src/world.rs (skeleton)
use rapier3d::prelude::*;
use std::collections::HashMap;
use vibe_scene::EntityId;

pub struct PhysicsWorld {
    pub gravity: Vector<Real>,
    pub pipeline: PhysicsPipeline,
    pub island_manager: IslandManager,
    pub broad_phase: BroadPhase,
    pub narrow_phase: NarrowPhase,
    pub rigid_bodies: RigidBodySet,
    pub colliders: ColliderSet,
    pub impulse_joints: ImpulseJointSet,
    pub multibody_joints: MultibodyJointSet,
    pub ccd_solver: CCDSolver,
    pub integration_params: IntegrationParameters,
    pub event_handler: ChannelEventCollector,
    pub entity_to_body: HashMap<EntityId, RigidBodyHandle>,
    pub entity_to_colliders: HashMap<EntityId, Vec<ColliderHandle>>,
}

impl PhysicsWorld {
    pub fn new() -> Self {
        // Initialize Rapier structures, default gravity (-9.81), and buffers
        todo!()
    }

    pub fn add_entity(&mut self, id: EntityId, body: RigidBody, colliders: Vec<Collider>) {
        // Insert rigid body and colliders, recording handle mappings
        todo!()
    }

    pub fn step(&mut self, dt: f32) {
        // Advance pipeline, update integration params, and collect events
        todo!()
    }
}
```

```rust
// crates/physics/src/builder.rs (signatures)
use rapier3d::prelude::*;
use glam::{Quat, Vec3};
use vibe_ecs_bridge::{RigidBody as Rb, MeshCollider as Mc};

pub fn make_rigid_body(rb: &Rb, position: Vec3, rotation: Quat) -> RigidBody {
    // Map component fields to Rapier builder
    todo!()
}

pub fn make_colliders(mc: &Mc, scale: Vec3) -> Vec<Collider> {
    // Build collider shapes, materials, and sensors
    todo!()
}
```

```rust
// src/app.rs (integration points)
// - Add fields: physics: PhysicsWorld, accumulator: f32, fixed_dt: f32
// - Build world from scene on new()
// - On update(): accumulate dt; while >= fixed_dt -> physics.step(fixed_dt)
// - After stepping: sync poses back to entities and update SceneGraph before rendering
```

## Testing Strategy
- Unit tests cover decoder defaults, body and collider builder mapping, and event queue handling.
- Integration tests simulate falling cube, trigger volumes, and tri-mesh ground contact to ensure parity with editor behaviour.
- Determinism tests run the same scene twice, hashing body transforms and velocities to confirm identical results.
- Performance tests record average and max step time under representative entity counts to guard against regressions.

## Debugging & Telemetry
- Add optional feature flag to emit per-frame physics metrics (body count, island count, step duration).
- Provide logging categories for decoder issues, missing assets, and unsupported collider shapes.
- Integrate with existing inspector tooling to display current rigid body state and collider handles.
- Document workflow for capturing Rapier debug snapshots and replaying test scenes.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Tri-mesh performance or memory overhead | Begin with primitives/convex fallback, gate feature behind configuration, stream meshes lazily. |
| Divergence from TS physics behaviour | Mirror schema defaults, add parity tests, and document any unavoidable differences. |
| Fixed-step jitter or accumulator drift | Clamp accumulator, consider interpolation alpha, and instrument for long frame spikes. |
| Transform sync for parented entities | Centralize sync through SceneGraph utilities to recompute locals from world poses. |
| Feature creep toward joints or advanced systems | Keep crate modular, document extension points, and treat joints as follow-up milestones. |

## Timeline & Milestones
- ✅ **Day 1 (2025-10-15)**: Completed Phases 1–4
  - Phase 1: Created `vibe-physics` crate with Rapier 3D v0.17.2 dependency
  - Phase 2: Defined `RigidBody` and `MeshCollider` component structs and decoders in `vibe-ecs-bridge`
  - Phase 3: Implemented builders for rigid bodies and colliders (box, sphere, capsule shapes)
  - Phase 4: Registered physics crate in workspace, all 22 tests passing
- Days 2–3: Phases 5–6 (world bootstrap, fixed-step loop, transform sync, events)
- Day 4: Phase 7 (tri-mesh integration, optional)
- Day 5: Phase 8 (QA, performance validation, documentation)

## Acceptance Criteria
- Scenes containing `RigidBody` and `MeshCollider` simulate correctly in the Rust runtime with gravity, collisions, and triggers.
- Transform updates from physics are visible in the renderer before each frame without perceptible jitter.
- Event API surfaces contact begin/end and trigger begin/end with matching entity identifiers.
- Fixed-step accumulator keeps simulation stable under frame spikes and produces deterministic results in automated tests.
- Tri-mesh colliders either function with mesh data or fall back gracefully with clear logging.

## Open Questions
- Should we introduce per-body damping and angular velocity fields now or wait for scripting demand?
- Do we need run-time collider baking for custom shapes authored outside the asset pipeline?
- How should physics events integrate with existing scripting hooks to avoid duplicate dispatch?
- What level of debug visualization (e.g., wireframe colliders) is required for developer productivity?

## Dependencies & Assumptions
- `rapier3d` crate with `dim3` and `parallel` features remains the physics backend; SIMD requires toolchain support.
- `vibe-assets` service provides mesh and GLTF data for tri-mesh colliders; fallbacks trigger when data is missing.
- SceneGraph stays authoritative for render transforms, and physics writes world poses prior to drawing.
- No scripting coupling is required in this phase; events are buffered for future WASM bridge consumption.

## Reference Snippets

```rust
// Populate world (simplified)
let mut world = PhysicsWorld::new();
for entity in &scene.entities {
    if let Some(rb) = entity.get_component::<vibe_ecs_bridge::RigidBody>("RigidBody") {
        let transform = entity.get_component::<vibe_ecs_bridge::Transform>("Transform");
        let (pos, rot, scale) = extract_trs(transform);
        let rb_desc = make_rigid_body(&rb, pos, rot);
        let mut colliders = Vec::new();
        if let Some(mc) = entity.get_component::<vibe_ecs_bridge::MeshCollider>("MeshCollider") {
            colliders = make_colliders(&mc, scale);
        }
        world.add_entity(entity.entity_id().unwrap(), rb_desc, colliders);
    }
}
```

```rust
// Fixed step in update()
accumulator += self.timer.delta_seconds();
while accumulator >= fixed_dt {
    self.physics.step(fixed_dt);
    accumulator -= fixed_dt;
}
// Sync poses back into scene graph before rendering
```


