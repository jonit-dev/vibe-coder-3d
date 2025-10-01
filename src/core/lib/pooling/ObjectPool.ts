/**
 * Generic Object Pool for memory-efficient object reuse
 * Reduces GC pressure by reusing objects instead of creating/destroying them
 */

export interface IPoolable {
  /**
   * Reset object state when returned to pool
   */
  reset?(): void;
}

export interface IObjectPoolConfig<T> {
  /**
   * Factory function to create new instances
   */
  create: () => T;

  /**
   * Optional reset function to clean up objects before reuse
   */
  reset?: (obj: T) => void;

  /**
   * Initial pool size
   */
  initialSize?: number;

  /**
   * Maximum pool size (prevents unbounded growth)
   */
  maxSize?: number;

  /**
   * Enable debug logging
   */
  enableDebugLogging?: boolean;
}

export interface IObjectPoolStats {
  totalCreated: number;
  totalAcquired: number;
  totalReleased: number;
  currentSize: number;
  activeCount: number;
  hitRate: number;
}

/**
 * ObjectPool - Generic pool for reusable objects
 *
 * Features:
 * - Automatic growth up to max size
 * - Optional reset function for object cleanup
 * - Statistics tracking for performance monitoring
 * - Type-safe generic implementation
 *
 * Usage:
 * ```typescript
 * const vectorPool = new ObjectPool({
 *   create: () => new Vector3(),
 *   reset: (v) => v.set(0, 0, 0),
 *   initialSize: 50,
 *   maxSize: 500
 * });
 *
 * const v = vectorPool.acquire();
 * // ... use vector
 * vectorPool.release(v);
 * ```
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private config: Required<IObjectPoolConfig<T>>;
  private stats = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
    poolHits: 0,
  };

  constructor(config: IObjectPoolConfig<T>) {
    this.config = {
      create: config.create,
      reset: config.reset || (() => {}),
      initialSize: config.initialSize ?? 10,
      maxSize: config.maxSize ?? 1000,
      enableDebugLogging: config.enableDebugLogging ?? false,
    };

    // Pre-populate pool
    this.grow(this.config.initialSize);

    if (this.config.enableDebugLogging) {
      console.log(`[ObjectPool] Created with initial size: ${this.config.initialSize}`);
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    this.stats.totalAcquired++;

    let obj: T | undefined = this.pool.pop();

    if (obj) {
      this.stats.poolHits++;
      if (this.config.enableDebugLogging) {
        console.log(`[ObjectPool] Acquired from pool (size: ${this.pool.length})`);
      }
    } else {
      // Pool is empty, create new object
      obj = this.config.create();
      this.stats.totalCreated++;
      if (this.config.enableDebugLogging) {
        console.log('[ObjectPool] Pool empty, creating new object');
      }
    }

    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    this.stats.totalReleased++;

    // Check if pool is at max size
    if (this.pool.length >= this.config.maxSize) {
      if (this.config.enableDebugLogging) {
        console.log('[ObjectPool] Pool at max size, discarding object');
      }
      return;
    }

    // Reset object state if reset function exists
    this.config.reset(obj);

    // Support IPoolable interface
    if (
      obj !== null &&
      typeof obj === 'object' &&
      'reset' in obj &&
      typeof (obj as any).reset === 'function'
    ) {
      (obj as any).reset();
    }

    this.pool.push(obj);

    if (this.config.enableDebugLogging) {
      console.log(`[ObjectPool] Released to pool (size: ${this.pool.length})`);
    }
  }

  /**
   * Pre-allocate objects in the pool
   */
  grow(count: number): void {
    const newSize = Math.min(this.pool.length + count, this.config.maxSize);
    const toCreate = newSize - this.pool.length;

    for (let i = 0; i < toCreate; i++) {
      const obj = this.config.create();
      this.pool.push(obj);
      this.stats.totalCreated++;
    }

    if (this.config.enableDebugLogging) {
      console.log(`[ObjectPool] Grew by ${toCreate} to size ${this.pool.length}`);
    }
  }

  /**
   * Shrink pool to target size (releases excess objects)
   */
  shrink(targetSize: number): void {
    const toRemove = Math.max(0, this.pool.length - targetSize);
    this.pool.splice(0, toRemove);

    if (this.config.enableDebugLogging) {
      console.log(`[ObjectPool] Shrunk by ${toRemove} to size ${this.pool.length}`);
    }
  }

  /**
   * Clear all objects from pool
   */
  clear(): void {
    this.pool = [];

    if (this.config.enableDebugLogging) {
      console.log('[ObjectPool] Cleared all objects');
    }
  }

  /**
   * Get current pool size (available objects)
   */
  getSize(): number {
    return this.pool.length;
  }

  /**
   * Get pool statistics
   */
  getStats(): IObjectPoolStats {
    const hitRate =
      this.stats.totalAcquired > 0 ? this.stats.poolHits / this.stats.totalAcquired : 0;

    return {
      totalCreated: this.stats.totalCreated,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      currentSize: this.pool.length,
      activeCount: this.stats.totalAcquired - this.stats.totalReleased,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalCreated: 0,
      totalAcquired: 0,
      totalReleased: 0,
      poolHits: 0,
    };
  }
}
