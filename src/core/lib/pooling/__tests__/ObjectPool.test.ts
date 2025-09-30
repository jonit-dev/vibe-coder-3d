import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectPool } from '../ObjectPool';
import type { IPoolable } from '../ObjectPool';

// Test object types
interface ITestObject {
  id: number;
  value: string;
}

class PoolableTestObject implements IPoolable {
  public x = 0;
  public y = 0;

  reset(): void {
    this.x = 0;
    this.y = 0;
  }
}

describe('ObjectPool', () => {
  describe('basic operations', () => {
    it('should create pool with initial size', () => {
      const createFn = vi.fn(() => ({ id: 0, value: '' }));
      const pool = new ObjectPool<ITestObject>({
        create: createFn,
        initialSize: 5,
      });

      expect(createFn).toHaveBeenCalledTimes(5);
      expect(pool.getSize()).toBe(5);
    });

    it('should acquire objects from pool', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 1, value: 'test' }),
        initialSize: 3,
      });

      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(pool.getSize()).toBe(2);
    });

    it('should release objects back to pool', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 1, value: 'test' }),
        initialSize: 3,
      });

      const obj = pool.acquire();
      expect(pool.getSize()).toBe(2);

      pool.release(obj);
      expect(pool.getSize()).toBe(3);
    });

    it('should create new objects when pool is empty', () => {
      const createFn = vi.fn(() => ({ id: 0, value: '' }));
      const pool = new ObjectPool<ITestObject>({
        create: createFn,
        initialSize: 2,
      });

      expect(createFn).toHaveBeenCalledTimes(2);

      // Acquire all objects from pool
      pool.acquire();
      pool.acquire();
      expect(pool.getSize()).toBe(0);

      // Should create new object
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(createFn).toHaveBeenCalledTimes(3);
    });

    it('should reuse released objects', () => {
      const createFn = vi.fn(() => ({ id: 0, value: '' }));
      const pool = new ObjectPool<ITestObject>({
        create: createFn,
        initialSize: 1,
      });

      const obj1 = pool.acquire();
      pool.release(obj1);

      const obj2 = pool.acquire();
      expect(obj2).toBe(obj1); // Same object reused
      expect(createFn).toHaveBeenCalledTimes(1); // No new creation
    });
  });

  describe('reset functionality', () => {
    it('should call reset function on release', () => {
      const resetFn = vi.fn();
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 1, value: 'test' }),
        reset: resetFn,
        initialSize: 0,
      });

      const obj = pool.acquire();
      pool.release(obj);

      expect(resetFn).toHaveBeenCalledWith(obj);
    });

    it('should call IPoolable.reset() method if exists', () => {
      const pool = new ObjectPool<PoolableTestObject>({
        create: () => new PoolableTestObject(),
        initialSize: 0,
      });

      const obj = pool.acquire();
      obj.x = 10;
      obj.y = 20;

      pool.release(obj);

      // Object should be reset by its reset() method
      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
    });

    it('should call both custom reset and IPoolable.reset()', () => {
      const customReset = vi.fn();
      const pool = new ObjectPool<PoolableTestObject>({
        create: () => new PoolableTestObject(),
        reset: customReset,
        initialSize: 0,
      });

      const obj = pool.acquire();
      obj.x = 10;

      pool.release(obj);

      expect(customReset).toHaveBeenCalledWith(obj);
      expect(obj.x).toBe(0); // IPoolable.reset() also called
    });
  });

  describe('size management', () => {
    it('should enforce max size', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
        maxSize: 5,
      });

      expect(pool.getSize()).toBe(5);

      // Acquire and release should not grow beyond maxSize
      const obj = pool.acquire();
      const newObj = { id: 99, value: 'extra' };
      pool.release(obj);
      pool.release(newObj);

      expect(pool.getSize()).toBe(5); // Still at max
    });

    it('should grow pool on demand', () => {
      const createFn = vi.fn(() => ({ id: 0, value: '' }));
      const pool = new ObjectPool<ITestObject>({
        create: createFn,
        initialSize: 2,
        maxSize: 10,
      });

      expect(createFn).toHaveBeenCalledTimes(2);

      pool.grow(5);
      expect(pool.getSize()).toBe(7);
      expect(createFn).toHaveBeenCalledTimes(7);
    });

    it('should not grow beyond max size', () => {
      const createFn = vi.fn(() => ({ id: 0, value: '' }));
      const pool = new ObjectPool<ITestObject>({
        create: createFn,
        initialSize: 5,
        maxSize: 10,
      });

      pool.grow(20); // Try to grow by 20
      expect(pool.getSize()).toBe(10); // Should cap at maxSize
      expect(createFn).toHaveBeenCalledTimes(10);
    });

    it('should shrink pool to target size', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 10,
      });

      expect(pool.getSize()).toBe(10);

      pool.shrink(5);
      expect(pool.getSize()).toBe(5);
    });

    it('should not shrink below zero', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
      });

      pool.shrink(-5);
      expect(pool.getSize()).toBe(0);
    });

    it('should clear all objects', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 10,
      });

      pool.clear();
      expect(pool.getSize()).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track total created', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
      });

      const stats = pool.getStats();
      expect(stats.totalCreated).toBe(5);

      // Acquire beyond initial size
      for (let i = 0; i < 7; i++) {
        pool.acquire();
      }

      const stats2 = pool.getStats();
      expect(stats2.totalCreated).toBe(7); // 5 initial + 2 new
    });

    it('should track total acquired and released', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
      });

      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      pool.release(obj1);

      const stats = pool.getStats();
      expect(stats.totalAcquired).toBe(2);
      expect(stats.totalReleased).toBe(1);
      expect(stats.activeCount).toBe(1);
    });

    it('should calculate hit rate', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 3,
      });

      // 3 acquires from pool (hits)
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      const obj3 = pool.acquire();

      // 1 acquire creates new (miss)
      const obj4 = pool.acquire();

      const stats = pool.getStats();
      expect(stats.totalAcquired).toBe(4);
      expect(stats.hitRate).toBe(0.75); // 3/4 = 75%

      pool.release(obj1);
      pool.release(obj2);
      pool.release(obj3);
      pool.release(obj4);
    });

    it('should track current size and active count', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
      });

      const obj1 = pool.acquire();
      const obj2 = pool.acquire();

      const stats = pool.getStats();
      expect(stats.currentSize).toBe(3); // 5 - 2 acquired
      expect(stats.activeCount).toBe(2); // 2 acquired, 0 released

      pool.release(obj1);

      const stats2 = pool.getStats();
      expect(stats2.currentSize).toBe(4); // 3 + 1 released
      expect(stats2.activeCount).toBe(1); // 2 acquired, 1 released

      pool.release(obj2);
    });

    it('should reset statistics', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 5,
      });

      pool.acquire();
      pool.acquire();

      expect(pool.getStats().totalAcquired).toBe(2);

      pool.resetStats();

      const stats = pool.getStats();
      expect(stats.totalCreated).toBe(0);
      expect(stats.totalAcquired).toBe(0);
      expect(stats.totalReleased).toBe(0);
    });
  });

  describe('performance', () => {
    it('should handle many acquire/release cycles efficiently', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 100,
        maxSize: 200,
      });

      const start = performance.now();

      // Perform 1000 acquire/release cycles
      for (let i = 0; i < 1000; i++) {
        const obj = pool.acquire();
        pool.release(obj);
      }

      const duration = performance.now() - start;

      // Should complete in less than 10ms
      expect(duration).toBeLessThan(10);

      const stats = pool.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.9); // High hit rate
    });

    it('should handle many concurrent objects', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 10,
        maxSize: 500,
      });

      // Acquire 200 objects
      const objects: ITestObject[] = [];
      for (let i = 0; i < 200; i++) {
        objects.push(pool.acquire());
      }

      expect(pool.getStats().activeCount).toBe(200);

      // Release all
      objects.forEach((obj) => pool.release(obj));

      expect(pool.getStats().activeCount).toBe(0);
      expect(pool.getSize()).toBeLessThanOrEqual(500); // Capped at maxSize
    });
  });

  describe('edge cases', () => {
    it('should handle zero initial size', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 0,
      });

      expect(pool.getSize()).toBe(0);

      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(pool.getStats().totalCreated).toBe(1);

      pool.release(obj);
    });

    it('should handle releasing same object multiple times', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 1,
        maxSize: 3,
      });

      const obj = pool.acquire();

      pool.release(obj);
      pool.release(obj);
      pool.release(obj);

      expect(pool.getSize()).toBe(3); // Capped at maxSize
    });

    it('should handle releasing foreign objects', () => {
      const pool = new ObjectPool<ITestObject>({
        create: () => ({ id: 0, value: '' }),
        initialSize: 1,
        maxSize: 5,
      });

      const foreignObj = { id: 99, value: 'foreign' };
      pool.release(foreignObj);

      expect(pool.getSize()).toBe(2); // 1 initial + 1 foreign
    });
  });
});
