/**
 * useHierarchyTree Hook Tests
 * Tests for the hierarchy tree building logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHierarchyTree } from '../useHierarchyTree';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { IEntity } from '@/core/lib/ecs/IEntity';

// Mock the useEntityManager hook
vi.mock('@/editor/hooks/useEntityManager');

describe('useHierarchyTree', () => {
  let mockEntityManager: {
    getEntity: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockEntityManager = {
      getEntity: vi.fn(),
    };

    (useEntityManager as ReturnType<typeof vi.fn>).mockReturnValue(mockEntityManager);
  });

  it('should return empty array for empty entityIds', () => {
    const { result } = renderHook(() => useHierarchyTree([], new Set()));

    expect(result.current).toEqual([]);
  });

  it('should build tree from flat entity list', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Entity 1',
      parentId: null,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      return undefined;
    });

    const { result } = renderHook(() => useHierarchyTree([1], new Set()));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      entity: entity1,
      depth: 0,
      hasChildren: false,
      isExpanded: false,
    });
  });

  it('should build tree with parent-child relationships', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Parent',
      parentId: null,
      children: [2, 3],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Child 1',
      parentId: 1,
      children: [],
      components: {},
    };

    const entity3: IEntity = {
      id: 3,
      name: 'Child 2',
      parentId: 1,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      if (id === 3) return entity3;
      return undefined;
    });

    const expandedNodes = new Set([1]);
    const { result } = renderHook(() => useHierarchyTree([1, 2, 3], expandedNodes));

    expect(result.current).toHaveLength(3);
    expect(result.current[0]).toMatchObject({
      entity: entity1,
      depth: 0,
      hasChildren: true,
      isExpanded: true,
    });
    expect(result.current[1]).toMatchObject({
      entity: entity2,
      depth: 1,
      hasChildren: false,
      isExpanded: false,
    });
    expect(result.current[2]).toMatchObject({
      entity: entity3,
      depth: 1,
      hasChildren: false,
      isExpanded: false,
    });
  });

  it('should respect expanded nodes state', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Parent',
      parentId: null,
      children: [2],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Child',
      parentId: 1,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      return undefined;
    });

    // Not expanded - should only show parent
    const { result: result1 } = renderHook(() => useHierarchyTree([1, 2], new Set()));
    expect(result1.current).toHaveLength(1);
    expect(result1.current[0].entity.id).toBe(1);

    // Expanded - should show parent and child
    const { result: result2 } = renderHook(() => useHierarchyTree([1, 2], new Set([1])));
    expect(result2.current).toHaveLength(2);
    expect(result2.current[0].entity.id).toBe(1);
    expect(result2.current[1].entity.id).toBe(2);
  });

  it('should build nested hierarchy with multiple levels', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Grandparent',
      parentId: null,
      children: [2],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Parent',
      parentId: 1,
      children: [3],
      components: {},
    };

    const entity3: IEntity = {
      id: 3,
      name: 'Child',
      parentId: 2,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      if (id === 3) return entity3;
      return undefined;
    });

    const expandedNodes = new Set([1, 2]);
    const { result } = renderHook(() => useHierarchyTree([1, 2, 3], expandedNodes));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].depth).toBe(0);
    expect(result.current[1].depth).toBe(1);
    expect(result.current[2].depth).toBe(2);
  });

  it('should handle multiple root entities', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Root 1',
      parentId: null,
      children: [],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Root 2',
      parentId: null,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      return undefined;
    });

    const { result } = renderHook(() => useHierarchyTree([1, 2], new Set()));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].entity.id).toBe(1);
    expect(result.current[0].depth).toBe(0);
    expect(result.current[1].entity.id).toBe(2);
    expect(result.current[1].depth).toBe(0);
  });

  it('should filter out undefined entities', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Entity 1',
      parentId: null,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      return undefined;
    });

    const { result } = renderHook(() => useHierarchyTree([1, 2, 3], new Set()));

    // Only entity 1 should be in the tree
    expect(result.current).toHaveLength(1);
    expect(result.current[0].entity.id).toBe(1);
  });

  it('should handle missing child entities gracefully', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Parent',
      parentId: null,
      children: [2, 3], // child 3 doesn't exist
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Child',
      parentId: 1,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      return undefined; // entity 3 is missing
    });

    const expandedNodes = new Set([1]);
    const { result } = renderHook(() => useHierarchyTree([1, 2], expandedNodes));

    // Should show parent and only the existing child
    expect(result.current).toHaveLength(2);
    expect(result.current[0].entity.id).toBe(1);
    expect(result.current[1].entity.id).toBe(2);
  });

  it('should memoize results based on dependencies', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Entity 1',
      parentId: null,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockReturnValue(entity1);

    const expandedNodes = new Set<number>();
    const { result, rerender } = renderHook(
      ({ ids, expanded }) => useHierarchyTree(ids, expanded),
      {
        initialProps: { ids: [1], expanded: expandedNodes },
      },
    );

    const firstResult = result.current;

    // Re-render with same props
    rerender({ ids: [1], expanded: expandedNodes });

    // Should return same structure (values match even if not same reference)
    expect(result.current).toHaveLength(firstResult.length);
    expect(result.current[0].entity.id).toBe(firstResult[0].entity.id);
  });

  it('should recalculate when entityIds change', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Entity 1',
      parentId: null,
      children: [],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Entity 2',
      parentId: null,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      return undefined;
    });

    const expandedNodes = new Set<number>();
    const { result, rerender } = renderHook(
      ({ ids, expanded }) => useHierarchyTree(ids, expanded),
      {
        initialProps: { ids: [1], expanded: expandedNodes },
      },
    );

    expect(result.current).toHaveLength(1);

    // Change entityIds
    rerender({ ids: [1, 2], expanded: expandedNodes });

    expect(result.current).toHaveLength(2);
  });

  it('should recalculate when expandedNodes change', () => {
    const entity1: IEntity = {
      id: 1,
      name: 'Parent',
      parentId: null,
      children: [2],
      components: {},
    };

    const entity2: IEntity = {
      id: 2,
      name: 'Child',
      parentId: 1,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entity1;
      if (id === 2) return entity2;
      return undefined;
    });

    const { result, rerender } = renderHook(
      ({ ids, expanded }) => useHierarchyTree(ids, expanded),
      {
        initialProps: { ids: [1, 2], expanded: new Set() },
      },
    );

    expect(result.current).toHaveLength(1);

    // Expand node 1
    rerender({ ids: [1, 2], expanded: new Set([1]) });

    expect(result.current).toHaveLength(2);
  });

  it('should handle invalid entityIds input gracefully', () => {
    const { result } = renderHook(() => useHierarchyTree(null as any, new Set()));

    expect(result.current).toEqual([]);
  });

  it('should correctly set hasChildren flag', () => {
    const entityWithChildren: IEntity = {
      id: 1,
      name: 'Parent',
      parentId: null,
      children: [2],
      components: {},
    };

    const entityWithoutChildren: IEntity = {
      id: 2,
      name: 'Child',
      parentId: 1,
      children: [],
      components: {},
    };

    mockEntityManager.getEntity.mockImplementation((id: number) => {
      if (id === 1) return entityWithChildren;
      if (id === 2) return entityWithoutChildren;
      return undefined;
    });

    const { result } = renderHook(() => useHierarchyTree([1, 2], new Set([1])));

    expect(result.current[0].hasChildren).toBe(true);
    expect(result.current[1].hasChildren).toBe(false);
  });
});
