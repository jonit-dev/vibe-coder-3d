import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_queen",
  "name": "white_queen",
  "root": {
    "name": "white_queen",
    "components": {
      "PersistentId": {
        "id": "7de0ef25-c615-43d3-aae2-2f87f6d8368c"
      }
    },
    "children": [
      {
        "name": "queen_base",
        "components": {
          "PersistentId": {
            "id": "a124cf6c-2121-43cb-8eb6-3a4f8b0dc01b"
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
              1.1,
              0.4,
              1.1
            ]
          },
          "MeshRenderer": {
            "meshId": "cylinder",
            "materialId": "mat_08941399",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#f5f5dc",
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
      },
      {
        "name": "queen_body",
        "components": {
          "PersistentId": {
            "id": "597b1657-0c71-4352-b2f1-560eee842a5d"
          },
          "Transform": {
            "position": [
              0,
              0.7,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.9,
              0.8,
              0.9
            ]
          },
          "MeshRenderer": {
            "meshId": "cylinder",
            "materialId": "mat_08941399",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#f5f5dc",
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
      },
      {
        "name": "queen_head",
        "components": {
          "PersistentId": {
            "id": "b0807b3f-6319-4780-8df9-fc558ae44a92"
          },
          "Transform": {
            "position": [
              0,
              1.3,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.6,
              0.6,
              0.6
            ]
          },
          "MeshRenderer": {
            "meshId": "sphere",
            "materialId": "mat_08941399",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#f5f5dc",
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
      },
      {
        "name": "queen_crown",
        "components": {
          "PersistentId": {
            "id": "dc881880-104d-42b2-91f8-1c08ce2914bc"
          },
          "Transform": {
            "position": [
              0,
              1.6,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.4,
              0.4,
              0.4
            ]
          },
          "MeshRenderer": {
            "meshId": "cone",
            "materialId": "mat_08941399",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#f5f5dc",
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
    "createdAt": "2025-11-16T09:15:12.910Z",
    "createdFrom": 85
  },
  "dependencies": [
    "mat_08941399"
  ]
});
