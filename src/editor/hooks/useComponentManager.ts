import { ComponentManager } from '@/core/lib/ecs/ComponentManager';

export const useComponentManager = () => {
  return ComponentManager.getInstance();
};
