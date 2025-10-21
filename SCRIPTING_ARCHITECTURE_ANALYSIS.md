# Scripting Architecture Analysis: TypeScript/Three.js to Rust Engine

## Executive Summary

This document provides a comprehensive analysis of the TypeScript scripting system and the Rust engine architecture, enabling a discussion about scripting support in Rust.

---

## PART 1: TypeScript Scripting Architecture

### 1.1 Overview

The TypeScript codebase implements a sophisticated **runtime scripting system** that allows gameplay developers to write TypeScript/JavaScript code that executes at runtime with sandboxed access to engine APIs.

**Key Philosophy**: Scripts are functions that execute in a controlled sandbox with 14 global APIs providing all engine interactions.

### 1.2 Core Architecture

#### Location

```
src/core/lib/scripting/
├── ScriptAPI.ts              # Interface definitions (source of truth)
├── DirectScriptExecutor.ts   # Script compilation/execution (CURRENT - uses Function())
├── SafeScriptExecutor.ts     # Legacy pattern-matching executor (deprecated)
├── ScriptResolver.ts         # External script file loading
├── ThreeJSEntityRegistry.ts  # Entity→Three.js object mapping
├── ScriptContextFactory.ts   # Context creation
└── apis/
    ├── EventAPI.ts
    ├── AudioAPI.ts
    ├── TimerAPI.ts
    ├── QueryAPI.ts
    ├── PrefabAPI.ts
    └── EntitiesAPI.ts

src/core/systems/
└── ScriptSystem.ts          # ECS system managing lifecycle
```

#### Execution Model

**DirectScriptExecutor (Current Implementation)**:

- Uses JavaScript `Function()` constructor for full language support
- Scripts are compiled once per entity, then reused
- Execution context passes APIs as parameters (lexical closure)
- Full JavaScript support: variables, loops, conditionals, functions

**Security**:

- Strict mode: `'use strict'`
- No access to window/document/outer scope
- APIs passed as parameters only
- Three.js access restricted via proxy whitelist

### 1.3 The 14 Global APIs

Scripts have access to these APIs:

#### 1. Entity API

```typescript
entity.id; // EntityId
entity.name; // Entity name
entity.getComponent<T>(type);
entity.setComponent<T>(type, data);
entity.hasComponent(type);
entity.removeComponent(type);
entity.getParent() / getChildren() / findChild();
entity.destroy();
entity.setActive(active);
entity.isActive();
```

#### 2. Transform API

```typescript
entity.transform.position; // [x, y, z]
entity.transform.rotation; // [x, y, z] in degrees
entity.transform.scale; // [x, y, z]
entity.transform.setPosition / setRotation / setScale(x, y, z);
entity.transform.translate(x, y, z);
entity.transform.rotate(x, y, z);
entity.transform.lookAt([x, y, z]);
entity.transform.forward() / right() / up();
```

#### 3. Three.js API

```typescript
three.object3D / mesh / group / scene / parent / children;
three.material.get() / set() / setColor() / setOpacity() / setMetalness() / setRoughness();
three.geometry.get() / scale() / rotateX / Y / Z();
three.animate.position / rotation / scale(to, duration); // Returns Promise
three.raycast(origin, direction);
three.lookAt() / worldPosition() / worldRotation();
three.setVisible() / isVisible();
```

#### 4. Math API

```typescript
// Constants: PI, E
// Functions: abs, sin/cos/tan, floor/ceil/round, sqrt, pow, min/max, random
// Game utilities: lerp, clamp, distance, degToRad, radToDeg
```

#### 5. Input API

```typescript
// Basic keyboard/mouse
input.isKeyDown/Pressed/Released(key)
input.isMouseButtonDown/Pressed/Released(button)
input.mousePosition() / mouseDelta() / mouseWheel()

// Input Actions System
input.getActionValue('Gameplay', 'Move')  // Returns value/[x,y]/[x,y,z]
input.isActionActive('Gameplay', 'Jump')
input.onAction('Gameplay', 'Fire', (phase, value) => {...})
```

#### 6. Time API

```typescript
time.time; // Total time since start (seconds)
time.deltaTime; // Time since last frame (seconds)
time.frameCount; // Total frames rendered
```

#### 7. Console API

```typescript
console.log() / warn() / error() / info();
// Logs prefixed with [Script:EntityId]
```

#### 8. Event API

```typescript
events.on('event:name', (payload) => {...})     // Returns unsubscribe function
events.off('event:name', handler)
events.emit('event:name', payload)
```

