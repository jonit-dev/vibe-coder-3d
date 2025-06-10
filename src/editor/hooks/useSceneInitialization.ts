import { useEffect, useRef } from 'react';

import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';

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
            const cameraData: CameraData = {
              fov: 20,
              near: 0.1,
              far: 100,
              projectionType: 'perspective',
              orthographicSize: 10,
              depth: 0,
              isMain: true, // First camera is main
              clearFlags: 'skybox',
              backgroundColor: { r: 0.0, g: 0.0, b: 0.0, a: 0 },
            };
            componentManager.addComponent(mainCamera.id, KnownComponentTypes.CAMERA, cameraData);

            // Create default "Directional Light" entity
            const directionalLight = entityManager.createEntity('Directional Light');

            // Add Transform component for the light
            const lightTransform: ITransformData = {
              position: [5, 10, 5], // Unity-like default directional light position
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            };
            componentManager.addComponent(
              directionalLight.id,
              KnownComponentTypes.TRANSFORM,
              lightTransform,
            );

            // Add Light component with Unity-like defaults
            const lightData: LightData = {
              lightType: 'directional',
              color: { r: 1.0, g: 1.0, b: 1.0 }, // White light
              intensity: 0.8,
              enabled: true,
              castShadow: true,
              directionX: 0.0,
              directionY: -1.0,
              directionZ: 0.0,
              shadowMapSize: 1024,
              shadowBias: -0.0001,
              shadowRadius: 1.0,
              shadowNear: 0.1,
              shadowFar: 50.0,
            };
            componentManager.addComponent(
              directionalLight.id,
              KnownComponentTypes.LIGHT,
              lightData,
            );

            // Create default "Ambient Light" entity
            const ambientLight = entityManager.createEntity('Ambient Light');

            // Add Transform component for ambient light (position doesn't matter but needed for entity)
            const ambientTransform: ITransformData = {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            };
            componentManager.addComponent(
              ambientLight.id,
              KnownComponentTypes.TRANSFORM,
              ambientTransform,
            );

            // Add Ambient Light component
            const ambientLightData: LightData = {
              lightType: 'ambient',
              color: { r: 0.4, g: 0.4, b: 0.4 }, // Soft gray ambient
              intensity: 0.5,
              enabled: true,
              castShadow: false,
            };
            componentManager.addComponent(
              ambientLight.id,
              KnownComponentTypes.LIGHT,
              ambientLightData,
            );

            onStatusMessage('Created new scene with default Main Camera and Lights');
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
