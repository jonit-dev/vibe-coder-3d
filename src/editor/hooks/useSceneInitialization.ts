import { useEffect, useState } from 'react';

import { ISerializedScene } from './useSceneSerialization';

interface IUseSceneInitializationProps {
  savedScene: ISerializedScene;
  importScene: (scene: ISerializedScene) => void;
  onStatusMessage: (message: string) => void;
}

export const useSceneInitialization = ({
  savedScene,
  importScene,
  onStatusMessage,
}: IUseSceneInitializationProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-load the last saved scene when the editor opens
  useEffect(() => {
    if (isInitialized) return;

    console.log('Initialization effect running - savedScene:', savedScene);

    const initializeScene = async () => {
      // Only load on first mount and if there's a saved scene with entities
      if (savedScene && savedScene.entities && savedScene.entities.length > 0) {
        try {
          console.log('Loading scene from localStorage:', savedScene);
          importScene(savedScene);
          onStatusMessage(
            `Loaded last saved scene from localStorage (version ${savedScene.version}).`,
          );
        } catch (err) {
          console.error('Failed to load scene from localStorage:', err);
          onStatusMessage('Failed to load last scene. Starting with empty scene.');
        }
      } else {
        console.log('No saved scene found, starting with empty scene');
        onStatusMessage('Ready - Empty scene loaded.');
      }
      setIsInitialized(true);
    };

    initializeScene();
  }, [isInitialized, importScene, savedScene, onStatusMessage]);

  return { isInitialized };
};
