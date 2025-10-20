/// CustomShape Component Integration Tests
/// Validates JSON → Rust deserialization and mesh generation
#[cfg(test)]
mod tests {
    use crate::decoders::{create_default_registry, CustomShape};
    use crate::IComponentDecoder;
    use serde_json::json;
    use vibe_assets::ProceduralShapeRegistry;

    #[test]
    fn test_deserialize_helix_from_json() {
        let registry = create_default_registry();
        let json_value = json!({
            "shapeId": "helix",
            "params": {
                "radius": 0.6,
                "height": 3.0,
                "tubeRadius": 0.15,
                "coils": 4.0,
                "segments": 64,
                "tubeSegments": 16
            }
        });

        let decoded = registry.decode("CustomShape", &json_value).unwrap();
        let custom_shape = decoded.downcast_ref::<CustomShape>().unwrap();

        assert_eq!(custom_shape.shape_id, "helix");
        assert!(custom_shape.params.is_object());

        // Verify params can be extracted
        let params = custom_shape.params.as_object().unwrap();
        assert_eq!(params.get("radius").unwrap().as_f64().unwrap(), 0.6);
        assert_eq!(params.get("height").unwrap().as_f64().unwrap(), 3.0);
        assert_eq!(params.get("tubeRadius").unwrap().as_f64().unwrap(), 0.15);
        assert_eq!(params.get("coils").unwrap().as_f64().unwrap(), 4.0);
        assert_eq!(params.get("segments").unwrap().as_u64().unwrap(), 64);
        assert_eq!(params.get("tubeSegments").unwrap().as_u64().unwrap(), 16);
    }

    #[test]
    fn test_deserialize_star_with_empty_params() {
        let registry = create_default_registry();
        let json_value = json!({
            "shapeId": "star",
            "params": {}
        });

        let decoded = registry.decode("CustomShape", &json_value).unwrap();
        let custom_shape = decoded.downcast_ref::<CustomShape>().unwrap();

        assert_eq!(custom_shape.shape_id, "star");
        assert!(custom_shape.params.is_object());
    }

    #[test]
    fn test_deserialize_all_15_shapes() {
        let registry = create_default_registry();

        let test_cases = vec![
            // Math shapes
            ("helix", json!({"radius": 0.5, "height": 2.0, "tubeRadius": 0.1, "coils": 3.0, "segments": 32, "tubeSegments": 8})),
            ("mobiusstrip", json!({"radius": 0.5, "width": 0.3, "segments": 64})),
            ("torusknot", json!({"radius": 0.5, "tube": 0.15, "tubularSegments": 64, "radialSegments": 8, "p": 2, "q": 3})),

            // Decorative shapes
            ("star", json!({"outerRadius": 0.5, "innerRadius": 0.25, "points": 5, "thickness": 0.2})),
            ("heart", json!({"size": 0.5, "depth": 0.2, "segments": 32})),
            ("diamond", json!({"radius": 0.4, "height": 0.8, "tableRatio": 0.6, "facets": 8})),
            ("cross", json!({"armLength": 0.8, "armWidth": 0.2})),
            ("tube", json!({"radius": 1.0, "tubeRadius": 0.2, "radialSegments": 32, "tubularSegments": 64})),

            // Structural shapes
            ("ramp", json!({"width": 1.0, "height": 1.0, "depth": 1.0})),
            ("stairs", json!({"width": 1.0, "height": 1.0, "depth": 1.0, "numSteps": 5})),
            ("spiralstairs", json!({"radius": 0.8, "height": 2.0, "numSteps": 10, "turns": 1.0})),

            // Environment shapes
            ("tree", json!({"trunkRadius": 0.1, "trunkHeight": 1.0, "foliageRadius": 0.5, "foliageHeight": 1.0, "segments": 8})),
            ("rock", json!({"radius": 0.5, "irregularity": 0.3, "segments": 16})),
            ("bush", json!({"radius": 0.5, "segments": 8})),
            ("grass", json!({"bladeWidth": 0.02, "bladeHeight": 0.3, "numBlades": 10})),
        ];

        for (shape_id, params) in test_cases {
            let json_value = json!({
                "shapeId": shape_id,
                "params": params
            });

            let decoded = registry
                .decode("CustomShape", &json_value)
                .unwrap_or_else(|e| panic!("Failed to decode {}: {}", shape_id, e));

            let custom_shape = decoded
                .downcast_ref::<CustomShape>()
                .unwrap_or_else(|| panic!("Failed to downcast {} to CustomShape", shape_id));

            assert_eq!(
                custom_shape.shape_id, shape_id,
                "Shape ID mismatch for {}",
                shape_id
            );
        }
    }

