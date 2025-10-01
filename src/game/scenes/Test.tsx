import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { MaterialRegistry } from '@core/materials';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import type { KnownComponentTypes, ComponentDataMap, SceneMetadata } from '@core';
import { validateSceneEntity } from '@core';

/**
 * Type-safe scene data interface
 */
interface ITypedSceneEntity {
  id: string;
  name: string;
  parentId?: string | null;
  components: {
    [K in KnownComponentTypes]?: ComponentDataMap[K];
  } & {
    [key: string]: unknown; // Allow additional components
  };
}

/**
 * Type-safe scene definition
 */
const sceneData: ITypedSceneEntity[] = [
  {
    id: 0,
    name: 'Main Camera',
    components: {
      PersistentId: {
        id: 'd0818146-fd9a-4db1-ac68-5e06ec415266',
      },
      Transform: {
        position: [0, 1, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      Camera: {
        fov: 20,
        near: 0.10000000149011612,
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
        id: 'b5308e4b-5377-49c2-9db5-efc29dbf3a1f',
      },
      Transform: {
        position: [5, 10, 5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      Light: {
        lightType: 'directional',
        color: {
          r: 1,
          g: 1,
          b: 1,
        },
        intensity: 0.800000011920929,
        enabled: true,
        castShadow: true,
        directionX: 0,
        directionY: -1,
        directionZ: 0,
        range: 10,
        decay: 1,
        angle: 0.5235987901687622,
        penumbra: 0.10000000149011612,
        shadowMapSize: 1024,
        shadowBias: -0.00009999999747378752,
        shadowRadius: 1,
      },
    },
  },
  {
    id: 2,
    name: 'Ambient Light',
    components: {
      PersistentId: {
        id: 'd1b66a4e-98f0-40aa-9ac9-d5c79f4f0c29',
      },
      Transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      Light: {
        lightType: 'ambient',
        color: {
          r: 0.4000000059604645,
          g: 0.4000000059604645,
          b: 0.4000000059604645,
        },
        intensity: 0.5,
        enabled: true,
        castShadow: false,
        directionX: 0,
        directionY: -1,
        directionZ: 0,
        range: 10,
        decay: 1,
        angle: 0.5235987901687622,
        penumbra: 0.10000000149011612,
        shadowMapSize: 1024,
        shadowBias: -0.00009999999747378752,
        shadowRadius: 1,
      },
    },
  },
  {
    id: 3,
    name: 'Cube 0',
    components: {
      PersistentId: {
        id: '6f929dcb-4f03-4ba7-a318-14f978ee1240',
      },
      Transform: {
        position: [0, 3, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      MeshRenderer: {
        meshId: 'cube',
        materialId: 'dss',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        modelPath: '',
      },
    },
  },
  {
    id: 8,
    name: 'Tree 0',
    components: {
      PersistentId: {
        id: 'fa49220c-4169-4e8b-9f85-6b1e5c486c36',
      },
      Transform: {
        position: [0, 0, 2.25],
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
          shader: 'standard',
          materialType: 'solid',
          color: '#2d5016',
          metalness: 0,
          roughness: 0.699999988079071,
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
      PrefabInstance: {
        prefabId: 'prefab_1759357961858',
        version: 1,
        instanceUuid: 'd8174310-e044-4413-b755-d20cf86ac2cd',
        overridePatch: {
          position: [0, 0, 2.25],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      },
    },
  },
  {
    id: 9,
    name: 'Tree 1',
    parentId: 8,
    components: {
      PersistentId: {
        id: 'c76c47a6-697c-4b3a-9904-33c5c5d9dc24',
      },
      Transform: {
        position: [0.25, 0, 3.5],
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
          shader: 'standard',
          materialType: 'solid',
          color: '#2d5016',
          metalness: 0,
          roughness: 0.699999988079071,
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
];

/**
 * Scene materials
 */
const sceneMaterials = [
  {
    id: 'default',
    name: 'Default Material',
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
  {
    id: 'test123',
    name: 'Test Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ff6600',
    metalness: 0.3,
    roughness: 0.6,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    textureRepeatX: 1,
    textureRepeatY: 1,
  },
  {
    id: 'dss',
    name: 'dss',
    shader: 'standard',
    materialType: 'texture',
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
    albedoTexture: '/assets/textures/crate-texture.png',
  },
];

/**
 * Scene prefabs
 */
const scenePrefabs = [
  {
    id: 'prefab_1759357961858',
    name: 'trees',
    version: 1,
    root: {
      name: 'Tree 0',
      components: {
        PersistentId: {
          id: '6ff54fb0-7e93-4267-a9a5-826ab234895e',
        },
        Transform: {
          position: [0, 0, 2.25],
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
            shader: 'standard',
            materialType: 'solid',
            color: '#2d5016',
            metalness: 0,
            roughness: 0.699999988079071,
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
      children: [
        {
          name: 'Tree 1',
          components: {
            PersistentId: {
              id: '62501dcb-5097-4ff0-833b-bc7a195b39d5',
            },
            Transform: {
              position: [0.25, 0, 3.5],
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
                shader: 'standard',
                materialType: 'solid',
                color: '#2d5016',
                metalness: 0,
                roughness: 0.699999988079071,
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
    },
    metadata: {
      createdAt: '2025-10-01T22:32:41.878Z',
      createdFrom: 6,
    },
    dependencies: ['default'],
    tags: [],
  },
];

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = {
  name: 'Test',
  version: 1,
  timestamp: '2025-10-01T22:33:11.212Z',
};

/**
 * Test
 * Generated: 2025-10-01T22:33:11.212Z
 * Version: 1
 */
export const Test: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const materialsStore = useMaterialsStore();
  const prefabsStore = usePrefabsStore();

  useEffect(() => {
    // Load materials first
    const materialRegistry = MaterialRegistry.getInstance();
    materialRegistry.clearMaterials();

    sceneMaterials.forEach((material) => {
      materialRegistry.upsert(material);
    });

    // Refresh materials store cache
    materialsStore._refreshMaterials();

    // Load prefabs (order preserved from scene definition)
    const loadPrefabs = async () => {
      console.log('[Scene] Loading prefabs from scene:', scenePrefabs.length);
      const { PrefabManager } = await import('@core/prefabs');
      const prefabManager = PrefabManager.getInstance();
      prefabManager.clear();

      // IMPORTANT: forEach preserves array order for prefab registration
      scenePrefabs.forEach((prefab) => {
        console.log('[Scene] Registering prefab:', prefab.id, prefab.name);
        prefabManager.register(prefab);
      });

      // Refresh prefabs store cache so UI components can see the prefabs
      prefabsStore._refreshPrefabs();
      console.log(
        '[Scene] Prefabs loaded to store, total in registry:',
        prefabManager.getAll().length,
      );
    };
    loadPrefabs();

    // Validate scene data at runtime
    const validatedSceneData = sceneData.map((entity) => validateSceneEntity(entity));

    // Clear existing entities
    entityManager.clearEntities();

    // Create entities and components with type safety
    validatedSceneData.forEach((entityData: ITypedSceneEntity) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      // Type-safe component addition
      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          // Type assertion for known component types
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });
  }, [entityManager, componentManager, materialsStore, prefabsStore]);

  return null; // Scene components don't render UI
};

export default Test;
