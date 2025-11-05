#!/usr/bin/env python3
"""
Generate LOD performance test scene with 1000 entities
"""

import json
import math

def generate_performance_scene():
    scene = {
        "name": "testlod-performance",
        "version": "1.0",
        "entities": [],
        "metadata": {
            "description": "LOD performance test scene with 1000+ entities",
            "test_cases": [
                "LOD calculation performance with many entities",
                "Memory usage patterns",
                "Batch processing efficiency",
                "Thread safety under load"
            ],
            "entity_count": 1000
        }
    }

    # Add camera
    scene["entities"].append({
        "id": 0,
        "name": "camera",
        "components": {
            "Camera": {
                "position": [0, 5, 30],
                "rotation": [0, 0, 0, 1],
                "fov": 60,
                "near": 0.1,
                "far": 1000
            }
        }
    })

    # Generate 1000 entities in a grid pattern
    entity_id = 1
    grid_size = int(math.sqrt(1000)) + 1

    for x in range(grid_size):
        for z in range(grid_size):
            if entity_id > 1000:
                break

            # Position entities in a grid with some randomness
            pos_x = (x - grid_size/2) * 2.0 + (x % 3) * 0.5
            pos_z = (z - grid_size/2) * 2.0 + (z % 3) * 0.5
            pos_y = (x + z) % 3 * 0.5  # Vary height slightly

            entity = {
                "id": entity_id,
                "name": f"lod_entity_{entity_id}",
                "components": {
                    "Transform": {
                        "position": [pos_x, pos_y, pos_z],
                        "rotation": [0, 0, 0, 1],
                        "scale": [1, 1, 1]
                    },
                    "MeshRenderer": {
                        "mesh_path": f"models/performance_obj_{entity_id % 10}.glb",
                        "material_path": "materials/default.json"
                    },
                    "LODComponent": {
                        "path": f"models/performance_obj_{entity_id % 10}.glb",
                        "high_quality_path": f"models/lod/performance_obj_{entity_id % 10}_high.glb",
                        "low_quality_path": f"models/lod/performance_obj_{entity_id % 10}_low.glb",
                        "distance_thresholds": [5 + (entity_id % 5), 15 + (entity_id % 10)],
                        "quality_override": None,
                        "current_quality": "Original"
                    }
                }
            }

            scene["entities"].append(entity)
            entity_id += 1

        if entity_id > 1000:
            break

    return scene

if __name__ == "__main__":
    scene = generate_performance_scene()

    # Write to the test scenes directory
    output_path = "/home/joao/projects/vibe-coder-3d/rust/game/scenes/tests/testlod-performance.json"

    with open(output_path, 'w') as f:
        json.dump(scene, f, indent=2)

    print(f"Generated performance test scene with {len(scene['entities'])} entities")
    print(f"Output: {output_path}")