/**
 * Sample Scene Definition
 * Demonstrates creating a scene with various objects
 */

import { defineScene } from '../SceneRegistry';

export const registerSampleScene = () =>
  defineScene(
    'sample',
    ({ createEntity, addComponent }) => {
      // Create camera
      const camera = createEntity('Main Camera');
      addComponent(camera, 'Transform', {
        position: [5, 5, -10],
        rotation: [0, -30, 0],
        scale: [1, 1, 1],
      });
      addComponent(camera, 'Camera', {
        fov: 30,
        near: 0.1,
        far: 100,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
        isMain: true,
        clearFlags: 'skybox',
        backgroundColor: { r: 0.2, g: 0.3, b: 0.4, a: 1 },
      });

      // Create lights
      const sunLight = createEntity('Sun Light');
      addComponent(sunLight, 'Transform', {
        position: [10, 20, 10],
        rotation: [45, -45, 0],
        scale: [1, 1, 1],
      });
      addComponent(sunLight, 'Light', {
        lightType: 'directional',
        color: { r: 1.0, g: 0.95, b: 0.8 },
        intensity: 1.0,
        enabled: true,
        castShadow: true,
        directionX: -0.5,
        directionY: -1.0,
        directionZ: -0.5,
        shadowMapSize: 2048,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
      });

      // Create ground plane
      const ground = createEntity('Ground');
      addComponent(ground, 'Transform', {
        position: [0, -0.5, 0],
        rotation: [0, 0, 0],
        scale: [20, 0.1, 20],
      });
      addComponent(ground, 'MeshRenderer', {
        meshId: 'cube', // Use cube scaled flat for ground
        materialId: 'default',
        enabled: true,
        castShadows: false,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#4a7c59',
          normalScale: 1,
          metalness: 0,
          roughness: 0.9,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Create some cubes
      const cube1 = createEntity('Red Cube');
      addComponent(cube1, 'Transform', {
        position: [-2, 1, 0],
        rotation: [0, 45, 0],
        scale: [1, 1, 1],
      });
      addComponent(cube1, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#e63946',
          normalScale: 1,
          metalness: 0.2,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });
      addComponent(cube1, 'RigidBody', {
        enabled: true,
        bodyType: 'dynamic',
        mass: 1,
        gravityScale: 1,
        canSleep: true,
        material: {
          friction: 0.7,
          restitution: 0.3,
          density: 1,
        },
      });

      // Create sphere
      const sphere = createEntity('Blue Sphere');
      addComponent(sphere, 'Transform', {
        position: [2, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1.5, 1.5, 1.5],
      });
      addComponent(sphere, 'MeshRenderer', {
        meshId: 'sphere',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#457b9d',
          normalScale: 1,
          metalness: 0.8,
          roughness: 0.2,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Create cylinder
      const cylinder = createEntity('Yellow Cylinder');
      addComponent(cylinder, 'Transform', {
        position: [0, 2, 3],
        rotation: [0, 0, 30],
        scale: [0.5, 2, 0.5],
      });
      addComponent(cylinder, 'MeshRenderer', {
        meshId: 'cylinder',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#f1c40f',
          normalScale: 1,
          metalness: 0.5,
          roughness: 0.4,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Create a parent-child hierarchy
      const parent = createEntity('Parent Container');
      addComponent(parent, 'Transform', {
        position: [0, 3, -3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const child1 = createEntity('Child Cube 1', parent);
      addComponent(child1, 'Transform', {
        position: [-1, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      });
      addComponent(child1, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#a663cc',
          normalScale: 1,
          metalness: 0,
          roughness: 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      const child2 = createEntity('Child Cube 2', parent);
      addComponent(child2, 'Transform', {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      });
      addComponent(child2, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#6c5ce7',
          normalScale: 1,
          metalness: 0,
          roughness: 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });
    },
    {
      name: 'Sample Scene',
      description: 'A sample scene with various 3D objects demonstrating hierarchy and components',
      metadata: {
        author: 'System',
        tags: ['sample', 'demo', '3d-objects'],
      },
    },
  );
