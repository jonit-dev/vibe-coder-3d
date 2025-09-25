/**
 * RemoteSceneProvider - Provides scenes from remote HTTP endpoints
 * Supports loading scenes from URLs or API endpoints
 */

import type { SceneDescriptor } from '../SceneStore';
import type { SerializedScene } from '../serialization/SceneSchema';
import type {
  ISceneProvider,
  ISceneLoadOptions,
  ISceneLoadResult,
} from './ISceneProvider';

export interface IRemoteSceneConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class RemoteSceneProvider implements ISceneProvider {
  public readonly id = 'remote';
  public readonly name = 'Remote Scenes';
  public readonly canRead = true;
  public readonly canWrite = false; // Read-only for now

  private config: IRemoteSceneConfig;
  private cachedScenes: Map<string, SerializedScene> = new Map();
  private cachedDescriptors: Map<string, SceneDescriptor> = new Map();

  constructor(config: IRemoteSceneConfig) {
    this.config = {
      timeout: 10000, // 10 second default timeout
      ...config,
    };
  }

  async list(): Promise<SceneDescriptor[]> {
    try {
      const response = await this.fetch('/scenes');
      const data = await response.json();

      // Expect API to return array of scene descriptors
      if (Array.isArray(data)) {
        data.forEach((desc: SceneDescriptor) => {
          this.cachedDescriptors.set(desc.id, { ...desc, source: 'remote' });
        });

        return Array.from(this.cachedDescriptors.values());
      }

      console.warn('[RemoteSceneProvider] Unexpected response format for list()');
      return [];
    } catch (error) {
      console.error('[RemoteSceneProvider] Failed to list scenes:', error);
      return [];
    }
  }

  async get(id: string): Promise<SceneDescriptor | undefined> {
    // Check cache first
    if (this.cachedDescriptors.has(id)) {
      return this.cachedDescriptors.get(id);
    }

    try {
      const response = await this.fetch(`/scenes/${encodeURIComponent(id)}/metadata`);
      const descriptor: SceneDescriptor = await response.json();

      descriptor.source = 'remote';
      this.cachedDescriptors.set(id, descriptor);

      return descriptor;
    } catch (error) {
      console.error(`[RemoteSceneProvider] Failed to get metadata for "${id}":`, error);
      return undefined;
    }
  }

  async load(id: string, options: ISceneLoadOptions = {}): Promise<ISceneLoadResult> {
    try {
      const sceneData = await this.getSceneData(id);
      if (!sceneData) {
        return {
          success: false,
          errors: [`Remote scene "${id}" not found`],
        };
      }

      // Validate scene if requested
      if (options.validate !== false) {
        const { validateSceneForImport } = await import('../../serialization/SceneSerializer');
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
      const { deserializeIntoWorld } = await import('../../serialization/SceneSerializer');
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
        errors: [`Failed to load remote scene "${id}": ${errorMessage}`],
      };
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const response = await this.fetch(`/scenes/${encodeURIComponent(id)}/exists`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      console.error(`[RemoteSceneProvider] Failed to check existence of "${id}":`, error);
      return false;
    }
  }

  async getSceneData(id: string): Promise<SerializedScene | undefined> {
    // Check cache first
    if (this.cachedScenes.has(id)) {
      return this.cachedScenes.get(id);
    }

    try {
      const response = await this.fetch(`/scenes/${encodeURIComponent(id)}`);
      const sceneData: SerializedScene = await response.json();

      // Cache the scene data
      this.cachedScenes.set(id, sceneData);

      return sceneData;
    } catch (error) {
      console.error(`[RemoteSceneProvider] Failed to get scene data for "${id}":`, error);
      return undefined;
    }
  }

  /**
   * Load a scene from a direct URL
   */
  async loadFromUrl(url: string): Promise<{ id: string; descriptor: SceneDescriptor } | null> {
    try {
      const response = await fetch(url, {
        headers: this.config.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const sceneData: SerializedScene = await response.json();
      const id = crypto.randomUUID();

      // Create descriptor from URL and scene metadata
      const descriptor: SceneDescriptor = {
        id,
        guid: id,
        name: sceneData.metadata?.description || new URL(url).pathname.split('/').pop() || 'Remote Scene',
        source: 'remote',
        path: url,
        updatedAt: new Date().toISOString(),
        metadata: {
          description: sceneData.metadata?.description,
          version: sceneData.metadata?.engineVersion,
        },
        tags: ['remote', 'url'],
      };

      // Cache the scene and descriptor
      this.cachedScenes.set(id, sceneData);
      this.cachedDescriptors.set(id, descriptor);

      return { id, descriptor };
    } catch (error) {
      console.error(`[RemoteSceneProvider] Failed to load from URL "${url}":`, error);
      return null;
    }
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.headers || {}),
    };

    // Add options headers if they exist
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async initialize(): Promise<void> {
    // Test connection and load initial scene list
    try {
      await this.list();
      console.log(`[RemoteSceneProvider] Initialized with base URL: ${this.config.baseUrl}`);
    } catch (error) {
      console.warn('[RemoteSceneProvider] Failed to initialize - remote endpoint unavailable');
    }
  }

  async dispose(): Promise<void> {
    this.cachedScenes.clear();
    this.cachedDescriptors.clear();
  }
}