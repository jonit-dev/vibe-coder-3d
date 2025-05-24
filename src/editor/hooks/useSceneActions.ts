import { useRef } from 'react';

import { componentManager } from '@/core/dynamic-components/init';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: any[];
}

/**
 * Hook that provides scene action functions (save, load, clear)
 * Now uses ComponentManager as single source of truth
 */
export function useSceneActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple scene serialization using ComponentManager
  const exportScene = (): ISerializedScene => {
    const entities = componentManager.getEntitiesWithComponents(['transform']);
    const serializedEntities = entities.map((entityId) => {
      const entityComponents = componentManager.getEntityComponents(entityId);
      const entityData: any = { id: entityId, components: {} };

      entityComponents.forEach((componentId) => {
        const componentData = componentManager.getComponentData(entityId, componentId);
        if (componentData) {
          entityData.components[componentId] = componentData;
        }
      });

      return entityData;
    });

    return {
      version: 2,
      entities: serializedEntities,
    };
  };

  // Simple scene import using ComponentManager
  const importScene = async (scene: ISerializedScene): Promise<void> => {
    if (!scene || !scene.entities) {
      throw new Error('Invalid scene data');
    }

    // Clear existing entities (optional)
    // For now, we'll just add to existing scene

    // Import entities
    for (const entityData of scene.entities) {
      try {
        const entityId = await componentManager.createEntity();

        // Add components
        for (const [componentId, componentData] of Object.entries(entityData.components)) {
          if (componentData) {
            await componentManager.updateComponent(entityId, componentId, componentData);
          }
        }
      } catch (error) {
        console.error('Failed to import entity:', entityData, error);
      }
    }
  };

  const savedScene = (() => {
    try {
      const saved = localStorage.getItem('editorScene');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const handleSave = (): string => {
    try {
      const scene = exportScene();
      localStorage.setItem('editorScene', JSON.stringify(scene));
      return `Scene saved with ${scene.entities.length} entities`;
    } catch (error) {
      console.error('Failed to save scene:', error);
      return 'Failed to save scene';
    }
  };

  const handleLoad = async (e?: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
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

  const handleClear = (): string => {
    try {
      // Clear ComponentManager entities
      const entities = componentManager.getEntitiesWithComponents(['transform']);
      let clearedCount = 0;

      entities.forEach((entityId) => {
        try {
          componentManager.destroyEntity(entityId);
          clearedCount++;
        } catch (error) {
          console.error(`Failed to destroy entity ${entityId}:`, error);
        }
      });

      return `Cleared ${clearedCount} entities`;
    } catch (error) {
      console.error('Failed to clear scene:', error);
      return 'Failed to clear scene';
    }
  };

  const triggerFileLoad = () => {
    fileInputRef.current?.click();
  };

  return {
    fileInputRef,
    savedScene,
    handleSave,
    handleLoad,
    handleClear,
    triggerFileLoad,
    importScene,
    exportScene,
  };
}
