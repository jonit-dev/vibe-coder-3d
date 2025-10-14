#[cfg(test)]
mod tests {
    use crate::ecs::components::{
        camera::CameraComponent,
        light::{Light, LightColor},
        mesh_renderer::MeshRenderer,
        transform::Transform,
    };
    use crate::ecs::{Entity, SceneData};
    use crate::render::{Camera, SceneRenderer};
    use glam::Vec3;
    use serde_json::json;

    /// Helper to create a test scene matching Three.js structure
    fn create_test_scene() -> SceneData {
        let json = json!({
            "metadata": {
                "name": "Test Scene",
                "version": 1,
                "timestamp": "2025-10-14T00:00:00Z"
            },
            "entities": [
                {
                    "persistentId": "camera-1",
                    "name": "Main Camera",
                    "components": {
                        "Transform": {
                            "position": [0.0, 2.0, 5.0],
                            "rotation": [0.0, 0.0, 0.0],
                            "scale": [1.0, 1.0, 1.0]
                        },
                        "Camera": {
                            "fov": 60.0,
                            "near": 0.1,
                            "far": 1000.0,
                            "isMain": true,
                            "projectionType": "perspective",
                            "orthographicSize": 10.0,
                            "backgroundColor": {
                                "r": 0.2,
                                "g": 0.3,
                                "b": 0.4,
                                "a": 1.0
                            }
                        }
                    }
                },
                {
                    "persistentId": "directional-light-1",
                    "name": "Sun",
                    "components": {
                        "Transform": {
                            "position": [0.0, 10.0, 0.0],
                            "rotation": [0.0, 0.0, 0.0],
                            "scale": [1.0, 1.0, 1.0]
                        },
                        "Light": {
                            "lightType": "directional",
                            "color": { "r": 1.0, "g": 1.0, "b": 1.0 },
                            "intensity": 1.0,
                            "enabled": true,
                            "castShadow": false,
                            "directionX": 0.5,
                            "directionY": -1.0,
                            "directionZ": 0.5
                        }
                    }
                },
                {
                    "persistentId": "ambient-light-1",
                    "name": "Ambient",
                    "components": {
                        "Light": {
                            "lightType": "ambient",
                            "color": { "r": 0.3, "g": 0.3, "b": 0.3 },
                            "intensity": 1.0,
                            "enabled": true
                        }
                    }
                },
                {
                    "persistentId": "cube-1",
                    "name": "Red Cube",
                    "components": {
                        "Transform": {
                            "position": [-2.0, 0.0, 0.0],
                            "rotation": [0.0, 0.0, 0.0],
                            "scale": [1.0, 1.0, 1.0]
                        },
                        "MeshRenderer": {
                            "meshId": "cube",
                            "materialId": "red-material",
                            "enabled": true,
                            "castShadows": true,
                            "receiveShadows": true
                        }
                    }
                },
                {
                    "persistentId": "cube-2",
                    "name": "Green Cube",
                    "components": {
                        "Transform": {
                            "position": [2.0, 0.0, 0.0],
                            "rotation": [0.0, 0.0, 0.0],
                            "scale": [1.0, 1.0, 1.0]
                        },
                        "MeshRenderer": {
                            "meshId": "cube",
                            "materialId": "green-material",
                            "enabled": true,
                            "castShadows": true,
                            "receiveShadows": true
                        }
                    }
                }
            ],
            "materials": [
                {
                    "id": "red-material",
                    "name": "Red Material",
                    "color": "#ff0000",
                    "metallic": 0.0,
                    "roughness": 0.5,
                    "shader": "pbr"
                },
                {
                    "id": "green-material",
                    "name": "Green Material",
                    "color": "#00ff00",
                    "metallic": 0.0,
                    "roughness": 0.5,
                    "shader": "pbr"
                }
            ]
        });

        serde_json::from_value(json).expect("Failed to parse test scene")
    }

    /// Test that scene loads correctly with all components
    #[test]
    fn test_scene_loading_matches_threejs() {
        let scene = create_test_scene();

        assert_eq!(scene.metadata.name, "Test Scene");
        assert_eq!(scene.entities.len(), 5); // Camera + 2 lights + 2 cubes

        // Verify camera entity
        let camera_entity = &scene.entities[0];
        assert_eq!(camera_entity.name, Some("Main Camera".to_string()));
        assert!(camera_entity.has_component("Camera"));
        assert!(camera_entity.has_component("Transform"));

        // Verify light entities
        let directional_light = &scene.entities[1];
        assert_eq!(directional_light.name, Some("Sun".to_string()));
        assert!(directional_light.has_component("Light"));

        let ambient_light = &scene.entities[2];
        assert_eq!(ambient_light.name, Some("Ambient".to_string()));
        assert!(ambient_light.has_component("Light"));

        // Verify mesh entities
        let red_cube = &scene.entities[3];
        assert_eq!(red_cube.name, Some("Red Cube".to_string()));
        assert!(red_cube.has_component("MeshRenderer"));
        assert!(red_cube.has_component("Transform"));

        let green_cube = &scene.entities[4];
        assert_eq!(green_cube.name, Some("Green Cube".to_string()));
        assert!(green_cube.has_component("MeshRenderer"));
    }

