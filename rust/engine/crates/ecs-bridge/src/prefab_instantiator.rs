use crate::decoders::{PrefabDefinition, PrefabEntity};
use crate::ComponentRegistry;
use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use vibe_scene::Entity;

/// Apply override patch to a prefab entity (deep merge)
pub fn apply_override_patch(entity: &mut PrefabEntity, patch: &Value) -> Result<()> {
    if let Some(patch_obj) = patch.as_object() {
        for (key, patch_value) in patch_obj {
            // Skip children for now (handled separately if needed)
            if key == "children" {
                continue;
            }

            // Merge into components
            if let Some(component_value) = entity.components.get_mut(key) {
                // Deep merge the component
                merge_json(component_value, patch_value);
            } else {
                // Add new component from patch
                entity.components.insert(key.clone(), patch_value.clone());
            }
        }
    }
    Ok(())
}

/// Deep merge JSON values (patch overrides original)
fn merge_json(original: &mut Value, patch: &Value) {
    match (original, patch) {
        (Value::Object(orig_map), Value::Object(patch_map)) => {
            for (key, patch_value) in patch_map {
                if let Some(orig_value) = orig_map.get_mut(key) {
                    merge_json(orig_value, patch_value);
                } else {
                    orig_map.insert(key.clone(), patch_value.clone());
                }
            }
        }
        (orig, patch) => {
            // Replace original with patch for non-objects
            *orig = patch.clone();
        }
    }
}

/// Compose transforms with proper semantics for prefab instantiation
/// - Position: Use instance position (places the prefab)
/// - Rotation: Use instance rotation (orients the prefab)
/// - Scale: Multiply component-wise (scales the prefab)
fn compose_transforms(prefab_transform: &mut Value, instance_transform: &Value) {
    let prefab_obj = match prefab_transform.as_object_mut() {
        Some(obj) => obj,
        None => return,
    };

    let instance_obj = match instance_transform.as_object() {
        Some(obj) => obj,
        None => return,
    };

    // Position: Use instance position if present
    if let Some(instance_pos) = instance_obj.get("position") {
        prefab_obj.insert("position".to_string(), instance_pos.clone());
    }

    // Rotation: Use instance rotation if present
    if let Some(instance_rot) = instance_obj.get("rotation") {
        prefab_obj.insert("rotation".to_string(), instance_rot.clone());
    }

    // Scale: Multiply component-wise if both present
    if let Some(instance_scale) = instance_obj.get("scale").and_then(|v| v.as_array()) {
        if let Some(prefab_scale) = prefab_obj.get("scale").and_then(|v| v.as_array()) {
            // Both have scale - multiply component-wise
            if instance_scale.len() == 3 && prefab_scale.len() == 3 {
                let composed_scale = vec![
                    Value::from(
                        instance_scale[0].as_f64().unwrap_or(1.0)
                            * prefab_scale[0].as_f64().unwrap_or(1.0),
                    ),
                    Value::from(
                        instance_scale[1].as_f64().unwrap_or(1.0)
                            * prefab_scale[1].as_f64().unwrap_or(1.0),
                    ),
                    Value::from(
                        instance_scale[2].as_f64().unwrap_or(1.0)
                            * prefab_scale[2].as_f64().unwrap_or(1.0),
                    ),
                ];
                prefab_obj.insert("scale".to_string(), Value::Array(composed_scale));
            }
        } else {
            // Prefab has no scale, use instance scale
            prefab_obj.insert("scale".to_string(), Value::Array(instance_scale.clone()));
        }
    }
    // If instance has no scale, keep prefab's scale (do nothing)
}

