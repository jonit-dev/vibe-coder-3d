# Vibe Coder 3D - Feature Roadmap

> **🎨 Visual-First Development Strategy**
> Prioritizes highly visible features for immediate user satisfaction and motivation.

**Legend:** ✅ Complete | 🚧 Partial/In Progress | ❌ Not Implemented | ⚠️ Critical Gap

> **📋 For detailed documentation of completed features, see [`IMPLEMENTED-FEATURES-LIST.md`](./IMPLEMENTED-FEATURES-LIST.md)**

---

## 📊 Effort × Impact Matrix

### Quick Wins (High Impact, Low Effort) ⚡

| Feature                  | Impact       | Effort    | Status      | Priority |
| ------------------------ | ------------ | --------- | ----------- | -------- |
| Material Dedup (Rust)    | 🟡 Important | 3-5 days  | ❌ Missing  | P1       |
| Complete UI API (Rust)   | 🔴 Critical  | 1 week    | 🚧 Last API | P0       |
| FXAA (Rust)              | 🟡 Important | 1 week    | 🚧 Partial  | P1       |
| Mesh Optimization (Rust) | 🟡 Important | 1 week    | ❌ Missing  | P2       |
| CSM Shadows (Rust)       | 🟡 Important | 1-2 weeks | 🚧 Partial  | P2       |
| Dynamic Batching         | 🟡 Important | 3-5 days  | 🚧 Partial  | P2       |
| LOD Variant Gen (Rust)   | 🟡 Important | 1 week    | ❌ Missing  | P2       |

### Strategic Investments (High Effort, High Impact) 🎯

| Feature                | Impact       | Effort    | Status           | Priority |
| ---------------------- | ------------ | --------- | ---------------- | -------- |
| Particle/VFX System    | 🔴 Critical  | 2-4 weeks | ❌ Missing       | P0       |
| Custom Shader System   | 🔴 Critical  | 2-3 weeks | ❌ Missing       | P0       |
| Character Controller   | 🔴 Critical  | 1-2 weeks | ✅ Near Complete | P0       |
| Undo/Redo System       | 🔴 Critical  | 2-3 weeks | ❌ Missing       | P1       |
| Skinned Mesh Animation | 🟡 Important | 4-6 weeks | 🚧 Partial       | P2       |
| Navigation/Pathfinding | 🟡 Important | 4-6 weeks | ❌ Missing       | P3       |

### Low Priority Items 📋

| Feature                     | Impact       | Effort    | Status      | Notes                      |
| --------------------------- | ------------ | --------- | ----------- | -------------------------- |
| Decals                      | 🟢 Nice      | 2-3 weeks | ❌ Missing  | Visual polish              |
| Terrain Tools (Editor)      | 🟢 Nice      | 3-4 weeks | ❌ Missing  | Rust has basic terrain     |
| Build System Multi-platform | 🟡 Important | 4-6 weeks | 🚧 Partial  | Web builds work            |
| Advanced Profiler           | 🟢 Nice      | 2-3 weeks | 🚧 Partial  | Basic profiling works      |
| Input Rebind System (Rust)  | 🟢 Nice      | 1-2 weeks | ❌ Missing  | TS has rebind              |
| Audio System (Rust)         | 🟡 Important | 2-3 weeks | 🚧 Skeleton | TS complete with Howler.js |

### Already Complete ✅

| Feature                  | Impact       | Notes                              |
| ------------------------ | ------------ | ---------------------------------- |
| BVH Spatial Acceleration | 🔴 Critical  | Full parity, 10-100x speedup       |
| LOD System               | 🔴 Critical  | Full parity, 3 quality tiers       |
| Physics Integration      | 🔴 Critical  | Complete Rapier3D parity           |
| Input System             | 🔴 Critical  | Full parity, 19 methods            |
| Transform & Scene Graph  | 🔴 Critical  | Complete hierarchy both systems    |
| PBR Materials            | 🔴 Critical  | Professional pipeline              |
| Prefab System            | 🔴 Critical  | Runtime instantiation + Lua API    |
| Lighting System          | 🔴 Critical  | Directional, point, spot + shadows |
| Post-Processing (TS)     | 🟡 Important | Tone mapping, bloom, FXAA          |

---

## 🏆 What's Already Done (Quick Summary)

**Core Systems (100% Complete):**

- ✅ Transform & Scene Graph - Full hierarchy in both TS and Rust
- ✅ Entity-Component System - Mutable ECS with runtime CRUD (35 tests)
- ✅ Physics Integration - Full Rapier3D with complete parity
- ✅ PBR Materials - Professional material pipeline
- ✅ Lighting System - Directional, point, spot lights with shadows
- ✅ Input System - Full parity with action mapping (19 methods)
- ✅ Prefab System - Runtime instantiation with Lua API

**Scripting (96% Complete):**

- ✅ TypeScript: 14/24 APIs (Entity, Transform, Input, Audio, Prefab, etc.)
- ✅ Rust: 24/25 APIs (Only UI API remaining) - **Major Achievement!**

**Optimization (Complete Parity):**

