import { defineScene } from './defineScene';

/**
 * ExampleMultiFile
 * Scene with 6 entities
 * Generated: 2025-10-13T03:21:44.616Z
 * Version: 1
 */
export default defineScene({
  metadata: {
  "name": "ExampleMultiFile",
  "version": 1,
  "timestamp": "2025-10-13T03:21:44.616Z",
  "description": "Scene with 6 entities"
},
  entities: [
  {
    "id": 0,
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
        "isMain": true,
        "skyboxTexture": "/assets/skyboxes/farm-skybox.png"
      }
    }
  },
  {
    "id": 1,
    "name": "Directional Light",
    "components": {
      "PersistentId": {
        "id": "da41f82c-b557-47ce-bebb-1d154e07ce7d"
      },
      "Transform": {
        "position": [
          5,
          16.25,
          5
        ]
      },
      "Light": {
        "lightType": "directional",
        "intensity": 1.5
      }
    }
  },
  {
    "id": 2,
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
        "materialId": "farm-grass"
      }
    }
  },
  {
    "id": 3,
    "name": "trees",
    "components": {
      "PersistentId": {
        "id": "5ca63c70-8378-4353-bf07-eb31b694713c"
      },
      "PrefabInstance": {
        "prefabId": "trees",
        "instanceUuid": "efdc53dc-9a41-4c00-beb0-470c50c11f4e",
        "overridePatch": {
          "position": [
            0.625,
            0,
            0
          ]
        }
      }
    }
  },
  {
    "id": 4,
    "name": "Oak Tree 1",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "f900b38b-b3f7-4a1d-808c-e1e0353e665c"
      },
      "Transform": {
        "position": [
          -1.25,
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
    "id": 5,
    "name": "Oak Tree 2",
    "parentId": 3,
    "components": {
      "PersistentId": {
        "id": "714bd85d-16b2-41e9-9238-6212a35de444"
      },
      "Transform": {
        "position": [
          2.5,
          0,
          0
        ]
      },
      "MeshRenderer": {
        "meshId": "tree",
        "materialId": "default"
      }
    }
  }
],
  assetReferences: {
    materials: ["@/materials/default","@/materials/farm-grass","@/materials/dss","@/materials/grass","@/materials/mat1","@/materials/mat2","@/materials/mat_38910607","@/materials/myMaterial","@/materials/red","@/materials/test123"],
    inputs: ["@/inputs/DefaultInput"],
    prefabs: ["@/prefabs/Trees"]
  }
});
