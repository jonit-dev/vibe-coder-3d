# ECS Refactor Status - Component-Based Entity Customization

## Overview

Successfully implemented a new ECS-inspired state management system that enables **customizing entity behavior through components**. The system moves away from a centralized Zustand store containing entity-specific data to a more modular, component-driven architecture.

## ✅ Completed Features

### Core ECS Architecture

- **EntityManager**: Manages entity lifecycle (create, delete, query, parent-child relationships)
- **ComponentManager**: Type-safe component operations (add, remove, update, get)
- **Dependency Injection**: Uses tsyringe for service management and testing
- **Component Types**: Transform, MeshRenderer, RigidBody, MeshCollider with proper interfaces

### Entity-Component Customization Capabilities

The new system enables **flexible entity behavior customization** through:

1. **Dynamic Component Addition/Removal**

   ```typescript
   // Add physics behavior to any entity
   const rigidBodyData: IRigidBodyData = { type: 'dynamic', mass: 1.0, isStatic: false };
   componentManager.addComponent(entityId, KnownComponentTypes.RIGID_BODY, rigidBodyData);

   // Add rendering behavior
   const rendererData: IMeshRendererData = { meshId: 'cube', materialId: 'default' };
   componentManager.addComponent(entityId, KnownComponentTypes.MESH_RENDERER, rendererData);
   ```

2. **Component-Based Queries**

   ```typescript
   // Find all entities with physics
   const physicsEntities = componentManager.getEntitiesWithComponent(
     KnownComponentTypes.RIGID_BODY,
   );

   // Get all components for an entity
   const components = componentManager.getComponentsForEntity(entityId);
   ```

3. **Behavior Composition**
   - Entities can have any combination of components
   - Components define data, not behavior (proper ECS separation)
   - Systems can operate on entities with specific component combinations
   - Easy to extend with new component types

### Updated Systems

- **Editor.tsx**: Uses ECS for entity creation (createCube, createSphere)
- **InspectorPanel**: Shows/edits components dynamically based on what entity has
- **HierarchyPanel**: Lists entities from EntityManager, enables duplication with component copying
- **Physics Integration**: Creates physics bodies based on RigidBody components
- **Scene Serialization**: Saves/loads entity-component data structure

### Refactored Hooks

- **useEntityComponents**: Main hook for component management per entity
- **useEntityCreation**: Creates entities with default component sets
- **useTransform, useRigidBody, useMeshRenderer, useMeshCollider**: Component-specific hooks
- **useSceneActions**: Scene save/load with new ECS format

### State Management

- **Zustand**: Now focuses purely on UI state (selectedId, isPlaying, panel visibility)
- **ECS Managers**: Handle all entity/component data through dependency injection
- **Clear Separation**: UI state vs domain data, improving maintainability

## 🎯 Component-Based Entity Customization Examples

### 1. Creating Entities with Different Behaviors

```typescript
// Physics-enabled cube
const cube = entityManager.createEntity('Physics Cube');
componentManager.addComponent(cube.id, KnownComponentTypes.TRANSFORM, defaultTransform);
componentManager.addComponent(cube.id, KnownComponentTypes.MESH_RENDERER, cubeRenderer);
componentManager.addComponent(cube.id, KnownComponentTypes.RIGID_BODY, {
  type: 'dynamic',
  mass: 1.0,
});

// Static environment object
const platform = entityManager.createEntity('Platform');
componentManager.addComponent(platform.id, KnownComponentTypes.TRANSFORM, platformTransform);
componentManager.addComponent(platform.id, KnownComponentTypes.MESH_RENDERER, platformRenderer);
componentManager.addComponent(platform.id, KnownComponentTypes.MESH_COLLIDER, {
  type: 'box',
  isTrigger: false,
});
```

### 2. Runtime Component Modification

```typescript
// Make an object kinematic
const rigidBody = componentManager.getRigidBodyComponent(entityId);
if (rigidBody) {
  componentManager.updateComponent(entityId, KnownComponentTypes.RIGID_BODY, {
    ...rigidBody.data,
    isStatic: true,
  });
}

// Change visual appearance
componentManager.updateComponent(entityId, KnownComponentTypes.MESH_RENDERER, {
  meshId: 'sphere',
  materialId: 'metal',
});
```

### 3. Component-Based Systems (Future)

The architecture supports implementing systems that operate on entities with specific components:

```typescript
// Physics System (example)
class PhysicsSystem {
  update() {
    const rigidBodyEntities = componentManager.getEntitiesWithComponent(
      KnownComponentTypes.RIGID_BODY,
    );

    rigidBodyEntities.forEach((entityId) => {
      const transform = componentManager.getTransformComponent(entityId);
      const rigidBody = componentManager.getRigidBodyComponent(entityId);

      if (transform && rigidBody && !rigidBody.data.isStatic) {
        // Apply physics simulation to transform
        this.updatePhysics(entityId, transform.data, rigidBody.data);
      }
    });
  }
}
```

## 🔄 Remaining Work (Non-Critical)

- Update remaining UI components (AddComponentMenu, ComponentDebugger, etc.)
- Add event system for component changes (for reactive updates)
- Implement more component types as needed
- Add component validation and dependencies
- Performance optimizations for large scenes

## 🏗️ Architecture Benefits

1. **Modularity**: Components are self-contained data definitions
2. **Extensibility**: Easy to add new component types without changing core systems
3. **Testability**: Services are injectable and mockable
4. **Performance**: Efficient queries and updates through dedicated managers
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Separation of Concerns**: Clear distinction between UI state and domain data

## 📈 Impact

The refactor successfully enables **component-based entity customization**, allowing developers to:

- Mix and match components to create different entity behaviors
- Add/remove capabilities at runtime
- Query entities by their component composition
- Extend the system with new component types easily
- Maintain clean separation between data and behavior

This provides a solid foundation for building complex 3D scenes with varied entity behaviors while maintaining code organization and performance.
