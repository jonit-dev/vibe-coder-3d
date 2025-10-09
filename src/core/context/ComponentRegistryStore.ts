import { create } from 'zustand';

import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';

interface IComponentRegistryStore {
  componentRegistry: ComponentRegistry | null;
  setComponentRegistry: (componentRegistry: ComponentRegistry) => void;
  reset: () => void;
}

export const createComponentRegistryStore = () =>
  create<IComponentRegistryStore>((set, get) => ({
    componentRegistry: null,
    setComponentRegistry: (componentRegistry) => set({ componentRegistry }),
    reset: () => {
      const { componentRegistry } = get();
      if (componentRegistry) {
        componentRegistry.reset();
      }
      set({ componentRegistry: null });
    },
  }));

export type ComponentRegistryStore = ReturnType<typeof createComponentRegistryStore>;
