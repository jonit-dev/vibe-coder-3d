import { defineScene } from './defineScene';

/**
 * testscripting
 * Scene with 5 entities
 * Generated: 2025-10-21T15:34:18.874Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "testscripting",
  "version": 1,
  "timestamp": "2025-10-21T15:34:18.874Z",
  "description": "Scene with 5 entities"
},
  entities: [
  {
    "id": 0,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "d093ac81-9909-4629-9a55-0b8ead63a459"
      },
      "Transform": {
        "position": [
          0,
          1,
          -10
        ]
      },
      "Camera": {
        "fov": 20,
        "isMain": true,
        "backgroundColor": {
          "a": 0
        }
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "59155f4d-dac0-41b0-8232-50d18965aa53"
      },
      "Transform": {
        "position": [
          5,
          10,
          5
        ]
      },
      "Light": {
        "lightType": "directional",
        "intensity": 0.8
      }
    }
  },
  {
    "id": 2,
    "name": "Ambient Light",
    "components": {
      "PersistentId": {
        "id": "d6cef29d-6413-4d6b-83ce-1cd391332bc1"
      },
      "Transform": {},
      "Light": {
        "lightType": "ambient",
        "color": {
          "r": 0.4,
          "g": 0.4,
          "b": 0.4
        },
        "intensity": 0.5,
        "castShadow": false
      }
    }
  },
  {
    "id": 3,
    "name": "Cube 0",
    "components": {
      "PersistentId": {
        "id": "99e5bdd3-9b77-43ae-907d-d1a37d46e11a"
      },
      "Transform": {
        "position": [
          0,
          1.25,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "cube",
        "materialId": "default"
      },
      "Script": {
        "scriptRef": {
          "scriptId": "entity-3.script",
          "source": "external",
          "path": "src/game/scripts/entity-3.script.ts",
          "codeHash": "8f519ba132d3fc27d673bd4ea088be0c30542fd77207fb981cdf3c58f9d1bbeb",
          "lastModified": 1761060772089.9998
        },
        "lastModified": 1761060772089.9998,
        "scriptPath": "entity-3.script.lua"
      }
    }
  },
  {
    "id": 4,
    "name": "Plane 0",
    "components": {
      "PersistentId": {
        "id": "3f7ec530-4217-4f8e-8088-39a1ccc5a303"
      },
      "Transform": {
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
        "meshId": "plane",
        "materialId": "mat1"
      },
      "RigidBody": {
        "bodyType": "fixed",
        "type": "fixed"
      },
      "MeshCollider": {
        "center": [
          0,
          0,
          0
        ],
        "size": {
          "width": 1,
          "height": 1,
          "depth": 0.01,
          "radius": 0.5,
          "capsuleRadius": 0.5,
          "capsuleHeight": 2
        },
        "physicsMaterial": {
          "friction": 0.7,
          "restitution": 0.3,
          "density": 1
        }
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/mat1","@/materials/dss","@/materials/farm-grass","@/materials/grass","@/materials/mat2","@/materials/mat_38910607","@/materials/myMaterial","@/materials/red","@/materials/test123"],
    inputs: ["@/inputs/defaultInput"],
    prefabs: ["@/prefabs/trees"]
  },
  lockedEntityIds: [
  4
]
});
