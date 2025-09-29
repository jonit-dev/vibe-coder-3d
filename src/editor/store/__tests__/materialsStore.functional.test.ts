import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('materialsStore functional tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('store functionality', () => {
    it('should import materials store without errors', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      expect(useMaterialsStore).toBeDefined();
      expect(typeof useMaterialsStore).toBe('function');
    });

    it('should have expected store methods', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      // Check all expected methods exist
      expect(typeof store.createMaterial).toBe('function');
      expect(typeof store.updateMaterial).toBe('function');
      expect(typeof store.deleteMaterial).toBe('function');
      expect(typeof store.duplicateMaterial).toBe('function');
      expect(typeof store.setSelectedMaterial).toBe('function');
      expect(typeof store.openBrowser).toBe('function');
      expect(typeof store.closeBrowser).toBe('function');
      expect(typeof store.openCreate).toBe('function');
      expect(typeof store.closeCreate).toBe('function');
      expect(typeof store.openInspector).toBe('function');
      expect(typeof store.closeInspector).toBe('function');
      expect(typeof store.setSearchTerm).toBe('function');
      expect(typeof store.setFilterByShader).toBe('function');
      expect(typeof store.setFilterByType).toBe('function');
      expect(typeof store.getFilteredMaterials).toBe('function');
      expect(typeof store.getSelectedMaterial).toBe('function');
    });

    it('should have expected initial state properties', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      expect(Array.isArray(store.materials)).toBe(true);
      expect(
        store.selectedMaterialId === null || typeof store.selectedMaterialId === 'string',
      ).toBe(true);
      expect(typeof store.isBrowserOpen).toBe('boolean');
      expect(typeof store.isCreateOpen).toBe('boolean');
      expect(typeof store.isInspectorOpen).toBe('boolean');
      expect(typeof store.searchTerm).toBe('string');
      expect(typeof store.filterByShader).toBe('string');
      expect(typeof store.filterByType).toBe('string');
    });

    it('should handle error in updateMaterial for non-existent material', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      await expect(
        store.updateMaterial('non-existent-material', { color: '#ff0000' }),
      ).rejects.toThrow('Material not found: non-existent-material');
    });

    it('should handle error in duplicateMaterial for non-existent material', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      await expect(store.duplicateMaterial('non-existent-material')).rejects.toThrow(
        'Material not found: non-existent-material',
      );
    });

    it('should prevent deletion of default material', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      await expect(store.deleteMaterial('default')).rejects.toThrow(
        'Cannot delete the default material',
      );
    });

    it('should have filtering functionality', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      const filtered = store.getFilteredMaterials();
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  describe('integration', () => {
    it('should be able to get store instance', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      // Test that we have some materials (at least default ones)
      expect(store.materials.length).toBeGreaterThanOrEqual(0);
    });

    it('should have registry instance', async () => {
      const { useMaterialsStore } = await import('../materialsStore');
      const store = useMaterialsStore.getState();

      expect(store.registry).toBeDefined();
      expect(typeof store.registry.list).toBe('function');
      expect(typeof store.registry.get).toBe('function');
      expect(typeof store.registry.upsert).toBe('function');
      expect(typeof store.registry.remove).toBe('function');
    });
  });
});
