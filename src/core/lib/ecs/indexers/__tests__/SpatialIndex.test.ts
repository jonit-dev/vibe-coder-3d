import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialIndex } from '../SpatialIndex';
import type { IVector3, IBounds } from '../SpatialIndex';

describe('SpatialIndex', () => {
  let spatialIndex: SpatialIndex;

  beforeEach(() => {
    spatialIndex = new SpatialIndex({ cellSize: 10 });
  });

  describe('basic operations', () => {
    it('should add and track entities', () => {
      spatialIndex.updateEntity(1, { x: 5, y: 0, z: 5 });
      spatialIndex.updateEntity(2, { x: 15, y: 0, z: 5 });

      expect(spatialIndex.hasEntity(1)).toBe(true);
      expect(spatialIndex.hasEntity(2)).toBe(true);
      expect(spatialIndex.hasEntity(3)).toBe(false);
    });

    it('should remove entities', () => {
      spatialIndex.updateEntity(1, { x: 5, y: 0, z: 5 });
      expect(spatialIndex.hasEntity(1)).toBe(true);

      spatialIndex.removeEntity(1);
      expect(spatialIndex.hasEntity(1)).toBe(false);
    });

    it('should track entity positions', () => {
      const pos: IVector3 = { x: 5, y: 10, z: 15 };
      spatialIndex.updateEntity(1, pos);

      const tracked = spatialIndex.getEntityPosition(1);
      expect(tracked).toEqual(pos);
    });

    it('should update entity positions', () => {
      spatialIndex.updateEntity(1, { x: 5, y: 0, z: 5 });
      spatialIndex.updateEntity(1, { x: 25, y: 0, z: 25 });

      const pos = spatialIndex.getEntityPosition(1);
      expect(pos).toEqual({ x: 25, y: 0, z: 25 });
    });

    it('should list all tracked entities', () => {
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });
      spatialIndex.updateEntity(2, { x: 10, y: 0, z: 0 });
      spatialIndex.updateEntity(3, { x: 20, y: 0, z: 0 });

      const entities = spatialIndex.getAllEntities();
      expect(entities).toHaveLength(3);
      expect(entities).toContain(1);
      expect(entities).toContain(2);
      expect(entities).toContain(3);
    });
  });

  describe('bounding box queries', () => {
    beforeEach(() => {
      // Create a grid of entities
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });
      spatialIndex.updateEntity(2, { x: 5, y: 0, z: 0 });
      spatialIndex.updateEntity(3, { x: 15, y: 0, z: 0 });
      spatialIndex.updateEntity(4, { x: 25, y: 0, z: 0 });
      spatialIndex.updateEntity(5, { x: 0, y: 10, z: 0 });
    });

    it('should query entities within bounds', () => {
      const bounds: IBounds = {
        min: { x: -5, y: -5, z: -5 },
        max: { x: 10, y: 5, z: 5 },
      };

      const results = spatialIndex.queryBounds(bounds);
      expect(results).toHaveLength(2);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should return empty array for empty region', () => {
      const bounds: IBounds = {
        min: { x: 100, y: 100, z: 100 },
        max: { x: 110, y: 110, z: 110 },
      };

      const results = spatialIndex.queryBounds(bounds);
      expect(results).toHaveLength(0);
    });

    it('should handle large bounding boxes', () => {
      const bounds: IBounds = {
        min: { x: -100, y: -100, z: -100 },
        max: { x: 100, y: 100, z: 100 },
      };

      const results = spatialIndex.queryBounds(bounds);
      expect(results).toHaveLength(5);
    });

    it('should handle exact boundary cases', () => {
      const bounds: IBounds = {
        min: { x: 15, y: 0, z: 0 },
        max: { x: 15, y: 0, z: 0 },
      };

      const results = spatialIndex.queryBounds(bounds);
      expect(results).toHaveLength(1);
      expect(results).toContain(3);
    });
  });

  describe('radius queries', () => {
    beforeEach(() => {
      // Create entities in a circular pattern
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 }); // Center
      spatialIndex.updateEntity(2, { x: 5, y: 0, z: 0 }); // 5 units away
      spatialIndex.updateEntity(3, { x: 10, y: 0, z: 0 }); // 10 units away
      spatialIndex.updateEntity(4, { x: 15, y: 0, z: 0 }); // 15 units away
      spatialIndex.updateEntity(5, { x: 0, y: 8, z: 0 }); // ~8 units away (y-axis)
    });

    it('should query entities within radius', () => {
      const results = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 10);
      expect(results).toHaveLength(4);
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3); // Exactly 10 units away - included
      expect(results).toContain(5);
    });

    it('should handle small radius', () => {
      const results = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 3);
      expect(results).toHaveLength(1);
      expect(results).toContain(1);
    });

    it('should handle large radius', () => {
      const results = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 50);
      expect(results).toHaveLength(5);
    });

    it('should query from non-origin point', () => {
      const results = spatialIndex.queryRadius({ x: 10, y: 0, z: 0 }, 5);
      expect(results).toContain(2);
      expect(results).toContain(3);
    });
  });

  describe('performance and scalability', () => {
    it('should handle many entities efficiently', () => {
      // Add 1000 entities in a 100x100 grid
      const entityCount = 1000;
      const gridSize = 100;

      for (let i = 0; i < entityCount; i++) {
        const x = (i % gridSize) * 2;
        const z = Math.floor(i / gridSize) * 2;
        spatialIndex.updateEntity(i, { x, y: 0, z });
      }

      expect(spatialIndex.getAllEntities()).toHaveLength(entityCount);

      // Query a small region - should be fast
      const results = spatialIndex.queryBounds({
        min: { x: 0, y: -10, z: 0 },
        max: { x: 20, y: 10, z: 20 },
      });

      // Should find entities in a 10x10 area
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(entityCount);
    });

    it('should handle entity movement between cells', () => {
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });

      // Move entity across multiple cells
      spatialIndex.updateEntity(1, { x: 50, y: 0, z: 0 });
      spatialIndex.updateEntity(1, { x: 100, y: 0, z: 0 });

      // Should only find entity in final location
      const results = spatialIndex.queryRadius({ x: 100, y: 0, z: 0 }, 10);
      expect(results).toContain(1);

      const oldResults = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 10);
      expect(oldResults).not.toContain(1);
    });
  });

  describe('edge cases', () => {
    it('should handle negative coordinates', () => {
      spatialIndex.updateEntity(1, { x: -10, y: -10, z: -10 });
      spatialIndex.updateEntity(2, { x: -5, y: -5, z: -5 });

      const results = spatialIndex.queryRadius({ x: -10, y: -10, z: -10 }, 10);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should handle zero radius', () => {
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });
      spatialIndex.updateEntity(2, { x: 1, y: 0, z: 0 });

      const results = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 0);
      expect(results).toHaveLength(1);
      expect(results).toContain(1);
    });

    it('should handle clearing index', () => {
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });
      spatialIndex.updateEntity(2, { x: 10, y: 0, z: 0 });

      spatialIndex.clear();

      expect(spatialIndex.getAllEntities()).toHaveLength(0);
      expect(spatialIndex.hasEntity(1)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should provide accurate stats', () => {
      spatialIndex.updateEntity(1, { x: 0, y: 0, z: 0 });
      spatialIndex.updateEntity(2, { x: 0, y: 0, z: 1 });
      spatialIndex.updateEntity(3, { x: 20, y: 0, z: 0 });

      const stats = spatialIndex.getStats();
      expect(stats.totalEntities).toBe(3);
      expect(stats.cellSize).toBe(10);
      expect(stats.totalCells).toBeGreaterThan(0);
    });
  });
});
