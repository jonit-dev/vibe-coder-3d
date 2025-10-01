# Tag System PRD

**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1 day
**Dependencies**: ECS System

## Overview

Implement a lightweight Tag System that allows entities to be labeled with multiple tags for categorization, querying, and filtering. Enable the Script API's QueryAPI to find entities by tag efficiently.

## Current State

The QueryAPI stub exists in `src/core/lib/scripting/apis/QueryAPI.ts` with a stubbed `findByTag` method:

```typescript
findByTag: (tag: string): number[] => {
  logger.warn(`Tag system not yet fully integrated - cannot find entities with tag: ${tag}`);
  return [];
};
```

Currently, there is no tag storage or querying mechanism in the ECS.

## Goals

1. Store multiple tags per entity efficiently
2. Query entities by tag with O(1) lookup performance
3. Support common tag operations (add, remove, has, clear)
4. Integrate with Script API QueryAPI
5. Persist tags in scene serialization
6. Provide editor UI for tag management

## Proposed Solution

### Architecture

```
src/core/lib/ecs/tags/
├── TagManager.ts            # Singleton tag manager
├── types.ts                 # Tag-related types
└── __tests__/
    └── TagManager.test.ts

src/core/lib/scripting/apis/
└── QueryAPI.ts              # UPDATED: Use TagManager

src/editor/components/panels/InspectorPanel/Tags/
├── TagPanel.tsx             # Tag editor UI
├── TagInput.tsx             # Tag input with autocomplete
└── TagBadge.tsx             # Tag display component
```

### Data Structures

```typescript
interface ITagData {
  tags: Set<string>; // Tags for this entity
}

interface ITagIndex {
  entityTags: Map<number, Set<string>>; // Entity ID → Tags
  tagEntities: Map<string, Set<number>>; // Tag → Entity IDs
}
```

### TagManager Interface

```typescript
class TagManager {
  private entityTags: Map<number, Set<string>>;
  private tagEntities: Map<string, Set<number>>;

  // Tag operations
  addTag(entityId: number, tag: string): void;
  removeTag(entityId: number, tag: string): void;
  hasTag(entityId: number, tag: string): boolean;
  getTags(entityId: number): string[];
  clearTags(entityId: number): void;

  // Bulk operations
  setTags(entityId: number, tags: string[]): void;
  addTags(entityId: number, tags: string[]): void;
  removeTags(entityId: number, tags: string[]): void;

  // Querying
  findByTag(tag: string): number[];
  findByAllTags(tags: string[]): number[]; // AND query
  findByAnyTag(tags: string[]): number[]; // OR query

  // Utilities
  getAllTags(): string[]; // All unique tags in scene
  getEntityCount(tag: string): number; // Entities with tag
  renameTag(oldTag: string, newTag: string): void;

  // Lifecycle
  destroyEntity(entityId: number): void; // Cleanup on entity destruction
  clear(): void; // Clear all tags

  // Serialization
  serialize(): Record<number, string[]>;
  deserialize(data: Record<number, string[]>): void;
}
```

### TagManager Implementation