- ✅ BVH Spatial Acceleration - 10-100x raycasting speedup (TS + Rust, scripting integration complete)
- ✅ LOD System - 3 quality tiers (100%, 75%, 35%) (TS + Rust)
- ✅ Asset Pipeline - 60-80% file size reduction (TS only)
- ✅ Scene Serialization - 60-80% compression (TS only)

**Overall Progress:** 48% complete, 32% partial, 20% missing

**Recent Major Achievement (2025-11-07):**

- ✅ Character Controller unified system complete (Phases 1-3 + partial Phase 4)
- ✅ 65% complete (production-ready core, pending UX polish and comprehensive tests)

---

## 🎯 Sprint Planning Overview

| Sprint       | Focus              | Duration  | Features                                  | Impact       | User Excitement            |
| ------------ | ------------------ | --------- | ----------------------------------------- | ------------ | -------------------------- |
| **Sprint 1** | Visual Impact      | 3-4 weeks | Particles + Complete Character Controller | 🔴 Critical  | ⭐⭐⭐⭐⭐ **WOW!**        |
| **Sprint 2** | Visual Polish      | 2-3 weeks | Post-processing + Custom Shaders          | 🟡 Important | ⭐⭐⭐⭐ **Professional!** |
| **Sprint 3** | Performance        | 1-2 weeks | Material Dedup + Asset Pipeline           | 🟡 Important | ⭐⭐⭐ **Optimized!**      |
| **Sprint 4** | Professional Tools | 3-4 weeks | Undo/Redo + Complete APIs                 | 🟡 Important | ⭐⭐⭐ **Efficient!**      |

**Total Timeline:** 9-13 weeks to achieve impressive, professional results

**Progress After Each Sprint:**

- **Sprint 1:** Explosions, fire, smoke effects + fully walkable scenes with slope/step handling
- **Sprint 2:** Professional anti-aliasing and custom visual effects
- **Sprint 3:** Memory optimization + asset pipeline (LOD/BVH already done ✅)
- **Sprint 4:** Complete professional development workflow

---

## 🧱 Core Scene Architecture

### Transform & Scene Graph (★★★★★)

| Feature                | Editor (TS) | Rust Engine | Notes                              |
| ---------------------- | ----------- | ----------- | ---------------------------------- |
| Parent-child hierarchy | ✅          | ✅          | Complete in both, full scene graph |
| Local/World matrices   | ✅          | ✅          | Transform hierarchy management     |
| Dirty flag propagation | ✅          | ✅          | Optimized updates in both          |
| Transform utilities    | ✅          | ✅          | Degree/radian conversion handled   |

**Status:** ✅ **COMPLETE** - Full feature parity

---

### Entity-Component System (★★★★★)

| Feature                 | Editor (TS) | Rust Engine | Notes                                      |
| ----------------------- | ----------- | ----------- | ------------------------------------------ |
| Component registration  | ✅          | ✅          | BitECS in TS, ComponentRegistry in Rust    |
| System iteration        | ✅          | ✅          | Full system in both                        |
| Prefab composition      | ✅          | ✅          | Full TS prefabs, complete Rust API support |
| Entity lifecycle        | ✅          | ✅          | Complete in both (SceneManager in Rust)    |
| Component serialization | ✅          | 🚧          | 60-80% compression in TS                   |
| Runtime CRUD            | ✅          | ✅          | Full create/update/destroy in both systems |

**Status:** ✅ **EXCELLENT** - Both systems have full mutable ECS with runtime entity CRUD
**Files:** TS: `src/core/lib/ecs/`, Rust: `rust/engine/crates/scene/`, `rust/engine/crates/ecs-manager/`

---

## 🎥 Rendering Pipeline

### Mesh Rendering (★★★★★)

| Feature                 | Editor (TS) | Rust Engine | Notes                                          |
| ----------------------- | ----------- | ----------- | ---------------------------------------------- |
| Static mesh batching    | ✅          | ✅          | Instanced rendering in Rust                    |
| Skinned mesh support    | 🚧          | ❌          | GLTF support partial                           |
| Material binding system | ✅          | ✅          | Material manager in both                       |
| GLTF/GLB loading        | ✅          | ✅          | Full pipeline support                          |
| Mesh optimization       | ✅          | ❌          | glTF-Transform optimization (60-80% reduction) |

**Status:** 🚧 **PARTIAL** - Core rendering complete, skinned meshes missing

---

### PBR Materials (★★★★★)

| Feature                                             | Editor (TS) | Rust Engine | Notes                          |
| --------------------------------------------------- | ----------- | ----------- | ------------------------------ |
| Base maps (albedo, metallic, roughness, normal, AO) | ✅          | ✅          | Full PBR pipeline              |
| Shader parameters                                   | ✅          | ✅          | Uniforms for tinting, emissive |
| SRGB & linear workflow                              | ✅          | ✅          | Physically consistent lighting |
| Material deduplication                              | ✅          | ❌          | TS optimization only           |
| Material overrides                                  | ✅          | ✅          | Runtime material changes       |

**Status:** ✅ **COMPLETE** - Full PBR support in both systems