    #[test]
    fn test_end_to_end_helix_generation() {
        let component_registry = create_default_registry();
        let shape_registry = ProceduralShapeRegistry::new();

        // 1. Deserialize component from JSON (as TypeScript would send it)
        let json_value = json!({
            "shapeId": "helix",
            "params": {
                "radius": 0.6,
                "height": 3.0,
                "tubeRadius": 0.15,
                "coils": 4.0,
                "segments": 64,
                "tubeSegments": 16
            }
        });

        let decoded = component_registry.decode("CustomShape", &json_value).unwrap();
        let custom_shape = decoded.downcast_ref::<CustomShape>().unwrap();

        // 2. Generate mesh using shape registry
        let mesh = shape_registry
            .generate(&custom_shape.shape_id, &custom_shape.params)
            .unwrap();

        // 3. Verify mesh was generated
        assert!(mesh.vertices.len() > 0, "Mesh should have vertices");
        assert!(mesh.indices.len() > 0, "Mesh should have indices");

        // Helix should have many vertices due to tube segments
        assert!(
            mesh.vertices.len() >= 100,
            "Helix with 64 segments should have many vertices"
        );
    }

    #[test]
    fn test_end_to_end_all_shapes_generation() {
        let component_registry = create_default_registry();
        let shape_registry = ProceduralShapeRegistry::new();

        let test_cases = vec![
            ("helix", json!({"radius": 0.5, "height": 2.0, "tubeRadius": 0.1, "coils": 3.0, "segments": 32, "tubeSegments": 8})),
            ("mobiusstrip", json!({"radius": 0.5, "width": 0.3, "segments": 64})),
            ("torusknot", json!({"radius": 0.5, "tube": 0.15, "tubularSegments": 64, "radialSegments": 8, "p": 2, "q": 3})),
            ("star", json!({"outerRadius": 0.5, "innerRadius": 0.25, "points": 5, "thickness": 0.2})),
            ("heart", json!({"size": 0.5, "depth": 0.2, "segments": 32})),
            ("diamond", json!({"radius": 0.4, "height": 0.8, "tableRatio": 0.6, "facets": 8})),
            ("cross", json!({"armLength": 0.8, "armWidth": 0.2})),
            ("tube", json!({"radius": 1.0, "tubeRadius": 0.2, "radialSegments": 32, "tubularSegments": 64})),
            ("ramp", json!({"width": 1.0, "height": 1.0, "depth": 1.0})),
            ("stairs", json!({"width": 1.0, "height": 1.0, "depth": 1.0, "numSteps": 5})),
            ("spiralstairs", json!({"radius": 0.8, "height": 2.0, "numSteps": 10, "turns": 1.0})),
            ("tree", json!({"trunkRadius": 0.1, "trunkHeight": 1.0, "foliageRadius": 0.5, "foliageHeight": 1.0, "segments": 8})),
            ("rock", json!({"radius": 0.5, "irregularity": 0.3, "segments": 16})),
            ("bush", json!({"radius": 0.5, "segments": 8})),
            ("grass", json!({"bladeWidth": 0.02, "bladeHeight": 0.3, "numBlades": 10})),
        ];

        for (shape_id, params) in test_cases {
            let json_value = json!({
                "shapeId": shape_id,
                "params": params
            });

            // Deserialize component
            let decoded = component_registry
                .decode("CustomShape", &json_value)
                .unwrap_or_else(|e| panic!("Failed to decode {}: {}", shape_id, e));

            let custom_shape = decoded
                .downcast_ref::<CustomShape>()
                .unwrap_or_else(|| panic!("Failed to downcast {}", shape_id));

            // Generate mesh
            let mesh = shape_registry
                .generate(&custom_shape.shape_id, &custom_shape.params)
                .unwrap_or_else(|e| panic!("Failed to generate mesh for {}: {}", shape_id, e));

            // Verify mesh is valid
            assert!(
                mesh.vertices.len() > 0,
                "{} should have vertices",
                shape_id
            );
            assert!(
                mesh.indices.len() > 0,
                "{} should have indices",
                shape_id
            );
            assert!(
                mesh.indices.len() % 3 == 0,
                "{} indices should be multiple of 3 (triangles)",
                shape_id
            );
        }
    }

    #[test]
    fn test_camel_case_parameter_deserialization() {
        let shape_registry = ProceduralShapeRegistry::new();

        // Test that camelCase from TypeScript is properly handled
        let json_params = json!({
            "tubeRadius": 0.15,      // camelCase
            "tubeSegments": 16,      // camelCase
            "radius": 0.5,
            "height": 2.0,
            "coils": 3.0,
            "segments": 32
        });

        let mesh = shape_registry.generate("helix", &json_params).unwrap();

        assert!(mesh.vertices.len() > 0);
        assert!(mesh.indices.len() > 0);
    }

