import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { create } from 'zustand';

import type { IMaterialDefinition } from '@/core/materials/Material.types';

// Mock MaterialRegistry completely
const mockRegistry = {
  list: vi.fn(),
  get: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/core/materials/MaterialRegistry', () => ({
  MaterialRegistry: {
    getInstance: () => mockRegistry,
  },
}));

// Import after mocking
import { useMaterialsStore } from '../materialsStore';

describe('materialsStore', () => {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistry.list.mockReturnValue([]);
    mockRegistry.get.mockReturnValue(undefined);
  });

  describe('material CRUD operations', () => {
    it('should create material', async () => {
      const store = useMaterialsStore.getState();

      await act(async () => {
        await store.createMaterial(testMaterial);
      });

      expect(mockRegistry.upsert).toHaveBeenCalledWith(testMaterial);
    });

    it('should update material', async () => {
      const store = useMaterialsStore.getState();
      const existingMaterial = { ...testMaterial };
      mockRegistry.get.mockReturnValue(existingMaterial);

      const updates = { color: '#00ff00', roughness: 0.7 };

      await act(async () => {
        await store.updateMaterial('test-material', updates);
      });

      expect(mockRegistry.get).toHaveBeenCalledWith('test-material');
      expect(mockRegistry.upsert).toHaveBeenCalledWith({
        ...existingMaterial,
        ...updates,
      });
    });

    it('should delete material', async () => {
      const store = useMaterialsStore.getState();

      await act(async () => {
        await store.deleteMaterial('test-material');
      });

      expect(mockRegistry.remove).toHaveBeenCalledWith('test-material');
    });

    it('should prevent deletion of default material', async () => {
      const store = useMaterialsStore.getState();

      await expect(
        act(async () => {
          await store.deleteMaterial('default');
        }),
      ).rejects.toThrow('Cannot delete the default material');

      expect(mockRegistry.remove).not.toHaveBeenCalled();
    });

    it('should duplicate material', async () => {
      const store = useMaterialsStore.getState();
      const originalMaterial = { ...testMaterial };
      mockRegistry.get.mockReturnValue(originalMaterial);

      // Mock Date.now() for predictable ID generation
      const mockNow = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      let duplicate: IMaterialDefinition;
      await act(async () => {
        duplicate = await store.duplicateMaterial('test-material');
      });

      expect(mockRegistry.get).toHaveBeenCalledWith('test-material');
      expect(mockRegistry.upsert).toHaveBeenCalledWith({
        ...originalMaterial,
        id: `test-material_copy_${mockNow}`,
        name: 'Test Material (Copy)',
      });

      expect(duplicate!).toEqual({
        ...originalMaterial,
        id: `test-material_copy_${mockNow}`,
        name: 'Test Material (Copy)',
      });

      vi.restoreAllMocks();
    });
  });

  describe('error handling', () => {
    it('should handle updateMaterial with non-existent material', async () => {
      const store = useMaterialsStore.getState();
      mockRegistry.get.mockReturnValue(undefined);

      await expect(
        act(async () => {
          await store.updateMaterial('non-existent', { color: '#ff0000' });
        }),
      ).rejects.toThrow('Material not found: non-existent');

      expect(mockRegistry.upsert).not.toHaveBeenCalled();
    });

    it('should handle duplicateMaterial with non-existent material', async () => {
      const store = useMaterialsStore.getState();
      mockRegistry.get.mockReturnValue(undefined);

      await expect(
        act(async () => {
          await store.duplicateMaterial('non-existent');
        }),
      ).rejects.toThrow('Material not found: non-existent');

      expect(mockRegistry.upsert).not.toHaveBeenCalled();
    });
  });

  describe('modal state management', () => {
    it('should manage browser modal state', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.openBrowser();
      });
      expect(store.isBrowserOpen).toBe(true);

      act(() => {
        store.closeBrowser();
      });
      expect(store.isBrowserOpen).toBe(false);
    });

    it('should manage create modal state', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.openCreate();
      });
      expect(store.isCreateOpen).toBe(true);

      act(() => {
        store.closeCreate();
      });
      expect(store.isCreateOpen).toBe(false);
    });

    it('should manage inspector modal state', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.openInspector('test-material');
      });
      expect(store.isInspectorOpen).toBe(true);
      expect(store.selectedMaterialId).toBe('test-material');

      act(() => {
        store.closeInspector();
      });
      expect(store.isInspectorOpen).toBe(false);
    });
  });

  describe('selection management', () => {
    it('should manage selected material state', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.setSelectedMaterial('test-material');
      });
      expect(store.selectedMaterialId).toBe('test-material');

      act(() => {
        store.setSelectedMaterial(null);
      });
      expect(store.selectedMaterialId).toBe(null);
    });
  });

  describe('filter state management', () => {
    it('should manage search term', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.setSearchTerm('test');
      });
      expect(store.searchTerm).toBe('test');
    });

    it('should manage shader filter', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.setFilterByShader('unlit');
      });
      expect(store.filterByShader).toBe('unlit');
    });

    it('should manage type filter', () => {
      const store = useMaterialsStore.getState();

      act(() => {
        store.setFilterByType('texture');
      });
      expect(store.filterByType).toBe('texture');
    });
  });
});
