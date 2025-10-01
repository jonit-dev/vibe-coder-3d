import { Logger } from '@core/lib/logger';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import { PrefabDefinitionSchema } from '@core/prefabs/Prefab.types';

const logger = Logger.create('PrefabSerializer');

/**
 * Prefab Serialization Service
 * Single responsibility: Serialize and deserialize prefabs
 */
export class PrefabSerializer {
  /**
   * Serialize all prefabs from registry
   */
  async serialize(): Promise<IPrefabDefinition[]> {
    const { PrefabManager } = await import('@core/prefabs');
    const manager = PrefabManager.getInstance();
    const prefabs = manager.getAll();

    logger.debug('Serialized prefabs', { count: prefabs.length });
    return prefabs;
  }

  /**
   * Deserialize prefabs into registry
   * IMPORTANT: Preserves array order for prefab registration
   */
  async deserialize(prefabs: unknown[]): Promise<void> {
    const { PrefabManager } = await import('@core/prefabs');
    const manager = PrefabManager.getInstance();

    // Clear existing prefabs
    manager.clear();

    // Validate and register each prefab in order
    let successCount = 0;
    let errorCount = 0;

    for (const prefabData of prefabs) {
      try {
        const validated = PrefabDefinitionSchema.parse(prefabData);
        manager.register(validated);
        successCount++;
      } catch (error) {
        logger.error('Failed to deserialize prefab', { error, prefabData });
        errorCount++;
      }
    }

    logger.info('Deserialized prefabs', {
      total: prefabs.length,
      success: successCount,
      errors: errorCount
    });
  }

  /**
   * Clear all prefabs from registry
   */
  async clear(): Promise<void> {
    const { PrefabManager } = await import('@core/prefabs');
    const manager = PrefabManager.getInstance();
    manager.clear();
    logger.debug('Cleared prefabs');
  }
}
