/**
 * Transform component handlers for agent actions
 */

import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentActions:Transform');

type UpdateComponentFn = <TData>(
  entityId: number,
  componentType: string,
  data: Partial<TData>,
) => boolean;

export const createTransformHandlers = (updateComponent: UpdateComponentFn) => {
  const handleSetPosition = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, position } = customEvent.detail;

    logger.info('Agent requested position change', { entityId, position });

    try {
      updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        position: [position.x, position.y, position.z],
      });
      logger.info('Entity position updated', { entityId, position });
    } catch (error) {
      logger.error('Failed to set position', { error, entityId });
    }
  };

  const handleSetRotation = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, rotation } = customEvent.detail;

    logger.info('Agent requested rotation change', { entityId, rotation });

    try {
      updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        rotation: [rotation.x, rotation.y, rotation.z],
      });
      logger.info('Entity rotation updated', { entityId, rotation });
    } catch (error) {
      logger.error('Failed to set rotation', { error, entityId });
    }
  };

  const handleSetScale = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId, scale } = customEvent.detail;

    logger.info('Agent requested scale change', { entityId, scale });

    try {
      updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        scale: [scale.x, scale.y, scale.z],
      });
      logger.info('Entity scale updated', { entityId, scale });
    } catch (error) {
      logger.error('Failed to set scale', { error, entityId });
    }
  };

  return {
    handleSetPosition,
    handleSetRotation,
    handleSetScale,
  };
};
