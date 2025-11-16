# Agent Actions Handlers

**Purpose**: Modular event handlers for AI agent actions in the editor.

**Architecture**: Each handler module follows the Single Responsibility Principle, focusing on a specific domain of operations.

## Handler Modules

### `entityHandlers.ts`
Entity lifecycle operations:
- Rename entity
- Delete entity
- Duplicate entity (with components and hierarchy)
- Set parent (hierarchy management)
- Set enabled state

### `transformHandlers.ts`
Transform component operations:
- Set position
- Set rotation
- Set scale

### `componentHandlers.ts`
Component CRUD operations:
- Add component (with defaults)
- Remove component
- Set component property
- Get component data

### `prefabHandlers.ts`
Prefab management:
- Create prefab from selection
- Instantiate prefab
- List all prefabs
- Create variant
- Unpack prefab instance

### `primitiveCreationHandlers.ts`
Primitive entity creation:
- Create primitives (Cube, Sphere, Cylinder, Cone, Plane, Light)
- Apply transform and material on creation
- Create geometry asset entities
- Response events with entity IDs

### `prefabFromPrimitivesHandler.ts`
Complex prefab assembly:
- Build prefabs from primitive specifications
- Handle relative transforms in hierarchy
- Apply materials to primitives
- Clean up temporary entities after prefab creation

### `geometryHandlers.ts`
Geometry file operations:
- Save geometry files via API

## Usage Pattern

All handler modules export factory functions that:
1. Accept dependencies (callbacks, store accessors)
2. Return objects with event handler functions
3. Use structured logging via `Logger.create('AgentActions:Domain')`

```typescript
// Example factory function signature
export const createEntityHandlers = () => {
  const handleRenameEntity = (event: Event) => { /* ... */ };
  const handleDeleteEntity = (event: Event) => { /* ... */ };

  return {
    handleRenameEntity,
    handleDeleteEntity,
  };
};
```

## Main Hook (`useAgentActions.ts`)

The main hook:
- Imports all handler factories
- Creates handler instances with dependencies
- Registers/unregisters all event listeners
- Keeps the orchestration logic minimal and declarative

## Type Safety

All modules use proper TypeScript types:
- `UpdateComponentFn` type for generic component updates
- `EntityCreators` interface for entity creation methods
- Structured event detail types via CustomEvent

## Event Naming Convention

Events follow the pattern: `agent:<action>-<target>`

Examples:
- `agent:add-entity`
- `agent:set-position`
- `agent:create-prefab`
- `agent:add-component`

## Adding New Handlers

1. Create a new handler module in this directory
2. Export a factory function that accepts dependencies
3. Return an object with event handler functions
4. Import in `useAgentActions.ts`
5. Wire up event listeners in the main hook
