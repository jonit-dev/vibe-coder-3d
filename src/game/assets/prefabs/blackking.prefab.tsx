import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "black_king",
  "name": "black_king",
  "root": {
    "name": "black_king",
    "components": {
      "PersistentId": {
        "id": "498d190c-6ff3-4a5f-8e15-100bd5c5673b"
      }
    },
    "children": [
      {
        "name": "king_base",
        "components": {
          "PersistentId": {
            "id": "3fe983c7-2674-4b70-85a0-cc8fc6ec6986"
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
        "name": "king_body",
        "components": {
          "PersistentId": {
            "id": "3986c386-3c30-4431-b151-8ed71a67812a"
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
              0.9,
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
        "name": "king_head",
        "components": {
          "PersistentId": {
            "id": "c0286db0-b7bd-4f1e-ae62-c7d4f1e275be"
          },
          "Transform": {
            "position": [
              0,
              1.4,
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
        "name": "king_cross_vertical",
        "components": {
          "PersistentId": {
            "id": "15d16c31-9a0b-4d4e-acbf-882098fbb54b"
          },
          "Transform": {
            "position": [
              0,
              1.8,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.1,
              0.4,
              0.1
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
      },
      {
        "name": "king_cross_horizontal",
        "components": {
          "PersistentId": {
            "id": "cd11348f-fbfe-4027-9cc2-714d8435b0a5"
          },
          "Transform": {
            "position": [
              0,
              1.9,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.3,
              0.1,
              0.1
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
    "createdAt": "2025-11-16T09:15:58.141Z",
    "createdFrom": 115
  },
  "dependencies": [
    "default"
  ]
});
