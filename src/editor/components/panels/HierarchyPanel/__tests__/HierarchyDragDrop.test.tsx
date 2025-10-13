import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core';
import { renderHook, act } from '@testing-library/react';

import { useHierarchyDragDrop } from '../hooks/useHierarchyDragDrop';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { IEntity } from '@/core/lib/ecs/IEntity';

// Mock the logger
vi.mock('@/core/lib/logger', () => ({
  Logger: {
    create: () => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

// Mock the useEntityManager hook
vi.mock('@/editor/hooks/useEntityManager', () => ({
  useEntityManager: vi.fn(),
}));

describe('HierarchyDragDrop', () => {
  let mockEntityManager: {
    getEntity: ReturnType<typeof vi.fn>;
    setParent: ReturnType<typeof vi.fn>;
  };
  let setExpandedNodes: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mock entity manager
    mockEntityManager = {
      getEntity: vi.fn(),
      setParent: vi.fn(),
    };

    // Setup useEntityManager mock
    const useEntityManager = await import('@/editor/hooks/useEntityManager');
    vi.mocked(useEntityManager.useEntityManager).mockReturnValue(
      mockEntityManager as unknown as EntityManager,
    );

    setExpandedNodes = vi.fn();
  });

  describe('Parent-Child Relationship Nesting', () => {
    it('should successfully nest an entity as a child of another entity', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const childEntity: IEntity = { id: 1, name: 'Child', children: [], parentId: undefined };
      const parentEntity: IEntity = { id: 2, name: 'Parent', children: [], parentId: undefined };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return childEntity;
        if (id === 2) return parentEntity;
        return undefined;
      });
      mockEntityManager.setParent.mockReturnValue(true);

      // Simulate drag end event
      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).toHaveBeenCalledWith(1, 2);
      expect(setExpandedNodes).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should prevent circular parent-child relationships', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      // Setup: Entity 1 is parent of Entity 2
      const parentEntity: IEntity = { id: 1, name: 'Parent', children: [2], parentId: undefined };
      const childEntity: IEntity = { id: 2, name: 'Child', children: [], parentId: 1 };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return parentEntity;
        if (id === 2) return childEntity;
        return undefined;
      });

      // Try to drag Entity 1 (parent) onto Entity 2 (child) - should be prevented
      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      // setParent should not be called because of circular dependency check
      expect(mockEntityManager.setParent).not.toHaveBeenCalled();
    });

    it('should prevent deeply nested circular relationships', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      // Setup: Entity 1 > Entity 2 > Entity 3 (three-level hierarchy)
      const entity1: IEntity = { id: 1, name: 'Entity1', children: [2], parentId: undefined };
      const entity2: IEntity = { id: 2, name: 'Entity2', children: [3], parentId: 1 };
      const entity3: IEntity = { id: 3, name: 'Entity3', children: [], parentId: 2 };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return entity1;
        if (id === 2) return entity2;
        if (id === 3) return entity3;
        return undefined;
      });

      // Try to drag Entity 1 (top ancestor) onto Entity 3 (deep descendant) - should be prevented
      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '3', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).not.toHaveBeenCalled();
    });

    it('should allow moving entity to root level (no parent)', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const entity: IEntity = { id: 1, name: 'Entity', children: [], parentId: 2 };

      mockEntityManager.getEntity.mockReturnValue(entity);

      // Drag entity to root drop zone
      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: 'root-drop-zone', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).toHaveBeenCalledWith(1, undefined);
    });

    it('should expand parent node after successful child nesting', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const childEntity: IEntity = { id: 1, name: 'Child', children: [], parentId: undefined };
      const parentEntity: IEntity = { id: 2, name: 'Parent', children: [], parentId: undefined };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return childEntity;
        if (id === 2) return parentEntity;
        return undefined;
      });
      mockEntityManager.setParent.mockReturnValue(true);

      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      // Verify setExpandedNodes was called with a function
      expect(setExpandedNodes).toHaveBeenCalled();
      const expanderFn = setExpandedNodes.mock.calls[0][0];
      const newSet = expanderFn(new Set([5]));
      expect(newSet.has(2)).toBe(true);
      expect(newSet.has(5)).toBe(true);
    });

    it('should not expand parent if setParent fails', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const childEntity: IEntity = { id: 1, name: 'Child', children: [], parentId: undefined };
      const parentEntity: IEntity = { id: 2, name: 'Parent', children: [], parentId: undefined };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return childEntity;
        if (id === 2) return parentEntity;
        return undefined;
      });
      mockEntityManager.setParent.mockReturnValue(false);

      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(setExpandedNodes).not.toHaveBeenCalled();
    });

    it('should handle drag over events', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const event: DragOverEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.dragOverEntity).toBe(2);
    });

    it('should handle drag start events', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const entity: IEntity = { id: 1, name: 'Entity', children: [], parentId: undefined };
      mockEntityManager.getEntity.mockReturnValue(entity);

      const event: DragStartEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        activatorEvent: new MouseEvent('mousedown'),
      };

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.draggedEntity).toEqual(entity);
    });

    it('should clear drag state after drag end', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const entity: IEntity = { id: 1, name: 'Entity', children: [], parentId: undefined };
      mockEntityManager.getEntity.mockReturnValue(entity);

      // Start drag
      const startEvent: DragStartEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        activatorEvent: new MouseEvent('mousedown'),
      };

      act(() => {
        result.current.handleDragStart(startEvent);
      });

      expect(result.current.draggedEntity).toEqual(entity);

      // End drag (without over)
      const endEvent: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: null,
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(endEvent);
      });

      expect(result.current.draggedEntity).toBeNull();
      expect(result.current.dragOverEntity).toBeNull();
    });

    it('should not set parent when dragging entity onto itself', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      const entity: IEntity = { id: 1, name: 'Entity', children: [], parentId: undefined };
      mockEntityManager.getEntity.mockReturnValue(entity);

      const event: DragEndEvent = {
        active: { id: '1', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '1', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).not.toHaveBeenCalled();
    });

    it('should handle missing entities gracefully', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      mockEntityManager.getEntity.mockReturnValue(undefined);

      const event: DragEndEvent = {
        active: { id: '999', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '998', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).not.toHaveBeenCalled();
    });

    it('should allow reparenting from one parent to another', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      // Entity 3 is currently child of Entity 1, move it to Entity 2
      const entity1: IEntity = { id: 1, name: 'Parent1', children: [3], parentId: undefined };
      const entity2: IEntity = { id: 2, name: 'Parent2', children: [], parentId: undefined };
      const entity3: IEntity = { id: 3, name: 'Child', children: [], parentId: 1 };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return entity1;
        if (id === 2) return entity2;
        if (id === 3) return entity3;
        return undefined;
      });
      mockEntityManager.setParent.mockReturnValue(true);

      const event: DragEndEvent = {
        active: { id: '3', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).toHaveBeenCalledWith(3, 2);
    });

    it('should allow nesting multiple levels deep', () => {
      const { result } = renderHook(() => useHierarchyDragDrop(setExpandedNodes));

      // Create a hierarchy: Entity 1 > Entity 2, then add Entity 3 under Entity 2
      const entity1: IEntity = { id: 1, name: 'Root', children: [2], parentId: undefined };
      const entity2: IEntity = { id: 2, name: 'Level1', children: [], parentId: 1 };
      const entity3: IEntity = { id: 3, name: 'Level2', children: [], parentId: undefined };

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return entity1;
        if (id === 2) return entity2;
        if (id === 3) return entity3;
        return undefined;
      });
      mockEntityManager.setParent.mockReturnValue(true);

      const event: DragEndEvent = {
        active: { id: '3', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
        over: { id: '2', data: { current: {} }, rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }, disabled: false },
        activatorEvent: new MouseEvent('mousedown'),
        collisions: null,
        delta: { x: 0, y: 0 },
      };

      act(() => {
        result.current.handleDragEnd(event);
      });

      expect(mockEntityManager.setParent).toHaveBeenCalledWith(3, 2);
      expect(setExpandedNodes).toHaveBeenCalled();
    });
  });
});