```typescript
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('TagManager');

export class TagManager {
  private static instance: TagManager | null = null;

  private entityTags: Map<number, Set<string>>;
  private tagEntities: Map<string, Set<number>>;

  private constructor() {
    this.entityTags = new Map();
    this.tagEntities = new Map();
  }

  public static getInstance(): TagManager {
    if (!TagManager.instance) {
      TagManager.instance = new TagManager();
    }
    return TagManager.instance;
  }

  /**
   * Add a tag to an entity
   */
  public addTag(entityId: number, tag: string): void {
    const normalized = this.normalizeTag(tag);

    if (!normalized) {
      logger.warn(`Invalid tag: "${tag}"`);
      return;
    }

    // Add to entity → tags map
    if (!this.entityTags.has(entityId)) {
      this.entityTags.set(entityId, new Set());
    }
    this.entityTags.get(entityId)!.add(normalized);

    // Add to tag → entities map
    if (!this.tagEntities.has(normalized)) {
      this.tagEntities.set(normalized, new Set());
    }
    this.tagEntities.get(normalized)!.add(entityId);

    logger.debug(`Added tag "${normalized}" to entity ${entityId}`);
  }

  /**
   * Remove a tag from an entity
   */
  public removeTag(entityId: number, tag: string): void {
    const normalized = this.normalizeTag(tag);

    // Remove from entity → tags map
    const entityTagSet = this.entityTags.get(entityId);
    if (entityTagSet) {
      entityTagSet.delete(normalized);

      // Clean up empty sets
      if (entityTagSet.size === 0) {
        this.entityTags.delete(entityId);
      }
    }

    // Remove from tag → entities map
    const tagEntitySet = this.tagEntities.get(normalized);
    if (tagEntitySet) {
      tagEntitySet.delete(entityId);

      // Clean up empty sets
      if (tagEntitySet.size === 0) {
        this.tagEntities.delete(normalized);
      }
    }

    logger.debug(`Removed tag "${normalized}" from entity ${entityId}`);
  }

  /**
   * Check if entity has tag
   */
  public hasTag(entityId: number, tag: string): boolean {
    const normalized = this.normalizeTag(tag);
    const tags = this.entityTags.get(entityId);
    return tags ? tags.has(normalized) : false;
  }

  /**
   * Get all tags for an entity
   */
  public getTags(entityId: number): string[] {
    const tags = this.entityTags.get(entityId);
    return tags ? Array.from(tags) : [];
  }

  /**
   * Clear all tags for an entity
   */
  public clearTags(entityId: number): void {
    const tags = this.entityTags.get(entityId);
    if (!tags) return;

    // Remove entity from all tag → entities maps
    for (const tag of tags) {
      const tagEntitySet = this.tagEntities.get(tag);
      if (tagEntitySet) {
        tagEntitySet.delete(entityId);
        if (tagEntitySet.size === 0) {
          this.tagEntities.delete(tag);
        }
      }
    }

    // Remove entity from entity → tags map
    this.entityTags.delete(entityId);

    logger.debug(`Cleared all tags for entity ${entityId}`);
  }

  /**
   * Set tags for entity (replaces existing tags)
   */
  public setTags(entityId: number, tags: string[]): void {
    this.clearTags(entityId);
    this.addTags(entityId, tags);
  }

  /**
   * Add multiple tags to entity
   */
  public addTags(entityId: number, tags: string[]): void {
    for (const tag of tags) {
      this.addTag(entityId, tag);
    }
  }

  /**
   * Remove multiple tags from entity
   */
  public removeTags(entityId: number, tags: string[]): void {
    for (const tag of tags) {
      this.removeTag(entityId, tag);
    }
  }

  /**
   * Find all entities with a specific tag
   */
  public findByTag(tag: string): number[] {
    const normalized = this.normalizeTag(tag);
    const entities = this.tagEntities.get(normalized);
    return entities ? Array.from(entities) : [];
  }

  /**
   * Find entities with ALL specified tags (AND query)
   */
  public findByAllTags(tags: string[]): number[] {
    if (tags.length === 0) return [];

    const normalized = tags.map((t) => this.normalizeTag(t));

    // Start with entities having first tag
    const firstTagEntities = this.tagEntities.get(normalized[0]);
    if (!firstTagEntities) return [];

    // Filter to only entities having all other tags
    return Array.from(firstTagEntities).filter((entityId) => {
      return normalized.every((tag) => this.hasTag(entityId, tag));
    });
  }

  /**
   * Find entities with ANY of the specified tags (OR query)
   */
  public findByAnyTag(tags: string[]): number[] {
    if (tags.length === 0) return [];

    const normalized = tags.map((t) => this.normalizeTag(tag));
    const entitySet = new Set<number>();

    for (const tag of normalized) {
      const entities = this.tagEntities.get(tag);
      if (entities) {
        entities.forEach((id) => entitySet.add(id));
      }
    }

    return Array.from(entitySet);
  }

  /**
   * Get all unique tags in the scene
   */
  public getAllTags(): string[] {
    return Array.from(this.tagEntities.keys());
  }

  /**
   * Get count of entities with a tag
   */
  public getEntityCount(tag: string): number {
    const normalized = this.normalizeTag(tag);
    const entities = this.tagEntities.get(normalized);
    return entities ? entities.size : 0;
  }

  /**
   * Rename a tag globally
   */
  public renameTag(oldTag: string, newTag: string): void {
    const oldNormalized = this.normalizeTag(oldTag);
    const newNormalized = this.normalizeTag(newTag);

    if (oldNormalized === newNormalized) return;

    const entities = this.tagEntities.get(oldNormalized);
    if (!entities) return;

    // Add new tag to all entities
    for (const entityId of entities) {
      this.addTag(entityId, newNormalized);
      this.removeTag(entityId, oldNormalized);
    }

    logger.info(`Renamed tag "${oldTag}" to "${newTag}"`);
  }

  /**
   * Clean up tags when entity is destroyed
   */
  public destroyEntity(entityId: number): void {
    this.clearTags(entityId);
  }

  /**
   * Clear all tags (for scene reset)
   */
  public clear(): void {
    this.entityTags.clear();
    this.tagEntities.clear();
    logger.info('Cleared all tags');
  }

  /**
   * Serialize tags for scene saving
   */
  public serialize(): Record<number, string[]> {
    const data: Record<number, string[]> = {};

    for (const [entityId, tags] of this.entityTags.entries()) {
      data[entityId] = Array.from(tags);
    }

    return data;
  }

  /**
   * Deserialize tags from scene loading
   */
  public deserialize(data: Record<number, string[]>): void {
    this.clear();

    for (const [entityIdStr, tags] of Object.entries(data)) {
      const entityId = parseInt(entityIdStr, 10);
      this.addTags(entityId, tags);
    }

    logger.info(`Deserialized tags for ${Object.keys(data).length} entities`);
  }

  /**
   * Normalize tag (lowercase, trim, replace spaces with dashes)
   */
  private normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, '-');
  }
}
```