---

### Lighting (★★★★★)

| Feature                 | Editor (TS) | Rust Engine | Notes                      |
| ----------------------- | ----------- | ----------- | -------------------------- |
| Directional light (sun) | ✅          | ✅          | Core global illumination   |
| Point/spot lights       | ✅          | ✅          | Full light types           |
| Light attenuation       | ✅          | ✅          | Inverse-square with cutoff |
| Shadow support          | ✅          | ✅          | Enhanced lighting system   |

**Status:** ✅ **COMPLETE** - Full lighting parity

---

### Shadows (★★★★☆)

| Feature                    | Editor (TS) | Rust Engine | Notes                     |
| -------------------------- | ----------- | ----------- | ------------------------- |
| Cascaded shadow maps (CSM) | ✅          | 🚧          | TS complete, Rust partial |
| Spot light shadows         | ✅          | ✅          | Localized sources         |
| PCF or PCSS blur           | 🚧          | 🚧          | Basic shadow softening    |

**Status:** 🚧 **PARTIAL** - Basic shadows work, CSM needs completion in Rust

---

### Post-Processing (★★★★☆)

| Feature                  | Editor (TS) | Rust Engine | Notes                      |
| ------------------------ | ----------- | ----------- | -------------------------- |
| Tone mapping & exposure  | ✅          | ✅          | Realistic brightness range |
| Bloom                    | ✅          | ✅          | HDR effect                 |
| Antialiasing (FXAA/TAA)  | ✅          | 🚧          | TS complete, Rust partial  |
| Post-processing pipeline | ✅          | ✅          | Full effect system         |

**Status:** ✅ **COMPLETE** - Core post-processing functional

---

## ⚙️ Performance Essentials

### Culling (★★★★☆)

| Feature                        | Editor (TS) | Rust Engine | Notes                          |
| ------------------------------ | ----------- | ----------- | ------------------------------ |
| Frustum culling                | ✅          | ✅          | BVH-accelerated in both        |
| Bounding volumes (AABB/sphere) | ✅          | ✅          | Full AABB system               |
| BVH spatial acceleration       | ✅          | ✅          | **10-100x raycasting speedup** |
| Occlusion hints                | ❌          | ❌          | Not implemented                |

**Status:** ✅ **COMPLETE** - Full BVH parity achieved
**Files:** TS: `src/core/lib/rendering/BVHManager.ts`, Rust: `src/spatial/bvh_manager.rs`, `src/spatial/mesh_bvh.rs`, `src/spatial/scene_bvh.rs`

---

### LOD (★★★★☆)

| Feature                      | Editor (TS) | Rust Engine | Notes                                  |
| ---------------------------- | ----------- | ----------- | -------------------------------------- |
| Distance-based model swaps   | ✅          | ✅          | Full parity                            |
| 3 quality tiers              | ✅          | ✅          | original (100%), high (75%), low (35%) |
| Crossfade/blend              | 🚧          | 🚧          | Basic transitions                      |
| Simplified collider fallback | ❌          | ❌          | Not implemented                        |
| LOD variant generation       | ✅          | ❌          | Auto-generated during optimization     |

**Status:** ✅ **COMPLETE** - Full parity in both systems
**Files:** TS: `src/core/lib/rendering/LODManager.ts`, Rust: `src/renderer/lod_manager.rs`, `src/renderer/lod_selector.rs`

---

### Instancing / Batching (★★★★☆)

| Feature              | Editor (TS) | Rust Engine | Notes                            |
| -------------------- | ----------- | ----------- | -------------------------------- |
| GPU instancing       | ✅          | ✅          | Efficient identical mesh drawing |
| Dynamic batching     | 🚧          | 🚧          | Basic implementation             |
| Material key sorting | ✅          | 🚧          | Reduces state changes            |

**Status:** 🚧 **PARTIAL** - Basic instancing works, needs optimization

---

## 🕹️ Gameplay Foundation

### Physics (★★★★★)

| Feature                                              | Editor (TS) | Rust Engine | Notes                     |
| ---------------------------------------------------- | ----------- | ----------- | ------------------------- |
| Collision shapes (box, sphere, capsule, convex hull) | ✅          | ✅          | Full shape support        |
| Rigidbodies (gravity, impulses, constraints)         | ✅          | ✅          | Complete physics sim      |
| Sweep tests                                          | ✅          | ✅          | Movement validation       |
| Physics materials (friction, restitution, density)   | ✅          | ✅          | Full material properties  |
| Transform sync                                       | ✅          | ✅          | Physics-to-rendering sync |

**Status:** ✅ **COMPLETE** - Full Rapier3D integration in both systems
**Files:** TS: `src/core/components/physics/`, Rust: `rust/engine/crates/physics/`

---

### Raycasting (★★★★★)

| Feature                                                | Editor (TS) | Rust Engine | Notes                         |
| ------------------------------------------------------ | ----------- | ----------- | ----------------------------- |
| Line hits (shooting, picking, camera focus, AI vision) | ✅          | ✅          | BVH-accelerated in both       |
| Layer filtering                                        | ✅          | 🚧          | Optimize queries              |
| Hit info struct                                        | ✅          | ✅          | Decals, effects, impact logic |

