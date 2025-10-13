import { defineScene } from './defineScene';

/**
 * new
 * Scene with 3 entities
 * Generated: 2025-10-13T15:08:49.407Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'new',
    version: 1,
    timestamp: '2025-10-13T15:08:49.407Z',
    description: 'Scene with 3 entities',
  },
  entities: [
    {
      id: 4,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: 'ae46df3a-bf7e-4036-a717-7b1cc5290fcd',
        },
        Transform: {
          position: [0, 1, -10],
        },
        Camera: {
          fov: 20,
          isMain: true,
          backgroundColor: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
          },
        },
      },
    },
    {
      id: 5,
      name: 'Directional Light',
      components: {
        PersistentId: {
          id: 'd1ae867d-63cc-4e77-a8a6-0a2e80e1ef21',
        },
        Transform: {
          position: [5, 10, 5],
        },
        Light: {
          lightType: 'directional',
          intensity: 0.8,
        },
      },
    },
    {
      id: 6,
      name: 'Ambient Light',
      components: {
        PersistentId: {
          id: 'a762fc45-7c09-4d36-a4c5-033794bac784',
        },
        Transform: {},
        Light: {
          lightType: 'ambient',
          color: {
            r: 0.4,
            g: 0.4,
            b: 0.4,
          },
          intensity: 0.5,
          castShadow: false,
        },
      },
    },
  ],
  assetReferences: {
    materials: ['@/materials/default'],
    inputs: ['@/inputs/DefaultInput'],
    prefabs: ['@/prefabs/Trees'],
  },
});
