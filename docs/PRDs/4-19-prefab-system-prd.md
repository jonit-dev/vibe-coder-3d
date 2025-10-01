# Prefab System PRD

**Status**: Not Started
**Priority**: High
**Estimated Effort**: 3 days
**Dependencies**: Script API Expansion (Complete), ECS System

## Overview

Implement a complete Prefab System that allows entities to be saved as reusable templates and instantiated at runtime. Enable the Script API's PrefabAPI to spawn, destroy, and manage entity instances from prefabs.

## Current State

The PrefabAPI stub exists in `src/core/lib/scripting/apis/PrefabAPI.ts` with the following methods:

- `spawn(prefabId, overrides)` - Currently logs warning, returns -1
- `destroy(entityId)` - Currently logs warning, no-op
- `setActive(entityId, active)` - Currently logs warning, no-op

All methods log: `"Prefab spawning/destruction/setActive not yet fully implemented"`

## Goals

1. Define and serialize entity templates (prefabs)
2. Instantiate prefabs at runtime with overrides
3. Support nested prefabs (prefabs containing prefabs)
4. Enable entity pooling for performance
5. Provide editor UI for prefab management
6. Integrate with Script API for runtime spawning

## Proposed Solution

### Architecture

```
src/core/lib/prefabs/
├── PrefabManager.ts         # Singleton prefab manager
├── PrefabSerializer.ts      # Serialize/deserialize prefabs
├── PrefabInstance.ts        # Track instantiated prefabs
├── PrefabPool.ts            # Object pooling for prefabs
└── __tests__/
    ├── PrefabManager.test.ts
    ├── PrefabSerializer.test.ts
    └── PrefabPool.test.ts

src/core/lib/scripting/apis/
└── PrefabAPI.ts             # Update to use PrefabManager

src/editor/components/panels/
└── PrefabPanel/             # Editor UI for prefabs
    ├── PrefabPanel.tsx
    ├── PrefabList.tsx
    └── PrefabEditor.tsx

src/game/prefabs/            # Prefab definitions
├── player.prefab.json
├── enemy-1.prefab.json
└── projectile.prefab.json
```

### Prefab Data Structure

```typescript
interface IPrefabComponent {
  type: string;
  data: Record<string, unknown>;
}

interface IPrefab {
  id: string; // Unique prefab ID
  name: string; // Display name
  description?: string; // Optional description
  version: string; // Prefab version for compatibility
  components: IPrefabComponent[]; // Component definitions
  children?: IPrefab[]; // Nested prefabs
  tags?: string[]; // Tags for categorization
  metadata?: Record<string, unknown>; // Custom metadata
}

interface IPrefabInstance {
  instanceId: number; // Entity ID
  prefabId: string; // Source prefab ID
  overrides?: Record<string, unknown>; // Applied overrides
  parent?: number; // Parent entity ID
  createdAt: number; // Timestamp
}
```

### PrefabManager Interface

```typescript
class PrefabManager {
  private prefabs: Map<string, IPrefab>;
  private instances: Map<number, IPrefabInstance>;
  private pools: Map<string, PrefabPool>;

  // Prefab registration
  register(prefab: IPrefab): void;
  unregister(prefabId: string): void;
  get(prefabId: string): IPrefab | null;
  getAll(): IPrefab[];

  // Instantiation
  instantiate(prefabId: string, overrides?: Record<string, unknown>, parent?: number): number; // Returns entity ID

  // Instance management
  destroy(entityId: number): void;
  isInstance(entityId: number): boolean;
  getPrefabId(entityId: number): string | null;
  getInstances(prefabId: string): number[];

  // Entity state
  setActive(entityId: number, active: boolean): void;
  isActive(entityId: number): boolean;

  // Pooling
  enablePooling(prefabId: string, poolSize: number): void;
  disablePooling(prefabId: string): void;
  warmPool(prefabId: string, count: number): void;

  // Serialization
  serialize(prefabId: string): string;
  deserialize(json: string): IPrefab;
  saveToDisk(prefabId: string, path: string): Promise<void>;
  loadFromDisk(path: string): Promise<IPrefab>;
}
```

