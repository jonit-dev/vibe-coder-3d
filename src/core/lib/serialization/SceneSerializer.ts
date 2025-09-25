/**
 * Scene Serializer - Unified serialization for runtime and editor
 * Handles entity hierarchy with stable PersistentId references
 * Replaces the legacy serialization with proper entity identity tracking
 */

import { componentRegistry } from '../ecs/ComponentRegistry';
import { EntityManager } from '../ecs/EntityManager';
import { EntityId } from '../ecs/types';
import {
  SerializedScene,
  SerializedEntity,
  SerializedSceneSchema,
} from '../scene/serialization/SceneSchema';

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
 * Deserialize scene format into the world with comprehensive validation
 */
export function deserializeIntoWorld(
  scene: SerializedScene,
  clearExisting: boolean = true,
): Map<string, EntityId> {
  const entityManager = EntityManager.getInstance();

  // Validate scene structure first
  const validationErrors = validateSceneForImport(scene);
  if (validationErrors.length > 0) {
    throw new Error(
      `Scene import validation failed:\n${validationErrors.join('\n')}`
    );
  }

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
    try {
      // Create entity with specific persistent ID to prevent auto-generation conflicts
      const entity = entityManager.createEntity(
        serializedEntity.name || 'Entity',
        undefined,
        serializedEntity.persistentId
      );

      persistentIdToEntity.set(serializedEntity.persistentId, entity.id);
      entityCreationData.set(serializedEntity.persistentId, {
        entity: { id: entity.id, name: entity.name },
        parentPersistentId: serializedEntity.parentPersistentId,
        components: serializedEntity.components,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to create entity with PersistentId "${serializedEntity.persistentId}": ${errorMessage}`
      );
    }
  });

  // Second pass: set up hierarchy
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Comprehensive scene validation for import operations
 * Checks for duplicate persistent IDs, circular parent references, and orphaned entities
 */
export function validateSceneForImport(scene: SerializedScene): string[] {
  const errors: string[] = [];

  // 1. Validate schema structure
  try {
    SerializedSceneSchema.parse(scene);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Schema validation failed: ${errorMessage}`);
    return errors; // Return early if schema is invalid
  }

  const persistentIds = new Set<string>();
  const entityNames = new Map<string, string[]>(); // name -> persistentIds with that name

  // 2. Check for duplicate persistent IDs and collect entity info
  scene.entities.forEach((entity) => {
    // Check for duplicate persistent IDs
    if (persistentIds.has(entity.persistentId)) {
      errors.push(`Duplicate persistent ID: "${entity.persistentId}"`);
    }
    persistentIds.add(entity.persistentId);

    // Collect entity names for duplicate checking
    const name = entity.name || 'Entity';
    if (!entityNames.has(name)) {
      entityNames.set(name, []);
    }
    entityNames.get(name)!.push(entity.persistentId);
  });

  // 3. Check for orphaned parent references
  scene.entities.forEach((entity) => {
    if (entity.parentPersistentId) {
      if (!persistentIds.has(entity.parentPersistentId)) {
        errors.push(
          `Entity "${entity.persistentId}" references non-existent parent "${entity.parentPersistentId}"`
        );
      }
    }
  });

  // 4. Check for circular parent-child relationships
  const visitedInCycle = new Set<string>();
  const currentPath = new Set<string>();

  function checkForCircularRef(persistentId: string): boolean {
    if (currentPath.has(persistentId)) {
      return true; // Found a cycle
    }
    if (visitedInCycle.has(persistentId)) {
      return false; // Already checked this subtree
    }

    const entity = scene.entities.find(e => e.persistentId === persistentId);
    if (!entity || !entity.parentPersistentId) {
      visitedInCycle.add(persistentId);
      return false;
    }

    currentPath.add(persistentId);
    const hasCycle = checkForCircularRef(entity.parentPersistentId);
    currentPath.delete(persistentId);
    visitedInCycle.add(persistentId);

    return hasCycle;
  }

  scene.entities.forEach((entity) => {
    if (!visitedInCycle.has(entity.persistentId)) {
      if (checkForCircularRef(entity.persistentId)) {
        errors.push(
          `Circular parent-child relationship detected involving entity "${entity.persistentId}"`
        );
      }
    }
  });

  // 5. Warn about duplicate entity names (not an error, but worth noting)
  entityNames.forEach((persistentIds, name) => {
    if (persistentIds.length > 1) {
      console.warn(
        `Multiple entities with name "${name}": ${persistentIds.join(', ')}`
      );
    }
  });

  // 6. Validate entity counts
  if (scene.entities.length === 0) {
    console.warn('Scene contains no entities');
  } else if (scene.entities.length > 10000) {
    errors.push(
      `Scene contains too many entities (${scene.entities.length}). Maximum recommended: 10000`
    );
  }

  // 7. Check for required components (if any business rules exist)
  scene.entities.forEach((entity) => {
    // Example: Check if entities have required Transform component
    if (!entity.components.Transform && entity.persistentId !== 'root') {
      console.warn(
        `Entity "${entity.persistentId}" (${entity.name || 'unnamed'}) lacks Transform component`
      );
    }
  });

  return errors;
}

/**
 * Migrate from older scene formats to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateScene(oldScene: any): SerializedScene | null {
  // Handle legacy scenes without persistent IDs
  if (oldScene && oldScene.entities && Array.isArray(oldScene.entities)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
