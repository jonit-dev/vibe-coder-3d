import { defineScene } from './defineScene';

/**
 * testdirectional
 * Scene with 7 entities
 * Generated: 2025-11-09T22:09:42.937Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "testdirectional",
  "version": 1,
  "timestamp": "2025-11-09T22:09:42.937Z",
  "description": "Scene with 7 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Camera",
    "components": {
      "PersistentId": {
        "id": "8a9b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d"
      },
      "Transform": {
        "position": [
          0,
          3,
          -8
        ],
        "rotation": [
          10,
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
        "far": 100,
        "projectionType": "perspective",
        "orthographicSize": 10,
        "depth": 0,
        "isMain": true,
        "clearFlags": "skybox",
        "skyboxTexture": "",
        "backgroundColor": {
          "r": 0.5,
          "g": 0.7,
          "b": 0.9,
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
        "id": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e"
      },
      "Transform": {
        "position": [
          -7,
          10,
          -4.25
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
        "intensity": 1.5,
        "enabled": true,
        "castShadow": false,
        "directionX": -0.5,
        "directionY": -1,
        "directionZ": -0.5,
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
        "id": "2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f"
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
          "r": 0.3,
          "g": 0.3,
          "b": 0.5
        },
        "intensity": 0.3,
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
    "name": "Ground",
    "components": {
      "PersistentId": {
        "id": "3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a"
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
          10,
          10,
          1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "plane",
        "materialId": "green"
      }
    }
  },
  {
    "id": 4,
    "name": "Center Cube",
    "components": {
      "PersistentId": {
        "id": "4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b"
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
          1,
          1,
          1
        ]
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "cube",
        "materialId": "re"
      }
    }
  },
  {
    "id": 5,
    "name": "Left Sphere",
    "components": {
      "PersistentId": {
        "id": "5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c"
      },
      "Transform": {
        "position": [
          -2,
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
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_475d2e07"
      }
    }
  },
  {
    "id": 6,
    "name": "Right Sphere",
    "components": {
      "PersistentId": {
        "id": "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d"
      },
      "Transform": {
        "position": [
          2,
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
      },
      "MeshRenderer": {
        "enabled": true,
        "castShadows": true,
        "receiveShadows": true,
        "modelPath": "",
        "meshId": "sphere",
        "materialId": "mat_17149756"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/green","@/materials/re","@/materials/mat_475d2e07","@/materials/mat_17149756","@/materials/bark","@/materials/dss","@/materials/farm-grass","@/materials/forestground","@/materials/grass","@/materials/leaves","@/materials/mat1","@/materials/mat2","@/materials/mat_37ade631","@/materials/mat_38910607","@/materials/myMaterial","@/materials/red","@/materials/rock","@/materials/sky","@/materials/test123"],
    inputs: ["@/inputs/defaultInput"],
    prefabs: ["@/prefabs/trees"]
  }
});
