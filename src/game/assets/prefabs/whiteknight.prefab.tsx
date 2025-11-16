import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_knight",
  "name": "white_knight",
  "root": {
    "name": "white_knight",
    "components": {
      "PersistentId": {
        "id": "48e57d4e-e524-43c2-829c-2b54ace33cc7"
      }
    },
    "children": [
      {
        "name": "knight_base",
        "components": {
          "PersistentId": {
            "id": "36788942-02af-4c88-afa2-9d3238e76108"
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
        "name": "knight_head",
        "components": {
          "PersistentId": {
            "id": "5742a026-583e-4274-854e-c17790a3b196"
          },
          "Transform": {
            "position": [
              0,
              0.8,
              0.3
            ],
            "rotation": [
              30,
              0,
              0
            ],
            "scale": [
              0.7,
              0.7,
              0.9
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
    "createdAt": "2025-11-16T09:15:05.952Z",
    "createdFrom": 82
  },
  "dependencies": [
    "mat_08941399"
  ]
});
