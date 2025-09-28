import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { create } from 'zustand';

interface IMaterialsState {
  // Registry instance
  registry: MaterialRegistry;

  // Current selection
  selectedMaterialId: string | null;

  // Modal states
  isBrowserOpen: boolean;
  isCreateOpen: boolean;
  isInspectorOpen: boolean;

  // Search and filters
  searchTerm: string;
  filterByShader: 'all' | 'standard' | 'unlit';
  filterByType: 'all' | 'solid' | 'texture';

  // Actions
  setSelectedMaterial: (materialId: string | null) => void;
  openBrowser: () => void;
  closeBrowser: () => void;
  openCreate: () => void;
  closeCreate: () => void;
  openInspector: (materialId?: string) => void;
  closeInspector: () => void;
  setSearchTerm: (term: string) => void;
  setFilterByShader: (filter: 'all' | 'standard' | 'unlit') => void;
  setFilterByType: (filter: 'all' | 'solid' | 'texture') => void;

  // Material operations
  createMaterial: (material: IMaterialDefinition) => Promise<void>;
  updateMaterial: (materialId: string, updates: Partial<IMaterialDefinition>) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;
  duplicateMaterial: (materialId: string) => Promise<IMaterialDefinition>;

  // Bulk operations
  assignToSelection: (materialId: string) => void;
  assignToAll: (materialId: string) => void;

  // Selector functions for computed properties
  getFilteredMaterials: () => IMaterialDefinition[];
  getSelectedMaterial: () => IMaterialDefinition | null | undefined;
}

export const useMaterialsStore = create<IMaterialsState>((set, get) => {
  const registry = MaterialRegistry.getInstance();

  return {
    registry,

    selectedMaterialId: null,
    isBrowserOpen: false,
    isCreateOpen: false,
    isInspectorOpen: false,
    searchTerm: '',
    filterByShader: 'all',
    filterByType: 'all',

    setSelectedMaterial: (materialId) => set({ selectedMaterialId: materialId }),

    openBrowser: () => set({ isBrowserOpen: true }),
    closeBrowser: () => set({ isBrowserOpen: false }),
    openCreate: () => set({ isCreateOpen: true }),
    closeCreate: () => set({ isCreateOpen: false }),
    openInspector: (materialId) =>
      set({
        isInspectorOpen: true,
        selectedMaterialId: materialId || get().selectedMaterialId,
      }),
    closeInspector: () => set({ isInspectorOpen: false }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setFilterByShader: (filter) => set({ filterByShader: filter }),
    setFilterByType: (filter) => set({ filterByType: filter }),

    createMaterial: async (material) => {
      registry.upsert(material);
      await registry.saveToAsset(material);
    },

    updateMaterial: async (materialId, updates) => {
      const existing = registry.get(materialId);
      if (!existing) throw new Error(`Material not found: ${materialId}`);

      const updated: IMaterialDefinition = { ...existing, ...updates };
      registry.upsert(updated);
      await registry.saveToAsset(updated);
    },

    deleteMaterial: async (materialId) => {
      if (materialId === 'default') {
        throw new Error('Cannot delete the default material');
      }

      registry.remove(materialId);
    },

    duplicateMaterial: async (materialId) => {
      const original = registry.get(materialId);
      if (!original) throw new Error(`Material not found: ${materialId}`);

      const duplicate: IMaterialDefinition = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (Copy)`,
      };

      registry.upsert(duplicate);
      await registry.saveToAsset(duplicate);

      return duplicate;
    },

    assignToSelection: (materialId) => {
      // This would integrate with the entity selection system
      // For now, just a placeholder
      console.log(`Assign material ${materialId} to selected entities`);
    },

    assignToAll: (materialId) => {
      // This would assign to all entities with MeshRenderer
      // For now, just a placeholder
      console.log(`Assign material ${materialId} to all entities`);
    },

    get filteredMaterials() {
      const { searchTerm, filterByShader, filterByType, registry } = get();

      return registry.list().filter((material) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !material.name.toLowerCase().includes(searchLower) &&
            !material.id.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Shader filter
        if (filterByShader !== 'all' && material.shader !== filterByShader) {
          return false;
        }

        // Type filter
        if (filterByType !== 'all' && material.materialType !== filterByType) {
          return false;
        }

        return true;
      });
    },

    get selectedMaterial() {
      const { selectedMaterialId, registry } = get();
      return selectedMaterialId ? registry.get(selectedMaterialId) : null;
    },

    getFilteredMaterials: () => {
      const { searchTerm, filterByShader, filterByType, registry } = get();

      return registry.list().filter((material) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !material.name.toLowerCase().includes(searchLower) &&
            !material.id.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Shader filter
        if (filterByShader !== 'all' && material.shader !== filterByShader) {
          return false;
        }

        // Type filter
        if (filterByType !== 'all' && material.materialType !== filterByType) {
          return false;
        }

        return true;
      });
    },

    getSelectedMaterial: () => {
      const { selectedMaterialId, registry } = get();
      return selectedMaterialId ? registry.get(selectedMaterialId) : null;
    },
  };
});