#### 9. Audio API

```typescript
audio.play('/sounds/jump.wav', { volume: 0.8, loop: false }); // Returns soundId
audio.stop(soundId) / audio.stop('/sounds/jump.wav');
audio.attachToEntity(true); // Follow entity position
```

#### 10. Timer API

```typescript
timer.setTimeout(cb, ms) / clearTimeout(id);
timer.setInterval(cb, ms) / clearInterval(id);
timer.nextTick(); // Promise<void>
timer.waitFrames(count); // Promise<void>
```

**Frame Budget**: 5ms max per frame to prevent blocking

#### 11. Query API

```typescript
query.findByTag(tag); // Returns entity IDs
query.raycastFirst(origin, dir); // Returns first hit
query.raycastAll(origin, dir); // Returns all hits
```

#### 12. Prefab API

```typescript
prefab.spawn('prefab-id', { position, rotation }); // Returns entityId
prefab.destroy(entityId);
prefab.setActive(entityId, active);
```

#### 13. GameObject API

```typescript
gameObject.createEntity(name, parent);
gameObject.createPrimitive('cube', { name, transform, material, physics });
gameObject.createModel('/assets/robot.glb', options);
gameObject.clone(sourceId, { name, transform });
gameObject.attachComponents(entityId, components);
gameObject.setParent(childId, parentId);
gameObject.destroy(entityId);
```

#### 14. Entities API

```typescript
entities.get(entityId); // Returns IEntityScriptAPI
entities.fromRef(entityRef); // Resolve entity reference
entities.exists(entityId);
entities.findByName(name); // Returns IEntityScriptAPI[]
entities.findByTag(tag); // Returns IEntityScriptAPI[]
```

### 1.4 Script Lifecycle

Scripts can implement 5 lifecycle methods:

```typescript
// Called once when entity/script is created
function onStart(): void {}

// Called every frame during play mode
function onUpdate(deltaTime: number): void {}

// Called when entity/script is destroyed
function onDestroy(): void {}

// Called when component is enabled
function onEnable(): void {}

// Called when component is disabled
function onDisable(): void {}
```

### 1.5 Script Parameters

Scripts can declare configurable parameters:

```typescript
const speed = (parameters.speed as number) || 5.0;
const targetEntity = parameters.target as IEntityRef;
```

Parameters are set in editor UI and passed to script context.

### 1.6 Execution Flow

```
Script Component added to entity
    ↓
ScriptSystem.updateScriptSystem() runs each frame
    ↓
Scheduler processes timers (frame budget: 5ms)
    ↓
For each script entity:
    1. Check if compilation needed
    2. Compile with DirectScriptExecutor (Function constructor)
    3. Create script context with all 14 APIs
    4. Call onStart() if first frame
    5. Call onUpdate(deltaTime) every frame
    ↓
Entity destroyed
    ↓
onDestroy() called
All timers/listeners auto-cleaned
Context removed from cache
```

### 1.7 Type Safety

**Type Definitions**: Auto-generated `src/game/scripts/script-api.d.ts` provides:

- Full TypeScript types for all APIs
- JSDoc documentation
- IDE autocomplete support
- Compile-time type checking

### 1.8 Example Scripts

**Simple Rotation Script**:

```typescript
function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * Math.PI, 0);
}
```

**Player Movement**:

```typescript
const speed = 5.0;

function onUpdate(deltaTime: number): void {
  const moveSpeed = speed * deltaTime;

  const moveInput = input.getActionValue('Gameplay', 'Move');
  if (Array.isArray(moveInput)) {
    const [x, y] = moveInput;
    entity.transform.translate(x * moveSpeed, 0, y * moveSpeed);
  }
}
```

**Event Communication**:

```typescript
// Emitter
function onUpdate(deltaTime: number): void {
  if (input.isActionActive('Gameplay', 'Jump')) {
    events.emit('player:jumped', {
      entityId: entity.id,
      height: entity.transform.position[1],
    });
  }
}

// Listener
function onStart(): void {
  events.on('player:jumped', (payload) => {
    audio.play('/sounds/jump.wav');
  });
}
```

**Cross-Entity Interaction**:

