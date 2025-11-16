import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_rook",
  "name": "white_rook",
  "root": {
    "name": "white_rook",
    "components": {
      "PersistentId": {
        "id": "07c428d2-ff92-4859-a7bc-b75299c23fb3"
      }
    },
    "children": [
      {
        "name": "rook_base",
        "components": {
          "PersistentId": {
            "id": "f2022cd3-33c0-4919-82a4-8f481b4a8d6c"
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
              0.4,
              1
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
        "name": "rook_body",
        "components": {
          "PersistentId": {
            "id": "f669169e-b204-4fbb-afd0-09fce5cf103b"
          },
          "Transform": {
            "position": [
              0,
              0.6,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.8,
              0.6,
              0.8
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
        "name": "rook_top",
        "components": {
          "PersistentId": {
            "id": "31f3b242-ef5a-4a4a-9314-842e548c680b"
          },
          "Transform": {
            "position": [
              0,
              1.1,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1.2,
              0.3,
              1.2
            ]
          },
          "MeshRenderer": {
            "meshId": "cube",
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
    "createdAt": "2025-11-16T09:14:54.967Z",
    "createdFrom": 74
  },
  "dependencies": [
    "default"
  ]
});
