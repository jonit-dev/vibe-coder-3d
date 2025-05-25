import { useRef } from 'react';

import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: any[];
}

/**
 * Hook that provides scene action functions (save, load, clear)
 * Now uses the new ECS system as single source of truth
 */
export function useSceneActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  // Simple scene serialization using new ECS system
  const exportScene = (): ISerializedScene => {
    const entities = entityManager.getAllEntities();
    const serializedEntities = entities.map((entity) => {
      const entityComponents = componentManager.getComponentsForEntity(entity.id);
      const entityData: any = {
        id: entity.id,
        name: entity.name,
        parentId: entity.parentId,
        components: {},
      };

      entityComponents.forEach((component) => {
        if (component.data) {
          entityData.components[component.type] = component.data;
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

    // Clear existing entities first
    entityManager.clearEntities();
    componentManager.clearComponents();

    // Import entities
    for (const entityData of scene.entities) {
      try {
        const entity = entityManager.createEntity(
          entityData.name || `Entity ${entityData.id}`,
          entityData.parentId,
        );

        // Add components
        for (const [componentType, componentData] of Object.entries(entityData.components)) {
          if (componentData) {
            componentManager.addComponent(entity.id, componentType, componentData);
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
      // Clear ECS entities
      const entities = entityManager.getAllEntities();
      const clearedCount = entities.length;

      entityManager.clearEntities();
      componentManager.clearComponents();

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