**Status:** ✅ **COMPLETE** - BVH-accelerated raycasting available in both TS and Rust (10-100x faster)
**Files:** TS: `src/core/lib/rendering/BVHManager.ts`, Rust: `rust/engine/src/spatial/bvh_manager.rs`, `rust/engine/src/spatial/scripting_raycaster.rs`

---

### Character Controller (★★★★★)

| Feature                        | Editor (TS) | Rust Engine | Notes                                                                                   |
| ------------------------------ | ----------- | ----------- | --------------------------------------------------------------------------------------- |
| Capsule collider               | ✅          | ✅          | Full capsule physics support (fix applied 2025-11-07)                                   |
| Scripting API                  | ✅          | ✅          | entity.controller (isGrounded, move, jump, setSlopeLimit, setStepOffset)                |
| Script API routing             | ✅          | 🚧          | Routes through unified controller (no direct RigidBody manipulation)                    |
| Basic movement                 | ✅          | ✅          | WASD + Space input handling                                                             |
| Physics collisions             | ✅          | ✅          | Uses Rapier kinematic bodies - collisions work                                          |
| Slope/step handling            | ✅          | 🚧          | TS complete with KinematicCharacterController, Rust uses basic kinematic bodies         |
| Ground snapping                | ✅          | 🚧          | TS complete with KinematicCharacterController, Rust uses basic kinematic bodies         |
| Auto/Manual control modes      | ✅          | 🚧          | Auto (WASD) + Manual (script) modes implemented                                         |
| Deferred registration system   | ✅          | ❌          | 3-frame retry mechanism for physics registration timing                                 |
| Collision filters & predicates | ✅          | 🚧          | Layer-based collision filtering applied                                                 |
| Stop/Play reliability          | ✅          | ❌          | Registration race condition fixed (2025-11-07)                                          |
| WASM stability                 | ✅          | ❌          | Rapier WASM crash on stop/play fixed (2025-11-07)                                       |
| Unified system architecture    | ✅          | ❌          | CharacterControllerAutoInputSystem deprecated, unified CharacterControllerSystem in use |
| Inspector UX                   | 🚧          | ❌          | Input mapping UI pending (Phase 5), basic component inspector works                     |

**Status:** ✅ **NEAR COMPLETE** - TS has production-ready unified controller with Rapier KinematicCharacterController (Phases 1-3 complete, Phase 4 partial). Remaining: Inspector UX (Phase 5), comprehensive tests (Phase 6). Rust uses basic kinematic bodies (missing advanced features).

**Recent Updates (2025-11-07):**

- ✅ Unified CharacterControllerSystem (deprecated Auto system)
- ✅ Script API routes through controller (Phase 2)
- ✅ Deferred registration with retry mechanism (Phase 3)
- ✅ Registration race condition fixed
- ✅ Rapier WASM crash fixed
- ✅ Capsule collider shape corrected

**Files:**

- TS: `src/core/systems/CharacterControllerSystem.ts` (unified), `src/core/physics/character/`, `src/core/lib/scripting/apis/CharacterControllerAPI.ts`
- Rust: `rust/engine/src/app_threed.rs`, `rust/engine/crates/scripting/src/apis/physics_api.rs`

**Documentation:** `docs/character-controller-implementation-summary.md`, `docs/PRDs/editor/character-controller-gap-closure-prd.md`

---

### Navigation (★★★★☆)

| Feature           | Editor (TS) | Rust Engine | Notes           |
| ----------------- | ----------- | ----------- | --------------- |
| Navmesh baking    | ❌          | ❌          | Not implemented |
| Pathfinding (A\*) | ❌          | ❌          | Not implemented |
| Agent avoidance   | ❌          | ❌          | Not implemented |

**Status:** ❌ **NOT IMPLEMENTED**

---

### Input Mapping (★★★★★)

| Feature                                | Editor (TS) | Rust Engine | Notes                              |
| -------------------------------------- | ----------- | ----------- | ---------------------------------- |
| Actions vs. axes                       | ✅          | ✅          | Full action system in both         |
| Rebind system                          | ✅          | ❌          | TS only                            |
| Composite bindings (key/mouse/gamepad) | ✅          | ✅          | WASD→Vector2, full composite types |
| Keyboard & mouse input                 | ✅          | ✅          | Complete - all 19 methods          |
| Frame-based state tracking             | ✅          | ✅          | Down/Pressed/Released states       |
| Action maps enable/disable             | ✅          | ✅          | Dynamic map switching              |

**Status:** ✅ **COMPLETE** - Full input parity achieved (2025-01-24)
**Files:** TS: `src/core/lib/input/`, Rust: `rust/engine/src/input/`

---

## 🎧 Immersion Systems

### Audio (★★★★★)