### Updated QueryAPI Implementation

```typescript
// src/core/lib/scripting/apis/QueryAPI.ts

import { TagManager } from '@/core/lib/ecs/tags/TagManager';

export const createQueryAPI = (entityId: number, getScene: () => THREE.Scene | null): IQueryAPI => {
  const tagManager = TagManager.getInstance();

  return {
    findByTag: (tag: string): number[] => {
      return tagManager.findByTag(tag);
    },

    findByTags: (tags: string[], matchAll: boolean = false): number[] => {
      return matchAll ? tagManager.findByAllTags(tags) : tagManager.findByAnyTag(tags);
    },

    raycastFirst: (origin, direction) => {
      // Existing implementation
    },

    raycastAll: (origin, direction) => {
      // Existing implementation
    },
  };
};
```

### Editor UI Component

```typescript
// src/editor/components/panels/InspectorPanel/Tags/TagPanel.tsx

import React, { useState } from 'react';
import { TagManager } from '@/core/lib/ecs/tags/TagManager';

interface ITagPanelProps {
  entityId: number;
}

export const TagPanel: React.FC<ITagPanelProps> = ({ entityId }) => {
  const tagManager = TagManager.getInstance();
  const [tags, setTags] = useState<string[]>(tagManager.getTags(entityId));
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    if (!inputValue.trim()) return;

    tagManager.addTag(entityId, inputValue);
    setTags(tagManager.getTags(entityId));
    setInputValue('');
  };

  const handleRemoveTag = (tag: string) => {
    tagManager.removeTag(entityId, tag);
    setTags(tagManager.getTags(entityId));
  };

  return (
    <div className="tag-panel">
      <div className="tag-input-row">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="Add tag..."
        />
        <button onClick={handleAddTag}>+</button>
      </div>

      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag-badge">
            {tag}
            <button onClick={() => handleRemoveTag(tag)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
};
```

## Implementation Plan

### Phase 1: Core TagManager (0.5 days)

1. Create TagManager class with dual-index structure
2. Implement add/remove/has/get operations
3. Implement findByTag with O(1) lookup
4. Tag normalization logic
5. Unit tests for core operations

### Phase 2: Advanced Queries (0.25 days)

1. Implement findByAllTags (AND query)
2. Implement findByAnyTag (OR query)
3. Implement getAllTags and getEntityCount
4. Implement renameTag
5. Tests for query operations

### Phase 3: Integrate with QueryAPI (0.25 days)

1. Update QueryAPI.ts to use TagManager
2. Remove warning log
3. Add findByTags method with matchAll parameter
4. Integration tests

### Phase 4: Serialization & Lifecycle (0.25 days)

1. Implement serialize/deserialize
2. Hook into entity destruction (clear tags)
3. Hook into scene save/load
4. Tests for serialization

### Phase 5: Editor UI (0.5 days)

1. Create TagPanel component
2. Create TagInput with autocomplete
3. Create TagBadge component
4. Integrate into InspectorPanel
5. Manual testing

## File Structure

```
src/core/lib/ecs/tags/
├── TagManager.ts
├── types.ts
└── __tests__/
    └── TagManager.test.ts

src/core/lib/scripting/apis/
└── QueryAPI.ts              # UPDATED

src/editor/components/panels/InspectorPanel/Tags/
├── TagPanel.tsx
├── TagInput.tsx
└── TagBadge.tsx

docs/architecture/
└── 2-16-tag-system.md       # NEW
```

