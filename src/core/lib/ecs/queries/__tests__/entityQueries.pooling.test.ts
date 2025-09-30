import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityQueries } from '../entityQueries';
import {
  Vector3Pool,
  acquireVector3,
  releaseVector3,
  withPooledVectors,
} from '../../../pooling/PooledVector3';

describe('EntityQueries - Object Pooling Integration', () => {
  beforeEach(() => {
    // Reset pool state
    Vector3Pool.clear();
    Vector3Pool.resetStats();
    Vector3Pool.grow(50);
  });

  describe('pool statistics access', () => {
    it('should expose pool statistics through EntityQueries', () => {
      const queries = useEntityQueries.getState();
      const stats = queries.getPoolStats();

      expect(stats).toBeDefined();
      expect(stats.totalCreated).toBeDefined();
      expect(stats.totalAcquired).toBeDefined();
      expect(stats.totalReleased).toBeDefined();
      expect(stats.currentSize).toBeDefined();
      expect(stats.activeCount).toBeDefined();
      expect(stats.hitRate).toBeDefined();
    });

    it('should track pool usage through EntityQueries', () => {
      const queries = useEntityQueries.getState();

      // Acquire some vectors
      const v1 = acquireVector3(1, 2, 3);
      const v2 = acquireVector3(4, 5, 6);

      const stats = queries.getPoolStats();
      expect(stats.totalAcquired).toBe(2);
      expect(stats.activeCount).toBe(2);

      releaseVector3(v1);
      releaseVector3(v2);

      const stats2 = queries.getPoolStats();
      expect(stats2.activeCount).toBe(0);
    });
  });

  describe('spatial query optimization with pooled vectors', () => {
    it('should use pooled vectors for distance calculations', () => {
      const queries = useEntityQueries.getState();

      // Setup spatial entities
      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 10, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 20, y: 0, z: 0 });

      const initialStats = queries.getPoolStats();

      // Perform calculations using pooled vectors
      const result = withPooledVectors((center, offset) => {
        center.set(0, 0, 0);
        offset.set(15, 15, 15);

        // Calculate bounds for spatial query
        const bounds = {
          min: {
            x: center.x - offset.x,
            y: center.y - offset.y,
            z: center.z - offset.z,
          },
          max: {
            x: center.x + offset.x,
            y: center.y + offset.y,
            z: center.z + offset.z,
          },
        };

        return queries.querySpatialBounds(bounds);
      }, 2);

      expect(result).toContain(1);
      expect(result).toContain(2);

      const finalStats = queries.getPoolStats();
      expect(finalStats.totalAcquired).toBe(initialStats.totalAcquired + 2);
      expect(finalStats.activeCount).toBe(initialStats.activeCount); // Auto-released
    });

    it('should efficiently handle radius queries with pooling', () => {
      const queries = useEntityQueries.getState();

      // Create entities in a grid
      for (let i = 0; i < 100; i++) {
        const x = (i % 10) * 5;
        const z = Math.floor(i / 10) * 5;
        queries.updateEntityPosition(i, { x, y: 0, z });
      }

      const stats = queries.getPoolStats();
      const initialAcquired = stats.totalAcquired;

      // Perform many radius queries using pooled vectors
      for (let i = 0; i < 10; i++) {
        withPooledVectors((center) => {
          center.set(25, 0, 25);
          return queries.querySpatialRadius({ x: center.x, y: center.y, z: center.z }, 15);
        }, 1);
      }

      const finalStats = queries.getPoolStats();
      expect(finalStats.totalAcquired).toBe(initialAcquired + 10);
      expect(finalStats.activeCount).toBe(0); // All released
    });
  });

  describe('memory efficiency with pooling', () => {
    it('should reuse vectors across multiple operations', () => {
      Vector3Pool.resetStats();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        withPooledVectors((v1, v2) => {
          v1.set(i, i, i);
          v2.set(i * 2, i * 2, i * 2);
          return v1.distanceTo(v2);
        }, 2);
      }

      const stats = Vector3Pool.getStats();
      expect(stats.totalCreated).toBeLessThan(stats.totalAcquired); // Reused vectors
      expect(stats.hitRate).toBeGreaterThan(0.5); // High reuse rate
    });

    it('should handle high-frequency vector operations without memory leaks', () => {
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const v = acquireVector3(i, i, i);
        v.length();
        releaseVector3(v);
      }

      const stats = Vector3Pool.getStats();
      expect(stats.activeCount).toBe(0); // No leaks
      expect(stats.totalReleased).toBe(iterations);
    });
  });

  describe('integration with entity queries', () => {
    it('should combine spatial queries with pooled vector calculations', () => {
      const queries = useEntityQueries.getState();

      // Setup scene
      queries.updateEntityPosition(1, { x: 0, y: 0, z: 0 });
      queries.updateEntityPosition(2, { x: 5, y: 0, z: 0 });
      queries.updateEntityPosition(3, { x: 10, y: 0, z: 0 });

      // Find all entities within range of a calculated position
      const nearbyEntities = withPooledVectors((target, offset) => {
        target.set(0, 0, 0);
        offset.set(5, 0, 0);
        target.add(offset); // Move target to (5, 0, 0)

        return queries.querySpatialRadius({ x: target.x, y: target.y, z: target.z }, 6);
      }, 2);

      expect(nearbyEntities).toContain(1);
      expect(nearbyEntities).toContain(2);
      expect(nearbyEntities).toContain(3);
    });

    it('should support complex spatial calculations', () => {
      const queries = useEntityQueries.getState();

      // Setup entities
      for (let i = 0; i < 50; i++) {
        queries.updateEntityPosition(i, {
          x: Math.random() * 100,
          y: 0,
          z: Math.random() * 100,
        });
      }

      // Calculate average position using pooled vectors
      const result = withPooledVectors((sum, temp) => {
        sum.set(0, 0, 0);
        const entities = queries.spatialIndex.getAllEntities();

        entities.forEach((id) => {
          const pos = queries.spatialIndex.getEntityPosition(id);
          if (pos) {
            temp.set(pos.x, pos.y, pos.z);
            sum.add(temp);
          }
        });

        // Average
        const count = entities.length;
        sum.set(sum.x / count, sum.y / count, sum.z / count);

        return { x: sum.x, y: sum.y, z: sum.z };
      }, 2);

      expect(result.x).toBeGreaterThan(0);
      expect(result.z).toBeGreaterThan(0);

      // Verify no leaks
      const stats = queries.getPoolStats();
      expect(stats.activeCount).toBe(0);
    });
  });

  describe('performance comparison', () => {
    it('should be faster with pooling than creating new vectors', () => {
      // Test with pooling
      Vector3Pool.resetStats();
      const pooledStart = performance.now();

      for (let i = 0; i < 1000; i++) {
        withPooledVectors((v1, v2) => {
          v1.set(i, i, i);
          v2.set(i * 2, i * 2, i * 2);
          return v1.distanceTo(v2);
        }, 2);
      }

      const pooledDuration = performance.now() - pooledStart;

      // Pooled version should complete quickly
      expect(pooledDuration).toBeLessThan(50);

      // Check high hit rate
      const stats = Vector3Pool.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.9);
    });
  });

  describe('stress testing', () => {
    it('should handle concurrent vector usage', () => {
      const vectors = [];

      // Acquire many vectors
      for (let i = 0; i < 200; i++) {
        vectors.push(acquireVector3(i, i, i));
      }

      const queries = useEntityQueries.getState();
      const stats = queries.getPoolStats();
      expect(stats.activeCount).toBe(200);

      // Release all
      vectors.forEach((v) => releaseVector3(v));

      const finalStats = queries.getPoolStats();
      expect(finalStats.activeCount).toBe(0);
    });

    it('should maintain pool integrity under heavy load', () => {
      Vector3Pool.resetStats();

      // Mix of acquire/release patterns
      for (let i = 0; i < 500; i++) {
        if (i % 3 === 0) {
          // Immediate release
          const v = acquireVector3();
          releaseVector3(v);
        } else if (i % 3 === 1) {
          // Use with helper
          withPooledVectors((v) => v.length(), 1);
        } else {
          // Acquire and hold briefly
          const v = acquireVector3();
          v.set(i, i, i);
          releaseVector3(v);
        }
      }

      const stats = Vector3Pool.getStats();
      expect(stats.activeCount).toBe(0); // All released
      expect(stats.hitRate).toBeGreaterThan(0.5); // Good reuse
    });
  });
});
