import { describe, it, expect, beforeEach } from 'vitest';
import { EntityIndex } from '../indexers/EntityIndex';

describe('EntityIndex', () => {
  let index: EntityIndex;

  beforeEach(() => {
    index = new EntityIndex();
  });

  describe('basic operations', () => {
    it('should add entity IDs', () => {
      index.add(1);
      index.add(5);
      index.add(10);

      expect(index.has(1)).toBe(true);
      expect(index.has(5)).toBe(true);
      expect(index.has(10)).toBe(true);
      expect(index.has(2)).toBe(false);
    });

    it('should remove entity IDs', () => {
      index.add(1);
      index.add(2);
      expect(index.has(1)).toBe(true);
      expect(index.has(2)).toBe(true);

      index.delete(1);
      expect(index.has(1)).toBe(false);
      expect(index.has(2)).toBe(true);
    });

    it('should list all entity IDs', () => {
      const entities = [1, 5, 10, 25, 100];
      entities.forEach(id => index.add(id));

      const result = index.list();
      expect(result).toHaveLength(entities.length);
      expect(result.sort()).toEqual(entities.sort());
    });

    it('should return correct size', () => {
      expect(index.size()).toBe(0);

      index.add(1);
      expect(index.size()).toBe(1);

      index.add(2);
      expect(index.size()).toBe(2);

      index.delete(1);
      expect(index.size()).toBe(1);
    });

    it('should clear all entities', () => {
      index.add(1);
      index.add(2);
      index.add(3);
      expect(index.size()).toBe(3);

      index.clear();
      expect(index.size()).toBe(0);
      expect(index.list()).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate additions', () => {
      index.add(1);
      index.add(1);
      index.add(1);

      expect(index.size()).toBe(1);
      expect(index.list()).toEqual([1]);
    });

    it('should handle deletion of non-existent entities', () => {
      index.delete(999);
      expect(index.size()).toBe(0);

      index.add(1);
      index.delete(999);
      expect(index.size()).toBe(1);
      expect(index.has(1)).toBe(true);
    });

    it('should handle large entity IDs', () => {
      const largeId = 999999;
      index.add(largeId);

      expect(index.has(largeId)).toBe(true);
      expect(index.list()).toContain(largeId);
    });

    it('should handle entity ID 0', () => {
      index.add(0);
      expect(index.has(0)).toBe(true);
      expect(index.list()).toContain(0);
    });
  });

  describe('performance characteristics', () => {
    it('should handle sparse entity distributions efficiently', () => {
      // Add entities with large gaps between IDs
      const sparseIds = [1, 1000, 10000, 50000, 99999];
      sparseIds.forEach(id => index.add(id));

      expect(index.size()).toBe(sparseIds.length);
      expect(index.list().sort((a, b) => a - b)).toEqual(sparseIds);

      // All lookups should be fast O(1)
      sparseIds.forEach(id => {
        expect(index.has(id)).toBe(true);
      });
    });

    it('should maintain performance with many entities', () => {
      // Add 1000 entities
      const entities = Array.from({ length: 1000 }, (_, i) => i);
      entities.forEach(id => index.add(id));

      expect(index.size()).toBe(1000);

      // Random access should be fast
      expect(index.has(500)).toBe(true);
      expect(index.has(999)).toBe(true);
      expect(index.has(1000)).toBe(false);
    });
  });

  describe('iterator support', () => {
    it('should provide iterator for memory-efficient traversal', () => {
      const entities = [1, 5, 10];
      entities.forEach(id => index.add(id));

      const iterated: number[] = [];
      for (const entityId of index.iterate()) {
        iterated.push(entityId);
      }

      expect(iterated.sort()).toEqual(entities.sort());
    });

    it('should handle empty index iteration', () => {
      const iterated: number[] = [];
      for (const entityId of index.iterate()) {
        iterated.push(entityId);
      }

      expect(iterated).toEqual([]);
    });
  });
});