import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_king",
  "name": "white_king",
  "root": {
    "name": "white_king",
    "components": {
      "PersistentId": {
        "id": "2eb7326b-2c6f-4f01-bf84-ec521bafe7c6"
      }
    },
    "children": [
      {
        "name": "king_base",
        "components": {
          "PersistentId": {
            "id": "18315f72-6720-4c9a-a351-17d21a61739f"
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
        "name": "king_body",
        "components": {
          "PersistentId": {
            "id": "05bc8d72-8475-4f85-8452-e34272063e43"
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
        "name": "king_head",
        "components": {
          "PersistentId": {
            "id": "4b709b0e-0a45-404d-a781-8e2616f0e2c7"
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
        "name": "king_cross_vertical",
        "components": {
          "PersistentId": {
            "id": "d1688308-3085-4a6c-a743-ef0eafb3a6f4"
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
        "name": "king_cross_horizontal",
        "components": {
          "PersistentId": {
            "id": "cfdb6543-3751-44a9-acf4-e52aa3d3b2d1"
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
    "createdAt": "2025-11-16T09:15:20.085Z",
    "createdFrom": 90
  },
  "dependencies": [
    "mat_08941399"
  ]
});
