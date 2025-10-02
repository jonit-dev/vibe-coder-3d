import { useEffect, useRef } from 'react';

import { loadScene } from '@/core/lib/scene/SceneRegistry';
// import { sceneRegistry } from '@/core/lib/scene/SceneRegistry'; // Will be used in future implementation
import { registerCoreScenes } from '@/core/lib/scene/scenes';
import { registerGameExtensions } from '@game';
import { Logger } from '@core/lib/logger';

import { useEntityManager } from './useEntityManager';

export interface IUseSceneInitializationProps {
  onStatusMessage: (message: string) => void;
  loadLastScene: () => Promise<boolean>;
}

export const useSceneInitialization = ({
  onStatusMessage,
  loadLastScene,
}: IUseSceneInitializationProps) => {
  const logger = useRef(Logger.create('SceneInitialization')).current;
  const entityManager = useEntityManager();
  const hasInitialized = useRef(false);

  // Register scenes once on mount
  useEffect(() => {
    const stepTracker = logger.createStepTracker('Scene Registration');
    stepTracker.step('Core Scenes Registration');
    registerCoreScenes();
    stepTracker.step('Game Extensions Registration');
    registerGameExtensions();
    stepTracker.complete();
  }, [logger]);

  // Initialize scene once on mount
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    const initializeScene = async () => {
      if (hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;

      const stepTracker = logger.createStepTracker('Scene Initialization');
      try {
        stepTracker.step('Checking Existing Entities');
        const existingEntities = entityManager.getAllEntities();

        if (existingEntities.length > 0) {
          stepTracker.step('Scene Already Initialized');
          onStatusMessage('Scene already initialized');
          stepTracker.complete();
          return;
        }

        stepTracker.step('Loading Last Scene');
        const lastSceneLoaded = await loadLastScene();

        if (lastSceneLoaded) {
          stepTracker.step('Last Scene Loaded Successfully');
          onStatusMessage('Loaded last scene from storage');
        } else {
          stepTracker.step('Loading Default Scene');
          await loadScene('default', true);
          stepTracker.step('Default Scene Load Complete');
          onStatusMessage('Loaded default scene with camera and lights');
        }
        stepTracker.complete();
      } catch (error) {
        logger.error('Failed to initialize scene', { error });
        onStatusMessage('Failed to load scene');
        stepTracker.complete();
      }
    };

    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [logger, entityManager, onStatusMessage, loadLastScene]);
};
