/**
 * Scene Serializer - Unified serialization for runtime and editor
 * Handles entity hierarchy with stable PersistentId references
 * Replaces the legacy serialization with proper entity identity tracking
 */

import { z } from 'zod';

import { componentRegistry } from '../ecs/ComponentRegistry';
import { EntityManager } from '../ecs/EntityManager';
import { EntityId } from '../ecs/types';

// Schema for serialized component data
const SerializedComponentSchema = z.record(z.string(), z.unknown());

// Schema for serialized entity with persistent ID
const SerializedEntitySchema = z.object({
  persistentId: z.string(),
  name: z.string().optional(),
  parentPersistentId: z.string().optional(),
  components: SerializedComponentSchema,
});

// Schema for complete serialized scene
export const SerializedSceneSchema = z.object({
  entities: z.array(SerializedEntitySchema),
  metadata: z
    .object({
      timestamp: z.string(),
      description: z.string().optional(),
    })
    .optional(),
});

export type SerializedEntity = z.infer<typeof SerializedEntitySchema>;
export type SerializedScene = z.infer<typeof SerializedSceneSchema>;

/**
 * Serialize the current world to the standard format with persistent IDs
 */
export function serializeWorld(): SerializedScene {
  const entityManager = EntityManager.getInstance();
  const allEntities = entityManager.getAllEntities();
  const serializedEntities: SerializedEntity[] = [];

  // Build persistent ID map for parent references
  const entityToPersistentId = new Map<EntityId, string>();

  allEntities.forEach((entity) => {
    const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
      entity.id,
      'PersistentId',
    );
    if (persistentIdData) {
      entityToPersistentId.set(entity.id, persistentIdData.id);
    }
  });

  // Serialize each entity
  allEntities.forEach((entity) => {
    const persistentId = entityToPersistentId.get(entity.id);
    if (!persistentId) {
      console.warn(`Entity ${entity.id} missing PersistentId, skipping`);
      return;
    }

    const components: Record<string, unknown> = {};
    const componentIds = componentRegistry.getEntityComponents(entity.id);

    componentIds.forEach((componentId) => {
      // Skip PersistentId from components as it's stored at entity level
      if (componentId === 'PersistentId') return;

      const componentData = componentRegistry.getComponentData(entity.id, componentId);
      if (componentData !== undefined) {
        components[componentId] = componentData;
      }
    });

    const serializedEntity: SerializedEntity = {
      persistentId,
      name: entity.name,
      components,
    };

    // Add parent reference if present
    if (entity.parentId !== undefined && entity.parentId !== null) {
      const parentPersistentId = entityToPersistentId.get(entity.parentId);
      if (parentPersistentId) {
        serializedEntity.parentPersistentId = parentPersistentId;
      }
    }

    serializedEntities.push(serializedEntity);
  });

  return {
    entities: serializedEntities,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Deserialize scene format into the world
 */
export function deserializeIntoWorld(
  scene: SerializedScene,
  clearExisting: boolean = true,
): Map<string, EntityId> {
  const entityManager = EntityManager.getInstance();

  // Clear existing entities if requested
  if (clearExisting) {
    entityManager.clearEntities();
  }

  // Map to track persistent ID to entity ID
  const persistentIdToEntity = new Map<string, EntityId>();

  // First pass: create all entities without hierarchy
  const entityCreationData = new Map<
    string,
    {
      entity: { id: EntityId; name: string };
      parentPersistentId?: string;
      components: Record<string, unknown>;
    }
  >();

  scene.entities.forEach((serializedEntity) => {
    // Create entity
    const entity = entityManager.createEntity(serializedEntity.name || 'Entity');

    // Override the auto-generated PersistentId with the serialized one
    componentRegistry.updateComponent(entity.id, 'PersistentId', {
      id: serializedEntity.persistentId,
    });

    persistentIdToEntity.set(serializedEntity.persistentId, entity.id);
    entityCreationData.set(serializedEntity.persistentId, {
      entity: { id: entity.id, name: entity.name },
      parentPersistentId: serializedEntity.parentPersistentId,
      components: serializedEntity.components,
    });
  });

  // Second pass: set up hierarchy
  entityCreationData.forEach((data, _persistentId) => {
    if (data.parentPersistentId) {
      const parentEntityId = persistentIdToEntity.get(data.parentPersistentId);
      if (parentEntityId !== undefined) {
        // Update parent-child relationship
        const parent = entityManager.getEntity(parentEntityId);
        const child = entityManager.getEntity(data.entity.id);

        if (parent && child) {
          child.parentId = parentEntityId;
          if (!parent.children.includes(data.entity.id)) {
            parent.children.push(data.entity.id);
          }
        }
      }
    }
  });

  // Third pass: add components
  entityCreationData.forEach((data, persistentId) => {
    const entityId = persistentIdToEntity.get(persistentId);
    if (entityId === undefined) return;

    Object.entries(data.components).forEach(([componentId, componentData]) => {
      // Skip if component already exists (like Transform which might be auto-added)
      if (componentRegistry.hasComponent(entityId, componentId)) {
        componentRegistry.updateComponent(entityId, componentId, componentData as Partial<unknown>);
      } else {
        componentRegistry.addComponent(entityId, componentId, componentData);
      }
    });
  });

  return persistentIdToEntity;
}

/**
 * Validate a serialized scene
 */
export function validateSerializedScene(data: unknown): SerializedScene | null {
  try {
    return SerializedSceneSchema.parse(data);
  } catch (error) {
    console.error('Scene validation failed:', error);
    return null;
  }
}

/**
 * Migrate from older scene formats to the current format
 */
export function migrateScene(oldScene: any): SerializedScene | null {
  // Handle legacy scenes without persistent IDs
  if (oldScene && oldScene.entities && Array.isArray(oldScene.entities)) {
    try {
      const entities: SerializedEntity[] = oldScene.entities.map((entity: any) => {
        // Generate persistent ID if missing
        const persistentId =
          entity.persistentId || `legacy-${entity.id || Math.random().toString(36).substr(2, 9)}`;

        return {
          persistentId,
          name: entity.name,
          parentPersistentId: entity.parentId ? `legacy-${entity.parentId}` : undefined,
          components: entity.components || {},
        };
      });

      return {
        entities,
        metadata: {
          timestamp: new Date().toISOString(),
          description: 'Migrated from legacy format',
        },
      };
    } catch (error) {
      console.error('Scene migration failed:', error);
      return null;
    }
  }

  return null;
}
