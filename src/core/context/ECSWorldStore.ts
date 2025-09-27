import { create } from 'zustand';

import { ECSWorld } from '@core/lib/ecs/World';

interface IECSWorldStore {
  world: ECSWorld | null;
  setWorld: (world: ECSWorld) => void;
  reset: () => void;
}

export const createECSWorldStore = () =>
  create<IECSWorldStore>((set, get) => ({
    world: null,
    setWorld: (world) => set({ world }),
    reset: () => {
      const { world } = get();
      if (world) {
        world.reset();
      }
      set({ world: null });
    },
  }));

export type ECSWorldStore = ReturnType<typeof createECSWorldStore>;