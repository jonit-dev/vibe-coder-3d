/**
 * Pooled Vector3 for efficient temporary vector operations
 */

import { ObjectPool } from './ObjectPool';
import type { IPoolable } from './ObjectPool';

export interface IVector3Pooled extends IPoolable {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): this;
  copy(v: IVector3Pooled): this;
  add(v: IVector3Pooled): this;
  sub(v: IVector3Pooled): this;
  length(): number;
  distanceTo(v: IVector3Pooled): number;
}

class PooledVector3 implements IVector3Pooled {
  public x = 0;
  public y = 0;
  public z = 0;

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: IVector3Pooled): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: IVector3Pooled): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: IVector3Pooled): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  distanceTo(v: IVector3Pooled): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}

/**
 * Global Vector3 pool for temporary calculations
 * Use acquire() to get a vector, and always release() when done
 */
export const Vector3Pool = new ObjectPool<IVector3Pooled>({
  create: () => new PooledVector3(),
  initialSize: 50,
  maxSize: 500,
});

/**
 * Helper to acquire a vector with initial values
 */
export function acquireVector3(x = 0, y = 0, z = 0): IVector3Pooled {
  const v = Vector3Pool.acquire();
  v.set(x, y, z);
  return v;
}

/**
 * Helper to release a vector back to the pool
 */
export function releaseVector3(v: IVector3Pooled): void {
  Vector3Pool.release(v);
}

/**
 * Execute a function with pooled vectors and auto-release
 * Usage:
 * ```typescript
 * const distance = withPooledVectors((v1, v2) => {
 *   v1.set(0, 0, 0);
 *   v2.set(10, 0, 0);
 *   return v1.distanceTo(v2);
 * }, 2); // 2 vectors needed
 * ```
 */
export function withPooledVectors<T>(fn: (...vectors: IVector3Pooled[]) => T, count: number): T {
  const vectors: IVector3Pooled[] = [];

  try {
    // Acquire all vectors
    for (let i = 0; i < count; i++) {
      vectors.push(Vector3Pool.acquire());
    }

    // Execute function
    return fn(...vectors);
  } finally {
    // Always release vectors
    vectors.forEach((v) => Vector3Pool.release(v));
  }
}
