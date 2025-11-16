import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_knight",
  "name": "black_knight",
  "root": {
    "name": "black_knight",
    "components": {
      "PersistentId": {
        "id": "01a292c6-d565-42a8-b498-854842b04ebe"
      }
    },
    "children": [
      {
        "name": "knight_base",
        "components": {
          "PersistentId": {
            "id": "44a90c0d-4917-499f-a0ec-06d9d8975ea7"
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
            "materialId": "default",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#2c2c2c",
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
            "id": "4c296bb5-224e-49bd-83b9-f9a650352a7f"
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
            "materialId": "default",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": "",
            "material": {
              "shader": "standard",
              "materialType": "solid",
              "color": "#2c2c2c",
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
    "createdAt": "2025-11-16T09:15:44.714Z",
    "createdFrom": 107
  },
  "dependencies": [
    "default"
  ]
});
