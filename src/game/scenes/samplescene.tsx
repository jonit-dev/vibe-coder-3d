import { defineScene } from './defineScene';

/**
 * samplescene
 * Scene with 5 entities
 * Generated: 2025-11-14T03:26:34.079Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "samplescene",
  "version": 1,
  "timestamp": "2025-11-14T03:26:34.079Z",
  "description": "Scene with 5 entities"
},
  entities: [
  {
    "id": 8,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "ca678914-7dc4-4877-b75f-ccde12f5189d"
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
        "clearFlags": "solidColor",
        "skyboxTexture": "",
        "backgroundColor": {
          "r": 0,
          "g": 0,
          "b": 0,
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
    "id": 9,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "06a8d06e-4623-4865-83df-e2ec3e97e5d0"
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
    "id": 10,
    "name": "Ambient Light",
    "components": {
      "PersistentId": {
        "id": "34b4b436-eed2-44a7-946a-e5dccee42b31"
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
    "id": 11,
    "name": "Terrain 0",
    "components": {
      "PersistentId": {
        "id": "2a8e89f7-29bc-46f3-9561-9b17c521d22a"
      },
      "Transform": {
        "position": [
          0,
          -1.25,
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
        "meshId": "terrain",
        "materialId": "mat_37ade631"
      },
      "Terrain": {
        "size": [
          100,
          100
        ],
        "segments": [
          129,
          129
        ],
        "heightScale": 15,
        "noiseEnabled": true,
        "noiseSeed": 42,
        "noiseFrequency": 2.5,
        "noiseOctaves": 4,
        "noisePersistence": 0.5,
        "noiseLacunarity": 2
      },
      "RigidBody": {
        "enabled": true,
        "bodyType": "fixed",
        "mass": 1,
        "gravityScale": 1,
        "canSleep": true,
        "material": {
          "friction": 0.9,
          "restitution": 0,
          "density": 1
        },
        "type": "fixed"
      },
      "MeshCollider": {
        "enabled": true,
        "isTrigger": false,
        "colliderType": "heightfield",
        "center": [
          0,
          0,
          0
        ],
        "size": {
          "width": 20,
          "height": 1,
          "depth": 20,
          "radius": 0.5,
          "capsuleRadius": 0.5,
          "capsuleHeight": 2
        },
        "physicsMaterial": {
          "friction": 0.9,
          "restitution": 0.3,
          "density": 1
        }
      }
    }
  },
  {
    "id": 12,
    "name": "farm_house_basic_shaded 0",
    "components": {
      "PersistentId": {
        "id": "f862a9de-97c7-4090-aec1-eec00d8cd84b"
      },
      "Transform": {
        "position": [
          2.5,
          0.5,
          0.5
        ],
        "rotation": [
          0,
          -30,
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
        "modelPath": "/assets/models/FarmHouse/lod/farm_house_basic_shaded.low_fidelity.glb",
        "meshId": "custom",
        "materialId": "default"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/mat_37ade631"],
    inputs: ["@/inputs/defaultInput"],
    prefabs: ["@/prefabs/trees"]
  },
  lockedEntityIds: [
  11
]
});
