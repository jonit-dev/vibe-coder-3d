import { defineScene } from './defineScene';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

/**
 * CompressedExample
 * Scene with 6 entities
 * Generated: 2025-10-11T00:18:33.147Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
  "name": "CompressedExample",
  "version": 1,
  "timestamp": "2025-10-11T00:18:33.147Z",
  "description": "Scene with 6 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "d2a76be6-be16-4701-b748-923b4d436cbb"
      },
      "Transform": {
        "position": [
          0,
          2,
          -10
        ]
      },
      "Camera": {
        "fov": 60,
        "isMain": true
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "fe104dbf-9f41-4b79-bdd9-b69b8281dca4"
      },
      "Transform": {
        "position": [
          5,
          10,
          5
        ],
        "rotation": [
          45,
          30,
          0
        ]
      },
      "Light": {
        "lightType": "directional"
      }
    }
  },
  {
    "id": 2,
    "name": "Tree 1",
    "components": {
      "PersistentId": {
        "id": "a061cd68-81a7-4939-bd43-7363d709086c"
      },
      "Transform": {
        "position": [
          -2,
          0,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "mat_38910607"
      }
    }
  },
  {
    "id": 3,
    "name": "Tree 2",
    "components": {
      "PersistentId": {
        "id": "88e43804-16f6-4d99-9451-857c0468e32a"
      },
      "Transform": {
        "position": [
          2,
          0,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "mat_38910607"
      }
    }
  },
  {
    "id": 4,
    "name": "Tree 3",
    "components": {
      "PersistentId": {
        "id": "1cdade7f-a0e6-45fc-afab-406a4cf0f75a"
      },
      "Transform": {
        "position": [
          0,
          0,
          3
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "mat_38910607"
      }
    }
  },
  {
    "id": 5,
    "name": "Ground",
    "components": {
      "PersistentId": {
        "id": "e418415f-0948-4c31-8539-605933a021d0"
      },
      "Transform": {
        "position": [
          0,
          -0.5,
          0
        ],
        "scale": [
          10,
          0.1,
          10
        ]
      },
      "MeshRenderer": {
        "meshId": "cube",
        "materialId": "mat_2ae2d936"
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
    "id": "mat_38910607",
    "name": "Material mat_38910607",
    "shader": "standard",
    "materialType": "solid",
    "color": "#2d5016",
    "metalness": 0,
    "roughness": 0.9,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "albedoTexture": "",
    "normalTexture": "",
    "metallicTexture": "",
    "roughnessTexture": "",
    "emissiveTexture": "",
    "occlusionTexture": "",
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
  },
  {
    "id": "mat_2ae2d936",
    "name": "Material mat_2ae2d936",
    "shader": "standard",
    "materialType": "solid",
    "color": "#3a7d2e",
    "metalness": 0,
    "roughness": 0.8,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "albedoTexture": "",
    "normalTexture": "",
    "metallicTexture": "",
    "roughnessTexture": "",
    "emissiveTexture": "",
    "occlusionTexture": "",
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
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
