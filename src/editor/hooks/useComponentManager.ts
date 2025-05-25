import { ComponentManager } from '@/editor/lib/ecs/ComponentManager';

export const useComponentManager = () => {
  return ComponentManager.getInstance();
};
