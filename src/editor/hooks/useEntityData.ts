import { useCallback } from 'react';

import { useComponentManager } from './useComponentManager';

export const useEntityData = () => {
  const componentManager = useComponentManager();

  const getComponentData = useCallback(
    (entityId: number, componentType: string) => {
      const component = componentManager.getComponent(entityId, componentType);
      return component?.data || null;
    },
    [componentManager],
  );

  const updateComponentData = useCallback(
    (entityId: number, componentType: string, data: unknown) => {
      const currentComponent = componentManager.getComponent(entityId, componentType);
      if (currentComponent) {
        componentManager.updateComponent(entityId, componentType, data);
      } else {
        componentManager.addComponent(entityId, componentType, data);
      }
    },
    [componentManager],
  );

  return {
    getComponentData,
    updateComponentData,
  };
};
