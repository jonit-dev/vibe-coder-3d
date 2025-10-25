use std::collections::HashSet;
use vibe_ecs_bridge::decoders::create_default_registry;
use vibe_scene::Scene as SceneData;

/// Extract unknown field name from serde error message
/// Example: "unknown field `foo`, expected one of ..." -> "foo"
fn extract_unknown_field(error_msg: &str) -> Option<&str> {
    error_msg.split("unknown field `").nth(1)?.split('`').next()
}

/// Extract missing field name from serde error message
/// Example: "missing field `bar`" -> "bar"
fn extract_missing_field(error_msg: &str) -> Option<&str> {
    error_msg.split("missing field `").nth(1)?.split('`').next()
}

/// Validate a scene and log warnings for unimplemented components/properties
pub fn validate_scene(scene: &SceneData) {
    let registry = create_default_registry();
    let mut unimplemented_components = HashSet::new();
    let mut entity_warnings = Vec::new();

    log::info!(
        "Validating scene '{}' with {} entities...",
        scene.name,
        scene.entities.len()
    );

    for entity in &scene.entities {
        let entity_name = entity.name.as_deref().unwrap_or("<unnamed>");

        for (component_type, component_value) in &entity.components {
            // Check if this component type is implemented in Rust
            if !registry.has_decoder(component_type) {
                unimplemented_components.insert(component_type.clone());
                entity_warnings.push(format!(
                    "Entity '{}': Component '{}' is not implemented in Rust engine yet",
                    entity_name, component_type
                ));
            } else {
                // Component is implemented - check for unimplemented properties
                // Serde will error on unknown fields if the struct has #[serde(deny_unknown_fields)]
                // But we want to be more lenient and just warn
                match registry.decode(component_type, component_value) {
                    Ok(_) => {
                        // Successfully decoded - but let's check for extra fields
                        // that weren't consumed by the decoder
                        if let Some(obj) = component_value.as_object() {
                            // Get the expected fields by attempting to decode again
                            // and checking serialization round-trip
                            // This is a heuristic - actual field checking would require schema reflection
                            if obj.len() > 20 {
                                // If component has many fields, some might be unimplemented
                                log::debug!(
                                    "Entity '{}': Component '{}' has {} properties (some may be unimplemented in Rust)",
                                    entity_name,
                                    component_type,
                                    obj.len()
                                );
                            }
                        }
                    }
                    Err(e) => {
                        // Decode failed - check if it's due to unknown/missing fields
                        let error_msg = e.to_string();
                        if error_msg.contains("unknown field") {
                            // Extract the unknown field name from error message
                            log::warn!(
                                "Entity '{}': Component '{}' has unimplemented property: {}",
                                entity_name,
                                component_type,
                                extract_unknown_field(&error_msg).unwrap_or(&error_msg)
                            );
                        } else if error_msg.contains("missing field") {
                            log::warn!(
                                "Entity '{}': Component '{}' is missing required field: {}",
                                entity_name,
                                component_type,
                                extract_missing_field(&error_msg).unwrap_or(&error_msg)
                            );
                        } else {
                            log::warn!(
                                "Entity '{}': Failed to decode component '{}': {}",
                                entity_name,
                                component_type,
                                error_msg
                            );
                        }
                    }
                }
            }
        }
    }

    // Log summary of unimplemented components
    if !unimplemented_components.is_empty() {
        log::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::warn!("⚠️  UNIMPLEMENTED COMPONENTS DETECTED");
        log::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::warn!("");
        log::warn!(
            "The following {} component type(s) are present in the scene but not",
            unimplemented_components.len()
        );
        log::warn!("yet implemented in the Rust engine:");
        log::warn!("");

        let mut sorted: Vec<_> = unimplemented_components.iter().collect();
        sorted.sort();
        for component_type in sorted {
            log::warn!("  • {}", component_type);
        }

        log::warn!("");
        log::warn!("These components will be ignored during rendering.");
        log::warn!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    // Log detailed per-entity warnings if there are many
    if entity_warnings.len() > 10 {
        log::debug!(
            "Detailed component warnings ({} total):",
            entity_warnings.len()
        );
        for warning in entity_warnings.iter().take(10) {
            log::debug!("  {}", warning);
        }
        log::debug!("  ... and {} more warnings", entity_warnings.len() - 10);
    } else if !entity_warnings.is_empty() {
        log::debug!("Detailed component warnings:");
        for warning in &entity_warnings {
            log::debug!("  {}", warning);
        }
    }

    if unimplemented_components.is_empty() {
        log::info!("✓ All components in scene are implemented in Rust engine");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use vibe_scene::{Entity, Metadata, Scene};

    #[test]
    fn test_validate_scene_with_implemented_components() {
        let scene = Scene {
            version: 1,
            name: "Test Scene".to_string(),
            metadata: Some(json!({
                "name": "Test Scene",
                "version": 1,
                "timestamp": "2025-01-01T00:00:00Z"
            })),
            entities: vec![Entity {
                id: Some(1),
                persistent_id: Some("entity-1".to_string()),
                name: Some("Test Entity".to_string()),
                parent_persistent_id: None,
                tags: vec![],
                components: vec![(
                    "Transform".to_string(),
                    json!({
                        "position": [0.0, 0.0, 0.0],
                        "rotation": [0.0, 0.0, 0.0, 1.0],
                        "scale": [1.0, 1.0, 1.0]
                    }),
                )]
                .into_iter()
                .collect(),
            }],
            materials: vec![],
            inputAssets: None,
            lockedEntityIds: None,
        };

        // Should not panic and should log validation success
        validate_scene(&scene);
    }

    #[test]
    fn test_validate_scene_with_unimplemented_component() {
        let scene = Scene {
            version: 1,
            name: "Test Scene".to_string(),
            metadata: Some(json!({
                "name": "Test Scene",
                "version": 1,
                "timestamp": "2025-01-01T00:00:00Z"
            })),
            entities: vec![Entity {
                id: Some(1),
                persistent_id: Some("entity-1".to_string()),
                name: Some("Test Entity".to_string()),
                parent_persistent_id: None,
                tags: vec![],
                components: vec![(
                    "UnimplementedComponent".to_string(),
                    json!({
                        "someProperty": "someValue"
                    }),
                )]
                .into_iter()
                .collect(),
            }],
            materials: vec![],
            inputAssets: None,
            lockedEntityIds: None,
        };

        // Should not panic and should log warnings
        validate_scene(&scene);
    }
}
