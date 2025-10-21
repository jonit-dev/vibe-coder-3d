# Scripting Architecture Exploration - Complete Index

## Overview

This exploration examines the TypeScript/Three.js scripting system and how to replicate it in Rust.

## Documents Generated

### 1. **SCRIPTING_ARCHITECTURE_ANALYSIS.md** (Main Document)

- **Size**: ~3,500 lines, comprehensive deep-dive
- **Content**:
  - Part 1: TypeScript scripting system (14 APIs, execution model, lifecycle)
  - Part 2: Rust engine architecture (current state, missing pieces)
  - Part 3: Design decisions for Rust scripting
  - Part 4: Key design patterns
  - Part 5: JSON schema for scripts
  - Part 6: Implementation roadmap (6 phases)
  - Part 7: File structure summary
- **Start here if**: You want complete architectural understanding
- **Time to read**: 30-40 minutes

### 2. **SCRIPTING_KEY_FILES.md** (Reference Document)

- **Size**: ~500 lines, focused reference
- **Content**:
  - Key files in TypeScript system (with line counts)
  - Rust integration points
  - Data flow diagrams (ASCII)
  - Component JSON schema
  - Design patterns with code examples
  - Testing strategy
  - Performance considerations
- **Start here if**: You're implementing and need quick lookups
- **Time to read**: 10-15 minutes

### 3. **This File** (Index & Quick Start)

- Navigation guide
- Quick facts summary
- Where to find what

---

## Quick Facts

**TypeScript Scripting System**:

- 14 Global APIs (entity, transform, three, input, time, math, console, events, audio, timer, query, prefab, gameObject, entities)
- DirectScriptExecutor uses Function() constructor (full JavaScript support)
- Scripts have 5 lifecycle methods (onStart, onUpdate, onDestroy, onEnable, onDisable)
- Frame-budgeted timers (5ms max per frame)
- Auto-cleanup on entity destruction
- Type-safe with auto-generated TypeScript definitions

**Rust Engine Current State**:

- Well-structured with ECS, component registry, scene loading
- vibe-ecs-bridge handles TypeScript↔Rust component mapping
- Critical: Handles Euler degrees ↔ Radians conversion
- **Missing**: NO SCRIPTING SYSTEM AT ALL
- No event system, timer system, input system, or gameplay logic execution

**Recommended Approach**:

- **Use Lua** via `mlua` crate
- Hot-reload capable (critical for game dev)
- Light weight, industry standard
- Can coexist with native Rust scripts
- Later add WASM bridge for TypeScript interop

---

## File Locations

### TypeScript Scripting Core

| File                        | Location                                         | Purpose                         |
| --------------------------- | ------------------------------------------------ | ------------------------------- |
| ScriptAPI (source of truth) | `src/core/lib/scripting/ScriptAPI.ts`            | Defines all 14 API interfaces   |
| Execution engine            | `src/core/lib/scripting/DirectScriptExecutor.ts` | Runs scripts using Function()   |
| System manager              | `src/core/systems/ScriptSystem.ts`               | Lifecycle & caching             |
| API implementations         | `src/core/lib/scripting/apis/*.ts`               | 14 separate files               |
| Type definitions            | `src/game/scripts/script-api.d.ts`               | Auto-generated TypeScript types |
| Examples                    | `src/game/scripts/*.script.ts`                   | Real script examples            |

### Rust Engine Core

| File                | Location                                               | Purpose                        |
| ------------------- | ------------------------------------------------------ | ------------------------------ |
| Component registry  | `rust/engine/crates/ecs-bridge/src/decoders.rs`        | Decode components from JSON    |
| Transform utils     | `rust/engine/crates/ecs-bridge/src/transform_utils.rs` | **CRITICAL**: degrees↔radians |
| Transform component | `rust/engine/src/ecs/components/transform.rs`          | Rust struct for Transform      |
| Other components    | `rust/engine/src/ecs/components/*.rs`                  | Camera, Light, MeshRenderer    |

### Documentation

| File              | Location                                  | Purpose                     |
| ----------------- | ----------------------------------------- | --------------------------- |
| Full architecture | `docs/architecture/2-13-script-system.md` | TypeScript system deep-dive |
| TS↔Rust parity   | `rust/ECS_PARITY_GUIDELINES.md`           | Integration standards       |
| Rust guidelines   | `rust/engine/CLAUDE.md`                   | Rust development rules      |

---

## The 14 APIs at a Glance

