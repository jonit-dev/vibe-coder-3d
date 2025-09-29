import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { create } from 'zustand';

import type { IMaterialDefinition } from '../../../core/materials/Material.types';

// Mock MaterialRegistry completely - create singleton inside factory
vi.mock('../../../core/materials/MaterialRegistry', () => {
  const mockInstance = {
    list: vi.fn(() => []),
    get: vi.fn(() => undefined),
    upsert: vi.fn(),
    remove: vi.fn(),
  };

  return {
    MaterialRegistry: {
      getInstance: () => mockInstance,
    },
  };
});

// Import after mocking
import { useMaterialsStore } from '../materialsStore';
import { MaterialRegistry } from '../../../core/materials/MaterialRegistry';

describe('materialsStore', () => {
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
  };

  beforeEach(() => {
    mockRegistry = MaterialRegistry.getInstance();
    vi.clearAllMocks();
    (mockRegistry.list as any).mockReturnValue([]);
    (mockRegistry.get as any).mockReturnValue(undefined);
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
      act(() => {
        useMaterialsStore.getState().openBrowser();
      });
      expect(useMaterialsStore.getState().isBrowserOpen).toBe(true);

      act(() => {
        useMaterialsStore.getState().closeBrowser();
      });
      expect(useMaterialsStore.getState().isBrowserOpen).toBe(false);
    });

    it('should manage create modal state', () => {
      act(() => {
        useMaterialsStore.getState().openCreate();
      });
      expect(useMaterialsStore.getState().isCreateOpen).toBe(true);

      act(() => {
        useMaterialsStore.getState().closeCreate();
      });
      expect(useMaterialsStore.getState().isCreateOpen).toBe(false);
    });

    it('should manage inspector modal state', () => {
      act(() => {
        useMaterialsStore.getState().openInspector('test-material');
      });
      expect(useMaterialsStore.getState().isInspectorOpen).toBe(true);
      expect(useMaterialsStore.getState().selectedMaterialId).toBe('test-material');

      act(() => {
        useMaterialsStore.getState().closeInspector();
      });
      expect(useMaterialsStore.getState().isInspectorOpen).toBe(false);
    });
  });

  describe('selection management', () => {
    it('should manage selected material state', () => {
      act(() => {
        useMaterialsStore.getState().setSelectedMaterial('test-material');
      });
      expect(useMaterialsStore.getState().selectedMaterialId).toBe('test-material');

      act(() => {
        useMaterialsStore.getState().setSelectedMaterial(null);
      });
      expect(useMaterialsStore.getState().selectedMaterialId).toBe(null);
    });
  });

  describe('filter state management', () => {
    it('should manage search term', () => {
      act(() => {
        useMaterialsStore.getState().setSearchTerm('test');
      });
      expect(useMaterialsStore.getState().searchTerm).toBe('test');
    });

    it('should manage shader filter', () => {
      act(() => {
        useMaterialsStore.getState().setFilterByShader('unlit');
      });
      expect(useMaterialsStore.getState().filterByShader).toBe('unlit');
    });

    it('should manage type filter', () => {
      act(() => {
        useMaterialsStore.getState().setFilterByType('texture');
      });
      expect(useMaterialsStore.getState().filterByType).toBe('texture');
    });
  });
});
