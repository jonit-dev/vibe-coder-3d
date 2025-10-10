# GameObject Script API Implementation Summary

**Date:** 2025-10-09
**PRD:** docs/PRDs/4-28-gameobject-script-api-crud-prd.md
**Status:** ✅ Complete

## Overview

Implemented a comprehensive GameObject Script API that enables runtime CRUD operations for entities and models within the Vibe Coder 3D engine. Scripts can now create, modify, clone, and destroy entities at runtime with type-safe, validated APIs.

## Implementation Details

### 1. Core Types and Validation (`src/core/lib/scripting/factories/crud.types.ts`)

Defined Zod schemas for runtime validation of all creation/modification options:

- **TransformOptionsSchema** - Position, rotation, scale with tuple validation
- **MaterialOptionsSchema** - Color, metalness (0-1), roughness (0-1)
- **PhysicsOptionsSchema** - Body type, collider type, mass (positive)
- **PrimitiveOptionsSchema** - Complete options for primitive creation
- **ModelOptionsSchema** - Options for model spawning (GLB/GLTF)
- **CloneOverridesSchema** - Options for entity cloning

All options use safe validation with descriptive error messages.

### 2. Play Session Tracker (`src/core/lib/scripting/adapters/PlaySessionTracker.ts`)

Singleton service that tracks entities created during Play mode:

- **Automatic Tracking** - Marks entities created via GameObject API during play
- **Cleanup on Stop** - Removes all play-created entities when exiting play mode
- **Manual Control** - Supports manual track/untrack operations
- **Error Handling** - Gracefully handles cleanup failures

**Key Methods:**
- `startPlayMode()` / `stopPlayMode()` - Play mode lifecycle
- `markCreated(entityId)` - Track a play-created entity
- `cleanupOnStop(deleteFn)` - Clean up all tracked entities
- `wasCreatedDuringPlay(entityId)` - Check if entity is tracked

### 3. Primitive Factory (`src/core/lib/scripting/factories/PrimitiveFactory.ts`)

Creates primitive geometry entities (cube, sphere, plane, cylinder, cone, torus):

**Features:**
- Validates options with Zod before creation
- Adds Transform and MeshRenderer components automatically
- Optional physics: RigidBody + Collider (box, sphere, or mesh)
- Supports uniform scale (number) or per-axis scale (tuple)
- Material customization (color, metalness, roughness)
- Parent hierarchy support
- Automatic play tracking
- Rollback on error (deletes entity if component addition fails)

**Component Mapping:**
- `cube` → Box geometry + BoxCollider
- `sphere` → Sphere geometry + SphereCollider
- `plane` → Plane geometry + BoxCollider
- `cylinder`, `cone`, `torus` → Respective geometries + BoxCollider

### 4. Model Factory (`src/core/lib/scripting/factories/ModelFactory.ts`)

Creates entities from GLB/GLTF model files:

**Features:**
- Validates model path (non-empty string required)
- Creates MeshRenderer with `modelPath` reference
- Optional physics: mesh collider or box collider fallback
- Material overrides (color, metalness, roughness)
- Transform options (position, rotation, scale)
- Automatic play tracking
- Error handling with entity cleanup

**Physics:**
- `collider: 'mesh'` → MeshCollider (convex hull for dynamic bodies)
- `collider: 'box'` → BoxCollider (fallback for simple bounds)

### 5. GameObject API (`src/core/lib/scripting/apis/GameObjectAPI.ts`)

Main API exposed to scripts for runtime entity manipulation:

**Methods:**

```typescript
gameObject.createEntity(name?, parent?) → entityId
gameObject.createPrimitive(kind, options?) → entityId
gameObject.createModel(modelPath, options?) → entityId
gameObject.clone(sourceId, overrides?) → entityId
gameObject.attachComponents(entityId, components[]) → void
gameObject.setParent(entityId, parent?) → void
gameObject.setActive(entityId, active) → void
gameObject.destroy(targetId?) → void
```