### Updated PrefabAPI Implementation

```typescript
export const createPrefabAPI = (entityId: number): IPrefabAPI => {
  const prefabManager = PrefabManager.getInstance();
  const componentManager = ComponentManager.getInstance();

  return {
    spawn: (prefabId: string, overrides?: Record<string, unknown>): number => {
      logger.debug(`Spawning prefab: ${prefabId}`, { entityId, overrides });

      try {
        const newEntityId = prefabManager.instantiate(prefabId, overrides);

        if (newEntityId === -1) {
          logger.error(`Failed to spawn prefab: ${prefabId}`);
          return -1;
        }

        logger.info(`Spawned prefab ${prefabId} as entity ${newEntityId}`);
        return newEntityId;
      } catch (error) {
        logger.error('Prefab spawn error:', error);
        return -1;
      }
    },

    destroy: (targetEntityId?: number): void => {
      const targetId = targetEntityId ?? entityId;
      logger.debug(`Destroying entity: ${targetId}`, { entityId });

      try {
        // Check if it's a prefab instance
        if (prefabManager.isInstance(targetId)) {
          prefabManager.destroy(targetId); // Use pool if enabled
        } else {
          // Regular entity destruction
          componentManager.removeAllComponents(targetId);
        }

        logger.info(`Destroyed entity: ${targetId}`);
      } catch (error) {
        logger.error('Entity destruction error:', error);
      }
    },

    setActive: (targetEntityId: number, active: boolean): void => {
      logger.debug(`Setting entity ${targetEntityId} active: ${active}`);

      try {
        prefabManager.setActive(targetEntityId, active);
      } catch (error) {
        logger.error('setActive error:', error);
      }
    },
  };
};
```

### Prefab Serialization

```typescript
class PrefabSerializer {
  serialize(entityId: number): IPrefab {
    const componentManager = ComponentManager.getInstance();
    const components: IPrefabComponent[] = [];

    // Serialize all components
    const componentTypes = componentManager.getComponentTypes(entityId);
    for (const type of componentTypes) {
      const data = componentManager.getComponentData(entityId, type);
      if (data) {
        components.push({ type, data });
      }
    }

    // Serialize children recursively
    const children: IPrefab[] = [];
    const childEntities = this.getChildren(entityId);
    for (const childId of childEntities) {
      children.push(this.serialize(childId));
    }

    return {
      id: this.generateId(),
      name: `Entity_${entityId}`,
      version: '1.0.0',
      components,
      children: children.length > 0 ? children : undefined,
    };
  }

  deserialize(prefab: IPrefab, parent?: number): number {
    const entityManager = EntityManager.getInstance();
    const componentManager = ComponentManager.getInstance();

    // Create entity
    const entityId = entityManager.createEntity();

    // Add components
    for (const comp of prefab.components) {
      componentManager.addComponent(entityId, comp.type, comp.data);
    }

    // Set parent
    if (parent !== undefined) {
      this.setParent(entityId, parent);
    }

    // Deserialize children
    if (prefab.children) {
      for (const child of prefab.children) {
        this.deserialize(child, entityId);
      }
    }

    return entityId;
  }
}
```

### Prefab Pooling

