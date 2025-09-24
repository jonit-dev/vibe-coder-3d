/**
 * Default Scene Definition
 * Creates a basic scene with camera and lighting setup
 */

import { defineScene } from '@core';
import type { ISceneContext } from '@core';

export const registerDefaultScene = () =>
  defineScene(
    'game.default',
    ({ createEntity, addComponent }: ISceneContext) => {
      // Create Main Camera
      const mainCamera = createEntity('Main Camera');

      // Add Transform component with Unity-like default position
      addComponent(mainCamera, 'Transform', {
        position: [0, 1, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      // Add Camera component with Unity-like defaults
      addComponent(mainCamera, 'Camera', {
        fov: 20,
        near: 0.1,
        far: 100,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
        isMain: true,
        clearFlags: 'skybox',
        cullingMask: -1,
        backgroundColor: '#666666',
        HDR: false,
      });

      // Create Directional Light
      const sunLight = createEntity('Directional Light');

      // Add Transform component for light position
      addComponent(sunLight, 'Transform', {
        position: [0, 3, 0],
        rotation: [45, -30, 0], // Angled towards scene
        scale: [1, 1, 1],
      });

      // Add Light component
      addComponent(sunLight, 'Light', {
        type: 'directional',
        color: '#fffcfc',
        intensity: 2,
        castShadow: false,
        shadowBias: 0,
        shadowNormalBias: 0,
        shadowRadius: 0,
        shadowMapSize: 512,
      });

      console.log('[DefaultScene] Created scene with camera and sun light');
    },
    {
      name: 'Default Scene',
      description: 'Basic scene with camera and directional light',
    },
  );
