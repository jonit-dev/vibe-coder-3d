import { EntityManager } from '@/editor/lib/ecs/EntityManager';

export const useEntityManager = () => {
  return EntityManager.getInstance();
};