```typescript
const targetRef = parameters.targetEntity as IEntityRef;

function onUpdate(deltaTime: number): void {
  const target = entities.fromRef(targetRef);
  if (!target) return;

  const distance = math.distance(
    entity.transform.position[0],
    entity.transform.position[1],
    entity.transform.position[2],
    target.transform.position[0],
    target.transform.position[1],
    target.transform.position[2],
  );

  if (distance > 2.0) {
    entity.transform.lookAt(target.transform.position);
    entity.transform.translate(0, 0, -deltaTime * 3);
  }
}
```

---

## PART 2: Rust Engine Architecture

### 2.1 Overview

Native Rust engine using **three-d** library and **wgpu** GPU backend. Loads JSON scene files exported by TypeScript editor.

**No scripting system exists yet** - this is the key gap.

### 2.2 Core Structure

```
rust/engine/
├── src/
│   ├── main.rs                    # CLI entrypoint
│   ├── app.rs                     # Application lifecycle
│   ├── threed_renderer.rs         # Main renderer (thin orchestration)
│   ├── renderer/                  # Specialized modules
│   │   ├── material_manager.rs
│   │   ├── mesh_loader.rs
│   │   ├── light_loader.rs
│   │   ├── camera_loader.rs
│   │   ├── skybox.rs
│   │   ├── post_processing.rs
│   │   └── enhanced_lights.rs
│   ├── ecs/
│   │   ├── scene.rs              # Scene model
│   │   └── components/           # Transform, MeshRenderer, Camera, Light
│   ├── io/
│   │   └── loader.rs             # JSON scene loading
│   └── util/
│       └── time.rs

└── crates/                         # Workspace crates
    ├── scene/                      # Core EntityId, Scene, Entity types
    ├── ecs-bridge/                 # Component registry & decoders
    ├── scene-graph/                # Transform hierarchy (planned)
    ├── assets/                     # Mesh/texture/material caches (planned)
    ├── physics/                    # Physics integration
    ├── audio/                      # Audio system
    └── wasm-bridge/                # WASM integration (planned)
```

### 2.3 Data Flow

```
JSON Scene File
    ↓
io/loader.rs (Deserialize via serde)
    ↓
SceneData { entities, materials, metadata }
    ↓
vibe-ecs-bridge (Component Registry)
    ├─ Transform decoder → Rust Transform struct
    ├─ MeshRenderer decoder → Rust MeshRenderer struct
    ├─ Camera decoder → Rust Camera struct
    └─ Light decoder → Rust Light struct
    ↓
ThreeDRenderer
    ├─ MaterialManager (per-material GPU resources)
    ├─ MeshLoader (cached meshes)
    ├─ CameraLoader (perspective camera setup)
    ├─ LightLoader (lighting setup)
    └─ SkyboxRenderer (background)
    ↓
wgpu GPU Rendering
    ↓
Window Display
```

### 2.4 ECS Bridge

The **vibe-ecs-bridge** crate bridges TypeScript ECS to Rust:

**Component Registry**:

- `IComponentDecoder` trait: any component can define decoder
- `decode()` method: JSON → typed Rust struct
- `ComponentCapabilities`: tracks rendering/physics/etc requirements

**Supported Components**:

- Transform (position, rotation in Euler degrees, scale)
- Camera (FOV, near/far, projection)
- MeshRenderer (meshId, materialId, modelPath, shadows)
- Material (color, metallic, roughness, textures)
- Light (type, color, intensity, shadows)
- RigidBody (physics)
- MeshCollider (physics)

**Critical: Degrees vs Radians**

**MAJOR BUG FIXED**: TypeScript stores rotation as Euler angles in **DEGREES**, Rust expects **RADIANS**.

Standardized utilities in `vibe_ecs_bridge::transform_utils`:

```rust
use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};

// ✅ CORRECT
let position = position_to_vec3_opt(transform.position.as_ref());
let rotation = rotation_to_quat_opt(transform.rotation.as_ref());  // degrees→radians
let scale = scale_to_vec3_opt(transform.scale.as_ref());

// ❌ WRONG
let rotation = Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2]);  // treats as radians!
```

### 2.5 Component System

Each component is data-only in Rust:

```rust
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>,  // Euler degrees OR quaternion
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}
```

**Decoder Pattern**:

1. Define struct with `#[derive(Deserialize)]`
2. Implement `IComponentDecoder` trait
3. Register in `create_default_registry()`
4. Write tests

### 2.6 What's NOT Yet Implemented

**Missing for parity with TypeScript**:

