import { z } from 'zod';

// Import ECS components for world serialization
import type { EntityManager } from '../ecs/EntityManager';
import type { ComponentRegistry } from '../ecs/ComponentRegistry';

// Enhanced schema for scene serialization
export const SceneSchema = z.object({
  version: z.number(),
  name: z.string().optional(),
  timestamp: z.string().optional(),
  entities: z.array(
    z.object({
      id: z.union([z.string(), z.number()]), // Support both string and numeric IDs
      name: z.string(),
      parentId: z.union([z.string(), z.number()]).optional().nullable(),
      components: z.record(z.any()),
    }),
  ),
});

export type ISerializedScene = z.infer<typeof SceneSchema>;

export interface ISceneMetadata {
  name?: string;
  timestamp?: string;
  version: number;
}

/**
 * Normalizes entity ID to string format for consistent serialization
 */
const normalizeEntityId = (id: string | number): string => {
  return typeof id === 'number' ? id.toString() : id;
};

/**
 * Serializes scene entities to JSON format with metadata
 * Enforces consistent string IDs and validates output
 */
export const exportScene = (
  entities: Array<{
    id: string | number;
    name: string;
    parentId?: string | number | null;
  }>,
  getComponentsForEntity: (entityId: string | number) => Array<{ type: string; data: unknown }>,
  metadata: Partial<ISceneMetadata> = {},
): ISerializedScene => {
  const serializedEntities = entities.map((entity) => {
    const normalizedId = normalizeEntityId(entity.id);
    const entityComponents = getComponentsForEntity(entity.id);

    const entityData = {
      id: normalizedId,
      name: entity.name || `Entity ${normalizedId}`,
      parentId: entity.parentId ? normalizeEntityId(entity.parentId) : null,
      components: {} as Record<string, unknown>,
    };

    entityComponents.forEach((component) => {
      if (component.data) {
        entityData.components[component.type] = component.data;
      }
    });

    return entityData;
  });

  const scene: ISerializedScene = {
    version: metadata.version || 4,
    name: metadata.name,
    timestamp: metadata.timestamp || new Date().toISOString(),
    entities: serializedEntities,
  };

  // Validate the serialized scene before returning
  const validation = validateScene(scene);
  if (!validation.isValid) {
    throw new Error(`Scene serialization validation failed: ${validation.error}`);
  }

  return scene;
};

/**
 * Imports scene from JSON format with validation and type conversion
 */
