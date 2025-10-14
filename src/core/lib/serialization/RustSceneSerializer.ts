import { Logger } from '@core/lib/logger';
import { SceneSerializer, type ISceneData } from './SceneSerializer';
import type { IEntityManagerAdapter, IComponentManagerAdapter } from './EntitySerializer';
import type { ISceneMetadata } from './SceneSerializer';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { promises as fs } from 'fs';
import { join } from 'path';

const logger = Logger.create('RustSceneSerializer');

/**
 * Rust Scene Serializer
 * Serializes scenes to JSON format for Rust consumption
 * Key difference: Full scene dump WITHOUT compression (no default omission)
 */
export class RustSceneSerializer {
  private sceneSerializer = new SceneSerializer();

  /**
   * Serialize scene for Rust (full data, no compression)
   */
  async serialize(
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
    metadata: Partial<ISceneMetadata> = {},
    inputAssets?: IInputActionsAsset[],
    lockedEntityIds?: number[],
  ): Promise<ISceneData> {
    logger.info('Serializing scene for Rust', { sceneName: metadata.name });

    // Serialize with compression DISABLED (full data dump)
    const sceneData = await this.sceneSerializer.serialize(
      entityManager,
      componentManager,
      metadata,
      inputAssets,
      {
        compressionEnabled: false, // CRITICAL: No compression for Rust
        compressDefaults: false,
        deduplicateMaterials: false,
      },
      lockedEntityIds,
    );

    logger.info('Rust scene serialization complete', {
      sceneName: metadata.name,
      entities: sceneData.entities.length,
      materials: sceneData.materials.length,
      prefabs: sceneData.prefabs.length,
    });

    return sceneData;
  }

  /**
   * Serialize and save scene to Rust game folder
   * @param sceneName - Name of the scene (e.g., "Test", "Forest")
   * @param rustGameDir - Path to rust/game directory
   */
  async serializeAndSave(
    entityManager: IEntityManagerAdapter,
    componentManager: IComponentManagerAdapter,
    sceneName: string,
    rustGameDir: string,
    inputAssets?: IInputActionsAsset[],
    lockedEntityIds?: number[],
  ): Promise<void> {
    logger.info('Serializing and saving scene for Rust', { sceneName, rustGameDir });

    const metadata: Partial<ISceneMetadata> = {
      name: sceneName,
      version: 1,
      timestamp: new Date().toISOString(),
    };

    // Serialize scene
    const sceneData = await this.serialize(
      entityManager,
      componentManager,
      metadata,
      inputAssets,
      lockedEntityIds,
    );

    // Ensure scenes directory exists
    const scenesDir = join(rustGameDir, 'scenes');
    await fs.mkdir(scenesDir, { recursive: true });

    // Write to file
    const filename = `${sceneName}.json`;
    const filepath = join(scenesDir, filename);
    await fs.writeFile(filepath, JSON.stringify(sceneData, null, 2), 'utf-8');

    logger.info('Rust scene saved', { filepath });
  }

  /**
   * Convert scene data to JSON string
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
}
