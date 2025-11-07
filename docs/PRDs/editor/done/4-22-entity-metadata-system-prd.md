# Entity Metadata System PRD

**Status**: Not Started
**Priority**: Low
**Estimated Effort**: 0.5 days
**Dependencies**: ECS System

## Overview

Implement an Entity Metadata System that allows entities to have human-readable names and globally unique identifiers (GUIDs). Enable the Script API's EntitiesAPI to find entities by name, support entity references across scenes, and improve editor usability.

## Current State

The EntitiesAPI has stubbed methods in `src/core/lib/scripting/apis/EntitiesAPI.ts`:

```typescript
findByName: (name: string): number[] => {
  logger.warn(`Entity name lookups not yet fully implemented: ${name}`);
  return [];
},

findByTag: (tag: string): number[] => {
  logger.warn(`Tag-based entity lookup not yet implemented: ${tag}`);
  return [];
},
```

Additionally, `IEntityRef` interface supports name/path/guid references, but these are not implemented:

```typescript
export interface IEntityRef {
  entityId?: number;
  name?: string;
  path?: string;
  guid?: string;
}
```

## Goals

1. Assign human-readable names to entities
2. Generate globally unique identifiers (GUIDs) for entities
3. Support entity lookup by name
4. Support entity references via GUID (cross-scene references)
5. Integrate with Script API EntitiesAPI
6. Provide editor UI for name/GUID management
7. Persist names and GUIDs in scene serialization

## Proposed Solution

### Architecture

```
src/core/lib/ecs/metadata/
├── EntityMetadataManager.ts  # Singleton metadata manager
├── types.ts                  # Metadata types
└── __tests__/
    └── EntityMetadataManager.test.ts

src/core/lib/scripting/apis/
└── EntitiesAPI.ts            # UPDATED: Use metadata manager

src/editor/components/panels/InspectorPanel/
└── EntityNameInput.tsx       # Name/GUID editor UI
```

### Data Structures

```typescript
interface IEntityMetadata {
  name: string; // Human-readable name
  guid: string; // Globally unique identifier
  created: number; // Timestamp
  modified: number; // Last modification timestamp
}

interface IMetadataIndex {
  entityMetadata: Map<number, IEntityMetadata>; // Entity ID → Metadata
  nameIndex: Map<string, Set<number>>; // Name → Entity IDs (non-unique)
  guidIndex: Map<string, number>; // GUID → Entity ID (unique)
}
```

### EntityMetadataManager Interface

```typescript
class EntityMetadataManager {
  private entityMetadata: Map<number, IEntityMetadata>;
  private nameIndex: Map<string, Set<number>>;
  private guidIndex: Map<string, number>;

  // Metadata operations
  setName(entityId: number, name: string): void;
  getName(entityId: number): string | null;
  setGuid(entityId: number, guid: string): void;
  getGuid(entityId: number): string | null;
  getMetadata(entityId: number): IEntityMetadata | null;

  // GUID generation
  generateGuid(): string;
  ensureGuid(entityId: number): string; // Get or create GUID

  // Lookups
  findByName(name: string): number[];
  findByGuid(guid: string): number | null;

  // Lifecycle
  createEntity(entityId: number, name?: string): void;
  destroyEntity(entityId: number): void;
  clear(): void;

  // Serialization
  serialize(): Record<number, IEntityMetadata>;
  deserialize(data: Record<number, IEntityMetadata>): void;
}
```

### EntityMetadataManager Implementation

