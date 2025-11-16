import { defineScene } from './defineScene';

/**
 * playground
 * Scene with 112 entities
 * Generated: 2025-11-16T09:30:29.584Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "playground",
  "version": 1,
  "timestamp": "2025-11-16T09:30:29.584Z",
  "description": "Scene with 112 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "1e1b7a08-0b57-436f-8c93-175b3da97531"
      },
      "Transform": {
        "position": [
          0,
          1,
          -10
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      },
      "Camera": {
        "fov": 20,
        "near": 0.1,
        "far": 100,
        "projectionType": "perspective",
        "orthographicSize": 10,
        "depth": 0,
        "isMain": true,
        "clearFlags": "skybox",
        "skyboxTexture": "",
        "backgroundColor": {
          "r": 0,
          "g": 0,
          "b": 0,
          "a": 0
        },
        "controlMode": "free",
        "viewportRect": {
          "x": 0,
          "y": 0,
          "width": 1,
          "height": 1
        },
        "hdr": false,
        "toneMapping": "none",
        "toneMappingExposure": 1,
        "enablePostProcessing": false,
        "postProcessingPreset": "none",
        "enableSmoothing": false,
        "followTarget": 0,
        "followOffset": {
          "x": 0,
          "y": 5,
          "z": -10
        },
        "smoothingSpeed": 2,
        "rotationSmoothing": 1.5,
        "skyboxScale": {
          "x": 1,
          "y": 1,
          "z": 1
        },
        "skyboxRotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "skyboxRepeat": {
          "u": 1,
          "v": 1
        },
        "skyboxOffset": {
          "u": 0,
          "v": 0
        },
        "skyboxIntensity": 1,
        "skyboxBlur": 0
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "d9d2175e-17ff-4fb9-bbe1-2619001687c0"
      },
      "Transform": {
        "position": [
          5,
          10,
          5
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      },
      "Light": {
        "color": {
          "r": 1,
          "g": 1,
          "b": 1
        },
        "intensity": 0.8,
        "enabled": true,
        "castShadow": true,
        "directionX": 0,
        "directionY": -1,
        "directionZ": 0,
        "range": 10,
        "decay": 1,
        "angle": 0.5235987755982988,
        "penumbra": 0.1,
        "shadowMapSize": 1024,
        "shadowBias": -0.0001,
        "shadowRadius": 1,
        "lightType": "directional"
      }
    }
  },
  {
    "id": 2,
    "name": "Ambient Light",
    "components": {
      "PersistentId": {
        "id": "d4147469-2789-40ac-b195-3ecbd60ff7cd"
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
          1,
          1
        ]
      },
      "Light": {
        "color": {
          "r": 0.4,
          "g": 0.4,
          "b": 0.4
        },
        "intensity": 0.5,
        "enabled": true,
        "castShadow": false,
        "directionX": 0,
        "directionY": -1,
        "directionZ": 0,
        "range": 10,
        "decay": 1,
        "angle": 0.5235987755982988,
        "penumbra": 0.1,
        "shadowMapSize": 4096,
        "shadowBias": -0.0005,
        "shadowRadius": 0.2,
        "lightType": "ambient"
      }
    }
  },
  {
    "id": 3,
    "name": "chess_board",
    "components": {
      "PersistentId": {
        "id": "c73b4047-bed9-485f-9492-c391cdb083e7"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "chess_board",
        "instanceUuid": "15dde2ae-bef3-4bd3-aa2c-0d2794ef410d"
      }
    }
  },
  {
    "id": 4,
    "name": "square_a1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "da48de04-d735-4964-b669-2fe22da37692"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 5,
    "name": "square_b1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "2e447f83-b202-4924-904a-a2a270e8a316"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 6,
    "name": "square_c1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "17a13570-86cc-4a74-a1c6-9bd114165239"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 7,
    "name": "square_d1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "0cf021cd-ce96-4e49-a4ee-5fc193b617b8"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 8,
    "name": "square_e1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "c96d3678-ebdb-4274-a5c8-4c6d2143ec7d"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 9,
    "name": "square_f1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "18b9f253-0cf5-4e16-b0e8-4154f3488520"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 10,
    "name": "square_g1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "bec42c51-ee81-4448-96f6-b6624152eb27"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 11,
    "name": "square_h1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "645d1d55-ecca-47cf-a1a0-61f8f7d87a19"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 12,
    "name": "square_a2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "84e60f21-2657-42e7-95dd-5d0e93d85ba5"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 13,
    "name": "square_b2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "97b9a8fd-1d16-4dc2-886e-bf6d7ad178eb"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 14,
    "name": "square_c2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "aacc9b17-ff37-41f2-9b40-47dcc555388f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 15,
    "name": "square_d2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "7a2c993d-6674-4d5d-8867-0f03822641a8"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 16,
    "name": "square_e2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "a73296eb-cf1f-402b-af95-b4a619d9826e"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 17,
    "name": "square_f2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "1b690b20-121b-403b-a09d-58e1f8469835"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 18,
    "name": "square_g2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "7f6e0672-c8c9-4ce5-9a30-750a1aa5da97"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 19,
    "name": "square_h2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "80adc2c7-949c-45ea-9547-e2adc900ab80"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 20,
    "name": "square_a3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "ee67476e-6a1b-498c-8e80-f8838a363480"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 21,
    "name": "square_b3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "b8e93a35-b631-4815-a5dc-cdfbbfee0594"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 22,
    "name": "square_c3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "42b84b5b-4a4c-4eaf-926e-e0e54a67f927"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 23,
    "name": "square_d3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "ea8664eb-c5e2-4071-a2a1-6b2740bdf2e2"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 24,
    "name": "square_e3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "f7e73d98-f5c6-4c8b-aa63-7255130d75b9"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 25,
    "name": "square_f3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "47c929d1-e961-41b9-a7cd-c0238e812c92"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 26,
    "name": "square_g3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "b51bab6f-79a3-45a7-bfa0-16e3e0b3103f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 27,
    "name": "square_h3",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "d3a6ac7a-1a41-4a50-84c5-98ac5025ff5a"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 28,
    "name": "square_a4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "82f5454f-88eb-4365-b1f2-02e83e10cd1c"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 29,
    "name": "square_b4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "0c6a99f1-fa7b-4ace-9137-bc252c118ed8"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 30,
    "name": "square_c4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "84f1beff-85af-4733-ac85-45ea0a320158"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 31,
    "name": "square_d4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "ec43c313-79c0-4a4e-8d80-12d32c21a4a4"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 32,
    "name": "square_e4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "5c9c20fd-0b59-4d03-9329-8710c6e51075"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 33,
    "name": "square_f4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "f0b8f1fa-37bf-41d6-bd0e-2df5c47f61a4"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 34,
    "name": "square_g4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "83738617-ed28-4328-965d-4001823e5c6f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 35,
    "name": "square_h4",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "c50e1c4f-5aae-4a1b-b82e-04488b59bbc7"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 36,
    "name": "square_a5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "a52eecd3-6842-4c48-a745-8bd63fb4ee2b"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 37,
    "name": "square_b5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "a8bac749-9ac9-4873-9a01-8d7bcf9e25a1"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 38,
    "name": "square_c5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "8f135d6e-4f52-4704-9371-63bb87450cc0"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 39,
    "name": "square_d5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "0d49faf8-372a-49e2-8511-8b0ec52f9995"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 40,
    "name": "square_e5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "3cc1af0a-9a33-4ff4-85d2-62525bced2c2"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 41,
    "name": "square_f5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "13d229c9-aaa4-4112-9901-cb11dbc8529c"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 42,
    "name": "square_g5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "6ea6bfeb-ae53-425e-81c4-5607d217773d"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 43,
    "name": "square_h5",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "d2ac4b4f-da2a-4b3c-a091-77264ff969d3"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 44,
    "name": "square_a6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "81d60635-2d05-4533-9aa3-2e408408748b"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 45,
    "name": "square_b6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "14972c22-6ed4-485c-be09-b0579706b288"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 46,
    "name": "square_c6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "3e5a799e-c264-4441-b14f-792c529f253b"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 47,
    "name": "square_d6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "704762e8-b84a-43eb-982f-21ce4dd27cb1"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 48,
    "name": "square_e6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "ee99a7f3-33ee-4e3e-8ffa-c19ea3050f27"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 49,
    "name": "square_f6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "3c8b4858-1e93-472f-9b46-a0c4ac63da43"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 50,
    "name": "square_g6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "b3ba6d3d-abd7-4bc9-b6d5-95be552b35c6"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 51,
    "name": "square_h6",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "c375bb7a-70ea-40f6-9914-e4edb003a4a1"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 52,
    "name": "square_a7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "ce206101-7390-4cf9-af2a-8d6df0436017"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 53,
    "name": "square_b7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "df801350-026e-4201-9d18-f1a50976fa8d"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 54,
    "name": "square_c7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "90aabb55-0078-4b86-a300-5932eb1df822"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 55,
    "name": "square_d7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "d03e5550-a847-4e99-9eaf-5aa868150a25"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 56,
    "name": "square_e7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "9faec4e2-89ab-4e58-a923-4a9c68dbfb5f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 57,
    "name": "square_f7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "bd53c84c-f707-4486-9207-e6104c6b504a"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 58,
    "name": "square_g7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "dba7dadd-b27f-4c0d-b15a-8eafae85323b"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 59,
    "name": "square_h7",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "f0076def-bbee-44b6-ab07-eb527d87b037"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 60,
    "name": "square_a8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "77c0b079-16e3-411d-9524-3b1fa8dab25a"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 61,
    "name": "square_b8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "f28b2ef8-e03a-49a9-8f1c-0cd64a291d5f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 62,
    "name": "square_c8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "a08094d0-76e9-42e6-98e7-63b4281b0bac"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 63,
    "name": "square_d8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "3ba84141-f6da-40de-a3c8-8d07667f8d6a"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 64,
    "name": "square_e8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "1bb042f6-acd9-4e96-9c33-81b7b6791254"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 65,
    "name": "square_f8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "d89ddf9c-90a1-4604-bc03-135b4d228107"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 66,
    "name": "square_g8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "336e0c6c-484f-41f9-a654-ddca3618440f"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_6c6e5346"
      }
    }
  },
  {
    "id": 67,
    "name": "square_h8",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "fd2a0f15-d863-438b-a895-67b80b1fdd83"
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5bda9f5c"
      }
    }
  },
  {
    "id": 68,
    "name": "white_queen",
    "components": {
      "PersistentId": {
        "id": "55730830-8111-4f09-ae71-8e48a2317ef7"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "white_queen",
        "instanceUuid": "7d9b6842-f8c2-4543-a555-0787d7d5b26d"
      }
    }
  },
  {
    "id": 69,
    "name": "queen_base",
    "parentId": 68,
    "components": {
      "PersistentId": {
        "id": "8dc634fc-33ce-4e3d-91a3-311f8d1f8498"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 70,
    "name": "queen_body",
    "parentId": 68,
    "components": {
      "PersistentId": {
        "id": "c722f05d-5023-4fc6-960f-e31eb2e7d6f3"
      },
      "Transform": {
        "position": [
          -3.5,
          0.7,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 71,
    "name": "queen_head",
    "parentId": 68,
    "components": {
      "PersistentId": {
        "id": "bc829ad0-8a4e-4822-92e3-1c46c6a4fb30"
      },
      "Transform": {
        "position": [
          -3.5,
          1.3,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 72,
    "name": "queen_crown",
    "parentId": 68,
    "components": {
      "PersistentId": {
        "id": "299f6b53-456b-498e-b1f8-0a327b561cf0"
      },
      "Transform": {
        "position": [
          -3.5,
          1.6,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cone",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 73,
    "name": "white_king",
    "components": {
      "PersistentId": {
        "id": "97dd3bfe-f18c-431d-8368-d1ec1af56378"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "white_king",
        "instanceUuid": "b6939800-6e7c-4284-af22-9b6d568da2b6"
      }
    }
  },
  {
    "id": 74,
    "name": "king_base",
    "parentId": 73,
    "components": {
      "PersistentId": {
        "id": "ffc6dfda-2964-4b8e-928c-031795140c69"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 75,
    "name": "king_body",
    "parentId": 73,
    "components": {
      "PersistentId": {
        "id": "72b249d5-edd9-423a-ad35-67efa71f5869"
      },
      "Transform": {
        "position": [
          3.5,
          0.7,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 76,
    "name": "king_head",
    "parentId": 73,
    "components": {
      "PersistentId": {
        "id": "e9c5ff94-69d9-49f3-b2a7-a6e11ac50e05"
      },
      "Transform": {
        "position": [
          3.5,
          1.4,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 77,
    "name": "king_cross_vertical",
    "parentId": 73,
    "components": {
      "PersistentId": {
        "id": "1795e147-eb87-4818-a614-581609765dc8"
      },
      "Transform": {
        "position": [
          3.5,
          1.8,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 78,
    "name": "king_cross_horizontal",
    "parentId": 73,
    "components": {
      "PersistentId": {
        "id": "20511dff-83c3-4872-b9f1-d1a70d9a6f45"
      },
      "Transform": {
        "position": [
          3.5,
          1.9,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 79,
    "name": "black_queen",
    "components": {
      "PersistentId": {
        "id": "21c1b9b4-16bd-412f-82b6-ebfbfbce65b0"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "black_queen",
        "instanceUuid": "da8d5137-172d-4ad1-9790-cbb82036e5c2"
      }
    }
  },
  {
    "id": 80,
    "name": "queen_base",
    "parentId": 79,
    "components": {
      "PersistentId": {
        "id": "261ee70d-b92e-4098-ba18-7fd6297bfaf2"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 81,
    "name": "queen_body",
    "parentId": 79,
    "components": {
      "PersistentId": {
        "id": "29e1b153-e2be-42f9-b8e7-eca589c2a285"
      },
      "Transform": {
        "position": [
          -3.5,
          0.7,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 82,
    "name": "queen_head",
    "parentId": 79,
    "components": {
      "PersistentId": {
        "id": "9396117c-ec18-4b4e-8c2c-65e739a79344"
      },
      "Transform": {
        "position": [
          -3.5,
          1.3,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 83,
    "name": "queen_crown",
    "parentId": 79,
    "components": {
      "PersistentId": {
        "id": "5bc7b80f-1a34-4f34-b25e-573f1b8c750d"
      },
      "Transform": {
        "position": [
          -3.5,
          1.6,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cone",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 84,
    "name": "black_king",
    "components": {
      "PersistentId": {
        "id": "38be9739-7471-4763-8fdf-93b9a1aa2a53"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "black_king",
        "instanceUuid": "e24c8052-2f12-481e-abe5-74013a1bac6e"
      }
    }
  },
  {
    "id": 85,
    "name": "king_base",
    "parentId": 84,
    "components": {
      "PersistentId": {
        "id": "034d0acd-f591-4486-80bc-e616326b99fd"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 86,
    "name": "king_body",
    "parentId": 84,
    "components": {
      "PersistentId": {
        "id": "8672cdac-0da5-4b7c-a2e3-e0615a433a78"
      },
      "Transform": {
        "position": [
          3.5,
          0.7,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 87,
    "name": "king_head",
    "parentId": 84,
    "components": {
      "PersistentId": {
        "id": "5e83cfc2-5261-431c-929a-e5e999105c35"
      },
      "Transform": {
        "position": [
          3.5,
          1.4,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 88,
    "name": "king_cross_vertical",
    "parentId": 84,
    "components": {
      "PersistentId": {
        "id": "e4b43023-33ae-4db6-968e-6da4d35f5879"
      },
      "Transform": {
        "position": [
          3.5,
          1.8,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 89,
    "name": "king_cross_horizontal",
    "parentId": 84,
    "components": {
      "PersistentId": {
        "id": "4e2295c4-2eb4-449d-9b47-81152dcff5fa"
      },
      "Transform": {
        "position": [
          3.5,
          1.9,
          3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 90,
    "name": "white_queen",
    "components": {
      "PersistentId": {
        "id": "9d3aa010-f58f-48ad-9add-e15b273ba0d3"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "white_queen",
        "instanceUuid": "7afeff02-92a1-4afe-8565-54fd27143a37"
      }
    }
  },
  {
    "id": 91,
    "name": "queen_base",
    "parentId": 90,
    "components": {
      "PersistentId": {
        "id": "28723f4b-8574-44c4-8d1f-ad96c91bfcce"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 92,
    "name": "queen_body",
    "parentId": 90,
    "components": {
      "PersistentId": {
        "id": "2e5f7f36-6cea-4aca-a23e-586c5395a852"
      },
      "Transform": {
        "position": [
          -0.5,
          0.4,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 93,
    "name": "queen_head",
    "parentId": 90,
    "components": {
      "PersistentId": {
        "id": "567f2f51-d186-4106-b0a7-34271771bd7a"
      },
      "Transform": {
        "position": [
          -0.5,
          0.8,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 94,
    "name": "queen_crown",
    "parentId": 90,
    "components": {
      "PersistentId": {
        "id": "08314ecf-058b-4453-9cf3-308aee06f5e1"
      },
      "Transform": {
        "position": [
          -0.5,
          1.1,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cone",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 95,
    "name": "white_king",
    "components": {
      "PersistentId": {
        "id": "a0ff81c2-0e82-4838-98a1-e7ef37af05dd"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "white_king",
        "instanceUuid": "d81c0e16-aa8e-42bf-ae14-c9cd56392b2d"
      }
    }
  },
  {
    "id": 96,
    "name": "king_base",
    "parentId": 95,
    "components": {
      "PersistentId": {
        "id": "eb16fa2a-798e-47e3-8cfc-bb5b17b6c851"
      },
      "Transform": {
        "position": [
          0.5,
          0.3,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 97,
    "name": "king_body",
    "parentId": 95,
    "components": {
      "PersistentId": {
        "id": "7c40d621-e726-4a9f-a3a4-171fe110e9db"
      },
      "Transform": {
        "position": [
          0.5,
          1,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 98,
    "name": "king_head",
    "parentId": 95,
    "components": {
      "PersistentId": {
        "id": "da53d883-8c29-4a0b-b5d4-886d9d997798"
      },
      "Transform": {
        "position": [
          0.5,
          1.7,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 99,
    "name": "king_cross_vertical",
    "parentId": 95,
    "components": {
      "PersistentId": {
        "id": "c7de6309-c52e-43b4-8367-9c765db991aa"
      },
      "Transform": {
        "position": [
          0.5,
          2.1,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 100,
    "name": "king_cross_horizontal",
    "parentId": 95,
    "components": {
      "PersistentId": {
        "id": "a84edac0-8e48-4bbc-ad9c-4c1be9ded06a"
      },
      "Transform": {
        "position": [
          0.5,
          2.2,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_08941399"
      }
    }
  },
  {
    "id": 101,
    "name": "black_queen",
    "components": {
      "PersistentId": {
        "id": "53a8f151-ee46-46f0-ae37-bde1fe9d43de"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "black_queen",
        "instanceUuid": "396139e4-84ab-4879-a231-ed37221035ca"
      }
    }
  },
  {
    "id": 102,
    "name": "queen_base",
    "parentId": 101,
    "components": {
      "PersistentId": {
        "id": "659384ee-70b7-4419-907e-6c440ba8b72d"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 103,
    "name": "queen_body",
    "parentId": 101,
    "components": {
      "PersistentId": {
        "id": "50200ee2-2811-4cb0-997f-285e5410f403"
      },
      "Transform": {
        "position": [
          -1.5,
          0.7,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 104,
    "name": "queen_head",
    "parentId": 101,
    "components": {
      "PersistentId": {
        "id": "98d8d32d-cbea-431a-8f6b-0aed4a9ed650"
      },
      "Transform": {
        "position": [
          -1.5,
          1.3,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 105,
    "name": "queen_crown",
    "parentId": 101,
    "components": {
      "PersistentId": {
        "id": "b7db81df-dc0d-42b2-a3f9-1fc6310799dd"
      },
      "Transform": {
        "position": [
          -1.5,
          1.6,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cone",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 106,
    "name": "black_king",
    "components": {
      "PersistentId": {
        "id": "771b08e0-f770-4a82-b173-a22ebcbabbae"
      },
      "PrefabInstance": {
        "version": 1,
        "overridePatch": {},
        "prefabId": "black_king",
        "instanceUuid": "d1792e09-27a0-4461-a42f-2ee0ed5d3c09"
      }
    }
  },
  {
    "id": 107,
    "name": "king_base",
    "parentId": 106,
    "components": {
      "PersistentId": {
        "id": "6e263ccc-2b9a-4239-91ea-d669c3bc0de8"
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
          1.1,
          0.4,
          1.1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 108,
    "name": "king_body",
    "parentId": 106,
    "components": {
      "PersistentId": {
        "id": "c1edebeb-3cc6-4d08-add2-817ec866e83e"
      },
      "Transform": {
        "position": [
          1.5,
          0.7,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cylinder",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 109,
    "name": "king_head",
    "parentId": 106,
    "components": {
      "PersistentId": {
        "id": "b3a4d3f4-4734-4eeb-b92b-9931b71bcbf1"
      },
      "Transform": {
        "position": [
          1.5,
          1.4,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 110,
    "name": "king_cross_vertical",
    "parentId": 106,
    "components": {
      "PersistentId": {
        "id": "1a12bee8-ea38-41ba-81fa-5a0d798cfbda"
      },
      "Transform": {
        "position": [
          1.5,
          1.8,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5c3dbf5d"
      }
    }
  },
  {
    "id": 111,
    "name": "king_cross_horizontal",
    "parentId": 106,
    "components": {
      "PersistentId": {
        "id": "128d3eac-c00b-44ff-847a-2b5f97e88b16"
      },
      "Transform": {
        "position": [
          1.5,
          1.9,
          -3.5
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
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "mat_5c3dbf5d"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/mat_08941399","@/materials/mat_5c3dbf5d","@/materials/default","@/materials/mat_5bda9f5c","@/materials/mat_6c6e5346","@/materials/bark","@/materials/dss","@/materials/farm-grass","@/materials/forestground","@/materials/grass","@/materials/green","@/materials/leaves","@/materials/mat1","@/materials/mat_17149756","@/materials/mat2","@/materials/mat_37a08996","@/materials/mat_37ade631","@/materials/mat_38910607","@/materials/mat_475d2e07","@/materials/mat_50e25b2a","@/materials/myMaterial","@/materials/re","@/materials/red","@/materials/rock","@/materials/sky","@/materials/test123"],
    inputs: ["@/inputs/defaultInput"],
    prefabs: ["@/prefabs/blackbishop","@/prefabs/blackking","@/prefabs/blackknight","@/prefabs/blackpawn","@/prefabs/blackqueen","@/prefabs/blackrook","@/prefabs/chessboard","@/prefabs/chesspawn","@/prefabs/testprefab","@/prefabs/trees","@/prefabs/whitebishop","@/prefabs/whiteking","@/prefabs/whiteknight","@/prefabs/whitepawn","@/prefabs/whitequeen","@/prefabs/whiterook"]
  },
  lockedEntityIds: [
  3
]
});
