/**
 * FileSceneProvider - Provides scenes from external .scene.json files
 * Uses SceneStore for file operations and supports full CRUD operations
 */

import { sceneStore } from '../SceneStore';
import { deserializeIntoWorld, validateSceneForImport } from '../../serialization/SceneSerializer';
import type { SceneDescriptor } from '../SceneStore';
import type { SerializedScene } from '../serialization/SceneSchema';
import type {
  ISceneProvider,
  ISceneLoadOptions,
  ISceneLoadResult,
} from './ISceneProvider';

export class FileSceneProvider implements ISceneProvider {
  public readonly id = 'file';
  public readonly name = 'External Scene Files';
  public readonly canRead = true;
  public readonly canWrite = true;

  private loadedScenes: Map<string, SerializedScene> = new Map();
  private sceneMetadata: Map<string, SceneDescriptor> = new Map();

  async list(): Promise<SceneDescriptor[]> {
    try {
      // For now, return recently opened scenes from the store
      // In a full implementation, this could scan a directory or maintain an index
      const recentScenes = await sceneStore.listRecent();

      // Update our metadata cache
      recentScenes.forEach((descriptor) => {
        this.sceneMetadata.set(descriptor.id, descriptor);
      });

      return recentScenes.map((desc) => ({
        ...desc,
        source: 'file' as const,
      }));
    } catch (error) {
      console.error('[FileSceneProvider] Failed to list scenes:', error);
      return [];
    }
  }

  async get(id: string): Promise<SceneDescriptor | undefined> {
    // First check cache
    if (this.sceneMetadata.has(id)) {
      return this.sceneMetadata.get(id);
    }

    // Try to get from recent scenes
    const recentScenes = await sceneStore.listRecent();
    const found = recentScenes.find((desc) => desc.id === id);

    if (found) {
      this.sceneMetadata.set(id, found);
      return found;
    }

    return undefined;
  }

