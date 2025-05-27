import { defineQuery } from 'bitecs';
import { Mesh, MeshStandardMaterial } from 'three';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';

// Get world instance and create material query
const world = ECSWorld.getInstance().getWorld();
const meshRendererComponent = componentRegistry.getBitECSComponent('MeshRenderer');
const materialQuery = defineQuery([meshRendererComponent]);

// Entity to Three.js object mapping (simplified for now)
const entityToObject = new Map<number, any>();

/**
 * Material System - Updates Three.js materials from ECS MeshRenderer components
 * Only updates materials that are marked with needsUpdate flag for performance
 */
export class MaterialSystem {
  private lastUpdateCount = 0;
  private updateThrottleMs = 16; // ~60fps throttle
  private lastUpdateTime = 0;

  /**
   * Update all materials that need updating
   * Returns the number of materials updated
   */
  update(): number {
    const now = performance.now();

    // Throttle updates to prevent excessive material changes
    if (now - this.lastUpdateTime < this.updateThrottleMs) {
      return 0;
    }

    const entities = materialQuery(world);
    let updatedCount = 0;

    entities.forEach((eid: number) => {
      // Get mesh renderer data using the new component registry
      const meshRendererData = componentRegistry.getComponentData(eid, 'MeshRenderer') as
        | {
            material?: {
              color: string;
              metalness: number;
              roughness: number;
              emissive: string;
              emissiveIntensity: number;
            };
          }
        | undefined;
      if (!meshRendererData) return;

      // For now, we'll always update since we don't have needsUpdate in the new system yet
      // TODO: Add needsUpdate flag to the new MeshRenderer component definition

      // Get the Three.js object
      const object = entityToObject.get(eid);
      if (!object) return;

      // Update material color (cast to Mesh to access material)
      const mesh = object as Mesh;
      const material = mesh.material as MeshStandardMaterial;
      if (material && material.color && meshRendererData.material) {
        // Parse color from hex string
        material.color.set(meshRendererData.material.color);
        material.metalness = meshRendererData.material.metalness;
        material.roughness = meshRendererData.material.roughness;
        material.emissive.set(meshRendererData.material.emissive);
        material.emissiveIntensity = meshRendererData.material.emissiveIntensity;

        updatedCount++;
      }
    });

    this.lastUpdateCount = updatedCount;
    this.lastUpdateTime = now;
    return updatedCount;
  }

  /**
   * Force immediate update without throttling
   */
  forceUpdate(): number {
    this.lastUpdateTime = 0;
    return this.update();
  }

  /**
   * Set the throttle interval in milliseconds
   */
  setThrottleMs(ms: number): void {
    this.updateThrottleMs = ms;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      lastUpdateCount: this.lastUpdateCount,
      totalEntities: materialQuery(world).length,
      throttleMs: this.updateThrottleMs,
      lastUpdateTime: this.lastUpdateTime,
    };
  }

  /**
   * Register an entity-to-object mapping for material synchronization
   */
  registerEntityObject(entityId: number, object: any): void {
    entityToObject.set(entityId, object);
  }

  /**
   * Unregister an entity-to-object mapping
   */
  unregisterEntityObject(entityId: number): void {
    entityToObject.delete(entityId);
  }
}

// Export singleton instance
export const materialSystem = new MaterialSystem();
