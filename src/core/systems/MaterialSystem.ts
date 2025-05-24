import { Mesh, MeshStandardMaterial } from 'three';

import { entityToObject, Material, materialQuery, world } from '@/core/lib/ecs';

/**
 * Material System - Updates Three.js materials from ECS Material components
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

    entities.forEach((eid) => {
      // Skip if no update needed
      if (!Material.needsUpdate[eid]) return;

      // Get the Three.js object
      const object = entityToObject.get(eid);
      if (!object) return;

      // Update material color (cast to Mesh to access material)
      const mesh = object as Mesh;
      const material = mesh.material as MeshStandardMaterial;
      if (material && material.color) {
        material.color.setRGB(
          Material.color[eid][0],
          Material.color[eid][1],
          Material.color[eid][2],
        );

        // Clear the update flag
        Material.needsUpdate[eid] = 0;
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
}

// Export singleton instance
export const materialSystem = new MaterialSystem();