export const importScene = async (
  scene: unknown,
  entityManager: {
    clearEntities: () => void;
    // Optional persistentId third parameter for exact preservation
    createEntity: (
      name: string,
      parentId?: string | number | null,
      persistentId?: string,
    ) => { id: string | number };
  },
  componentManager: {
    addComponent: (
      entityId: string | number,
      componentType: string,
      componentData: unknown,
    ) => void;
  },
): Promise<void> => {
  // Validate scene structure with detailed error reporting
  let validatedScene: z.infer<typeof SceneSchema>;

  try {
    validatedScene = SceneSchema.parse(scene);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(`Scene validation failed:\n${errorDetails}`);
    }
    throw error;
  }

  if (!validatedScene || !validatedScene.entities) {
    throw new Error('Invalid scene data: missing entities array');
  }

  console.log(`[SceneSerializer] Importing scene with ${validatedScene.entities.length} entities`);

  // Clear existing entities first
  entityManager.clearEntities();

  // Two-pass import to preserve hierarchy
  const importErrors: string[] = [];
  const idMap = new Map<string, string | number>();

  // First pass: create all entities without parents, attach components except PersistentId
  for (const entityData of validatedScene.entities) {
    try {
      // Extract persistent ID if present
      const persistentId = (entityData.components as any)?.PersistentId?.id as
        | string
        | undefined;

      const created = entityManager.createEntity(
        entityData.name || `Entity ${entityData.id}`,
        undefined,
        persistentId,
      );
      idMap.set(String(entityData.id), created.id);

      // Add non-persistent components
      const componentEntries = Object.entries(entityData.components || {});
      for (const [componentType, componentData] of componentEntries) {
        if (!componentData) continue;
        if (componentType === 'PersistentId') continue;
        componentManager.addComponent(created.id, componentType, componentData);
      }

      console.log(
        `[SceneSerializer] Created entity: ${entityData.name} (${entityData.id})`,
      );
    } catch (error) {
      const errorMessage = `Failed to create entity ${entityData.name} (${entityData.id}): ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(`[SceneSerializer] ${errorMessage}`, entityData);
      importErrors.push(errorMessage);
    }
  }

  // Second pass: assign parents using the id map
  for (const entityData of validatedScene.entities) {
    const parentRef = entityData.parentId;
    if (parentRef === undefined || parentRef === null) continue;

    const childEid = idMap.get(String(entityData.id));
    const parentEid = idMap.get(String(parentRef));

    if (childEid === undefined || parentEid === undefined) {
      console.warn(
        `[SceneSerializer] Skipping parent assignment: child=${entityData.id} parent=${parentRef}`,
      );
      continue;
    }

    // If adapter provides setParent, use it
    if ('setParent' in (entityManager as any) && typeof (entityManager as any).setParent === 'function') {
      (entityManager as any).setParent(childEid, parentEid);
    } else {
      console.warn('[SceneSerializer] Entity manager adapter has no setParent; parent not assigned');
    }
  }

  // Report any import errors but don't fail completely
  if (importErrors.length > 0) {
    console.warn(
      `[SceneSerializer] Scene imported with ${importErrors.length} errors:`,
      importErrors,
    );
  } else {
    console.log(
      `[SceneSerializer] Scene imported successfully: ${validatedScene.entities.length} entities`,
    );
  }
};

/**
 * Serializes current world state to scene data
 * Can work with injected instances or fall back to singletons for backward compatibility
 */
export function serializeWorld(
  entityManager?: EntityManager,
  componentRegistry?: ComponentRegistry
): ISerializedScene {
  try {
    // Use injected instances or fall back to singletons
    let manager: EntityManager;
    let registry: ComponentRegistry;

    if (entityManager && componentRegistry) {
      manager = entityManager;
      registry = componentRegistry;
    } else {
      // Dynamic imports to avoid circular dependencies
      const { EntityManager } = require('../ecs/EntityManager');
      const { componentRegistry: defaultRegistry } = require('../ecs/ComponentRegistry');

      manager = EntityManager.getInstance();
      registry = defaultRegistry;
    }

    const allEntities = manager.getAllEntities();

    console.log(`[SceneSerializer] Serializing world with ${allEntities.length} entities`);

    // Convert entities to serializable format
    const getComponentsForEntity = (entityId: string | number) => {
      const components: Array<{ type: string; data: unknown }> = [];

      try {
        // Get component types for this specific entity
        const componentTypes = registry.getEntityComponents(entityId);

        for (const componentType of componentTypes) {
          const componentData = registry.getComponentData(entityId, componentType);
          if (componentData) {
            components.push({
              type: componentType,
              data: componentData
            });
          }
        }
      } catch (error) {
        console.warn(`[SceneSerializer] Failed to get components for entity ${entityId}:`, error);
      }

      return components;
    };

    // Use the existing exportScene function with the entity data
    return exportScene(
      allEntities.map(entity => ({
        id: entity.id,
        name: entity.name,
        parentId: entity.parentId
      })),
      getComponentsForEntity,
      {
        name: 'Current World',
        version: 4,
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    console.error('[SceneSerializer] Failed to serialize world:', error);

    // Return minimal valid scene on error
    return {
      version: 4,
      name: 'Current World (Error)',
      timestamp: new Date().toISOString(),
      entities: [],
    };
  }
}

/**
 * Validates scene data without importing
 */
export const validateScene = (scene: unknown): { isValid: boolean; error?: string } => {
  try {
    SceneSchema.parse(scene);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors.map((e) => e.message).join(', ') };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};