  async load(id: string, options: ISceneLoadOptions = {}): Promise<ISceneLoadResult> {
    try {
      let sceneData: SerializedScene | undefined;

      // Check if we have the scene cached
      if (this.loadedScenes.has(id)) {
        sceneData = this.loadedScenes.get(id);
      } else {
        // Try to load via getSceneData
        sceneData = await this.getSceneData(id);
      }

      if (!sceneData) {
        return {
          success: false,
          errors: [`Scene "${id}" not found or could not be loaded`],
        };
      }

      // Validate scene if requested
      if (options.validate !== false) {
        const validationErrors = validateSceneForImport(sceneData);
        if (validationErrors.length > 0) {
          return {
            success: false,
            errors: validationErrors,
          };
        }
      }

      // Get entity count before loading
      const entityManager = await import('../../ecs/EntityManager');
      const entitiesBeforeCount = entityManager.EntityManager.getInstance().getEntityCount();

      // Load the scene
      const persistentIdMap = deserializeIntoWorld(sceneData, options.clearExisting ?? true);

      // Get entity count after loading
      const entitiesAfterCount = entityManager.EntityManager.getInstance().getEntityCount();
      const entitiesCreated = options.clearExisting
        ? entitiesAfterCount
        : entitiesAfterCount - entitiesBeforeCount;

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
        errors: [`Failed to load scene "${id}": ${errorMessage}`],
      };
    }
  }

  async save(
    scene: SerializedScene,
    id: string,
    metadata?: Partial<SceneDescriptor>
  ): Promise<boolean> {
    try {
      const sceneName = metadata?.name || id;
      const result = await sceneStore.save(scene, sceneName);

      if (result.success) {
        // Cache the scene data
        this.loadedScenes.set(id, scene);

        // Update metadata
        const descriptor: SceneDescriptor = {
          id,
          guid: result.guid || crypto.randomUUID(),
          name: sceneName,
          source: 'file',
          path: result.path,
          updatedAt: new Date().toISOString(),
          metadata: metadata?.metadata,
          tags: metadata?.tags || ['file'],
        };

        this.sceneMetadata.set(id, descriptor);

        console.log(`[FileSceneProvider] Saved scene "${id}" successfully`);
        return true;
      } else {
        console.error(`[FileSceneProvider] Save failed: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error(`[FileSceneProvider] Failed to save scene "${id}":`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const metadata = await this.get(id);
      if (!metadata || !metadata.path) {
        console.warn(`[FileSceneProvider] Cannot delete scene "${id}" - no path information`);
        return false;
      }

      const success = await sceneStore.delete(metadata.path);

      if (success) {
        // Remove from caches
        this.loadedScenes.delete(id);
        this.sceneMetadata.delete(id);
        console.log(`[FileSceneProvider] Deleted scene "${id}" successfully`);
      }

      return success;
    } catch (error) {
      console.error(`[FileSceneProvider] Failed to delete scene "${id}":`, error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const metadata = await this.get(id);
    if (!metadata || !metadata.path) {
      return false;
    }

    return sceneStore.exists(metadata.path);
  }

  async getSceneData(id: string): Promise<SerializedScene | undefined> {
    try {
      // Check cache first
      if (this.loadedScenes.has(id)) {
        return this.loadedScenes.get(id);
      }

      // For file provider, we need to prompt user to open a file
      // This is a limitation of browser-based file access
      console.warn(
        '[FileSceneProvider] Getting scene data requires user interaction to select file'
      );

      // In a real implementation, this might:
      // 1. Use a maintained index of file paths
      // 2. Prompt user to select the file
      // 3. Use a server-side API to access files

      // For now, try to open via scene store (will prompt user)
      const result = await sceneStore.open();
      if (result) {
        // Cache the loaded scene
        this.loadedScenes.set(id, result.scene);

        // Update metadata if we got descriptor info
        if (result.descriptor.id) {
          this.sceneMetadata.set(id, result.descriptor as SceneDescriptor);
        }

        return result.scene;
      }

      return undefined;
    } catch (error) {
      console.error(`[FileSceneProvider] Failed to get scene data for "${id}":`, error);
      return undefined;
    }
  }

  /**
   * Load a scene from a file picker (user interaction)
   */
  async loadFromFilePicker(): Promise<{ id: string; descriptor: SceneDescriptor } | null> {
    try {
      const result = await sceneStore.open();
      if (result) {
        const id = result.descriptor.id || crypto.randomUUID();
        const descriptor: SceneDescriptor = {
          id,
          guid: result.descriptor.guid || crypto.randomUUID(),
          name: result.descriptor.name || 'Imported Scene',
          source: 'file',
          path: result.descriptor.path,
          updatedAt: result.descriptor.updatedAt || new Date().toISOString(),
          metadata: result.descriptor.metadata,
          tags: result.descriptor.tags || ['file', 'imported'],
        };

        // Cache the scene and metadata
        this.loadedScenes.set(id, result.scene);
        this.sceneMetadata.set(id, descriptor);

        return { id, descriptor };
      }

      return null;
    } catch (error) {
      console.error('[FileSceneProvider] Failed to load from file picker:', error);
      return null;
    }
  }

  /**
   * Save current world as a new scene file
   */
  async saveCurrentWorld(name?: string): Promise<string | null> {
    try {
      const { serializeWorld } = await import('../../serialization/SceneSerializer');
      const sceneData = serializeWorld();

      const id = crypto.randomUUID();
      const success = await this.save(sceneData, id, {
        name: name || 'New Scene',
        metadata: {
          description: 'Scene exported from editor',
          author: 'User',
          version: '1.0',
        },
      });

      return success ? id : null;
    } catch (error) {
      console.error('[FileSceneProvider] Failed to save current world:', error);
      return null;
    }
  }

  async initialize(): Promise<void> {
    // Initialize by loading recent scenes list
    await this.list();
  }

  async dispose(): Promise<void> {
    this.loadedScenes.clear();
    this.sceneMetadata.clear();
  }
}