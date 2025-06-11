import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock stores and managers first
const mockSetSelectedIds = vi.fn();
const mockAddToSelection = vi.fn();
const mockRemoveFromSelection = vi.fn();
const mockToggleSelection = vi.fn();
const mockClearSelection = vi.fn();
const mockGetEntity = vi.fn();

let mockSelectedIds: number[] = [];

// Mock the dependencies
vi.mock('@/editor/store/editorStore', () => ({
  useEditorStore: (selector: any) => {
    const mockStore = {
      selectedIds: mockSelectedIds,
      setSelectedIds: mockSetSelectedIds,
      addToSelection: mockAddToSelection,
      removeFromSelection: mockRemoveFromSelection,
      toggleSelection: mockToggleSelection,
      clearSelection: mockClearSelection,
    };
    return selector(mockStore);
  },
}));

vi.mock('../useEntityManager', () => ({
  useEntityManager: () => ({
    getEntity: mockGetEntity,
  }),
}));

// Import after mocks
import { useGroupSelection } from '../useGroupSelection';

describe('useGroupSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedIds = [];

    // Setup default mock implementations
    mockGetEntity.mockImplementation((id: number) => ({
      id,
      name: `Entity ${id}`,
      parentId: undefined,
      children: [],
    }));
  });

  describe('getAllDescendants', () => {
    it('should return empty array for entity with no children', () => {
      const { result } = renderHook(() => useGroupSelection());

      const descendants = result.current.getAllDescendants(1);
      expect(descendants).toEqual([]);
    });

    it('should return all descendants recursively', () => {
      // Setup entity hierarchy: 1 -> 2 -> 3, 1 -> 4
      mockGetEntity.mockImplementation((id: number) => {
        const entities = {
          1: { id: 1, name: 'Entity 1', parentId: undefined, children: [2, 4] },
          2: { id: 2, name: 'Entity 2', parentId: 1, children: [3] },
          3: { id: 3, name: 'Entity 3', parentId: 2, children: [] },
          4: { id: 4, name: 'Entity 4', parentId: 1, children: [] },
        };
        return entities[id as keyof typeof entities];
      });

      const { result } = renderHook(() => useGroupSelection());

      const descendants = result.current.getAllDescendants(1);
      expect(descendants).toEqual([2, 3, 4]);
    });
  });

  describe('selectWithChildren', () => {
    it('should call setSelectedIds with entity and children', () => {
      mockGetEntity.mockImplementation((id: number) => {
        const entities = {
          1: { id: 1, name: 'Entity 1', parentId: undefined, children: [2, 3] },
          2: { id: 2, name: 'Entity 2', parentId: 1, children: [] },
          3: { id: 3, name: 'Entity 3', parentId: 1, children: [] },
        };
        return entities[id as keyof typeof entities];
      });

      const { result } = renderHook(() => useGroupSelection());

      act(() => {
        result.current.selectWithChildren(1);
      });

      expect(mockSetSelectedIds).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected entity', () => {
      mockSelectedIds = [1, 2, 3];

      const { result } = renderHook(() => useGroupSelection());

      expect(result.current.isSelected(1)).toBe(true);
      expect(result.current.isSelected(2)).toBe(true);
      expect(result.current.isSelected(4)).toBe(false);
    });
  });

  describe('isPrimarySelection', () => {
    it('should return true for first selected entity', () => {
      mockSelectedIds = [1, 2, 3];

      const { result } = renderHook(() => useGroupSelection());

      expect(result.current.isPrimarySelection(1)).toBe(true);
      expect(result.current.isPrimarySelection(2)).toBe(false);
    });

    it('should return false when no entities selected', () => {
      mockSelectedIds = [];

      const { result } = renderHook(() => useGroupSelection());

      expect(result.current.isPrimarySelection(1)).toBe(false);
    });
  });

  describe('getSelectionInfo', () => {
    it('should return correct selection info for empty selection', () => {
      mockSelectedIds = [];

      const { result } = renderHook(() => useGroupSelection());

      const info = result.current.getSelectionInfo();
      expect(info).toEqual({
        count: 0,
        primary: null,
        hasMultiple: false,
      });
    });

    it('should return correct selection info for single selection', () => {
      mockSelectedIds = [1];

      const { result } = renderHook(() => useGroupSelection());

      const info = result.current.getSelectionInfo();
      expect(info).toEqual({
        count: 1,
        primary: 1,
        hasMultiple: false,
        ids: [1],
      });
    });

    it('should return correct selection info for multiple selection', () => {
      mockSelectedIds = [1, 2, 3];

      const { result } = renderHook(() => useGroupSelection());

      const info = result.current.getSelectionInfo();
      expect(info).toEqual({
        count: 3,
        primary: 1,
        hasMultiple: true,
        ids: [1, 2, 3],
      });
    });
  });

  describe('handleHierarchySelection', () => {
    it('should select entity with children on normal click', () => {
      const { result } = renderHook(() => useGroupSelection());

      act(() => {
        result.current.handleHierarchySelection(1, { selectChildren: true });
      });

      expect(mockSetSelectedIds).toHaveBeenCalled();
    });

    it('should toggle selection on ctrl+click', () => {
      mockSelectedIds = [1];

      const { result } = renderHook(() => useGroupSelection());

      act(() => {
        result.current.handleHierarchySelection(1, {
          ctrlKey: true,
          selectChildren: true,
        });
      });

      expect(mockRemoveFromSelection).toHaveBeenCalledWith(1);
    });
  });
});
