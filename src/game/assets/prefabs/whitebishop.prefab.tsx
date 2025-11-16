import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_bishop",
  "name": "white_bishop",
  "root": {
    "name": "white_bishop",
    "components": {
      "PersistentId": {
        "id": "829834ee-27af-43b5-aa6e-c8f33d6419b6"
      }
    },
    "children": [
      {
        "name": "bishop_base",
        "components": {
          "PersistentId": {
            "id": "c8cf5631-2ae0-4bfe-a651-68713615dd98"
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
              0.9,
              0.4,
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
        "name": "bishop_body",
        "components": {
          "PersistentId": {
            "id": "1d43fbf1-7317-408f-8849-60eef75cf505"
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
              0.7,
              0.8,
              0.7
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
      },
      {
        "name": "bishop_top",
        "components": {
          "PersistentId": {
            "id": "5bca3b0f-e5b2-40b0-b9d0-2f438277e10a"
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
              0.3,
              0.3,
              0.3
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
      }
    ]
  },
  "metadata": {
    "createdAt": "2025-11-16T09:15:00.009Z",
    "createdFrom": 78
  },
  "dependencies": [
    "mat_08941399"
  ]
});
