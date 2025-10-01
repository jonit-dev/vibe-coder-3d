import { Logger } from '@core/lib/logger';
import { z } from 'zod';
import { MaterialSerializer } from './MaterialSerializer';
import { PrefabSerializer } from './PrefabSerializer';
import { EntitySerializer } from './EntitySerializer';
import type {
  IEntityManagerAdapter,
  IComponentManagerAdapter
} from './EntitySerializer';
import type { ISceneData } from './SceneSerializer';
import { MaterialDefinitionSchema } from '@core/materials/Material.types';
import { PrefabDefinitionSchema } from '@core/prefabs/Prefab.types';

const logger = Logger.create('SceneDeserializer');

const SceneDataSchema = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.number(),
    timestamp: z.string(),
    author: z.string().optional(),
    description: z.string().optional()
  }),
  entities: z.array(z.any()), // Validated by EntitySerializer
  materials: z.array(MaterialDefinitionSchema),
  prefabs: z.array(PrefabDefinitionSchema)
});

/**
 * Scene Deserialization Orchestrator
 * Coordinates deserialization of entities, materials, and prefabs
 * Follows SRP by delegating to specialized serializers
 *
 * Deserialization order:
 * 1. Validate scene data
 * 2. Load materials (needed by entities)
 * 3. Load prefabs (may be referenced by entities)
 * 4. Load entities with components
 */
export class SceneDeserializer {
  private entitySerializer = new EntitySerializer();
  private materialSerializer = new MaterialSerializer();
  private prefabSerializer = new PrefabSerializer();

  /**
   * Deserialize complete scene from data structure
   */
  async deserialize(
    sceneData: unknown,
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter
  ): Promise<void> {
    logger.info('Starting scene deserialization');

    // Validate scene data structure
    const validation = SceneDataSchema.safeParse(sceneData);
    if (!validation.success) {
      logger.error('Scene validation failed', { error: validation.error });
      throw new Error(`Invalid scene data: ${validation.error.message}`);
    }

    const validated = validation.data as ISceneData;

    // Deserialize in correct order
    logger.debug('Deserializing materials');
    this.materialSerializer.deserialize(validated.materials);

    logger.debug('Deserializing prefabs');
    await this.prefabSerializer.deserialize(validated.prefabs);

    logger.debug('Deserializing entities');
    this.entitySerializer.deserialize(validated.entities, entityManager, componentManager);

    logger.info('Scene deserialization complete', {
      name: validated.metadata.name,
      entities: validated.entities.length,
      materials: validated.materials.length,
      prefabs: validated.prefabs.length
    });
  }

  /**
   * Deserialize from JSON string
   */
  async deserializeFromJSON(
    json: string,
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter
  ): Promise<void> {
    const sceneData = JSON.parse(json);
    await this.deserialize(sceneData, entityManager, componentManager);
  }

  /**
   * Validate scene data without deserializing
   */
  validate(sceneData: unknown): { isValid: boolean; error?: string } {
    try {
      SceneDataSchema.parse(sceneData);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors.map(e => e.message).join(', ') };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  }
}
