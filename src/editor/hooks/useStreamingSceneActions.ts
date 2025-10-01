/**
 * High-Performance Streaming Scene Actions Hook
 *
 * Single unified scene serialization system with:
 * - Streaming export/import for large scenes
 * - Real-time progress feedback
 * - Memory-efficient processing
 * - Scalable to thousands of entities
 * - Performance monitoring
 */

import { useCallback, useRef, useState } from 'react';

import {
  streamingSerializer,
  downloadSceneStream,
  readSceneStream,
  type IStreamingScene,
  type IStreamingProgress,
  type IStreamingCallbacks,
} from '@/core/lib/serialization/StreamingSceneSerializer';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import type { IPrefabDefinition } from '@/core/prefabs/Prefab.types';
import { useProjectToasts, useToastStore } from '@/core/stores/toastStore';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';
import { useScenePersistence } from './useScenePersistence';

export interface IStreamingSceneActionsOptions {
  onRequestSaveAs?: () => void;
  onProgressUpdate?: (progress: IStreamingProgress) => void;
}

export interface ISceneProgress {
  isActive: boolean;
  phase: string;
  percentage: number;
  current: number;
  total: number;
  entitiesPerSecond?: number;
  estimatedTimeRemaining?: number;
  currentEntityName?: string;
}

/**
 * Hook that provides streaming scene action functions
 * Replaces all previous serialization systems with single streaming solution
 */
