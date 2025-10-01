import type { IPrefabDefinition } from '@/core/prefabs/Prefab.types';
import { PrefabRegistry } from '@/core/prefabs/PrefabRegistry';
import { create } from 'zustand';

interface IPrefabsState {
  // Registry instance
  registry: PrefabRegistry;

  // Prefabs cache for reactivity
  prefabs: IPrefabDefinition[];

  // Current selection
  selectedPrefabId: string | null;

  // Modal states
  isBrowserOpen: boolean;
  isCreateOpen: boolean;
  isInspectorOpen: boolean;

  // Search and filters
  searchTerm: string;
  filterByTag: string[];

  // Internal methods
  _refreshPrefabs: () => void;

  // Actions
  setSelectedPrefab: (prefabId: string | null) => void;
  openBrowser: () => void;
  closeBrowser: () => void;
  openCreate: () => void;
  closeCreate: () => void;
  openInspector: (prefabId?: string) => void;
  closeInspector: () => void;
  setSearchTerm: (term: string) => void;
  setFilterByTag: (tags: string[]) => void;

  // Prefab operations
  createPrefab: (prefab: IPrefabDefinition) => Promise<void>;
  updatePrefab: (prefabId: string, updates: Partial<IPrefabDefinition>) => Promise<void>;
  deletePrefab: (prefabId: string) => Promise<void>;
  duplicatePrefab: (prefabId: string) => Promise<IPrefabDefinition>;

  // Selector functions for computed properties
  getFilteredPrefabs: () => IPrefabDefinition[];
  getSelectedPrefab: () => IPrefabDefinition | null | undefined;
}

export const usePrefabsStore = create<IPrefabsState>((set, get) => {
  const registry = PrefabRegistry.getInstance();
  const initialPrefabs = registry.list();
  console.log('[PrefabsStore] Initializing store with prefabs:', initialPrefabs.length);

  return {
    get registry() {
      return PrefabRegistry.getInstance();
    },
    prefabs: initialPrefabs,

    selectedPrefabId: null,
    isBrowserOpen: false,
    isCreateOpen: false,
    isInspectorOpen: false,
    searchTerm: '',
    filterByTag: [],

    _refreshPrefabs: () => {
      const registry = PrefabRegistry.getInstance();
      const prefabs = registry.list();
      set({ prefabs });
    },

    setSelectedPrefab: (prefabId) => set({ selectedPrefabId: prefabId }),

    openBrowser: () => set({ isBrowserOpen: true }),
    closeBrowser: () => set({ isBrowserOpen: false }),
    openCreate: () => set({ isCreateOpen: true }),
    closeCreate: () => set({ isCreateOpen: false }),
    openInspector: (prefabId) =>
      set({
        isInspectorOpen: true,
        selectedPrefabId: prefabId || get().selectedPrefabId,
      }),
    closeInspector: () => set({ isInspectorOpen: false }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setFilterByTag: (tags) => set({ filterByTag: tags }),

    createPrefab: async (prefab) => {
      const registry = PrefabRegistry.getInstance();
      registry.upsert(prefab);
      get()._refreshPrefabs();
    },

    updatePrefab: async (prefabId, updates) => {
      const registry = PrefabRegistry.getInstance();
      const existing = registry.get(prefabId);
      if (!existing) throw new Error(`Prefab not found: ${prefabId}`);

      const updated: IPrefabDefinition = { ...existing, ...updates };
      registry.upsert(updated);
      get()._refreshPrefabs();
    },

    deletePrefab: async (prefabId) => {
      PrefabRegistry.getInstance().remove(prefabId);
      get()._refreshPrefabs();
    },

    duplicatePrefab: async (prefabId) => {
      const registry = PrefabRegistry.getInstance();
      const original = registry.get(prefabId);
      if (!original) throw new Error(`Prefab not found: ${prefabId}`);

      const duplicate: IPrefabDefinition = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (Copy)`,
      };

      registry.upsert(duplicate);
      get()._refreshPrefabs();

      return duplicate;
    },

    get filteredPrefabs() {
      const { searchTerm, filterByTag, prefabs } = get();

      if (!prefabs) return [];

      return prefabs.filter((prefab) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !prefab.name.toLowerCase().includes(searchLower) &&
            !prefab.id.toLowerCase().includes(searchLower) &&
            !(prefab.description || '').toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Tag filter
        if (filterByTag.length > 0) {
          if (!prefab.tags || prefab.tags.length === 0) {
            return false;
          }
          if (!filterByTag.some((tag) => prefab.tags?.includes(tag))) {
            return false;
          }
        }

        return true;
      });
    },

    get selectedPrefab() {
      const { selectedPrefabId, prefabs } = get();
      return selectedPrefabId ? prefabs.find((p) => p.id === selectedPrefabId) || null : null;
    },

    getFilteredPrefabs: () => {
      const { searchTerm, filterByTag, prefabs } = get();

      return prefabs.filter((prefab) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !prefab.name.toLowerCase().includes(searchLower) &&
            !prefab.id.toLowerCase().includes(searchLower) &&
            !(prefab.description || '').toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Tag filter
        if (filterByTag.length > 0) {
          if (!prefab.tags || prefab.tags.length === 0) {
            return false;
          }
          if (!filterByTag.some((tag) => prefab.tags?.includes(tag))) {
            return false;
          }
        }

        return true;
      });
    },

    getSelectedPrefab: () => {
      const { selectedPrefabId, prefabs } = get();
      return selectedPrefabId ? prefabs.find((p) => p.id === selectedPrefabId) || null : null;
    },
  };
});
