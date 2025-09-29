import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type {
  ComponentDataMap,
  SceneEntityData,
  SceneMetadata,
} from '@/core/types/scene';
import { validateSceneEntity } from '@/core/types/scene';

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
    "id": 5,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "d0818146-fd9a-4db1-ac68-5e06ec415266"
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
    "id": 6,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "b5308e4b-5377-49c2-9db5-efc29dbf3a1f"
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
    "id": 7,
    "name": "Ambient Light",
    "components": {
      "PersistentId": {
        "id": "d1b66a4e-98f0-40aa-9ac9-d5c79f4f0c29"
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
  },
  {
    "id": 8,
    "name": "Cube 0",
    "components": {
      "PersistentId": {
        "id": "6f929dcb-4f03-4ba7-a318-14f978ee1240"
      },
      "Transform": {
        "position": [
          0,
          3,
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
      "MeshRenderer": {
        "meshId": "cube",
        "materialId": "dss",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": ""
      }
    }
  },
  {
    "id": 9,
    "name": "Sphere 0",
    "components": {
      "PersistentId": {
        "id": "e5ce401b-fbf4-47cb-98ca-e3743eaaa56c"
      },
      "Transform": {
        "position": [
          -2.5,
          1.5,
          -0.25
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
      "MeshRenderer": {
        "meshId": "sphere",
        "materialId": "test123",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": ""
      }
    }
  },
  {
    "id": 10,
    "name": "Sphere 1",
    "components": {
      "PersistentId": {
        "id": "6d740d77-669d-4c18-9899-af8aedcf7cc4"
      },
      "Transform": {
        "position": [
          0,
          1,
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
      "MeshRenderer": {
        "meshId": "sphere",
        "materialId": "default",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "material": {
          "color": "#3399ff",
          "metalness": 0,
          "roughness": 0.5
        }
      }
    }
  }
];

/**
 * Scene materials
 */
const sceneMaterials = [
  {
    "id": "default",
    "name": "Default Material",
    "shader": "standard",
    "materialType": "solid",
    "color": "#cccccc",
    "metalness": 0,
    "roughness": 0.7,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0
  },
  {
    "id": "test123",
    "name": "Test Material",
    "shader": "standard",
    "materialType": "solid",
    "color": "#ff6600",
    "metalness": 0.3,
    "roughness": 0.6,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0
  },
  {
    "id": "dss",
    "name": "dss",
    "shader": "standard",
    "materialType": "texture",
    "color": "#cccccc",
    "metalness": 0,
    "roughness": 0.7,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "albedoTexture": "/assets/textures/crate-texture.png"
  }
];

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = {
  "name": "test",
  "version": 1,
  "timestamp": "2025-09-29T02:04:57.649Z"
};

/**
 * test
 * Generated: 2025-09-29T02:04:57.649Z
 * Version: 1
 */
export const Test: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const materialsStore = useMaterialsStore();

  useEffect(() => {
    // Load materials first
    const materialRegistry = MaterialRegistry.getInstance();
    materialRegistry.clearMaterials();

    sceneMaterials.forEach(material => {
      materialRegistry.upsert(material);
    });

    // Refresh materials store cache
    materialsStore._refreshMaterials();

    // Validate scene data at runtime
    const validatedSceneData = sceneData.map(entity => validateSceneEntity(entity));

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

  }, [entityManager, componentManager, materialsStore]);

  return null; // Scene components don't render UI
};

export default Test;
