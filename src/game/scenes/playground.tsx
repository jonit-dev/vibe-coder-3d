import { defineScene } from './defineScene';

/**
 * playground
 * Scene with 68 entities
 * Generated: 2025-11-16T00:37:51.905Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'playground',
    version: 1,
    timestamp: '2025-11-16T00:37:51.905Z',
    description: 'Scene with 68 entities',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        PersistentId: {
          id: '1e1b7a08-0b57-436f-8c93-175b3da97531',
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
          id: 'd9d2175e-17ff-4fb9-bbe1-2619001687c0',
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
          id: 'd4147469-2789-40ac-b195-3ecbd60ff7cd',
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
      id: 68,
      name: 'chess_board',
      components: {
        PersistentId: {
          id: 'c73b4047-bed9-485f-9492-c391cdb083e7',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'chess_board',
          instanceUuid: '15dde2ae-bef3-4bd3-aa2c-0d2794ef410d',
        },
      },
    },
    {
      id: 69,
      name: 'square_a1',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'da48de04-d735-4964-b669-2fe22da37692',
        },
        Transform: {
          position: [-3.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 70,
      name: 'square_b1',
      parentId: 68,
      components: {
        PersistentId: {
          id: '2e447f83-b202-4924-904a-a2a270e8a316',
        },
        Transform: {
          position: [-2.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 71,
      name: 'square_c1',
      parentId: 68,
      components: {
        PersistentId: {
          id: '17a13570-86cc-4a74-a1c6-9bd114165239',
        },
        Transform: {
          position: [-1.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 72,
      name: 'square_d1',
      parentId: 68,
      components: {
        PersistentId: {
          id: '0cf021cd-ce96-4e49-a4ee-5fc193b617b8',
        },
        Transform: {
          position: [-0.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 73,
      name: 'square_e1',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'c96d3678-ebdb-4274-a5c8-4c6d2143ec7d',
        },
        Transform: {
          position: [0.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 74,
      name: 'square_f1',
      parentId: 68,
      components: {
        PersistentId: {
          id: '18b9f253-0cf5-4e16-b0e8-4154f3488520',
        },
        Transform: {
          position: [1.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 75,
      name: 'square_g1',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'bec42c51-ee81-4448-96f6-b6624152eb27',
        },
        Transform: {
          position: [2.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 76,
      name: 'square_h1',
      parentId: 68,
      components: {
        PersistentId: {
          id: '645d1d55-ecca-47cf-a1a0-61f8f7d87a19',
        },
        Transform: {
          position: [3.5, 0, -3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 77,
      name: 'square_a2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '84e60f21-2657-42e7-95dd-5d0e93d85ba5',
        },
        Transform: {
          position: [-3.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 78,
      name: 'square_b2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '97b9a8fd-1d16-4dc2-886e-bf6d7ad178eb',
        },
        Transform: {
          position: [-2.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 79,
      name: 'square_c2',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'aacc9b17-ff37-41f2-9b40-47dcc555388f',
        },
        Transform: {
          position: [-1.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 80,
      name: 'square_d2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '7a2c993d-6674-4d5d-8867-0f03822641a8',
        },
        Transform: {
          position: [-0.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 81,
      name: 'square_e2',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'a73296eb-cf1f-402b-af95-b4a619d9826e',
        },
        Transform: {
          position: [0.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 82,
      name: 'square_f2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '1b690b20-121b-403b-a09d-58e1f8469835',
        },
        Transform: {
          position: [1.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 83,
      name: 'square_g2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '7f6e0672-c8c9-4ce5-9a30-750a1aa5da97',
        },
        Transform: {
          position: [2.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 84,
      name: 'square_h2',
      parentId: 68,
      components: {
        PersistentId: {
          id: '80adc2c7-949c-45ea-9547-e2adc900ab80',
        },
        Transform: {
          position: [3.5, 0, -2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 85,
      name: 'square_a3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'ee67476e-6a1b-498c-8e80-f8838a363480',
        },
        Transform: {
          position: [-3.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 86,
      name: 'square_b3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'b8e93a35-b631-4815-a5dc-cdfbbfee0594',
        },
        Transform: {
          position: [-2.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 87,
      name: 'square_c3',
      parentId: 68,
      components: {
        PersistentId: {
          id: '42b84b5b-4a4c-4eaf-926e-e0e54a67f927',
        },
        Transform: {
          position: [-1.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 88,
      name: 'square_d3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'ea8664eb-c5e2-4071-a2a1-6b2740bdf2e2',
        },
        Transform: {
          position: [-0.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 89,
      name: 'square_e3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'f7e73d98-f5c6-4c8b-aa63-7255130d75b9',
        },
        Transform: {
          position: [0.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 90,
      name: 'square_f3',
      parentId: 68,
      components: {
        PersistentId: {
          id: '47c929d1-e961-41b9-a7cd-c0238e812c92',
        },
        Transform: {
          position: [1.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 91,
      name: 'square_g3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'b51bab6f-79a3-45a7-bfa0-16e3e0b3103f',
        },
        Transform: {
          position: [2.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 92,
      name: 'square_h3',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'd3a6ac7a-1a41-4a50-84c5-98ac5025ff5a',
        },
        Transform: {
          position: [3.5, 0, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 93,
      name: 'square_a4',
      parentId: 68,
      components: {
        PersistentId: {
          id: '82f5454f-88eb-4365-b1f2-02e83e10cd1c',
        },
        Transform: {
          position: [-3.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 94,
      name: 'square_b4',
      parentId: 68,
      components: {
        PersistentId: {
          id: '0c6a99f1-fa7b-4ace-9137-bc252c118ed8',
        },
        Transform: {
          position: [-2.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 95,
      name: 'square_c4',
      parentId: 68,
      components: {
        PersistentId: {
          id: '84f1beff-85af-4733-ac85-45ea0a320158',
        },
        Transform: {
          position: [-1.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 96,
      name: 'square_d4',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'ec43c313-79c0-4a4e-8d80-12d32c21a4a4',
        },
        Transform: {
          position: [-0.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 97,
      name: 'square_e4',
      parentId: 68,
      components: {
        PersistentId: {
          id: '5c9c20fd-0b59-4d03-9329-8710c6e51075',
        },
        Transform: {
          position: [0.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 98,
      name: 'square_f4',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'f0b8f1fa-37bf-41d6-bd0e-2df5c47f61a4',
        },
        Transform: {
          position: [1.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 99,
      name: 'square_g4',
      parentId: 68,
      components: {
        PersistentId: {
          id: '83738617-ed28-4328-965d-4001823e5c6f',
        },
        Transform: {
          position: [2.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 100,
      name: 'square_h4',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'c50e1c4f-5aae-4a1b-b82e-04488b59bbc7',
        },
        Transform: {
          position: [3.5, 0, -0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 101,
      name: 'square_a5',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'a52eecd3-6842-4c48-a745-8bd63fb4ee2b',
        },
        Transform: {
          position: [-3.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 102,
      name: 'square_b5',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'a8bac749-9ac9-4873-9a01-8d7bcf9e25a1',
        },
        Transform: {
          position: [-2.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 103,
      name: 'square_c5',
      parentId: 68,
      components: {
        PersistentId: {
          id: '8f135d6e-4f52-4704-9371-63bb87450cc0',
        },
        Transform: {
          position: [-1.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 104,
      name: 'square_d5',
      parentId: 68,
      components: {
        PersistentId: {
          id: '0d49faf8-372a-49e2-8511-8b0ec52f9995',
        },
        Transform: {
          position: [-0.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 105,
      name: 'square_e5',
      parentId: 68,
      components: {
        PersistentId: {
          id: '3cc1af0a-9a33-4ff4-85d2-62525bced2c2',
        },
        Transform: {
          position: [0.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 106,
      name: 'square_f5',
      parentId: 68,
      components: {
        PersistentId: {
          id: '13d229c9-aaa4-4112-9901-cb11dbc8529c',
        },
        Transform: {
          position: [1.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 107,
      name: 'square_g5',
      parentId: 68,
      components: {
        PersistentId: {
          id: '6ea6bfeb-ae53-425e-81c4-5607d217773d',
        },
        Transform: {
          position: [2.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 108,
      name: 'square_h5',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'd2ac4b4f-da2a-4b3c-a091-77264ff969d3',
        },
        Transform: {
          position: [3.5, 0, 0.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 109,
      name: 'square_a6',
      parentId: 68,
      components: {
        PersistentId: {
          id: '81d60635-2d05-4533-9aa3-2e408408748b',
        },
        Transform: {
          position: [-3.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 110,
      name: 'square_b6',
      parentId: 68,
      components: {
        PersistentId: {
          id: '14972c22-6ed4-485c-be09-b0579706b288',
        },
        Transform: {
          position: [-2.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 111,
      name: 'square_c6',
      parentId: 68,
      components: {
        PersistentId: {
          id: '3e5a799e-c264-4441-b14f-792c529f253b',
        },
        Transform: {
          position: [-1.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 112,
      name: 'square_d6',
      parentId: 68,
      components: {
        PersistentId: {
          id: '704762e8-b84a-43eb-982f-21ce4dd27cb1',
        },
        Transform: {
          position: [-0.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 113,
      name: 'square_e6',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'ee99a7f3-33ee-4e3e-8ffa-c19ea3050f27',
        },
        Transform: {
          position: [0.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 114,
      name: 'square_f6',
      parentId: 68,
      components: {
        PersistentId: {
          id: '3c8b4858-1e93-472f-9b46-a0c4ac63da43',
        },
        Transform: {
          position: [1.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 115,
      name: 'square_g6',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'b3ba6d3d-abd7-4bc9-b6d5-95be552b35c6',
        },
        Transform: {
          position: [2.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 116,
      name: 'square_h6',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'c375bb7a-70ea-40f6-9914-e4edb003a4a1',
        },
        Transform: {
          position: [3.5, 0, 1.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 117,
      name: 'square_a7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'ce206101-7390-4cf9-af2a-8d6df0436017',
        },
        Transform: {
          position: [-3.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 118,
      name: 'square_b7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'df801350-026e-4201-9d18-f1a50976fa8d',
        },
        Transform: {
          position: [-2.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 119,
      name: 'square_c7',
      parentId: 68,
      components: {
        PersistentId: {
          id: '90aabb55-0078-4b86-a300-5932eb1df822',
        },
        Transform: {
          position: [-1.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 120,
      name: 'square_d7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'd03e5550-a847-4e99-9eaf-5aa868150a25',
        },
        Transform: {
          position: [-0.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 121,
      name: 'square_e7',
      parentId: 68,
      components: {
        PersistentId: {
          id: '9faec4e2-89ab-4e58-a923-4a9c68dbfb5f',
        },
        Transform: {
          position: [0.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 122,
      name: 'square_f7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'bd53c84c-f707-4486-9207-e6104c6b504a',
        },
        Transform: {
          position: [1.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 123,
      name: 'square_g7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'dba7dadd-b27f-4c0d-b15a-8eafae85323b',
        },
        Transform: {
          position: [2.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 124,
      name: 'square_h7',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'f0076def-bbee-44b6-ab07-eb527d87b037',
        },
        Transform: {
          position: [3.5, 0, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 125,
      name: 'square_a8',
      parentId: 68,
      components: {
        PersistentId: {
          id: '77c0b079-16e3-411d-9524-3b1fa8dab25a',
        },
        Transform: {
          position: [-3.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 126,
      name: 'square_b8',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'f28b2ef8-e03a-49a9-8f1c-0cd64a291d5f',
        },
        Transform: {
          position: [-2.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 127,
      name: 'square_c8',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'a08094d0-76e9-42e6-98e7-63b4281b0bac',
        },
        Transform: {
          position: [-1.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 128,
      name: 'square_d8',
      parentId: 68,
      components: {
        PersistentId: {
          id: '3ba84141-f6da-40de-a3c8-8d07667f8d6a',
        },
        Transform: {
          position: [-0.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 129,
      name: 'square_e8',
      parentId: 68,
      components: {
        PersistentId: {
          id: '1bb042f6-acd9-4e96-9c33-81b7b6791254',
        },
        Transform: {
          position: [0.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 130,
      name: 'square_f8',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'd89ddf9c-90a1-4604-bc03-135b4d228107',
        },
        Transform: {
          position: [1.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
    {
      id: 131,
      name: 'square_g8',
      parentId: 68,
      components: {
        PersistentId: {
          id: '336e0c6c-484f-41f9-a654-ddca3618440f',
        },
        Transform: {
          position: [2.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_6c6e5346',
        },
      },
    },
    {
      id: 132,
      name: 'square_h8',
      parentId: 68,
      components: {
        PersistentId: {
          id: 'fd2a0f15-d863-438b-a895-67b80b1fdd83',
        },
        Transform: {
          position: [3.5, 0, 3.5],
          rotation: [0, 0, 0],
          scale: [1, 0.2, 1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_5bda9f5c',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/mat_5bda9f5c',
      '@/materials/mat_6c6e5346',
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
    prefabs: ['@/prefabs/trees', '@/prefabs/chessboard'],
  },
});