```
1. entity       - Access entity properties, components, hierarchy
2. transform    - Position, rotation (Euler degrees!), scale
3. three        - Three.js objects, materials, animations, raycasting
4. input        - Keyboard, mouse, Input Actions system
5. time         - Frame timing (time, deltaTime, frameCount)
6. math         - Trig, utilities (lerp, clamp, distance, etc)
7. console      - Logging (prefixed with [Script:EntityId])
8. events       - Pub/sub event bus (cross-entity communication)
9. audio        - Sound playback (Howler.js, 2D/3D, auto-cleanup)
10. timer       - setTimeout, setInterval, nextTick, waitFrames
11. query       - Scene queries (raycasting, findByTag)
12. prefab      - Entity spawning (spawn, destroy, setActive)
13. gameObject  - Runtime entity creation (primitives, models, cloning)
14. entities    - Entity references & lookups (get, exists, fromRef)
```

**All 14 are essential** - can't cut any without breaking functionality.

---

## Critical Design Points

### 1. Degrees vs Radians

**TypeScript stores rotation as Euler degrees**, Rust expects radians.

ALWAYS use:

```rust
use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};
let rotation = rotation_to_quat_opt(transform.rotation.as_ref());  // handles conversion
```

NOT manual conversion (causes bugs).

### 2. Sandboxing

Scripts can ONLY access APIs passed to them. No access to:

- window, document, outer scope
- Filesystem, network
- Other entities' internals
- Anything outside the sandbox

This prevents malicious or accidental code from breaking the engine.

### 3. Event-Driven Architecture

Scripts communicate via events:

```typescript
// Player script
events.emit('player:jumped', { height: 5 });

// UI script
events.on('player:jumped', (data) => {
  updateJumpDisplay(data.height);
});
```

Essential for loose coupling.

### 4. Frame Budget

Timer scheduler limits to 5ms per frame:

```typescript
timer.setTimeout(() => {
  heavy_computation();
}, 0); // Still budgeted
```

If too many callbacks, they defer to next frame. Prevents frame drops.

### 5. Auto-Cleanup

When entity destroyed:

- All event listeners → cleaned up
- All timers → cleared
- All audio → stopped
- Script context → removed

No memory leaks. Scripts don't need cleanup code.

---

## Execution Checklist

Use this when reading the documents:

**Understanding TypeScript System**:

- [ ] Read Part 1 of main analysis
- [ ] Look at ScriptAPI.ts interfaces
- [ ] Study one example script (advanced-example.script.ts)
- [ ] Trace execution flow in DirectScriptExecutor
- [ ] Review ScriptSystem lifecycle management

**Understanding Rust Current State**:

- [ ] Read Part 2 of main analysis
- [ ] Study vibe-ecs-bridge Component Registry
- [ ] Read transform_utils (understand degrees→radians)
- [ ] Look at existing component decoders

**Planning Rust Implementation**:

- [ ] Read Part 3 of main analysis (design decisions)
- [ ] Review SCRIPTING_KEY_FILES data flow diagrams
- [ ] Study JSON schema section
- [ ] Plan Phase 1 (foundation): ScriptContext, APIs, basic decoder

**Starting Implementation**:

- [ ] Create vibe-scripting crate structure
- [ ] Implement 14 trait-based APIs
- [ ] Create ScriptDecoder in ecs-bridge
- [ ] Build ScriptSystem in main engine
- [ ] Write tests as you go

---

## Important Code Examples

### TypeScript: Simple Script

```typescript
function onUpdate(deltaTime: number): void {
  const moveInput = input.getActionValue('Gameplay', 'Move');
  if (Array.isArray(moveInput)) {
    const [x, y] = moveInput;
    entity.transform.translate(x * deltaTime * 5, 0, y * deltaTime * 5);
  }
}
```

### Rust: Equivalent (Proposed)

```rust
fn on_update(context: &mut ScriptContext, delta_time: f32) {
    if let Some(move_input) = context.input.get_action_value("Gameplay", "Move") {
        context.entity.translate(move_input[0] * delta_time * 5.0, 0.0, move_input[1] * delta_time * 5.0);
    }
}
```

Same functionality, different language.

---

## What NOT to Do

### Common Mistakes

1. **Manual degrees→radians conversion**

   ```rust
   // ❌ WRONG
   let rot = Quat::from_euler(EulerRot::XYZ, angle[0], angle[1], angle[2]);

   // ✅ RIGHT
   let rot = rotation_to_quat(&angle);  // Handles conversion
   ```

