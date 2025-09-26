import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchyIndex } from '../indexers/HierarchyIndex';

describe('HierarchyIndex', () => {
  let index: HierarchyIndex;

  beforeEach(() => {
    index = new HierarchyIndex();
  });

  describe('parent-child relationships', () => {
    it('should set and get parent relationships', () => {
      index.setParent(2, 1); // child 2, parent 1
      index.setParent(3, 1); // child 3, parent 1

      expect(index.getParent(2)).toBe(1);
      expect(index.getParent(3)).toBe(1);
      expect(index.getParent(1)).toBeUndefined();
    });

    it('should get children of a parent', () => {
      index.setParent(2, 1);
      index.setParent(3, 1);
      index.setParent(4, 2);

      const children1 = index.getChildren(1);
      expect(children1.sort()).toEqual([2, 3]);

      const children2 = index.getChildren(2);
      expect(children2).toEqual([4]);

      const children3 = index.getChildren(3);
      expect(children3).toEqual([]);
    });

    it('should handle reparenting', () => {
      // Initial setup: 1 -> 2, 1 -> 3
      index.setParent(2, 1);
      index.setParent(3, 1);
      expect(index.getChildren(1).sort()).toEqual([2, 3]);

      // Reparent 2 from 1 to 3
      index.setParent(2, 3);
      expect(index.getChildren(1)).toEqual([3]);
      expect(index.getChildren(3)).toEqual([2]);
      expect(index.getParent(2)).toBe(3);
    });

    it('should remove parent relationships', () => {
      index.setParent(2, 1);
      expect(index.getParent(2)).toBe(1);
      expect(index.getChildren(1)).toEqual([2]);

      // Remove parent relationship
      index.setParent(2, undefined);
      expect(index.getParent(2)).toBeUndefined();
      expect(index.getChildren(1)).toEqual([]);
    });
  });

  describe('hierarchy queries', () => {
    it('should check if entity has children', () => {
      expect(index.hasChildren(1)).toBe(false);

      index.setParent(2, 1);
      expect(index.hasChildren(1)).toBe(true);
      expect(index.hasChildren(2)).toBe(false);
    });

    it('should count children', () => {
      expect(index.getChildrenCount(1)).toBe(0);

      index.setParent(2, 1);
      index.setParent(3, 1);
      expect(index.getChildrenCount(1)).toBe(2);

      index.setParent(4, 2);
      expect(index.getChildrenCount(2)).toBe(1);
    });

    it('should get root entities', () => {
      const allEntities = [1, 2, 3, 4, 5];

      // Setup hierarchy: 1 -> 2 -> 4, 3 -> 5
      index.setParent(2, 1);
      index.setParent(4, 2);
      index.setParent(5, 3);

      const roots = index.getRootEntities(allEntities);
      expect(roots.sort()).toEqual([1, 3]);
    });

    it('should get descendants using BFS traversal', () => {
      // Setup complex hierarchy:
      //   1
      //   ├── 2
      //   │   ├── 4
      //   │   └── 5
      //   └── 3
      //       └── 6
      index.setParent(2, 1);
      index.setParent(3, 1);
      index.setParent(4, 2);
      index.setParent(5, 2);
      index.setParent(6, 3);

      const descendants = index.getDescendants(1);
      expect(descendants.sort()).toEqual([2, 3, 4, 5, 6]);

      const descendants2 = index.getDescendants(2);
      expect(descendants2.sort()).toEqual([4, 5]);

      const descendants4 = index.getDescendants(4);
      expect(descendants4).toEqual([]);
    });
  });

  describe('circular dependency prevention', () => {
    it('should detect direct circular dependencies', () => {
      index.setParent(2, 1);

      // Try to make 1 a child of 2 (would create 1 -> 2 -> 1)
      const wouldCreateCircular = index.wouldCreateCircularDependency(1, 2);
      expect(wouldCreateCircular).toBe(true);
    });

    it('should detect indirect circular dependencies', () => {
      // Setup chain: 1 -> 2 -> 3 -> 4
      index.setParent(2, 1);
      index.setParent(3, 2);
      index.setParent(4, 3);

      // Try to make 1 a child of 4 (would create circular dependency)
      const wouldCreateCircular = index.wouldCreateCircularDependency(1, 4);
      expect(wouldCreateCircular).toBe(true);

      // But making 5 a child of 4 should be fine
      const wouldNotCreateCircular = index.wouldCreateCircularDependency(5, 4);
      expect(wouldNotCreateCircular).toBe(false);
    });

    it('should allow valid parent assignments', () => {
      index.setParent(2, 1);
      index.setParent(3, 1);

      // These should be valid
      expect(index.wouldCreateCircularDependency(4, 1)).toBe(false);
      expect(index.wouldCreateCircularDependency(4, 2)).toBe(false);
      expect(index.wouldCreateCircularDependency(4, 3)).toBe(false);
    });
  });

  describe('entity removal', () => {
    it('should remove entity from hierarchy when deleted', () => {
      // Setup: 1 -> 2 -> 3, 1 -> 4
      index.setParent(2, 1);
      index.setParent(3, 2);
      index.setParent(4, 1);

      // Remove entity 2
      index.removeEntity(2);

      // Entity 2 should be gone, its children should become orphans
      expect(index.getParent(2)).toBeUndefined();
      expect(index.getChildren(1)).toEqual([4]);
      expect(index.getParent(3)).toBeUndefined(); // 3 is now orphaned
    });

    it('should handle removal of root entities', () => {
      index.setParent(2, 1);
      index.setParent(3, 1);

      index.removeEntity(1);

      // Children should become orphans
      expect(index.getParent(2)).toBeUndefined();
      expect(index.getParent(3)).toBeUndefined();
    });

    it('should handle removal of leaf entities', () => {
      index.setParent(2, 1);
      index.setParent(3, 1);

      index.removeEntity(2);

      // Parent should no longer have this child
      expect(index.getChildren(1)).toEqual([3]);
      expect(index.getParent(2)).toBeUndefined();
    });
  });

  describe('clearing and cleanup', () => {
    it('should clear all relationships', () => {
      index.setParent(2, 1);
      index.setParent(3, 1);
      index.setParent(4, 2);

      index.clear();

      expect(index.getParent(2)).toBeUndefined();
      expect(index.getParent(3)).toBeUndefined();
      expect(index.getParent(4)).toBeUndefined();
      expect(index.getChildren(1)).toEqual([]);
      expect(index.getChildren(2)).toEqual([]);
    });

    it('should clean up empty sets', () => {
      index.setParent(2, 1);
      expect(index.getChildren(1)).toEqual([2]);

      // Remove the only child
      index.setParent(2, undefined);
      expect(index.getChildren(1)).toEqual([]);

      // Add another child to same parent
      index.setParent(3, 1);
      expect(index.getChildren(1)).toEqual([3]);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large hierarchies efficiently', () => {
      // Create a wide hierarchy: 1 parent with 100 children
      for (let i = 2; i <= 101; i++) {
        index.setParent(i, 1);
      }

      expect(index.getChildrenCount(1)).toBe(100);
      expect(index.getChildren(1)).toHaveLength(100);

      // Random access should be fast
      expect(index.getParent(50)).toBe(1);
      expect(index.getParent(100)).toBe(1);
    });

    it('should handle deep hierarchies', () => {
      // Create a deep hierarchy: 1 -> 2 -> 3 -> ... -> 100
      for (let i = 2; i <= 100; i++) {
        index.setParent(i, i - 1);
      }

      expect(index.getParent(100)).toBe(99);
      expect(index.getParent(2)).toBe(1);
      expect(index.getDescendants(1)).toHaveLength(99);
    });

    it('should handle entity ID 0', () => {
      index.setParent(1, 0);
      expect(index.getParent(1)).toBe(0);
      expect(index.getChildren(0)).toEqual([1]);
    });
  });
});