/// Instantiate a prefab and return the created entities
pub fn instantiate_prefab(
    prefab: &PrefabDefinition,
    parent_persistent_id: Option<String>,
    override_patch: Option<&Value>,
    instance_transform: Option<&Value>,
    instance_uuid: &str,
    _registry: &ComponentRegistry,
) -> Result<Vec<Entity>> {
    let mut entities = Vec::new();
    let mut next_id = 0u32;

    // Clone the prefab root
    let mut root_entity = prefab.root.clone();

    // First, compose instance transform with prefab root transform (if provided)
    // This positions the prefab at the instance location while preserving prefab's internal scale
    if let Some(instance_transform) = instance_transform {
        if let Some(root_transform) = root_entity.components.get_mut("Transform") {
            // Compose transforms with proper semantics (don't just merge)
            compose_transforms(root_transform, instance_transform);
        } else {
            // No Transform on root, add the instance transform directly
            root_entity
                .components
                .insert("Transform".to_string(), instance_transform.clone());
        }
    }

    // Create entities from the prefab hierarchy
    // Pass override patch through recursion so it applies to ALL entities, not just root
    instantiate_entity_recursive(
        &root_entity,
        parent_persistent_id,
        &mut entities,
        &mut next_id,
        instance_uuid,
        override_patch,
    )?;

    Ok(entities)
}

