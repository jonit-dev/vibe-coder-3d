/**
 * High-Performance Streaming Scene Serializer
 *
 * Features:
 * - Streaming export/import for large scenes
 * - Chunked processing to prevent UI blocking
 * - Memory-efficient entity batching
 * - Progressive loading with real-time feedback
 * - Scalable to thousands of entities
 * - Single source of truth for all serialization
 */

import { z } from 'zod';

// Streaming configuration
const STREAM_CONFIG = {
  CHUNK_SIZE: 100, // Entities per chunk
  CHUNK_DELAY: 16, // 16ms = ~60fps (1 frame)
  MAX_MEMORY_ENTITIES: 1000, // Entities to keep in memory
  PROGRESS_UPDATE_INTERVAL: 50, // Progress updates every N entities
} as const;

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import type { IPrefabDefinition } from '@/core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@/core/lib/input/inputTypes';
import { getComponentDefaults } from './defaults';
import { restoreDefaults } from './utils/DefaultOmitter';

// Core interfaces
export interface IStreamingEntity {
  id?: string | number;
  name: string;
  parentId?: string | number | null;
  components: Record<string, unknown>;
}

export interface IStreamingScene {
  version: number;
  name?: string;
  timestamp: string;
  totalEntities: number;
  entities: IStreamingEntity[];
  materials: IMaterialDefinition[];
  prefabs?: IPrefabDefinition[];
  inputAssets?: IInputActionsAsset[];
}

export interface IStreamingProgress {
  phase: 'initializing' | 'processing' | 'finalizing' | 'complete' | 'error';
  current: number;
  total: number;
  percentage: number;
  entitiesPerSecond?: number;
  estimatedTimeRemaining?: number;
  currentEntityName?: string;
}

export interface IStreamingCallbacks {
  onProgress?: (progress: IStreamingProgress) => void;
  onChunkProcessed?: (chunkIndex: number, entities: IStreamingEntity[]) => void;
  onError?: (error: Error, entityIndex?: number) => void;
  onComplete?: (summary: { totalEntities: number; timeElapsed: number }) => void;
}

// Import material and prefab schemas
import { MaterialDefinitionSchema } from '@/core/materials/Material.types';
import { PrefabDefinitionSchema } from '@/core/prefabs/Prefab.types';
import { InputActionsAssetSchema } from '@/core/lib/input/inputTypes';

// Zod schema for validation
const StreamingEntitySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(), // Optional - auto-generated from array position if not provided
  name: z.string(),
  parentId: z.union([z.string(), z.number()]).optional().nullable(),
  components: z.record(z.unknown()),
});

const StreamingSceneSchema = z
  .object({
    version: z.number(),
    name: z.string().optional(),
    timestamp: z.string().optional(), // Optional for backward compatibility
    totalEntities: z.number().optional(), // Optional for backward compatibility
    entities: z.array(StreamingEntitySchema),
    materials: z.array(MaterialDefinitionSchema).optional().default([]), // Optional for backward compatibility
    prefabs: z.array(PrefabDefinitionSchema).optional().default([]), // Optional prefabs array
    inputAssets: z.array(InputActionsAssetSchema).optional().default([]), // Optional input assets array
  })
  .transform((data) => ({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
    totalEntities: data.totalEntities ?? data.entities.length,
    materials: data.materials || [],
    prefabs: data.prefabs || [],
    inputAssets: data.inputAssets || [],
  }));

/**
 * Performance-optimized entity processor with memory management
 */
class EntityProcessor {
  private entityCache = new Map<string, IStreamingEntity>();
  private processingQueue: IStreamingEntity[] = [];

  addEntity(entity: IStreamingEntity): void {
    const key = String(entity.id);
    this.entityCache.set(key, entity);
    this.processingQueue.push(entity);

    // Memory management - keep cache under limit
    if (this.entityCache.size > STREAM_CONFIG.MAX_MEMORY_ENTITIES) {
      this.evictOldestEntities();
    }
  }

  processChunk(size: number): IStreamingEntity[] {
    const chunk = this.processingQueue.splice(0, size);
    return chunk;
  }

  getEntity(id: string | number): IStreamingEntity | undefined {
    return this.entityCache.get(String(id));
  }

