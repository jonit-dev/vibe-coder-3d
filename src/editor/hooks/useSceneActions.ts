import { useRef, useState } from 'react';

import { overridesStore } from '@/core/lib/scene/overrides/OverridesStore';
import { sceneRegistry } from '@/core/lib/scene/SceneRegistry';
import { diffAgainstBase } from '@/core/lib/serialization/SceneDiff';
import {
  exportScene,
  importScene,
  type ISerializedScene,
} from '@/core/lib/serialization/sceneSerializer';
import { useProjectToasts, useToastStore } from '@/core/stores/toastStore';
import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';
import { useScenePersistence } from './useScenePersistence';

// Re-export from serializer for backward compatibility
export type { ISerializedScene } from '@/core/lib/serialization/sceneSerializer';

interface ISceneActionsOptions {
  onRequestSaveAs?: () => void;
}

/**
 * Hook that provides scene action functions (save, load, clear)
 * Now uses the new ECS system as single source of truth with toast notifications
 */
export function useSceneActions(options: ISceneActionsOptions = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSaveName, setPendingSaveName] = useState<string>('');
  const [currentSceneName, setCurrentSceneName] = useState<string | null>(null);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const projectToasts = useProjectToasts();
  const { removeToast } = useToastStore();
  const scenePersistence = useScenePersistence();

  // Enhanced scene serialization using dedicated serializer
  const exportSceneData = (metadata?: { name?: string }): ISerializedScene => {
    const entities = entityManager.getAllEntities();
    const getComponentsForEntity = (entityId: string) =>
      componentManager.getComponentsForEntity(entityId);

    return exportScene(entities, getComponentsForEntity, {
      version: 4, // Version 4 for API persistence
      name: metadata?.name,
      timestamp: new Date().toISOString(),
    });
  };

  // Enhanced scene import using dedicated serializer
  const importSceneData = async (scene: ISerializedScene): Promise<void> => {
    await importScene(scene, entityManager, componentManager);
  };

  // Temporarily disabled localStorage loading to use SceneRegistry instead
  const savedScene: { entities?: unknown[] } | null = null;

  // Save current scene (no name prompt if scene already exists)
  const handleSave = async (): Promise<void> => {
    if (currentSceneName) {
      // Quick save to existing scene
      await handleSaveAs(currentSceneName);
    } else {
      // No current scene, trigger save as dialog
      if (options.onRequestSaveAs) {
        options.onRequestSaveAs();
      } else {
        projectToasts.showOperationError(
          'Save',
          'No scene loaded. Use "Save As" to save with a name.',
        );
      }
    }
  };

  // Save As with name prompt
  const handleSaveAs = async (sceneName?: string): Promise<void> => {
    const loadingToastId = projectToasts.showOperationStart('Saving Scene');

    try {
      // If no scene name provided, this is likely a legacy override save
      if (!sceneName) {
        const currentSceneId = sceneRegistry.getCurrentSceneId();
        if (!currentSceneId) {
          throw new Error('No scene loaded');
        }

        // Compute overrides against the base scene
        const overrides = diffAgainstBase(currentSceneId);

        // Save overrides file
        await overridesStore.save(overrides);

        removeToast(loadingToastId);
        projectToasts.showOperationSuccess(
          'Save',
          `Successfully saved ${overrides.patches.length} changes for ${currentSceneId}`,
        );
        return;
      }

      // New TSX-based save - transform entities to expected format
      const entities = entityManager.getAllEntities();
      const transformedEntities = entities.map((entity) => {
        const entityComponents = componentManager.getComponentsForEntity(entity.id);
        const components: Record<string, any> = {};

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

      console.log('[useSceneActions] Transformed entities:', transformedEntities.length);
      const success = await scenePersistence.saveTsxScene(sceneName, transformedEntities);

      removeToast(loadingToastId);

      if (success) {
        // Update current scene name after successful save
        setCurrentSceneName(sceneName);
        localStorage.setItem('lastLoadedScene', sceneName);

        projectToasts.showOperationSuccess(
          'Save',
          `Successfully saved scene '${sceneName}' with ${transformedEntities.length} entities as TSX component`,
        );
      } else {
        projectToasts.showOperationError('Save', scenePersistence.error || 'Failed to save scene');
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
      removeToast(loadingToastId);
      projectToasts.showOperationError(
        'Save',
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  };

  const handleLoad = async (
    sceneNameOrEvent?: string | React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const loadingToastId = projectToasts.showOperationStart('Loading Scene');

    try {
      // Handle file input event (legacy)
      if (
        sceneNameOrEvent &&
        typeof sceneNameOrEvent !== 'string' &&
        sceneNameOrEvent.target?.files
      ) {
        const file = sceneNameOrEvent.target.files[0];
        if (!file) {
          removeToast(loadingToastId);
          projectToasts.showOperationError('Load', 'No file selected');
          return;
        }

        const text = await file.text();
        const sceneData = JSON.parse(text);
        await importSceneData(sceneData);

        removeToast(loadingToastId);
        projectToasts.showOperationSuccess(
          'Load',
          `Successfully loaded scene from file with ${sceneData.entities?.length || 0} entities`,
        );
        return;
      }

      // Handle scene name (API loading with TSX support)
      if (sceneNameOrEvent && typeof sceneNameOrEvent === 'string') {
        const sceneData = await scenePersistence.loadScene(sceneNameOrEvent);

        if (!sceneData) {
          removeToast(loadingToastId);
          projectToasts.showOperationError(
            'Load',
            scenePersistence.error || 'Failed to load scene',
          );
          return;
        }

        await importSceneData(sceneData);

        // Store the last loaded scene in localStorage and update current scene state
        localStorage.setItem('lastLoadedScene', sceneNameOrEvent);
        setCurrentSceneName(sceneNameOrEvent);

        removeToast(loadingToastId);
        projectToasts.showOperationSuccess(
          'Load',
          `Successfully loaded scene '${sceneNameOrEvent}' with ${sceneData.entities.length} entities`,
        );
        return;
      }

      // Fallback to override loading (legacy)
      const overrides = await overridesStore.load();

      if (!overrides) {
        removeToast(loadingToastId);
        projectToasts.showOperationError('Load', 'No overrides file selected');
        return;
      }

      const currentSceneId = sceneRegistry.getCurrentSceneId();
      if (!currentSceneId) {
        removeToast(loadingToastId);
        projectToasts.showOperationError('Load', 'No scene currently loaded');
        return;
      }

      if (overrides.sceneId !== currentSceneId) {
        removeToast(loadingToastId);
        projectToasts.showOperationError(
          'Load',
          `Overrides are for scene '${overrides.sceneId}', but current scene is '${currentSceneId}'`,
        );
        return;
      }

      const { applyOverrides } = await import('@/core/lib/scene/overrides/OverrideApplier');
      applyOverrides(overrides);

      removeToast(loadingToastId);
      projectToasts.showOperationSuccess(
        'Load',
        `Successfully loaded ${overrides.patches.length} overrides for ${overrides.sceneId}`,
      );
    } catch (error) {
      console.error('Failed to load scene:', error);
      removeToast(loadingToastId);
      projectToasts.showOperationError(
        'Load',
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  };

  const handleClear = (): void => {
    const loadingToastId = projectToasts.showOperationStart('Clearing Scene');

    try {
      // Get entity count before clearing
      const entities = entityManager.getAllEntities();
      const clearedCount = entities.length;

      // Clear entities - EntityManager handles components automatically
      entityManager.clearEntities();

      // Remove loading toast and show success
      removeToast(loadingToastId);
      projectToasts.showOperationSuccess('Clear', `Successfully cleared ${clearedCount} entities`);
    } catch (error) {
      console.error('Failed to clear scene:', error);

      // Remove loading toast and show error
      removeToast(loadingToastId);
      projectToasts.showOperationError(
        'Clear',
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  };

  const triggerFileLoad = () => {
    console.log('[SceneActions] Triggering file load, fileInputRef:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('[SceneActions] File input ref is null');
      projectToasts.showOperationError('Load', 'File input not available');
    }
  };

  // Legacy methods that return strings for backward compatibility
  const handleSaveLegacy = (): string => {
    try {
      const scene = exportSceneData();
      localStorage.setItem('editorScene', JSON.stringify(scene));
      return `Scene saved with ${scene.entities.length} entities`;
    } catch (error) {
      console.error('Failed to save scene:', error);
      return 'Failed to save scene';
    }
  };

  const handleLoadLegacy = async (e?: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
    if (e && e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const scene = JSON.parse(text);
        await importSceneData(scene);
        return `Scene loaded with ${scene.entities?.length || 0} entities`;
      } catch (error) {
        console.error('Failed to load scene from file:', error);
        return 'Failed to load scene file';
      }
    } else if (savedScene) {
      try {
        await importSceneData(savedScene as ISerializedScene);
        return `Scene loaded with ${(savedScene as any)?.entities?.length || 0} entities`;
      } catch (error) {
        console.error('Failed to load saved scene:', error);
        return 'Failed to load saved scene';
      }
    }
    return 'No scene to load';
  };

  const handleClearLegacy = (): string => {
    try {
      // Clear ECS entities
      const entities = entityManager.getAllEntities();
      const clearedCount = entities.length;

      entityManager.clearEntities();

      return `Cleared ${clearedCount} entities`;
    } catch (error) {
      console.error('Failed to clear scene:', error);
      return 'Failed to clear scene';
    }
  };

  // Get the last loaded scene from localStorage
  const getLastLoadedScene = (): string | null => {
    return localStorage.getItem('lastLoadedScene');
  };

  // Load the last scene automatically
  const loadLastScene = async (): Promise<boolean> => {
    const lastScene = getLastLoadedScene();
    if (lastScene) {
      try {
        await handleLoad(lastScene);
        return true;
      } catch (error) {
        console.warn('Failed to load last scene:', lastScene, error);
        // Clear invalid scene from localStorage
        localStorage.removeItem('lastLoadedScene');
        setCurrentSceneName(null);
        return false;
      }
    }
    return false;
  };

  return {
    fileInputRef,
    savedScene,
    pendingSaveName,
    setPendingSaveName,
    // Enhanced methods with API support
    handleSave,
    handleLoad,
    handleClear,
    // Legacy methods for backward compatibility
    handleSaveLegacy,
    handleLoadLegacy,
    handleClearLegacy,
    triggerFileLoad,
    // Exported for external use
    importScene: importSceneData,
    exportScene: exportSceneData,
    // Scene persistence state and actions
    scenePersistence,
    // Last scene utilities
    getLastLoadedScene,
    loadLastScene,
    // Current scene state
    currentSceneName,
    setCurrentSceneName,
    // Save methods
    handleSaveAs,
  };
}
