import type { IPrefabDefinition, IInstantiateOptions } from './Prefab.types';
import { PrefabRegistry } from './PrefabRegistry';
import { PrefabApplier } from './PrefabApplier';
import { PrefabSerializer } from './PrefabSerializer';
import { PrefabPool } from './PrefabPool';
import { Logger } from '@/core/lib/logger';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

const logger = Logger.create('PrefabManager');

export class PrefabManager {
  private static instance: PrefabManager;

  private registry: PrefabRegistry;
  private applier: PrefabApplier;
  private serializer: PrefabSerializer;
  private pools = new Map<string, PrefabPool>();

  private constructor() {
    this.registry = PrefabRegistry.getInstance();
    this.applier = PrefabApplier.getInstance();
    this.serializer = PrefabSerializer.getInstance();
  }

  static getInstance(): PrefabManager {
    if (!PrefabManager.instance) {
      PrefabManager.instance = new PrefabManager();
    }
    return PrefabManager.instance;
  }

  // ========== Prefab Registration ==========

  /**
   * Register a prefab
   */
  register(prefab: IPrefabDefinition): void {
    this.registry.upsert(prefab);
  }

  /**
   * Unregister a prefab
   */
  unregister(prefabId: string): void {
    // Disable pooling if active
    this.disablePooling(prefabId);

    // Remove from registry
    this.registry.remove(prefabId);
  }

  /**
   * Get a prefab by ID
   */
  get(prefabId: string): IPrefabDefinition | null {
    return this.registry.get(prefabId) || null;
  }

  /**
   * List all prefabs
   */
  getAll(): IPrefabDefinition[] {
    return this.registry.list();
  }

  /**
   * Search prefabs
   */
  search(query: string): IPrefabDefinition[] {
    return this.registry.search(query);
  }

  // ========== Instantiation ==========

  /**
   * Instantiate a prefab
   */
  instantiate(prefabId: string, overrides?: Record<string, unknown>, parentId?: number): number {
    // Check if pooling is enabled
    const pool = this.pools.get(prefabId);
    if (pool) {
      return pool.acquire(overrides);
    }

    // No pooling, create directly
    const prefab = this.registry.get(prefabId);
    if (!prefab) {
      logger.error('Prefab not found', { prefabId });
      return -1;
    }

    const options: IInstantiateOptions = {
      parentEntityId: parentId,
      applyOverrides: overrides,
    };

    // Extract transform overrides
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

    try {
      return this.applier.instantiate(prefab, options);
    } catch (error) {
      logger.error('Failed to instantiate prefab:', error);
      return -1;
    }
  }

  // ========== Instance Management ==========

  /**
   * Destroy an entity (use pool if available)
   */
  destroy(entityId: number): void {
    const prefabId = this.applier.getPrefabId(entityId);

    if (prefabId) {
      const pool = this.pools.get(prefabId);
      if (pool) {
        // Return to pool
        pool.release(entityId);
        return;
      }
    }

    // No pool, destroy directly
    this.applier.destroyInstance(entityId);
  }

  /**
   * Check if entity is a prefab instance
   */
  isInstance(entityId: number): boolean {
    return this.applier.isInstance(entityId);
  }

  /**
   * Get prefab ID from instance
   */
  getPrefabId(entityId: number): string | null {
    return this.applier.getPrefabId(entityId);
  }

  /**
   * Get all instances of a prefab
   */
  getInstances(prefabId: string): number[] {
    return this.applier.getInstances(prefabId);
  }

  // ========== Entity State ==========

