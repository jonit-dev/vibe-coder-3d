/**
 * GameObject API implementation
 * Provides runtime CRUD operations for entities and models
 */

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { EntityId } from '@/core/lib/ecs/types';
import { createPrimitiveFactory } from '../factories/PrimitiveFactory';
import { createModelFactory } from '../factories/ModelFactory';
import {
  IPrimitiveOptions,
  IModelOptions,
  ICloneOverrides,
  PrimitiveKind,
  IComponentAttachment,
  CloneOverridesSchema,
  ComponentAttachmentSchema,
} from '../factories/crud.types';
import { PlaySessionTracker } from '../adapters/PlaySessionTracker';

const logger = Logger.create('GameObjectAPI');

/**
 * GameObject API for runtime entity CRUD operations
 */
export interface IGameObjectAPI {
  createEntity: (name?: string, parent?: number) => number;
  createPrimitive: (kind: PrimitiveKind, options?: IPrimitiveOptions) => number;
  createModel: (model: string, options?: IModelOptions) => number;
  clone: (source: number, overrides?: Partial<ICloneOverrides>) => number;
  attachComponents: (entityId: number, components: Array<IComponentAttachment>) => void;
  setParent: (entityId: number, parent?: number) => void;
  setActive: (entityId: number, active: boolean) => void;
  destroy: (target?: number) => void;
}

