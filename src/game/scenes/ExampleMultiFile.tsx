import { defineScene } from './defineScene';

/**
 * ExampleMultiFile
 * Scene with 4 entities
 * Generated: 2025-10-13T04:56:28.215Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'ExampleMultiFile',
    version: 1,
    timestamp: '2025-10-13T04:56:28.215Z',
    description: 'Scene with 4 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: '4b4224f5-da30-4b74-9a03-d00a11dc6258',
        },
        Transform: {
          position: [0, 2, -10],
        },
        Camera: {
          fov: 60,
          isMain: true,
          skyboxTexture: '/assets/skyboxes/farm-skybox.png',
          skyboxRepeat: {
            u: 2,
          },
        },
      },
    },
    {
      id: 1,
      name: 'Directional Light',
      components: {
        PersistentId: {
          id: 'da41f82c-b557-47ce-bebb-1d154e07ce7d',
        },
        Transform: {
          position: [5, 16.25, 5],
        },
        Light: {
          lightType: 'directional',
          intensity: 2,
        },
      },
    },
    {
      id: 2,
      name: 'Ground',
      components: {
        PersistentId: {
          id: '2c220494-5661-411d-89be-728dc587137e',
        },
        Transform: {
          scale: [20, 0.1, 20],
        },
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'farm-grass',
        },
      },
    },
    {
      id: 3,
      name: 'FarmHouse',
      components: {
        PersistentId: {
          id: 'e090f520-b408-4945-af0c-f34e8208d63e',
        },
        Transform: {},
        MeshRenderer: {
          meshId: 'custom',
          materialId: 'default',
          modelPath: '/assets/models/FarmHouse/farm_house_basic_shaded.glb',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/farm-grass',
      '@/materials/dss',
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
  lockedEntityIds: [2],
});
