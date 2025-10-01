import type { IPrefabDefinition, IInstantiateOptions } from './Prefab.types';
import { PrefabApplier } from './PrefabApplier';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PrefabPool');

export class PrefabPool {
  private prefabId: string;
  private poolSize: number;
  private available: number[] = [];
  private active = new Set<number>();
  private getPrefab: () => IPrefabDefinition | undefined;

  constructor(prefabId: string, poolSize: number, getPrefab: () => IPrefabDefinition | undefined) {
    this.prefabId = prefabId;
    this.poolSize = poolSize;
    this.getPrefab = getPrefab;
  }

  /**
   * Pre-create entities in the pool
   */
  warm(count: number): void {
    const prefab = this.getPrefab();
    if (!prefab) {
      logger.error('Prefab not found for warming pool', { prefabId: this.prefabId });
      return;
    }

    const applier = PrefabApplier.getInstance();

    for (let i = 0; i < count; i++) {
      try {
        const entityId = applier.instantiate(prefab);
        this.setActive(entityId, false);
        this.available.push(entityId);
      } catch (error) {
        logger.error('Failed to warm pool:', error);
      }
    }

    logger.debug('Pool warmed', {
      prefabId: this.prefabId,
      count,
      available: this.available.length,
    });
  }

  /**
   * Acquire an entity from the pool or create a new one
   */
  acquire(overrides?: Record<string, unknown>): number {
    let entityId: number;

    if (this.available.length > 0) {
      // Reuse from pool
      entityId = this.available.pop()!;
      this.applyOverrides(entityId, overrides);
      this.setActive(entityId, true);

      logger.debug('Entity acquired from pool', {
        prefabId: this.prefabId,
        entityId,
        remaining: this.available.length,
      });
    } else {
      // Create new if pool exhausted
      const prefab = this.getPrefab();
      if (!prefab) {
        logger.error('Prefab not found', { prefabId: this.prefabId });
        return -1;
      }

      const applier = PrefabApplier.getInstance();
      const options: IInstantiateOptions = {
        applyOverrides: overrides,
      };

      if (overrides) {
        const overridesTyped = overrides as {
          position?: [number, number, number];
          rotation?: [number, number, number];
          scale?: [number, number, number];
        };
        if (overridesTyped.position) options.position = overridesTyped.position;
        if (overridesTyped.rotation) options.rotation = overridesTyped.rotation;
        if (overridesTyped.scale) options.scale = overridesTyped.scale;
      }

      entityId = applier.instantiate(prefab, options);

      logger.debug('New entity created (pool exhausted)', {
        prefabId: this.prefabId,
        entityId,
      });
    }

    this.active.add(entityId);
    return entityId;
  }

  /**
   * Release an entity back to the pool
   */
  release(entityId: number): void {
    if (!this.active.has(entityId)) {
      logger.warn('Entity not in active set', { entityId });
      return;
    }

    this.active.delete(entityId);

    if (this.available.length < this.poolSize) {
      // Return to pool
      this.resetEntity(entityId);
      this.setActive(entityId, false);
      this.available.push(entityId);

      logger.debug('Entity released to pool', {
        prefabId: this.prefabId,
        entityId,
        available: this.available.length,
      });
    } else {
      // Pool full, destroy
      const applier = PrefabApplier.getInstance();
      applier.destroyInstance(entityId);

      logger.debug('Entity destroyed (pool full)', {
        prefabId: this.prefabId,
        entityId,
      });
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; active: number; total: number; capacity: number } {
    return {
      available: this.available.length,
      active: this.active.size,
      total: this.available.length + this.active.size,
      capacity: this.poolSize,
    };
  }

  /**
   * Clear the pool (destroy all entities)
   */
  clear(): void {
    const applier = PrefabApplier.getInstance();

    // Destroy available entities
    for (const entityId of this.available) {
      try {
        applier.destroyInstance(entityId);
      } catch (error) {
        logger.error('Failed to destroy pooled entity:', error);
      }
    }

    // Destroy active entities
    for (const entityId of this.active) {
      try {
        applier.destroyInstance(entityId);
      } catch (error) {
        logger.error('Failed to destroy active entity:', error);
      }
    }

    this.available = [];
    this.active.clear();

    logger.debug('Pool cleared', { prefabId: this.prefabId });
  }

  /**
   * Reset entity to default state
   */
  private resetEntity(entityId: number): void {
    // Reset transform to origin
    const transform = componentRegistry.getComponentData(entityId, 'Transform');
    if (transform) {
      componentRegistry.updateComponent(entityId, 'Transform', {
        ...transform,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    }

    // Reset any RigidBody velocity
    const rigidBody = componentRegistry.getComponentData(entityId, 'RigidBody');
    if (rigidBody) {
      componentRegistry.updateComponent(entityId, 'RigidBody', {
        ...rigidBody,
        velocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
      });
    }
  }

  /**
   * Apply overrides to entity
   */
  private applyOverrides(entityId: number, overrides?: Record<string, unknown>): void {
    if (!overrides) return;

    const transform = componentRegistry.getComponentData(entityId, 'Transform');
    if (!transform) return;

    const updates: Record<string, unknown> = {};

    if ('position' in overrides) updates.position = overrides.position;
    if ('rotation' in overrides) updates.rotation = overrides.rotation;
    if ('scale' in overrides) updates.scale = overrides.scale;

    if (Object.keys(updates).length > 0) {
      componentRegistry.updateComponent(entityId, 'Transform', {
        ...transform,
        ...updates,
      });
    }
  }

  /**
   * Set entity active state
   */
  private setActive(entityId: number, active: boolean): void {
    // For now, we'll use a simple approach: disable rendering and physics
    // when inactive. This could be extended to disable all components.

    const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer');
    if (meshRenderer) {
      componentRegistry.updateComponent(entityId, 'MeshRenderer', {
        ...meshRenderer,
        enabled: active,
      });
    }

    const rigidBody = componentRegistry.getComponentData(entityId, 'RigidBody');
    if (rigidBody) {
      componentRegistry.updateComponent(entityId, 'RigidBody', {
        ...rigidBody,
        enabled: active,
      });
    }
  }
}
