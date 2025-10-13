import { defineScene } from './defineScene';

/**
 * New.tsx
 * Scene with 4 entities
 * Generated: 2025-10-13T15:15:47.439Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'New.tsx',
    version: 1,
    timestamp: '2025-10-13T15:15:47.439Z',
    description: 'Scene with 4 entities',
  },
  entities: [
    {
      id: 0,
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
      id: 1,
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
      id: 2,
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
    {
      id: 3,
      name: 'Cube 0',
      components: {
        PersistentId: {
          id: 'dee32c18-c538-4889-8f8e-a32d8bb3a0a7',
        },
        Transform: {
          position: [0, 0.75, 0],
        },
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'default',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/dss',
      '@/materials/farm-grass',
      '@/materials/grass',
      '@/materials/mat1',
      '@/materials/mat2',
      '@/materials/mat_38910607',
      '@/materials/myMaterial',
      '@/materials/red',
      '@/materials/test123',
    ],
    inputs: ['@/inputs/DefaultInput'],
    prefabs: ['@/prefabs/Trees'],
  },
});
