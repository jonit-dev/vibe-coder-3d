import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

export const useComponentManager = () => {
  return componentRegistry;
};
