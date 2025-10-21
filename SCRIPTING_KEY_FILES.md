# Scripting Architecture - Key Files Reference

## TypeScript Scripting System Files

### Core System Files

**`/src/core/lib/scripting/ScriptAPI.ts`** (Source of Truth - 887 lines)

- Defines all 14 API interfaces: IMathAPI, ITransformAPI, IInputAPI, ITimeAPI, etc.
- Single source of truth for script capabilities
- Each interface precisely defines what scripts can do
- Helper functions to create API implementations (createMathAPI, createThreeJSAPI, etc)
- Key insight: All APIs are created fresh for each script execution

**`/src/core/lib/scripting/DirectScriptExecutor.ts`** (CURRENT - uses Function())

- Execution engine for scripts
- Uses JavaScript `Function()` constructor for full language support
- Compiles script code once per entity, caches result
- Passes all 14 APIs as function parameters (sandboxing)
- Returns object with lifecycle methods: {onStart, onUpdate, onDestroy, onEnable, onDisable}
- Key patterns: Strict mode, no access to outer scope

**`/src/core/lib/scripting/SafeScriptExecutor.ts`** (DEPRECATED)

- Old pattern-matching based executor
- No longer used - reference only
- Shows why DirectScriptExecutor is better

**`/src/core/systems/ScriptSystem.ts`** (Lifecycle Management - 200+ lines)

- Queries for Script components using bitecs
- Manages compilation, caching, lifecycle
- Calls onStart() on first frame, onUpdate() every frame, onDestroy() on cleanup
- Uses DirectScriptExecutor singleton
- Handles entity destruction cleanup

### API Implementation Files

**`/src/core/lib/scripting/apis/`** (14 separate implementations)

Each API gets its own file implementing one of the 14 interfaces:

1. **EventAPI.ts** - Global event bus (on, off, emit)

   - Returns unsubscribe functions
   - Auto-cleanup on entity destruction

2. **AudioAPI.ts** - Sound playback

   - Howler.js integration (2D and 3D)
   - Returns sound IDs for management
   - Auto-stop on entity destruction

3. **TimerAPI.ts** - Scheduled callbacks

   - setTimeout, setInterval, clearTimeout, clearInterval
   - nextTick(), waitFrames() for Promise-based waiting
   - Frame budget: 5ms max per frame

4. **QueryAPI.ts** - Scene queries

   - findByTag(tag) - returns entity IDs
   - raycastFirst/raycastAll - raycasting

5. **PrefabAPI.ts** - Entity spawning

   - spawn(prefabId, overrides) - returns entityId
   - destroy(entityId)
   - setActive(entityId, bool)

6. **EntitiesAPI.ts** - Cross-entity operations
   - get(entityId) - returns IEntityScriptAPI
   - fromRef(ref) - resolve entity reference
   - exists(entityId)
   - findByName/findByTag

**`/src/core/lib/scripting/ScriptResolver.ts`**

- Loads external .ts script files
- Supports hot-reload during development
- Resolves script references

**`/src/core/lib/scripting/ThreeJSEntityRegistry.ts`**

- Maps entity IDs to Three.js object3D instances
- Required for three.object3D, three.mesh, three.geometry access

**`/src/core/lib/scripting/ScriptContextFactory.ts`**

- Creates IScriptContext for each script execution
- Wires up all 14 APIs
- Called per-entity, cached

### Type Definitions

**`/src/game/scripts/script-api.d.ts`** (AUTO-GENERATED)

- TypeScript type definitions for all APIs
- Enables IDE autocomplete and compile-time checking
- Regenerated when APIs change
- Must stay in sync with ScriptAPI.ts

### Example Scripts

**`/src/game/scripts/advanced-example.script.ts`**

- Demonstrates all 14 APIs in action
- Shows common patterns: input handling, events, timers, animations
- Cross-entity interaction example
- Audio playback, raycasting, parameter system

**`/src/game/scripts/PlayerController.ts`**

- Simple pattern-based script registration
- Shows older API (less used now)

---

## Rust Engine - Script Integration Points

### Current State (No Scripting Yet)

**`/rust/engine/crates/ecs-bridge/src/decoders.rs`**

- Component registry system
- IComponentDecoder trait (can_decode, decode, capabilities)
- Existing decoders: Transform, Camera, Light, MeshRenderer, Material, RigidBody, MeshCollider
- **Missing**: ScriptDecoder (would parse Script components from JSON)