  clear(): void {
    this.entityCache.clear();
    this.processingQueue.length = 0;
  }

  private evictOldestEntities(): void {
    const entriesToRemove = this.entityCache.size - STREAM_CONFIG.MAX_MEMORY_ENTITIES + 100;
    const keysToRemove = Array.from(this.entityCache.keys()).slice(0, entriesToRemove);

    keysToRemove.forEach((key) => this.entityCache.delete(key));
  }
}

/**
 * High-performance streaming scene serializer
 */
export class StreamingSceneSerializer {
  private processor = new EntityProcessor();
  private abortController: AbortController | null = null;

  /**
   * Stream export scene data with chunked processing
   */
  async exportScene(
    entities: Array<{ id: string | number; name: string; parentId?: string | number | null }>,
    getComponentsForEntity: (entityId: string | number) => Array<{ type: string; data: unknown }>,
    metadata: { name?: string; version?: number } = {},
    callbacks: IStreamingCallbacks = {},
    getMaterials?: () => IMaterialDefinition[],
    getPrefabs?: () => IPrefabDefinition[] | Promise<IPrefabDefinition[]>,
  ): Promise<IStreamingScene> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    try {
      callbacks.onProgress?.({
        phase: 'initializing',
        current: 0,
        total: entities.length,
        percentage: 0,
      });

      const streamingEntities: IStreamingEntity[] = [];
      let processed = 0;

      // Process entities in chunks to prevent UI blocking
      for (let i = 0; i < entities.length; i += STREAM_CONFIG.CHUNK_SIZE) {
        if (this.abortController.signal.aborted) {
          throw new Error('Export cancelled');
        }

        const chunk = entities.slice(i, i + STREAM_CONFIG.CHUNK_SIZE);
        const chunkResults: IStreamingEntity[] = [];

        // Process chunk
        for (const entity of chunk) {
          try {
            const components = getComponentsForEntity(entity.id);
            const componentData: Record<string, unknown> = {};

            components.forEach(({ type, data }) => {
              if (data) componentData[type] = data;
            });

            const streamingEntity: IStreamingEntity = {
              id: String(entity.id), // Normalize to string for consistency
              name: entity.name || `Entity ${entity.id}`,
              parentId: entity.parentId ? String(entity.parentId) : null,
              components: componentData,
            };

            chunkResults.push(streamingEntity);
            processed++;

            // Progress update
            if (processed % STREAM_CONFIG.PROGRESS_UPDATE_INTERVAL === 0) {
              const elapsed = performance.now() - startTime;
              const entitiesPerSecond = processed / (elapsed / 1000);
              const remaining = entities.length - processed;
              const estimatedTimeRemaining = remaining / entitiesPerSecond;

              callbacks.onProgress?.({
                phase: 'processing',
                current: processed,
                total: entities.length,
                percentage: (processed / entities.length) * 100,
                entitiesPerSecond,
                estimatedTimeRemaining,
                currentEntityName: entity.name,
              });
            }
          } catch (error) {
            console.error(`Failed to process entity ${entity.id}:`, error);
            callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error'), i);
          }
        }

        streamingEntities.push(...chunkResults);
        callbacks.onChunkProcessed?.(Math.floor(i / STREAM_CONFIG.CHUNK_SIZE), chunkResults);

        // Yield control to prevent blocking
        if (STREAM_CONFIG.CHUNK_DELAY > 0) {
          await new Promise((resolve) => setTimeout(resolve, STREAM_CONFIG.CHUNK_DELAY));
        }
      }

      callbacks.onProgress?.({
        phase: 'finalizing',
        current: entities.length,
        total: entities.length,
        percentage: 100,
      });

      // Get materials if provider function is available
      const materials = getMaterials ? getMaterials() : [];

      // Get prefabs if provider function is available
      const prefabs = getPrefabs ? await getPrefabs() : [];

      const scene: IStreamingScene = {
        version: metadata.version || 7, // Bumped version for prefabs support
        name: metadata.name,
        timestamp: new Date().toISOString(),
        totalEntities: streamingEntities.length,
        entities: streamingEntities,
        materials,
        prefabs,
      };

      // Validate the serialized scene
      const validation = StreamingSceneSchema.safeParse(scene);
      if (!validation.success) {
        throw new Error(`Scene validation failed: ${validation.error.message}`);
      }

      const endTime = performance.now();
      callbacks.onComplete?.({
        totalEntities: streamingEntities.length,
        timeElapsed: endTime - startTime,
      });

      callbacks.onProgress?.({
        phase: 'complete',
        current: entities.length,
        total: entities.length,
        percentage: 100,
      });

      return scene;
    } catch (error) {
      callbacks.onProgress?.({
        phase: 'error',
        current: 0,
        total: entities.length,
        percentage: 0,
      });
      throw error;
    }
  }

  /**
   * Stream import scene data with chunked processing
   */
  async importScene(
    scene: unknown,
    entityManager: {
      clearEntities: () => void;
      createEntity: (
        name: string,
        parentId?: string | number | null,
        persistentId?: string,
      ) => { id: string | number };
      setParent?: (childId: string | number, parentId?: string | number | null) => void;
    },
    componentManager: {
      addComponent: (
        entityId: string | number,
        componentType: string,
        componentData: unknown,
      ) => void;
    },
    callbacks: IStreamingCallbacks = {},
    materialManager?: {
      clearMaterials: () => void;
      upsertMaterial: (material: IMaterialDefinition) => void;
    },
    prefabManager?: {
      clearPrefabs: () => Promise<void> | void;
      registerPrefab: (prefab: IPrefabDefinition) => Promise<void> | void;
    },
  ): Promise<void> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    try {
      // Validate scene structure
      const validatedScene = StreamingSceneSchema.parse(scene);

      callbacks.onProgress?.({
        phase: 'initializing',
        current: 0,
        total: validatedScene.entities.length,
        percentage: 0,
      });

      // Clear existing entities and materials
      entityManager.clearEntities();
      this.processor.clear();

      // Import materials first if manager is provided
      if (materialManager && validatedScene.materials.length > 0) {
        materialManager.clearMaterials();
        for (const material of validatedScene.materials) {
          materialManager.upsertMaterial(material);
        }
      }

      // Import prefabs first if manager is provided
      // NOTE: Prefabs are registered in the order they appear in the scene file
      if (prefabManager && validatedScene.prefabs && validatedScene.prefabs.length > 0) {
        await prefabManager.clearPrefabs();
        // IMPORTANT: Iterate in order to preserve prefab registration order
        for (const prefab of validatedScene.prefabs) {
          await prefabManager.registerPrefab(prefab);
        }
      }

      const idMap = new Map<string, string | number>();
      let processed = 0;

      // First pass: Create entities in chunks
      for (let i = 0; i < validatedScene.entities.length; i += STREAM_CONFIG.CHUNK_SIZE) {
        if (this.abortController.signal.aborted) {
          throw new Error('Import cancelled');
        }

        const chunk = validatedScene.entities.slice(i, i + STREAM_CONFIG.CHUNK_SIZE);

        for (const entityData of chunk) {
          try {
            const persistentId = (entityData.components as Record<string, unknown>)
              ?.PersistentId as { id?: string } | undefined;
            const persistentIdValue = persistentId?.id;

            const entityIdForMap = entityData.id !== undefined ? String(entityData.id) : `temp_${i}`;

            const created = entityManager.createEntity(
              entityData.name || `Entity ${entityIdForMap}`,
              undefined,
              persistentIdValue,
            );

            idMap.set(entityIdForMap, created.id);

            // Add components (except PersistentId)
            const componentEntries = Object.entries(entityData.components || {});
            for (const [componentType, componentData] of componentEntries) {
              if (componentType === 'PersistentId' || !componentData) continue;

              // Restore defaults for compressed components
              const defaults = getComponentDefaults(componentType);
              const restoredData = defaults
                ? restoreDefaults(componentData as Record<string, unknown>, defaults)
                : componentData;

              componentManager.addComponent(created.id, componentType, restoredData);
            }

            processed++;

            // Progress update
            if (processed % STREAM_CONFIG.PROGRESS_UPDATE_INTERVAL === 0) {
              const elapsed = performance.now() - startTime;
              const entitiesPerSecond = processed / (elapsed / 1000);
              const remaining = validatedScene.entities.length - processed;
              const estimatedTimeRemaining = remaining / entitiesPerSecond;

              callbacks.onProgress?.({
                phase: 'processing',
                current: processed,
                total: validatedScene.entities.length,
                percentage: (processed / validatedScene.entities.length) * 100,
                entitiesPerSecond,
                estimatedTimeRemaining,
                currentEntityName: entityData.name,
              });
            }
          } catch (error) {
            console.error(`Failed to create entity ${entityData.id}:`, error);
            callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error'), i);
          }
        }

        callbacks.onChunkProcessed?.(Math.floor(i / STREAM_CONFIG.CHUNK_SIZE), chunk);

        // Yield control
        if (STREAM_CONFIG.CHUNK_DELAY > 0) {
          await new Promise((resolve) => setTimeout(resolve, STREAM_CONFIG.CHUNK_DELAY));
        }
      }

      // Second pass: Set up parent relationships
      if (entityManager.setParent) {
        for (const entityData of validatedScene.entities) {
          if (entityData.parentId === undefined || entityData.parentId === null) continue;

          const childEid = idMap.get(String(entityData.id));
          const parentEid = idMap.get(String(entityData.parentId));

          if (childEid !== undefined && parentEid !== undefined) {
            entityManager.setParent(childEid, parentEid);
          }
        }
      }

      const endTime = performance.now();
      callbacks.onComplete?.({
        totalEntities: validatedScene.entities.length,
        timeElapsed: endTime - startTime,
      });

      callbacks.onProgress?.({
        phase: 'complete',
        current: validatedScene.entities.length,
        total: validatedScene.entities.length,
        percentage: 100,
      });
    } catch (error) {
      callbacks.onProgress?.({
        phase: 'error',
        current: 0,
        total: 0,
        percentage: 0,
      });
      throw error;
    }
  }

  /**
   * Cancel ongoing streaming operation
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Validate scene data without importing
   */
  validateScene(scene: unknown): { isValid: boolean; error?: string } {
    try {
      StreamingSceneSchema.parse(scene);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors.map((e) => e.message).join(', ') };
      }
      return { isValid: false, error: 'Unknown validation error' };
    }
  }
}