    #[test]
    fn test_parameter_defaults() {
        let shape_registry = ProceduralShapeRegistry::new();

        // Test with empty params - should use defaults
        let json_params = json!({});

        let mesh = shape_registry.generate("helix", &json_params).unwrap();

        assert!(mesh.vertices.len() > 0, "Should generate mesh with default params");
        assert!(mesh.indices.len() > 0, "Should generate valid indices with defaults");
    }

    #[test]
    fn test_invalid_shape_id() {
        let component_registry = create_default_registry();

        let json_value = json!({
            "shapeId": "invalid_shape_that_does_not_exist",
            "params": {}
        });

        // Should decode component successfully
        let decoded = component_registry.decode("CustomShape", &json_value).unwrap();
        let custom_shape = decoded.downcast_ref::<CustomShape>().unwrap();

        // But shape generation should fail
        let shape_registry = ProceduralShapeRegistry::new();
        let result = shape_registry.generate(&custom_shape.shape_id, &custom_shape.params);

        assert!(result.is_err(), "Should fail for invalid shape ID");
        if let Err(e) = result {
            let error_msg = e.to_string();
            assert!(
                error_msg.contains("Unknown shape ID") || error_msg.contains("Failed to parse parameters"),
                "Error should mention unknown shape or parse failure, got: {}",
                e
            );
        }
    }

    #[test]
    fn test_ramp_mesh_structure() {
        let shape_registry = ProceduralShapeRegistry::new();

        let json_params = json!({
            "width": 2.0,
            "height": 1.0,
            "depth": 1.5
        });

        let mesh = shape_registry.generate("ramp", &json_params).unwrap();

        // Ramp is a wedge shape with 6 unique positions but may have more vertices for proper normals
        assert!(mesh.vertices.len() >= 6, "Ramp should have at least 6 vertices");
        assert!(mesh.indices.len() >= 12, "Ramp should have at least 12 indices (4 triangles minimum)");
        assert_eq!(mesh.indices.len() % 3, 0, "Indices should form complete triangles");

        // All vertices should have unit normals
        for vertex in &mesh.vertices {
            let normal_length = (vertex.normal[0].powi(2)
                + vertex.normal[1].powi(2)
                + vertex.normal[2].powi(2))
            .sqrt();
            assert!(
                (normal_length - 1.0).abs() < 0.01,
                "Normals should be unit length, got length: {}",
                normal_length
            );
        }
    }

    #[test]
    fn test_mesh_indices_validity() {
        let shape_registry = ProceduralShapeRegistry::new();
        let json_params = json!({});

        let mesh = shape_registry.generate("star", &json_params).unwrap();

        // All indices should be within vertex count
        let vertex_count = mesh.vertices.len() as u32;
        for &index in &mesh.indices {
            assert!(
                index < vertex_count,
                "Index {} exceeds vertex count {}",
                index,
                vertex_count
            );
        }
    }

    #[test]
    fn test_component_capabilities() {
        use crate::decoders::CustomShapeDecoder;

        let decoder = CustomShapeDecoder;

        assert!(IComponentDecoder::can_decode(&decoder, "CustomShape"));
        assert!(!IComponentDecoder::can_decode(&decoder, "MeshRenderer"));
        assert!(!IComponentDecoder::can_decode(&decoder, "Transform"));

        let caps = IComponentDecoder::capabilities(&decoder);
        assert!(caps.affects_rendering, "CustomShape affects rendering");
        assert_eq!(caps.requires_pass, Some("geometry"), "Requires geometry pass");
        assert!(caps.stable, "API should be stable");
    }

    #[test]
    fn test_full_scene_entity_simulation() {
        // Simulate a full entity from a scene JSON
        let component_registry = create_default_registry();
        let shape_registry = ProceduralShapeRegistry::new();

        let entity_json = json!({
            "components": {
                "Transform": {
                    "position": [1.0, 2.0, 3.0],
                    "rotation": [0.0, 90.0, 0.0],  // Degrees (will be converted by transform utils)
                    "scale": [1.0, 1.0, 1.0]
                },
                "CustomShape": {
                    "shapeId": "ramp",
                    "params": {
                        "width": 2.0,
                        "height": 1.0,
                        "depth": 1.5
                    }
                }
            }
        });

        // Extract and decode CustomShape component
        let custom_shape_json = &entity_json["components"]["CustomShape"];
        let decoded = component_registry
            .decode("CustomShape", custom_shape_json)
            .unwrap();
        let custom_shape = decoded.downcast_ref::<CustomShape>().unwrap();

        // Generate mesh
        let mesh = shape_registry
            .generate(&custom_shape.shape_id, &custom_shape.params)
            .unwrap();

        // Verify mesh generation
        assert_eq!(custom_shape.shape_id, "ramp");
        assert!(mesh.vertices.len() > 0);
        assert!(mesh.indices.len() > 0);
    }
}