2. **Trying to cut APIs**

   ```
   ❌ "Let's remove the event API, scripts don't need it"
   ✅ Each API solves a real problem. Keep all 14.
   ```

3. **Skipping frame budget**

   ```rust
   // ❌ WRONG - can block game loop
   for i in 0..1000000 { heavy_work(); }

   // ✅ RIGHT - frame budgeted
   timer.schedule_frame_work(heavy_work);  // Spreads across frames
   ```

4. **Not auto-cleaning up**

   ```rust
   // ❌ WRONG - memory leaks
   let listener = events.on("event", handler);
   // Never unsubscribe!

   // ✅ RIGHT - auto cleanup
   // When entity destroyed, all listeners automatically cleaned
   ```

---

## Testing Approach

**TypeScript Tests**:

- Look in `src/core/lib/scripting/__tests__/`
- Full lifecycle tests (onStart → onUpdate → onDestroy)
- Individual API tests
- Integration tests with real scenes

**Rust Tests** (proposed):

1. **Unit tests** - Each API method
2. **Integration tests** - Full script lifecycle with real JSON
3. **Performance tests** - Frame budget compliance
4. **Parity tests** - Compare Rust results with TypeScript

---

## Performance Targets

**TypeScript**:

- Scripts: <1ms per entity (most)
- Timers: 5ms frame budget
- Memory: ~1KB per script context
- GC: Minimal collection pressure

**Rust** (target):

- Scripts: <0.5ms per entity (Lua)
- Timers: 5ms frame budget (same)
- Memory: ~100 bytes per script context
- No GC: Rust ownership handles cleanup

---

## Next Steps

1. **Read main analysis** (`SCRIPTING_ARCHITECTURE_ANALYSIS.md`)

   - Understand the 14 APIs
   - Study execution model
   - Review design decisions

2. **Study reference document** (`SCRIPTING_KEY_FILES.md`)

   - Learn file locations
   - Understand data flow
   - See design patterns

3. **Review TypeScript implementation**

   - Look at ScriptAPI.ts (source of truth)
   - Study DirectScriptExecutor.ts (execution)
   - Review one example script

4. **Plan Rust implementation**

   - Design API traits
   - Plan ScriptContext struct
   - Create implementation phases

5. **Build prototype**
   - Start with Phase 1 (foundation)
   - Test with existing scenes
   - Iterate

---

## Questions to Ask

1. **Why 14 APIs?** - Each solves a specific problem. No redundancy.

2. **Why Lua?** - Hot-reload, lightweight, industry standard. Rust can't iterate as fast.

3. **Why not TypeScript WASM?** - Overhead not worth it for MVP. Can add later.

4. **Why context pattern?** - Clear boundary between script and engine. Easy to sandbox.

5. **Why frame budget?** - Prevents infinite loops or heavy work from blocking game.

6. **Why auto-cleanup?** - Scripts can't be trusted to cleanup. Engine does it.

---

## Resources

| What                      | Where                                                  | Why                       |
| ------------------------- | ------------------------------------------------------ | ------------------------- |
| Full scripting API spec   | `src/core/lib/scripting/ScriptAPI.ts`                  | Source of truth           |
| Execution details         | `src/core/lib/scripting/DirectScriptExecutor.ts`       | Learn how it runs         |
| Integration patterns      | `src/core/systems/ScriptSystem.ts`                     | How to wire into ECS      |
| Transform conversion      | `rust/engine/crates/ecs-bridge/src/transform_utils.rs` | Critical: degrees→radians |
| Component decoder pattern | `rust/engine/crates/ecs-bridge/src/decoders.rs`        | How to add new components |
| Example scripts           | `src/game/scripts/advanced-example.script.ts`          | Real patterns in use      |
| Full documentation        | `docs/architecture/2-13-script-system.md`              | Deep-dive details         |
| Rust integration guide    | `rust/ECS_PARITY_GUIDELINES.md`                        | TS↔Rust standards        |

---

## Document Versions

- Generated: 2025-10-20
- Analysis based on: TypeScript codebase at HEAD, Rust engine current state
- Key codebase files reviewed: ~15 files, ~3,000 lines of source
- Documentation reviewed: ~12 docs, ~8,000 lines

---

## Support

Questions about:

- **TypeScript scripting**: See `docs/architecture/2-13-script-system.md`
- **Rust engine**: See `rust/engine/CLAUDE.md`
- **Transform system**: See `rust/ECS_PARITY_GUIDELINES.md`
- **This exploration**: See main documents above
