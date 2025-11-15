import { defineScene } from './defineScene';

/**
 * animationsystem
 * Scene with 5 entities
 * Generated: 2025-11-14T22:31:57.351Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'animationsystem',
    version: 1,
    timestamp: '2025-11-14T22:31:57.351Z',
    description: 'Scene with 5 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: 'e3044eb9-e135-4749-8478-f6dbbd20585d',
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
      id: 1,
      name: 'Directional Light',
      components: {
        PersistentId: {
          id: 'd2957c4e-e507-4623-aad6-b811d3408f60',
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
          id: '3e0b395e-f76c-4044-8ca0-b2e9d262c7f0',
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
          shadowMapSize: 4096,
          shadowBias: -0.0005,
          shadowRadius: 0.2,
          lightType: 'ambient',
        },
      },
    },
    {
      id: 3,
      name: 'Sphere 0',
      components: {
        PersistentId: {
          id: 'b402154d-86a7-42de-854f-0dcc5b064340',
        },
        Transform: {
          position: [0, 0.6, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'default',
        },
        Animation: {
          playing: false,
          time: 0,
          clipBindings: [
            {
              bindingId: 'binding_float',
              clipId: 'float',
              assetRef: '@/animations/float',
            },
          ],
          activeBindingId: 'float',
        },
      },
    },
    {
      id: 4,
      name: 'Plane 0',
      components: {
        PersistentId: {
          id: '31f38bea-959c-4a8b-887e-3ef571cb20fa',
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
          materialId: 'farm-grass',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/farm-grass',
      '@/materials/bark',
      '@/materials/dss',
      '@/materials/forestground',
      '@/materials/grass',
      '@/materials/green',
      '@/materials/leaves',
      '@/materials/mat1',
      '@/materials/mat_17149756',
      '@/materials/mat2',
      '@/materials/mat_37a08996',
      '@/materials/mat_37ade631',
      '@/materials/mat_38910607',
      '@/materials/mat_475d2e07',
      '@/materials/myMaterial',
      '@/materials/re',
      '@/materials/red',
      '@/materials/rock',
      '@/materials/sky',
      '@/materials/test123',
    ],
    inputs: ['@/inputs/defaultInput'],
    prefabs: ['@/prefabs/trees'],
  },
  lockedEntityIds: [4],
});