| Feature                         | Editor (TS) | Rust Engine | Notes                             |
| ------------------------------- | ----------- | ----------- | --------------------------------- |
| Spatial 3D sound                | ✅          | 🚧          | Howler.js in TS, skeleton in Rust |
| Mixer buses (SFX, voice, music) | ✅          | 🚧          | Volume control in TS              |
| Occlusion & reverb zones        | 🚧          | ❌          | Basic TS support                  |
| Audio playback API              | ✅          | 🚧          | Full TS API, basic Rust           |

**Status:** 🚧 **PARTIAL** - TS complete with Howler.js, Rust needs implementation

---

### Particles (★★★★☆)

| Feature                            | Editor (TS) | Rust Engine | Notes            |
| ---------------------------------- | ----------- | ----------- | ---------------- |
| Emitters (burst, continuous, area) | ❌          | ❌          | **CRITICAL GAP** |
| Billboard & mesh particles         | ❌          | ❌          | **CRITICAL GAP** |
| Curves & lifetime params           | ❌          | ❌          | **CRITICAL GAP** |

**Status:** ❌ **NOT IMPLEMENTED** - **Critical missing feature for VFX**

---

### Decals (★★★☆☆)

| Feature             | Editor (TS) | Rust Engine | Notes           |
| ------------------- | ----------- | ----------- | --------------- |
| Projected quads     | ❌          | ❌          | Not implemented |
| Deferred blending   | ❌          | ❌          | Not implemented |
| Depth bias handling | ❌          | ❌          | Not implemented |

**Status:** ❌ **NOT IMPLEMENTED**

---

## 🧩 Tools & Workflow

### Asset Pipeline (★★★★★)

| Feature                      | Editor (TS) | Rust Engine | Notes                                    |
| ---------------------------- | ----------- | ----------- | ---------------------------------------- |
| FBX/GLTF importer            | ✅          | ✅          | Full format support                      |
| Automatic re-import          | 🚧          | ❌          | TS hot reload                            |
| Texture compression pipeline | 🚧          | ❌          | Basic support                            |
| Model optimization           | ✅          | ❌          | **60-80% file size reduction** (TS only) |
| glTF-Transform pipeline      | ✅          | ❌          | prune, dedup, weld, quantize             |
| LOD variant generation       | ✅          | ❌          | 3 quality tiers auto-generated           |

**Status:** 🚧 **PARTIAL** - Advanced TS pipeline, basic Rust loading
**Files:** TS: `scripts/optimize-models.js`, Rust: `rust/engine/crates/model_loader/`

---

### Prefabs / Blueprints (★★★★★)

| Feature               | Editor (TS) | Rust Engine | Notes                                      |
| --------------------- | ----------- | ----------- | ------------------------------------------ |
| Nested prefabs        | ✅          | ✅          | Full TS hierarchy, complete Rust API       |
| Runtime instantiation | ✅          | ✅          | `prefab.instantiate()` Lua API working ✅  |
| Parameter overrides   | ✅          | ✅          | Position override during instantiation ✅  |
| Instance tracking     | ✅          | ✅          | `prefab.getInstances()`, `isInstance()` ✅ |
| Hot reload            | ✅          | 🚧          | TS complete, Rust partial                  |

**Status:** ✅ **EXCELLENT** - Complete runtime prefab API with Lua scripting support
**Files:** TS: `src/core/prefabs/`, Rust: `rust/engine/crates/scripting/src/apis/prefab_api.rs`

---

### Scripting System (★★★★★)

**Status:** ✅ **EXCELLENT** - TS complete (14 APIs), Rust has 24/25 APIs

**TypeScript APIs (14 Complete):**

1. ✅ Entity API, 2. ✅ Transform API, 3. ✅ Three.js API, 4. ✅ Math API, 5. ✅ Input API, 6. ✅ Time API, 7. ✅ Console API, 8. ✅ Event API, 9. ✅ Audio API, 10. ✅ Timer API, 11. ✅ Query API, 12. ✅ Prefab API, 13. ✅ GameObject API, 14. ✅ Entities API

**Rust APIs (24/25 Complete):**
1-9: Input, Timer, Entity, Transform, Math, Time, Console, Event, Audio ✅
10-14: Query, Prefab, GameObject, Entities, Physics ✅
15-20: Camera, Material, Light, Mesh, Collision, CharacterController ✅
21-23: Scene, Save/Load ✅
24: ❌ **UI API** (only remaining)

**Files:** TS: `src/core/lib/scripting/apis/`, Rust: `rust/engine/crates/scripting/src/apis/`

---

### Events / Signals (★★★★☆)

| Feature                 | Editor (TS) | Rust Engine | Notes                 |
| ----------------------- | ----------- | ----------- | --------------------- |
| Broadcast system        | ✅          | 🚧          | Pub/sub in TS         |
| Async coroutines/timers | ✅          | ✅          | Frame-budgeted timers |
| UI and AI triggers      | ✅          | ❌          | TS only               |

**Status:** 🚧 **PARTIAL** - TS complete, Rust needs full event system

---

## 🧭 Editor & Pipeline

### Scene Serialization (★★★★☆)

