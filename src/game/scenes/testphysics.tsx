import { defineScene } from './defineScene';

/**
 * testphysics
 * Scene with 7 entities
 * Generated: 2025-10-20T22:35:28.380Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'testphysics',
    version: 1,
    timestamp: '2025-10-20T22:35:28.380Z',
    description: 'Scene with 7 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: '254ddfc5-4a6a-477c-a6db-e9482330c756',
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
          id: '18bf02bd-cecf-415f-b47d-8a6d5fc78029',
        },
        Transform: {
          position: [5, 10, 5],
        },
        Light: {
          lightType: 'directional',
          intensity: 0.8,
          directionX: -0.5,
          directionZ: -0.5,
        },
      },
    },
    {
      id: 2,
      name: 'Ambient Light',
      components: {
        PersistentId: {
          id: 'abe0990c-9b29-4913-8863-6f2d5b5c5dee',
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
          id: '94c9a896-c512-4e57-b90f-d60e5c4fbd83',
        },
        Transform: {
          position: [-2.25, 4.25, 3],
        },
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'default',
        },
        RigidBody: {
          type: 'dynamic',
        },
        MeshCollider: {
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        },
      },
    },
    {
      id: 4,
      name: 'Plane 0',
      components: {
        PersistentId: {
          id: '6cfdf392-ae66-4d40-9f76-3cf50bd30665',
        },
        Transform: {
          position: [0.25, 0.25, 0],
          rotation: [-90, 0, 0],
          scale: [10, 10, 1],
        },
        MeshRenderer: {
          meshId: 'plane',
          materialId: 'red',
        },
        RigidBody: {
          bodyType: 'fixed',
          type: 'fixed',
          canSleep: false,
        },
        MeshCollider: {
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 0.1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        },
      },
    },
    {
      id: 5,
      name: 'sphere',
      components: {
        PersistentId: {
          id: '6cd2badd-1292-4408-9e65-8ce9b1bfbed8',
        },
        Transform: {
          position: [1.5, 5.25, 2.75],
        },
        MeshRenderer: {
          meshId: 'sphere',
          materialId: 'default',
        },
        RigidBody: {
          type: 'dynamic',
        },
        MeshCollider: {
          colliderType: 'sphere',
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        },
      },
    },
    {
      id: 6,
      name: 'Battleship-Optimized 0',
      components: {
        PersistentId: {
          id: '6bb4a460-c024-4fb2-89b8-1e4b33a2f113',
        },
        Transform: {
          position: [0, 0.25, 0],
          scale: [0.5, 0.5, 0.5],
        },
        GeometryAsset: {
          path: '/src/game/geometry/battleship.shape.json',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/red',
      '@/materials/dss',
      '@/materials/farm-grass',
      '@/materials/grass',
      '@/materials/mat1',
      '@/materials/mat2',
      '@/materials/mat_38910607',
      '@/materials/myMaterial',
      '@/materials/test123',
    ],
    inputs: ['@/inputs/defaultInput'],
    prefabs: ['@/prefabs/trees'],
  },
  lockedEntityIds: [4],
});
