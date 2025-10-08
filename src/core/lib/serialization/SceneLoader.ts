import { Logger } from '@core/lib/logger';
import { SceneDeserializer } from './SceneDeserializer';
import { MaterialSerializer } from './MaterialSerializer';
import { PrefabSerializer } from './PrefabSerializer';
import { EntitySerializer } from './EntitySerializer';
import type { ISceneData } from './SceneSerializer';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';

const logger = Logger.create('SceneLoader');

/**
 * Store refresh interface for cache synchronization
 */
export interface IStoreRefresher {
  refreshMaterials(): void;
  refreshPrefabs(): void;
  loadInputAssets?(assets: IInputActionsAsset[]): void;
}

/**
 * Simplified manager interfaces that match hook return types
 */
interface IEntityManager {
  getAllEntities(): Array<{ id: number; name: string; parentId?: number | null }>;
  clearEntities(): void;
  createEntity(name: string, parentId?: number | null, persistentId?: string): { id: number };
  setParent(childId: number, parentId?: number | null): void;
}

interface IComponentManager {
  getComponentsForEntity(entityId: number): Array<{ type: string; data: unknown }>;
  addComponent(entityId: number, componentType: string, data: unknown): void;
}

/**
 * Scene Loader Service
 * High-level API for loading scene data into the ECS
 * Handles store cache refresh after loading
 * All loading logic is abstracted here - scene files just provide data
 */
export class SceneLoader {
  private deserializer = new SceneDeserializer();
  private materialSerializer = new MaterialSerializer();
  private prefabSerializer = new PrefabSerializer();
  private entitySerializer = new EntitySerializer();

  /**
   * Load complete scene data
   */
  async load(
    sceneData: ISceneData,
    entityManager: IEntityManager,
    componentManager: IComponentManager,
    storeRefresher?: IStoreRefresher,
  ): Promise<void> {
    logger.info('Loading scene', { name: sceneData.metadata.name });

    const result = await this.deserializer.deserialize(sceneData, entityManager, componentManager);

    if (storeRefresher) {
      logger.debug('Refreshing store caches');
      storeRefresher.refreshMaterials();
      storeRefresher.refreshPrefabs();

      // Load input assets if provided
      if (result.inputAssets && storeRefresher.loadInputAssets) {
        logger.debug('Loading input assets', { count: result.inputAssets.length });
        storeRefresher.loadInputAssets(result.inputAssets);
      }
    }

    logger.info('Scene loaded successfully');
  }

  /**
   * Load scene from static data (for scene files like Test.tsx)
   * This is the ONLY place that handles:
   * - Material loading
   * - Prefab loading (with async import)
   * - Entity loading
   * - Input asset loading
   * - Store cache refresh
   * Scene files just call this method with their data
   */
  async loadStatic(
    entities: unknown[],
    materials: unknown[],
    prefabs: unknown[],
    entityManager: IEntityManager,
    componentManager: IComponentManager,
    storeRefresher?: IStoreRefresher,
    inputAssets?: IInputActionsAsset[],
  ): Promise<void> {
    logger.info('Loading static scene', {
      entities: entities.length,
      materials: materials.length,
      prefabs: prefabs.length,
      inputAssets: inputAssets?.length || 0,
    });

    // Load in correct order: materials -> prefabs -> entities -> input assets
    this.materialSerializer.deserialize(materials);
    await this.prefabSerializer.deserialize(prefabs);
    this.entitySerializer.deserialize(entities, entityManager, componentManager);

    if (storeRefresher) {
      logger.debug('Refreshing store caches');
      storeRefresher.refreshMaterials();
      storeRefresher.refreshPrefabs();

      // Load input assets if provided
      if (inputAssets && storeRefresher.loadInputAssets) {
        logger.debug('Loading input assets', { count: inputAssets.length });
        storeRefresher.loadInputAssets(inputAssets);
      }
    }

    logger.info('Static scene loaded successfully');
  }

  /**
   * Clear all scene data
   */
  async clear(entityManager: IEntityManager, storeRefresher?: IStoreRefresher): Promise<void> {
    logger.info('Clearing scene');

    entityManager.clearEntities();
    this.materialSerializer.clear();
    await this.prefabSerializer.clear();

    if (storeRefresher) {
      logger.debug('Refreshing store caches');
      storeRefresher.refreshMaterials();
      storeRefresher.refreshPrefabs();
    }

    logger.info('Scene cleared');
  }
}