  /**
   * Set entity active state
   */
  setActive(entityId: number, active: boolean): void {
    // Disable/enable rendering
    const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer');
    if (meshRenderer) {
      componentRegistry.updateComponent(entityId, 'MeshRenderer', {
        ...meshRenderer,
        enabled: active,
      });
    }

    // Disable/enable physics
    const rigidBody = componentRegistry.getComponentData(entityId, 'RigidBody');
    if (rigidBody) {
      componentRegistry.updateComponent(entityId, 'RigidBody', {
        ...rigidBody,
        enabled: active,
      });
    }

    // Disable/enable scripts
    const script = componentRegistry.getComponentData(entityId, 'Script');
    if (script) {
      componentRegistry.updateComponent(entityId, 'Script', {
        ...script,
        enabled: active,
      });
    }

    logger.debug('Entity active state changed', { entityId, active });
  }

  /**
   * Check if entity is active
   */
  isActive(entityId: number): boolean {
    // Check MeshRenderer enabled state as proxy for active
    const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer');
    if (meshRenderer && 'enabled' in meshRenderer) {
      return Boolean(meshRenderer.enabled);
    }

    // Default to true if no renderer
    return true;
  }

  // ========== Pooling ==========

  /**
   * Enable pooling for a prefab
   */
  enablePooling(prefabId: string, poolSize: number): void {
    if (this.pools.has(prefabId)) {
      logger.warn('Pooling already enabled', { prefabId });
      return;
    }

    const pool = new PrefabPool(prefabId, poolSize, () => this.registry.get(prefabId));
    this.pools.set(prefabId, pool);

    logger.debug('Pooling enabled', { prefabId, poolSize });
  }

  /**
   * Disable pooling for a prefab
   */
  disablePooling(prefabId: string): void {
    const pool = this.pools.get(prefabId);
    if (!pool) {
      return;
    }

    pool.clear();
    this.pools.delete(prefabId);

    logger.debug('Pooling disabled', { prefabId });
  }

  /**
   * Warm a prefab pool
   */
  warmPool(prefabId: string, count: number): void {
    const pool = this.pools.get(prefabId);
    if (!pool) {
      logger.error('Pool not found, enable pooling first', { prefabId });
      return;
    }

    pool.warm(count);
  }

  /**
   * Get pool statistics
   */
  getPoolStats(
    prefabId: string,
  ): { available: number; active: number; total: number; capacity: number } | null {
    const pool = this.pools.get(prefabId);
    return pool ? pool.getStats() : null;
  }

  // ========== Prefab Creation ==========

  /**
   * Create prefab from entity
   */
  createFromEntity(entityId: number, name: string, id: string): IPrefabDefinition {
    const prefab = this.serializer.createPrefabFromEntity(entityId, name, id);
    this.registry.upsert(prefab);
    return prefab;
  }

  // ========== Apply/Revert ==========

  /**
   * Apply instance overrides to prefab
   */
  applyToAsset(entityId: number): void {
    this.applier.applyToAsset(entityId, (prefabId, updates) => {
      const prefab = this.registry.get(prefabId);
      if (!prefab) {
        throw new Error(`Prefab not found: ${prefabId}`);
      }

      this.registry.upsert({ ...prefab, ...updates });
    });
  }

  /**
   * Revert instance to prefab defaults
   */
  revertInstance(entityId: number): void {
    this.applier.revertInstance(entityId, (prefabId) => this.registry.get(prefabId));
  }

  /**
   * Update instance to latest prefab version
   */
  updateToVersion(entityId: number): void {
    this.applier.updateToVersion(entityId, (prefabId) => this.registry.get(prefabId));
  }

  // ========== Utilities ==========

  /**
   * Get statistics
   */
  getStats(): {
    prefabCount: number;
    variantCount: number;
    totalDependencies: number;
    poolsActive: number;
  } {
    const registryStats = this.registry.getStats();

    return {
      ...registryStats,
      poolsActive: this.pools.size,
    };
  }

  /**
   * Clear all prefabs (for testing)
   */
  clear(): void {
    // Clear all pools
    for (const [prefabId] of this.pools) {
      this.disablePooling(prefabId);
    }

    // Clear registry
    this.registry.clear();

    logger.debug('PrefabManager cleared');
  }
}

export const prefabManager = PrefabManager.getInstance();