**`/rust/engine/crates/ecs-bridge/src/transform_utils.rs`**

- **CRITICAL**: Degrees ↔ Radians conversion
- rotation_to_quat() - Converts 3-elem Euler degrees to quaternion
- rotation_to_quat_opt() - Optional version, returns Quat::IDENTITY if None
- position_to_vec3/scale_to_vec3 - Direct conversions
- Must use these for ALL rotation handling - manual conversion causes bugs

**`/rust/engine/src/ecs/components/transform.rs`**

- Rust Transform struct matching TypeScript ITransformData
- Fields: position: Option<[f32; 3]>, rotation: Option<Vec<f32>>, scale: Option<[f32; 3]>
- Rotation stored as Euler degrees (matching TypeScript) but converted to radians via utilities

---

## Proposed Rust Scripting Structure

### New Files to Create

**`/rust/engine/crates/scripting/src/lib.rs`**

- Export all scripting types and systems

**`/rust/engine/crates/scripting/src/api.rs`**

- Define 14 trait-based APIs
- ScriptContext struct with all API references
- Mirrors TypeScript ScriptAPI.ts structure

**`/rust/engine/crates/scripting/src/lua_host.rs`**

- Lua host functions (if using Lua)
- Binding Rust APIs to Lua callable functions
- Error handling for Lua↔Rust boundary

**`/rust/engine/src/systems/script_system.rs`**

- ECS system for script lifecycle
- Queries Script components
- Calls onStart/onUpdate/onDestroy
- Auto-cleanup on entity destruction

**`/rust/engine/crates/ecs-bridge/src/script_decoder.rs`**

- Add to decoders.rs
- Decode Script components from JSON
- Store reference to script (Lua bytecode, WASM module, or function pointer)

---

## Data Flow Diagrams

### TypeScript Execution Flow

```
Scene JSON
    ↓
Entity created with Script component
    ↓
ScriptSystem.updateScriptSystem() (each frame)
    ├─ Check if compilation needed
    ├─ DirectScriptExecutor.compileScript()
    │   └─ Wrap user code in Function() constructor
    ├─ Create ScriptContext
    │   ├─ entity = createEntityAPI(entityId)
    │   ├─ transform = createTransformAPI(entityId)
    │   ├─ three = createThreeJSAPI(entityId, getMeshRef, getScene)
    │   ├─ events = createEventAPI(entityId)
    │   ├─ audio = createAudioAPI(entityId, getMeshRef)
    │   ├─ timer = createTimerAPI(entityId)
    │   ├─ query = createQueryAPI(entityId, getScene)
    │   ├─ input = createInputAPI()
    │   ├─ time = getTimeInfo(deltaTime)
    │   ├─ math = createMathAPI()
    │   ├─ console = createConsoleAPI(entityId)
    │   ├─ prefab = createPrefabAPI(entityId)
    │   └─ entities = createEntitiesAPI()
    ├─ Call script.onStart() (first frame only)
    ├─ Scheduler.update() (process timers with 5ms budget)
    └─ Call script.onUpdate(deltaTime) (every frame)
    ↓
Entity destroyed
    └─ onDestroy() called, auto-cleanup timers/listeners
```

### Proposed Rust Execution Flow (Lua)

```
Scene JSON
    ↓
Entity created with Script component
    ↓
ScriptDecoder.decode() (ecs-bridge)
    └─ Parse Script component, load .lua file, compile to bytecode
    ↓
LuaRuntime stores bytecode
    ↓
LuaSystem.update() (each frame)
    ├─ Query Script components
    ├─ For each script entity:
    │   ├─ Create ScriptContext
    │   │   ├─ entity: EntityAPI (Rust implementation)
    │   │   ├─ transform: TransformAPI (Rust implementation)
    │   │   ├─ events: EventAPI (Rust implementation)
    │   │   ├─ timer: TimerAPI (Rust implementation)
    │   │   ├─ ... (14 APIs total)
    │   │   └─ Exposed to Lua via host functions
    │   ├─ Call lua_script:onStart() (first frame)
    │   ├─ Timer scheduler update (5ms budget)
    │   └─ Call lua_script:onUpdate(delta_time) (every frame)
    └─ On entity destruction: lua_script:onDestroy(), cleanup
```

---

## Component JSON Schema

### TypeScript Scene Format

```typescript
// src/core/lib/ecs/components/ScriptComponent.ts
interface IScriptComponentData {
  code?: string; // Inline script code
  scriptRef?: string; // Reference to external script
  parameters?: Record<string, unknown>;
  enabled?: boolean;
  language?: 'typescript' | 'javascript';
}
```

