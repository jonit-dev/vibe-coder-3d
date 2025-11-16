import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "chess_board",
  "name": "chess_board",
  "root": {
    "name": "chess_board",
    "components": {
      "PersistentId": {
        "id": "8cf70832-b1ee-49ec-b57c-fecb8944a1d9"
      }
    },
    "children": [
      {
        "name": "square_a1",
        "components": {
          "PersistentId": {
            "id": "acc57204-427d-41e2-aafb-fd4edafafbe9"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_b1",
        "components": {
          "PersistentId": {
            "id": "fb8c75dc-5501-4a58-9268-62925a71a655"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_c1",
        "components": {
          "PersistentId": {
            "id": "b65e1157-ae1d-44f2-a7e4-b865619ad70c"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_d1",
        "components": {
          "PersistentId": {
            "id": "d1a9027f-b0cf-42e9-8b2a-db9467139faf"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_e1",
        "components": {
          "PersistentId": {
            "id": "56957cf7-3072-48e9-9ad9-b116335f7445"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_f1",
        "components": {
          "PersistentId": {
            "id": "ffa06e13-18c3-4c66-973b-02b54784987c"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_g1",
        "components": {
          "PersistentId": {
            "id": "ea83cf0d-a4f0-4f95-a9f7-a6e9e133701d"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_h1",
        "components": {
          "PersistentId": {
            "id": "5f1468ab-7093-45f4-8084-b048299ce17b"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              -3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_a2",
        "components": {
          "PersistentId": {
            "id": "02373b0c-ffff-4c38-80d0-290de40d76ff"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_b2",
        "components": {
          "PersistentId": {
            "id": "ceda1f42-7c9e-4bc8-93b2-ab4e6fabeec9"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_c2",
        "components": {
          "PersistentId": {
            "id": "f90c58b6-d071-4190-877d-2672e6899a8d"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_d2",
        "components": {
          "PersistentId": {
            "id": "caf5a8e8-0cb2-4407-87ab-b9096c6f2160"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_e2",
        "components": {
          "PersistentId": {
            "id": "6e015baa-cc96-4ffe-82fc-4c585b040524"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_f2",
        "components": {
          "PersistentId": {
            "id": "96f3e726-83b2-4604-803e-b8d67e6d07f3"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_g2",
        "components": {
          "PersistentId": {
            "id": "39cb68c9-5efb-4d03-a087-463f729761e0"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_h2",
        "components": {
          "PersistentId": {
            "id": "903f0361-ee0b-4ddc-a9dd-4c8fe153b0d2"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              -2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_a3",
        "components": {
          "PersistentId": {
            "id": "3fcffe38-e553-47f2-87a1-5549da61cdb6"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_b3",
        "components": {
          "PersistentId": {
            "id": "548bca50-bff9-4853-9bf5-763006401210"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_c3",
        "components": {
          "PersistentId": {
            "id": "8b810559-9d7c-44b9-a1ae-fcea56be6cc6"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_d3",
        "components": {
          "PersistentId": {
            "id": "8e71b2ba-0d9c-4137-bdc5-c1499b87e449"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_e3",
        "components": {
          "PersistentId": {
            "id": "d70cb735-09be-46b4-9f59-003139fc94df"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_f3",
        "components": {
          "PersistentId": {
            "id": "f921e5ac-9796-40a1-845a-09fb9c8c5807"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_g3",
        "components": {
          "PersistentId": {
            "id": "eef02d87-5ccb-4997-a730-dc4b410c4962"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_h3",
        "components": {
          "PersistentId": {
            "id": "5e7d7444-6309-4bff-be65-704f8f0d250d"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              -1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_a4",
        "components": {
          "PersistentId": {
            "id": "87a8580f-c7b7-434a-a00c-9c4da70c430c"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_b4",
        "components": {
          "PersistentId": {
            "id": "4ac6321a-e303-435f-9e4c-66f42b77af6e"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_c4",
        "components": {
          "PersistentId": {
            "id": "0ee7f9e5-5431-40b4-8103-e0d5c2f1931a"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_d4",
        "components": {
          "PersistentId": {
            "id": "118c569b-b7de-4fb2-9637-feaa4c617fbb"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_e4",
        "components": {
          "PersistentId": {
            "id": "896c2f10-266e-4c19-9c1b-25b64eb1067a"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_f4",
        "components": {
          "PersistentId": {
            "id": "e1c48f37-644d-4df7-92e9-2c1f3d3ccee1"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_g4",
        "components": {
          "PersistentId": {
            "id": "59b750c9-b296-4227-8bd1-31b9f57c91e1"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_h4",
        "components": {
          "PersistentId": {
            "id": "4e8c2f73-0702-45c3-ab93-c4945675de52"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              -0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_a5",
        "components": {
          "PersistentId": {
            "id": "5f7da73a-dc64-4d40-9822-2962be03ac8d"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_b5",
        "components": {
          "PersistentId": {
            "id": "8ff43095-e60d-4e60-968f-6c2d6d91f4fe"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_c5",
        "components": {
          "PersistentId": {
            "id": "16c4fa25-adc5-4ca1-b327-5b93519bc407"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_d5",
        "components": {
          "PersistentId": {
            "id": "ee9c1fc9-ecfa-4f19-905e-d9fdb593475d"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_e5",
        "components": {
          "PersistentId": {
            "id": "fdb6f949-2f75-4390-9ec9-2ceb27313a28"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_f5",
        "components": {
          "PersistentId": {
            "id": "c80a4c58-6511-4a7f-877e-12a33d8ade25"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_g5",
        "components": {
          "PersistentId": {
            "id": "1be735ce-45a3-4565-8f37-4fd259801399"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_h5",
        "components": {
          "PersistentId": {
            "id": "3de71e73-ef5e-4c2d-8da4-bf9df07d4100"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              0.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_a6",
        "components": {
          "PersistentId": {
            "id": "42055f8c-a69f-4cde-aaf0-bafab2b93ef5"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_b6",
        "components": {
          "PersistentId": {
            "id": "fa8e85f8-51b2-4c94-9c8c-40aafecc76e5"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_c6",
        "components": {
          "PersistentId": {
            "id": "2b4035ea-1d07-45dc-91ec-2351bd15f175"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_d6",
        "components": {
          "PersistentId": {
            "id": "1cc75db0-68e4-4059-9826-4f6a6d1f1a86"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_e6",
        "components": {
          "PersistentId": {
            "id": "1d89deef-f03b-4d91-9659-9c8be65e77e6"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_f6",
        "components": {
          "PersistentId": {
            "id": "47ca91a8-3a5b-4610-92ab-bd009f657033"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_g6",
        "components": {
          "PersistentId": {
            "id": "e46bc6cb-0599-4c6b-8018-0445e1fcb39b"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_h6",
        "components": {
          "PersistentId": {
            "id": "ca9788ff-ac4d-4b1f-9226-80ddc981b5d0"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              1.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_a7",
        "components": {
          "PersistentId": {
            "id": "4da0cd33-e2fc-4122-a0d4-675e28ac54b8"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_b7",
        "components": {
          "PersistentId": {
            "id": "e3e4da20-91e0-4e79-8806-2bd106d9cfff"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_c7",
        "components": {
          "PersistentId": {
            "id": "35410a76-618a-49d3-ad18-008f084e982e"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_d7",
        "components": {
          "PersistentId": {
            "id": "a55b3592-77fa-492c-8d94-ea4822db18de"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_e7",
        "components": {
          "PersistentId": {
            "id": "98fb8dd0-a2d2-43f1-8772-e075677466ec"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_f7",
        "components": {
          "PersistentId": {
            "id": "32447211-682f-4fd4-bb97-1ea4418b51a2"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_g7",
        "components": {
          "PersistentId": {
            "id": "323e8b55-7581-4dc8-a4b6-12585da3a5a6"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_h7",
        "components": {
          "PersistentId": {
            "id": "e3181abe-9e74-4594-8a0a-0d22bae15cba"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              2.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_a8",
        "components": {
          "PersistentId": {
            "id": "79b64ca4-cd82-455c-b04d-d06540808318"
          },
          "Transform": {
            "position": [
              -3.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_b8",
        "components": {
          "PersistentId": {
            "id": "440682c8-bc2b-47d4-b30a-f0badd9bd9c3"
          },
          "Transform": {
            "position": [
              -2.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_c8",
        "components": {
          "PersistentId": {
            "id": "27964e40-8482-4311-9c5d-2b70630ea647"
          },
          "Transform": {
            "position": [
              -1.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_d8",
        "components": {
          "PersistentId": {
            "id": "01b8f526-8cf4-47fe-a79d-0875b43339c3"
          },
          "Transform": {
            "position": [
              -0.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_e8",
        "components": {
          "PersistentId": {
            "id": "324ea333-318d-4be6-b814-9338be46497d"
          },
          "Transform": {
            "position": [
              0.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_f8",
        "components": {
          "PersistentId": {
            "id": "668dc909-a8ce-45b3-9876-999161f086de"
          },
          "Transform": {
            "position": [
              1.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
        "name": "square_g8",
        "components": {
          "PersistentId": {
            "id": "599ba7dd-aea0-4735-b073-3e388f6a1a8b"
          },
          "Transform": {
            "position": [
              2.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#b58863",
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
        "name": "square_h8",
        "components": {
          "PersistentId": {
            "id": "bbed9762-9bae-43ec-aea6-a199b4fa60ba"
          },
          "Transform": {
            "position": [
              3.5,
              0,
              3.5
            ],
            "rotation": [
              0,
              0,
              0
            ],
            "scale": [
              1,
              0.2,
              1
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
              "color": "#f0d9b5",
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
    "createdAt": "2025-11-16T00:37:16.179Z",
    "createdFrom": 3
  },
  "dependencies": [
    "default"
  ]
});
