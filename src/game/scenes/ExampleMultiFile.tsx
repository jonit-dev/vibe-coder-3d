import { defineScene } from './defineScene';

/**
 * ExampleMultiFile
 * Scene with 5 entities
 * Generated: 2025-10-12T02:31:16.009Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "ExampleMultiFile",
  "version": 1,
  "timestamp": "2025-10-12T02:31:16.009Z",
  "description": "Scene with 5 entities"
},
  entities: [
  {
    "id": 3,
    "name": "Main Camera",
    "components": {
      "PersistentId": {
        "id": "4b4224f5-da30-4b74-9a03-d00a11dc6258"
      },
      "Transform": {
        "position": [
          0,
          2,
          -10
        ]
      },
      "Camera": {
        "fov": 60,
        "isMain": true
      }
    }
  },
  {
    "id": 4,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "da41f82c-b557-47ce-bebb-1d154e07ce7d"
      },
      "Transform": {
        "position": [
          5,
          10,
          5
        ]
      },
      "Light": {
        "lightType": "directional"
      }
    }
  },
  {
    "id": 5,
    "name": "Oak Tree 1",
    "components": {
      "PersistentId": {
        "id": "95f5457f-c8f0-42f0-ab8d-03ecd66cc67e"
      },
      "Transform": {
        "position": [
          -3,
          0,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "default"
      }
    }
  },
  {
    "id": 6,
    "name": "Oak Tree 2",
    "components": {
      "PersistentId": {
        "id": "0634deb9-bbd9-4d14-9665-39a8485f2e95"
      },
      "Transform": {
        "position": [
          3,
          0,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "default"
      }
    }
  },
  {
    "id": 7,
    "name": "Ground",
    "components": {
      "PersistentId": {
        "id": "2c220494-5661-411d-89be-728dc587137e"
      },
      "Transform": {
        "position": [
          0,
          -0.5,
          0
        ],
        "scale": [
          20,
          0.1,
          20
        ]
      },
      "MeshRenderer": {
        "meshId": "cube",
        "materialId": "red"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/test123","@/materials/red"],
    inputs: ["@/inputs/DefaultInput","@/inputs/DefaultInput"]
  }
});
