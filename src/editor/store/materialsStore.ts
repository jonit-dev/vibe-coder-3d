import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { create } from 'zustand';

interface IMaterialsState {
  // Registry instance
  registry: MaterialRegistry;

  // Materials cache for reactivity
  materials: IMaterialDefinition[];

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

  // Internal methods
  _refreshMaterials: () => void;

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

  // Debug helper
  debugPrintMaterials: () => void;
}

export const useMaterialsStore = create<IMaterialsState>((set, get) => {
  // Initialize registry with common test materials if they're missing
  const registry = MaterialRegistry.getInstance();

  // Ensure test materials exist for scene compatibility
  const ensureTestMaterials = () => {
    if (!registry.get('test123')) {
      registry.upsert({
        id: 'test123',
        name: 'Test Material',
        shader: 'standard' as const,
        materialType: 'solid' as const,
        color: '#ff6600',
        metalness: 0.3,
        roughness: 0.6,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
      });
    }

    if (!registry.get('dss')) {
      registry.upsert({
        id: 'dss',
        name: 'dss',
        shader: 'standard' as const,
        materialType: 'texture' as const,
        color: '#cccccc',
        metalness: 0,
        roughness: 0.7,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
        albedoTexture: '/assets/textures/crate-texture.png',
      });
    }
  };

  ensureTestMaterials();

  return {
    get registry() {
      return MaterialRegistry.getInstance();
    },
    materials: registry.list(), // Initialize with current materials including test materials

    selectedMaterialId: null,
    isBrowserOpen: false,
    isCreateOpen: false,
    isInspectorOpen: false,
    searchTerm: '',
    filterByShader: 'all',
    filterByType: 'all',

    _refreshMaterials: () => {
      const registry = MaterialRegistry.getInstance();
      const materials = registry.list();
      set({ materials });
    },

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
      const registry = MaterialRegistry.getInstance();
      registry.upsert(material);
      get()._refreshMaterials(); // Update UI reactively
    },

    updateMaterial: async (materialId, updates) => {
      const registry = MaterialRegistry.getInstance();
      const existing = registry.get(materialId);
      if (!existing) throw new Error(`Material not found: ${materialId}`);

      let updated: IMaterialDefinition = { ...existing, ...updates };

      // When switching from texture to solid, clear texture-specific properties
      if (updates.materialType === 'solid' && existing.materialType === 'texture') {
        updated = {
          ...updated,
          albedoTexture: undefined,
          normalTexture: undefined,
          metallicTexture: undefined,
          roughnessTexture: undefined,
          emissiveTexture: undefined,
          occlusionTexture: undefined,
          // Reset texture transform properties to defaults
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        };
      }

      registry.upsert(updated);
      get()._refreshMaterials(); // Update UI reactively
    },

    deleteMaterial: async (materialId) => {
      if (materialId === 'default') {
        throw new Error('Cannot delete the default material');
      }

      MaterialRegistry.getInstance().remove(materialId);
      get()._refreshMaterials(); // Update UI reactively
    },

    duplicateMaterial: async (materialId) => {
      const registry = MaterialRegistry.getInstance();
      const original = registry.get(materialId);
      if (!original) throw new Error(`Material not found: ${materialId}`);

      const duplicate: IMaterialDefinition = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (Copy)`,
      };

      registry.upsert(duplicate);
      get()._refreshMaterials(); // Update UI reactively

      return duplicate;
    },

    assignToSelection: (materialId) => {
      // This would integrate with the entity selection system
      // For now, just a placeholder
      // Assigning material to selected entities
    },

    assignToAll: (materialId) => {
      // This would assign to all entities with MeshRenderer
      // For now, just a placeholder
      // Assigning material to all entities
    },

    get filteredMaterials() {
      const { searchTerm, filterByShader, filterByType, materials } = get();

      return materials.filter((material) => {
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
      const { selectedMaterialId, materials } = get();
      return selectedMaterialId ? materials.find((m) => m.id === selectedMaterialId) || null : null;
    },

    getFilteredMaterials: () => {
      const { searchTerm, filterByShader, filterByType, materials } = get();

      return materials.filter((material) => {
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
      const { selectedMaterialId, materials } = get();
      return selectedMaterialId ? materials.find((m) => m.id === selectedMaterialId) || null : null;
    },

    debugPrintMaterials: () => {
      const { materials } = get();
      // Materials list tracked internally
    },
  };
});
