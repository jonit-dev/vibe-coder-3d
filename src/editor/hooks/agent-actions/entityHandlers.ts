/**
 * Entity lifecycle handlers for agent actions
 */

import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentActions:Entity');

export const createEntityHandlers = () => {
  const handleRenameEntity = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, name } = customEvent.detail;

    logger.info('Agent requested entity rename', { entityId, name });

    try {
      const entityManager = EntityManager.getInstance();
      const entity = entityManager.getEntity(entityId);
      if (entity) {
        entity.name = name;
        logger.info('Entity renamed', { entityId, name });
      } else {
        logger.warn('Entity not found for rename', { entityId });
      }
    } catch (error) {
      logger.error('Failed to rename entity', { error, entityId });
    }
  };

  const handleDeleteEntity = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId } = customEvent.detail;

    logger.info('Agent requested entity deletion', { entityId });

    try {
      const entityManager = EntityManager.getInstance();
      entityManager.deleteEntity(entityId);
      logger.info('Entity deleted', { entityId });
    } catch (error) {
      logger.error('Failed to delete entity', { error, entityId });
    }
  };

  const handleDuplicateEntity = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId } = customEvent.detail;

    logger.info('Agent requested entity duplication', { entityId });

    try {
      const entityManager = EntityManager.getInstance();
      const entity = entityManager.getEntity(entityId);
      if (!entity) {
        logger.warn('Entity not found for duplication', { entityId });
        return;
      }

      const newEntity = entityManager.createEntity(`${entity.name} (Copy)`);

      const components = componentRegistry.getEntityComponents(entityId);
      for (const [componentType, componentData] of Object.entries(components)) {
        componentRegistry.addComponent(newEntity.id, componentType, componentData);
      }

      if (entity.parentId !== undefined) {
        entityManager.setParent(newEntity.id, entity.parentId);
      }

      logger.info('Entity duplicated', { originalId: entityId, newId: newEntity.id });
    } catch (error) {
      logger.error('Failed to duplicate entity', { error, entityId });
    }
  };

  const handleSetParent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, parentId } = customEvent.detail;

    logger.info('Agent requested set parent', { entityId, parentId });

    try {
      const entityManager = EntityManager.getInstance();
      entityManager.setParent(entityId, parentId);
      logger.info('Entity parent updated', { entityId, parentId });
    } catch (error) {
      logger.error('Failed to set parent', { error, entityId, parentId });
    }
  };

  const handleSetEnabled = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, enabled } = customEvent.detail;

    logger.info('Agent requested set enabled', { entityId, enabled });

    try {
      if (!componentRegistry.hasComponent(entityId, 'Enabled')) {
        componentRegistry.addComponent(entityId, 'Enabled', { enabled });
      } else {
        componentRegistry.updateComponent(entityId, 'Enabled', { enabled });
      }
      logger.info('Entity enabled state updated', { entityId, enabled });
    } catch (error) {
      logger.error('Failed to set enabled state', { error, entityId, enabled });
    }
  };

  return {
    handleRenameEntity,
    handleDeleteEntity,
    handleDuplicateEntity,
    handleSetParent,
    handleSetEnabled,
  };
};