| Feature                                 | Editor (TS) | Rust Engine | Notes                             |
| --------------------------------------- | ----------- | ----------- | --------------------------------- |
| Stable deterministic format (YAML/JSON) | ✅          | 🚧          | TSX scene format in TS            |
| Runtime loading                         | ✅          | ✅          | Both systems                      |
| Incremental saves                       | ✅          | ❌          | TS autosave                       |
| 60-80% compression                      | ✅          | ❌          | Default omission + material dedup |

**Status:** 🚧 **PARTIAL** - Advanced TS serialization, basic Rust loading

---

### Profiler (★★★★★)

| Feature                 | Editor (TS) | Rust Engine | Notes                   |
| ----------------------- | ----------- | ----------- | ----------------------- |
| CPU/GPU frame breakdown | 🚧          | 🚧          | Basic stats display     |
| Marker zones            | 🚧          | ❌          | Partial instrumentation |
| Live graphing           | 🚧          | ❌          | Basic display           |

**Status:** 🚧 **PARTIAL** - Basic profiling, needs comprehensive tooling

---

### Build System (★★★★☆)

| Feature                        | Editor (TS) | Rust Engine | Notes               |
| ------------------------------ | ----------- | ----------- | ------------------- |
| Target presets (PC/Mobile/Web) | 🚧          | ❌          | Vite builds for web |
| Per-platform configs           | 🚧          | ❌          | Basic config        |
| Script compilation + packaging | ✅          | 🚧          | TS complete         |

**Status:** 🚧 **PARTIAL** - Web builds work, needs platform targets

---

### Debug Tools (★★★★☆)

| Feature                   | Editor (TS) | Rust Engine | Notes                          |
| ------------------------- | ----------- | ----------- | ------------------------------ |
| Gizmos & debug draw       | ✅          | ✅          | Transform gizmos, collider viz |
| Logging console           | ✅          | 🚧          | Structured logging in TS       |
| Runtime variable tweaking | ✅          | ❌          | Inspector in TS                |
| Grid rendering            | ✅          | ✅          | Both systems                   |

**Status:** 🚧 **PARTIAL** - Good debug viz, needs runtime console

---

### Terrain (★★★☆☆)

| Feature                | Editor (TS) | Rust Engine | Notes                       |
| ---------------------- | ----------- | ----------- | --------------------------- |
| Heightmap import       | ❌          | ✅          | Rust has terrain generation |
| Splat texture painting | ❌          | 🚧          | Basic material support      |
| LOD chunks             | ❌          | ❌          | Not implemented             |

**Status:** 🚧 **PARTIAL** - Basic Rust terrain, no editor tools

---

## 📊 Implementation Summary

### Feature Completion by Category

| Category                     | TS Status | Rust Status | Overall           |
| ---------------------------- | --------- | ----------- | ----------------- |
| **Core Scene Architecture**  | ✅ 95%    | ✅ 95%      | ✅ **Excellent**  |
| **Rendering Pipeline**       | ✅ 90%    | 🚧 70%      | 🚧 **Good**       |
| **Performance Optimization** | ✅ 85%    | 🚧 50%      | ⚠️ **Needs Work** |
| **Physics & Gameplay**       | ✅ 80%    | ✅ 85%      | ✅ **Excellent**  |
| **Scripting & APIs**         | ✅ 90%    | ✅ 80%      | ✅ **Excellent**  |
| **Audio & Particles**        | 🚧 60%    | 🚧 30%      | ⚠️ **Needs Work** |
| **Tooling & Pipeline**       | ✅ 85%    | 🚧 40%      | 🚧 **Fair**       |
| **Editor Features**          | ✅ 80%    | 🚧 50%      | 🚧 **Good**       |

---

## 🔴 Critical Gaps (Prioritized)

### 1. ❌ Particle/VFX System (★★★★☆)

**Impact:** Cannot create visual effects (explosions, fire, smoke, magic)
**Effort:** 2-4 weeks | **Dependencies:** None

### 2. 🚧 Custom Shader System (★★★★☆)

**Impact:** Limited to basic PBR materials, no custom visual effects
**Effort:** 2-3 weeks | **Dependencies:** Material system
**Enables:** Toon/cel shading, holograms, water, fire effects

### 3. ✅ Character Controller (★★★★★)

**Impact:** Production-ready character controller with unified architecture, deferred registration, and script API parity
**Status:** ✅ Near Complete (65%) - TS unified system complete with Phases 1-3 done, Phase 4 partial. Remaining: Inspector UX (Phase 5, ~0.5 day), comprehensive tests (Phase 6, ~0.5 day)
**Effort:** 1 day remaining | **Dependencies:** None
**Completed (2025-11-07):**

- ✅ Unified CharacterControllerSystem (deprecated Auto system)
- ✅ Script API routes through controller (no direct RigidBody manipulation)
- ✅ Deferred registration with 3-frame retry
- ✅ Registration race condition & WASM crash fixes
- ✅ Collision filters & predicates applied
- ✅ Auto/Manual control modes

### 4. ❌ Undo/Redo System (★★★★☆)

**Impact:** Professional editor requires undo/redo for usability
**Effort:** 2-3 weeks | **Dependencies:** Command pattern architecture

### 5. ✅ Rust Scripting APIs (★★★★★)