```typescript
import { Logger } from '@/core/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = Logger.create('EntityMetadataManager');

export class EntityMetadataManager {
  private static instance: EntityMetadataManager | null = null;

  private entityMetadata: Map<number, IEntityMetadata>;
  private nameIndex: Map<string, Set<number>>;
  private guidIndex: Map<string, number>;

  private constructor() {
    this.entityMetadata = new Map();
    this.nameIndex = new Map();
    this.guidIndex = new Map();
  }

  public static getInstance(): EntityMetadataManager {
    if (!EntityMetadataManager.instance) {
      EntityMetadataManager.instance = new EntityMetadataManager();
    }
    return EntityMetadataManager.instance;
  }

  /**
   * Set entity name
   */
  public setName(entityId: number, name: string): void {
    const metadata = this.ensureMetadata(entityId);
    const oldName = metadata.name;

    // Update name
    metadata.name = name;
    metadata.modified = Date.now();

    // Update name index
    if (oldName) {
      const oldNameSet = this.nameIndex.get(oldName);
      if (oldNameSet) {
        oldNameSet.delete(entityId);
        if (oldNameSet.size === 0) {
          this.nameIndex.delete(oldName);
        }
      }
    }

    if (!this.nameIndex.has(name)) {
      this.nameIndex.set(name, new Set());
    }
    this.nameIndex.get(name)!.add(entityId);

    logger.debug(`Set entity ${entityId} name to "${name}"`);
  }

  /**
   * Get entity name
   */
  public getName(entityId: number): string | null {
    const metadata = this.entityMetadata.get(entityId);
    return metadata ? metadata.name : null;
  }

  /**
   * Set entity GUID
   */
  public setGuid(entityId: number, guid: string): void {
    const metadata = this.ensureMetadata(entityId);

    // Check if GUID already exists
    const existingEntityId = this.guidIndex.get(guid);
    if (existingEntityId !== undefined && existingEntityId !== entityId) {
      logger.error(`GUID collision: ${guid} already assigned to entity ${existingEntityId}`);
      return;
    }

    // Remove old GUID
    if (metadata.guid) {
      this.guidIndex.delete(metadata.guid);
    }

    // Set new GUID
    metadata.guid = guid;
    metadata.modified = Date.now();
    this.guidIndex.set(guid, entityId);

    logger.debug(`Set entity ${entityId} GUID to ${guid}`);
  }

  /**
   * Get entity GUID
   */
  public getGuid(entityId: number): string | null {
    const metadata = this.entityMetadata.get(entityId);
    return metadata ? metadata.guid : null;
  }

  /**
   * Get full metadata for entity
   */
  public getMetadata(entityId: number): IEntityMetadata | null {
    return this.entityMetadata.get(entityId) || null;
  }

  /**
   * Generate a new GUID
   */
  public generateGuid(): string {
    return uuidv4();
  }

  /**
   * Ensure entity has GUID (create if missing)
   */
  public ensureGuid(entityId: number): string {
    const metadata = this.ensureMetadata(entityId);

    if (!metadata.guid) {
      metadata.guid = this.generateGuid();
      this.guidIndex.set(metadata.guid, entityId);
    }

    return metadata.guid;
  }

  /**
   * Find entities by name (case-insensitive)
   */
  public findByName(name: string): number[] {
    const nameSet = this.nameIndex.get(name);
    return nameSet ? Array.from(nameSet) : [];
  }

  /**
   * Find entity by GUID
   */
  public findByGuid(guid: string): number | null {
    return this.guidIndex.get(guid) ?? null;
  }

  /**
   * Create entity with metadata
   */
  public createEntity(entityId: number, name?: string): void {
    const metadata: IEntityMetadata = {
      name: name || `Entity ${entityId}`,
      guid: this.generateGuid(),
      created: Date.now(),
      modified: Date.now(),
    };

    this.entityMetadata.set(entityId, metadata);
    this.guidIndex.set(metadata.guid, entityId);

    if (!this.nameIndex.has(metadata.name)) {
      this.nameIndex.set(metadata.name, new Set());
    }
    this.nameIndex.get(metadata.name)!.add(entityId);

    logger.debug(
      `Created entity ${entityId} with name "${metadata.name}" and GUID ${metadata.guid}`,
    );
  }

  /**
   * Destroy entity and clean up metadata
   */
  public destroyEntity(entityId: number): void {
    const metadata = this.entityMetadata.get(entityId);
    if (!metadata) return;

    // Remove from name index
    const nameSet = this.nameIndex.get(metadata.name);
    if (nameSet) {
      nameSet.delete(entityId);
      if (nameSet.size === 0) {
        this.nameIndex.delete(metadata.name);
      }
    }

    // Remove from GUID index
    this.guidIndex.delete(metadata.guid);

    // Remove metadata
    this.entityMetadata.delete(entityId);

    logger.debug(`Destroyed entity ${entityId} metadata`);
  }

  /**
   * Clear all metadata (scene reset)
   */
  public clear(): void {
    this.entityMetadata.clear();
    this.nameIndex.clear();
    this.guidIndex.clear();
    logger.info('Cleared all entity metadata');
  }

  /**
   * Serialize metadata for scene saving
   */
  public serialize(): Record<number, IEntityMetadata> {
    const data: Record<number, IEntityMetadata> = {};

    for (const [entityId, metadata] of this.entityMetadata.entries()) {
      data[entityId] = { ...metadata };
    }

    return data;
  }

  /**
   * Deserialize metadata from scene loading
   */
  public deserialize(data: Record<number, IEntityMetadata>): void {
    this.clear();

    for (const [entityIdStr, metadata] of Object.entries(data)) {
      const entityId = parseInt(entityIdStr, 10);

      this.entityMetadata.set(entityId, metadata);

      // Rebuild name index
      if (!this.nameIndex.has(metadata.name)) {
        this.nameIndex.set(metadata.name, new Set());
      }
      this.nameIndex.get(metadata.name)!.add(entityId);

      // Rebuild GUID index
      this.guidIndex.set(metadata.guid, entityId);
    }

    logger.info(`Deserialized metadata for ${Object.keys(data).length} entities`);
  }

  /**
   * Ensure metadata exists for entity (create if missing)
   */
  private ensureMetadata(entityId: number): IEntityMetadata {
    let metadata = this.entityMetadata.get(entityId);

    if (!metadata) {
      this.createEntity(entityId);
      metadata = this.entityMetadata.get(entityId)!;
    }

    return metadata;
  }
}
```

