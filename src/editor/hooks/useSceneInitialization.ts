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
    registerCoreScenes();
    registerGameExtensions();
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

      try {
        const existingEntities = entityManager.getAllEntities();

        if (existingEntities.length > 0) {
          onStatusMessage('Scene already initialized');
          return;
        }

        const lastSceneLoaded = await loadLastScene();

        if (lastSceneLoaded) {
          onStatusMessage('Loaded last scene from storage');
        } else {
          await loadScene('default', true);
          onStatusMessage('Loaded default scene with camera and lights');
        }
      } catch (error) {
        logger.error('Failed to initialize scene', { error });
        onStatusMessage('Failed to load scene');
      }
    };

    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [logger, entityManager, onStatusMessage, loadLastScene]);
};
