import { defineScene } from './defineScene';

/**
 * newscene
 * Scene with 3 entities
 * Generated: 2025-11-10T04:36:44.091Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'newscene',
    version: 1,
    timestamp: '2025-11-10T04:36:44.091Z',
    description: 'Scene with 3 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: 'b763702a-2deb-43ff-bd6e-6dd534760e5c',
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
          id: '47f9b617-ea17-4091-9e58-4050a7b0c347',
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
          id: '3ae25645-0c0b-4b6d-8732-ccce12dbb623',
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
  ],
  assetReferences: {
    materials: [
      '@/materials/default',
      '@/materials/bark',
      '@/materials/dss',
      '@/materials/farm-grass',
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
});
