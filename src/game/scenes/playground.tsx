import { defineScene } from './defineScene';

/**
 * playground
 * Scene with 236 entities
 * Generated: 2025-11-16T09:49:53.196Z
 * Version: 1
 */
export default defineScene({
  metadata: {
    name: 'playground',
    version: 1,
    timestamp: '2025-11-16T09:49:53.196Z',
    description: 'Scene with 236 entities',
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
      id: 3,
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
      id: 4,
      name: 'square_a1',
      parentId: 3,
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
      id: 5,
      name: 'square_b1',
      parentId: 3,
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
      id: 6,
      name: 'square_c1',
      parentId: 3,
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
      id: 7,
      name: 'square_d1',
      parentId: 3,
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
      id: 8,
      name: 'square_e1',
      parentId: 3,
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
      id: 9,
      name: 'square_f1',
      parentId: 3,
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
      id: 10,
      name: 'square_g1',
      parentId: 3,
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
      id: 11,
      name: 'square_h1',
      parentId: 3,
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
      id: 12,
      name: 'square_a2',
      parentId: 3,
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
      id: 13,
      name: 'square_b2',
      parentId: 3,
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
      id: 14,
      name: 'square_c2',
      parentId: 3,
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
      id: 15,
      name: 'square_d2',
      parentId: 3,
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
      id: 16,
      name: 'square_e2',
      parentId: 3,
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
      id: 17,
      name: 'square_f2',
      parentId: 3,
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
      id: 18,
      name: 'square_g2',
      parentId: 3,
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
      id: 19,
      name: 'square_h2',
      parentId: 3,
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
      id: 20,
      name: 'square_a3',
      parentId: 3,
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
      id: 21,
      name: 'square_b3',
      parentId: 3,
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
      id: 22,
      name: 'square_c3',
      parentId: 3,
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
      id: 23,
      name: 'square_d3',
      parentId: 3,
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
      id: 24,
      name: 'square_e3',
      parentId: 3,
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
      id: 25,
      name: 'square_f3',
      parentId: 3,
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
      id: 26,
      name: 'square_g3',
      parentId: 3,
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
      id: 27,
      name: 'square_h3',
      parentId: 3,
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
      id: 28,
      name: 'square_a4',
      parentId: 3,
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
      id: 29,
      name: 'square_b4',
      parentId: 3,
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
      id: 30,
      name: 'square_c4',
      parentId: 3,
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
      id: 31,
      name: 'square_d4',
      parentId: 3,
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
      id: 32,
      name: 'square_e4',
      parentId: 3,
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
      id: 33,
      name: 'square_f4',
      parentId: 3,
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
      id: 34,
      name: 'square_g4',
      parentId: 3,
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
      id: 35,
      name: 'square_h4',
      parentId: 3,
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
      id: 36,
      name: 'square_a5',
      parentId: 3,
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
      id: 37,
      name: 'square_b5',
      parentId: 3,
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
      id: 38,
      name: 'square_c5',
      parentId: 3,
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
      id: 39,
      name: 'square_d5',
      parentId: 3,
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
      id: 40,
      name: 'square_e5',
      parentId: 3,
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
      id: 41,
      name: 'square_f5',
      parentId: 3,
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
      id: 42,
      name: 'square_g5',
      parentId: 3,
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
      id: 43,
      name: 'square_h5',
      parentId: 3,
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
      id: 44,
      name: 'square_a6',
      parentId: 3,
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
      id: 45,
      name: 'square_b6',
      parentId: 3,
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
      id: 46,
      name: 'square_c6',
      parentId: 3,
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
      id: 47,
      name: 'square_d6',
      parentId: 3,
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
      id: 48,
      name: 'square_e6',
      parentId: 3,
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
      id: 49,
      name: 'square_f6',
      parentId: 3,
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
      id: 50,
      name: 'square_g6',
      parentId: 3,
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
      id: 51,
      name: 'square_h6',
      parentId: 3,
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
      id: 52,
      name: 'square_a7',
      parentId: 3,
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
      id: 53,
      name: 'square_b7',
      parentId: 3,
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
      id: 54,
      name: 'square_c7',
      parentId: 3,
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
      id: 55,
      name: 'square_d7',
      parentId: 3,
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
      id: 56,
      name: 'square_e7',
      parentId: 3,
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
      id: 57,
      name: 'square_f7',
      parentId: 3,
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
      id: 58,
      name: 'square_g7',
      parentId: 3,
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
      id: 59,
      name: 'square_h7',
      parentId: 3,
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
      id: 60,
      name: 'square_a8',
      parentId: 3,
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
      id: 61,
      name: 'square_b8',
      parentId: 3,
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
      id: 62,
      name: 'square_c8',
      parentId: 3,
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
      id: 63,
      name: 'square_d8',
      parentId: 3,
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
      id: 64,
      name: 'square_e8',
      parentId: 3,
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
      id: 65,
      name: 'square_f8',
      parentId: 3,
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
      id: 66,
      name: 'square_g8',
      parentId: 3,
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
      id: 67,
      name: 'square_h8',
      parentId: 3,
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
    {
      id: 184,
      name: 'white_rook',
      components: {
        PersistentId: {
          id: 'aca65894-1145-4ae4-b012-72a07b375a55',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_rook',
          instanceUuid: '452f697d-9df7-4bd5-989a-a272f3faa888',
        },
      },
    },
    {
      id: 185,
      name: 'rook_base',
      parentId: 184,
      components: {
        PersistentId: {
          id: '7af29e00-5b32-4aaa-bd56-039965acaabf',
        },
        Transform: {
          position: [-3.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 186,
      name: 'rook_body',
      parentId: 184,
      components: {
        PersistentId: {
          id: '6747232e-c2bc-45eb-b582-35947a0e30f6',
        },
        Transform: {
          position: [-3.5, 0.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 187,
      name: 'rook_top',
      parentId: 184,
      components: {
        PersistentId: {
          id: '3f04bd2b-b994-427a-90b1-05d0163f9a8d',
        },
        Transform: {
          position: [-3.5, 1.35, -3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.2, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 188,
      name: 'rook_battlement1',
      parentId: 184,
      components: {
        PersistentId: {
          id: '0f7cb313-6608-4763-b9c4-f03a32f95d0f',
        },
        Transform: {
          position: [-3.7, 1.55, -3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 189,
      name: 'rook_battlement2',
      parentId: 184,
      components: {
        PersistentId: {
          id: 'b21e4a07-736a-4488-908b-97bb9e7d4be2',
        },
        Transform: {
          position: [-3.3, 1.55, -3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 190,
      name: 'rook_battlement3',
      parentId: 184,
      components: {
        PersistentId: {
          id: '41a0927e-28cf-4347-9224-f2201a61e4ca',
        },
        Transform: {
          position: [-3.7, 1.55, -3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 191,
      name: 'rook_battlement4',
      parentId: 184,
      components: {
        PersistentId: {
          id: '278976b1-43cd-42a8-b290-0a5fd6fbd83e',
        },
        Transform: {
          position: [-3.3, 1.55, -3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 192,
      name: 'white_rook',
      components: {
        PersistentId: {
          id: 'fed11084-2b6b-4f84-8c32-017ad51abbc1',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_rook',
          instanceUuid: 'df6a852f-db4c-4fd0-b5cb-9fcb0be85466',
        },
      },
    },
    {
      id: 193,
      name: 'rook_base',
      parentId: 192,
      components: {
        PersistentId: {
          id: '3f7a720c-b1cc-4c24-a89d-43313cfb7e20',
        },
        Transform: {
          position: [3.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 194,
      name: 'rook_body',
      parentId: 192,
      components: {
        PersistentId: {
          id: '81b83c65-7050-42b7-820b-c092e56abe9c',
        },
        Transform: {
          position: [3.5, 0.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 195,
      name: 'rook_top',
      parentId: 192,
      components: {
        PersistentId: {
          id: 'b1f51f9f-a429-4757-bd30-1635cdd6aaea',
        },
        Transform: {
          position: [3.5, 1.35, -3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.2, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 196,
      name: 'rook_battlement1',
      parentId: 192,
      components: {
        PersistentId: {
          id: 'dd57cbe5-cadc-4019-b53e-d7134330be07',
        },
        Transform: {
          position: [3.3, 1.55, -3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 197,
      name: 'rook_battlement2',
      parentId: 192,
      components: {
        PersistentId: {
          id: 'd82e1393-5e0b-45ba-81c6-83738de08595',
        },
        Transform: {
          position: [3.7, 1.55, -3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 198,
      name: 'rook_battlement3',
      parentId: 192,
      components: {
        PersistentId: {
          id: 'd5c9b843-49db-4f11-9cfa-a67b08f77bf9',
        },
        Transform: {
          position: [3.3, 1.55, -3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 199,
      name: 'rook_battlement4',
      parentId: 192,
      components: {
        PersistentId: {
          id: 'a52b1097-655c-428c-83a7-64ab0c7e622c',
        },
        Transform: {
          position: [3.7, 1.55, -3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 200,
      name: 'white_knight',
      components: {
        PersistentId: {
          id: '51abac05-d435-4b9a-bc3a-485e5a04dfb4',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_knight',
          instanceUuid: '56194fae-1f56-4967-82b9-e65fb07d1bf3',
        },
      },
    },
    {
      id: 201,
      name: 'knight_base',
      parentId: 200,
      components: {
        PersistentId: {
          id: 'fa31a300-de66-4712-a1ce-af7785dcabf9',
        },
        Transform: {
          position: [-2.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 202,
      name: 'knight_body',
      parentId: 200,
      components: {
        PersistentId: {
          id: '451e7c5d-3e94-4796-97af-213dcd197c16',
        },
        Transform: {
          position: [-2.5, 0.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.7, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 203,
      name: 'knight_head_main',
      parentId: 200,
      components: {
        PersistentId: {
          id: '41e320c1-8937-4a2a-927d-e49062013e4a',
        },
        Transform: {
          position: [-2.5, 1.35, -3.4],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 204,
      name: 'knight_ear',
      parentId: 200,
      components: {
        PersistentId: {
          id: 'b90eb229-5b22-4dcb-aba0-6ee39c488300',
        },
        Transform: {
          position: [-2.6, 1.65, -3.4],
          rotation: [0, 0, 0],
          scale: [0.08, 0.3, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 205,
      name: 'knight_snout',
      parentId: 200,
      components: {
        PersistentId: {
          id: 'e4ad0f42-504b-4b03-b4a8-4b1cf44972fd',
        },
        Transform: {
          position: [-2.3, 1.45, -3.4],
          rotation: [0, 0, 0],
          scale: [0.2, 0.15, 0.15],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 206,
      name: 'white_knight',
      components: {
        PersistentId: {
          id: '98e55be7-2c58-4597-93dd-71f180116476',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_knight',
          instanceUuid: 'fb82ac86-6e93-4ff2-b32b-53a1bc2dcfc2',
        },
      },
    },
    {
      id: 207,
      name: 'knight_base',
      parentId: 206,
      components: {
        PersistentId: {
          id: 'd6c79f09-9f3e-46ef-a098-e4f43e67708f',
        },
        Transform: {
          position: [2.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 208,
      name: 'knight_body',
      parentId: 206,
      components: {
        PersistentId: {
          id: 'b06ab9df-76bd-4d66-949a-e157403d29bb',
        },
        Transform: {
          position: [2.5, 0.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.7, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 209,
      name: 'knight_head_main',
      parentId: 206,
      components: {
        PersistentId: {
          id: 'e65e4dce-b961-4cad-a261-783313771e7f',
        },
        Transform: {
          position: [2.5, 1.35, -3.4],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 210,
      name: 'knight_ear',
      parentId: 206,
      components: {
        PersistentId: {
          id: '4c457375-d064-4566-aa64-5db87f73eb73',
        },
        Transform: {
          position: [2.4, 1.65, -3.4],
          rotation: [0, 0, 0],
          scale: [0.08, 0.3, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 211,
      name: 'knight_snout',
      parentId: 206,
      components: {
        PersistentId: {
          id: 'fad147d1-1ba2-43b0-81b5-f89f0059a63f',
        },
        Transform: {
          position: [2.7, 1.45, -3.4],
          rotation: [0, 0, 0],
          scale: [0.2, 0.15, 0.15],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 212,
      name: 'white_bishop',
      components: {
        PersistentId: {
          id: '4645a658-e3f6-48fb-b8b7-6bcbebe42463',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_bishop',
          instanceUuid: '79981f83-c0ef-4eaf-8a5e-c76b766a9c1c',
        },
      },
    },
    {
      id: 213,
      name: 'bishop_base',
      parentId: 212,
      components: {
        PersistentId: {
          id: 'f5a6b15b-86f7-4f6b-bff1-dee10047067d',
        },
        Transform: {
          position: [-1.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 214,
      name: 'bishop_body',
      parentId: 212,
      components: {
        PersistentId: {
          id: 'a7a749e1-f19c-4c98-bae1-aab19b978a68',
        },
        Transform: {
          position: [-1.5, 0.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 215,
      name: 'bishop_head',
      parentId: 212,
      components: {
        PersistentId: {
          id: 'c0eb616e-5084-4b7c-aac2-633b1baaf4ac',
        },
        Transform: {
          position: [-1.5, 1.35, -3.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 216,
      name: 'bishop_hat',
      parentId: 212,
      components: {
        PersistentId: {
          id: 'dac5f3fa-cc68-4219-89bd-b6b7f8d31af6',
        },
        Transform: {
          position: [-1.5, 1.65, -3.5],
          rotation: [0, 0, 0],
          scale: [0.2, 0.3, 0.2],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 217,
      name: 'bishop_hat_ball',
      parentId: 212,
      components: {
        PersistentId: {
          id: '6458fbc7-46bd-4f6f-8f07-b6a7efe1667a',
        },
        Transform: {
          position: [-1.5, 1.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 218,
      name: 'white_bishop',
      components: {
        PersistentId: {
          id: '364673a3-fecb-4b9c-8875-a809d2c69488',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_bishop',
          instanceUuid: 'c0d3979d-346e-47b0-ba40-5db89171da79',
        },
      },
    },
    {
      id: 219,
      name: 'bishop_base',
      parentId: 218,
      components: {
        PersistentId: {
          id: '77e9f1d4-99cd-4da7-9fae-b755516ce92a',
        },
        Transform: {
          position: [1.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 220,
      name: 'bishop_body',
      parentId: 218,
      components: {
        PersistentId: {
          id: 'a84bf245-16de-4d89-97a8-0828e6d246a7',
        },
        Transform: {
          position: [1.5, 0.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 221,
      name: 'bishop_head',
      parentId: 218,
      components: {
        PersistentId: {
          id: '3febc0b3-e3f4-4710-9527-62a0c5342fd1',
        },
        Transform: {
          position: [1.5, 1.35, -3.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 222,
      name: 'bishop_hat',
      parentId: 218,
      components: {
        PersistentId: {
          id: '5046df60-d193-4944-a99b-c0f60e770231',
        },
        Transform: {
          position: [1.5, 1.65, -3.5],
          rotation: [0, 0, 0],
          scale: [0.2, 0.3, 0.2],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 223,
      name: 'bishop_hat_ball',
      parentId: 218,
      components: {
        PersistentId: {
          id: '8c320d4a-2fff-45a8-bbe8-52775b0bb1aa',
        },
        Transform: {
          position: [1.5, 1.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 224,
      name: 'white_queen',
      components: {
        PersistentId: {
          id: 'd558979b-fdd8-406e-a4f8-48dcfbb91220',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_queen',
          instanceUuid: '9aeec65b-a775-4d40-877c-ad38ecbddf0e',
        },
      },
    },
    {
      id: 225,
      name: 'queen_base',
      parentId: 224,
      components: {
        PersistentId: {
          id: '4b3310de-a594-4f24-a1e1-eeddbadbd76f',
        },
        Transform: {
          position: [-0.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 226,
      name: 'queen_body',
      parentId: 224,
      components: {
        PersistentId: {
          id: '51d964a3-85f1-4106-8ee3-21d891ca8ea4',
        },
        Transform: {
          position: [-0.5, 0.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.7, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 227,
      name: 'queen_head',
      parentId: 224,
      components: {
        PersistentId: {
          id: 'fdb50cb9-cf3e-4e93-96de-caf9d31ce6df',
        },
        Transform: {
          position: [-0.5, 1.25, -3.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 228,
      name: 'queen_crown',
      parentId: 224,
      components: {
        PersistentId: {
          id: '490e7d00-e04f-469e-83cf-4cce991e37f2',
        },
        Transform: {
          position: [-0.5, 1.55, -3.5],
          rotation: [0, 0, 0],
          scale: [0.35, 0.3, 0.35],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 229,
      name: 'queen_crown_ball',
      parentId: 224,
      components: {
        PersistentId: {
          id: 'c845b76f-334a-4b05-8cdd-960cb30b375a',
        },
        Transform: {
          position: [-0.5, 1.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 230,
      name: 'white_king',
      components: {
        PersistentId: {
          id: 'eeb27f1b-4b24-4229-960d-a6985907ccda',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_king',
          instanceUuid: '00d71134-95dd-4b12-8106-6e8e0a285555',
        },
      },
    },
    {
      id: 231,
      name: 'king_base',
      parentId: 230,
      components: {
        PersistentId: {
          id: 'be0a9db7-648b-428d-a273-0d1a94bdca94',
        },
        Transform: {
          position: [0.5, 0.15, -3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 232,
      name: 'king_body',
      parentId: 230,
      components: {
        PersistentId: {
          id: 'f7d2b382-c994-4887-a5c5-e8aeae844e47',
        },
        Transform: {
          position: [0.5, 0.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.8, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 233,
      name: 'king_head',
      parentId: 230,
      components: {
        PersistentId: {
          id: 'ec42de5e-ba87-4e0d-836f-0c74d50de430',
        },
        Transform: {
          position: [0.5, 1.35, -3.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 234,
      name: 'king_cross_vertical',
      parentId: 230,
      components: {
        PersistentId: {
          id: 'cd7b2f32-dd65-40aa-82a0-024d622c0796',
        },
        Transform: {
          position: [0.5, 1.75, -3.5],
          rotation: [0, 0, 0],
          scale: [0.08, 0.4, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 235,
      name: 'king_cross_horizontal',
      parentId: 230,
      components: {
        PersistentId: {
          id: 'ee067454-a56c-4ed1-aa43-17257e49c8cb',
        },
        Transform: {
          position: [0.5, 1.85, -3.5],
          rotation: [0, 0, 0],
          scale: [0.25, 0.08, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 236,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: 'ae230304-6cb4-4d43-8144-c78269c3b0ce',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '172424c3-884d-4df4-ba35-4802de788eb6',
        },
      },
    },
    {
      id: 237,
      name: 'pawn_base',
      parentId: 236,
      components: {
        PersistentId: {
          id: '0c4cc22a-9932-4c94-89d1-a30454b6576a',
        },
        Transform: {
          position: [-3.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 238,
      name: 'pawn_body',
      parentId: 236,
      components: {
        PersistentId: {
          id: '5270d4b9-51a2-4d30-aab5-a828350a778e',
        },
        Transform: {
          position: [-3.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 239,
      name: 'pawn_head',
      parentId: 236,
      components: {
        PersistentId: {
          id: '58e48c6d-d402-4be2-83ef-4f1a020d20da',
        },
        Transform: {
          position: [-3.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 240,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: '99ab1365-cc10-4f7c-ae6b-7965cc51d5e3',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '5f7066dd-2034-4bc3-9475-231025b0c9ae',
        },
      },
    },
    {
      id: 241,
      name: 'pawn_base',
      parentId: 240,
      components: {
        PersistentId: {
          id: '83dbf99b-c491-4ee2-86af-ce306ae807cd',
        },
        Transform: {
          position: [-2.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 242,
      name: 'pawn_body',
      parentId: 240,
      components: {
        PersistentId: {
          id: '9abc0923-9f93-4b34-9cfd-661e6bd1618b',
        },
        Transform: {
          position: [-2.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 243,
      name: 'pawn_head',
      parentId: 240,
      components: {
        PersistentId: {
          id: 'c7e140a2-b7f2-43eb-9099-fef1950f5389',
        },
        Transform: {
          position: [-2.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 244,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: 'f516e6de-2d36-4b5d-9a48-070bb6c61d6a',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '6be0c3e1-a736-44d8-95c7-8b7a159fde64',
        },
      },
    },
    {
      id: 245,
      name: 'pawn_base',
      parentId: 244,
      components: {
        PersistentId: {
          id: '401cdfe5-3b2f-4747-8867-1b4756e3efbd',
        },
        Transform: {
          position: [-1.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 246,
      name: 'pawn_body',
      parentId: 244,
      components: {
        PersistentId: {
          id: 'a4bec7c1-84af-45ac-a3c8-1870ba387b6f',
        },
        Transform: {
          position: [-1.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 247,
      name: 'pawn_head',
      parentId: 244,
      components: {
        PersistentId: {
          id: 'd7765208-f0af-483d-964d-4d838cfcc476',
        },
        Transform: {
          position: [-1.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 248,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: 'a56aaa01-4e16-49bb-b3ce-9e61af83df88',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '820535b8-3a6a-4664-97b1-9a29ec9db83a',
        },
      },
    },
    {
      id: 249,
      name: 'pawn_base',
      parentId: 248,
      components: {
        PersistentId: {
          id: '2f5f6e3b-b4fc-46d4-a050-e751e641ba50',
        },
        Transform: {
          position: [-0.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 250,
      name: 'pawn_body',
      parentId: 248,
      components: {
        PersistentId: {
          id: 'a254c229-4d3a-4c07-8d76-677be0ec4b54',
        },
        Transform: {
          position: [-0.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 251,
      name: 'pawn_head',
      parentId: 248,
      components: {
        PersistentId: {
          id: 'd221666a-c04d-4165-ab02-3adefe22c033',
        },
        Transform: {
          position: [-0.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 252,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: '945a8b24-7daa-4ea8-82fe-39d872af57ac',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: 'd96297ff-8168-4f13-aa66-77b95a078ee3',
        },
      },
    },
    {
      id: 253,
      name: 'pawn_base',
      parentId: 252,
      components: {
        PersistentId: {
          id: 'f54388bc-ed68-4bd1-9089-38dea80b0ac5',
        },
        Transform: {
          position: [0.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 254,
      name: 'pawn_body',
      parentId: 252,
      components: {
        PersistentId: {
          id: '70ac46e8-be19-4680-993c-c8d97e0e0717',
        },
        Transform: {
          position: [0.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 255,
      name: 'pawn_head',
      parentId: 252,
      components: {
        PersistentId: {
          id: '992bcc82-e661-443a-a2f4-4c1d0afba2f7',
        },
        Transform: {
          position: [0.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 256,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: '769cfac5-59f5-4da9-9c3a-c45a0a2b9ca0',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '9d6e6a21-c494-43e6-b1a6-8921b73c1657',
        },
      },
    },
    {
      id: 257,
      name: 'pawn_base',
      parentId: 256,
      components: {
        PersistentId: {
          id: '9ff0de2c-8e0b-43e8-888d-307693a635ae',
        },
        Transform: {
          position: [1.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 258,
      name: 'pawn_body',
      parentId: 256,
      components: {
        PersistentId: {
          id: 'ceb3c832-46f1-48c2-ba15-187420510fca',
        },
        Transform: {
          position: [1.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 259,
      name: 'pawn_head',
      parentId: 256,
      components: {
        PersistentId: {
          id: '4a76d15f-e893-48f5-89e5-57e2ab0e2006',
        },
        Transform: {
          position: [1.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 260,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: '76d5c8bc-ad89-4164-b844-41b1861a6119',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '595cd636-23a9-404a-91f5-59a5a1bfe138',
        },
      },
    },
    {
      id: 261,
      name: 'pawn_base',
      parentId: 260,
      components: {
        PersistentId: {
          id: '9afdd491-fa27-4e83-8b6b-f0d51219edfd',
        },
        Transform: {
          position: [2.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 262,
      name: 'pawn_body',
      parentId: 260,
      components: {
        PersistentId: {
          id: '3b3e44f8-6353-4ec5-a188-70cb49b42536',
        },
        Transform: {
          position: [2.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 263,
      name: 'pawn_head',
      parentId: 260,
      components: {
        PersistentId: {
          id: 'e7a4d04d-dd54-4c15-9ffc-61c79d88af74',
        },
        Transform: {
          position: [2.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 264,
      name: 'white_pawn',
      components: {
        PersistentId: {
          id: '73248fab-041f-4fd2-8a07-ead3e560d653',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'white_pawn',
          instanceUuid: '663c7662-257a-49da-896b-b0bc3bb6bd6a',
        },
      },
    },
    {
      id: 265,
      name: 'pawn_base',
      parentId: 264,
      components: {
        PersistentId: {
          id: '0c477995-2d55-4cf2-8804-c852de6a3bca',
        },
        Transform: {
          position: [3.5, 0.15, -2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 266,
      name: 'pawn_body',
      parentId: 264,
      components: {
        PersistentId: {
          id: '3a18dd4b-4ae6-4591-92dd-fa33474a77de',
        },
        Transform: {
          position: [3.5, 0.55, -2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 267,
      name: 'pawn_head',
      parentId: 264,
      components: {
        PersistentId: {
          id: '7fb91e8b-7328-4286-b463-8d0b5c6ff2cc',
        },
        Transform: {
          position: [3.5, 1.05, -2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_3447730b',
        },
      },
    },
    {
      id: 268,
      name: 'black_rook',
      components: {
        PersistentId: {
          id: '1f798ec5-b0e2-4ae7-9ff7-b4a6c40f5ccc',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_rook',
          instanceUuid: '11744215-f796-4900-bf20-0fc1bff9481d',
        },
      },
    },
    {
      id: 269,
      name: 'rook_base',
      parentId: 268,
      components: {
        PersistentId: {
          id: 'c60b559c-9b3c-4591-b0af-d8bfd3827b4e',
        },
        Transform: {
          position: [-3.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 270,
      name: 'rook_body',
      parentId: 268,
      components: {
        PersistentId: {
          id: '10008465-6f15-44fa-a1be-52cb62f2d1e5',
        },
        Transform: {
          position: [-3.5, 0.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 271,
      name: 'rook_top',
      parentId: 268,
      components: {
        PersistentId: {
          id: '9a81490f-3ae8-41d7-9f49-5a45bd8e9d6d',
        },
        Transform: {
          position: [-3.5, 1.35, 3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.2, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 272,
      name: 'rook_battlement1',
      parentId: 268,
      components: {
        PersistentId: {
          id: 'ee371910-ab14-4340-ad5d-1cda6ef6490f',
        },
        Transform: {
          position: [-3.7, 1.55, 3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 273,
      name: 'rook_battlement2',
      parentId: 268,
      components: {
        PersistentId: {
          id: 'b4978c88-3f2d-402b-bbf4-11bd4cd9d2f1',
        },
        Transform: {
          position: [-3.3, 1.55, 3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 274,
      name: 'rook_battlement3',
      parentId: 268,
      components: {
        PersistentId: {
          id: '4f9051aa-0e2a-4be7-8174-b1ea94f0861b',
        },
        Transform: {
          position: [-3.7, 1.55, 3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 275,
      name: 'rook_battlement4',
      parentId: 268,
      components: {
        PersistentId: {
          id: '1f63b560-070b-48fa-b4f9-cdfcda99ab26',
        },
        Transform: {
          position: [-3.3, 1.55, 3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 276,
      name: 'black_rook',
      components: {
        PersistentId: {
          id: '4d02831e-cc3f-451c-a0d0-9f3a1ae61dc8',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_rook',
          instanceUuid: '97c89293-7d29-4457-af61-df3befb17c80',
        },
      },
    },
    {
      id: 277,
      name: 'rook_base',
      parentId: 276,
      components: {
        PersistentId: {
          id: '4c053a59-379d-4fb4-8a21-cdcd7bdb5798',
        },
        Transform: {
          position: [3.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 278,
      name: 'rook_body',
      parentId: 276,
      components: {
        PersistentId: {
          id: 'c7240581-aaec-45c5-9add-4f4a99851706',
        },
        Transform: {
          position: [3.5, 0.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 279,
      name: 'rook_top',
      parentId: 276,
      components: {
        PersistentId: {
          id: '57a48f18-1e0f-4ed2-a05d-d4d4c83dbb35',
        },
        Transform: {
          position: [3.5, 1.35, 3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.2, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 280,
      name: 'rook_battlement1',
      parentId: 276,
      components: {
        PersistentId: {
          id: '82696838-4f5e-4b6f-8f52-12ec744a817b',
        },
        Transform: {
          position: [3.3, 1.55, 3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 281,
      name: 'rook_battlement2',
      parentId: 276,
      components: {
        PersistentId: {
          id: '815cc761-a188-4b76-ba06-8d2161347aa2',
        },
        Transform: {
          position: [3.7, 1.55, 3.3],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 282,
      name: 'rook_battlement3',
      parentId: 276,
      components: {
        PersistentId: {
          id: '739d75a0-8a6a-4c38-9679-cd5f5cf0542b',
        },
        Transform: {
          position: [3.3, 1.55, 3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 283,
      name: 'rook_battlement4',
      parentId: 276,
      components: {
        PersistentId: {
          id: '4b833bd4-fd8f-4649-8fb3-57875deb8d16',
        },
        Transform: {
          position: [3.7, 1.55, 3.7],
          rotation: [0, 0, 0],
          scale: [0.1, 0.2, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 284,
      name: 'black_knight',
      components: {
        PersistentId: {
          id: '0ac44cf8-dc09-4e37-9d0d-718f4427ed8b',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_knight',
          instanceUuid: '7b4862dd-0d82-436d-8ccd-6e407d52f3bf',
        },
      },
    },
    {
      id: 285,
      name: 'knight_base',
      parentId: 284,
      components: {
        PersistentId: {
          id: 'da4bff2b-2d33-4e11-929c-ffeaf5082c87',
        },
        Transform: {
          position: [-2.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 286,
      name: 'knight_body',
      parentId: 284,
      components: {
        PersistentId: {
          id: 'dfd291af-203e-4cbb-8504-c3550d53c124',
        },
        Transform: {
          position: [-2.5, 0.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.7, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 287,
      name: 'knight_head_main',
      parentId: 284,
      components: {
        PersistentId: {
          id: 'c4a5b54f-61f0-4138-9588-1b1da675be2b',
        },
        Transform: {
          position: [-2.5, 1.35, 3.6],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 288,
      name: 'knight_ear',
      parentId: 284,
      components: {
        PersistentId: {
          id: '48d6ea9a-f850-4903-939e-0e065398db27',
        },
        Transform: {
          position: [-2.6, 1.65, 3.6],
          rotation: [0, 0, 0],
          scale: [0.08, 0.3, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 289,
      name: 'knight_snout',
      parentId: 284,
      components: {
        PersistentId: {
          id: '65ccb537-c694-4e04-a096-1e0d628abee4',
        },
        Transform: {
          position: [-2.3, 1.45, 3.6],
          rotation: [0, 0, 0],
          scale: [0.2, 0.15, 0.15],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 290,
      name: 'black_knight',
      components: {
        PersistentId: {
          id: '878d3601-26d5-4635-b94a-3af942ef7497',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_knight',
          instanceUuid: '5c0539f9-1398-4a3d-91fe-2c643300af8c',
        },
      },
    },
    {
      id: 291,
      name: 'knight_base',
      parentId: 290,
      components: {
        PersistentId: {
          id: '40f4c19c-83c7-44dd-b48e-9c94284d4b1e',
        },
        Transform: {
          position: [2.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 292,
      name: 'knight_body',
      parentId: 290,
      components: {
        PersistentId: {
          id: '8d9f5953-e2aa-4710-b307-144ad21cd0ae',
        },
        Transform: {
          position: [2.5, 0.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.7, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 293,
      name: 'knight_head_main',
      parentId: 290,
      components: {
        PersistentId: {
          id: '95574337-7aea-4c99-909e-103a70b0fadb',
        },
        Transform: {
          position: [2.5, 1.35, 3.6],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 294,
      name: 'knight_ear',
      parentId: 290,
      components: {
        PersistentId: {
          id: 'f3ff1b88-edf8-4308-9c60-5d6e913d51f3',
        },
        Transform: {
          position: [2.4, 1.65, 3.6],
          rotation: [0, 0, 0],
          scale: [0.08, 0.3, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 295,
      name: 'knight_snout',
      parentId: 290,
      components: {
        PersistentId: {
          id: '2a3ba285-763b-4f99-a833-7359d9ae1afc',
        },
        Transform: {
          position: [2.7, 1.45, 3.6],
          rotation: [0, 0, 0],
          scale: [0.2, 0.15, 0.15],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cube',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 296,
      name: 'black_bishop',
      components: {
        PersistentId: {
          id: '4aa3e1a9-d70e-4e83-9cf2-1c2ef4fb49e9',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_bishop',
          instanceUuid: 'e72d70ca-84ca-4434-9fb9-f4204879448a',
        },
      },
    },
    {
      id: 297,
      name: 'bishop_base',
      parentId: 296,
      components: {
        PersistentId: {
          id: 'c46e234c-015c-46b6-a7be-84def77a50ff',
        },
        Transform: {
          position: [-1.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 298,
      name: 'bishop_body',
      parentId: 296,
      components: {
        PersistentId: {
          id: '96d115c7-948c-4beb-92f0-b1eebfc9c0d4',
        },
        Transform: {
          position: [-1.5, 0.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 299,
      name: 'bishop_head',
      parentId: 296,
      components: {
        PersistentId: {
          id: '8b4a2207-381c-4442-b385-b28fc36fe5f3',
        },
        Transform: {
          position: [-1.5, 1.35, 3.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 300,
      name: 'bishop_hat',
      parentId: 296,
      components: {
        PersistentId: {
          id: '7b7ffc35-8f37-4f7c-89d5-6186df1f8804',
        },
        Transform: {
          position: [-1.5, 1.65, 3.5],
          rotation: [0, 0, 0],
          scale: [0.2, 0.3, 0.2],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 301,
      name: 'bishop_hat_ball',
      parentId: 296,
      components: {
        PersistentId: {
          id: '3225b190-5af8-4bf4-a852-a69634c9bbf9',
        },
        Transform: {
          position: [-1.5, 1.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 302,
      name: 'black_bishop',
      components: {
        PersistentId: {
          id: 'c9a022af-2537-44aa-a0cc-0bf8b96ddcb0',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_bishop',
          instanceUuid: 'ffa0bf49-1ceb-4610-8b67-a1a879d98450',
        },
      },
    },
    {
      id: 303,
      name: 'bishop_base',
      parentId: 302,
      components: {
        PersistentId: {
          id: 'c5c45c2f-7a44-42c1-89bb-ae9fcbfd0e37',
        },
        Transform: {
          position: [1.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.7, 0.3, 0.7],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 304,
      name: 'bishop_body',
      parentId: 302,
      components: {
        PersistentId: {
          id: '0afe068f-8c1c-4f25-926e-45332d39fb98',
        },
        Transform: {
          position: [1.5, 0.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.5, 0.8, 0.5],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 305,
      name: 'bishop_head',
      parentId: 302,
      components: {
        PersistentId: {
          id: 'de2d7a30-14fb-416c-b2a4-6203c6ddc53a',
        },
        Transform: {
          position: [1.5, 1.35, 3.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 306,
      name: 'bishop_hat',
      parentId: 302,
      components: {
        PersistentId: {
          id: 'ec476d53-8b60-4a2a-8a73-78d70fe2d294',
        },
        Transform: {
          position: [1.5, 1.65, 3.5],
          rotation: [0, 0, 0],
          scale: [0.2, 0.3, 0.2],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 307,
      name: 'bishop_hat_ball',
      parentId: 302,
      components: {
        PersistentId: {
          id: 'e9c0637d-cbe1-4d45-9f2b-54ebab9ec38d',
        },
        Transform: {
          position: [1.5, 1.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 308,
      name: 'black_queen',
      components: {
        PersistentId: {
          id: '18ba8aad-e149-4049-9622-2159bb267d74',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_queen',
          instanceUuid: 'd92549dc-5bd3-482a-a2d4-de973f2687e3',
        },
      },
    },
    {
      id: 309,
      name: 'queen_base',
      parentId: 308,
      components: {
        PersistentId: {
          id: '5059f16f-c75f-430d-af84-66505a69ad20',
        },
        Transform: {
          position: [-0.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 310,
      name: 'queen_body',
      parentId: 308,
      components: {
        PersistentId: {
          id: '0350f4a7-e9ad-41f4-83db-be9693928623',
        },
        Transform: {
          position: [-0.5, 0.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.7, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 311,
      name: 'queen_head',
      parentId: 308,
      components: {
        PersistentId: {
          id: 'c5090eaf-a924-47f1-a31e-8636f32877ac',
        },
        Transform: {
          position: [-0.5, 1.25, 3.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 312,
      name: 'queen_crown',
      parentId: 308,
      components: {
        PersistentId: {
          id: 'b6f2f465-51a9-46f0-b017-e1f9aa249201',
        },
        Transform: {
          position: [-0.5, 1.55, 3.5],
          rotation: [0, 0, 0],
          scale: [0.35, 0.3, 0.35],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cone',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 313,
      name: 'queen_crown_ball',
      parentId: 308,
      components: {
        PersistentId: {
          id: 'c6c7b9fd-6363-4afa-a6e8-6413ad5624fb',
        },
        Transform: {
          position: [-0.5, 1.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.1, 0.1, 0.1],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 314,
      name: 'black_king',
      components: {
        PersistentId: {
          id: 'a858d41e-ba22-46c0-99a9-35408346a24c',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_king',
          instanceUuid: '59b498ff-3c87-4fda-8a10-b4a3277369ac',
        },
      },
    },
    {
      id: 315,
      name: 'king_base',
      parentId: 314,
      components: {
        PersistentId: {
          id: '3d485202-9cc2-4014-aac5-b0d6f3560b48',
        },
        Transform: {
          position: [0.5, 0.15, 3.5],
          rotation: [0, 0, 0],
          scale: [0.8, 0.3, 0.8],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 316,
      name: 'king_body',
      parentId: 314,
      components: {
        PersistentId: {
          id: '4d2c0311-933b-4696-adcf-dd6f66e7298b',
        },
        Transform: {
          position: [0.5, 0.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.8, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 317,
      name: 'king_head',
      parentId: 314,
      components: {
        PersistentId: {
          id: '1da6e97c-828a-49ae-8241-62d5cfe95315',
        },
        Transform: {
          position: [0.5, 1.35, 3.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 318,
      name: 'king_cross_vertical',
      parentId: 314,
      components: {
        PersistentId: {
          id: '2f6e6181-c386-4858-80ed-028271178665',
        },
        Transform: {
          position: [0.5, 1.75, 3.5],
          rotation: [0, 0, 0],
          scale: [0.08, 0.4, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 319,
      name: 'king_cross_horizontal',
      parentId: 314,
      components: {
        PersistentId: {
          id: 'a934f6d6-e4ac-4914-849d-85f8b9b150e8',
        },
        Transform: {
          position: [0.5, 1.85, 3.5],
          rotation: [0, 0, 0],
          scale: [0.25, 0.08, 0.08],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 320,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: 'c96c4cf1-72da-4fae-8cef-8b96892c7845',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: 'b686924d-65bf-4587-9168-2425b0cbe0ba',
        },
      },
    },
    {
      id: 321,
      name: 'pawn_base',
      parentId: 320,
      components: {
        PersistentId: {
          id: '75dab8dd-70dc-4d1c-84cb-cdb2bd5eb00d',
        },
        Transform: {
          position: [-3.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 322,
      name: 'pawn_body',
      parentId: 320,
      components: {
        PersistentId: {
          id: 'ddac770a-375f-47e4-93b6-62cfbb8f9f3c',
        },
        Transform: {
          position: [-3.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 323,
      name: 'pawn_head',
      parentId: 320,
      components: {
        PersistentId: {
          id: 'aa5f66fb-33d9-44d7-bb54-341dcfc990ef',
        },
        Transform: {
          position: [-3.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 324,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: '2b6e37d4-677e-45ab-b879-360d72b7f676',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '26368fad-3729-45f0-9e2c-98c86ef742ba',
        },
      },
    },
    {
      id: 325,
      name: 'pawn_base',
      parentId: 324,
      components: {
        PersistentId: {
          id: '393aed1c-4cb5-4fed-ab23-ed4f9bf7f529',
        },
        Transform: {
          position: [-2.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 326,
      name: 'pawn_body',
      parentId: 324,
      components: {
        PersistentId: {
          id: '9e462a8a-fda5-4535-b672-c2ef52c98dac',
        },
        Transform: {
          position: [-2.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 327,
      name: 'pawn_head',
      parentId: 324,
      components: {
        PersistentId: {
          id: 'e2bbb15b-30df-42c6-afbd-cc065d2b8e27',
        },
        Transform: {
          position: [-2.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 328,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: 'f566efbd-f333-4f55-b017-a2ec9d915ef2',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '167296ef-4a6f-4489-b7a1-e12d614f7f33',
        },
      },
    },
    {
      id: 329,
      name: 'pawn_base',
      parentId: 328,
      components: {
        PersistentId: {
          id: '64923da8-c455-45e8-ae80-1e2453ddb5d4',
        },
        Transform: {
          position: [-1.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 330,
      name: 'pawn_body',
      parentId: 328,
      components: {
        PersistentId: {
          id: '6ad178ae-d670-44de-9cce-18fc3b60e18b',
        },
        Transform: {
          position: [-1.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 331,
      name: 'pawn_head',
      parentId: 328,
      components: {
        PersistentId: {
          id: '49af8d14-ed35-4cf4-a10d-79528b95ced1',
        },
        Transform: {
          position: [-1.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 332,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: '27c677db-8c8e-4ed2-8e1c-3609e94e0b0a',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '0dd9e30c-7de0-4cd0-acce-11d515202e50',
        },
      },
    },
    {
      id: 333,
      name: 'pawn_base',
      parentId: 332,
      components: {
        PersistentId: {
          id: '1e5ce3df-da0f-4e44-ac5a-1610c25cac1e',
        },
        Transform: {
          position: [-0.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 334,
      name: 'pawn_body',
      parentId: 332,
      components: {
        PersistentId: {
          id: '7f4eb9d0-afa3-48f2-be5a-fdc75e7b3f71',
        },
        Transform: {
          position: [-0.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 335,
      name: 'pawn_head',
      parentId: 332,
      components: {
        PersistentId: {
          id: 'd87ae77f-0119-4665-ba66-3a3e69aa672d',
        },
        Transform: {
          position: [-0.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 336,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: '2da96293-dbfe-4953-a3dd-e2d797d526a6',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: 'd3548077-f8ee-4978-96b6-a26c322f7c39',
        },
      },
    },
    {
      id: 337,
      name: 'pawn_base',
      parentId: 336,
      components: {
        PersistentId: {
          id: '2548e207-666a-4540-aa64-3ae816ae10e9',
        },
        Transform: {
          position: [0.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 338,
      name: 'pawn_body',
      parentId: 336,
      components: {
        PersistentId: {
          id: 'b0b2704b-47e5-4dfe-8e16-11921693761a',
        },
        Transform: {
          position: [0.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 339,
      name: 'pawn_head',
      parentId: 336,
      components: {
        PersistentId: {
          id: '5c51eacd-dc8b-4e22-9057-44f19f0ea5a7',
        },
        Transform: {
          position: [0.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 340,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: 'cf33263b-3983-4ee5-95b4-bf90e76c3951',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '0574491f-4c00-412b-aa13-a205e53daded',
        },
      },
    },
    {
      id: 341,
      name: 'pawn_base',
      parentId: 340,
      components: {
        PersistentId: {
          id: 'e2f1e997-3741-4c7f-a46c-979f53df96fe',
        },
        Transform: {
          position: [1.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 342,
      name: 'pawn_body',
      parentId: 340,
      components: {
        PersistentId: {
          id: '6f5baf17-5a99-4f09-bea1-5889bc3f2330',
        },
        Transform: {
          position: [1.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 343,
      name: 'pawn_head',
      parentId: 340,
      components: {
        PersistentId: {
          id: '8deaf05b-1c0b-4bcb-aa39-630a1e680fcc',
        },
        Transform: {
          position: [1.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 344,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: '700e49c1-6514-473c-bd0d-65aae7b5b672',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '74834ce4-bc24-4b56-b349-b23498a0ab87',
        },
      },
    },
    {
      id: 345,
      name: 'pawn_base',
      parentId: 344,
      components: {
        PersistentId: {
          id: '52313dd6-2e05-4f95-a449-0dafcc9195a0',
        },
        Transform: {
          position: [2.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 346,
      name: 'pawn_body',
      parentId: 344,
      components: {
        PersistentId: {
          id: '3be3a27c-5d5b-4578-8fe8-bc72137716b4',
        },
        Transform: {
          position: [2.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 347,
      name: 'pawn_head',
      parentId: 344,
      components: {
        PersistentId: {
          id: '4f3bff7b-f892-4c56-a33a-f90d6beda683',
        },
        Transform: {
          position: [2.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 348,
      name: 'black_pawn',
      components: {
        PersistentId: {
          id: '1180bd2f-a7af-47f8-89de-0bc8cd4ba75b',
        },
        PrefabInstance: {
          version: 1,
          overridePatch: {},
          prefabId: 'black_pawn',
          instanceUuid: '0714c1ba-a6a3-4b4d-a674-7a31df98d7e3',
        },
      },
    },
    {
      id: 349,
      name: 'pawn_base',
      parentId: 348,
      components: {
        PersistentId: {
          id: 'ca256f15-b604-4a9d-81c5-373909f5dbfe',
        },
        Transform: {
          position: [3.5, 0.15, 2.5],
          rotation: [0, 0, 0],
          scale: [0.6, 0.3, 0.6],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 350,
      name: 'pawn_body',
      parentId: 348,
      components: {
        PersistentId: {
          id: '981c1e97-878d-4806-b85d-419c53d802ea',
        },
        Transform: {
          position: [3.5, 0.55, 2.5],
          rotation: [0, 0, 0],
          scale: [0.4, 0.6, 0.4],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'cylinder',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
    {
      id: 351,
      name: 'pawn_head',
      parentId: 348,
      components: {
        PersistentId: {
          id: 'd0555982-ad0d-4d0a-b77c-1ec3f3ce1715',
        },
        Transform: {
          position: [3.5, 1.05, 2.5],
          rotation: [0, 0, 0],
          scale: [0.3, 0.3, 0.3],
        },
        MeshRenderer: {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: '',
          meshId: 'sphere',
          materialId: 'mat_7a93cc2b',
        },
      },
    },
  ],
  assetReferences: {
    materials: [
      '@/materials/mat_3447730b',
      '@/materials/mat_7a93cc2b',
      '@/materials/default',
      '@/materials/mat_5bda9f5c',
      '@/materials/mat_6c6e5346',
      '@/materials/mat_08941399',
      '@/materials/mat_5c3dbf5d',
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
      '@/materials/mat_50e25b2a',
      '@/materials/myMaterial',
      '@/materials/re',
      '@/materials/red',
      '@/materials/rock',
      '@/materials/sky',
      '@/materials/test123',
    ],
    inputs: ['@/inputs/defaultInput'],
    prefabs: [
      '@/prefabs/blackbishop',
      '@/prefabs/blackking',
      '@/prefabs/blackknight',
      '@/prefabs/blackpawn',
      '@/prefabs/blackqueen',
      '@/prefabs/blackrook',
      '@/prefabs/chessboard',
      '@/prefabs/chesspawn',
      '@/prefabs/testprefab',
      '@/prefabs/trees',
      '@/prefabs/whitebishop',
      '@/prefabs/whiteking',
      '@/prefabs/whiteknight',
      '@/prefabs/whitepawn',
      '@/prefabs/whitequeen',
      '@/prefabs/whiterook',
    ],
  },
  lockedEntityIds: [3],
});