**Impact:** Complete gameplay functionality in Rust engine
**Status:** ✅ 24/25 complete - Only UI API remaining
**Effort:** 1 week for UI API | **Dependencies:** None

---

## 🎯 Recommended Implementation Order

### Phase 1: Visual Impact & Quick Wins (4-6 weeks) 🎨

**Goal:** Maximum visible progress with immediate user satisfaction

1. **Particle/VFX System** (2-4 weeks) - Explosions, fire, smoke - instantly impressive
2. **Complete Character Controller** (1-2 weeks) - Upgrade to Rapier KinematicCharacterController for slope/step/snap features (basic collisions already work)
3. **FXAA Anti-Aliasing** (1 week) - Smooth jagged edges
4. **Custom Shader System - Basic** (2-3 weeks) - Toon shading, holograms, water

**Outcome:** Users see impressive visual results and can interact with creations

---

### Phase 2: Performance Foundation (1-2 weeks) ⚡

**Goal:** Ensure smooth performance with all visual features

1. **Material Deduplication (Rust)** (3-5 days) - Memory optimization
2. **Mesh Optimization Pipeline (Rust)** (1 week) - Port asset optimization
3. **Dynamic Batching Improvements** (3-5 days) - Reduce draw calls

**Outcome:** Smooth 60fps performance even with complex visual scenes
**Note:** LOD and BVH already complete in Rust ✅

---

### Phase 3: Professional Tools (3-4 weeks) 🔧

**Goal:** Complete professional development experience

1. **Undo/Redo System** (2-3 weeks) - Professional editor experience
2. **Complete Rust APIs** (1 week) - Finish UI API
3. **Enhanced Entity-Component Access** (1-2 weeks) - Better DX

**Outcome:** Professional-grade tools for efficient development

---

### Phase 4: Advanced Features (6-10 weeks) 🚀

**Goal:** Multi-platform deployment and advanced capabilities

1. **Skinned Mesh Animation** (4-6 weeks) - Character animation
2. **Build System** (4-6 weeks) - Multi-platform deployment
3. **Navigation/Pathfinding** (4-6 weeks) - AI agent support

---

## 📈 Progress Tracking

**Overall Completion:**

- ✅ Complete Features: 48% (↑3% with Character Controller progress)
- 🚧 Partial Features: 32%
- ❌ Missing Features: 20%

**Character Controller Progress:** 65% complete (Phases 1-3 done, Phase 4 partial)

**Feature Parity (TS vs Rust):**

- ✅ Full Parity: Physics, Scene Graph, Lighting, Materials, Input, BVH, LOD, Raycasting
- 🚧 Partial Parity: Rendering, Scripting, Audio, Serialization, Character Controller
- ⚠️ Critical Gaps: Particle System

**Scripting API Completion:**

- TypeScript: 58% (14/24 APIs)
- Rust: 96% (24/25 APIs) - Only UI API remaining

---

## 🏆 Strengths & Achievements

### ✅ Completed Systems

1. **Transform & Scene Graph** - Complete hierarchy in both TS and Rust
2. **Physics Integration** - Full Rapier3D with complete parity
3. **PBR Materials** - Professional material pipeline
4. **Prefab System** - Advanced runtime instantiation
5. **TypeScript Scripting** - 14 complete APIs
6. **Rust Scripting** - 24/25 complete APIs (96%)
7. **Asset Optimization** - 60-80% file size reduction
8. **BVH Spatial Acceleration** - 10-100x raycasting speedup (TS + Rust)
9. **LOD System** - 3 quality tiers (TS + Rust)
10. **Input System** - Full parity with action mapping
11. **Character Controller** - **65% complete** - Unified system with deferred registration, script API parity, auto/manual modes (TS near complete, Rust partial)

### 🎯 Competitive Advantages

- **Hybrid Architecture:** TypeScript editor + Rust engine
- **Advanced Optimization:** Best-in-class asset pipeline with massive compression
- **Spatial Acceleration:** BVH provides industry-leading raycasting performance
- **Modular Design:** Clean separation with workspace crates
- **Hot Reload:** Fast iteration with script and asset reloading

---

**Last Updated:** 2025-11-07 (Character Controller Gap Closure Phases 1-3 Complete)
**Engine Version:** Vibe Coder 3D (Visual-First Phase)
**Codebase:** `/home/joao/projects/vibe-coder-3d`

**Development Timeline Estimates:**

- **Minimum Viable Engine:** 16-22 weeks (Phases 1-2)
- **Production Ready:** 24-35 weeks (Phases 1-3)
- **Feature Complete:** 38-56 weeks (Phases 1-4)

---

## 🎮 Getting to a Playable Game (Platformer/Endless Runner)

**Goal:** Ship a basic functional game in 2-3 weeks

### Critical Path (Must Have)

