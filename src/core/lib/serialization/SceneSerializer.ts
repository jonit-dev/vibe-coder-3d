import { Logger } from '@core/lib/logger';
import { z } from 'zod';
import { MaterialSerializer } from './MaterialSerializer';
import { PrefabSerializer } from './PrefabSerializer';
import { EntitySerializer } from './EntitySerializer';
import type {
  IEntityManagerAdapter,
  IComponentManagerAdapter,
  ISerializedEntity,
} from './EntitySerializer';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { MaterialDefinitionSchema } from '@core/materials/Material.types';
import { PrefabDefinitionSchema } from '@core/prefabs/Prefab.types';
import { InputActionsAssetSchema } from '@core/lib/input/inputTypes';

const logger = Logger.create('SceneSerializer');

/**
 * Scene metadata
 */
export interface ISceneMetadata {
  name: string;
  version: number;
  timestamp: string;
  author?: string;
  description?: string;
}

/**
 * Complete scene data structure
 */
export interface ISceneData {
  metadata: ISceneMetadata;
  entities: ISerializedEntity[];
  materials: IMaterialDefinition[];
  prefabs: IPrefabDefinition[];
  inputAssets?: IInputActionsAsset[];
  lockedEntityIds?: number[];
  assetReferences?: {
    materials?: string;
    prefabs?: string;
    inputs?: string;
  };
}

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
  lockedEntityIds: z.array(z.number()).optional().default([]),
});

/**
 * Scene serialization options
 */
export interface ISceneSerializationOptions {
  /** Enable compression (default omission + material deduplication) */
  compressionEnabled?: boolean;
  /** Omit component fields that match default values */
  compressDefaults?: boolean;
  /** Extract and deduplicate inline materials */
  deduplicateMaterials?: boolean;
}

/**
 * Scene Serialization Orchestrator
 * Coordinates serialization of entities, materials, and prefabs
 * Follows SRP by delegating to specialized serializers
 */
export class SceneSerializer {
  private entitySerializer = new EntitySerializer();
  private materialSerializer = new MaterialSerializer();
  private prefabSerializer = new PrefabSerializer();

  /**
   * Serialize complete scene to data structure
   * @param compressionOptions - Optional compression settings (defaults to enabled)
   */
  async serialize(
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
    metadata: Partial<ISceneMetadata> = {},
    inputAssets?: IInputActionsAsset[],
    compressionOptions?: ISceneSerializationOptions,
    lockedEntityIds?: number[],
  ): Promise<ISceneData> {
    const options = {
      compressionEnabled: true, // Enable by default
      compressDefaults: true,
      deduplicateMaterials: true,
      ...compressionOptions,
    };

    logger.info('Starting scene serialization', {
      compression: options.compressionEnabled,
    });

    let entities: ISerializedEntity[];
    let extractedMaterials: IMaterialDefinition[] = [];

    // Serialize entities with optional compression
    if (options.compressionEnabled) {
      const compressed = this.entitySerializer.serializeWithCompression(
        entityManager,
        componentManager,
        {
          compressDefaults: options.compressDefaults,
          deduplicateMaterials: options.deduplicateMaterials,
        },
      );
      entities = compressed.entities;
      extractedMaterials = compressed.materials;

      logger.info('Compression applied', {
        extractedMaterials: extractedMaterials.length,
      });
    } else {
      // Legacy serialization (no compression)
      entities = this.entitySerializer.serialize(entityManager, componentManager);
    }

    // Get materials from registry
    const registryMaterials = this.materialSerializer.serialize();

    // Merge extracted materials with registry materials (extracted takes precedence)
    const allMaterials = [
      ...extractedMaterials,
      ...registryMaterials.filter((rm) => !extractedMaterials.some((em) => em.id === rm.id)),
    ];

    const prefabs = await this.prefabSerializer.serialize();

    const sceneData: ISceneData = {
      metadata: {
        name: metadata.name || 'Untitled Scene',
        version: metadata.version || 1,
        timestamp: new Date().toISOString(),
        author: metadata.author,
        description: metadata.description,
      },
      entities,
      materials: allMaterials,
      prefabs,
      inputAssets,
      lockedEntityIds,
    };

    // Validate before returning
    const validation = SceneDataSchema.safeParse(sceneData);
    if (!validation.success) {
      logger.error('Scene serialization validation failed', { error: validation.error });
      throw new Error(`Scene validation failed: ${validation.error.message}`);
    }

    logger.info('Scene serialization complete', {
      entities: entities.length,
      materials: allMaterials.length,
      prefabs: prefabs.length,
      inputAssets: inputAssets?.length || 0,
      lockedEntityIds: lockedEntityIds?.length || 0,
      compressed: options.compressionEnabled,
    });

    return sceneData;
  }

  /**
   * Serialize to JSON string
   */
  async serializeToJSON(
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
    metadata: Partial<ISceneMetadata> = {},
    inputAssets?: IInputActionsAsset[],
  ): Promise<string> {
    const sceneData = await this.serialize(entityManager, componentManager, metadata, inputAssets);
    return JSON.stringify(sceneData, null, 2);
  }

  /**
   * Validate scene data structure
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
}
