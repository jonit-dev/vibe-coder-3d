/**
 * Tests for materialsStore without localStorage dependency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMaterialsStore } from '../materialsStore';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';

// Mock MaterialRegistry - create singleton inside factory to avoid hoisting issues
vi.mock('@core/materials/MaterialRegistry', () => {
  const mockRegistry = {
    list: vi.fn(() => []),
    get: vi.fn(() => undefined),
    upsert: vi.fn(),
    remove: vi.fn(),
  };

  return {
    MaterialRegistry: {
      getInstance: () => mockRegistry,
    },
  };
});

describe('materialsStore - Scene-based Persistence', () => {
  let mockRegistry: ReturnType<typeof MaterialRegistry.getInstance>;
  const testMaterial: IMaterialDefinition = {
    id: 'test-material',
    name: 'Test Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ff0000',
    metalness: 0.5,
    roughness: 0.3,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    textureRepeatX: 1,
    textureRepeatY: 1,
  };

  beforeEach(() => {
    mockRegistry = MaterialRegistry.getInstance();
    vi.clearAllMocks();

    // Setup default mock behavior
    (mockRegistry.list as any).mockReturnValue([]);
    (mockRegistry.get as any).mockReturnValue(undefined);

    // Reset store state to defaults
    const store = useMaterialsStore.getState();
    store.setSelectedMaterial(null);
    store.closeBrowser();
    store.closeCreate();
    store.closeInspector();
    store.setSearchTerm('');
    store.setFilterByShader('all');
    store.setFilterByType('all');
    store._refreshMaterials();
  });

  describe('material operations without localStorage', () => {
    it('should create material without calling localStorage', async () => {
      const store = useMaterialsStore.getState();
      await store.createMaterial(testMaterial);

      expect(mockRegistry.upsert).toHaveBeenCalledWith(testMaterial);
      expect(mockRegistry.upsert).toHaveBeenCalledTimes(1);
    });

    it('should update material without calling localStorage', async () => {
      const store = useMaterialsStore.getState();
      const existingMaterial = { ...testMaterial };
      mockRegistry.get.mockReturnValue(existingMaterial);

      const updates = { color: '#00ff00', roughness: 0.7 };
      await store.updateMaterial('test-material', updates);

      expect(mockRegistry.get).toHaveBeenCalledWith('test-material');
      expect(mockRegistry.upsert).toHaveBeenCalledWith({
        ...existingMaterial,
        ...updates,
      });
    });

    it('should duplicate material without calling localStorage', async () => {
      const store = useMaterialsStore.getState();
      const originalMaterial = { ...testMaterial };
      mockRegistry.get.mockReturnValue(originalMaterial);

      // Mock Date.now() for predictable ID generation
      const mockNow = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const duplicate = await store.duplicateMaterial('test-material');

      expect(mockRegistry.get).toHaveBeenCalledWith('test-material');
      expect(mockRegistry.upsert).toHaveBeenCalledWith({
        ...originalMaterial,
        id: `test-material_copy_${mockNow}`,
        name: 'Test Material (Copy)',
      });

      expect(duplicate).toEqual({
        ...originalMaterial,
        id: `test-material_copy_${mockNow}`,
        name: 'Test Material (Copy)',
      });

      vi.restoreAllMocks();
    });

    it('should delete material without localStorage cleanup', async () => {
      const store = useMaterialsStore.getState();
      await store.deleteMaterial('test-material');

      expect(mockRegistry.remove).toHaveBeenCalledWith('test-material');
    });

    it('should prevent deletion of default material', async () => {
      const store = useMaterialsStore.getState();
      await expect(store.deleteMaterial('default')).rejects.toThrow(
        'Cannot delete the default material',
      );

      expect(mockRegistry.remove).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle updateMaterial with non-existent material', async () => {
      const store = useMaterialsStore.getState();
      mockRegistry.get.mockReturnValue(undefined);

      await expect(store.updateMaterial('non-existent', { color: '#ff0000' })).rejects.toThrow(
        'Material not found: non-existent',
      );

      expect(mockRegistry.upsert).not.toHaveBeenCalled();
    });

    it('should handle duplicateMaterial with non-existent material', async () => {
      const store = useMaterialsStore.getState();
      mockRegistry.get.mockReturnValue(undefined);

      await expect(store.duplicateMaterial('non-existent')).rejects.toThrow(
        'Material not found: non-existent',
      );

      expect(mockRegistry.upsert).not.toHaveBeenCalled();
    });
  });

  describe('filtering and search', () => {
    const materials: IMaterialDefinition[] = [
      {
        ...testMaterial,
        id: 'red-metal',
        name: 'Red Metal',
        shader: 'standard',
        materialType: 'solid',
      },
      {
        ...testMaterial,
        id: 'blue-fabric',
        name: 'Blue Fabric',
        shader: 'standard',
        materialType: 'texture',
      },
      {
        ...testMaterial,
        id: 'green-glow',
        name: 'Green Glow',
        shader: 'unlit',
        materialType: 'solid',
      },
    ];

    beforeEach(() => {
      mockRegistry.list.mockReturnValue(materials);
      // Refresh materials cache after setting up mock
      const store = useMaterialsStore.getState();
      store._refreshMaterials();
    });

    it('should filter materials by search term', () => {
      const store = useMaterialsStore.getState();
      store.setSearchTerm('metal');
      const filtered = store.getFilteredMaterials();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('red-metal');
    });

    it('should filter materials by shader type', () => {
      const store = useMaterialsStore.getState();
      store.setFilterByShader('unlit');
      const filtered = store.getFilteredMaterials();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('green-glow');
    });

    it('should filter materials by material type', () => {
      const store = useMaterialsStore.getState();
      store.setFilterByType('texture');
      const filtered = store.getFilteredMaterials();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('blue-fabric');
    });

    it('should combine multiple filters', () => {
      const store = useMaterialsStore.getState();
      store.setSearchTerm('blue');
      store.setFilterByType('texture');
      const filtered = store.getFilteredMaterials();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('blue-fabric');
    });

    it('should return empty array when no materials match filters', () => {
      const store = useMaterialsStore.getState();
      store.setSearchTerm('nonexistent');
      const filtered = store.getFilteredMaterials();

      expect(filtered).toHaveLength(0);
    });
  });

  describe('selection management', () => {
    it('should manage selected material state', () => {
      expect(useMaterialsStore.getState().selectedMaterialId).toBeNull();

      useMaterialsStore.getState().setSelectedMaterial('test-material');
      expect(useMaterialsStore.getState().selectedMaterialId).toBe('test-material');

      useMaterialsStore.getState().setSelectedMaterial(null);
      expect(useMaterialsStore.getState().selectedMaterialId).toBeNull();
    });

    it('should get selected material from materials cache', () => {
      const store = useMaterialsStore.getState();
      const selectedMaterial = { ...testMaterial };
      // Set up materials cache
      mockRegistry.list.mockReturnValue([selectedMaterial]);
      store._refreshMaterials();

      store.setSelectedMaterial('test-material');
      const material = store.getSelectedMaterial();

      expect(material).toEqual(selectedMaterial);
    });

    it('should return null for non-existent selected material', () => {
      const store = useMaterialsStore.getState();
      // Set up empty materials cache
      mockRegistry.list.mockReturnValue([]);
      store._refreshMaterials();

      store.setSelectedMaterial('non-existent');
      const material = store.getSelectedMaterial();

      expect(material).toBeNull();
    });
  });

  describe('modal state management', () => {
    it('should manage browser modal state', () => {
      expect(useMaterialsStore.getState().isBrowserOpen).toBe(false);

      useMaterialsStore.getState().openBrowser();
      expect(useMaterialsStore.getState().isBrowserOpen).toBe(true);

      useMaterialsStore.getState().closeBrowser();
      expect(useMaterialsStore.getState().isBrowserOpen).toBe(false);
    });

    it('should manage create modal state', () => {
      expect(useMaterialsStore.getState().isCreateOpen).toBe(false);

      useMaterialsStore.getState().openCreate();
      expect(useMaterialsStore.getState().isCreateOpen).toBe(true);

      useMaterialsStore.getState().closeCreate();
      expect(useMaterialsStore.getState().isCreateOpen).toBe(false);
    });

    it('should manage inspector modal state', () => {
      expect(useMaterialsStore.getState().isInspectorOpen).toBe(false);

      useMaterialsStore.getState().openInspector();
      expect(useMaterialsStore.getState().isInspectorOpen).toBe(true);

      useMaterialsStore.getState().closeInspector();
      expect(useMaterialsStore.getState().isInspectorOpen).toBe(false);
    });

    it('should set selected material when opening inspector', () => {
      useMaterialsStore.getState().openInspector('test-material');

      expect(useMaterialsStore.getState().isInspectorOpen).toBe(true);
      expect(useMaterialsStore.getState().selectedMaterialId).toBe('test-material');
    });

    it('should preserve current selection when opening inspector without material ID', () => {
      useMaterialsStore.getState().setSelectedMaterial('existing-material');
      useMaterialsStore.getState().openInspector();

      expect(useMaterialsStore.getState().isInspectorOpen).toBe(true);
      expect(useMaterialsStore.getState().selectedMaterialId).toBe('existing-material');
    });
  });

  describe('integration with registry', () => {
    it('should use registry instance consistently', () => {
      const materials = [testMaterial];
      mockRegistry.list.mockReturnValue(materials);

      // Refresh to load materials from registry
      useMaterialsStore.getState()._refreshMaterials();

      expect(useMaterialsStore.getState().materials).toEqual(materials);
      expect(mockRegistry.list).toHaveBeenCalled();
    });

    it('should reflect registry changes in computed properties', () => {
      const initialMaterials = [testMaterial];
      mockRegistry.list.mockReturnValue(initialMaterials);

      // Refresh to load materials from registry
      useMaterialsStore.getState()._refreshMaterials();

      expect(useMaterialsStore.getState().getFilteredMaterials()).toEqual(initialMaterials);

      // Simulate registry change
      const updatedMaterials = [testMaterial, { ...testMaterial, id: 'new-material' }];
      mockRegistry.list.mockReturnValue(updatedMaterials);

      // Refresh again to see changes
      useMaterialsStore.getState()._refreshMaterials();

      expect(useMaterialsStore.getState().getFilteredMaterials()).toEqual(updatedMaterials);
    });
  });
});
