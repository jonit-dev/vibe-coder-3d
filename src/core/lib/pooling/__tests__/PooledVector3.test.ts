import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3Pool, acquireVector3, releaseVector3, withPooledVectors } from '../PooledVector3';
import type { IVector3Pooled } from '../PooledVector3';

describe('PooledVector3', () => {
  beforeEach(() => {
    // Clear pool and reset stats
    Vector3Pool.clear();
    Vector3Pool.resetStats();
    Vector3Pool.grow(50); // Reset to initial size
  });

  describe('Vector3Pool', () => {
    it('should have initial size', () => {
      expect(Vector3Pool.getSize()).toBe(50);
    });

    it('should acquire and release vectors', () => {
      const v = Vector3Pool.acquire();
      expect(v).toBeDefined();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);

      Vector3Pool.release(v);
      expect(Vector3Pool.getSize()).toBe(50);
    });

    it('should reset vectors on release', () => {
      const v = Vector3Pool.acquire();
      v.set(10, 20, 30);
      expect(v.x).toBe(10);

      Vector3Pool.release(v);

      const v2 = Vector3Pool.acquire();
      expect(v2.x).toBe(0); // Should be reset
      expect(v2.y).toBe(0);
      expect(v2.z).toBe(0);

      Vector3Pool.release(v2);
    });
  });

  describe('acquireVector3 helper', () => {
    it('should acquire vector with default values', () => {
      const v = acquireVector3();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
      releaseVector3(v);
    });

    it('should acquire vector with custom values', () => {
      const v = acquireVector3(1, 2, 3);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
      releaseVector3(v);
    });
  });

  describe('IVector3Pooled operations', () => {
    it('should set values', () => {
      const v = acquireVector3();
      v.set(5, 10, 15);
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
      expect(v.z).toBe(15);
      releaseVector3(v);
    });

    it('should copy from another vector', () => {
      const v1 = acquireVector3(1, 2, 3);
      const v2 = acquireVector3();
      v2.copy(v1);

      expect(v2.x).toBe(1);
      expect(v2.y).toBe(2);
      expect(v2.z).toBe(3);

      releaseVector3(v1);
      releaseVector3(v2);
    });

    it('should add vectors', () => {
      const v1 = acquireVector3(1, 2, 3);
      const v2 = acquireVector3(4, 5, 6);
      v1.add(v2);

      expect(v1.x).toBe(5);
      expect(v1.y).toBe(7);
      expect(v1.z).toBe(9);

      releaseVector3(v1);
      releaseVector3(v2);
    });

    it('should subtract vectors', () => {
      const v1 = acquireVector3(10, 20, 30);
      const v2 = acquireVector3(1, 2, 3);
      v1.sub(v2);

      expect(v1.x).toBe(9);
      expect(v1.y).toBe(18);
      expect(v1.z).toBe(27);

      releaseVector3(v1);
      releaseVector3(v2);
    });

    it('should calculate length', () => {
      const v = acquireVector3(3, 4, 0);
      const length = v.length();
      expect(length).toBe(5); // 3-4-5 triangle

      releaseVector3(v);
    });

    it('should calculate distance to another vector', () => {
      const v1 = acquireVector3(0, 0, 0);
      const v2 = acquireVector3(3, 4, 0);
      const distance = v1.distanceTo(v2);
      expect(distance).toBe(5);

      releaseVector3(v1);
      releaseVector3(v2);
    });
  });

  describe('withPooledVectors helper', () => {
    it('should auto-release vectors after use', () => {
      const initialSize = Vector3Pool.getSize();

      const result = withPooledVectors((v1, v2) => {
        v1.set(1, 0, 0);
        v2.set(0, 1, 0);
        return v1.distanceTo(v2);
      }, 2);

      expect(result).toBeCloseTo(Math.sqrt(2));
      expect(Vector3Pool.getSize()).toBe(initialSize); // Vectors returned
    });

    it('should handle single vector', () => {
      const result = withPooledVectors((v) => {
        v.set(3, 4, 0);
        return v.length();
      }, 1);

      expect(result).toBe(5);
    });

    it('should handle many vectors', () => {
      const result = withPooledVectors((...vectors) => {
        return vectors.length;
      }, 10);

      expect(result).toBe(10);
    });

    it('should release vectors even on error', () => {
      const initialSize = Vector3Pool.getSize();

      expect(() => {
        withPooledVectors((v) => {
          v.set(1, 2, 3);
          throw new Error('Test error');
        }, 1);
      }).toThrow('Test error');

      // Vector should still be released
      expect(Vector3Pool.getSize()).toBe(initialSize);
    });
  });

  describe('performance', () => {
    it('should handle many acquire/release cycles efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        const v = acquireVector3(i, i * 2, i * 3);
        v.length();
        releaseVector3(v);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);

      const stats = Vector3Pool.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.9); // High hit rate
    });

    it('should handle concurrent vectors', () => {
      const vectors: IVector3Pooled[] = [];

      // Acquire many vectors
      for (let i = 0; i < 100; i++) {
        vectors.push(acquireVector3(i, i, i));
      }

      expect(Vector3Pool.getStats().activeCount).toBe(100);

      // Release all
      vectors.forEach((v) => releaseVector3(v));

      expect(Vector3Pool.getStats().activeCount).toBe(0);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support distance calculations', () => {
      const result = withPooledVectors((a, b) => {
        a.set(0, 0, 0);
        b.set(10, 0, 0);
        return a.distanceTo(b);
      }, 2);

      expect(result).toBe(10);
    });

    it('should support vector arithmetic', () => {
      const result = withPooledVectors((a, b, c) => {
        a.set(1, 2, 3);
        b.set(4, 5, 6);
        c.copy(a).add(b);
        return c.length();
      }, 3);

      // (1+4)² + (2+5)² + (3+6)² = 25 + 49 + 81 = 155
      expect(result).toBeCloseTo(Math.sqrt(155));
    });

    it('should support temporary calculations without memory pressure', () => {
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        withPooledVectors((v1, v2, v3) => {
          v1.set(Math.random(), Math.random(), Math.random());
          v2.set(Math.random(), Math.random(), Math.random());
          v3.copy(v1).add(v2);
          return v3.length();
        }, 3);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be fast

      const stats = Vector3Pool.getStats();
      expect(stats.totalAcquired).toBe(iterations * 3);
      expect(stats.activeCount).toBe(0); // All released
    });
  });
});
