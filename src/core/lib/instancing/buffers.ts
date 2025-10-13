/**
 * Instance Buffer Management
 * Handles efficient GPU buffer updates for instanced meshes
 */

import { Matrix4, Quaternion, Vector3, Color, Euler } from 'three';
import { Logger } from '@core/lib/logger';

import type { InstanceData } from '../ecs/components/definitions/InstancedComponent';

const logger = Logger.create('InstanceBuffers');

/**
 * Manages matrix and color buffers for instanced meshes
 */
export class InstanceBufferManager {
  private matrices: Matrix4[] = [];
  private colors: Color[] = [];
  private capacity: number;
  private dirty = false;

  // Reusable objects to minimize allocations
  private tempPosition = new Vector3();
  private tempRotation = new Quaternion();
  private tempScale = new Vector3(1, 1, 1);
  private tempMatrix = new Matrix4();

  constructor(capacity: number) {
    this.capacity = capacity;
    this.matrices = new Array(capacity).fill(null).map(() => new Matrix4());
    this.colors = new Array(capacity).fill(null).map(() => new Color(1, 1, 1));
  }

  /**
   * Update a single instance transform
   */
  public updateInstance(
    index: number,
    position?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number],
    color?: [number, number, number],
  ): void {
    if (index < 0 || index >= this.capacity) {
      logger.warn('Instance index out of bounds', { index, capacity: this.capacity });
      return;
    }

    // Update transform matrix
    if (position) {
      this.tempPosition.set(position[0], position[1], position[2]);
    } else {
      this.tempPosition.set(0, 0, 0);
    }

    if (rotation) {
      this.tempRotation.setFromEuler(new Euler(rotation[0], rotation[1], rotation[2]));
    } else {
      this.tempRotation.identity();
    }

    if (scale) {
      this.tempScale.set(scale[0], scale[1], scale[2]);
    } else {
      this.tempScale.set(1, 1, 1);
    }

    this.tempMatrix.compose(this.tempPosition, this.tempRotation, this.tempScale);
    this.matrices[index].copy(this.tempMatrix);

    // Update color
    if (color) {
      this.colors[index].setRGB(color[0], color[1], color[2]);
    }

    this.dirty = true;
  }

  /**
   * Update all instances from instance data array
   */
  public updateFromData(instances: InstanceData[]): void {
    const count = Math.min(instances.length, this.capacity);

    for (let i = 0; i < count; i++) {
      const instance = instances[i];
      this.updateInstance(
        i,
        instance.position,
        instance.rotation,
        instance.scale,
        instance.color,
      );
    }

    // Hide unused instances by scaling to 0
    for (let i = count; i < this.capacity; i++) {
      this.matrices[i].makeScale(0, 0, 0);
    }

    this.dirty = true;
  }

  /**
   * Remove an instance by index (shifts remaining instances)
   */
  public removeAt(index: number): void {
    if (index < 0 || index >= this.capacity) {
      logger.warn('Instance index out of bounds', { index });
      return;
    }

    // Shift all instances after the removed one
    for (let i = index; i < this.capacity - 1; i++) {
      this.matrices[i].copy(this.matrices[i + 1]);
      this.colors[i].copy(this.colors[i + 1]);
    }

    // Clear the last instance
    this.matrices[this.capacity - 1].makeScale(0, 0, 0);
    this.colors[this.capacity - 1].setRGB(1, 1, 1);

    this.dirty = true;
  }

  /**
   * Clear all instances
   */
  public clear(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.matrices[i].makeScale(0, 0, 0);
      this.colors[i].setRGB(1, 1, 1);
    }
    this.dirty = true;
  }

  /**
   * Get the matrix array for Three.js InstancedMesh
   */
  public getMatrices(): Matrix4[] {
    return this.matrices;
  }

  /**
   * Get the color array
   */
  public getColors(): Color[] {
    return this.colors;
  }

  /**
   * Check if buffers need updating
   */
  public isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Mark buffers as clean after updating GPU
   */
  public markClean(): void {
    this.dirty = false;
  }

  /**
   * Get buffer capacity
   */
  public getCapacity(): number {
    return this.capacity;
  }
}

/**
 * Pool of buffer managers to reduce allocations
 */
export class InstanceBufferPool {
  private static pools = new Map<number, InstanceBufferManager[]>();

  /**
   * Get a buffer manager from the pool or create a new one
   */
  public static acquire(capacity: number): InstanceBufferManager {
    const pool = this.pools.get(capacity);
    if (pool && pool.length > 0) {
      const manager = pool.pop()!;
      manager.clear();
      return manager;
    }
    return new InstanceBufferManager(capacity);
  }

  /**
   * Return a buffer manager to the pool for reuse
   */
  public static release(manager: InstanceBufferManager): void {
    const capacity = manager.getCapacity();
    if (!this.pools.has(capacity)) {
      this.pools.set(capacity, []);
    }
    manager.clear();
    this.pools.get(capacity)!.push(manager);
  }

  /**
   * Clear the pool (for cleanup/testing)
   */
  public static clear(): void {
    this.pools.clear();
  }
}
