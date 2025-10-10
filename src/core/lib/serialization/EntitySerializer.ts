import { Logger } from '@core/lib/logger';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const logger = Logger.create('EntitySerializer');

/**
 * Serialized entity structure
 */
export interface ISerializedEntity {
  id: number;
  name: string;
  parentId?: number | null;
  components: Record<string, unknown>;
}

const SerializedEntitySchema = z.object({
  id: z.union([z.number(), z.string()]).optional(), // Optional - auto-generated if not provided
  name: z.string(),
  parentId: z.union([z.number(), z.string()]).optional().nullable(),
  components: z.record(z.unknown()),
});

/**
 * Entity manager adapter interface
 */
export interface IEntityManagerAdapter {
  getAllEntities(): Array<{ id: number; name: string; parentId?: number | null }>;
  clearEntities(): void;
  createEntity(name: string, parentId?: number | null, persistentId?: string): { id: number };
  setParent(childId: number, parentId?: number | null): void;
}

/**
 * Component manager adapter interface
 */
export interface IComponentManagerAdapter {
  getComponentsForEntity(entityId: number): Array<{ type: string; data: unknown }>;
  addComponent(entityId: number, componentType: string, data: unknown): void;
}

/**
 * Entity Serialization Service
 * Single responsibility: Serialize and deserialize entities with their components
 */
export class EntitySerializer {
  /**
   * Serialize entities with their components
   */
  serialize(
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
  ): ISerializedEntity[] {
    const entities = entityManager.getAllEntities();
    const serialized: ISerializedEntity[] = [];

    for (const entity of entities) {
      const components = componentManager.getComponentsForEntity(entity.id);
      const componentData: Record<string, unknown> = {};

      for (const component of components) {
        if (component.data) {
          componentData[component.type] = component.data;
        }
      }

      serialized.push({
        id: entity.id,
        name: entity.name,
        parentId: entity.parentId,
        components: componentData,
      });
    }

    logger.debug('Serialized entities', { count: serialized.length });
    return serialized;
  }

  /**
   * Deserialize entities with their components
   * Two-pass approach:
   * 1. Create all entities with components
   * 2. Establish parent-child relationships
   */
  deserialize(
    entities: unknown[],
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
  ): void {
    // Clear existing entities
    entityManager.clearEntities();

    // First pass: Create entities and add components
    const idMap = new Map<number | string, number>();
    let successCount = 0;
    let errorCount = 0;
    let autoIdCounter = 0;

    for (let index = 0; index < entities.length; index++) {
      const entityData = entities[index];
      try {
        const validated = SerializedEntitySchema.parse(entityData);

        // Auto-generate entity ID if not provided (use array index)
        const entityId = validated.id ?? autoIdCounter++;

        // Extract PersistentId if present, or auto-generate UUID
        const persistentIdData = validated.components.PersistentId as { id?: string } | undefined;
        const persistentId = persistentIdData?.id || uuidv4();

        // Log auto-generated IDs for debugging
        if (!persistentIdData?.id) {
          logger.debug('Auto-generated PersistentId for entity', {
            name: validated.name,
            id: persistentId,
          });
        }

        // Create entity without parent
        const created = entityManager.createEntity(validated.name, undefined, persistentId);
        idMap.set(entityId, created.id);

        // Add all components except PersistentId (already handled)
        for (const [componentType, componentData] of Object.entries(validated.components)) {
          if (componentType === 'PersistentId' || !componentData) continue;

          try {
            componentManager.addComponent(created.id, componentType, componentData);
          } catch (error) {
            logger.error('Failed to add component', {
              entityId: created.id,
              componentType,
              error,
            });
          }
        }

        successCount++;
      } catch (error) {
        logger.error('Failed to deserialize entity', { error, entityData });
        errorCount++;
      }
    }

    // Second pass: Establish parent relationships
    autoIdCounter = 0; // Reset counter for second pass
    for (let index = 0; index < entities.length; index++) {
      const entityData = entities[index];
      try {
        const validated = SerializedEntitySchema.parse(entityData);
        if (validated.parentId === undefined || validated.parentId === null) continue;

        // Auto-generate entity ID if not provided (must match first pass)
        const entityId = validated.id ?? autoIdCounter++;

        const childId = idMap.get(entityId);
        const parentId = idMap.get(validated.parentId);

        if (childId !== undefined && parentId !== undefined) {
          entityManager.setParent(childId, parentId);
        } else {
          logger.warn('Failed to establish parent relationship', {
            childId: entityId,
            parentId: validated.parentId,
            resolvedChild: childId,
            resolvedParent: parentId,
          });
        }
      } catch (error) {
        logger.error('Failed to set parent', { error, entityData });
      }

      // Increment counter even if entity has explicit ID to keep in sync
      if (entityData && typeof entityData === 'object' && 'id' in entityData === false) {
        autoIdCounter++;
      }
    }

    logger.info('Deserialized entities', {
      total: entities.length,
      success: successCount,
      errors: errorCount,
    });
  }

  /**
   * Validate entity data structure
   */
  validate(entityData: unknown): { isValid: boolean; error?: string } {
    try {
      SerializedEntitySchema.parse(entityData);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors.map((e) => e.message).join(', ') };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  }
}
