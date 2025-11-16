import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_queen",
  "name": "black_queen",
  "root": {
    "name": "black_queen",
    "components": {
      "PersistentId": {
        "id": "89c08a69-1852-49e1-8509-3db818633a8c"
      }
    },
    "children": [
      {
        "name": "queen_base",
        "components": {
          "PersistentId": {
            "id": "d03e265f-8009-4257-a22f-493a17e4e1b1"
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
        "name": "queen_body",
        "components": {
          "PersistentId": {
            "id": "3e14e21b-2838-451f-bc94-4fe091a6d538"
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
        "name": "queen_head",
        "components": {
          "PersistentId": {
            "id": "fea7bac5-d986-4e67-acf2-0d910aae6f2b"
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
        "name": "queen_crown",
        "components": {
          "PersistentId": {
            "id": "c6a1d84a-9583-4ed9-860b-3425f0ca69a8"
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
    "createdAt": "2025-11-16T09:15:50.823Z",
    "createdFrom": 110
  },
  "dependencies": [
    "default"
  ]
});