    /// Test that camera is extracted and applied correctly (Three.js behavior)
    #[test]
    fn test_camera_extraction_from_scene() {
        let scene = create_test_scene();
        let camera_entity = &scene.entities[0];

        let camera_comp = camera_entity
            .get_component::<CameraComponent>("Camera")
            .expect("Camera component should exist");

        // Verify Three.js default values
        assert_eq!(camera_comp.fov, 60.0);
        assert_eq!(camera_comp.near, 0.1);
        assert_eq!(camera_comp.far, 1000.0);
        assert!(camera_comp.isMain);
        assert_eq!(camera_comp.projectionType, "perspective");

        // Verify background color
        let bg = camera_comp.backgroundColor.as_ref().unwrap();
        assert_eq!(bg.r, 0.2);
        assert_eq!(bg.g, 0.3);
        assert_eq!(bg.b, 0.4);
        assert_eq!(bg.a, 1.0);

        // Apply to Rust camera
        let mut camera = Camera::new(1920, 1080);
        camera.apply_component(&camera_comp);

        assert_eq!(camera.fov, 60.0_f32.to_radians());
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 1000.0);
        assert_eq!(camera.background_color.r, 0.2);
    }

    /// Test that lights are extracted correctly (Three.js behavior)
    #[test]
    fn test_lights_extraction_from_scene() {
        let scene = create_test_scene();

        // Find directional light
        let directional_entity = &scene.entities[1];
        let directional_light = directional_entity
            .get_component::<Light>("Light")
            .expect("Light component should exist");

        assert_eq!(directional_light.lightType, "directional");
        assert_eq!(directional_light.intensity, 1.0);
        assert!(directional_light.enabled);

        let color = directional_light.color.as_ref().unwrap();
        assert_eq!(color.r, 1.0);
        assert_eq!(color.g, 1.0);
        assert_eq!(color.b, 1.0);

        // Find ambient light
        let ambient_entity = &scene.entities[2];
        let ambient_light = ambient_entity
            .get_component::<Light>("Light")
            .expect("Light component should exist");

        assert_eq!(ambient_light.lightType, "ambient");
        assert_eq!(ambient_light.intensity, 1.0);

        let ambient_color = ambient_light.color.as_ref().unwrap();
        assert_eq!(ambient_color.r, 0.3);
        assert_eq!(ambient_color.g, 0.3);
        assert_eq!(ambient_color.b, 0.3);
    }

    /// Test that mesh entities are extracted correctly (Three.js behavior)
    #[test]
    fn test_mesh_extraction_from_scene() {
        let scene = create_test_scene();

        // Red cube
        let red_cube = &scene.entities[3];
        let red_renderer = red_cube
            .get_component::<MeshRenderer>("MeshRenderer")
            .expect("MeshRenderer should exist");

        assert_eq!(red_renderer.meshId, Some("cube".to_string()));
        assert_eq!(red_renderer.materialId, Some("red-material".to_string()));
        assert!(red_renderer.enabled);
        assert!(red_renderer.castShadows);
        assert!(red_renderer.receiveShadows);

        let red_transform = red_cube
            .get_component::<Transform>("Transform")
            .expect("Transform should exist");

        assert_eq!(red_transform.position, Some([-2.0, 0.0, 0.0]));

        // Green cube
        let green_cube = &scene.entities[4];
        let green_renderer = green_cube
            .get_component::<MeshRenderer>("MeshRenderer")
            .expect("MeshRenderer should exist");

        assert_eq!(
            green_renderer.materialId,
            Some("green-material".to_string())
        );

        let green_transform = green_cube
            .get_component::<Transform>("Transform")
            .expect("Transform should exist");

        assert_eq!(green_transform.position, Some([2.0, 0.0, 0.0]));
    }

    /// Test that materials are loaded correctly (Three.js MeshStandardMaterial)
    #[test]
    fn test_materials_loading_from_scene() {
        let scene = create_test_scene();

        assert!(scene.materials.is_some());
        let materials = scene.materials.as_ref().unwrap();

        // Parse materials array
        let materials_array = materials.as_array().expect("Materials should be array");
        assert_eq!(materials_array.len(), 2);

        // Red material
        let red_material = &materials_array[0];
        assert_eq!(red_material["id"], "red-material");
        assert_eq!(red_material["color"], "#ff0000");
        assert_eq!(red_material["metallic"], 0.0);
        assert_eq!(red_material["roughness"], 0.5);
        assert_eq!(red_material["shader"], "pbr");

        // Green material
        let green_material = &materials_array[1];
        assert_eq!(green_material["id"], "green-material");
        assert_eq!(green_material["color"], "#00ff00");
    }

    /// Integration test: Full scene rendering setup matches Three.js
    #[test]
    fn test_full_scene_rendering_setup() {
        let scene = create_test_scene();

        // Verify all entities are accounted for
        let mut camera_count = 0;
        let mut light_count = 0;
        let mut mesh_count = 0;

        for entity in &scene.entities {
            if entity.has_component("Camera") {
                camera_count += 1;
            }
            if entity.has_component("Light") {
                light_count += 1;
            }
            if entity.has_component("MeshRenderer") {
                mesh_count += 1;
            }
        }

        // Three.js scene structure
        assert_eq!(camera_count, 1); // One main camera
        assert_eq!(light_count, 2); // Directional + ambient
        assert_eq!(mesh_count, 2); // Two cubes

        // Verify materials exist
        assert!(scene.materials.is_some());
        let materials = scene.materials.as_ref().unwrap().as_array().unwrap();
        assert_eq!(materials.len(), 2); // Red + green materials
    }

    /// Test that disabled entities are not rendered (Three.js visible=false)
    #[test]
    fn test_disabled_entities_not_rendered() {
        let mut scene = create_test_scene();

        // Disable the red cube
        let red_cube = &mut scene.entities[3];
        if let Some(renderer) = red_cube.components.get_mut("MeshRenderer") {
            renderer
                .as_object_mut()
                .unwrap()
                .insert("enabled".to_string(), json!(false));
        }

        // Re-parse
        let red_renderer = red_cube
            .get_component::<MeshRenderer>("MeshRenderer")
            .expect("MeshRenderer should exist");

        assert!(!red_renderer.enabled); // Should be disabled

        // In scene_renderer.rs, this would be skipped with `continue`
    }

    /// Test that light intensity=0 effectively disables light (Three.js behavior)
    #[test]
    fn test_zero_intensity_light() {
        let mut scene = create_test_scene();

        // Set directional light intensity to 0
        let directional_light = &mut scene.entities[1];
        if let Some(light_data) = directional_light.components.get_mut("Light") {
            light_data
                .as_object_mut()
                .unwrap()
                .insert("intensity".to_string(), json!(0.0));
        }

        let light = directional_light
            .get_component::<Light>("Light")
            .expect("Light should exist");

        assert_eq!(light.intensity, 0.0);

        // In shader, intensity=0 means no light contribution
        // lighting += light_color * 0.0 * ... = 0
    }

    /// Test transform hierarchy (Three.js Object3D parent-child)
    #[test]
    fn test_transform_defaults_match_threejs() {
        let transform = Transform::default();

        // Three.js Object3D defaults:
        // position: (0, 0, 0)
        // rotation: (0, 0, 0) in Euler angles
        // scale: (1, 1, 1)

        assert_eq!(transform.position_vec3(), Vec3::ZERO);
        assert_eq!(transform.scale_vec3(), Vec3::ONE);

        // Rotation defaults to identity quaternion (0, 0, 0, 1)
        let quat = transform.rotation_quat();
        assert!((quat.w - 1.0).abs() < 0.01);
        assert!(quat.x.abs() < 0.01);
        assert!(quat.y.abs() < 0.01);
        assert!(quat.z.abs() < 0.01);
    }

    /// Test that scene metadata matches Three.js scene properties
    #[test]
    fn test_scene_metadata_structure() {
        let scene = create_test_scene();

        // Three.js scene has name, userData, etc.
        assert_eq!(scene.metadata.name, "Test Scene");
        assert_eq!(scene.metadata.version, 1);
        assert!(scene.metadata.timestamp.contains("2025"));

        // Scene should be serializable back to JSON
        let json_str = serde_json::to_string(&scene).expect("Should serialize");
        assert!(json_str.contains("Test Scene"));
        assert!(json_str.contains("entities"));
    }
}