/// Recursively instantiate entities from prefab hierarchy
fn instantiate_entity_recursive(
    prefab_entity: &PrefabEntity,
    parent_persistent_id: Option<String>,
    entities: &mut Vec<Entity>,
    next_id: &mut u32,
    instance_uuid: &str,
    override_patch: Option<&Value>,
) -> Result<String> {
    // Generate unique persistent ID using instance UUID to avoid collisions
    // across multiple instantiations of the same prefab
    let persistent_id = format!("{}-{}", instance_uuid, *next_id);
    *next_id += 1;

    // Clone entity and apply override patch to THIS entity
    let mut entity_data = prefab_entity.clone();
    if let Some(patch) = override_patch {
        apply_override_patch(&mut entity_data, patch)?;
    }

    // Create the entity with potentially overridden components
    let entity = Entity {
        id: Some(*next_id),
        persistent_id: Some(persistent_id.clone()),
        name: Some(entity_data.name.clone()),
        parent_persistent_id: parent_persistent_id,
        tags: entity_data.tags.clone(),
        components: entity_data.components.clone(),
    };

    entities.push(entity);

    // Recursively instantiate children with same override patch
    for child in &prefab_entity.children {
        instantiate_entity_recursive(
            child,
            Some(persistent_id.clone()),
            entities,
            next_id,
            instance_uuid,
            override_patch,
        )?;
    }

    Ok(persistent_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_apply_override_patch_simple() {
        let mut entity = PrefabEntity {
            name: "TestEntity".to_string(),
            tags: vec![],
            components: {
                let mut map = HashMap::new();
                map.insert(
                    "Transform".to_string(),
                    json!({ "position": [0, 0, 0], "scale": [1, 1, 1] }),
                );
                map.insert(
                    "MeshRenderer".to_string(),
                    json!({ "materialId": "default" }),
                );
                map
            },
            children: Vec::new(),
        };

        let patch = json!({
            "Transform": { "scale": [2, 2, 2] },
            "MeshRenderer": { "materialId": "red" }
        });

        apply_override_patch(&mut entity, &patch).unwrap();

        // Check overrides applied
        let transform = &entity.components["Transform"];
        assert_eq!(transform["position"], json!([0, 0, 0])); // Unchanged
        assert_eq!(transform["scale"], json!([2, 2, 2])); // Overridden

        let mesh_renderer = &entity.components["MeshRenderer"];
        assert_eq!(mesh_renderer["materialId"], json!("red")); // Overridden
    }

    #[test]
    fn test_apply_override_patch_add_component() {
        let mut entity = PrefabEntity {
            name: "TestEntity".to_string(),
            tags: vec![],
            components: {
                let mut map = HashMap::new();
                map.insert("Transform".to_string(), json!({ "position": [0, 0, 0] }));
                map
            },
            children: Vec::new(),
        };

        let patch = json!({
            "Light": { "lightType": "directional", "intensity": 1.0 }
        });

        apply_override_patch(&mut entity, &patch).unwrap();

        // Check new component added
        assert!(entity.components.contains_key("Light"));
        assert_eq!(
            entity.components["Light"]["lightType"],
            json!("directional")
        );
    }

    #[test]
    fn test_merge_json_deep() {
        let mut original = json!({
            "a": 1,
            "b": {
                "c": 2,
                "d": 3
            }
        });

        let patch = json!({
            "b": {
                "d": 4,
                "e": 5
            },
            "f": 6
        });

        merge_json(&mut original, &patch);

        assert_eq!(original["a"], json!(1)); // Unchanged
        assert_eq!(original["b"]["c"], json!(2)); // Unchanged
        assert_eq!(original["b"]["d"], json!(4)); // Overridden
        assert_eq!(original["b"]["e"], json!(5)); // Added
        assert_eq!(original["f"], json!(6)); // Added
    }

    #[test]
    fn test_instantiate_prefab_simple() {
        let prefab = PrefabDefinition {
            id: "simple-cube".to_string(),
            name: "Simple Cube".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Cube".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert(
                        "Transform".to_string(),
                        json!({ "position": [0, 0, 0], "scale": [1, 1, 1] }),
                    );
                    map.insert(
                        "MeshRenderer".to_string(),
                        json!({ "meshId": "cube", "materialId": "default" }),
                    );
                    map
                },
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        let registry = ComponentRegistry::new();
        let entities =
            instantiate_prefab(&prefab, None, None, None, "test-instance-1", &registry).unwrap();

        assert_eq!(entities.len(), 1);
        assert_eq!(entities[0].name, Some("Cube".to_string()));
        assert!(entities[0].persistent_id.is_some());
        assert!(entities[0].components.contains_key("Transform"));
        assert!(entities[0].components.contains_key("MeshRenderer"));
    }

    #[test]
    fn test_instantiate_prefab_with_override() {
        let prefab = PrefabDefinition {
            id: "colored-cube".to_string(),
            name: "Colored Cube".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Cube".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert("Transform".to_string(), json!({ "scale": [1, 1, 1] }));
                    map.insert(
                        "MeshRenderer".to_string(),
                        json!({ "meshId": "cube", "materialId": "default" }),
                    );
                    map
                },
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        let patch = json!({
            "Transform": { "scale": [2, 2, 2] },
            "MeshRenderer": { "materialId": "red" }
        });

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            None,
            Some(&patch),
            None,
            "test-instance-2",
            &registry,
        )
        .unwrap();

        assert_eq!(entities.len(), 1);

        // Check overrides applied
        let transform = &entities[0].components["Transform"];
        assert_eq!(transform["scale"], json!([2, 2, 2]));

        let mesh_renderer = &entities[0].components["MeshRenderer"];
        assert_eq!(mesh_renderer["materialId"], json!("red"));
    }

    #[test]
    fn test_instantiate_prefab_with_hierarchy() {
        let prefab = PrefabDefinition {
            id: "tree".to_string(),
            name: "Tree".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Trunk".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert(
                        "Transform".to_string(),
                        json!({ "position": [0, 0, 0], "scale": [0.5, 2, 0.5] }),
                    );
                    map.insert(
                        "MeshRenderer".to_string(),
                        json!({ "meshId": "cylinder", "materialId": "brown" }),
                    );
                    map
                },
                children: vec![PrefabEntity {
                    name: "Leaves".to_string(),
                    tags: vec![],
                    components: {
                        let mut map = HashMap::new();
                        map.insert(
                            "Transform".to_string(),
                            json!({ "position": [0, 2, 0], "scale": [2, 2, 2] }),
                        );
                        map.insert(
                            "MeshRenderer".to_string(),
                            json!({ "meshId": "sphere", "materialId": "green" }),
                        );
                        map
                    },
                    children: Vec::new(),
                }],
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            Some("parent-1".to_string()),
            None,
            None,
            "test-instance-3",
            &registry,
        )
        .unwrap();

        // Should create 2 entities: trunk and leaves
        assert_eq!(entities.len(), 2);

        // First entity (trunk)
        assert_eq!(entities[0].name, Some("Trunk".to_string()));
        assert_eq!(
            entities[0].parent_persistent_id,
            Some("parent-1".to_string())
        );

        // Second entity (leaves) should be child of trunk
        assert_eq!(entities[1].name, Some("Leaves".to_string()));
        assert_eq!(entities[1].parent_persistent_id, entities[0].persistent_id);
    }

    #[test]
    fn test_instantiate_prefab_deep_hierarchy() {
        let prefab = PrefabDefinition {
            id: "nested".to_string(),
            name: "Nested".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Level1".to_string(),
                tags: vec![],
                components: HashMap::new(),
                children: vec![PrefabEntity {
                    name: "Level2".to_string(),
                    tags: vec![],
                    components: HashMap::new(),
                    children: vec![PrefabEntity {
                        name: "Level3".to_string(),
                        tags: vec![],
                        components: HashMap::new(),
                        children: Vec::new(),
                    }],
                }],
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        let registry = ComponentRegistry::new();
        let entities =
            instantiate_prefab(&prefab, None, None, None, "test-instance-4", &registry).unwrap();

        // Should create 3 entities
        assert_eq!(entities.len(), 3);
        assert_eq!(entities[0].name, Some("Level1".to_string()));
        assert_eq!(entities[1].name, Some("Level2".to_string()));
        assert_eq!(entities[2].name, Some("Level3".to_string()));

        // Check hierarchy
        assert!(entities[0].parent_persistent_id.is_none()); // Level1 has no parent
        assert_eq!(entities[1].parent_persistent_id, entities[0].persistent_id); // Level2 parent is Level1
        assert_eq!(entities[2].parent_persistent_id, entities[1].persistent_id);
        // Level3 parent is Level2
    }

    #[test]
    fn test_instantiate_prefab_with_instance_transform() {
        // Prefab root at [0, 0, 0] with scale [0.5, 2, 0.5], instance at [-3, 0, 0]
        let prefab = PrefabDefinition {
            id: "tree-trunk".to_string(),
            name: "Tree Trunk".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Trunk".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert(
                        "Transform".to_string(),
                        json!({ "position": [0, 0, 0], "scale": [0.5, 2.0, 0.5] }),
                    );
                    map
                },
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        // Instance transform positions it at [-3, 0, 0] with scale [2, 2, 2]
        // Final scale should be [0.5*2, 2*2, 0.5*2] = [1, 4, 1]
        let instance_transform = json!({
            "position": [-3.0, 0.0, 0.0],
            "rotation": [0.0, 45.0, 0.0],
            "scale": [2.0, 2.0, 2.0]
        });

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            None,
            None,
            Some(&instance_transform),
            "test-instance-6",
            &registry,
        )
        .unwrap();

        assert_eq!(entities.len(), 1);

        // Check that instance transform was composed with prefab transform
        let transform = &entities[0].components["Transform"];
        assert_eq!(transform["position"], json!([-3.0, 0.0, 0.0])); // Instance position
        assert_eq!(transform["rotation"], json!([0.0, 45.0, 0.0])); // Instance rotation
        assert_eq!(transform["scale"], json!([1.0, 4.0, 1.0])); // Multiplied: [0.5*2, 2*2, 0.5*2]
    }

    #[test]
    fn test_instantiate_prefab_with_identity_scale() {
        // Test that instance scale [1, 1, 1] preserves prefab's internal scale
        let prefab = PrefabDefinition {
            id: "tree-trunk".to_string(),
            name: "Tree Trunk".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Trunk".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert(
                        "Transform".to_string(),
                        json!({ "position": [0, 0, 0], "scale": [0.5, 2.0, 0.5] }),
                    );
                    map
                },
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        // Instance with identity scale should preserve prefab scale [0.5, 2, 0.5]
        let instance_transform = json!({
            "position": [-3.0, 0.0, 0.0],
            "scale": [1.0, 1.0, 1.0]
        });

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            None,
            None,
            Some(&instance_transform),
            "test-instance-5",
            &registry,
        )
        .unwrap();

        assert_eq!(entities.len(), 1);

        // Check that prefab's scale is preserved when instance has identity scale
        let transform = &entities[0].components["Transform"];
        assert_eq!(transform["position"], json!([-3.0, 0.0, 0.0])); // Instance position
        assert_eq!(transform["scale"], json!([0.5, 2.0, 0.5])); // Prefab scale preserved (0.5*1, 2*1, 0.5*1)
    }

    #[test]
    fn test_instantiate_prefab_instance_transform_and_override() {
        // Test that instance transform is applied first, then override patch
        let prefab = PrefabDefinition {
            id: "cube".to_string(),
            name: "Cube".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Cube".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert("Transform".to_string(), json!({ "position": [0, 0, 0] }));
                    map.insert(
                        "MeshRenderer".to_string(),
                        json!({ "materialId": "default" }),
                    );
                    map
                },
                children: Vec::new(),
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        // Instance transform sets position
        let instance_transform = json!({ "position": [5.0, 0.0, 0.0] });

        // Override patch changes material and adds scale
        let override_patch = json!({
            "Transform": { "scale": [2.0, 2.0, 2.0] },
            "MeshRenderer": { "materialId": "red" }
        });

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            None,
            Some(&override_patch),
            Some(&instance_transform),
            "test-instance-7",
            &registry,
        )
        .unwrap();

        assert_eq!(entities.len(), 1);

        // Should have both instance position and override scale
        let transform = &entities[0].components["Transform"];
        assert_eq!(transform["position"], json!([5.0, 0.0, 0.0])); // From instance
        assert_eq!(transform["scale"], json!([2.0, 2.0, 2.0])); // From override

        // Material override should work
        let mesh_renderer = &entities[0].components["MeshRenderer"];
        assert_eq!(mesh_renderer["materialId"], json!("red"));
    }

    #[test]
    fn test_instantiate_prefab_override_applies_to_children() {
        // Test that override patch applies to ALL entities in hierarchy, not just root
        let prefab = PrefabDefinition {
            id: "tree".to_string(),
            name: "Tree".to_string(),
            version: 1,
            root: PrefabEntity {
                name: "Trunk".to_string(),
                tags: vec![],
                components: {
                    let mut map = HashMap::new();
                    map.insert("Transform".to_string(), json!({ "position": [0, 0, 0] }));
                    map.insert(
                        "MeshRenderer".to_string(),
                        json!({ "meshId": "cube", "materialId": "brown" }),
                    );
                    map
                },
                children: vec![PrefabEntity {
                    name: "Leaves".to_string(),
                    tags: vec![],
                    components: {
                        let mut map = HashMap::new();
                        map.insert("Transform".to_string(), json!({ "position": [0, 2.5, 0] }));
                        map.insert(
                            "MeshRenderer".to_string(),
                            json!({ "meshId": "sphere", "materialId": "green" }),
                        );
                        map
                    },
                    children: Vec::new(),
                }],
            },
            metadata: HashMap::new(),
            dependencies: Vec::new(),
            tags: Vec::new(),
            description: None,
        };

        // Override patch should change material on BOTH trunk and leaves
        let override_patch = json!({
            "MeshRenderer": { "materialId": "red" }
        });

        let registry = ComponentRegistry::new();
        let entities = instantiate_prefab(
            &prefab,
            None,
            Some(&override_patch),
            None,
            "test-instance-8",
            &registry,
        )
        .unwrap();

        assert_eq!(entities.len(), 2); // Trunk + Leaves

        // Both entities should have red material (override applied recursively)
        let trunk_material = &entities[0].components["MeshRenderer"];
        assert_eq!(trunk_material["meshId"], json!("cube"));
        assert_eq!(trunk_material["materialId"], json!("red")); // Overridden

        let leaves_material = &entities[1].components["MeshRenderer"];
        assert_eq!(leaves_material["meshId"], json!("sphere"));
        assert_eq!(leaves_material["materialId"], json!("red")); // Overridden (not "green")
    }
}
