import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "white_rook",
  "name": "white_rook",
  "root": {
    "name": "white_rook",
    "components": {
      "PersistentId": {
        "id": "a223cf1a-ba8d-44f2-a0ec-04ed4c3754eb"
      }
    },
    "children": [
      {
        "name": "rook_base",
        "components": {
          "PersistentId": {
            "id": "0cd6d956-a0e9-4df6-aa7a-12e9c8ca9112"
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_body",
        "components": {
          "PersistentId": {
            "id": "021f68d3-82eb-4428-92e3-bc930673478c"
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
              0.5,
              0.8,
              0.5
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_top",
        "components": {
          "PersistentId": {
            "id": "075fa9fb-d938-4211-ae07-c48a53709e21"
          },
          "Transform": {
            "position": [
              0,
              1.2,
              0
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.6,
              0.2,
              0.6
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_battlement1",
        "components": {
          "PersistentId": {
            "id": "0c273b51-9d70-4a3a-8bae-f61d50a0b0bc"
          },
          "Transform": {
            "position": [
              -0.2,
              1.4,
              -0.2
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.1,
              0.2,
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_battlement2",
        "components": {
          "PersistentId": {
            "id": "f485132a-942d-4557-8f33-b989b6d7ff54"
          },
          "Transform": {
            "position": [
              0.2,
              1.4,
              -0.2
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.1,
              0.2,
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_battlement3",
        "components": {
          "PersistentId": {
            "id": "7df70569-59f3-4a64-9c2d-7aab8c032adf"
          },
          "Transform": {
            "position": [
              -0.2,
              1.4,
              0.2
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.1,
              0.2,
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      },
      {
        "name": "rook_battlement4",
        "components": {
          "PersistentId": {
            "id": "a8d012b8-3781-4b32-9a01-bb84dbcf86ed"
          },
          "Transform": {
            "position": [
              0.2,
              1.4,
              0.2
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              0.1,
              0.2,
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
              "color": "#f0f0f0",
              "metalness": 0.1,
              "roughness": 0.8,
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
        }
      }
    ]
  },
  "metadata": {
    "createdAt": "2025-11-16T09:42:03.639Z",
    "createdFrom": 120
  },
  "dependencies": [
    "default"
  ]
});
