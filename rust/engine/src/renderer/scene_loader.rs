/// Scene loading orchestration
///
/// Handles scene graph building, prefab instantiation, and entity processing orchestration.
/// The actual entity component loading (meshes, lights, cameras) is delegated to entity_loader.
use anyhow::Result;
use std::collections::HashSet;
use vibe_ecs_bridge::ComponentRegistry;
use vibe_scene::{Entity, EntityId, Scene as SceneData};
use vibe_scene_graph::SceneGraph;

/// Build scene graph from scene data
pub fn build_scene_graph(scene: &SceneData) -> Result<SceneGraph> {
    log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log::info!("SCENE GRAPH");
    log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    let scene_graph = SceneGraph::build(scene)?;
    log::info!(
        "Scene graph built with {} entities",
        scene_graph.entity_count()
    );
    Ok(scene_graph)
}

/// Process prefab definitions and instances
///
/// Returns: (updated_scene_graph, prefab_instance_entities)
pub fn process_prefabs(
    scene: &SceneData,
    component_registry: &ComponentRegistry,
) -> Result<(Option<SceneGraph>, Vec<Entity>)> {
    let mut prefab_registry = vibe_ecs_bridge::PrefabRegistry::new();
    let mut prefab_instances: Vec<Entity> = Vec::new();

    // Load and register prefabs (if any are embedded in the scene file)
    if let Some(prefabs_value) = &scene.prefabs {
        match vibe_ecs_bridge::parse_prefabs(prefabs_value) {
            Ok(prefabs) => {
                for prefab in prefabs {
                    log::info!("Registering prefab definition: {}", prefab.id);
                    prefab_registry.register(prefab);
                }
                log::info!(
                    "Registered {} prefab definition(s) from scene",
                    prefab_registry.count()
                );
            }
            Err(err) => {
                log::warn!("Failed to parse prefabs from scene: {}", err);
            }
        }
    } else {
        log::info!("Scene does not embed prefab definitions");
    }

    // Process PrefabInstance components and instantiate prefabs
    log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log::info!("PREFAB INSTANCES");
    log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for entity in &scene.entities {
        if let Some(prefab_instance) = get_component::<vibe_ecs_bridge::PrefabInstance>(
            entity,
            "PrefabInstance",
            component_registry,
        ) {
            log::info!("  Instantiating prefab: {}", prefab_instance.prefab_id);

            // Extract instance Transform to position the prefab
            let instance_transform = entity.components.get("Transform");

            match prefab_registry.get(&prefab_instance.prefab_id) {
                Some(prefab) => {
                    match vibe_ecs_bridge::instantiate_prefab(
                        prefab,
                        entity.persistent_id.clone(),
                        prefab_instance.override_patch.as_ref(),
                        instance_transform,
                        &prefab_instance.instance_uuid,
                        component_registry,
                    ) {
                        Ok(instances) => {
                            log::info!("    → Created {} entity/entities", instances.len());
                            prefab_instances.extend(instances);
                        }
                        Err(e) => {
                            log::warn!(
                                "    Failed to instantiate prefab {}: {}",
                                prefab_instance.prefab_id,
                                e
                            );
                        }
                    }
                }
                None => {
                    log::warn!("    Prefab not found: {}", prefab_instance.prefab_id);
                }
            }
        }
    }

    // Rebuild scene graph with prefab instances included
    let updated_scene_graph = if !prefab_instances.is_empty() {
        log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("REBUILDING SCENE GRAPH WITH PREFAB INSTANCES");
        log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log::info!("  Original entities: {}", scene.entities.len());
        log::info!("  Prefab instances: {}", prefab_instances.len());

        // Create merged scene with both original entities and prefab instances
        let mut full_scene = scene.clone();
        full_scene.entities.extend(prefab_instances.clone());

        // Rebuild scene graph to include prefab hierarchies
        let scene_graph = SceneGraph::build(&full_scene)?;
        log::info!(
            "  Scene graph rebuilt with {} total entities",
            full_scene.entities.len()
        );
        Some(scene_graph)
    } else {
        None
    };

    Ok((updated_scene_graph, prefab_instances))
}

/// Sync newly created entities to renderer
///
/// Filters entities that haven't been loaded yet and returns them for loading
pub fn filter_new_entities<'a>(
    scene_entities: &'a [Entity],
    loaded_entity_ids: &HashSet<EntityId>,
) -> Vec<&'a Entity> {
    log::debug!(
        "filter_new_entities: checking {} scene entities against {} loaded entities",
        scene_entities.len(),
        loaded_entity_ids.len()
    );

    let new_entities: Vec<&Entity> = scene_entities
        .iter()
        .filter(|entity| {
            let entity_id = entity.entity_id().unwrap_or(EntityId::new(0));
            !loaded_entity_ids.contains(&entity_id)
        })
        .collect();

    log::debug!("Found {} new entities to load", new_entities.len());
    new_entities
}

/// Helper to get a component from an entity (matches threed_renderer.rs implementation)
fn get_component<T: 'static>(
    entity: &Entity,
    component_name: &str,
    component_registry: &ComponentRegistry,
) -> Option<T>
where
    T: serde::de::DeserializeOwned,
{
    entity
        .components
        .get(component_name)
        .and_then(|value| component_registry.decode(component_name, value).ok())
        .and_then(|boxed| boxed.downcast::<T>().ok())
        .map(|boxed| *boxed)
}