### Updated EntitiesAPI Implementation

```typescript
// src/core/lib/scripting/apis/EntitiesAPI.ts

import { EntityMetadataManager } from '@/core/lib/ecs/metadata/EntityMetadataManager';

export const createEntitiesAPI = (): IEntitiesAPI => {
  const metadataManager = EntityMetadataManager.getInstance();
  const componentManager = ComponentManager.getInstance();

  const entityExists = (id: number): boolean => {
    try {
      return componentManager.hasComponent(id, 'Transform');
    } catch {
      return false;
    }
  };

  return {
    fromRef: (ref: IEntityRef): IEntityAPI | null => {
      let entityId: number | null = null;

      // Try numeric ID
      if (typeof ref === 'number') {
        entityId = ref;
      }
      // Try entityId field
      else if (ref.entityId !== undefined) {
        entityId = ref.entityId;
      }
      // Try GUID
      else if (ref.guid) {
        entityId = metadataManager.findByGuid(ref.guid);
      }
      // Try name (returns first match)
      else if (ref.name) {
        const matches = metadataManager.findByName(ref.name);
        entityId = matches.length > 0 ? matches[0] : null;
      }

      if (entityId !== null && entityExists(entityId)) {
        return createEntityAPI(entityId);
      }

      return null;
    },

    get: (entityId: number): IEntityAPI | null => {
      return entityExists(entityId) ? createEntityAPI(entityId) : null;
    },

    exists: (entityId: number): boolean => {
      return entityExists(entityId);
    },

    findByName: (name: string): number[] => {
      return metadataManager.findByName(name);
    },

    findByTag: (tag: string): number[] => {
      const tagManager = TagManager.getInstance();
      return tagManager.findByTag(tag);
    },
  };
};
```

## Implementation Plan

### Phase 1: Core Metadata Manager (0.25 days)

1. Create EntityMetadataManager class
2. Implement setName/getName
3. Implement setGuid/getGuid/generateGuid
4. Implement findByName and findByGuid
5. Unit tests

### Phase 2: Integration (0.25 days)

1. Update EntitiesAPI to use metadata manager
2. Support GUID and name resolution in fromRef
3. Remove warning logs
4. Integration tests

### Phase 3: Serialization & Lifecycle (0.25 days)

