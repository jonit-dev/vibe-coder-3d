import { useRef } from 'react';

import { diffAgainstBase } from '@/core/lib/serialization/SceneDiff';
import { overridesStore } from '@/core/lib/scene/overrides/OverridesStore';
import { sceneRegistry } from '@/core/lib/scene/SceneRegistry';
import { useProjectToasts, useToastStore } from '@core/stores/toastStore';
import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: unknown[];
}

/**
 * Hook that provides scene action functions (save, load, clear)
 * Now uses the new ECS system as single source of truth with toast notifications
 */
export function useSceneActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const projectToasts = useProjectToasts();
  const { removeToast } = useToastStore();

  // Simple scene serialization using new ECS system
  const exportScene = (): ISerializedScene => {
    const entities = entityManager.getAllEntities();
    const serializedEntities = entities.map((entity) => {
      const entityComponents = componentManager.getComponentsForEntity(entity.id);
      const entityData: Record<string, any> = {
        id: entity.id,
        name: entity.name,
        parentId: entity.parentId,
        components: {},
      };

      entityComponents.forEach((component) => {
        if (component.data) {
          (entityData.components as Record<string, any>)[component.type] = component.data;
        }
      });

      return entityData;
    });

    return {
      version: 3, // Increment version for new ECS format
      entities: serializedEntities,
    };
  };

  // Simple scene import using new ECS system
  const importScene = async (scene: ISerializedScene): Promise<void> => {
    if (!scene || !scene.entities) {
      throw new Error('Invalid scene data');
    }

    // Clear existing entities first - EntityManager handles components automatically
    entityManager.clearEntities();

    // Import entities
    for (const entityData of scene.entities) {
      try {
        const entity = entityManager.createEntity(
          (entityData as any).name || `Entity ${(entityData as any).id}`,
          (entityData as any).parentId,
        );

        // Add components
        for (const [componentType, componentData] of Object.entries(
          (entityData as any).components || {},
        )) {
          if (componentData) {
            componentManager.addComponent(entity.id, componentType, componentData);
          }
        }
      } catch (error) {
        console.error('Failed to import entity:', entityData, error);
      }
    }
  };

  // Temporarily disabled localStorage loading to use SceneRegistry instead
  const savedScene = null;

  const handleSave = async (): Promise<void> => {
    const loadingToastId = projectToasts.showOperationStart('Saving Overrides');

    try {
      const currentSceneId = sceneRegistry.getCurrentSceneId();
      if (!currentSceneId) {
        throw new Error('No scene loaded');
      }

      // Compute overrides against the base scene
      const overrides = diffAgainstBase(currentSceneId);

      // Save overrides file
      await overridesStore.save(overrides);

      // Remove loading toast and show success
      removeToast(loadingToastId);
      projectToasts.showOperationSuccess(
        'Save',
        `Successfully saved ${overrides.patches.length} changes for ${currentSceneId}`,
      );
    } catch (error) {
      console.error('Failed to save overrides:', error);
      // Remove loading toast and show error
      removeToast(loadingToastId);
      projectToasts.showOperationError(
        'Save',
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  };

  const handleLoad = async (e?: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const loadingToastId = projectToasts.showOperationStart('Loading Overrides');

    try {
      // Load overrides file
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
        // Ask user if they want to switch scenes first
        removeToast(loadingToastId);
        projectToasts.showOperationError(
          'Load',
          `Overrides are for scene '${overrides.sceneId}', but current scene is '${currentSceneId}'`,
        );
        return;
      }

      // Apply overrides using the override applier
      const { applyOverrides } = await import('@/core/lib/scene/overrides/OverrideApplier');
      applyOverrides(overrides);

      // Remove loading toast and show success
      removeToast(loadingToastId);
      projectToasts.showOperationSuccess(
        'Load',
        `Successfully loaded ${overrides.patches.length} overrides for ${overrides.sceneId}`,
      );
    } catch (error) {
      console.error('Failed to load overrides:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Remove loading toast and show error
      removeToast(loadingToastId);
      projectToasts.showOperationError('Load', errorMessage);
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
      const scene = exportScene();
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
        await importScene(scene);
        return `Scene loaded with ${scene.entities?.length || 0} entities`;
      } catch (error) {
        console.error('Failed to load scene from file:', error);
        return 'Failed to load scene file';
      }
    } else if (savedScene) {
      try {
        await importScene(savedScene);
        return `Scene loaded with ${savedScene.entities?.length || 0} entities`;
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

  return {
    fileInputRef,
    savedScene,
    // New toast-enabled methods
    handleSave,
    handleLoad,
    handleClear,
    // Legacy methods for backward compatibility
    handleSaveLegacy,
    handleLoadLegacy,
    handleClearLegacy,
    triggerFileLoad,
    importScene,
    exportScene,
  };
}
