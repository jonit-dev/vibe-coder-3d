import { EntityManager } from '@/core/lib/ecs/EntityManager';

export const useEntityManager = () => {
  return EntityManager.getInstance();
};
