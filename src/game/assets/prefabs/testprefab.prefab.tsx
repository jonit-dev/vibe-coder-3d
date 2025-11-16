import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  id: 'test-prefab',
  name: 'test-prefab',
  root: {
    name: 'test-prefab',
    components: {
      PersistentId: {
        id: '6e1eb841-c0ad-4312-8dcc-f1abe77c732f',
      },
    },
    children: [
      {
        name: 'Cube 0',
        components: {
          PersistentId: {
            id: '2b464aa0-9ca7-4363-a4a3-528117ac73fc',
          },
          Transform: {
            position: [0.1, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshId: 'cube',
            materialId: 'mat_50e25b2a',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            modelPath: '',
          },
        },
      },
      {
        name: 'Sphere 0',
        components: {
          PersistentId: {
            id: '6299eba2-24ab-4d03-b7a0-86eb68986213',
          },
          Transform: {
            position: [0, 1.4, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshId: 'sphere',
            materialId: 'default',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            modelPath: '',
          },
        },
      },
    ],
  },
  metadata: {
    createdAt: '2025-11-16T08:48:38.141Z',
    createdFrom: 70,
  },
  dependencies: ['mat_50e25b2a', 'default'],
});
