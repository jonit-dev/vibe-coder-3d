import { defineScene } from './defineScene';

/**
 * UncompressedExample
 * SAME scene as CompressedExample but WITHOUT compression
 * Generated: 2025-10-10T16:30:00.000Z
 * Version: 1
 *
 * This demonstrates the OLD format (before compression):
 * - ALL component fields saved (even defaults)
 * - Materials inlined in every entity (repeated)
 * - 3-4x larger than compressed version
 */
export default defineScene({
  metadata: {
    name: 'UncompressedExample',
    version: 1,
    timestamp: '2025-10-10T16:30:00.000Z',
    description: 'Uncompressed scene - same data as CompressedExample',
  },
  entities: [
    {
      name: 'Main Camera',
      components: {
        Transform: {
          position: [0, 2, -10],
          rotation: [0, 0, 0], // Default saved anyway
          scale: [1, 1, 1], // Default saved anyway
        },
        Camera: {
          fov: 60,
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
            a: 1,
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
      name: 'Directional Light',
      components: {
        Transform: {
          position: [5, 10, 5],
          rotation: [45, 30, 0],
          scale: [1, 1, 1],
        },
        Light: {
          lightType: 'directional',
          color: {
            r: 1,
            g: 1,
            b: 1,
          },
          intensity: 1,
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
        },
      },
    },
    {
      name: 'Tree 1',
      components: {
        Transform: {
          position: [-2, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          meshId: 'tree',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          material: {
            // INLINE material (repeated for EVERY tree!)
            shader: 'standard',
            materialType: 'solid',
            color: '#2d5016',
            metalness: 0,
            roughness: 0.9,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
            albedoTexture: '',
            normalTexture: '',
            metallicTexture: '',
            roughnessTexture: '',
            emissiveTexture: '',
            occlusionTexture: '',
          },
        },
      },
    },
    {
      name: 'Tree 2',
      components: {
        Transform: {
          position: [2, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          meshId: 'tree',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          material: {
            // SAME material repeated again!
            shader: 'standard',
            materialType: 'solid',
            color: '#2d5016',
            metalness: 0,
            roughness: 0.9,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
            albedoTexture: '',
            normalTexture: '',
            metallicTexture: '',
            roughnessTexture: '',
            emissiveTexture: '',
            occlusionTexture: '',
          },
        },
      },
    },
    {
      name: 'Tree 3',
      components: {
        Transform: {
          position: [0, 0, 3],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        MeshRenderer: {
          meshId: 'tree',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          material: {
            // SAME material repeated AGAIN!
            shader: 'standard',
            materialType: 'solid',
            color: '#2d5016',
            metalness: 0,
            roughness: 0.9,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
            albedoTexture: '',
            normalTexture: '',
            metallicTexture: '',
            roughnessTexture: '',
            emissiveTexture: '',
            occlusionTexture: '',
          },
        },
      },
    },
    {
      name: 'Ground',
      components: {
        Transform: {
          position: [0, -0.5, 0],
          rotation: [0, 0, 0],
          scale: [10, 0.1, 10],
        },
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          material: {
            shader: 'standard',
            materialType: 'solid',
            color: '#3a7d2e',
            metalness: 0,
            roughness: 0.8,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
            albedoTexture: '',
            normalTexture: '',
            metallicTexture: '',
            roughnessTexture: '',
            emissiveTexture: '',
            occlusionTexture: '',
          },
        },
      },
    },
  ],
  materials: [
    {
      id: 'default',
      name: 'Default',
      shader: 'standard',
      materialType: 'solid',
      color: '#cccccc',
      metalness: 0,
      roughness: 0.7,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      textureRepeatX: 1,
      textureRepeatY: 1,
    },
  ],
  prefabs: [],
  inputAssets: [],
});
