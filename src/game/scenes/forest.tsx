import { defineScene } from './defineScene';

/**
 * forest
 * Scene with 41 entities
 * Generated: 2025-10-27T07:06:17.284Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "forest",
  "version": 1,
  "timestamp": "2025-10-27T07:06:17.284Z",
  "description": "Scene with 41 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "forest-camera-001"
      },
      "Transform": {
        "position": [
          0,
          2,
          -15
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
        "fov": 60,
        "near": 0.1,
        "far": 200,
        "projectionType": "perspective",
        "orthographicSize": 10,
        "depth": 0,
        "isMain": true,
        "clearFlags": "skybox",
        "skyboxTexture": "",
        "backgroundColor": {
          "r": 0.53,
          "g": 0.81,
          "b": 0.92,
          "a": 1
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
        "skyboxIntensity": 1,
        "skyboxBlur": 0
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light (Sun)",
    "components": {
      "PersistentId": {
        "id": "forest-sun-001"
      },
      "Transform": {
        "position": [
          10,
          20,
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
          "g": 0.95,
          "b": 0.8
        },
        "intensity": 0.7,
        "enabled": true,
        "castShadow": true,
        "directionX": -0.5,
        "directionY": -1,
        "directionZ": -0.3,
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
        "id": "forest-ambient-001"
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
          "g": 0.5,
          "b": 0.4
        },
        "intensity": 2.8,
        "enabled": true,
        "castShadow": false,
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
        "lightType": "ambient"
      }
    }
  },
  {
    "id": 3,
    "name": "Forest Ground",
    "components": {
      "PersistentId": {
        "id": "forest-ground-001"
      },
      "Transform": {
        "position": [
          0,
          0,
          0
        ],
        "rotation": [
          -90,
          0,
          0
        ],
        "scale": [
          50,
          50,
          1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": false,
        "receiveShadows": true,
        "meshId": "plane",
        "materialId": "forestground"
      }
    }
  },
  {
    "id": 4,
    "name": "Player Spawn",
    "components": {
      "PersistentId": {
        "id": "forest-player-spawn-001"
      },
      "Transform": {
        "position": [
          0,
          1,
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
      }
    }
  },
  {
    "id": 5,
    "name": "Tree 1",
    "components": {
      "PersistentId": {
        "id": "forest-tree-001"
      },
      "Transform": {
        "position": [
          -5,
          0,
          8
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
      }
    }
  },
  {
    "id": 6,
    "name": "Tree 1 Trunk",
    "parentId": 5,
    "components": {
      "PersistentId": {
        "id": "forest-tree-001-trunk"
      },
      "Transform": {
        "position": [
          0,
          2,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.5,
          4,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 7,
    "name": "Tree 1 Foliage",
    "parentId": 5,
    "components": {
      "PersistentId": {
        "id": "forest-tree-001-foliage"
      },
      "Transform": {
        "position": [
          0,
          5.5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.5,
          3,
          2.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 8,
    "name": "Tree 2",
    "components": {
      "PersistentId": {
        "id": "forest-tree-002"
      },
      "Transform": {
        "position": [
          8,
          0,
          5
        ],
        "rotation": [
          0,
          45,
          0
        ],
        "scale": [
          1.2,
          1.2,
          1.2
        ]
      }
    }
  },
  {
    "id": 9,
    "name": "Tree 2 Trunk",
    "parentId": 8,
    "components": {
      "PersistentId": {
        "id": "forest-tree-002-trunk"
      },
      "Transform": {
        "position": [
          0,
          2.5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.45,
          5,
          0.45
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 10,
    "name": "Tree 2 Foliage",
    "parentId": 8,
    "components": {
      "PersistentId": {
        "id": "forest-tree-002-foliage"
      },
      "Transform": {
        "position": [
          0,
          6.5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.8,
          3.5,
          2.8
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 11,
    "name": "Tree 3",
    "components": {
      "PersistentId": {
        "id": "forest-tree-003"
      },
      "Transform": {
        "position": [
          -8,
          0,
          -3
        ],
        "rotation": [
          0,
          -30,
          0
        ],
        "scale": [
          0.9,
          0.9,
          0.9
        ]
      }
    }
  },
  {
    "id": 12,
    "name": "Tree 3 Trunk",
    "parentId": 11,
    "components": {
      "PersistentId": {
        "id": "forest-tree-003-trunk"
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
          0.5,
          3.6,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 13,
    "name": "Tree 3 Foliage",
    "parentId": 11,
    "components": {
      "PersistentId": {
        "id": "forest-tree-003-foliage"
      },
      "Transform": {
        "position": [
          0,
          5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.3,
          2.8,
          2.3
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 14,
    "name": "Tree 4",
    "components": {
      "PersistentId": {
        "id": "forest-tree-004"
      },
      "Transform": {
        "position": [
          3,
          0,
          -10
        ],
        "rotation": [
          0,
          120,
          0
        ],
        "scale": [
          1.1,
          1.1,
          1.1
        ]
      }
    }
  },
  {
    "id": 15,
    "name": "Tree 4 Trunk",
    "parentId": 14,
    "components": {
      "PersistentId": {
        "id": "forest-tree-004-trunk"
      },
      "Transform": {
        "position": [
          0,
          2.2,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.48,
          4.4,
          0.48
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 16,
    "name": "Tree 4 Foliage",
    "parentId": 14,
    "components": {
      "PersistentId": {
        "id": "forest-tree-004-foliage"
      },
      "Transform": {
        "position": [
          0,
          6,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.6,
          3.2,
          2.6
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 17,
    "name": "Tree 5",
    "components": {
      "PersistentId": {
        "id": "forest-tree-005"
      },
      "Transform": {
        "position": [
          12,
          0,
          -8
        ],
        "rotation": [
          0,
          -75,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      }
    }
  },
  {
    "id": 18,
    "name": "Tree 5 Trunk",
    "parentId": 17,
    "components": {
      "PersistentId": {
        "id": "forest-tree-005-trunk"
      },
      "Transform": {
        "position": [
          0,
          2,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.5,
          4,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 19,
    "name": "Tree 5 Foliage",
    "parentId": 17,
    "components": {
      "PersistentId": {
        "id": "forest-tree-005-foliage"
      },
      "Transform": {
        "position": [
          0,
          5.5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.5,
          3,
          2.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 20,
    "name": "Tree 6",
    "components": {
      "PersistentId": {
        "id": "forest-tree-006"
      },
      "Transform": {
        "position": [
          -12,
          0,
          6
        ],
        "rotation": [
          0,
          90,
          0
        ],
        "scale": [
          0.85,
          0.85,
          0.85
        ]
      }
    }
  },
  {
    "id": 21,
    "name": "Tree 6 Trunk",
    "parentId": 20,
    "components": {
      "PersistentId": {
        "id": "forest-tree-006-trunk"
      },
      "Transform": {
        "position": [
          0,
          1.7,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.5,
          3.4,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 22,
    "name": "Tree 6 Foliage",
    "parentId": 20,
    "components": {
      "PersistentId": {
        "id": "forest-tree-006-foliage"
      },
      "Transform": {
        "position": [
          0,
          4.8,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.2,
          2.7,
          2.2
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 23,
    "name": "Tree 7",
    "components": {
      "PersistentId": {
        "id": "forest-tree-007"
      },
      "Transform": {
        "position": [
          0,
          0,
          15
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          1.3,
          1.3,
          1.3
        ]
      }
    }
  },
  {
    "id": 24,
    "name": "Tree 7 Trunk",
    "parentId": 23,
    "components": {
      "PersistentId": {
        "id": "forest-tree-007-trunk"
      },
      "Transform": {
        "position": [
          0,
          2.6,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.46,
          5.2,
          0.46
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 25,
    "name": "Tree 7 Foliage",
    "parentId": 23,
    "components": {
      "PersistentId": {
        "id": "forest-tree-007-foliage"
      },
      "Transform": {
        "position": [
          0,
          6.8,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.9,
          3.6,
          2.9
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 26,
    "name": "Tree 8",
    "components": {
      "PersistentId": {
        "id": "forest-tree-008"
      },
      "Transform": {
        "position": [
          -15,
          0,
          -5
        ],
        "rotation": [
          0,
          160,
          0
        ],
        "scale": [
          1,
          1,
          1
        ]
      }
    }
  },
  {
    "id": 27,
    "name": "Tree 8 Trunk",
    "parentId": 26,
    "components": {
      "PersistentId": {
        "id": "forest-tree-008-trunk"
      },
      "Transform": {
        "position": [
          0,
          2,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.5,
          4,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 28,
    "name": "Tree 8 Foliage",
    "parentId": 26,
    "components": {
      "PersistentId": {
        "id": "forest-tree-008-foliage"
      },
      "Transform": {
        "position": [
          0,
          5.5,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.5,
          3,
          2.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 29,
    "name": "Tree 9",
    "components": {
      "PersistentId": {
        "id": "forest-tree-009"
      },
      "Transform": {
        "position": [
          15,
          0,
          3
        ],
        "rotation": [
          0,
          -145,
          0
        ],
        "scale": [
          0.95,
          0.95,
          0.95
        ]
      }
    }
  },
  {
    "id": 30,
    "name": "Tree 9 Trunk",
    "parentId": 29,
    "components": {
      "PersistentId": {
        "id": "forest-tree-009-trunk"
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
          0.5,
          3.8,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 31,
    "name": "Tree 9 Foliage",
    "parentId": 29,
    "components": {
      "PersistentId": {
        "id": "forest-tree-009-foliage"
      },
      "Transform": {
        "position": [
          0,
          5.3,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.4,
          2.9,
          2.4
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 32,
    "name": "Tree 10",
    "components": {
      "PersistentId": {
        "id": "forest-tree-010"
      },
      "Transform": {
        "position": [
          6,
          0,
          12
        ],
        "rotation": [
          0,
          210,
          0
        ],
        "scale": [
          1.15,
          1.15,
          1.15
        ]
      }
    }
  },
  {
    "id": 33,
    "name": "Tree 10 Trunk",
    "parentId": 32,
    "components": {
      "PersistentId": {
        "id": "forest-tree-010-trunk"
      },
      "Transform": {
        "position": [
          0,
          2.3,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          0.48,
          4.6,
          0.48
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cylinder",
        "materialId": "bark"
      }
    }
  },
  {
    "id": 34,
    "name": "Tree 10 Foliage",
    "parentId": 32,
    "components": {
      "PersistentId": {
        "id": "forest-tree-010-foliage"
      },
      "Transform": {
        "position": [
          0,
          6.2,
          0
        ],
        "rotation": [
          0,
          0,
          0
        ],
        "scale": [
          2.7,
          3.3,
          2.7
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "cone",
        "materialId": "leaves"
      }
    }
  },
  {
    "id": 35,
    "name": "Rock 1",
    "components": {
      "PersistentId": {
        "id": "forest-rock-001"
      },
      "Transform": {
        "position": [
          -3,
          0.3,
          3.75
        ],
        "rotation": [
          0,
          25,
          0
        ],
        "scale": [
          0.8,
          0.6,
          0.8
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  },
  {
    "id": 36,
    "name": "Rock 2",
    "components": {
      "PersistentId": {
        "id": "forest-rock-002"
      },
      "Transform": {
        "position": [
          10,
          0.25,
          -2
        ],
        "rotation": [
          0,
          -60,
          0
        ],
        "scale": [
          0.6,
          0.5,
          0.6
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  },
  {
    "id": 37,
    "name": "Rock 3",
    "components": {
      "PersistentId": {
        "id": "forest-rock-003"
      },
      "Transform": {
        "position": [
          -7,
          0.4,
          -8
        ],
        "rotation": [
          0,
          110,
          0
        ],
        "scale": [
          1,
          0.8,
          1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  },
  {
    "id": 38,
    "name": "Rock 4",
    "components": {
      "PersistentId": {
        "id": "forest-rock-004"
      },
      "Transform": {
        "position": [
          4,
          0.2,
          10
        ],
        "rotation": [
          0,
          85,
          0
        ],
        "scale": [
          0.5,
          0.4,
          0.5
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  },
  {
    "id": 39,
    "name": "Rock 5",
    "components": {
      "PersistentId": {
        "id": "forest-rock-005"
      },
      "Transform": {
        "position": [
          -10,
          0.35,
          8
        ],
        "rotation": [
          0,
          -35,
          0
        ],
        "scale": [
          0.7,
          0.7,
          0.7
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  },
  {
    "id": 40,
    "name": "Rock 6",
    "components": {
      "PersistentId": {
        "id": "forest-rock-006"
      },
      "Transform": {
        "position": [
          13,
          0.3,
          7
        ],
        "rotation": [
          0,
          200,
          0
        ],
        "scale": [
          0.65,
          0.55,
          0.65
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "meshId": "sphere",
        "materialId": "rock"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/forestground","@/materials/bark","@/materials/leaves","@/materials/rock"],
    inputs: ["@/inputs/defaultInput"],
    prefabs: ["@/prefabs/trees"]
  }
});
