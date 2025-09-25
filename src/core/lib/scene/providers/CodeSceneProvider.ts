/**
 * CodeSceneProvider - Provides scenes defined in code via SceneRegistry
 * Maps existing code-defined scenes to the provider interface
 */

import { sceneRegistry } from '../SceneRegistry';
import { serializeWorld } from '../../serialization/SceneSerializer';
import type { SceneDescriptor } from '../SceneStore';
import type { SerializedScene } from '../serialization/SceneSchema';
import type {
  ISceneProvider,
  ISceneLoadOptions,
  ISceneLoadResult,
} from './ISceneProvider';

export class CodeSceneProvider implements ISceneProvider {
  public readonly id = 'code';
  public readonly name = 'Code-Defined Scenes';
  public readonly canRead = true;
  public readonly canWrite = false; // Code scenes are read-only

  private cachedDescriptors: SceneDescriptor[] = [];
  private lastCacheUpdate = 0;
  private readonly cacheTimeout = 5000; // 5 seconds

  async list(): Promise<SceneDescriptor[]> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshCache();
    }
    return [...this.cachedDescriptors];
  }

  async get(id: string): Promise<SceneDescriptor | undefined> {
    const descriptors = await this.list();
    return descriptors.find((desc) => desc.id === id);
  }

  async load(id: string, options: ISceneLoadOptions = {}): Promise<ISceneLoadResult> {
    try {
      const sceneDefinition = sceneRegistry.getScene(id);
      if (!sceneDefinition) {
        return {
          success: false,
          errors: [`Code scene "${id}" not found in registry`],
        };
      }

      // Capture entity count before loading
      const entityManager = await import('../../ecs/EntityManager');
      const entitiesBeforeCount = entityManager.EntityManager.getInstance().getEntityCount();

      // Load the scene using existing SceneRegistry
      await sceneRegistry.loadScene(id, options.clearExisting ?? true);

      // Capture entity count after loading
      const entitiesAfterCount = entityManager.EntityManager.getInstance().getEntityCount();
      const entitiesCreated = options.clearExisting
        ? entitiesAfterCount
        : entitiesAfterCount - entitiesBeforeCount;

      // Build persistent ID mapping
      const persistentIdMap = new Map<string, number>();
      const allEntities = entityManager.EntityManager.getInstance().getAllEntities();

      allEntities.forEach((entity) => {
        const persistentId = entityManager.EntityManager.getInstance().getEntityPersistentId(entity.id);
        if (persistentId) {
          persistentIdMap.set(persistentId, entity.id);
        }
      });

      return {
        success: true,
        persistentIdMap,
        entitiesCreated,
        entitiesUpdated: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [`Failed to load code scene "${id}": ${errorMessage}`],
      };
    }
  }

  async exists(id: string): Promise<boolean> {
    const sceneDefinition = sceneRegistry.getScene(id);
    return sceneDefinition !== undefined;
  }

  async getSceneData(id: string): Promise<SerializedScene | undefined> {
    try {
      const sceneDefinition = sceneRegistry.getScene(id);
      if (!sceneDefinition) {
        return undefined;
      }

      // Temporarily load the scene to serialize it
      const entityManager = await import('../../ecs/EntityManager');

      // Save current state
      const originalScene = serializeWorld();

      // Load the code scene
      await sceneRegistry.loadScene(id, true);

      // Serialize the loaded scene
      const sceneData = serializeWorld();

      // Restore original state by clearing and loading back
      entityManager.EntityManager.getInstance().clearEntities();
      if (originalScene.entities.length > 0) {
        const { deserializeIntoWorld } = await import('../../serialization/SceneSerializer');
        deserializeIntoWorld(originalScene, false);
      }

      return sceneData;
    } catch (error) {
      console.error(`[CodeSceneProvider] Failed to get scene data for "${id}":`, error);
      return undefined;
    }
  }

  private async refreshCache(): Promise<void> {
    try {
      const sceneDefinitions = sceneRegistry.listScenes();

      this.cachedDescriptors = sceneDefinitions.map((def) => ({
        id: def.id,
        guid: def.id, // Use ID as GUID for code scenes
        name: def.name,
        source: 'code' as const,
        tags: def.metadata?.tags || ['code'],
        metadata: {
          author: def.metadata?.author,
          description: def.description,
          version: '1.0',
          previewImage: def.metadata?.previewImage,
        },
      }));

      this.lastCacheUpdate = Date.now();

      console.debug(`[CodeSceneProvider] Cached ${this.cachedDescriptors.length} code scenes`);
    } catch (error) {
      console.error('[CodeSceneProvider] Failed to refresh cache:', error);
      this.cachedDescriptors = [];
    }
  }

  async initialize(): Promise<void> {
    await this.refreshCache();
  }

  async dispose(): Promise<void> {
    this.cachedDescriptors = [];
    this.lastCacheUpdate = 0;
  }
}