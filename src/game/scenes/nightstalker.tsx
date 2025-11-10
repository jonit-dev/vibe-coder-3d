import { defineScene } from './defineScene';

/**
 * nightstalker
 * Scene with 5 entities
 * Generated: 2025-11-10T02:18:39.224Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'nightstalker',
    version: 1,
    timestamp: '2025-11-10T02:18:39.224Z',
    description: 'Scene with 5 entities',
  },
  entities: [
    {
      id: 41,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: '76385e36-4947-4cb0-bcd2-668b64a9cfc0',
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
          skyboxScale: {
            x: 1,
            y: 1,
            z: 1,
          },
          skyboxRotation: {
            x: 0,
            y: 0,
            z: 0,
          },
          skyboxRepeat: {
            u: 1,
            v: 1,
          },
          skyboxOffset: {
            u: 0,
            v: 0,
          },
          skyboxIntensity: 1,
          skyboxBlur: 0,
        },
      },
    },
    {
      id: 42,
      name: 'Directional Light',
      components: {
        PersistentId: {
          id: '5160df4d-0f00-4ef5-aeac-2791a812448c',
        },
        Transform: {
          position: [-1.9, 2.3, 1.3],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Light: {
          color: {
            r: 1,
            g: 1,
            b: 1,
          },
          intensity: 18.1,
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
      id: 43,
      name: 'Ambient Light',
      components: {
        PersistentId: {
          id: '80b2e265-a1ff-430f-bcf6-5de4cfd85cab',
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
          intensity: 4.45,
          enabled: true,
          castShadow: false,
          directionX: 0,
          directionY: -1,
          directionZ: 0,
          range: 10,
          decay: 1,
          angle: 0.5235987755982988,
          penumbra: 0.1,
          shadowMapSize: 4096,
          shadowBias: -0.0005,
          shadowRadius: 0.2,
          lightType: 'ambient',
        },
      },
    },
    {
      id: 44,
      name: 'Plane 0',
      components: {
        PersistentId: {
          id: '813c5853-b613-4c70-bb5d-4c641ccc6a6b',
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
          modelPath: '',
          meshId: 'plane',
          materialId: 'mat_37a08996',
        },
      },
    },
    {
      id: 46,
      name: 'NightStalker_Night_Stalker',
      components: {
        PersistentId: {
          id: '4f63b82d-846f-407e-99a9-abb80c0ce702',
        },
        Transform: {
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '/assets/models/NightStalker_Night_Stalker/glb/NightStalker_Night_Stalker.glb',
          meshId: 'custom',
          materialId: 'default',
        },
      },
    },
  ],
  assetReferences: {
    materials: ['@/materials/mat_37a08996', '@/materials/default'],
    inputs: ['@/inputs/defaultInput'],
    prefabs: ['@/prefabs/trees'],
  },
  lockedEntityIds: [44],
});