- [ ] Runtime entity creation (GameObject API)
- [ ] Event system (cross-entity communication)
- [ ] Audio playback (skeleton exists)
- [ ] Input handling system
- [ ] Timer/scheduler system
- [ ] Query system (raycasting, findByTag)
- [ ] Prefab spawning
- [ ] Dynamic component attachment
- [ ] **SCRIPTING SYSTEM** (completely missing)

---

## PART 3: Bridging Gap - Script System for Rust

### 3.1 Architecture Decisions

Designing a Rust scripting system requires addressing:

#### A. Language Choice

**Options**:

1. **TypeScript/JavaScript** (WASM via wasm-bindgen)

   - Pros: Reuse scripts from TypeScript version
   - Cons: WASM overhead, slower than native
   - Ideal for: gameplay variety, high iteration

2. **Rust** (proc macros for syntax sugar)

   - Pros: Best performance, type safety
   - Cons: Recompile required, longer iteration
   - Ideal for: high-performance systems

3. **Lua** (mlua crate)

   - Pros: Fast, small, designed for embedding
   - Cons: Different syntax, need bindings
   - Ideal for: mod support, safety

4. **Python** (PyO3 crate)
   - Pros: Developer familiar, large ecosystem
   - Cons: Slow, heavy runtime, complex bindings
   - Ideal for: AI/tooling, not realtime

#### B. Execution Model

**TypeScript Model** (what exists):

```
Each frame:
  For each script entity:
    Call onUpdate(deltaTime)

Pros: Simple, all scripts same priority
Cons: Hard to control execution order
```

**Proposed Rust Model** (Option 1: Function Pointers):

```
Define scripts as Rust functions compiled into binary
Register at startup

Each frame:
  For each script entity:
    Call registered function(entity_id, context)

Pros: Type-safe, performant
Cons: Must recompile, no hot-reload
```

**Proposed Rust Model** (Option 2: Dynamic Loading):

```
Define scripts as separate Rust libraries (.rlib/.so)
Dynamically load via libloading

Each frame:
  For each script entity:
    Call dynamically-loaded function

Pros: Hot-reload, no main recompile
Cons: Complex ABI compatibility, version conflicts
```

**Proposed Rust Model** (Option 3: WASM Sandboxing):

```
Compile scripts to WebAssembly
Embed WASM runtime (wasmtime/wasmer)

Each frame:
  For each script entity:
    Call WASM function via host

Pros: True sandboxing, can run TypeScript scripts too
Cons: WASM overhead, different performance profile
```

### 3.2 Proposed API Structure

To replicate TypeScript functionality, Rust script context would provide:

```rust
pub struct ScriptContext {
    pub entity_id: EntityId,
    pub transform: TransformAPI,
    pub mesh: MeshAPI,
    pub time: TimeAPI,
    pub input: InputAPI,
    pub audio: AudioAPI,
    pub timer: TimerAPI,
    pub query: QueryAPI,
    pub events: EventAPI,
    pub math: MathAPI,
    // ... etc
}

// Script trait
pub trait Script: Send + Sync {
    fn on_start(&mut self, context: &ScriptContext);
    fn on_update(&mut self, context: &ScriptContext, delta_time: f32);
    fn on_destroy(&mut self, context: &ScriptContext);
}
```

### 3.3 Integration Points

**Where to integrate**:

1. **ECS System**:

   - Add `Script` component type
   - Query for `Script` components
   - Execute each frame in `systems/script_system.rs`

2. **Component Registry**:

   - Add `ScriptDecoder` to vibe-ecs-bridge
   - Parse Script components from JSON
   - Store script reference (function pointer or WASM module)

3. **Event System**:

   - Scripts emit events via API
   - Other systems/scripts listen
   - Event::PlayerJumped, Event::EntitySpawned, etc

4. **Timer System**:

   - Scripts schedule callbacks
   - Frame-budgeted like TypeScript version
   - Auto-cleanup on entity destruction

5. **Scene Loading**:
   - Parse `"Script"` components from JSON
   - Compile/load script code
   - Wire into ECS system

### 3.4 Technical Challenges

#### Challenge 1: Type Safety vs Flexibility

TypeScript scripts are loosely typed and dynamic. Rust is strongly typed and static.

**Solution**: Define trait-based APIs that scripts implement.

#### Challenge 2: Memory Safety with Script References

Scripts hold references to entities/components. Rust borrow checker prevents multiple mutable references.

**Solution**: Use interior mutability (Arc<Mutex<T>>) or handle script logic separately from mutable component access.

#### Challenge 3: Compilation/Iteration Speed

