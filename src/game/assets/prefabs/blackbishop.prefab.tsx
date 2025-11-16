import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_bishop",
  "name": "black_bishop",
  "root": {
    "name": "black_bishop",
    "components": {
      "PersistentId": {
        "id": "a26c4729-38f8-449f-94cc-49c82677d633"
      }
    },
    "children": [
      {
        "name": "bishop_base",
        "components": {
          "PersistentId": {
            "id": "1b260a59-3061-43c2-9f82-efc877b2f63c"
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
        "name": "bishop_body",
        "components": {
          "PersistentId": {
            "id": "f2cfbbe1-1115-4f2c-a32a-b26f6bf029ed"
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
        "name": "bishop_top",
        "components": {
          "PersistentId": {
            "id": "2b92eab2-afda-4427-bc7b-f70a2657c992"
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
    "createdAt": "2025-11-16T09:15:38.856Z",
    "createdFrom": 103
  },
  "dependencies": [
    "default"
  ]
});