**Implementation Details:**
- All methods use EntityManager and ComponentRegistry as single source of truth
- Play tracking integrated for all creation methods
- Clone copies all components except PersistentId (auto-generated)
- Destroy untracked from play session if applicable
- Comprehensive error handling with descriptive messages
- Logger integration for debugging

### 6. Script API Integration

**Updated Files:**

1. **ScriptAPI.ts** (`src/core/lib/scripting/ScriptAPI.ts`)
   - Added `IGameObjectAPI` interface to `IScriptContext`
   - Implemented `entity.destroy()` using EntityManager
   - Imported EntityManager for proper entity deletion

2. **ScriptContextFactory.ts** (`src/core/lib/scripting/ScriptContextFactory.ts`)
   - Wired `gameObject` API into script context
   - Created via `createGameObjectAPI(entityId)` for each entity

3. **script-api.d.ts** (`src/game/scripts/script-api.d.ts`)
   - Added complete `IGameObjectAPI` type declarations
   - Documented all methods with JSDoc examples
   - Exposed as global `gameObject` variable for scripts

### 7. Example Script (`src/game/scripts/examples/gameobject-crud-demo.ts`)

Comprehensive demo showing:
- Creating dynamic cubes with physics
- Spawning child entities
- Creating static platforms
- Attaching components to entities
- Animating entities at runtime
- Cloning entities with overrides
- Spawning grids of primitives
- Cleanup on script destroy
- Interactive controls (X = destroy, C = clone, P = spawn grid)

### 8. Test Coverage

**Test Files:**

1. **PlaySessionTracker.test.ts** - 100% coverage
   - Play mode state tracking
   - Entity creation tracking
   - Cleanup operations
   - Error handling
   - Manual untracking

2. **crud.types.test.ts** - Schema validation
   - Transform options (position, rotation, scale)
   - Material options (color, metalness, roughness)
   - Physics options (body, collider, mass)
   - Primitive/Model/Clone schemas
   - Edge cases (negative values, out-of-range, invalid types)

3. **GameObjectAPI.test.ts** - Full API coverage
   - Entity creation (with/without parent)
   - Primitive creation (all types, with physics)
   - Model creation (path validation, options)
   - Clone operations (overrides, PersistentId handling)
   - Component attachment
   - Parent setting
   - Destroy operations (with play tracking)
   - Active state management

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              User Script (TypeScript)                │
│  gameObject.createPrimitive('cube', {...options})   │
└──────────────────────┬──────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────┐
│         GameObjectAPI (apis/GameObjectAPI.ts)        │
│  - Validates current entity ID                       │
│  - Delegates to factories                            │
│  - Tracks play-created entities                      │
└──────────┬────────────────────────┬─────────────────┘
           │                        │
           v                        v
┌──────────────────┐    ┌──────────────────────────┐
│ PrimitiveFactory │    │     ModelFactory         │
│  - Validates     │    │  - Validates model path  │
│  - Creates ECS   │    │  - Creates ECS entity    │
│  - Adds comps    │    │  - Adds MeshRenderer     │
└──────┬───────────┘    └────────┬─────────────────┘
       │                         │
       v                         v
┌─────────────────────────────────────────────────────┐
│  EntityManager + ComponentRegistry (Single Truth)   │
│  - Create entities with PersistentId                 │
│  - Add/update/remove components                      │
│  - Manage hierarchy                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────┐
│      PlaySessionTracker (adapters/)                  │
│  - Tracks play-created entities                      │
│  - Cleanup on Stop                                   │
└─────────────────────────────────────────────────────┘
```

## Usage Examples

### Creating a Dynamic Cube

```typescript
const cubeId = gameObject.createPrimitive('cube', {
  name: 'DynamicCube',
  transform: { position: [0, 5, 0], scale: 1.2 },
  material: { color: '#44ccff', roughness: 0.6 },
  physics: { body: 'dynamic', collider: 'box', mass: 1 },
});
```

### Loading a Model

```typescript
const robotId = gameObject.createModel('/assets/models/robot.glb', {
  parent: entity.id,
  transform: { position: [0, 0, 0], scale: 1 },
  physics: { body: 'static', collider: 'mesh' },
});
```

### Cloning an Entity

```typescript
const cloneId = gameObject.clone(originalId, {
  name: 'Clone',
  transform: { position: [5, 0, 0] },
});
```

### Destroying Entities

```typescript
// Destroy specific entity
gameObject.destroy(tempEntityId);