// Singleton instance for global use
export const streamingSerializer = new StreamingSceneSerializer();

/**
 * Helper function for streaming file download with progress
 */
export async function downloadSceneStream(
  scene: IStreamingScene,
  filename: string,
  onProgress?: (progress: { phase: string; percentage: number }) => void,
): Promise<void> {
  try {
    onProgress?.({ phase: 'preparing', percentage: 0 });

    const json = JSON.stringify(scene, null, 2);

    onProgress?.({ phase: 'creating-blob', percentage: 50 });

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    onProgress?.({ phase: 'downloading', percentage: 75 });

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    onProgress?.({ phase: 'complete', percentage: 100 });
  } catch (error) {
    onProgress?.({ phase: 'error', percentage: 0 });
    throw error;
  }
}

/**
 * Helper function for streaming file read with progress
 */
export function readSceneStream(
  file: File,
  onProgress?: (progress: { phase: string; percentage: number }) => void,
): Promise<IStreamingScene> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadstart = () => {
      onProgress?.({ phase: 'reading', percentage: 0 });
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentage = (e.loaded / e.total) * 100;
        onProgress?.({ phase: 'reading', percentage });
      }
    };

    reader.onload = (e) => {
      try {
        onProgress?.({ phase: 'parsing', percentage: 75 });

        const content = e.target?.result as string;
        const scene = JSON.parse(content);

        onProgress?.({ phase: 'validating', percentage: 90 });

        const validation = StreamingSceneSchema.safeParse(scene);
        if (!validation.success) {
          throw new Error(`Invalid scene format: ${validation.error.message}`);
        }

        onProgress?.({ phase: 'complete', percentage: 100 });
        resolve(validation.data);
      } catch (error) {
        onProgress?.({ phase: 'error', percentage: 0 });
        reject(error);
      }
    };

    reader.onerror = () => {
      onProgress?.({ phase: 'error', percentage: 0 });
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
