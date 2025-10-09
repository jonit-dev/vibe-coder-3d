import { defineScene } from './defineScene';

/**
 * ww2
 * Scene with 4 entities
 * Generated: 2025-10-09T02:10:29.862Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
  "name": "ww2",
  "version": 1,
  "timestamp": "2025-10-09T02:10:29.862Z",
  "description": "Scene with 4 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "7b7b446f-e7a7-42ec-9b93-90e131e17881"
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
        "id": "66879ab0-b4b4-4316-9dd1-386d5df57a33"
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
        "id": "f6b1e0d1-ac7e-4de6-9b52-446bc78c0a14"
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
    "name": "Cube 0",
    "components": {
      "PersistentId": {
        "id": "e75f3cf1-64db-4e7e-b2bf-8ce5a04afda5"
      },
      "Transform": {
        "position": [
          0,
          1.5,
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
        "modelPath": ""
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
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1,
    "albedoTexture": "/assets/textures/crate-texture.png"
  }
],
  prefabs: [],
  inputAssets: [
  {
    "name": "Default Input",
    "controlSchemes": [
      {
        "name": "Keyboard & Mouse",
        "deviceRequirements": [
          {
            "deviceType": "keyboard",
            "optional": false
          },
          {
            "deviceType": "mouse",
            "optional": true
          }
        ]
      },
      {
        "name": "Gamepad",
        "deviceRequirements": [
          {
            "deviceType": "gamepad",
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
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
            "bindings": [
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "w"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "s"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "a"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "d"
                  }
                }
              },
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "arrowup"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "arrowright"
                  }
                }
              }
            ]
          },
          {
            "name": "Jump",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
                "path": "space"
              }
            ]
          },
          {
            "name": "Fire",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "mouse",
                "path": "leftButton"
              },
              {
                "type": "keyboard",
                "path": "f"
              }
            ]
          },
          {
            "name": "Look",
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
            "bindings": [
              {
                "type": "mouse",
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
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
            "bindings": [
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "arrowup"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "arrowright"
                  }
                }
              }
            ]
          },
          {
            "name": "Submit",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
                "path": "enter"
              },
              {
                "type": "keyboard",
                "path": "space"
              }
            ]
          },
          {
            "name": "Cancel",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
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