1. Implement serialize/deserialize
2. Hook into entity creation/destruction
3. Hook into scene save/load
4. Tests

### Phase 4: Editor UI (0.25 days)

1. Create EntityNameInput component
2. Display GUID (read-only)
3. Integrate into InspectorPanel
4. Manual testing

## File Structure

```
src/core/lib/ecs/metadata/
├── EntityMetadataManager.ts
├── types.ts
└── __tests__/
    └── EntityMetadataManager.test.ts

src/core/lib/scripting/apis/
└── EntitiesAPI.ts           # UPDATED

src/editor/components/panels/InspectorPanel/
└── EntityNameInput.tsx      # NEW

docs/architecture/
└── 2-17-entity-metadata.md  # NEW
```

## Usage Examples

### Find Entity by Name

```typescript
function onStart(): void {
  const players = entities.findByName('Player');

  if (players.length > 0) {
    const player = entities.get(players[0]);
    if (player) {
      console.log('Found player at:', player.transform.position);
    }
  }
}
```

### Reference Entity by GUID

```typescript
// Store GUID in parameters
const targetGuid = parameters.targetGuid as string;

function onUpdate(deltaTime: number): void {
  const target = entities.fromRef({ guid: targetGuid });

  if (target) {
    // Look at target
    entity.transform.lookAt(target.transform.position);
  }
}
```

### Multiple Entities with Same Name

```typescript
function onStart(): void {
  const enemies = entities.findByName('Enemy');

  console.log(`Found ${enemies.length} enemies`);

  for (const enemyId of enemies) {
    const enemy = entities.get(enemyId);
    if (enemy) {
      console.log(`Enemy ${enemyId} at`, enemy.transform.position);
    }
  }
}
```

## Testing Strategy

### Unit Tests

- setName/getName operations
- setGuid/getGuid operations
- GUID generation (unique)
- findByName (multiple matches)
- findByGuid (unique match)
- Serialization round-trip
- Cleanup on entity destruction

### Integration Tests

- EntitiesAPI.findByName integration
- EntitiesAPI.fromRef with GUID
- EntitiesAPI.fromRef with name
- Metadata persistence in scene save/load

### Performance Tests

- 10,000 entities with metadata
- findByName performance
- findByGuid performance (O(1))
- Serialize/deserialize performance

## Edge Cases

| Edge Case                      | Solution                         |
| ------------------------------ | -------------------------------- |
| Duplicate names                | Allow duplicates, return array   |
| GUID collision                 | Log error, reject duplicate GUID |
| Entity without metadata        | Auto-create on first access      |
| Empty name                     | Default to "Entity {id}"         |
| Invalid GUID format            | Accept any string as GUID        |
| Entity destroyed with metadata | Auto-cleanup                     |
| Name changed                   | Update name index                |

## Performance Considerations

### Triple-Index Structure

- O(1) lookup by entity ID
- O(1) lookup by GUID
- O(1) lookup by name (returns Set)
- Minimal memory overhead

### GUID Generation

- Use uuid v4 for uniqueness
- One-time generation on entity creation
- Persist across scene saves/loads

## Acceptance Criteria

- ✅ EntityMetadataManager implemented and tested
- ✅ Scripts can find entities by name
- ✅ Scripts can reference entities by GUID
- ✅ Names and GUIDs persist in scenes
- ✅ Editor UI for name/GUID works
- ✅ All unit tests pass (10+ tests)
- ✅ Integration tests pass (5+ tests)
- ✅ Documentation complete

## Future Enhancements

- Hierarchical paths (Parent/Child/Entity)
- Entity descriptions/comments
- Entity icons/colors
- Name validation (prevent duplicates)
- GUID regeneration tool
- Entity search by metadata
- Entity bookmarks/favorites

## References

- [Unity GameObject Names](https://docs.unity3d.com/ScriptReference/GameObject-name.html)
- [UUID v4 Specification](https://datatracker.ietf.org/doc/html/rfc4122)
- Current EntitiesAPI stub: `src/core/lib/scripting/apis/EntitiesAPI.ts`

## Dependencies

```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```