## Usage Examples

### Find Enemies

```typescript
function onUpdate(deltaTime: number): void {
  const enemies = query.findByTag('enemy');

  console.log(`Found ${enemies.length} enemies`);

  for (const enemyId of enemies) {
    const enemy = entities.get(enemyId);
    if (enemy) {
      // Do something with enemy
      const distance = math.distance(...entity.transform.position, ...enemy.transform.position);

      if (distance < 10) {
        console.log('Enemy nearby!');
      }
    }
  }
}
```

### Find Collectibles

```typescript
function onUpdate(deltaTime: number): void {
  // Find all collectible items
  const collectibles = query.findByTag('collectible');

  for (const itemId of collectibles) {
    const item = entities.get(itemId);
    if (!item) continue;

    const distance = math.distance(...entity.transform.position, ...item.transform.position);

    if (distance < 2.0) {
      // Collect item
      events.emit('item:collected', { itemId, playerId: entity.id });
      prefab.destroy(itemId);
    }
  }
}
```

### Complex Queries (AND/OR)

```typescript
// Find entities that are BOTH 'enemy' AND 'flying'
const flyingEnemies = query.findByTags(['enemy', 'flying'], true);

// Find entities that are EITHER 'enemy' OR 'boss'
const threats = query.findByTags(['enemy', 'boss'], false);

console.log(`Flying enemies: ${flyingEnemies.length}`);
console.log(`Total threats: ${threats.length}`);
```

## Testing Strategy

### Unit Tests

- Add/remove/has/get tag operations
- findByTag returns correct entities
- findByAllTags (AND query)
- findByAnyTag (OR query)
- Tag normalization (spaces → dashes, lowercase)
- Cleanup on entity destruction
- Serialization round-trip

### Integration Tests

- QueryAPI.findByTag integration
- Tag persistence in scene save/load
- Multiple entities with same tag
- Entity with multiple tags
- Rename tag globally

### Performance Tests

- 10,000 entities with tags
- findByTag performance (should be O(1))
- Memory usage with many tags
- Serialize/deserialize performance

## Edge Cases

| Edge Case                     | Solution                                              |
| ----------------------------- | ----------------------------------------------------- |
| Empty tag string              | Normalize to empty, ignore                            |
| Tags with spaces              | Normalize to dashes ("flying enemy" → "flying-enemy") |
| Duplicate tags on same entity | Set prevents duplicates                               |
| Entity destroyed with tags    | Auto-cleanup via destroyEntity                        |
| Tag not found                 | Return empty array                                    |
| Invalid entity ID             | Ignore, log warning                                   |
| Case-insensitive tags         | Normalize to lowercase                                |
| Special characters in tags    | Allow alphanumeric + dash only                        |

## Performance Considerations

### Dual-Index Structure

- O(1) lookup for findByTag
- O(n) for findByAllTags/findByAnyTag where n = entities with first tag
- Minimal memory overhead (two Maps with Sets)

### Tag Normalization

- Consistent format prevents duplicates
- Lowercase for case-insensitivity
- Dash-separated for readability

### Cleanup

- Automatic cleanup on entity destruction
- Empty Set removal to prevent memory leaks
- Clear all tags on scene reset

## Acceptance Criteria

- ✅ TagManager implemented and tested
- ✅ Scripts can find entities by tag
- ✅ findByTag returns correct entities
- ✅ findByAllTags (AND) works correctly
- ✅ findByAnyTag (OR) works correctly
- ✅ Tags persist in scene serialization
- ✅ Editor UI for tag management works
- ✅ All unit tests pass (15+ tests)
- ✅ Integration tests pass (5+ tests)
- ✅ Documentation complete

## Future Enhancements

- Tag categories (entity.enemy, entity.player)
- Tag hierarchies (enemy.flying, enemy.ground)
- Tag-based prefab filters
- Tag search/filter in editor hierarchy
- Tag color coding in editor
- Tag statistics panel
- Tag import/export
- Tag aliases/synonyms

## References

- [Unity Tag System](https://docs.unity3d.com/Manual/Tags.html)
- [Godot Groups](https://docs.godotengine.org/en/stable/tutorials/scripting/groups.html)
- Current QueryAPI stub: `src/core/lib/scripting/apis/QueryAPI.ts`
