import { Logger } from '@core/lib/logger';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import { MaterialDefinitionSchema } from '@core/materials/Material.types';

const logger = Logger.create('MaterialSerializer');

/**
 * Material Serialization Service
 * Single responsibility: Serialize and deserialize materials
 */
export class MaterialSerializer {
  /**
   * Serialize all materials from registry
   */
  serialize(): IMaterialDefinition[] {
    const registry = MaterialRegistry.getInstance();
    const materials = registry.list();

    logger.debug('Serialized materials', { count: materials.length });
    return materials;
  }

  /**
   * Deserialize materials into registry
   */
  deserialize(materials: unknown[]): void {
    const registry = MaterialRegistry.getInstance();

    // Clear existing materials
    registry.clearMaterials();

    // Validate and insert each material
    let successCount = 0;
    let errorCount = 0;

    for (const materialData of materials) {
      try {
        const validated = MaterialDefinitionSchema.parse(materialData);
        registry.upsert(validated);
        successCount++;
      } catch (error) {
        logger.error('Failed to deserialize material', { error, materialData });
        errorCount++;
      }
    }

    logger.info('Deserialized materials', {
      total: materials.length,
      success: successCount,
      errors: errorCount
    });
  }

  /**
   * Clear all materials from registry
   */
  clear(): void {
    const registry = MaterialRegistry.getInstance();
    registry.clearMaterials();
    logger.debug('Cleared materials');
  }
}