| Priority | Feature                       | Status       | Effort   | Why Critical                                                                   |
| -------- | ----------------------------- | ------------ | -------- | ------------------------------------------------------------------------------ |
| **P0**   | Complete Character Controller | ✅ Near Done | 1 day    | Core complete (65%), needs Inspector UX + tests (Phases 5-6)                   |
| **P0**   | Basic UI/HUD (workaround)     | 🚧 Partial   | 2-3 days | Score display, game over screen - can use console.log or simple text rendering |
| **P1**   | Game State Management         | ✅ Ready     | Scripts  | Can be done entirely in Lua scripts using existing APIs                        |
| **P1**   | Obstacle/Enemy Spawning       | ✅ Ready     | Scripts  | Use GameObject.createPrimitive() + physics in scripts                          |

### What You Already Have ✅

- ✅ **Character Controller** - Basic movement + collisions working
- ✅ **Physics System** - Full Rapier3D integration
- ✅ **Input System** - Complete (WASD, Space, etc.)
- ✅ **Scripting** - 24/25 APIs (can do game logic in Lua)
- ✅ **Rendering** - PBR materials, lighting, shadows
- ✅ **Scene Management** - Load/save scenes, prefabs
- ✅ **Entity System** - Create/destroy entities at runtime

### Minimal Viable Game Path (2-3 weeks)

**Week 1: Core Gameplay**

1. **Polish Character Controller** (1 day) ✅ **Core Complete!**
   - ✅ Rapier KinematicCharacterController integrated
   - ✅ Slope limiting, step climbing, ground snapping working
   - ✅ Unified system with script API parity
   - 🚧 Remaining: Inspector UX (optional), comprehensive tests (recommended)
   - Ready to use for gameplay!

**Week 2: Game Mechanics** (Can do in parallel with Week 1) 2. **Basic UI Workaround** (2-3 days)

- Option A: Use `console.log` for score/debug (quickest)
- Option B: Simple text rendering overlay (better UX)
- Option C: Wait for UI API (1 week) - if you want proper UI

3. **Game Logic Scripts** (2-3 days)
   - Score tracking (use Save/Load API or global variables)
   - Obstacle spawning (GameObject.createPrimitive)
   - Collision detection (Collision API already exists)
   - Game over logic

**Week 3: Polish & Testing** 4. **Level Design** (1-2 days)

- Create platformer level or endless runner obstacles
- Test difficulty curve

5. **Polish** (2-3 days)
   - Add sound effects (Audio API exists)
   - Tune character controller feel
   - Add simple visual feedback

### Platformer-Specific Needs

| Feature            | Status   | Solution                                           |
| ------------------ | -------- | -------------------------------------------------- |
| Jump mechanics     | ✅ Ready | Character controller has jump, can tune in scripts |
| Platform collision | ✅ Ready | Physics collisions work                            |
| Slope handling     | ✅ Ready | KinematicCharacterController with slopeLimit       |
| Step climbing      | ✅ Ready | Auto-step with configurable stepOffset             |
| Moving platforms   | ✅ Ready | Use kinematic rigid bodies + scripts               |
| Collectibles       | ✅ Ready | Use triggers + Collision API                       |

### Endless Runner-Specific Needs

| Feature             | Status   | Solution                                |
| ------------------- | -------- | --------------------------------------- |
| Forward movement    | ✅ Ready | Character controller move()             |
| Obstacle spawning   | ✅ Ready | GameObject.createPrimitive() in scripts |
| Obstacle removal    | ✅ Ready | GameObject.destroy() when off-screen    |
| Score tracking      | ✅ Ready | Save/Load API or scripts                |
| Speed increase      | ✅ Ready | Script logic                            |
| Collision detection | ✅ Ready | Collision API                           |

### Quick Win: Console-Based Game (1 week)

If you want to ship something FAST, you can skip UI API and use:

```lua
-- Simple score display via console
function update()
    local score = getScore()
    console.log("Score: " .. score)
end

-- Game over detection
function onCollisionEnter(otherEntityId)
    if otherEntityId == obstacleId then
        console.log("GAME OVER! Final Score: " .. score)
        -- Reset game logic here
    end
end
```

### Recommended Order for First Playable Game

1. ✅ **Character Controller** - **READY!** Core complete (2025-11-07)
2. **Basic UI Workaround** (2-3 days) - Use console or simple text
3. **Game Scripts** (2-3 days) - Score, obstacles, game over
4. **Level Design** (1-2 days) - Build your first level
5. **Polish** (2-3 days) - Sound, feel, difficulty

**Total: 1-2 weeks to playable game** (Character controller no longer blocking! 🎉)

### What You DON'T Need (Yet)

- ❌ Particle/VFX System - Nice to have, not required
- ❌ Custom Shaders - Basic PBR is fine
- ❌ Animation System - Static meshes work
- ❌ Advanced Profiling - Basic stats are enough
- ❌ Undo/Redo - Not needed for gameplay

---

- **[IMPLEMENTED-FEATURES-LIST.md](./IMPLEMENTED-FEATURES-LIST.md)** - Detailed documentation of all completed features with technical details, test coverage, file paths, and performance metrics
- **[rust/engine/README.md](./rust/engine/README.md)** - Rust engine documentation
- **[CLAUDE.md](./CLAUDE.md)** - Development workflow and project guidelines
- **[docs/](./docs/)** - Additional documentation and guides