```typescript
class PrefabPool {
  private prefabId: string;
  private poolSize: number;
  private available: number[];
  private active: Set<number>;

  constructor(prefabId: string, poolSize: number) {
    this.prefabId = prefabId;
    this.poolSize = poolSize;
    this.available = [];
    this.active = new Set();
  }

  warm(count: number): void {
    const prefabManager = PrefabManager.getInstance();

    for (let i = 0; i < count; i++) {
      const entityId = prefabManager.instantiate(this.prefabId);
      prefabManager.setActive(entityId, false);
      this.available.push(entityId);
    }
  }

  acquire(overrides?: Record<string, unknown>): number {
    let entityId: number;

    if (this.available.length > 0) {
      // Reuse from pool
      entityId = this.available.pop()!;
      this.applyOverrides(entityId, overrides);
      PrefabManager.getInstance().setActive(entityId, true);
    } else {
      // Create new if pool exhausted
      entityId = PrefabManager.getInstance().instantiate(this.prefabId, overrides);
    }

    this.active.add(entityId);
    return entityId;
  }

  release(entityId: number): void {
    if (!this.active.has(entityId)) return;

    this.active.delete(entityId);

    if (this.available.length < this.poolSize) {
      // Return to pool
      this.resetEntity(entityId);
      PrefabManager.getInstance().setActive(entityId, false);
      this.available.push(entityId);
    } else {
      // Pool full, destroy
      PrefabManager.getInstance().destroy(entityId);
    }
  }

  private resetEntity(entityId: number): void {
    // Reset entity to default state
    // Clear temporary components, reset transforms, etc.
  }

  private applyOverrides(entityId: number, overrides?: Record<string, unknown>): void {
    if (!overrides) return;

    const componentManager = ComponentManager.getInstance();

    for (const [key, value] of Object.entries(overrides)) {
      // Apply overrides to components
      if (key === 'position' || key === 'rotation' || key === 'scale') {
        componentManager.updateComponent(entityId, 'Transform', { [key]: value });
      } else {
        // Custom component override
        componentManager.updateComponent(entityId, key, value);
      }
    }
  }
}
```

## Implementation Plan

### Phase 1: Core Prefab System (1 day)

1. Create PrefabManager class
2. Implement prefab registration and storage
3. Basic instantiation (no pooling)
4. Prefab serialization/deserialization
5. Unit tests for core functionality

### Phase 2: Instance Management (0.5 days)

1. Track prefab instances
2. Implement destroy functionality
3. setActive/isActive implementation
4. Instance metadata tracking
5. Tests for instance management

### Phase 3: Prefab Pooling (0.5 days)

1. Create PrefabPool class
2. Implement pool warm-up
3. Acquire/release logic
4. Pool size limits and overflow handling
5. Tests for pooling

### Phase 4: Integrate with PrefabAPI (0.5 days)

1. Replace stub in PrefabAPI.ts
2. Wire PrefabManager into API
3. Handle errors gracefully
4. Remove warning logs
5. Integration tests

### Phase 5: Prefab Files & Loading (0.5 days)

1. Define JSON format for prefabs
2. Implement file loading/saving
3. Create example prefabs
4. Prefab validation
5. Hot-reload support

## File Structure

```
src/core/lib/prefabs/
├── PrefabManager.ts
├── PrefabSerializer.ts
├── PrefabInstance.ts
├── PrefabPool.ts
├── types.ts
└── __tests__/
    ├── PrefabManager.test.ts
    ├── PrefabSerializer.test.ts
    ├── PrefabPool.test.ts
    └── PrefabInstance.test.ts

src/core/lib/scripting/apis/
└── PrefabAPI.ts             # UPDATED

src/game/prefabs/
├── player.prefab.json
├── enemy-basic.prefab.json
├── enemy-advanced.prefab.json
├── projectile.prefab.json
├── collectible-coin.prefab.json
└── particle-effect.prefab.json

docs/architecture/
└── 2-14-prefab-system.md    # NEW
```

## Usage Examples

### Spawn Enemy

```typescript
function onStart(): void {
  // Spawn enemy at specific position
  const enemyId = prefab.spawn('enemy-basic', {
    position: [10, 0, 5],
    rotation: [0, Math.PI, 0],
  });

  console.log('Spawned enemy:', enemyId);
}
```

### Spawn with Pooling

```typescript
// Enable pooling in game setup
PrefabManager.getInstance().enablePooling('projectile', 50);
PrefabManager.getInstance().warmPool('projectile', 20);

// In script
function onUpdate(deltaTime: number): void {
  if (input.isKeyDown('space')) {
    // Spawn from pool (fast)
    const bulletId = prefab.spawn('projectile', {
      position: entity.transform.position,
      rotation: entity.transform.rotation,
    });

    // Auto-destroy after 3 seconds
    timer.setTimeout(() => {
      prefab.destroy(bulletId); // Returns to pool
    }, 3000);
  }
}
```

### Spawn Wave of Enemies

