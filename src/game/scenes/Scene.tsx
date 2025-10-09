import { defineScene } from './defineScene';

/**
 * 22
 * Scene with 4 entities
 * Generated: 2025-10-09T01:51:56.678Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
  "name": "22",
  "version": 1,
  "timestamp": "2025-10-09T01:51:56.678Z",
  "description": "Scene with 4 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "7431dde9-135d-4756-a86b-055cb10cdccf"
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
        "id": "65fc400b-7b56-49a1-b326-f2121c42c77e"
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
        "id": "b56c5749-32e8-4080-b034-85ae530c8218"
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
        "id": "9ca2f741-3fca-4b9c-9f1e-1c88a378f18d"
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