export function useStreamingSceneActions(options: IStreamingSceneActionsOptions = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSceneName, setCurrentSceneName] = useState<string | null>(null);
  const [progress, setProgress] = useState<ISceneProgress>({
    isActive: false,
    phase: 'idle',
    percentage: 0,
    current: 0,
    total: 0,
  });

  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const projectToasts = useProjectToasts();
  const { removeToast } = useToastStore();
  const scenePersistence = useScenePersistence();

  // Progress handler for streaming operations
  const handleProgress = useCallback(
    (streamingProgress: IStreamingProgress) => {
      const sceneProgress: ISceneProgress = {
        isActive: streamingProgress.phase !== 'complete' && streamingProgress.phase !== 'error',
        phase: streamingProgress.phase,
        percentage: streamingProgress.percentage,
        current: streamingProgress.current,
        total: streamingProgress.total,
        entitiesPerSecond: streamingProgress.entitiesPerSecond,
        estimatedTimeRemaining: streamingProgress.estimatedTimeRemaining,
        currentEntityName: streamingProgress.currentEntityName,
      };

      setProgress(sceneProgress);
      options.onProgressUpdate?.(streamingProgress);
    },
    [options],
  );

  // Streaming callbacks
  const createStreamingCallbacks = useCallback(
    (operation: string, toastId?: string): IStreamingCallbacks => ({
      onProgress: handleProgress,
      onChunkProcessed: (_chunkIndex, _entities) => {
        // Chunk processed successfully
      },
      onError: (error, entityIndex) => {
        console.error(`[StreamingScene] ${operation} error at entity ${entityIndex}:`, error);
        if (toastId) removeToast(toastId);
        projectToasts.showOperationError(operation, error.message);
      },
      onComplete: (_summary) => {
        if (toastId) removeToast(toastId);
      },
    }),
    [handleProgress, removeToast, projectToasts],
  );

  /**
   * Streaming export scene data
   */
  const exportSceneData = useCallback(
    async (metadata?: { name?: string }): Promise<IStreamingScene> => {
      const entities = entityManager.getAllEntities();
      const getComponentsForEntity = (entityId: string | number) => {
        const numberId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
        return componentManager.getComponentsForEntity(numberId);
      };

      // Get materials from MaterialRegistry
      const getMaterials = () => {
        const materialRegistry = MaterialRegistry.getInstance();
        return materialRegistry.list();
      };

      // Get prefabs from PrefabRegistry
      const getPrefabs = async () => {
        const { PrefabManager } = await import('@core/prefabs');
        const prefabManager = PrefabManager.getInstance();
        return prefabManager.getAll();
      };

      const callbacks = createStreamingCallbacks('Export');

      return await streamingSerializer.exportScene(
        entities,
        getComponentsForEntity,
        {
          version: 7, // Bumped version for prefabs support
          name: metadata?.name,
        },
        callbacks,
        getMaterials,
        getPrefabs,
      );
    },
    [entityManager, componentManager, createStreamingCallbacks],
  );

  /**
   * Streaming import scene data
   */
  const importSceneData = useCallback(
    async (scene: IStreamingScene): Promise<void> => {
      const entityManagerAdapter = {
        clearEntities: () => entityManager.clearEntities(),
        createEntity: (name: string, parentId?: string | number | null, persistentId?: string) => {
          const numberId = parentId
            ? typeof parentId === 'string'
              ? parseInt(parentId, 10)
              : parentId
            : undefined;
          return entityManager.createEntity(name, numberId, persistentId);
        },
        setParent: (childId: string | number, parentId?: string | number | null) => {
          const child = typeof childId === 'string' ? parseInt(childId, 10) : childId;
          const parent =
            parentId == null
              ? undefined
              : typeof parentId === 'string'
                ? parseInt(parentId, 10)
                : parentId;
          entityManager.setParent(child, parent);
        },
      };

      const componentManagerAdapter = {
        addComponent: (entityId: string | number, componentType: string, data: unknown) => {
          const numberId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
          return componentManager.addComponent(numberId, componentType, data);
        },
      };

      // Material manager adapter
      const materialManagerAdapter = {
        clearMaterials: () => {
          const materialRegistry = MaterialRegistry.getInstance();
          materialRegistry.clearMaterials();
        },
        upsertMaterial: (material: IMaterialDefinition) => {
          const materialRegistry = MaterialRegistry.getInstance();
          materialRegistry.upsert(material);
        },
      };

      // Prefab manager adapter
      const prefabManagerAdapter = {
        clearPrefabs: async () => {
          const { PrefabManager } = await import('@core/prefabs');
          const prefabManager = PrefabManager.getInstance();
          prefabManager.clear();
        },
        registerPrefab: async (prefab: IPrefabDefinition) => {
          const { PrefabManager } = await import('@core/prefabs');
          const prefabManager = PrefabManager.getInstance();
          prefabManager.register(prefab);
        },
      };

      const callbacks = createStreamingCallbacks('Import');

      // Scene import starting

      await streamingSerializer.importScene(
        scene,
        entityManagerAdapter,
        componentManagerAdapter,
        callbacks,
        materialManagerAdapter,
        prefabManagerAdapter,
      );

      // Refresh the materials store cache after importing
      useMaterialsStore.getState()._refreshMaterials();
    },
    [entityManager, componentManager, createStreamingCallbacks],
  );

  /**
   * Save current scene with streaming
   */
  const handleSave = useCallback(async (): Promise<void> => {
    if (currentSceneName) {
      await handleSaveAs(currentSceneName);
    } else {
      if (options.onRequestSaveAs) {
        options.onRequestSaveAs();
      } else {
        projectToasts.showOperationError(
          'Save',
          'No scene loaded. Use "Save As" to save with a name.',
        );
      }
    }
  }, [currentSceneName, options, projectToasts]);

  /**
   * Save As with streaming and progress
   */
  const handleSaveAs = useCallback(
    async (sceneName?: string): Promise<void> => {
      let loadingToastId: string | undefined;

      try {
        loadingToastId = projectToasts.showOperationStart('Saving Scene');

        if (!sceneName) {
          // Legacy override save - keep existing logic for backward compatibility
          const { sceneRegistry } = await import('@/core/lib/scene/SceneRegistry');
          const { diffAgainstBase } = await import('@/core/lib/serialization/SceneDiff');
          const { overridesStore } = await import('@/core/lib/scene/overrides/OverridesStore');

          const currentSceneId = sceneRegistry.getCurrentSceneId();
          if (!currentSceneId) {
            throw new Error('No scene loaded');
          }

          const overrides = diffAgainstBase(currentSceneId);
          await overridesStore.save(overrides);

          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationSuccess(
            'Save',
            `Successfully saved ${overrides.patches.length} changes for ${currentSceneId}`,
          );
          return;
        }

        // New streaming save
        const entities = entityManager.getAllEntities();
        const transformedEntities = entities.map((entity) => {
          const entityComponents = componentManager.getComponentsForEntity(entity.id);
          const components: Record<string, unknown> = {};

          entityComponents.forEach((component) => {
            if (component.data) {
              components[component.type] = component.data;
            }
          });

          return {
            id: entity.id,
            name: entity.name,
            parentId: entity.parentId,
            components,
          };
        });

        // Get materials for TSX scene
        const materialRegistry = MaterialRegistry.getInstance();
        const materials = materialRegistry.list();

        // Get prefabs for TSX scene
        const { PrefabManager } = await import('@core/prefabs');
        const prefabManager = PrefabManager.getInstance();
        const prefabs = prefabManager.getAll();

        // Starting scene save operation
        const success = await scenePersistence.saveTsxScene(
          sceneName,
          transformedEntities,
          materials,
          prefabs,
        );

        if (loadingToastId) removeToast(loadingToastId);

        if (success) {
          setCurrentSceneName(sceneName);
          localStorage.setItem('lastLoadedScene', sceneName);

          projectToasts.showOperationSuccess(
            'Save',
            `Successfully saved scene '${sceneName}' with ${transformedEntities.length} entities`,
          );
        } else {
          projectToasts.showOperationError(
            'Save',
            scenePersistence.error || 'Failed to save scene',
          );
        }
      } catch (error) {
        console.error('Failed to save scene:', error);
        if (loadingToastId) removeToast(loadingToastId);
        projectToasts.showOperationError(
          'Save',
          error instanceof Error ? error.message : 'Unknown error occurred',
        );
      }
    },
    [
      entityManager,
      componentManager,
      scenePersistence,
      currentSceneName,
      projectToasts,
      removeToast,
    ],
  );

  /**
   * Load scene with streaming
   */
  const handleLoad = useCallback(
    async (sceneNameOrEvent?: string | React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      let loadingToastId: string | undefined;

      try {
        loadingToastId = projectToasts.showOperationStart('Loading Scene');

        // Handle file input event (streaming file load)
        if (
          sceneNameOrEvent &&
          typeof sceneNameOrEvent !== 'string' &&
          sceneNameOrEvent.target?.files
        ) {
          const file = sceneNameOrEvent.target.files[0];
          if (!file) {
            if (loadingToastId) removeToast(loadingToastId);
            projectToasts.showOperationError('Load', 'No file selected');
            return;
          }

          // Stream read the file
          const sceneData = await readSceneStream(file, (_progress) => {
            // File read progress update
          });

          // Stream import the scene
          await importSceneData(sceneData);

          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationSuccess(
            'Load',
            `Successfully loaded scene from file with ${sceneData.entities?.length || 0} entities`,
          );
          return;
        }

        // Handle scene name (API loading)
        if (sceneNameOrEvent && typeof sceneNameOrEvent === 'string') {
          const sceneData = await scenePersistence.loadScene(sceneNameOrEvent);

          if (!sceneData) {
            if (loadingToastId) removeToast(loadingToastId);
            projectToasts.showOperationError(
              'Load',
              scenePersistence.error || 'Failed to load scene',
            );
            return;
          }

          await importSceneData(sceneData);

          localStorage.setItem('lastLoadedScene', sceneNameOrEvent);
          setCurrentSceneName(sceneNameOrEvent);

          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationSuccess(
            'Load',
            `Successfully loaded scene '${sceneNameOrEvent}' with ${sceneData.entities.length} entities`,
          );
          return;
        }

        // Fallback to override loading (legacy)
        const { overridesStore } = await import('@/core/lib/scene/overrides/OverridesStore');
        const { sceneRegistry } = await import('@/core/lib/scene/SceneRegistry');

        const overrides = await overridesStore.load();

        if (!overrides) {
          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationError('Load', 'No overrides file selected');
          return;
        }

        const currentSceneId = sceneRegistry.getCurrentSceneId();
        if (!currentSceneId) {
          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationError('Load', 'No scene currently loaded');
          return;
        }

        if (overrides.sceneId !== currentSceneId) {
          if (loadingToastId) removeToast(loadingToastId);
          projectToasts.showOperationError(
            'Load',
            `Overrides are for scene '${overrides.sceneId}', but current scene is '${currentSceneId}'`,
          );
          return;
        }

        const { applyOverrides } = await import('@/core/lib/scene/overrides/OverrideApplier');
        applyOverrides(overrides);

        if (loadingToastId) removeToast(loadingToastId);
        projectToasts.showOperationSuccess(
          'Load',
          `Successfully loaded ${overrides.patches.length} overrides for ${overrides.sceneId}`,
        );
      } catch (error) {
        console.error('Failed to load scene:', error);
        if (loadingToastId) removeToast(loadingToastId);
        projectToasts.showOperationError(
          'Load',
          error instanceof Error ? error.message : 'Unknown error occurred',
        );
      }
    },
    [importSceneData, scenePersistence, projectToasts, removeToast],
  );

  /**
   * Clear scene with streaming
   */
  const handleClear = useCallback((): void => {
    const loadingToastId = projectToasts.showOperationStart('Clearing Scene');

    try {
      const entities = entityManager.getAllEntities();
      const clearedCount = entities.length;

      // Clear entities and materials
      entityManager.clearEntities();
      const materialRegistry = MaterialRegistry.getInstance();
      materialRegistry.clearMaterials();

      // Refresh the materials store cache after clearing
      useMaterialsStore.getState()._refreshMaterials();

      removeToast(loadingToastId);
      projectToasts.showOperationSuccess(
        'Clear',
        `Successfully cleared ${clearedCount} entities and materials (Streaming)`,
      );
    } catch (error) {
      console.error('Failed to clear scene:', error);
      removeToast(loadingToastId);
      projectToasts.showOperationError(
        'Clear',
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }, [entityManager, projectToasts, removeToast]);

  /**
   * Download scene as JSON with streaming
   */
  const handleDownloadJSON = useCallback(
    async (filename = 'scene.json'): Promise<void> => {
      try {
        const scene = await exportSceneData();
        await downloadSceneStream(scene, filename, (_progress) => {
          // Download progress update
        });

        projectToasts.showOperationSuccess(
          'Download',
          `Scene downloaded as ${filename} (${scene.entities.length} entities)`,
        );
      } catch (error) {
        console.error('Failed to download scene:', error);
        projectToasts.showOperationError(
          'Download',
          error instanceof Error ? error.message : 'Failed to download scene',
        );
      }
    },
    [exportSceneData, projectToasts],
  );

  /**
   * Trigger file load dialog
   */
  const triggerFileLoad = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('[StreamingSceneActions] File input ref is null');
      projectToasts.showOperationError('Load', 'File input not available');
    }
  }, [projectToasts]);

  /**
   * Get last loaded scene
   */
  const getLastLoadedScene = useCallback((): string | null => {
    return localStorage.getItem('lastLoadedScene');
  }, []);

  /**
   * Load last scene automatically
   */
  const loadLastScene = useCallback(async (): Promise<boolean> => {
    const lastScene = getLastLoadedScene();
    if (lastScene) {
      try {
        await handleLoad(lastScene);
        return true;
      } catch (error) {
        console.warn('Failed to load last scene:', lastScene, error);
        localStorage.removeItem('lastLoadedScene');
        setCurrentSceneName(null);
        return false;
      }
    }
    return false;
  }, [getLastLoadedScene, handleLoad]);

  /**
   * Cancel ongoing streaming operation
   */
  const cancelOperation = useCallback(() => {
    streamingSerializer.cancel();
    setProgress((prev) => ({ ...prev, isActive: false, phase: 'cancelled' }));
    projectToasts.showOperationError('Operation', 'Cancelled by user');
  }, [projectToasts]);

  return {
    // File reference
    fileInputRef,

    // Core operations
    handleSave,
    handleSaveAs,
    handleLoad,
    handleClear,
    handleDownloadJSON,
    triggerFileLoad,

    // Scene management
    currentSceneName,
    setCurrentSceneName,
    getLastLoadedScene,
    loadLastScene,

    // Streaming specific
    progress,
    cancelOperation,
    exportScene: exportSceneData,
    importScene: importSceneData,

    // Legacy compatibility
    savedScene: null, // Deprecated
    pendingSaveName: '', // Deprecated
    setPendingSaveName: () => {}, // Deprecated

    // Scene persistence (for modal integration)
    scenePersistence,
  };
}
