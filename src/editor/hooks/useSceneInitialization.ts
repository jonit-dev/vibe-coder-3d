import { useEffect, useRef } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';

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
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    const initializeScene = async () => {
      try {
        if (savedScene && savedScene.entities && savedScene.entities.length > 0) {
          await importScene(savedScene);
          onStatusMessage(`Loaded scene with ${savedScene.entities.length} entities`);
          hasInitialized.current = true;
        } else {
          // Check if scene is already populated to prevent infinite loop
          const existingEntities = entityManager.getAllEntities();
          if (existingEntities.length === 0) {
            // Create default "Main Camera" only when scene is truly empty
            const mainCamera = entityManager.createEntity('Main Camera');

            // Add Transform component with Unity-like default position
            const defaultTransform: ITransformData = {
              position: [0, 1, -10], // Unity's default camera position
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            };
            componentManager.addComponent(
              mainCamera.id,
              KnownComponentTypes.TRANSFORM,
              defaultTransform,
            );

            // Add Camera component with Unity-like defaults
            const cameraData: ICameraData = {
              fov: 20,
              near: 0.1,
              far: 100,
              projectionType: 'perspective',
              orthographicSize: 10,
              depth: 0,
              isMain: true, // First camera is main
            };
            componentManager.addComponent(mainCamera.id, KnownComponentTypes.CAMERA, cameraData);

            onStatusMessage('Created new scene with default Main Camera');
            hasInitialized.current = true;
          } else {
            onStatusMessage('Scene already initialized');
            hasInitialized.current = true;
          }
        }
      } catch (error) {
        console.error('Failed to initialize scene:', error);
        onStatusMessage('Failed to load saved scene');
        hasInitialized.current = true;
      }
    };

    // Delay initialization to allow ComponentManager to be ready
    const timer = setTimeout(initializeScene, 100);
    return () => clearTimeout(timer);
  }, [savedScene, importScene, onStatusMessage]); // Removed entityManager and componentManager from deps
};
