import { defineScene } from './defineScene';

/**
 * testscripting
 * Scene with 5 entities
 * Generated: 2025-10-22T22:05:56.685Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'testscripting',
    version: 1,
    timestamp: '2025-10-22T22:05:56.685Z',
    description: 'Scene with 5 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: 'd093ac81-9909-4629-9a55-0b8ead63a459',
        },
        Transform: {
          position: [0, 1, -10],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Camera: {
          fov: 20,
          near: 0.1,
          far: 100,
          projectionType: 'perspective',
          orthographicSize: 10,
          depth: 0,
          isMain: true,
          clearFlags: 'skybox',
          skyboxTexture: '',
          backgroundColor: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
          },
          controlMode: 'free',
          viewportRect: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
          hdr: false,
          toneMapping: 'none',
          toneMappingExposure: 1,
          enablePostProcessing: false,
          postProcessingPreset: 'none',
          enableSmoothing: false,
          followTarget: 0,
          followOffset: {
            x: 0,
            y: 5,
            z: -10,
          },
          smoothingSpeed: 2,
          rotationSmoothing: 1.5,
        },
      },
    },
    {
      id: 1,
      name: 'Directional Light',
      components: {
        PersistentId: {
          id: '59155f4d-dac0-41b0-8232-50d18965aa53',
        },
        Transform: {
          position: [5, 10, 5],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Light: {
          color: {
            r: 1,
            g: 1,
            b: 1,
          },
          intensity: 0.8,
          enabled: true,
          castShadow: true,
          directionX: 0,
          directionY: -1,
          directionZ: 0,
          range: 10,
          decay: 1,
          angle: 0.5235987755982988,
          penumbra: 0.1,
          shadowMapSize: 1024,
          shadowBias: -0.0001,
          shadowRadius: 1,
          lightType: 'directional',
        },
      },
    },
    {
      id: 2,
      name: 'Ambient Light',
      components: {
        PersistentId: {
          id: 'd6cef29d-6413-4d6b-83ce-1cd391332bc1',
        },
        Transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Light: {
          color: {
            r: 0.4,
            g: 0.4,
            b: 0.4,
          },
          intensity: 0.5,
          enabled: true,
          castShadow: false,
          directionX: 0,
          directionY: -1,
          directionZ: 0,
          range: 10,
          decay: 1,
          angle: 0.5235987755982988,
          penumbra: 0.1,
          shadowMapSize: 1024,
          shadowBias: -0.0001,
          shadowRadius: 1,
          lightType: 'ambient',
        },
      },
    },
    {
      id: 3,
      name: 'Cube 0',
      components: {
        PersistentId: {
          id: '99e5bdd3-9b77-43ae-907d-d1a37d46e11a',
        },
        Transform: {
          position: [0, 1.25, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          meshId: 'torus',
          materialId: 'default',
        },
        Script: {
          code: '',
          enabled: true,
          scriptName: 'Script',
          description: '',
          executeInUpdate: true,
          executeOnStart: true,
          executeOnEnable: false,
          maxExecutionTime: 16,
          hasErrors: false,
          lastErrorMessage: '',
          lastExecutionTime: 0,
          executionCount: 0,
          parameters: {},
          lastModified: 1761085873889,
          compiledCode: '',
          scriptRef: {
            scriptId: 'entity-3.script',
            source: 'external',
            path: '/home/jonit/projects/vibe-coder-3d/src/game/scripts/entity-3.script.ts',
            codeHash: '83b953575cbd6d12f844f3f456bb4fa477c1b7fdccad76d13aaca41e8eab2f32',
            lastModified: 1761085959589,
          },
          scriptPath: 'entity-3.script.lua',
        },
      },
    },
    {
      id: 4,
      name: 'Plane 0',
      components: {
        PersistentId: {
          id: '3f7ec530-4217-4f8e-8088-39a1ccc5a303',
        },
        Transform: {
          position: [0, 0, 0],
          rotation: [-90, 0, 0],
          scale: [10, 10, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          meshId: 'plane',
          materialId: 'mat1',
        },
        RigidBody: {
          enabled: true,
          bodyType: 'fixed',
          mass: 1,
          gravityScale: 1,
          canSleep: true,
          material: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
          type: 'fixed',
        },
        MeshCollider: {
          enabled: true,
          isTrigger: false,
          colliderType: 'box',
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 0.01,
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
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/mat1',
      '@/materials/dss',
      '@/materials/farm-grass',
      '@/materials/grass',
      '@/materials/mat2',
      '@/materials/mat_38910607',
      '@/materials/myMaterial',
      '@/materials/red',
      '@/materials/test123',
    ],
    inputs: ['@/inputs/defaultInput'],
    prefabs: ['@/prefabs/trees'],
    scripts: ['@/scripts/entity-3.script'],
  },
  lockedEntityIds: [4],
});
