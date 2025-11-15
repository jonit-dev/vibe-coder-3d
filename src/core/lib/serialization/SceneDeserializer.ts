import { Logger } from '@core/lib/logger';
import { z } from 'zod';
import { MaterialSerializer } from './MaterialSerializer';
import { PrefabSerializer } from './PrefabSerializer';
import { AnimationSerializer } from './AnimationSerializer';
import { EntitySerializer } from './EntitySerializer';
import type { IEntityManagerAdapter, IComponentManagerAdapter, ISerializedEntity } from './EntitySerializer';
import type { ISceneData } from './SceneSerializer';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { MaterialDefinitionSchema } from '@core/materials/Material.types';
import { PrefabDefinitionSchema } from '@core/prefabs/Prefab.types';
import { InputActionsAssetSchema } from '@core/lib/input/inputTypes';
import { AnimationAssetSchema } from '@core/animation/assets/defineAnimations';
import { applyResolvedScriptData } from './utils/ScriptSerializationUtils';

const AssetReferenceValueSchema = z.union([z.string(), z.array(z.string())]);

const logger = Logger.create('SceneDeserializer');

const SceneDataSchema = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.number(),
    timestamp: z.string(),
    author: z.string().optional(),
    description: z.string().optional(),
  }),
  entities: z.array(z.any()), // Validated by EntitySerializer
  materials: z.array(MaterialDefinitionSchema),
  prefabs: z.array(PrefabDefinitionSchema),
  inputAssets: z.array(InputActionsAssetSchema).optional(),
  animations: z.array(AnimationAssetSchema).optional(),
  lockedEntityIds: z.array(z.number()).optional().default([]),
  assetReferences: z
    .object({
      materials: AssetReferenceValueSchema.optional(),
      prefabs: AssetReferenceValueSchema.optional(),
      inputs: AssetReferenceValueSchema.optional(),
      scripts: AssetReferenceValueSchema.optional(),
      animations: AssetReferenceValueSchema.optional(),
    })
    .optional(),
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
 * 5. Return input assets for caller to handle (maintains separation of concerns)
 */
export class SceneDeserializer {
  private entitySerializer = new EntitySerializer();
  private materialSerializer = new MaterialSerializer();
  private prefabSerializer = new PrefabSerializer();
  private animationSerializer = new AnimationSerializer();

  /**
   * Deserialize complete scene from data structure
   * Returns input assets for the caller to load into the appropriate store
   */
  async deserialize(
    sceneData: unknown,
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
  ): Promise<{
    inputAssets?: IInputActionsAsset[];
    lockedEntityIds?: number[];
    entityIdMap: Map<string | number, number>;
  }> {
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

    logger.debug('Deserializing animations');
    if (validated.animations) {
      this.animationSerializer.deserialize(validated.animations);
    }

    logger.debug('Deserializing entities');
    const entitiesWithScripts = await this.hydrateScriptComponents(validated.entities);

    const entityIdMap = this.entitySerializer.deserialize(
      entitiesWithScripts,
      entityManager,
      componentManager,
    );

    logger.info('Scene deserialization complete', {
      name: validated.metadata.name,
      entities: validated.entities.length,
      materials: validated.materials.length,
      prefabs: validated.prefabs.length,
      inputAssets: validated.inputAssets?.length || 0,
      animations: validated.animations?.length || 0,
      lockedEntityIds: validated.lockedEntityIds?.length || 0,
    });

    // Return input assets and locked entity IDs for caller to handle
    return {
      inputAssets: validated.inputAssets,
      lockedEntityIds: validated.lockedEntityIds,
      entityIdMap,
    };
  }

  /**
   * Deserialize from JSON string
   */
  async deserializeFromJSON(
    json: string,
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
  ): Promise<{
    inputAssets?: IInputActionsAsset[];
    lockedEntityIds?: number[];
    entityIdMap: Map<string | number, number>;
  }> {
    const sceneData = JSON.parse(json);
    return await this.deserialize(sceneData, entityManager, componentManager);
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
        return { isValid: false, error: error.errors.map((e) => e.message).join(', ') };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  }

  private async hydrateScriptComponents(
    entities: ISceneData['entities'],
  ): Promise<ISerializedEntity[]> {
    let readScriptFromFs:
      | typeof import('./utils/ScriptFileResolver').readScriptFromFilesystem
      | null = null;

    return Promise.all(
      entities.map(async (entity) => {
        const scriptComponent = entity.components?.Script as Record<string, unknown> | undefined;
        if (!scriptComponent) return entity;

        const scriptRef = scriptComponent.scriptRef as Record<string, unknown> | undefined;
        if (scriptRef?.source !== 'external' || typeof scriptRef.path !== 'string') {
          return entity;
        }

        if (!readScriptFromFs) {
          const module = await import('./utils/ScriptFileResolver');
          readScriptFromFs = module.readScriptFromFilesystem;
        }

        const resolved = await readScriptFromFs(scriptRef.path);
        if (!resolved) return entity;

        return {
          ...entity,
          components: {
            ...entity.components,
            Script: applyResolvedScriptData(scriptComponent, resolved),
          },
        };
      }),
    );
  }
}
