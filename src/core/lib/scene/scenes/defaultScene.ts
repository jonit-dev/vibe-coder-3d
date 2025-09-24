/**
 * Default Scene Definition
 * Creates a basic scene with camera and lighting setup
 */

import { defineScene } from '../SceneRegistry';

export const registerDefaultScene = () =>
  defineScene(
    'default',
    ({ createEntity, addComponent }) => {
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
        backgroundColor: { r: 0.0, g: 0.0, b: 0.0, a: 0 },
      });

      // Create Directional Light
      const directionalLight = createEntity('Directional Light');

      // Add Transform component for the light
      addComponent(directionalLight, 'Transform', {
        position: [5, 10, 5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      // Add Light component with Unity-like defaults
      addComponent(directionalLight, 'Light', {
        lightType: 'directional',
        color: { r: 1.0, g: 1.0, b: 1.0 },
        intensity: 0.8,
        enabled: true,
        castShadow: true,
        directionX: 0.0,
        directionY: -1.0,
        directionZ: 0.0,
        shadowMapSize: 1024,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
      });

      // Create Ambient Light
      const ambientLight = createEntity('Ambient Light');

      // Add Transform component for ambient light
      addComponent(ambientLight, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      // Add Ambient Light component
      addComponent(ambientLight, 'Light', {
        lightType: 'ambient',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        intensity: 0.5,
        enabled: true,
        castShadow: false,
      });
    },
    {
      name: 'Default Scene',
      description: 'Basic scene with camera and lighting setup',
      metadata: {
        author: 'System',
        tags: ['default', 'basic', 'starter'],
      },
    },
  );
