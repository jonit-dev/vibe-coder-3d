/**
 * Scene Diff - Compute deltas between code-built scenes and current editor state
 * This allows saving only the changes made in the editor as overrides
 */

import { z } from 'zod';

// import { componentRegistry } from '../ecs/ComponentRegistry'; // Will be used in future implementation
import { EntityManager } from '../ecs/EntityManager';
// import { streamingSerializer } from './StreamingSceneSerializer';

// Legacy compatibility function for scene diff
function serializeWorld() {
  const entityManager = EntityManager.getInstance();
  const entities = entityManager.getAllEntities();

  return {
    version: 5,
    entities: entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      parentId: entity.parentId,
      components: {} as Record<string, unknown> // Simplified for diff purposes
    }))
  };
}

// Override patch for a single entity
export const OverridePatchSchema = z.object({
  persistentId: z.string(),
  entityName: z.string().optional(), // Track name changes
  components: z.record(z.string(), z.unknown()), // Component ID -> partial data
});

// Complete overrides file format
export const OverridesFileSchema = z.object({
  sceneId: z.string(),
  timestamp: z.string(),
  patches: z.array(OverridePatchSchema),
  metadata: z
    .object({
      description: z.string().optional(),
      editorVersion: z.string().optional(),
    })
    .optional(),
});

export type OverridePatch = z.infer<typeof OverridePatchSchema>;
export type OverridesFile = z.infer<typeof OverridesFileSchema>;

/**
 * Compute the difference between a base scene and the current world state
 */
export function diffAgainstBase(
  baseSceneId: string,
  // _currentWorld?: typeof EntityManager,
): OverridesFile {
  const _entityManager = EntityManager.getInstance();

  // Create a temporary world to load the base scene
  const _tempWorld = createTempWorldWithBaseScene(); // baseSceneId unused for now

  // Suppress unused variable warnings for future implementation
  void _entityManager;
  void _tempWorld;
  const baseSerialized = serializeWorld();

  // Restore current world and get its serialization
  const currentSerialized = serializeWorld();

  // Build maps for efficient lookup
  const baseEntities = new Map(baseSerialized.entities.map((e) => [e.id, e]));
  const currentEntities = new Map(currentSerialized.entities.map((e) => [e.id, e]));

  const patches: OverridePatch[] = [];

  // Check each current entity against base
  currentEntities.forEach((currentEntity, id) => {
    const baseEntity = baseEntities.get(id);

    if (!baseEntity) {
      // Entity added in editor (new entity)
      patches.push({
        persistentId: String(id),
        entityName: currentEntity.name,
        components: currentEntity.components,
      });
      return;
    }

    // Compare entity properties
    const componentDeltas: Record<string, unknown> = {};
    let hasChanges = false;

    // Check for component changes
    Object.entries(currentEntity.components).forEach(([componentId, currentData]) => {
      const baseData = baseEntity.components[componentId];

      if (!baseData) {
        // Component added in editor
        componentDeltas[componentId] = currentData;
        hasChanges = true;
      } else {
        // Check for component data changes
        const delta = computeComponentDelta(baseData, currentData);
        if (Object.keys(delta).length > 0) {
          componentDeltas[componentId] = delta;
          hasChanges = true;
        }
      }
    });

    // Check for removed components
    Object.keys(baseEntity.components).forEach((componentId) => {
      if (!currentEntity.components[componentId]) {
        // Component removed in editor
        componentDeltas[componentId] = null; // null indicates removal
        hasChanges = true;
      }
    });

    // Check for name changes
    let nameChanged = false;
    if (baseEntity.name !== currentEntity.name) {
      nameChanged = true;
      hasChanges = true;
    }

    if (hasChanges) {
      patches.push({
        persistentId: String(id),
        entityName: nameChanged ? currentEntity.name : undefined,
        components: componentDeltas,
      });
    }
  });

  // Check for deleted entities
  baseEntities.forEach((_baseEntity, id) => {
    if (!currentEntities.has(id)) {
      // Entity deleted in editor
      patches.push({
        persistentId: String(id),
        components: { _deleted: true }, // Special marker for deletion
      });
    }
  });

  return {
    sceneId: baseSceneId,
    timestamp: new Date().toISOString(),
    patches,
    metadata: {
      description: `Overrides for ${baseSceneId} scene`,
      editorVersion: '1.0.0',
    },
  };
}

/**
 * Create a temporary world state with just the base scene loaded
 * This is used for comparison purposes
 */
function createTempWorldWithBaseScene(/* _sceneId: string */): null {
  // For now, we'll approximate this by using the current world state
  // In a full implementation, we'd create a separate ECS world instance
  // TODO: Implement proper temporary world creation
  console.warn('[SceneDiff] Using current world as base - implement proper temp world');
  return null;
}

/**
 * Compute the delta between two component data objects
 */
function computeComponentDelta(baseData: unknown, currentData: unknown): Record<string, unknown> {
  const delta: Record<string, unknown> = {};

  if (typeof baseData !== 'object' || typeof currentData !== 'object') {
    // For primitive values, return the current value if different
    return baseData !== currentData ? (currentData as Record<string, unknown>) : {};
  }

  const baseObj = baseData as Record<string, unknown>;
  const currentObj = currentData as Record<string, unknown>;

  // Check all current properties
  Object.entries(currentObj).forEach(([key, currentValue]) => {
    const baseValue = baseObj[key];

    if (Array.isArray(baseValue) && Array.isArray(currentValue)) {
      // Compare arrays
      if (JSON.stringify(baseValue) !== JSON.stringify(currentValue)) {
        delta[key] = currentValue;
      }
    } else if (
      typeof baseValue === 'object' &&
      typeof currentValue === 'object' &&
      baseValue &&
      currentValue
    ) {
      // Recursively compare objects
      const nestedDelta = computeComponentDelta(baseValue, currentValue);
      if (Object.keys(nestedDelta).length > 0) {
        delta[key] = nestedDelta;
      }
    } else if (baseValue !== currentValue) {
      // Different primitive values
      delta[key] = currentValue;
    }
  });

  // Check for removed properties
  Object.keys(baseObj).forEach((key) => {
    if (!(key in currentObj)) {
      delta[key] = null; // null indicates removal
    }
  });

  return delta;
}

/**
 * Validate an overrides file
 */
export function validateOverridesFile(data: unknown): OverridesFile | null {
  try {
    return OverridesFileSchema.parse(data);
  } catch (error) {
    console.error('Invalid overrides file:', error);
    return null;
  }
}

/**
 * Create an empty overrides file for a scene
 */
export function createEmptyOverrides(sceneId: string): OverridesFile {
  return {
    sceneId,
    timestamp: new Date().toISOString(),
    patches: [],
    metadata: {
      description: `No overrides for ${sceneId} scene`,
      editorVersion: '1.0.0',
    },
  };
}
