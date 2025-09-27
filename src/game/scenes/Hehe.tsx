import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@core';
import type { ComponentDataMap, SceneMetadata } from '@core';
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
        id: '06a48df5-147e-440d-b55d-09c9d0c28b16',
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
        id: '7808a22b-2cdf-48c5-9b3f-d0bd102585f6',
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
        id: '224076ce-cb2f-4992-87b0-de34b3958c74',
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
        id: '2db53214-ca61-4daf-be7c-6e2d83d5ac20',
      },
      Transform: {
        position: [-2.375, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
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
          color: '#3399ff',
          normalScale: 1,
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      },
    },
  },
  {
    id: 4,
    name: 'Plane 0',
    components: {
      PersistentId: {
        id: 'd1a862bb-48dd-49df-a096-5516d12a784d',
      },
      Transform: {
        position: [0, 0, 0],
        rotation: [-90, 0, 0],
        scale: [10, 10, 1],
      },
      MeshRenderer: {
        meshId: 'plane',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        modelPath: '',
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#ff338b',
          normalScale: 1,
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      },
    },
  },
  {
    id: 5,
    name: 'Sphere 0',
    parentId: 3,
    components: {
      PersistentId: {
        id: '57e5c440-7e19-48df-8223-618e7f552a8f',
      },
      Transform: {
        position: [2.875, 1.5, 0],
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
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#3399ff',
          normalScale: 1,
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      },
    },
  },
];

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = {
  name: 'hehe',
  version: 1,
  timestamp: '2025-09-27T23:28:24.852Z',
};

/**
 * hehe
 * Generated: 2025-09-27T23:28:24.852Z
 * Version: 1
 */
export const Hehe: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
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

    console.log(
      `[TsxScene] Loaded scene '${metadata?.name || 'Unknown'}' with ${validatedSceneData.length} entities`,
    );
  }, [entityManager, componentManager]);

  return null; // Scene components don't render UI
};

export default Hehe;
