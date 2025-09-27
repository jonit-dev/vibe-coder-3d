import { create } from 'zustand';

import { EntityManager } from '@core/lib/ecs/EntityManager';

interface IEntityManagerStore {
  entityManager: EntityManager | null;
  setEntityManager: (entityManager: EntityManager) => void;
  reset: () => void;
}

export const createEntityManagerStore = () =>
  create<IEntityManagerStore>((set, get) => ({
    entityManager: null,
    setEntityManager: (entityManager) => set({ entityManager }),
    reset: () => {
      const { entityManager } = get();
      if (entityManager) {
        entityManager.reset();
      }
      set({ entityManager: null });
    },
  }));

export type EntityManagerStore = ReturnType<typeof createEntityManagerStore>;