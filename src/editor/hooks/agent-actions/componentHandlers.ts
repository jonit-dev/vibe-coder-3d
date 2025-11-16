/**
 * Component CRUD handlers for agent actions
 */

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { getComponentDefaults } from '@core/lib/serialization/defaults/ComponentDefaults';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentActions:Component');

type UpdateComponentFn = <TData>(
  entityId: number,
  componentType: string,
  data: Partial<TData>,
) => boolean;

export const createComponentHandlers = (updateComponent: UpdateComponentFn) => {
  const handleAddComponent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, componentType } = customEvent.detail;

    logger.info('Agent requested add component', { entityId, componentType });

    try {
      const defaults = getComponentDefaults(componentType);
      const componentData = defaults ? { ...defaults } : {};

      componentRegistry.addComponent(entityId, componentType, componentData);
      logger.info('Component added', { entityId, componentType });
    } catch (error) {
      logger.error('Failed to add component', { error, entityId, componentType });
    }
  };

  const handleRemoveComponent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, componentType } = customEvent.detail;

    logger.info('Agent requested remove component', { entityId, componentType });

    try {
      componentRegistry.removeComponent(entityId, componentType);
      logger.info('Component removed', { entityId, componentType });
    } catch (error) {
      logger.error('Failed to remove component', { error, entityId, componentType });
    }
  };

  const handleSetComponentProperty = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, componentType, propertyName, propertyValue } = customEvent.detail;

    logger.info('Agent requested set component property', {
      entityId,
      componentType,
      propertyName,
      propertyValue,
    });

    try {
      updateComponent(entityId, componentType, {
        [propertyName]: propertyValue,
      });
      logger.info('Component property updated', {
        entityId,
        componentType,
        propertyName,
        propertyValue,
      });
    } catch (error) {
      logger.error('Failed to set component property', {
        error,
        entityId,
        componentType,
        propertyName,
      });
    }
  };

  const handleGetComponent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, componentType } = customEvent.detail;

    logger.info('Agent requested get component', { entityId, componentType });

    try {
      const data = componentRegistry.getComponentData(entityId, componentType);
      logger.info('Component data retrieved', { entityId, componentType, data });
    } catch (error) {
      logger.error('Failed to get component', { error, entityId, componentType });
    }
  };

  return {
    handleAddComponent,
    handleRemoveComponent,
    handleSetComponentProperty,
    handleGetComponent,
  };
};
