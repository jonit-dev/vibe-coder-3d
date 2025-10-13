import { defineScene } from './defineScene';

/**
 * fml
 * Scene with 4 entities
 * Generated: 2025-10-13T15:19:06.955Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'fml',
    version: 1,
    timestamp: '2025-10-13T15:19:06.955Z',
    description: 'Scene with 4 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: 'a3f35873-d7e8-42a1-a854-3afaa91f5f62',
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
          id: 'ad1d8938-ce51-4231-a0ab-9d18902b9e0f',
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
          id: '2990eba3-9787-4103-a474-ee7685f77807',
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
          id: '9fa8956c-80ff-4e6a-b32c-7f89775b1d40',
        },
        Transform: {},
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
