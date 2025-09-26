import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

/**
 * Testscene
 * Generated: 2025-09-26T02:52:24.175Z
 * Version: 1
 */
export const Testscene: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    const entities = [
  {
    id: "5",
    name: "Main Camera",
    components:     {
          "PersistentId": {
                "id": "mg08xk8p-z5yt0pbz5"
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
    id: "6",
    name: "Directional Light",
    components:     {
          "PersistentId": {
                "id": "mg08xk8s-tifsfyq57"
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
    id: "7",
    name: "Ambient Light",
    components:     {
          "PersistentId": {
                "id": "mg08xk8w-cc1ws5rya"
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
    id: "8",
    name: "Cube 0",
    components:     {
          "PersistentId": {
                "id": "mg08xk91-4tc0hts7m"
          },
          "Transform": {
                "position": [
                      -4.25,
                      1.75,
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
                "materialId": "default",
                "enabled": true,
                "castShadows": true,
                "receiveShadows": true,
                "modelPath": "",
                "material": {
                      "shader": "standard",
                      "materialType": "solid",
                      "color": "#3399ff",
                      "normalScale": 1,
                      "metalness": 0,
                      "roughness": 0.5,
                      "emissive": "#000000",
                      "emissiveIntensity": 0,
                      "occlusionStrength": 1,
                      "textureOffsetX": 0,
                      "textureOffsetY": 0
                }
          }
    }
  },

  {
    id: "9",
    name: "Plane 0",
    components:     {
          "PersistentId": {
                "id": "mg08xk95-va39ruabo"
          },
          "Transform": {
                "position": [
                      0,
                      0,
                      0
                ],
                "rotation": [
                      -90,
                      0,
                      0
                ],
                "scale": [
                      10,
                      10,
                      1
                ]
          },
          "MeshRenderer": {
                "meshId": "plane",
                "materialId": "default",
                "enabled": true,
                "castShadows": true,
                "receiveShadows": true,
                "modelPath": "",
                "material": {
                      "shader": "standard",
                      "materialType": "solid",
                      "color": "#5fff33",
                      "normalScale": 1,
                      "metalness": 0,
                      "roughness": 0.5,
                      "emissive": "#000000",
                      "emissiveIntensity": 0,
                      "occlusionStrength": 1,
                      "textureOffsetX": 0,
                      "textureOffsetY": 0
                }
          }
    }
  }
    ];

    entityManager.clearEntities();

    entities.forEach((entityData) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(`[TsxScene] Loaded scene '${metadata?.name || 'Unknown'}' with ${entities.length} entities`);
  }, [entityManager, componentManager]);

  return null;
};

export const metadata = {
  "name": "Testscene",
  "version": 1,
  "timestamp": "2025-09-26T02:52:24.175Z"
};

export default Testscene;