export function createGameObjectAPI(currentEntityId: EntityId): IGameObjectAPI {
  const entityManager = EntityManager.getInstance();
  const primitiveFactory = createPrimitiveFactory();
  const modelFactory = createModelFactory();
  const playTracker = PlaySessionTracker.getInstance();

  return {
    createEntity: (name?: string, parent?: number): number => {
      try {
        const entityName = name || 'Entity';
        const entity = entityManager.createEntity(entityName, parent);

        // Add default Transform component
        componentRegistry.addComponent(entity.id, 'Transform', {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });

        // Track if in play mode
        if (playTracker.isInPlayMode()) {
          playTracker.markCreated(entity.id);
        }

        logger.info('Entity created', { entityId: entity.id, name: entityName, parent });
        return entity.id;
      } catch (error) {
        logger.error('Failed to create entity', { name, parent, error });
        throw new Error(`Failed to create entity: ${error}`);
      }
    },

    createPrimitive: (kind: PrimitiveKind, options?: IPrimitiveOptions): number => {
      try {
        return primitiveFactory.create(kind, options);
      } catch (error) {
        logger.error('Failed to create primitive', { kind, options, error });
        throw new Error(`Failed to create primitive ${kind}: ${error}`);
      }
    },

    createModel: (model: string, options?: IModelOptions): number => {
      try {
        return modelFactory.create(model, options);
      } catch (error) {
        logger.error('Failed to create model', { model, options, error });
        throw new Error(`Failed to create model ${model}: ${error}`);
      }
    },

    clone: (source: number, overrides?: Partial<ICloneOverrides>): number => {
      try {
        // Validate overrides
        const validatedOverrides = overrides
          ? CloneOverridesSchema.partial().parse(overrides)
          : {};

        // Check source entity exists
        const sourceEntity = entityManager.getEntity(source);
        if (!sourceEntity) {
          throw new Error(`Source entity ${source} not found`);
        }

        // Create new entity with same name (or override)
        const newName = validatedOverrides.name || `${sourceEntity.name}_clone`;
        const newParent = validatedOverrides.parent ?? sourceEntity.parentId;
        const newEntity = entityManager.createEntity(newName, newParent);

        // Track if in play mode
        if (playTracker.isInPlayMode()) {
          playTracker.markCreated(newEntity.id);
        }

        // Get all components from source entity
        const sourceComponents = componentRegistry.getEntityComponents(source);

        // Clone each component
        for (const componentType of sourceComponents) {
          // Skip PersistentId - it will be auto-generated for the new entity
          if (componentType === 'PersistentId') {
            continue;
          }

          const componentData = componentRegistry.getComponentData(source, componentType);
          if (componentData) {
            // For Transform, apply overrides if provided
            if (componentType === 'Transform' && validatedOverrides.transform) {
              const transform = validatedOverrides.transform;
              const clonedData = { ...componentData } as Record<string, unknown>;

              if (transform.position) {
                clonedData.position = transform.position;
              }
              if (transform.rotation) {
                clonedData.rotation = transform.rotation;
              }
              if (transform.scale) {
                if (typeof transform.scale === 'number') {
                  clonedData.scale = [transform.scale, transform.scale, transform.scale];
                } else {
                  clonedData.scale = transform.scale;
                }
              }

              componentRegistry.addComponent(newEntity.id, componentType, clonedData);
            } else {
              // Deep clone component data
              const clonedData = JSON.parse(JSON.stringify(componentData));
              componentRegistry.addComponent(newEntity.id, componentType, clonedData);
            }
          }
        }

        logger.info('Entity cloned', {
          sourceId: source,
          newId: newEntity.id,
          name: newName,
          componentsCloned: sourceComponents.length,
        });

        return newEntity.id;
      } catch (error) {
        logger.error('Failed to clone entity', { source, overrides, error });
        throw new Error(`Failed to clone entity ${source}: ${error}`);
      }
    },

    attachComponents: (entityId: number, components: Array<IComponentAttachment>): void => {
      try {
        // Check entity exists
        const entity = entityManager.getEntity(entityId);
        if (!entity) {
          throw new Error(`Entity ${entityId} not found`);
        }

        // Validate each component attachment
        const validatedComponents = components.map((comp) =>
          ComponentAttachmentSchema.parse(comp)
        );

        // Attach each component
        for (const comp of validatedComponents) {
          componentRegistry.addComponent(entityId, comp.type, comp.data);
          logger.debug('Component attached', {
            entityId,
            componentType: comp.type,
          });
        }

        logger.info('Components attached', {
          entityId,
          count: validatedComponents.length,
        });
      } catch (error) {
        logger.error('Failed to attach components', { entityId, components, error });
        throw new Error(`Failed to attach components to entity ${entityId}: ${error}`);
      }
    },

    setParent: (entityId: number, parent?: number): void => {
      try {
        const success = entityManager.setParent(entityId, parent);
        if (!success) {
          throw new Error('Failed to set parent (circular dependency or invalid entity)');
        }
        logger.debug('Parent set', { entityId, parent });
      } catch (error) {
        logger.error('Failed to set parent', { entityId, parent, error });
        throw new Error(`Failed to set parent for entity ${entityId}: ${error}`);
      }
    },

    setActive: (entityId: number, active: boolean): void => {
      try {
        // Check entity exists
        const entity = entityManager.getEntity(entityId);
        if (!entity) {
          throw new Error(`Entity ${entityId} not found`);
        }

        // Add or update Active component
        if (componentRegistry.hasComponent(entityId, 'Active')) {
          componentRegistry.updateComponent(entityId, 'Active', { active });
        } else {
          componentRegistry.addComponent(entityId, 'Active', { active });
        }

        logger.debug('Active state set', { entityId, active });
      } catch (error) {
        logger.error('Failed to set active state', { entityId, active, error });
        // Log warning but don't throw - this is a non-critical operation
        logger.warn('setActive operation failed, continuing', { entityId, active });
      }
    },

    destroy: (target?: number): void => {
      try {
        const entityId = target ?? currentEntityId;

        // Check entity exists
        const entity = entityManager.getEntity(entityId);
        if (!entity) {
          logger.warn('Attempted to destroy non-existent entity', { entityId });
          return;
        }

        // Remove from play tracker if tracked
        if (playTracker.wasCreatedDuringPlay(entityId)) {
          playTracker.untrack(entityId);
        }

        // Delete the entity
        const success = entityManager.deleteEntity(entityId);
        if (success) {
          logger.info('Entity destroyed', { entityId, name: entity.name });
        } else {
          logger.warn('Failed to destroy entity', { entityId });
        }
      } catch (error) {
        logger.error('Failed to destroy entity', { target, error });
        throw new Error(`Failed to destroy entity: ${error}`);
      }
    },
  };
}