```typescript
async function spawnWave(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 20;

    const enemyId = prefab.spawn('enemy-basic', {
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
    });

    // Wait a bit between spawns
    await timer.waitFrames(5);
  }
}
```

### Toggle Entity Active State

```typescript
let enemyId: number;

function onStart(): void {
  enemyId = prefab.spawn('enemy-basic');
}

function onUpdate(deltaTime: number): void {
  if (input.isKeyDown('h')) {
    // Toggle enemy visibility/active state
    const isActive = PrefabManager.getInstance().isActive(enemyId);
    prefab.setActive(enemyId, !isActive);
  }
}
```

## Prefab File Format

```json
{
  "id": "enemy-basic",
  "name": "Basic Enemy",
  "description": "Standard enemy unit",
  "version": "1.0.0",
  "tags": ["enemy", "ai", "combat"],
  "components": [
    {
      "type": "Transform",
      "data": {
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
      }
    },
    {
      "type": "MeshRenderer",
      "data": {
        "meshType": "box",
        "materialId": "enemy-material",
        "castShadow": true,
        "receiveShadow": true
      }
    },
    {
      "type": "Script",
      "data": {
        "scriptRef": {
          "scriptId": "enemy-ai",
          "source": "external"
        },
        "parameters": {
          "speed": 3.0,
          "health": 100,
          "damage": 10
        }
      }
    }
  ],
  "metadata": {
    "author": "Game Developer",
    "created": "2025-09-30",
    "category": "enemy"
  }
}
```

## Testing Strategy

### Unit Tests

- PrefabManager registration/unregistration
- Prefab instantiation with overrides
- Instance tracking and metadata
- Serialization round-trip (entity → prefab → entity)
- Pool acquire/release logic
- setActive/destroy operations

### Integration Tests

- Spawn prefab from script
- Multi-level nested prefabs
- Pooled vs non-pooled instantiation
- Override application
- Cleanup on scene change
- Load prefabs from files

### Performance Tests

- 1000+ simultaneous instances
- Pool vs non-pool performance comparison
- Serialization performance
- Memory usage with large prefabs

## Edge Cases

| Edge Case                   | Solution                               |
| --------------------------- | -------------------------------------- |
| Prefab ID not found         | Log error, return -1, don't crash      |
| Invalid override keys       | Log warning, ignore invalid overrides  |
| Circular prefab references  | Detect and prevent during registration |
| Nested prefab depth limit   | Max depth of 10 levels                 |
| Pool exhausted              | Create new instances dynamically       |
| Destroy non-existent entity | Log warning, no-op                     |
| setActive on invalid entity | Log warning, return false              |
| Prefab version mismatch     | Attempt migration or log warning       |
| Invalid JSON format         | Parse error handling, return null      |
| Missing component types     | Skip missing components, log warning   |

## Acceptance Criteria

- ✅ PrefabManager implemented and tested
- ✅ Scripts can spawn prefabs without warnings
- ✅ Prefab instantiation with overrides works
- ✅ Entity destruction works (pooled and non-pooled)
- ✅ setActive toggles entity state correctly
- ✅ Prefab pooling improves performance
- ✅ Prefabs load from JSON files
- ✅ Nested prefabs work correctly
- ✅ All unit tests pass (20+ tests)
- ✅ Integration tests pass (10+ tests)
- ✅ Documentation complete
- ✅ Example prefabs created

## Future Enhancements

- Prefab variants (same base, different properties)
- Prefab inheritance (extend existing prefabs)
- Visual prefab editor in UI
- Prefab marketplace/sharing
- Runtime prefab modification
- Prefab diff and merge
- Prefab versioning and migration
- Prefab dependencies and asset bundling

## References

- [Unity Prefab System](https://docs.unity3d.com/Manual/Prefabs.html)
- [Godot Scenes as Prefabs](https://docs.godotengine.org/en/stable/tutorials/scripting/scene_tree.html)
- [Script API Documentation](../architecture/2-13-script-system.md)
- Current PrefabAPI: `src/core/lib/scripting/apis/PrefabAPI.ts`
