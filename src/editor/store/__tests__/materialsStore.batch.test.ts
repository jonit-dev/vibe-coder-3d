import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMaterialsStore } from '../materialsStore';

// Mock ECS dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    getComponentData: vi.fn(),
    updateComponent: vi.fn(),
    getBitECSComponent: vi.fn(() => ({})),
  },
}));

vi.mock('@/core/lib/ecs/World', () => ({
  ECSWorld: {
    getInstance: () => ({
      getWorld: () => ({}),
    }),
  },
}));

vi.mock('@/editor/store/editorStore', () => ({
  useEditorStore: {
    getState: vi.fn(() => ({
      selectedIds: [1, 2, 3],
    })),
  },
}));

vi.mock('bitecs', () => ({
  defineQuery: vi.fn(() => () => [1, 2, 3, 4, 5]),
}));

describe('materialsStore - Batch Operations', () => {
  beforeEach(() => {
    // Reset store state
    useMaterialsStore.setState({
      materials: [],
      selectedMaterialId: null,
    });
  });

  describe('assignToSelection', () => {
    it('should be a function', () => {
      const store = useMaterialsStore.getState();
      expect(typeof store.assignToSelection).toBe('function');
    });

    it('should not throw when called with valid materialId', () => {
      const store = useMaterialsStore.getState();
      expect(() => {
        store.assignToSelection('test-material');
      }).not.toThrow();
    });
  });

  describe('assignToAll', () => {
    it('should be a function', () => {
      const store = useMaterialsStore.getState();
      expect(typeof store.assignToAll).toBe('function');
    });

    it('should not throw when called with valid materialId', () => {
      const store = useMaterialsStore.getState();
      expect(() => {
        store.assignToAll('test-material');
      }).not.toThrow();
    });
  });

  describe('Material assignment workflow', () => {
    it('should have both batch assignment methods available', () => {
      const store = useMaterialsStore.getState();

      expect(store.assignToSelection).toBeDefined();
      expect(store.assignToAll).toBeDefined();
      expect(typeof store.assignToSelection).toBe('function');
      expect(typeof store.assignToAll).toBe('function');
    });
  });
});
