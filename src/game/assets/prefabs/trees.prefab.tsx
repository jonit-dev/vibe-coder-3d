import { definePrefab } from '@core/lib/serialization/assets/definePrefabs';

export default definePrefab({
  "id": "trees",
  "name": "trees",
  "root": {
    "name": "trees",
    "components": {
      "PersistentId": {
        "id": "0c2b0c04-64b3-4c0b-8026-be85637ff3d3"
      }
    },
    "children": [
      {
        "name": "Oak Tree 1",
        "components": {
          "PersistentId": {
            "id": "95f5457f-c8f0-42f0-ab8d-03ecd66cc67e"
          },
          "Transform": {
            "position": [
              -1.25,
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
          "MeshRenderer": {
            "meshId": "tree",
            "materialId": "default",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": ""
          }
        }
      },
      {
        "name": "Oak Tree 2",
        "components": {
          "PersistentId": {
            "id": "0634deb9-bbd9-4d14-9665-39a8485f2e95"
          },
          "Transform": {
            "position": [
              2.5,
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
          "MeshRenderer": {
            "meshId": "tree",
            "materialId": "default",
            "enabled": true,
            "castShadows": true,
            "receiveShadows": true,
            "modelPath": ""
          }
        }
      }
    ]
  },
  "metadata": {
    "createdAt": "2025-10-12T16:09:12.873Z",
    "createdFrom": 5
  },
  "dependencies": [
    "default"
  ]
});
