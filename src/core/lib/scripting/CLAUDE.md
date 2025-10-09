# Script System Implementation Guide

## Overview

The Script System provides TypeScript-based scripting for gameplay logic. Scripts execute in a sandboxed environment with 13 global APIs providing controlled access to engine features.

**IMPORTANT:** As of 2025-10-09, the script system uses **DirectScriptExecutor** which provides full JavaScript language support via the Function() constructor, replacing the previous regex-based pattern matching approach.

## Architecture

### Core Files

- **ScriptAPI.ts** - Source of truth for all API interfaces
- **DirectScriptExecutor.ts** - Script compilation and execution using Function() constructor (CURRENT)
- **ScriptExecutor.ts** - Legacy regex-based pattern matching executor (DEPRECATED)
- **ScriptResolver.ts** - External script file loading
- **ThreeJSEntityRegistry.ts** - Maps entities to Three.js objects

### API Implementations

Located in `apis/` directory:

- **EventAPI.ts** - Event bus integration
- **AudioAPI.ts** - Sound playback (stub for SoundManager)
- **TimerAPI.ts** - Scheduled callbacks with frame budget
- **QueryAPI.ts** - Scene queries and raycasting
- **PrefabAPI.ts** - Entity spawning (stub for PrefabManager)
- **EntitiesAPI.ts** - Cross-entity operations

### Adapters

Located in `adapters/` directory:

- **scheduler.ts** - Frame-budgeted timer scheduler

## Key Implementation Details

### Context Creation

Each entity gets a script context with all 13 APIs:

```typescript
const context: IScriptContext = {
  entity: createEntityAPI(entityId),
  time: timeInfo,
  input: inputInfo,
  math: createMathAPI(),
  console: createConsoleAPI(entityId),
  three: createThreeJSAPI(entityId, getMeshRef, getSceneRef),
  events: createEventAPI(entityId),
  audio: createAudioAPI(entityId, getMeshRef),
  timer: createTimerAPI(entityId),
  query: createQueryAPI(entityId, getSceneRef),
  prefab: createPrefabAPI(entityId),
  entities: createEntitiesAPI(),
  parameters,
};
```

### Frame Budget

The scheduler limits timer execution to 5ms per frame to prevent blocking:

```typescript
const frameBudgetMs = 5; // Max time per frame
```

If too many timers need execution, they defer to next frame.

### Auto-Cleanup

When an entity is destroyed, all resources are automatically cleaned up:

```typescript
public removeScriptContext(entityId: EntityId): void {
  cleanupTimerAPI(entityId);  // Clear all timers
  // Event listeners stored in Set, cleaned on context removal
  this.scriptContexts.delete(entityId);
}
```

### Lifecycle Methods

Scripts can implement 5 lifecycle methods:

1. **onStart()** - Called once when entity/script is created
2. **onUpdate(deltaTime)** - Called every frame (play mode only)
3. **onDestroy()** - Called when entity/script is destroyed
4. **onEnable()** - Called when component is enabled
5. **onDisable()** - Called when component is disabled

### Sandboxing

Scripts have controlled access to engine features:

- **Lexical scoping** - Scripts use Function() constructor with APIs passed as parameters
- **Full JavaScript support** - Variables, loops, conditionals, functions all work
- **Whitelist-based Three.js access** - Only safe properties exposed via proxy
- **Component-level isolation** - Can't directly access other entities' internals
- **No filesystem/network** - Must use provided APIs
- **No access to outer scope** - Only explicitly passed APIs are available

### DirectScriptExecutor (Current Implementation)

The DirectScriptExecutor uses the Function() constructor to execute scripts:

```typescript
const scriptFunction = new Function(
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
  `
  'use strict';
  ${userScriptCode}
  return { onStart, onUpdate, onDestroy, onEnable, onDisable };
  `,
);
```

**Benefits:**

- ✅ Full JavaScript language support (variables, loops, conditionals, functions)
- ✅ Natural developer experience
- ✅ No regex patterns to maintain
- ✅ Easy to debug
- ✅ Still sandboxed (APIs passed as parameters)

**Security:**

- Scripts execute in strict mode
- Only provided APIs are accessible
- No access to window, document, or other browser globals
- Cannot escape sandbox via Function/eval

### Type Generation

Type declarations are manually generated in `script-api.d.ts` based on `ScriptAPI.ts`. Keep them in sync when adding new APIs.

## Adding New APIs

To add a new API to scripts:

### 1. Define Interface in ScriptAPI.ts

```typescript
export interface IMyNewAPI {
  doSomething(param: string): void;
}
```

### 2. Add to IScriptContext

```typescript
export interface IScriptContext {
  // ... existing APIs
  myNew: IMyNewAPI;
  // ... rest
}
```

### 3. Create Implementation

Create `apis/MyNewAPI.ts`:

```typescript
import type { IMyNewAPI } from '../ScriptAPI';

export const createMyNewAPI = (entityId: number): IMyNewAPI => {
  return {
    doSomething: (param: string) => {
      console.log(`Entity ${entityId}: ${param}`);
    },
  };
};

export const cleanupMyNewAPI = (entityId: number) => {
  // Cleanup if needed
};
```

### 4. Wire into ScriptExecutor