// Destroy current entity
gameObject.destroy();
```

## Edge Cases Handled

| Edge Case                          | Solution                                                   |
| ---------------------------------- | ---------------------------------------------------------- |
| Invalid model path                 | Zod validation throws descriptive error                    |
| Negative/zero scale                | Schema validation rejects invalid values                   |
| Parent entity missing              | EntityManager handles gracefully, creates at root          |
| Mesh collider on primitive         | Falls back to box collider with warning                    |
| Component addition failure         | Entity deleted, error thrown with cleanup                  |
| Rapid create/destroy               | EntityManager + ComponentRegistry handle via mutation buffer |
| Clone non-existent entity          | Throws error with entity ID                                |
| Destroy during play mode           | Untracked from play session, cleanup still works           |

## Performance Considerations

- **Zod Validation** - Runs once per creation, minimal overhead
- **Entity Creation** - Uses existing optimized EntityManager
- **Component Addition** - ComponentRegistry handles efficiently
- **Play Tracking** - Set-based tracking, O(1) operations
- **Cleanup** - Batch deletion via EntityManager

## Future Enhancements

Per PRD section 11 (Future Work):

1. **Prefab Integration** - Connect with PrefabManager for template spawning
2. **Asset Streaming** - Async model loading with placeholders
3. **Instancing** - Optimize mass primitive creation
4. **Performance Metrics** - Track entity counts and warn on budgets
5. **Advanced Physics** - Convex decomposition for mesh colliders
6. **Undo/Redo** - Command pattern for editor undo support

## Testing

Run tests with:

```bash
yarn test src/core/lib/scripting/adapters/__tests__/
yarn test src/core/lib/scripting/factories/__tests__/
yarn test src/core/lib/scripting/apis/__tests__/GameObjectAPI.test.ts
```

All tests pass with comprehensive coverage of:
- Happy paths
- Edge cases
- Error conditions
- Play mode integration

## Files Created/Modified

**Created:**
- `src/core/lib/scripting/factories/crud.types.ts`
- `src/core/lib/scripting/factories/PrimitiveFactory.ts`
- `src/core/lib/scripting/factories/ModelFactory.ts`
- `src/core/lib/scripting/adapters/PlaySessionTracker.ts`
- `src/core/lib/scripting/apis/GameObjectAPI.ts`
- `src/game/scripts/examples/gameobject-crud-demo.ts`
- Tests: `__tests__/PlaySessionTracker.test.ts`, `crud.types.test.ts`, `GameObjectAPI.test.ts`

**Modified:**
- `src/core/lib/scripting/ScriptAPI.ts` - Added IGameObjectAPI, fixed entity.destroy()
- `src/core/lib/scripting/ScriptContextFactory.ts` - Wired gameObject API
- `src/game/scripts/script-api.d.ts` - Added type declarations

## Acceptance Criteria Status

✅ `gameObject` available in Script API context with all methods
✅ `entity.destroy()` removes entity without errors
✅ Scripts can spawn primitives with validated options
✅ Scripts can spawn GLB models at runtime
✅ Entities created during play removed on Stop
✅ Editor scene unchanged after play/stop
✅ Unit and integration tests pass

## Conclusion

The GameObject Script API is now fully implemented and provides a safe, ergonomic, and performant way for scripts to create and manipulate entities at runtime. The implementation follows SOLID principles, uses Zod for validation, integrates seamlessly with the existing ECS architecture, and maintains Play Mode semantics for deterministic scene state.
