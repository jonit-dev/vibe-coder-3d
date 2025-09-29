import { useEffect, useRef } from 'react';

import { loadScene } from '@/core/lib/scene/SceneRegistry';
// import { sceneRegistry } from '@/core/lib/scene/SceneRegistry'; // Will be used in future implementation
import { registerCoreScenes } from '@/core/lib/scene/scenes';
import { registerGameExtensions } from '@game';
import { type IStreamingScene } from '@/core/lib/serialization/StreamingSceneSerializer';
import { Logger } from '@core/lib/logger';

import { useEntityManager } from './useEntityManager';

export interface IUseSceneInitializationProps {
  savedScene: IStreamingScene | null;
  importScene: (scene: IStreamingScene) => Promise<void>;
  onStatusMessage: (message: string) => void;
  loadLastScene: () => Promise<boolean>;
}

export const useSceneInitialization = ({
  savedScene,
  importScene,
  onStatusMessage,
  loadLastScene,
}: IUseSceneInitializationProps) => {
  const logger = Logger.create('SceneInitialization');
  const entityManager = useEntityManager();
  const hasInitialized = useRef(false);
  const hasRegisteredScenes = useRef(false);

  useEffect(() => {
    // Register scenes once
    if (!hasRegisteredScenes.current) {
      const stepTracker = logger.createStepTracker('Scene Registration');
      stepTracker.step('Core Scenes Registration');
      registerCoreScenes();
      stepTracker.step('Game Extensions Registration');
      registerGameExtensions();
      stepTracker.complete();
      hasRegisteredScenes.current = true;
    }
  }, [logger]);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    const initializeScene = async () => {
      const stepTracker = logger.createStepTracker('Scene Initialization');
      try {
        stepTracker.step('Checking Existing Entities');
        // Check if scene is already populated to prevent infinite loop
        const existingEntities = entityManager.getAllEntities();

        // Skip if already initialized with entities
        if (existingEntities.length > 0) {
          stepTracker.step('Scene Already Initialized');
          onStatusMessage('Scene already initialized');
          hasInitialized.current = true;
          stepTracker.complete();
          return;
        }

        stepTracker.step('Loading Last Scene');
        // Try to load the last scene first, fallback to default
        const lastSceneLoaded = await loadLastScene();

        if (lastSceneLoaded) {
          stepTracker.step('Last Scene Loaded Successfully');
          onStatusMessage('Loaded last scene from storage');
        } else {
          stepTracker.step('Loading Default Scene');
          // Fallback to default scene using SceneRegistry
          await loadScene('default', true);
          stepTracker.step('Default Scene Load Complete');
          onStatusMessage('Loaded default scene with camera and lights');
        }
        hasInitialized.current = true;
        stepTracker.complete();
      } catch (error) {
        logger.error('Failed to initialize scene', { error });
        onStatusMessage('Failed to load scene');
        hasInitialized.current = true;
        stepTracker.complete();
      }
    };

    // Delay initialization to allow system to be ready
    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [savedScene, importScene, onStatusMessage]); // Removed entityManager from deps
};