In `ScriptExecutor.ts`:

```typescript
import { createMyNewAPI, cleanupMyNewAPI } from './apis/MyNewAPI';

// In createScriptContext():
return {
  // ... existing APIs
  myNew: createMyNewAPI(entityId),
  // ... rest
};

// In removeScriptContext():
cleanupMyNewAPI(entityId);
```

### 5. Update Type Declarations

Add to `script-api.d.ts`:

```typescript
interface IMyNewAPI {
  doSomething(param: string): void;
}

const myNew: IMyNewAPI;
```

### 6. Write Tests

Create `apis/__tests__/MyNewAPI.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createMyNewAPI } from '../MyNewAPI';

describe('MyNewAPI', () => {
  it('should do something', () => {
    const api = createMyNewAPI(1);
    expect(api.doSomething).toBeInstanceOf(Function);
  });
});
```

## Integration Points

### ECS System

ScriptSystem reads Script components and executes lifecycle methods:

```typescript
// src/core/systems/ScriptSystem.ts
export async function updateScriptSystem(deltaTime: number, isPlaying: boolean) {
  scheduler.update(); // Update timers first
  // ... compile and execute scripts
}
```

### Event System

Scripts can emit/listen to global events via EventAPI:

```typescript
// Emitter
events.emit('player:scored', { points: 100 });

// Listener
events.on('player:scored', (data) => {
  console.log('Score:', data.points);
});
```

### Component Manager

Scripts access/modify components through ComponentManager:

```typescript
entity.getComponent<TransformData>('Transform');
entity.setComponent('Transform', { position: [0, 5, 0] });
```

### Three.js Registry

ThreeJSEntityRegistry maps entity IDs to Three.js objects:

```typescript
const mesh = threeJSEntityRegistry.getEntityObject3D(entityId);
const scene = threeJSEntityRegistry.getEntityScene(entityId);
```

## Performance Optimization

### Context Caching

Script contexts are cached per entity and reused across frames:

```typescript
let context = this.scriptContexts.get(entityId);
if (!context) {
  context = this.createScriptContext(...);
  this.scriptContexts.set(entityId, context);
}
```

### Frame Budget

Timers use frame budget to prevent blocking:

- Max 5ms per frame for timer execution
- Deferred timers moved to next frame
- No single timer can block game loop

### Promise Resolution

Animations and frame waiting use RAF for smooth execution:

```typescript
nextTick: () => new Promise((resolve) => requestAnimationFrame(resolve));
```

## Known Limitations

### Stubs Requiring Integration

These APIs are functional but log warnings:

1. **AudioAPI** - Needs SoundManager/Howler integration
2. **PrefabAPI** - Needs PrefabManager for actual spawning
3. **QueryAPI.findByTag** - Needs tag system integration
4. **EntitiesAPI** - Advanced lookups (name/tag/guid/path) stubbed
5. **InputAPI** - Currently using mock, needs real InputManager

### Security Considerations

- Scripts can spawn unlimited entities (if PrefabAPI integrated)
- Scripts can emit unlimited events
- Timer frame budget prevents runaway callbacks
- No protection against infinite loops in script code itself

### TypeScript Limitations

- No actual TypeScript compilation in production
- Type checking only in development
- Runtime errors possible despite type safety

## Testing

### Unit Tests

Test files in `apis/__tests__/` cover:

- API creation and methods
- Cleanup on destruction
- Error handling
- Integration with underlying systems

### Integration Tests

ScriptSystem tests cover:

- Full lifecycle (onStart → onUpdate → onDestroy)
- Context creation and cleanup
- Multiple entities with scripts
- External script loading

### Running Tests

```bash
yarn test src/core/lib/scripting/apis/__tests__/
yarn test src/core/systems/__tests__/ScriptSystem.test.ts
```

## Debugging Scripts

### Console Logging

Use the sandboxed console API:

```typescript
console.log('Debug:', variable);
console.warn('Warning:', issue);
console.error('Error:', error);
```

Logs include entity ID prefix: `[Script:123] Debug: ...`

### Performance Monitoring

Track script execution time via Script component:

```typescript
const script = entity.getComponent('Script');
console.log('Execution time:', script.lastExecutionTime);
console.log('Execution count:', script.executionCount);
```

### Error Messages

Script errors are stored in Script component:

```typescript
if (script.hasErrors) {
  console.error(script.lastErrorMessage);
}
```

## Future Enhancements

Planned improvements:

1. **Script Debugger** - Breakpoints and step-through
2. **Performance Profiler** - Per-script metrics and flame graphs
3. **Visual Scripting** - Node-based scripting option
4. **Script Templates** - Common patterns as starting templates
5. **Hot Reload** - Reload scripts without restart
6. **Script Validation** - Static analysis for common issues
7. **API Documentation** - In-editor API reference
8. **Script Marketplace** - Share scripts with community

## References

- [Main Documentation](../../../../docs/architecture/2-13-script-system.md)
- [Quick Reference](../../../../docs/guides/script-api-quick-reference.md)
- [PRD](../../../../docs/PRDs/4-17-script-api-expansion-prd.md)
- [Implementation Summary](../../../../docs/SCRIPT_API_IMPLEMENTATION.md)
