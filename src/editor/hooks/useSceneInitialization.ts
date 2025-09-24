import { useEffect, useRef } from 'react';

import { loadScene, sceneRegistry } from '@/core/lib/scene/SceneRegistry';
import { registerAllScenes } from '@/core/lib/scene/scenes';

import { useEntityManager } from './useEntityManager';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: unknown[];
}

export interface IUseSceneInitializationProps {
  savedScene: ISerializedScene | null;
  importScene: (scene: ISerializedScene) => Promise<void>;
  onStatusMessage: (message: string) => void;
}

export const useSceneInitialization = ({
  savedScene,
  importScene,
  onStatusMessage,
}: IUseSceneInitializationProps) => {
  const entityManager = useEntityManager();
  const hasInitialized = useRef(false);
  const hasRegisteredScenes = useRef(false);

  useEffect(() => {
    // Register scenes once
    if (!hasRegisteredScenes.current) {
      registerAllScenes();
      hasRegisteredScenes.current = true;
    }
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    const initializeScene = async () => {
      try {
        // Check if scene is already populated to prevent infinite loop
        const existingEntities = entityManager.getAllEntities();

        // Skip if already initialized with entities
        if (existingEntities.length > 0) {
          onStatusMessage('Scene already initialized');
          hasInitialized.current = true;
          return;
        }

        // Load default scene using SceneRegistry (ignore saved scene for now)
        await loadScene('default', true);
        onStatusMessage('Loaded default scene with camera and lights');
        hasInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize scene:', error);
        onStatusMessage('Failed to load scene');
        hasInitialized.current = true;
      }
    };

    // Delay initialization to allow system to be ready
    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [savedScene, importScene, onStatusMessage]); // Removed entityManager from deps
};
