import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_pawn",
  "name": "black_pawn",
  "root": {
    "name": "black_pawn",
    "components": {
      "PersistentId": {
        "id": "f19197fb-3154-46ec-b98a-1b2b7a7e1a77"
      }
    },
    "children": [
      {
        "name": "pawn_base",
        "components": {
          "PersistentId": {
            "id": "147427f1-d44b-4b09-ad05-2d9718f14cfd"
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
              0.8,
              0.3,
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
        "name": "pawn_head",
        "components": {
          "PersistentId": {
            "id": "40359a81-bb5a-41eb-a7ad-824a98da205d"
          },
          "Transform": {
            "position": [
              0,
              0.5,
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
      }
    ]
  },
  "metadata": {
    "createdAt": "2025-11-16T09:15:26.452Z",
    "createdFrom": 96
  },
  "dependencies": [
    "default"
  ]
});
