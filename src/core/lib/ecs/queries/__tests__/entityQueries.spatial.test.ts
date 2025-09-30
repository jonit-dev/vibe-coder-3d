import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityQueries } from '../entityQueries';
import type { IBounds, IVector3 } from '../entityQueries';

describe('EntityQueries - Spatial Integration', () => {
  beforeEach(() => {
    // Reset store between tests
    const { spatialIndex } = useEntityQueries.getState();
    spatialIndex.clear();
  });

  describe('spatial index integration', () => {
    it('should have spatialIndex instance', () => {
      const { spatialIndex } = useEntityQueries.getState();
      expect(spatialIndex).toBeDefined();
      expect(spatialIndex.getStats).toBeDefined();
    });

    it('should expose spatial query methods', () => {
      const queries = useEntityQueries.getState();
      expect(queries.querySpatialBounds).toBeDefined();
      expect(queries.querySpatialRadius).toBeDefined();
      expect(queries.updateEntityPosition).toBeDefined();
    });
  });

  describe('updateEntityPosition', () => {
    it('should update entity position in spatial index', () => {
      const queries = useEntityQueries.getState();
      const position: IVector3 = { x: 10, y: 5, z: 15 };

      queries.updateEntityPosition(1, position);

      const tracked = queries.spatialIndex.getEntityPosition(1);
      expect(tracked).toEqual(position);
    });

    it('should track multiple entities', () => {
      const queries = useEntityQueries.getState();

      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 10, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 20, y: 0, z: 0 });

      expect(queries.spatialIndex.hasEntity(1)).toBe(true);
      expect(queries.spatialIndex.hasEntity(2)).toBe(true);
      expect(queries.spatialIndex.hasEntity(3)).toBe(true);
    });

    it('should update entity position when called multiple times', () => {
      const queries = useEntityQueries.getState();

      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(1, { x: 50, y: 0, z: 0 });

      const pos = queries.spatialIndex.getEntityPosition(1);
      expect(pos).toEqual({ x: 50, y: 0, z: 0 });
    });
  });

  describe('querySpatialBounds', () => {
    beforeEach(() => {
      const queries = useEntityQueries.getState();
      // Set up a grid of entities
      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 5, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 15, y: 0, z: 0 });
      queries.updateEntityPosition(4, { x: 25, y: 0, z: 0 });
    });

    it('should query entities within bounding box', () => {
      const queries = useEntityQueries.getState();
      const bounds: IBounds = {
        min: { x: -5, y: -5, z: -5 },
        max: { x: 10, y: 5, z: 5 },
      };

      const results = queries.querySpatialBounds(bounds);

      expect(results).toHaveLength(2);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should return empty array for empty region', () => {
      const queries = useEntityQueries.getState();
      const bounds: IBounds = {
        min: { x: 100, y: 100, z: 100 },
        max: { x: 110, y: 110, z: 110 },
      };

      const results = queries.querySpatialBounds(bounds);
      expect(results).toHaveLength(0);
    });

    it('should find all entities in large bounds', () => {
      const queries = useEntityQueries.getState();
      const bounds: IBounds = {
        min: { x: -100, y: -100, z: -100 },
        max: { x: 100, y: 100, z: 100 },
      };

      const results = queries.querySpatialBounds(bounds);
      expect(results).toHaveLength(4);
    });
  });

  describe('querySpatialRadius', () => {
    beforeEach(() => {
      const queries = useEntityQueries.getState();
      // Set up entities in a pattern
      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 5, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 10, y: 0, z: 0 });
      queries.updateEntityPosition(4, { x: 20, y: 0, z: 0 });
    });

    it('should query entities within radius from center', () => {
      const queries = useEntityQueries.getState();
      const center: IVector3 = { x: 0, y: 0, z: 0 };

      const results = queries.querySpatialRadius(center, 10);

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should handle small radius', () => {
      const queries = useEntityQueries.getState();
      const center: IVector3 = { x: 0, y: 0, z: 0 };

      const results = queries.querySpatialRadius(center, 2);

      expect(results).toHaveLength(1);
      expect(results).toContain(1);
    });

    it('should query from non-origin center', () => {
      const queries = useEntityQueries.getState();
      const center: IVector3 = { x: 10, y: 0, z: 0 };

      const results = queries.querySpatialRadius(center, 6);

      expect(results).toContain(2);
      expect(results).toContain(3);
    });

    it('should handle large radius', () => {
      const queries = useEntityQueries.getState();
      const center: IVector3 = { x: 0, y: 0, z: 0 };

      const results = queries.querySpatialRadius(center, 100);

      expect(results).toHaveLength(4);
    });
  });

  describe('integration with component queries', () => {
    it('should work alongside component index queries', () => {
      const queries = useEntityQueries.getState();

      // Update spatial positions
      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 10, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 20, y: 0, z: 0 });

      // Spatial query should work
      const nearby = queries.querySpatialRadius({ x: 0, y: 0, z: 0 }, 12);
      expect(nearby).toContain(1);
      expect(nearby).toContain(2);

      // Component queries should still work
      expect(queries.getComponentTypes).toBeDefined();
      expect(queries.listAllEntities).toBeDefined();
    });
  });

  describe('performance with many entities', () => {
    it('should handle hundreds of entities efficiently', () => {
      const queries = useEntityQueries.getState();
      const entityCount = 500;

      // Add many entities in a grid
      for (let i = 0; i < entityCount; i++) {
        const x = (i % 50) * 5;
        const z = Math.floor(i / 50) * 5;
        queries.updateEntityPosition(i, { x, y: 0, z });
      }

      // Query a small region should be fast
      const start = performance.now();
      const results = queries.querySpatialBounds({
        min: { x: 0, y: -10, z: 0 },
        max: { x: 25, y: 10, z: 25 },
      });
      const duration = performance.now() - start;

      // Should complete in less than 10ms
      expect(duration).toBeLessThan(10);

      // Should find entities in the 5x5 area
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(entityCount);
    });
  });

  describe('statistics', () => {
    it('should provide spatial index stats', () => {
      const queries = useEntityQueries.getState();

      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 10, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 20, y: 0, z: 0 });

      const stats = queries.spatialIndex.getStats();

      expect(stats.totalEntities).toBe(3);
      expect(stats.cellSize).toBe(10);
      expect(stats.totalCells).toBeGreaterThan(0);
    });
  });
});
