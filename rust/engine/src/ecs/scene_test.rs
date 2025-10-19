#[cfg(test)]
mod tests {
    use crate::ecs::*;

    #[test]
    fn test_scene_data_deserialization() {
        let json = r#"{
            "metadata": {
                "name": "Test Scene",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [],
            "materials": [],
            "prefabs": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        assert_eq!(scene.metadata.name, "Test Scene");
        assert_eq!(scene.metadata.version, 1);
        assert_eq!(scene.entities.len(), 0);
    }

    #[test]
    fn test_entity_with_transform() {
        let json = r#"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [
                {
                    "persistentId": "entity-1",
                    "name": "Test Entity",
                    "components": {
                        "Transform": {
                            "position": [1.0, 2.0, 3.0],
                            "rotation": [0.0, 0.0, 0.0, 1.0],
                            "scale": [1.0, 1.0, 1.0]
                        }
                    }
                }
            ],
            "materials": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        assert_eq!(scene.entities.len(), 1);

        let entity = &scene.entities[0];
        assert_eq!(entity.persistentId, Some("entity-1".to_string()));
        assert_eq!(entity.name, Some("Test Entity".to_string()));

        let transform: components::transform::Transform =
            entity.get_component("Transform").unwrap();

        let pos = transform.position_vec3();
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 2.0);
        assert_eq!(pos.z, 3.0);
    }

    #[test]
    fn test_entity_with_mesh_renderer() {
        let json = r#"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [
                {
                    "components": {
                        "MeshRenderer": {
                            "meshId": "cube",
                            "materialId": "mat-red",
                            "enabled": true
                        }
                    }
                }
            ],
            "materials": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        let entity = &scene.entities[0];
        let mesh_renderer: components::mesh_renderer::MeshRenderer =
            entity.get_component("MeshRenderer").unwrap();

        assert_eq!(mesh_renderer.meshId, Some("cube".to_string()));
        assert_eq!(mesh_renderer.materialId, Some("mat-red".to_string()));
        assert_eq!(mesh_renderer.enabled, true);
    }

    #[test]
    fn test_entity_with_camera() {
        let json = r#"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [
                {
                    "name": "Main Camera",
                    "components": {
                        "Camera": {
                            "fov": 75.0,
                            "near": 0.5,
                            "far": 200.0,
                            "isMain": true
                        }
                    }
                }
            ],
            "materials": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        let entity = &scene.entities[0];
        let camera: components::camera::CameraComponent = entity.get_component("Camera").unwrap();

        assert_eq!(camera.fov, 75.0);
        assert_eq!(camera.near, 0.5);
        assert_eq!(camera.far, 200.0);
        assert_eq!(camera.is_main, true);
    }

    #[test]
    fn test_scene_with_materials() {
        let json = r##"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [],
            "materials": [
                {
                    "id": "mat-red",
                    "name": "Red Material",
                    "color": "#ff0000",
                    "metallic": 0.5,
                    "roughness": 0.3
                }
            ]
        }"##;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        assert!(scene.materials.is_some());

        // Test that materials can be parsed
        if let Some(materials_value) = scene.materials {
            let materials: Vec<vibe_assets::Material> =
                serde_json::from_value(materials_value).unwrap();

            assert_eq!(materials.len(), 1);
            assert_eq!(materials[0].id, "mat-red");
            assert_eq!(materials[0].color, "#ff0000");
        }
    }

    #[test]
    fn test_entity_has_component() {
        let json = r#"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [
                {
                    "components": {
                        "Transform": {
                            "position": [0, 0, 0]
                        },
                        "MeshRenderer": {
                            "meshId": "cube"
                        }
                    }
                }
            ],
            "materials": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();
        let entity = &scene.entities[0];

        assert!(entity.has_component("Transform"));
        assert!(entity.has_component("MeshRenderer"));
        assert!(!entity.has_component("Camera"));
        assert!(!entity.has_component("Light"));
    }

    #[test]
    fn test_parent_child_relationship() {
        let json = r#"{
            "metadata": {
                "name": "Test",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00.000Z"
            },
            "entities": [
                {
                    "persistentId": "parent",
                    "name": "Parent",
                    "components": {}
                },
                {
                    "persistentId": "child",
                    "name": "Child",
                    "parentPersistentId": "parent",
                    "components": {}
                }
            ],
            "materials": []
        }"#;

        let scene: SceneData = serde_json::from_str(json).unwrap();

        let parent = &scene.entities[0];
        let child = &scene.entities[1];

        assert_eq!(parent.persistentId, Some("parent".to_string()));
        assert_eq!(parent.parentPersistentId, None);

        assert_eq!(child.persistentId, Some("child".to_string()));
        assert_eq!(child.parentPersistentId, Some("parent".to_string()));
    }
}
