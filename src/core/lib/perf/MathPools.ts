/**
 * Specialized object pools for Three.js math objects
 * Provides reset functions for proper cleanup and reuse
 */

import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { ObjectPool } from './ObjectPool';

// Vector3 pool with reset function
export const vector3Pool = new ObjectPool<Vector3>(() => new Vector3(), {
  reset: (v: Vector3) => v.set(0, 0, 0),
  initialSize: 100,
  maxSize: 1000,
});

// Quaternion pool with reset function
export const quaternionPool = new ObjectPool<Quaternion>(() => new Quaternion(), {
  reset: (q: Quaternion) => q.set(0, 0, 0, 1),
  initialSize: 50,
  maxSize: 500,
});

// Euler pool with reset function
export const eulerPool = new ObjectPool<Euler>(() => new Euler(), {
  reset: (e: Euler) => e.set(0, 0, 0),
  initialSize: 50,
  maxSize: 500,
});

// Matrix4 pool with reset function
export const matrix4Pool = new ObjectPool<Matrix4>(() => new Matrix4(), {
  reset: (m: Matrix4) => m.identity(),
  initialSize: 20,
  maxSize: 200,
});

// Array pool for temporary arrays (common in transform calculations)
export const arrayPool = new ObjectPool<number[]>(() => [], {
  reset: (arr: number[]) => (arr.length = 0),
  initialSize: 50,
  maxSize: 500,
});

// Float32Array pool for vertex data and other numeric arrays
export const float32ArrayPool = new ObjectPool<Float32Array>(() => new Float32Array(0), {
  reset: (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _arr: Float32Array,
  ) => {
    // For Float32Array, we create a new one since we can't easily resize
    // This is still better than creating new ones every time
  },
  initialSize: 20,
  maxSize: 200,
});

// Helper function to create a Float32Array of specific size
export function acquireFloat32Array(size: number): Float32Array {
  let arr = float32ArrayPool.acquire();

  // If the array is the wrong size, create a new one
  if (arr.length !== size) {
    float32ArrayPool.release(arr);
    arr = new Float32Array(size);
  }

  return arr;
}

// Helper function to release a Float32Array
export function releaseFloat32Array(arr: Float32Array): void {
  float32ArrayPool.release(arr);
}

// Helper functions for common vector operations using pools
export function acquireVector3(x = 0, y = 0, z = 0): Vector3 {
  const v = vector3Pool.acquire();
  v.set(x, y, z);
  return v;
}

export function releaseVector3(v: Vector3): void {
  vector3Pool.release(v);
}

export function acquireQuaternion(x = 0, y = 0, z = 0, w = 1): Quaternion {
  const q = quaternionPool.acquire();
  q.set(x, y, z, w);
  return q;
}

export function releaseQuaternion(q: Quaternion): void {
  quaternionPool.release(q);
}

export function acquireEuler(x = 0, y = 0, z = 0): Euler {
  const e = eulerPool.acquire();
  e.set(x, y, z);
  return e;
}

export function releaseEuler(e: Euler): void {
  eulerPool.release(e);
}

export function acquireMatrix4(): Matrix4 {
  const m = matrix4Pool.acquire();
  m.identity();
  return m;
}

export function releaseMatrix4(m: Matrix4): void {
  matrix4Pool.release(m);
}

// Utility function to release multiple objects at once
export function releaseMultiple<T extends unknown[]>(pool: ObjectPool<T>, ...items: T[]): void {
  items.forEach((item) => pool.release(item));
}
