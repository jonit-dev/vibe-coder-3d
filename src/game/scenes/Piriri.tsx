import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@core';
import type {
  ComponentDataMap,
  SceneEntityData,
  SceneMetadata,
} from '@core';
import { validateSceneEntity } from '@core';

/**
 * Type-safe scene data interface
 */
interface ITypedSceneEntity {
  id: string | number; // Support both string and numeric IDs
  name: string;
  parentId?: string | number | null; // Support both formats for parent references
  components: {
    [K in KnownComponentTypes]?: ComponentDataMap[K];
  } & {
    [key: string]: unknown; // Allow additional components
  };
}

/**
 * Type-safe scene definition
 */
const entities: ITypedSceneEntity[] = [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "mg15zshk-grclamgya"
      },
      "Transform": {
        "position": [
          0,
          1,
          -10
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      },
      "Camera": {
        "fov": 20,
        "near": 0.10000000149011612,
        "far": 100,
        "projectionType": "perspective",
        "orthographicSize": 10,
        "depth": 0,
        "isMain": true,
        "clearFlags": "skybox",
        "skyboxTexture": "",
        "backgroundColor": {
          "r": 0,
          "g": 0,
          "b": 0,
          "a": 0
        },
        "controlMode": "free",
        "viewportRect": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        },
        "hdr": false,
        "toneMapping": "none",
        "toneMappingExposure": 1,
        "enablePostProcessing": false,
        "postProcessingPreset": "none",
        "enableSmoothing": false,
        "followTarget": 0,
        "followOffset": {
          "x": 0,
          "y": 5,
          "z": -10
        },
        "smoothingSpeed": 2,
        "rotationSmoothing": 1.5
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "mg15zsi5-2j4kfmqp7"
      },
      "Transform": {
        "position": [
          5,
          10,
          5
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      },
      "Light": {
        "lightType": "directional",
        "color": {
          "r": 1,
          "g": 1,
          "b": 1
        },
        "intensity": 0.800000011920929,
        "enabled": true,
        "castShadow": true,
        "directionX": 0,
        "directionY": -1,
        "directionZ": 0,
        "range": 10,
        "decay": 1,
        "angle": 0.5235987901687622,
        "penumbra": 0.10000000149011612,
        "shadowMapSize": 1024,
        "shadowBias": -0.00009999999747378752,
        "shadowRadius": 1
      }
    }
  },
  {
    "id": 2,
    "name": "Ambient Light",
    "components": {
      "PersistentId": {
        "id": "mg15zsid-xq32yzqww"
      },
      "Transform": {
        "position": [
          0,
          0,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      },
      "Light": {
        "lightType": "ambient",
        "color": {
          "r": 0.4000000059604645,
          "g": 0.4000000059604645,
          "b": 0.4000000059604645
        },
        "intensity": 0.5,
        "enabled": true,
        "castShadow": false,
        "directionX": 0,
        "directionY": -1,
        "directionZ": 0,
        "range": 10,
        "decay": 1,
        "angle": 0.5235987901687622,
        "penumbra": 0.10000000149011612,
        "shadowMapSize": 1024,
        "shadowBias": -0.00009999999747378752,
        "shadowRadius": 1
      }
    }
  }
];

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = {
  "name": "piriri",
  "version": 1,
  "timestamp": "2025-09-26T18:18:40.867Z"
};

/**
 * piriri
 * Generated: 2025-09-26T18:18:40.867Z
 * Version: 1
 */
export const Piriri: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    // Validate scene data at runtime
    const validatedSceneData = entities.map(entity => validateSceneEntity(entity));

    // Clear existing entities
    entityManager.clearEntities();

    // Create entities and components with type safety
    validatedSceneData.forEach((entityData: ITypedSceneEntity) => {
      // Convert parentId to number if it's a string, EntityManager expects numeric IDs
      const parentId = entityData.parentId ?
        (typeof entityData.parentId === 'string' ? parseInt(entityData.parentId, 10) : entityData.parentId) :
        undefined;
      const entity = entityManager.createEntity(entityData.name, parentId);

      // Type-safe component addition
      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          // Type assertion for known component types
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(`[TsxScene] Loaded scene '${metadata?.name || 'Unknown'}' with ${validatedSceneData.length} entities`);
  }, [entityManager, componentManager]);

  return null; // Scene components don't render UI
};

export default Piriri;
