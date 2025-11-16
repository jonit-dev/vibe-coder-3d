import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_rook",
  "name": "black_rook",
  "root": {
    "name": "black_rook",
    "components": {
      "PersistentId": {
        "id": "c9e9a35d-6569-4c91-9434-95fed1e76abe"
      }
    },
    "children": [
      {
        "name": "rook_base",
        "components": {
          "PersistentId": {
            "id": "d0baf9fe-caa5-4815-ac3f-052c4665ac25"
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
        "name": "rook_body",
        "components": {
          "PersistentId": {
            "id": "e0b8e266-c473-4efc-a1f1-a84df3dc750a"
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
        "name": "rook_top",
        "components": {
          "PersistentId": {
            "id": "d1341023-ea38-441c-b394-11abfa944bfb"
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
    "createdAt": "2025-11-16T09:15:32.937Z",
    "createdFrom": 99
  },
  "dependencies": [
    "default"
  ]
});