### Proposed Rust Format (What we need to support)

```rust
#[derive(Debug, Deserialize, Serialize)]
pub struct Script {
    #[serde(default)]
    pub code: Option<String>,           // Inline Lua/Rust code
    #[serde(default)]
    pub language: Option<String>,       // "lua", "rust", "typescript"
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub parameters: Option<serde_json::Value>,
}
```

### Example Scene JSON

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
        "MeshRenderer": {
          "meshId": "cube",
          "materialId": "player-material"
        },
        "Script": {
          "code": "function onUpdate(dt) entity:translate(0, 0, -dt * 5) end",
          "language": "lua",
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

---

## Key Patterns to Understand

### 1. The Sandbox Pattern (TypeScript)

```typescript
// DirectScriptExecutor: Scripts are functions that receive APIs as parameters
const script = new Function(
  'entity',
  'three',
  'math',
  'input',
  'time',
  'console',
  'events',
  'audio',
  'timer',
  'query',
  'prefab',
  'entities',
  'parameters',
  `'use strict';\n${userCode}\nreturn {onStart, onUpdate, onDestroy};`,
);

const context = script(
  entity, // IEntityScriptAPI
  three, // IThreeJSAPI
  math, // IMathAPI
  input, // IInputAPI
  // ... all 14 APIs passed as parameters
);

// Scripts can ONLY access what was passed in - complete isolation
```

### 2. The Context Pattern (Both)

```typescript
// TypeScript
function onUpdate(deltaTime: number): void {
  entity.transform.position = [0, 1, 0];
  const distance = math.distance(...);
  events.emit('player:moved', {});
}

// Rust (proposed)
fn on_update(context: &mut ScriptContext, delta_time: f32) {
    context.entity.set_position([0.0, 1.0, 0.0]);
    let distance = context.math.distance(...);
    context.events.emit("player:moved", ...);
}
```

Both pass all APIs through a context object. Same pattern, different language.

### 3. The Decoder Pattern (Rust)

```rust
// Every component type gets a decoder implementing IComponentDecoder
impl IComponentDecoder for ScriptDecoder {
    fn can_decode(&self, kind: &str) -> bool { kind == "Script" }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let script: Script = serde_json::from_value(value.clone())?;
        // Load script code, compile to bytecode if Lua, etc
        Ok(Box::new(script))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities::none()  // Scripts don't affect rendering directly
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Script")]
    }
}
```

---

## Testing Strategy

### TypeScript Tests

Look in `src/core/lib/scripting/` and `src/core/systems/__tests__/`:

- ScriptSystem tests - full lifecycle
- DirectScriptExecutor tests - compilation and execution
- Individual API tests - each API's methods

### Proposed Rust Tests

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_script_decoder() {
        // Decode Script component from JSON
        let json = json!({"code": "...", "language": "lua"});
        let script = ScriptDecoder.decode(&json).unwrap();
        // Verify script is registered
    }

    #[test]
    fn test_script_lifecycle() {
        // Create entity with script
        // Call onStart()
        // Call onUpdate()
        // Verify state changes
        // Destroy entity
        // Verify onDestroy() called
    }

    #[test]
    fn test_script_parameters() {
        // Pass parameters via JSON
        // Verify Lua script receives them
    }

    #[test]
    fn test_event_communication() {
        // Script A emits event
        // Script B listens and responds
        // Verify cross-script communication works
    }
}
```

---

## Performance Considerations

### TypeScript

- Scripts compiled once, cached
- Context reused per entity
- Frame budget: 5ms for all timers
- Auto-cleanup prevents memory leaks

### Rust (Target)

- Lua: Low overhead, compiled to bytecode
- Event system: Zero-copy where possible
- Timer scheduler: Same 5ms budget
- Auto-cleanup: Arc<Mutex> for thread-safe refcounting

---

## Migration Path (If Adding WASM Later)

```
Phase 1 (Current): Lua scripting
  └─ Fast iteration, hot-reload

Phase 2 (Future): WASM bridge
  ├─ Support TypeScript via wasm-bindgen
  ├─ Can coexist with Lua
  └─ Enables script code reuse

Phase 3 (Later): Native Rust scripts
  ├─ Performance-critical logic
  ├─ Direct compilation
  └─ Coexists with Lua and WASM
```

Each layer can be added independently without breaking lower layers.
