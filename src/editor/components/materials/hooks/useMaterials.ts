import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { useCallback, useEffect } from 'react';

export interface IUseMaterialsOptions {
  selectedMaterialId?: string;
  onMaterialSelect?: (materialId: string) => void;
  onMaterialCreate?: (material: IMaterialDefinition) => void;
  onMaterialUpdate?: (material: IMaterialDefinition) => void;
  onMaterialDelete?: (materialId: string) => void;
}

export const useMaterials = (options: IUseMaterialsOptions = {}) => {
  const store = useMaterialsStore();

  // Initialize with the provided selectedMaterialId if different from store
  useEffect(() => {
    if (options.selectedMaterialId && options.selectedMaterialId !== store.selectedMaterialId) {
      store.setSelectedMaterial(options.selectedMaterialId);
    }
  }, [options.selectedMaterialId, store.selectedMaterialId]);

  const selectMaterial = useCallback(
    (materialId: string) => {
      store.setSelectedMaterial(materialId);
      options.onMaterialSelect?.(materialId);
    },
    [store, options],
  );

  const createMaterial = useCallback(
    async (material: IMaterialDefinition) => {
      try {
        await store.createMaterial(material);
        options.onMaterialCreate?.(material);

        // Auto-select the newly created material
        selectMaterial(material.id);
      } catch (error) {
        console.error('Failed to create material:', error);
        throw error;
      }
    },
    [store, options, selectMaterial],
  );

  const updateMaterial = useCallback(
    async (materialId: string, updates: Partial<IMaterialDefinition>) => {
      try {
        await store.updateMaterial(materialId, updates);
        const updatedMaterial = store.registry.get(materialId);
        if (updatedMaterial) {
          options.onMaterialUpdate?.(updatedMaterial);
        }
      } catch (error) {
        console.error('Failed to update material:', error);
        throw error;
      }
    },
    [store, options],
  );

  const deleteMaterial = useCallback(
    async (materialId: string) => {
      try {
        await store.deleteMaterial(materialId);
        options.onMaterialDelete?.(materialId);

        // If this was the selected material, select default
        if (store.selectedMaterialId === materialId) {
          selectMaterial('default');
        }
      } catch (error) {
        console.error('Failed to delete material:', error);
        throw error;
      }
    },
    [store, options, selectMaterial],
  );

  const duplicateMaterial = useCallback(
    async (materialId: string) => {
      try {
        const duplicate = await store.duplicateMaterial(materialId);
        return duplicate;
      } catch (error) {
        console.error('Failed to duplicate material:', error);
        throw error;
      }
    },
    [store],
  );

  const openBrowser = useCallback(() => {
    store.openBrowser();
  }, [store]);

  const closeBrowser = useCallback(() => {
    store.closeBrowser();
  }, [store]);

  const openCreate = useCallback(() => {
    store.openCreate();
  }, [store]);

  const closeCreate = useCallback(() => {
    store.closeCreate();
  }, [store]);

  const openInspector = useCallback(
    (materialId?: string) => {
      if (materialId) {
        selectMaterial(materialId);
      }
      store.openInspector(materialId);
    },
    [store, selectMaterial],
  );

  const closeInspector = useCallback(() => {
    store.closeInspector();
  }, [store]);

  const handleBrowserSelect = useCallback(
    (materialId: string) => {
      selectMaterial(materialId);
      closeBrowser();
    },
    [selectMaterial, closeBrowser],
  );

  const handleCreate = useCallback(
    (material: IMaterialDefinition) => {
      createMaterial(material);
      closeCreate();
    },
    [createMaterial, closeCreate],
  );

  return {
    // State
    materials: store.registry.list(),
    selectedMaterialId: store.selectedMaterialId,
    selectedMaterial: store.getSelectedMaterial(),
    isBrowserOpen: store.isBrowserOpen,
    isCreateOpen: store.isCreateOpen,
    isInspectorOpen: store.isInspectorOpen,
    getFilteredMaterials: store.getFilteredMaterials,
    getSelectedMaterial: store.getSelectedMaterial,

    // Actions
    selectMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    duplicateMaterial,

    // Modal controls
    openBrowser,
    closeBrowser,
    openCreate,
    closeCreate,
    openInspector,
    closeInspector,

    // Modal handlers
    handleBrowserSelect,
    handleCreate,
  };
};