TypeScript scripts can change without recompiling. Rust requires full rebuild.

**Solution**:

- Use WASM for hot-reload capability
- Or use proc macros for DSL that compiles fast
- Or use Lua/scripting language

#### Challenge 4: Hot Reload

TypeScript supports hot-reload. Rust compiled-in code doesn't.

**Solution**:

- Lua integration for hot-reload scripts
- WASM for dynamic code loading
- Or separate script binary that can be reloaded

### 3.5 Recommended Approach

**For MVP (Minimum Viable Product)**:

**Use Lua** via `mlua` crate:

- ✅ Fast, lightweight, designed for embedding
- ✅ Hot-reload capable
- ✅ Simple to sandbox
- ✅ Proven track record (game industry standard)
- ✅ Can bridge to Rust via function pointers

**Why not TypeScript WASM initially**:

- WASM runtime overhead (not worth for one-shot scripts)
- Better to migrate scripts gradually
- Lua can coexist with native Rust scripts

**Architecture**:

```
Script Component
    ↓
ScriptDecoder (ecs-bridge) → Lua code path
    ↓
LuaRuntime (vibe-lua crate)
    ├─ Load .lua file
    ├─ Compile to bytecode
    └─ Store in registry
    ↓
Each frame: LuaSystem
    For each script entity:
      Call lua_function(entity_ctx, delta_time)
      ↓
      LuaHost APIs (wrapper around native Rust)
      ├─ entity.get_position()
      ├─ entity.set_position()
      ├─ events.emit()
      ├─ timer.set_timeout()
      └─ ... (14 APIs like TypeScript)
```

**Migration Path**:

1. Implement Lua scripting (fast iteration)
2. Gradually move performance-critical scripts to Rust
3. Eventually add WASM if needed for TypeScript interop

---

## PART 4: Key Design Patterns

### 4.1 Entity Lifecycle in Scripts

Both systems follow same pattern:

```
Created
  ↓
onStart()           ← Initialize state, set initial values
  ↓
onUpdate() loop     ← Called every frame, respond to input/events
  ↓
onDestroy()         ← Cleanup, unsubscribe events, stop timers
  ↓
Destroyed
```

### 4.2 Context Pattern

Both systems pass context through APIs:

```typescript
// TypeScript
function onUpdate(deltaTime: number): void {
  entity.transform.position = [0, 1, 0];
  events.emit('player:moved', {});
}
```

```rust
// Rust (proposed)
fn on_update(context: &mut ScriptContext, delta_time: f32) {
    context.entity.set_position([0.0, 1.0, 0.0]);
    context.events.emit("player:moved", serde_json::json!({}));
}
```

Same APIs, different syntax.

### 4.3 Parameter System

Both support configurable script parameters:

```json
{
  "type": "Script",
  "data": {
    "code": "...",
    "parameters": {
      "speed": 5.0,
      "targetEntity": { "entityId": 42 },
      "jumpSound": "/sounds/jump.wav"
    }
  }
}
```

### 4.4 Event Pub/Sub

Both use global event bus:

```typescript
// TypeScript
events.on('player:jumped', handleJump);
events.emit('player:jumped', { height: 5 });
```

```rust
// Rust (proposed)
context.events.on("player:jumped", Box::new(|payload| {
    println!("Player jumped!");
}));
context.events.emit("player:jumped", json!({"height": 5}));
```

### 4.5 Async/Promises

TypeScript uses async/await for animations:

```typescript
await three.animate.position([0, 5, 0], 1000);
await timer.waitFrames(60);
```

Rust would use async tasks or callbacks:

```rust
// Option 1: Callbacks
context.animate.position([0.0, 5.0, 0.0], 1.0, Box::new(|_| {
    println!("Animation complete");
}));

// Option 2: Async (if using tokio)
context.animate.position_async([0.0, 5.0, 0.0], 1.0).await;
```

---

## PART 5: JSON Schema for Scripts

### 5.1 Scene JSON Format

Scripts appear in scene JSON as components:

```json
{
  "entities": [
    {
      "name": "Player",
      "components": {
        "Transform": {
          "position": [0, 1, 0],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        },
        "Script": {
          "code": "function onUpdate(dt) { ... }",
          "language": "lua", // or "typescript", "rust"
          "enabled": true,
          "parameters": {
            "speed": 5.0,
            "jumpForce": 10.0
          }
        }
      }
    }
  ]
}
```

### 5.2 Component Registration

