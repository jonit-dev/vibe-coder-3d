# Singleton Elimination Implementation

## Overview

This document describes the completed implementation of the singleton elimination pattern as outlined in PRD 4-17. The implementation introduces dependency injection and Zustand-based stores to replace singleton patterns in the ECS system.

## Architecture

### Core Components

1. **Enhanced Container** (`src/core/lib/di/Container.ts`)
   - Added hierarchical container support with parent-child relationships
   - Services resolve from child containers first, then walk up the parent chain
   - Enables scoped service instances per engine

2. **Zustand-based Stores** (`src/core/context/`)
   - `ECSWorldStore` - Manages ECS World instances
   - `EntityManagerStore` - Manages EntityManager instances
   - `ComponentManagerStore` - Manages ComponentManager instances
   - Each store factory creates isolated store instances

3. **EngineProvider** (`src/core/context/EngineProvider.tsx`)
   - React context provider that creates scoped engine instances
   - Manages store lifecycles and cleanup
   - Integrates with SingletonAdapter for backward compatibility

4. **Factory Functions** (`src/core/lib/ecs/factories/`)
   - `createEngineInstance()` - Creates isolated engine instances
   - Returns world, managers, container, and dispose function
   - Supports parent container inheritance

5. **Migration Adapters** (`src/core/lib/ecs/adapters/`)
   - `SingletonAdapter` - Temporary bridge for getInstance() calls
   - Logs deprecation warnings with migration hints
   - Falls back to singletons in non-React contexts (tests)

## Usage Examples

### Basic Usage

```tsx
import { EngineProvider, useEntityManager } from '@core/context';

function App() {
  return (
    <EngineProvider>
      <GameEditor />
    </EngineProvider>
  );
}

function GameEditor() {
  const { entityManager } = useEntityManager();

  const handleCreateEntity = () => {
    entityManager.createEntity('New Entity');
  };

  return <button onClick={handleCreateEntity}>Create Entity</button>;
}
```

### Multiple Engine Instances

```tsx
function MultiEditorApp() {
  return (
    <div>
      <EngineProvider>
        <EditorView title="Scene A" />
      </EngineProvider>
      <EngineProvider>
        <EditorView title="Scene B" />
      </EngineProvider>
    </div>
  );
}
```

### Factory Usage (Non-React)

```ts
import { createEngineInstance } from '@core/context';

const engineA = createEngineInstance();
const engineB = createEngineInstance();

// Isolated instances
engineA.entityManager.createEntity('Entity A');
engineB.entityManager.createEntity('Entity B');

// Cleanup
engineA.dispose();
engineB.dispose();
```

## Migration Guide

### Phase 1: Add EngineProvider

Wrap your application with the EngineProvider:

```tsx
// Before
function App() {
  return <Editor />;
}

// After
function App() {
  return (
    <EngineProvider>
      <Editor />
    </EngineProvider>
  );
}
```

### Phase 2: Replace getInstance() Calls

```ts
// Before
const entityManager = EntityManager.getInstance();

// After
const { entityManager } = useEntityManager();
```

### Phase 3: Use Context Hooks

```ts
// Before
import { EntityManager } from '@core/lib/ecs/EntityManager';
const manager = EntityManager.getInstance();

// After
import { useEntityManager } from '@core/context';
const { entityManager } = useEntityManager();
```

### Phase 4: Remove Singleton Dependencies

Once all code is migrated, remove:
- `SingletonAdapter` imports
- `getInstance()` calls
- Global singleton instances

## Testing Strategy

### Unit Tests

- Provider renders and exposes instances (`EngineProvider.test.tsx`)
- Factory creates isolated instances (`createEngineInstance.test.ts`)
- Container hierarchical resolution works correctly

### Integration Tests

- Two providers don't cross-contaminate
- Singleton adapter fallback works
- Migration hooks work in both modes

### Examples

- Multi-engine demonstration (`examples/multi-engine-example.tsx`)
- Migration patterns (`examples/migration-example.tsx`)

## Performance Considerations

- **Store Creation**: Zustand stores are lightweight and created per provider
- **Instance Isolation**: Each provider gets separate ECS instances
- **Memory Management**: Dispose functions clean up resources properly
- **Backward Compatibility**: Singleton fallback adds minimal overhead

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Existing Code**: Still works with singleton adapter
2. **Gradual Migration**: Can migrate components incrementally
3. **Test Environments**: Fall back to singletons automatically
4. **No Breaking Changes**: All existing APIs continue to work

## Benefits Achieved

✅ **Multi-Instance Support**: Multiple engines can run simultaneously
✅ **Better Testing**: Isolated instances prevent test interference
✅ **Cleaner Architecture**: Explicit dependencies via DI/Context
✅ **Performance**: Memoized providers prevent unnecessary re-renders
✅ **Type Safety**: Full TypeScript support with proper interfaces

## Files Changed/Created

### New Files
- `src/core/context/ECSWorldStore.ts`
- `src/core/context/EntityManagerStore.ts`
- `src/core/context/ComponentManagerStore.ts`
- `src/core/context/EngineProvider.tsx`
- `src/core/context/index.ts`
- `src/core/lib/ecs/factories/createEngineInstance.ts`
- `src/core/lib/ecs/adapters/SingletonAdapter.ts`

### Modified Files
- `src/core/lib/di/Container.ts` - Added hierarchical support
- `src/core/lib/ecs/World.ts` - Made constructor public
- `src/core/hooks/useGameEngine.ts` - Updated to use context
- `src/editor/hooks/useEntityManager.ts` - Added context fallback
- `src/editor/hooks/useComponentManager.ts` - Added context fallback

### Test Files
- `src/core/context/__tests__/EngineProvider.test.tsx`
- `src/core/lib/ecs/factories/__tests__/createEngineInstance.test.ts`

### Examples
- `examples/multi-engine-example.tsx`
- `examples/migration-example.tsx`

## Next Steps

1. **Phase Out Singletons**: Gradually replace remaining getInstance() calls
2. **Add ESLint Rules**: Prevent new singleton usage
3. **Performance Testing**: Measure multi-instance overhead
4. **Documentation**: Update API docs and tutorials
5. **Remove Adapters**: After migration is complete, remove singleton adapters

## Timeline

- **Implementation**: 2 days (as planned)
- **Testing**: Covered with unit and integration tests
- **Migration**: Can be done incrementally without breaking changes
- **Cleanup**: Remove adapters once migration is complete

The implementation successfully achieves all goals from the PRD while maintaining full backward compatibility and providing a clear migration path.