/**
 * Custom Shapes Demo Scene
 * Demonstrates the custom shape system with example shapes
 */

import { defineScene } from '@core';

export const CustomShapesDemo = defineScene({
  id: 'custom-shapes-demo',
  name: 'Custom Shapes Demo',
  description: 'Demonstration of the custom shape system',

  async load(ctx) {
    const { world, logger } = ctx;

    logger.info('Loading Custom Shapes Demo scene');

    // Create ground plane
    const ground = world.createEntity('Ground');
    world.addComponent(ground, 'Transform', {
      position: [0, 0, 0],
      rotation: [-90, 0, 0],
      scale: [20, 20, 1],
    });
    world.addComponent(ground, 'MeshRenderer', {
      meshId: 'plane',
      materialId: 'default',
      enabled: true,
      castShadows: false,
      receiveShadows: true,
      material: {
        shader: 'standard',
        materialType: 'solid',
        color: '#4a9f4a',
        roughness: 0.8,
        metalness: 0.1,
      },
    });

    // Create example torus knot custom shape
    const torusKnot = world.createEntity('Example Torus Knot');
    world.addComponent(torusKnot, 'Transform', {
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    world.addComponent(torusKnot, 'CustomShape', {
      shapeId: 'example-torus-knot',
      params: {
        radius: 0.4,
        tube: 0.1,
        tubularSegments: 64,
        radialSegments: 8,
        p: 2,
        q: 3,
      },
    });
    world.addComponent(torusKnot, 'MeshRenderer', {
      meshId: 'customShape',
      materialId: 'default',
      enabled: true,
      castShadows: true,
      receiveShadows: true,
      material: {
        shader: 'standard',
        materialType: 'solid',
        color: '#ff6b6b',
        roughness: 0.3,
        metalness: 0.7,
      },
    });

    // Create directional light
    const light = world.createEntity('Directional Light');
    world.addComponent(light, 'Transform', {
      position: [5, 10, 5],
      rotation: [-45, 45, 0],
      scale: [1, 1, 1],
    });
    world.addComponent(light, 'Light', {
      lightType: 'directional',
      color: '#ffffff',
      intensity: 1,
      castShadows: true,
    });

    // Create camera
    const camera = world.createEntity('Main Camera');
    world.addComponent(camera, 'Transform', {
      position: [0, 3, 5],
      rotation: [-20, 0, 0],
      scale: [1, 1, 1],
    });
    world.addComponent(camera, 'Camera', {
      fov: 60,
      near: 0.1,
      far: 1000,
      isMain: true,
    });

    logger.info('Custom Shapes Demo scene loaded successfully');
  },
});