In ecs-bridge:

```rust
pub struct Script {
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub language: Option<String>,  // "lua", "typescript", "rust"
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub parameters: Option<serde_json::Value>,
}

pub struct ScriptDecoder;

impl IComponentDecoder for ScriptDecoder {
    fn can_decode(&self, kind: &str) -> bool { kind == "Script" }
    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let script: Script = serde_json::from_value(value.clone())?;
        Ok(Box::new(script))
    }
    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities::none()  // Scripts are logic, not rendering
    }
    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Script")]
    }
}
```

---

## PART 6: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Define Rust script trait
- [ ] Create ScriptContext struct with all 14 APIs
- [ ] Implement basic ScriptDecoder
- [ ] Create scripts/system.rs in engine

### Phase 2: Core APIs (Week 2-3)

- [ ] EntityAPI - get/set components, hierarchy
- [ ] TransformAPI - position/rotation/scale
- [ ] TimeAPI - delta time access
- [ ] MathAPI - utilities
- [ ] Basic logging

### Phase 3: Integration (Week 3-4)

- [ ] Wire ScriptSystem into app.rs update loop
- [ ] Parse Script components from JSON
- [ ] Auto-cleanup on entity destruction
- [ ] Frame-budgeted execution

### Phase 4: Advanced APIs (Week 4-5)

- [ ] EventAPI - global event bus
- [ ] AudioAPI - sound playback
- [ ] TimerAPI - setTimeout/setInterval
- [ ] QueryAPI - raycasting, findByTag

### Phase 5: Testing & Docs (Week 5-6)

- [ ] Unit tests for each API
- [ ] Integration tests with real scenes
- [ ] Benchmark performance
- [ ] Documentation & examples

### Phase 6: WASM Bridge (Optional, Later)

- [ ] WASM runtime integration
- [ ] TypeScript script transpilation
- [ ] Hot-reload capability

---

## PART 7: Key Files & Structures Summary

### TypeScript Side

```
src/core/lib/scripting/
  ├─ ScriptAPI.ts (14 interface definitions)
  ├─ DirectScriptExecutor.ts (Function() based execution)
  ├─ ScriptResolver.ts (external .ts file loading)
  └─ apis/ (implementation of each API)
    ├─ EventAPI.ts
    ├─ AudioAPI.ts
    ├─ TimerAPI.ts
    └─ ... (10 more)

src/core/systems/
  └─ ScriptSystem.ts (lifecycle management)
```

### Rust Side (Current)

```
rust/engine/crates/ecs-bridge/
  └─ src/decoders.rs (component registry)

rust/engine/src/
  └─ ecs/components/ (Transform, Camera, Light, MeshRenderer)
```

### Rust Side (Proposed)

```
rust/engine/crates/
  └─ scripting/ (NEW)
    ├─ src/
    │   ├─ lib.rs
    │   ├─ script_api.rs (14 traits)
    │   ├─ script_executor.rs (runs scripts)
    │   ├─ script_context.rs (runtime context)
    │   └─ apis/ (implementation)
    │       ├─ entity_api.rs
    │       ├─ transform_api.rs
    │       ├─ event_api.rs
    │       └─ ...
    └─ Cargo.toml

rust/engine/src/
  └─ systems/
    └─ script_system.rs (ECS integration)
```

---

## Conclusion

The TypeScript scripting system is a sophisticated, well-architected runtime that provides 14 APIs for gameplay development. It uses:

1. **Sandboxed execution** via Function() constructor
2. **Lexical closure** for API access
3. **Event-driven architecture** for cross-entity communication
4. **Frame-budgeted timers** for performance
5. **Auto-cleanup** on entity destruction
6. **Full JavaScript support** with TypeScript typing

To replicate this in Rust, the recommendation is:

**MVP Approach: Lua Scripting**

- Use `mlua` crate for lightweight, hot-reloadable scripting
- Define trait-based APIs mirroring TypeScript structure
- Create ScriptSystem that runs each frame
- Gradually migrate to native Rust as needed

**Long-term: WASM Bridge**

- Support TypeScript scripts via WASM
- Allow direct TypeScript code reuse
- Full feature parity with editor

The architecture should prioritize:

1. **Ease of use** (scripts are how gameplay is written)
2. **Performance** (scripts run every frame)
3. **Safety** (prevent scripts from breaking engine)
4. **Debugging** (clear error messages, stack traces)
5. **Hot-reload** (fast iteration)
