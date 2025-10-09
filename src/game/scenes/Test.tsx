import { defineScene } from './defineScene';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

/**
 * Test
 * Scene with 8 entities
 * Generated: 2025-10-09T21:27:14.396Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
  "name": "Test",
  "version": 1,
  "timestamp": "2025-10-09T21:27:14.396Z",
  "description": "Scene with 8 entities"
},
  entities: [
  {
    "id": 0,
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
    "id": 1,
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
    "id": 2,
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
    "id": 3,
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
    "id": 4,
    "name": "Tree 1",
    "parentId": 3,
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
  },
  {
    "id": 5,
    "name": "Rock 0",
    "components": {
      "PersistentId": {
        "id": "da6429ce-e73e-439e-9c2d-59866a63338f"
      },
      "Transform": {
        "position": [
          2,
          0,
          2
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          0.6000000238418579,
          1
        ]
      },
      "MeshRenderer": {
        "meshId": "rock",
        "materialId": "default",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "material": {
          "shader": "standard",
          "materialType": "solid",
          "color": "#6b6b6b",
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
  },
  {
    "id": 6,
    "name": "Bush 0",
    "components": {
      "PersistentId": {
        "id": "7500eef8-bd2e-43ed-8680-d8c27d6cc2ce"
      },
      "Transform": {
        "position": [
          -1.75,
          0,
          1.5
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
        "meshId": "bush",
        "materialId": "default",
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "material": {
          "shader": "standard",
          "materialType": "solid",
          "color": "#4a7c59",
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
  },
  {
    "id": 7,
    "name": "Cube 0",
    "components": {
      "PersistentId": {
        "id": "1b275b3a-86c7-4a67-aaa6-f287d6024b10"
      },
      "Transform": {
        "position": [
          0,
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
          "color": "#00ff00",
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
      "Script": {
        "code": "",
        "enabled": true,
        "scriptName": "Script",
        "description": "",
        "scriptRef": {
          "scriptId": "entity-7.script",
          "source": "external",
          "path": "src/game/scripts/entity-7.script.ts",
          "codeHash": "8709d449308bfb7533e89087dc1eb5239ee43c84db25c316182f99f4c2bc8bfb",
          "lastModified": 1759976002039
        },
        "executeInUpdate": true,
        "executeOnStart": false,
        "executeOnEnable": false,
        "maxExecutionTime": 16,
        "hasErrors": false,
        "lastErrorMessage": "",
        "lastExecutionTime": 0,
        "executionCount": 65,
        "parameters": {},
        "lastModified": 1759976002040,
        "compiledCode": ""
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
          },
          "children": []
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
],
  inputAssets: [
  {
    "name": "Default Input",
    "controlSchemes": [
      {
        "name": "Keyboard & Mouse",
        "deviceRequirements": [
          {
            "deviceType": DeviceType.Keyboard,
            "optional": false
          },
          {
            "deviceType": DeviceType.Mouse,
            "optional": true
          }
        ]
      },
      {
        "name": "Gamepad",
        "deviceRequirements": [
          {
            "deviceType": DeviceType.Gamepad,
            "optional": false
          }
        ]
      }
    ],
    "actionMaps": [
      {
        "name": "Gameplay",
        "enabled": true,
        "actions": [
          {
            "name": "Move",
            "actionType": ActionType.PassThrough,
            "controlType": ControlType.Vector2,
            "enabled": true,
            "bindings": [
              {
                "compositeType": CompositeType.TwoDVector,
                "bindings": {
                  "up": {
                    "type": DeviceType.Keyboard,
                    "path": "w"
                  },
                  "down": {
                    "type": DeviceType.Keyboard,
                    "path": "s"
                  },
                  "left": {
                    "type": DeviceType.Keyboard,
                    "path": "a"
                  },
                  "right": {
                    "type": DeviceType.Keyboard,
                    "path": "d"
                  }
                }
              },
              {
                "compositeType": CompositeType.TwoDVector,
                "bindings": {
                  "up": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowup"
                  },
                  "down": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowright"
                  }
                }
              }
            ]
          },
          {
            "name": "Jump",
            "actionType": ActionType.Button,
            "controlType": ControlType.Button,
            "enabled": true,
            "bindings": [
              {
                "type": DeviceType.Keyboard,
                "path": "space"
              }
            ]
          },
          {
            "name": "Fire",
            "actionType": ActionType.Button,
            "controlType": ControlType.Button,
            "enabled": true,
            "bindings": [
              {
                "type": DeviceType.Mouse,
                "path": "leftButton"
              },
              {
                "type": DeviceType.Keyboard,
                "path": "f"
              }
            ]
          },
          {
            "name": "Look",
            "actionType": ActionType.PassThrough,
            "controlType": ControlType.Vector2,
            "enabled": true,
            "bindings": [
              {
                "type": DeviceType.Mouse,
                "path": "delta"
              }
            ]
          }
        ]
      },
      {
        "name": "UI",
        "enabled": true,
        "actions": [
          {
            "name": "Navigate",
            "actionType": ActionType.PassThrough,
            "controlType": ControlType.Vector2,
            "enabled": true,
            "bindings": [
              {
                "compositeType": CompositeType.TwoDVector,
                "bindings": {
                  "up": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowup"
                  },
                  "down": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": DeviceType.Keyboard,
                    "path": "arrowright"
                  }
                }
              }
            ]
          },
          {
            "name": "Submit",
            "actionType": ActionType.Button,
            "controlType": ControlType.Button,
            "enabled": true,
            "bindings": [
              {
                "type": DeviceType.Keyboard,
                "path": "enter"
              },
              {
                "type": DeviceType.Keyboard,
                "path": "space"
              }
            ]
          },
          {
            "name": "Cancel",
            "actionType": ActionType.Button,
            "controlType": ControlType.Button,
            "enabled": true,
            "bindings": [
              {
                "type": DeviceType.Keyboard,
                "path": "escape"
              }
            ]
          }
        ]
      }
    ]
  }
]
});
