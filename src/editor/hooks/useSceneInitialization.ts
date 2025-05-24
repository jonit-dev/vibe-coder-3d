import { useEffect } from 'react';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: any[];
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
  useEffect(() => {
    const initializeScene = async () => {
      try {
        if (savedScene && savedScene.entities && savedScene.entities.length > 0) {
          await importScene(savedScene);
          onStatusMessage(`Loaded scene with ${savedScene.entities.length} entities`);
        } else {
          onStatusMessage('No saved scene found - starting with empty scene');
        }
      } catch (error) {
        console.error('Failed to initialize scene:', error);
        onStatusMessage('Failed to load saved scene');
      }
    };

    // Delay initialization to allow ComponentManager to be ready
    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [savedScene, importScene, onStatusMessage]);
};
