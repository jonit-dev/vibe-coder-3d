import { defineScene } from './defineScene';

/**
 * test
 * Generated: 2025-10-01T23:20:44.771Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
  "name": "test",
  "version": 1,
  "timestamp": "2025-10-01T23:20:44.771Z"
},
  entities: [
  {
    "id": 5,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "a0293986-830a-4818-a906-382600973f92"
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
        "id": "ddca780c-ce4d-4193-92dd-d01a60446870"
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
        "id": "d330250c-3904-4f03-96a9-de0ddd3bbe65"
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
    "id": 10,
    "name": "Tree 0",
    "components": {
      "PersistentId": {
        "id": "e0eac286-9aa0-4af2-ac9e-ea9a8517abd7"
      },
      "Transform": {
        "position": [
          -2.25,
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
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "default",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "material": {
          "shader": "standard",
          "materialType": "solid",
          "color": "#2d5016",
          "metalness": 0,
          "roughness": 0.699999988079071,
          "emissive": "#000000",
          "emissiveIntensity": 0,
          "normalScale": 1,
          "occlusionStrength": 1,
          "textureOffsetX": 0,
          "textureOffsetY": 0,
          "textureRepeatX": 1,
          "textureRepeatY": 1,
          "albedoTexture": "",
          "normalTexture": "",
          "metallicTexture": "",
          "roughnessTexture": "",
          "emissiveTexture": "",
          "occlusionTexture": ""
        }
      },
      "PrefabInstance": {
        "prefabId": "prefab_1759360839727",
        "version": 1,
        "instanceUuid": "0152a8ae-f978-417a-ba1a-8088c680e4b8",
        "overridePatch": {
          "position": [
            -2.25,
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
        }
      }
    }
  },
  {
    "id": 11,
    "name": "Tree 1",
    "parentId": 10,
    "components": {
      "PersistentId": {
        "id": "75ef3c12-c394-4114-b1a9-d28b8aec6d7e"
      },
      "Transform": {
        "position": [
          2,
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
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "default",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "material": {
          "shader": "standard",
          "materialType": "solid",
          "color": "#2d5016",
          "metalness": 0,
          "roughness": 0.699999988079071,
          "emissive": "#000000",
          "emissiveIntensity": 0,
          "normalScale": 1,
          "occlusionStrength": 1,
          "textureOffsetX": 0,
          "textureOffsetY": 0,
          "textureRepeatX": 1,
          "textureRepeatY": 1,
          "albedoTexture": "",
          "normalTexture": "",
          "metallicTexture": "",
          "roughnessTexture": "",
          "emissiveTexture": "",
          "occlusionTexture": ""
        }
      }
    }
  }
],
  materials: [
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
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
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
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
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
    "albedoTexture": "/assets/textures/crate-texture.png",
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
  }
],
  prefabs: [
  {
    "id": "prefab_1759360839727",
    "name": "trees",
    "version": 1,
    "root": {
      "name": "Tree 0",
      "components": {
        "PersistentId": {
          "id": "62cf58c8-673d-4119-a1a9-a30b481bc642"
        },
        "Transform": {
          "position": [
            -2.25,
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
        "MeshRenderer": {
          "meshId": "tree",
          "materialId": "default",
          "enabled": true,
          "castShadows": true,
          "receiveShadows": true,
          "modelPath": "",
          "material": {
            "shader": "standard",
            "materialType": "solid",
            "color": "#2d5016",
            "metalness": 0,
            "roughness": 0.699999988079071,
            "emissive": "#000000",
            "emissiveIntensity": 0,
            "normalScale": 1,
            "occlusionStrength": 1,
            "textureOffsetX": 0,
            "textureOffsetY": 0,
            "textureRepeatX": 1,
            "textureRepeatY": 1,
            "albedoTexture": "",
            "normalTexture": "",
            "metallicTexture": "",
            "roughnessTexture": "",
            "emissiveTexture": "",
            "occlusionTexture": ""
          }
        }
      },
      "children": [
        {
          "name": "Tree 1",
          "components": {
            "PersistentId": {
              "id": "a47474ec-9c71-4323-85a5-e654def0200e"
            },
            "Transform": {
              "position": [
                2,
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
            "MeshRenderer": {
              "meshId": "tree",
              "materialId": "default",
              "enabled": true,
              "castShadows": true,
              "receiveShadows": true,
              "modelPath": "",
              "material": {
                "shader": "standard",
                "materialType": "solid",
                "color": "#2d5016",
                "metalness": 0,
                "roughness": 0.699999988079071,
                "emissive": "#000000",
                "emissiveIntensity": 0,
                "normalScale": 1,
                "occlusionStrength": 1,
                "textureOffsetX": 0,
                "textureOffsetY": 0,
                "textureRepeatX": 1,
                "textureRepeatY": 1,
                "albedoTexture": "",
                "normalTexture": "",
                "metallicTexture": "",
                "roughnessTexture": "",
                "emissiveTexture": "",
                "occlusionTexture": ""
              }
            }
          }
        }
      ]
    },
    "metadata": {
      "createdAt": "2025-10-01T23:20:39.743Z",
      "createdFrom": 8
    },
    "dependencies": [
      "default"
    ],
    "tags": []
  }
]
});
