/**
 * Three.js Entity Registry - Maps entity IDs to their Three.js objects for script access
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';

/**
 * Registry entry for an entity's Three.js objects
 */
interface IEntityThreeJSEntry {
  object3D: THREE.Object3D;
  scene: THREE.Scene;
  lastUpdated: number;
}

/**
 * Registry that maintains a mapping between entities and their Three.js objects
 * This allows the script system to access the actual rendered objects
 */
class ThreeJSEntityRegistry {
  private static instance: ThreeJSEntityRegistry;
  private registry = new Map<EntityId, IEntityThreeJSEntry>();

  public static getInstance(): ThreeJSEntityRegistry {
    if (!ThreeJSEntityRegistry.instance) {
      ThreeJSEntityRegistry.instance = new ThreeJSEntityRegistry();
    }
    return ThreeJSEntityRegistry.instance;
  }

  /**
   * Register an entity's Three.js object
   */
  public registerEntity(entityId: EntityId, object3D: THREE.Object3D, scene: THREE.Scene): void {
    this.registry.set(entityId, {
      object3D,
      scene,
      lastUpdated: Date.now(),
    });

    // Entity registered with Three.js object
  }

  /**
   * Update an entity's Three.js object (if it changes)
   */
  public updateEntity(entityId: EntityId, object3D: THREE.Object3D, scene: THREE.Scene): void {
    const existing = this.registry.get(entityId);
    if (existing && existing.object3D !== object3D) {
      this.registerEntity(entityId, object3D, scene);
    } else if (existing) {
      existing.lastUpdated = Date.now();
    }
  }

  /**
   * Unregister an entity's Three.js object
   */
  public unregisterEntity(entityId: EntityId): void {
    const removed = this.registry.delete(entityId);
    if (removed) {

    }
  }

  /**
   * Get an entity's Three.js object
   */
  public getEntityObject3D(entityId: EntityId): THREE.Object3D | null {
    const entry = this.registry.get(entityId);
    return entry ? entry.object3D : null;
  }

  /**
   * Get an entity's scene reference
   */
  public getEntityScene(entityId: EntityId): THREE.Scene | null {
    const entry = this.registry.get(entityId);
    return entry ? entry.scene : null;
  }

  /**
   * Check if an entity is registered
   */
  public hasEntity(entityId: EntityId): boolean {
    return this.registry.has(entityId);
  }

  /**
   * Get all registered entities
   */
  public getAllEntities(): EntityId[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Clear all registrations (useful for cleanup)
   */
  public clear(): void {

    this.registry.clear();
  }

  /**
   * Get registry stats for debugging
   */
  public getStats(): { totalEntities: number; oldestEntry: number; newestEntry: number } {
    if (this.registry.size === 0) {
      return { totalEntities: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = Array.from(this.registry.values()).map((entry) => entry.lastUpdated);
    return {
      totalEntities: this.registry.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  }
}

export const threeJSEntityRegistry = ThreeJSEntityRegistry.getInstance();
