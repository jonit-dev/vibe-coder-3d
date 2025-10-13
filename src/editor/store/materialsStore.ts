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
  getMaterialById: (id: string) => IMaterialDefinition | undefined;

  // Debug helper
  debugPrintMaterials: () => void;
}

export const useMaterialsStore = create<IMaterialsState>((set, get) => {
  // Initialize registry and load library materials
  const registry = MaterialRegistry.getInstance();

  // Load materials from external library files
  const loadLibraryMaterials = async () => {
    try {
      const { BrowserAssetLoader } = await import(
        '@/core/lib/serialization/assets/BrowserAssetLoader'
      );
      const loader = new BrowserAssetLoader();
      const libraryMaterials = await loader.loadMaterials();

      // Upsert all library materials into registry
      libraryMaterials.forEach((material) => {
        registry.upsert(material);
      });

      // Refresh store to reflect loaded materials
      get()._refreshMaterials();
    } catch (error) {
      console.error('Failed to load library materials:', error);
    }
  };

  // Trigger load in background
  loadLibraryMaterials();

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

    assignToSelection: async (materialId) => {
      // Import componentRegistry dynamically to avoid circular deps
      const { componentRegistry } = await import('@/core/lib/ecs/ComponentRegistry');
      const { useEditorStore } = await import('@/editor/store/editorStore');

      const selectedIds = useEditorStore.getState().selectedIds;
      if (selectedIds.length === 0) return;

      // Update materialId for all selected entities with MeshRenderer
      selectedIds.forEach((entityId: number) => {
        const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer');
        if (meshRenderer) {
          componentRegistry.updateComponent(entityId, 'MeshRenderer', {
            ...meshRenderer,
            materialId,
            material: undefined, // Clear overrides when assigning new material
          });
        }
      });

      get()._refreshMaterials();
    },

    assignToAll: async (materialId) => {
      // Import componentRegistry dynamically to avoid circular deps
      const { componentRegistry } = await import('@/core/lib/ecs/ComponentRegistry');
      const { ECSWorld } = await import('@/core/lib/ecs/World');

      const world = ECSWorld.getInstance().getWorld();
      const meshRendererComponent = componentRegistry.getBitECSComponent('MeshRenderer');
      if (!meshRendererComponent) return;

      // Define query for all entities with MeshRenderer
      const { defineQuery } = await import('bitecs');
      const query = defineQuery([meshRendererComponent]);
      const entities = query(world);

      // Update materialId for all entities with MeshRenderer
      entities.forEach((entityId: number) => {
        const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer');
        if (meshRenderer) {
          componentRegistry.updateComponent(entityId, 'MeshRenderer', {
            ...meshRenderer,
            materialId,
            material: undefined, // Clear overrides when assigning new material
          });
        }
      });

      get()._refreshMaterials();
    },

    get filteredMaterials() {
      const { searchTerm, filterByShader, filterByType, materials } = get();

      if (!materials) return [];

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

    getMaterialById: (id: string) => {
      const { materials } = get();
      return materials.find((m) => m.id === id);
    },

    debugPrintMaterials: () => {
      // Materials list tracked internally
    },
  };
});

/**
 * PERFORMANCE: Optimized hook for subscribing to a single material by ID
 * This prevents re-renders when unrelated materials change
 *
 * Usage:
 * const material = useMaterialById('my-material-id');
 */
export const useMaterialById = (materialId: string): IMaterialDefinition | undefined => {
  return useMaterialsStore(
    (state) => state.materials.find((m) => m.id === materialId),
    // Custom equality function - only re-render if the material object changes
    (prev, next) => {
      if (!prev && !next) return true;
      if (!prev || !next) return false;
      // Reference equality is sufficient since MaterialRegistry returns same instance
      return prev === next;
    }
  );
};
