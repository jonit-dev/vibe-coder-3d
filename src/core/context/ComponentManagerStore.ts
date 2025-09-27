import { create } from 'zustand';

import { ComponentManager } from '@core/lib/ecs/ComponentManager';

interface IComponentManagerStore {
  componentManager: ComponentManager | null;
  setComponentManager: (componentManager: ComponentManager) => void;
  reset: () => void;
}

export const createComponentManagerStore = () =>
  create<IComponentManagerStore>((set, get) => ({
    componentManager: null,
    setComponentManager: (componentManager) => set({ componentManager }),
    reset: () => {
      const { componentManager } = get();
      if (componentManager) {
        componentManager.reset();
      }
      set({ componentManager: null });
    },
  }));

export type ComponentManagerStore = ReturnType<typeof createComponentManagerStore>;