use anyhow::{Context, Result};
use glam::{Mat4, Quat, Vec3};
use std::collections::{HashMap, HashSet};
use vibe_ecs_bridge::{MeshRenderer, MeshRendererMaterialOverride, Transform};
use vibe_scene::{Entity, EntityId, Scene};

/// Scene graph with parent/child relationships and transform propagation
#[derive(Debug)]
pub struct SceneGraph {
    /// Map from EntityId to index in entities list
    id_to_index: HashMap<EntityId, usize>,
    /// Entity IDs in scene order
    entity_ids: Vec<EntityId>,
    /// Parent of each entity (None for root entities)
    parents: Vec<Option<EntityId>>,
    /// Local transform matrices
    local_transforms: Vec<Mat4>,
    /// World transform matrices (computed from parent chain)
    world_transforms: Vec<Mat4>,
    /// Dirty flags for lazy transform updates
    dirty: Vec<bool>,
}

impl SceneGraph {
    /// Build a scene graph from a scene
    pub fn build(scene: &Scene) -> Result<Self> {
        let mut id_to_index = HashMap::new();
        let mut entity_ids = Vec::new();
        let mut parents = Vec::new();
        let mut local_transforms = Vec::new();

        // First pass: collect all entities and their local transforms
        for entity in &scene.entities {
            if let Some(entity_id) = entity.entity_id() {
                let index = entity_ids.len();
                id_to_index.insert(entity_id, index);
                entity_ids.push(entity_id);

                // Get parent ID if exists
                let parent_id = entity.parent_id();
                parents.push(parent_id);

                // Extract local transform
                let local_matrix = Self::extract_local_transform(entity);
                local_transforms.push(local_matrix);
            }
        }

        // Detect cycles in parent hierarchy
        Self::detect_cycles(&entity_ids, &parents, &id_to_index)?;

        // Initialize world transforms (will be computed lazily)
        let world_transforms = vec![Mat4::IDENTITY; entity_ids.len()];
        let dirty = vec![true; entity_ids.len()]; // All start as dirty

        let mut graph = Self {
            id_to_index,
            entity_ids,
            parents,
            local_transforms,
            world_transforms,
            dirty,
        };

        // Compute all world transforms
        graph.update_all_transforms();

        Ok(graph)
    }

    /// Extract local transform matrix from entity's Transform component
    fn extract_local_transform(entity: &Entity) -> Mat4 {
        if let Some(transform) = entity.get_component::<Transform>("Transform") {
            // Position
            let position = transform
                .position
                .map(|p| Vec3::new(p[0], p[1], p[2]))
                .unwrap_or(Vec3::ZERO);

            // Rotation (handle both Euler angles and quaternions)
            let rotation = transform
                .rotation
                .as_ref()
                .map(|r| match r.len() {
                    3 => Quat::from_euler(glam::EulerRot::XYZ, r[0], r[1], r[2]),
                    4 => Quat::from_xyzw(r[0], r[1], r[2], r[3]),
                    _ => {
                        log::warn!("Invalid rotation array length: {}, using identity", r.len());
                        Quat::IDENTITY
                    }
                })
                .unwrap_or(Quat::IDENTITY);

            // Scale
            let scale = transform
                .scale
                .map(|s| Vec3::new(s[0], s[1], s[2]))
                .unwrap_or(Vec3::ONE);

            Mat4::from_scale_rotation_translation(scale, rotation, position)
        } else {
            Mat4::IDENTITY
        }
    }

    /// Detect cycles in parent hierarchy
    fn detect_cycles(
        entity_ids: &[EntityId],
        parents: &[Option<EntityId>],
        id_to_index: &HashMap<EntityId, usize>,
    ) -> Result<()> {
        for (idx, entity_id) in entity_ids.iter().enumerate() {
            let mut visited = HashSet::new();
            visited.insert(*entity_id);

            let mut current_parent = parents[idx];
            while let Some(parent_id) = current_parent {
                if visited.contains(&parent_id) {
                    anyhow::bail!(
                        "Cycle detected in hierarchy: entity {:?} has cyclic parent chain",
                        entity_id
                    );
                }
                visited.insert(parent_id);

                // Get parent's parent
                if let Some(&parent_idx) = id_to_index.get(&parent_id) {
                    current_parent = parents[parent_idx];
                } else {
                    // Parent not found in scene, treat as root
                    break;
                }
            }
        }
        Ok(())
    }

    /// Update all dirty transforms
    fn update_all_transforms(&mut self) {
        // Process entities in order, so parents are updated before children
        for idx in 0..self.entity_ids.len() {
            self.update_transform_recursive(idx);
        }
    }

    /// Recursively update transform for an entity
    fn update_transform_recursive(&mut self, idx: usize) {
        if !self.dirty[idx] {
            return; // Already up to date
        }

        // If has parent, ensure parent is updated first
        if let Some(parent_id) = self.parents[idx] {
            if let Some(&parent_idx) = self.id_to_index.get(&parent_id) {
                self.update_transform_recursive(parent_idx);
                // Compute world = parent_world * local
                self.world_transforms[idx] =
                    self.world_transforms[parent_idx] * self.local_transforms[idx];
            } else {
                // Parent not found, use local transform as world
                self.world_transforms[idx] = self.local_transforms[idx];
            }
        } else {
            // No parent, local is world
            self.world_transforms[idx] = self.local_transforms[idx];
        }

        self.dirty[idx] = false;
    }

    /// Update local transform for an entity (marks as dirty)
    pub fn update_local_transform(&mut self, id: EntityId, local: Mat4) -> Result<()> {
        let idx = self
            .id_to_index
            .get(&id)
            .context("Entity ID not found in scene graph")?;

        self.local_transforms[*idx] = local;
        self.mark_dirty_recursive(*idx);
        Ok(())
    }

    /// Mark entity and all descendants as dirty
    fn mark_dirty_recursive(&mut self, idx: usize) {
        self.dirty[idx] = true;

        // Collect children first to avoid borrow checker issues
        let entity_id = self.entity_ids[idx];
        let children: Vec<usize> = self
            .parents
            .iter()
            .enumerate()
            .filter_map(|(child_idx, parent)| {
                if let Some(parent_id) = parent {
                    if *parent_id == entity_id {
                        return Some(child_idx);
                    }
                }
                None
            })
            .collect();

        // Now mark children dirty recursively
        for child_idx in children {
            self.mark_dirty_recursive(child_idx);
        }
    }

    /// Get world transform for an entity
    pub fn get_world_transform(&mut self, id: EntityId) -> Option<Mat4> {
        let idx = *self.id_to_index.get(&id)?;
        if self.dirty[idx] {
            self.update_transform_recursive(idx);
        }
        Some(self.world_transforms[idx])
    }

    /// Get all entity IDs
    pub fn entity_ids(&self) -> &[EntityId] {
        &self.entity_ids
    }

    /// Get parent of an entity
    pub fn get_parent(&self, id: EntityId) -> Option<EntityId> {
        let idx = *self.id_to_index.get(&id)?;
        self.parents[idx]
    }

    /// Get children of an entity
    pub fn get_children(&self, id: EntityId) -> Vec<EntityId> {
        let mut children = Vec::new();
        for (idx, parent) in self.parents.iter().enumerate() {
            if let Some(parent_id) = parent {
                if *parent_id == id {
                    children.push(self.entity_ids[idx]);
                }
            }
        }
        children
    }
}

/// Renderable instance extracted from scene graph
#[derive(Debug, Clone)]
pub struct RenderableInstance {
    pub entity_id: EntityId,
    pub world_transform: Mat4,
    pub mesh_id: Option<String>,
    pub material_id: Option<String>,
    pub materials: Option<Vec<String>>,
    pub material_override: Option<MeshRendererMaterialOverride>,
    pub model_path: Option<String>,
    pub cast_shadows: bool,
    pub receive_shadows: bool,
}

impl SceneGraph {
    /// Extract all renderable instances (entities with MeshRenderer + Transform)
    pub fn extract_renderables(&mut self, scene: &Scene) -> Vec<RenderableInstance> {
        let mut instances = Vec::new();

        for entity in &scene.entities {
            // Skip entities without MeshRenderer
            if !entity.has_component("MeshRenderer") {
                continue;
            }

            if let Some(entity_id) = entity.entity_id() {
                // Get world transform
                let world_transform = self
                    .get_world_transform(entity_id)
                    .unwrap_or(Mat4::IDENTITY);

                // Parse MeshRenderer component
                if let Some(renderer) = entity.get_component::<MeshRenderer>("MeshRenderer") {
                    instances.push(RenderableInstance {
                        entity_id,
                        world_transform,
                        mesh_id: renderer.meshId.clone(),
                        material_id: renderer.materialId.clone(),
                        materials: renderer.materials.clone(),
                        material_override: renderer.material.clone(),
                        model_path: renderer.modelPath.clone(),
                        cast_shadows: renderer.castShadows,
                        receive_shadows: renderer.receiveShadows,
                    });
                }
            }
        }

        instances
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use glam::Vec4Swizzles;
    use serde_json::Value;
    use std::collections::HashMap;
    use vibe_scene::{Metadata, Scene};

    fn create_test_entity(
        persistent_id: &str,
        parent_id: Option<&str>,
        position: Option<[f32; 3]>,
    ) -> Entity {
        let mut components = HashMap::new();
        components.insert(
            "Transform".to_string(),
            serde_json::json!({
                "position": position.unwrap_or([0.0, 0.0, 0.0]),
                "rotation": [0.0, 0.0, 0.0],
                "scale": [1.0, 1.0, 1.0]
            }),
        );

        Entity {
            id: None,
            persistentId: Some(persistent_id.to_string()),
            name: Some(persistent_id.to_string()),
            parentPersistentId: parent_id.map(|s| s.to_string()),
            components,
        }
    }

    fn create_test_scene(entities: Vec<Entity>) -> Scene {
        Scene {
            metadata: Metadata {
                name: "Test Scene".to_string(),
                version: 1,
                timestamp: "2025-01-01T00:00:00Z".to_string(),
                author: None,
                description: None,
            },
            entities,
            materials: None,
            prefabs: None,
            inputAssets: None,
            lockedEntityIds: None,
        }
    }

    #[test]
    fn test_scene_graph_flat_hierarchy() {
        let entities = vec![
            create_test_entity("entity-1", None, Some([1.0, 0.0, 0.0])),
            create_test_entity("entity-2", None, Some([2.0, 0.0, 0.0])),
        ];
        let scene = create_test_scene(entities);

        let mut graph = SceneGraph::build(&scene).unwrap();

        let id1 = EntityId::from_persistent_id("entity-1");
        let id2 = EntityId::from_persistent_id("entity-2");

        let world1 = graph.get_world_transform(id1).unwrap();
        let world2 = graph.get_world_transform(id2).unwrap();

        // Flat hierarchy: world == local
        assert_eq!(world1.w_axis.xyz(), Vec3::new(1.0, 0.0, 0.0));
        assert_eq!(world2.w_axis.xyz(), Vec3::new(2.0, 0.0, 0.0));
    }

    #[test]
    fn test_scene_graph_parent_child() {
        let entities = vec![
            create_test_entity("parent", None, Some([10.0, 0.0, 0.0])),
            create_test_entity("child", Some("parent"), Some([5.0, 0.0, 0.0])),
        ];
        let scene = create_test_scene(entities);

        let mut graph = SceneGraph::build(&scene).unwrap();

        let parent_id = EntityId::from_persistent_id("parent");
        let child_id = EntityId::from_persistent_id("child");

        let parent_world = graph.get_world_transform(parent_id).unwrap();
        let child_world = graph.get_world_transform(child_id).unwrap();

        // Parent at (10, 0, 0)
        assert_eq!(parent_world.w_axis.xyz(), Vec3::new(10.0, 0.0, 0.0));

        // Child at (5, 0, 0) relative to parent = (15, 0, 0) world
        let child_pos = child_world.w_axis.xyz();
        assert!((child_pos - Vec3::new(15.0, 0.0, 0.0)).length() < 0.001);
    }

    #[test]
    fn test_scene_graph_update_transform() {
        let entities = vec![create_test_entity("entity-1", None, Some([1.0, 0.0, 0.0]))];
        let scene = create_test_scene(entities);

        let mut graph = SceneGraph::build(&scene).unwrap();
        let id = EntityId::from_persistent_id("entity-1");

        // Update local transform
        let new_local = Mat4::from_translation(Vec3::new(5.0, 10.0, 15.0));
        graph.update_local_transform(id, new_local).unwrap();

        let world = graph.get_world_transform(id).unwrap();
        assert_eq!(world.w_axis.xyz(), Vec3::new(5.0, 10.0, 15.0));
    }

    #[test]
    fn test_scene_graph_parent_update_propagates() {
        let entities = vec![
            create_test_entity("parent", None, Some([10.0, 0.0, 0.0])),
            create_test_entity("child", Some("parent"), Some([5.0, 0.0, 0.0])),
        ];
        let scene = create_test_scene(entities);

        let mut graph = SceneGraph::build(&scene).unwrap();

        let parent_id = EntityId::from_persistent_id("parent");
        let child_id = EntityId::from_persistent_id("child");

        // Update parent position
        let new_parent = Mat4::from_translation(Vec3::new(20.0, 0.0, 0.0));
        graph.update_local_transform(parent_id, new_parent).unwrap();

        // Child should now be at (20 + 5, 0, 0) = (25, 0, 0)
        let child_world = graph.get_world_transform(child_id).unwrap();
        let child_pos = child_world.w_axis.xyz();
        assert!((child_pos - Vec3::new(25.0, 0.0, 0.0)).length() < 0.001);
    }

    #[test]
    fn test_scene_graph_detect_cycle() {
        // Create a cycle: A -> B -> A
        let entities = vec![
            create_test_entity("entity-a", Some("entity-b"), None),
            create_test_entity("entity-b", Some("entity-a"), None),
        ];

        let scene = create_test_scene(entities);

        let result = SceneGraph::build(&scene);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Cycle detected"));
    }

    #[test]
    fn test_extract_renderables() {
        let mut components = HashMap::new();
        components.insert(
            "Transform".to_string(),
            serde_json::json!({
                "position": [1.0, 2.0, 3.0],
                "rotation": [0.0, 0.0, 0.0],
                "scale": [1.0, 1.0, 1.0]
            }),
        );
        components.insert(
            "MeshRenderer".to_string(),
            serde_json::json!({
                "meshId": "cube",
                "materialId": "mat-1",
                "enabled": true,
                "castShadows": true,
                "receiveShadows": true
            }),
        );

        let entity = Entity {
            id: None,
            persistentId: Some("renderable-1".to_string()),
            name: Some("Renderable".to_string()),
            parentPersistentId: None,
            components,
        };

        let scene = create_test_scene(vec![entity]);
        let mut graph = SceneGraph::build(&scene).unwrap();

        let instances = graph.extract_renderables(&scene);
        assert_eq!(instances.len(), 1);

        let instance = &instances[0];
        assert_eq!(instance.mesh_id.as_deref(), Some("cube"));
        assert_eq!(instance.material_id.as_deref(), Some("mat-1"));
        assert!(instance.cast_shadows);
        assert!(instance.receive_shadows);
    }

    #[test]
    fn test_get_parent_and_children() {
        let entities = vec![
            create_test_entity("parent", None, None),
            create_test_entity("child1", Some("parent"), None),
            create_test_entity("child2", Some("parent"), None),
        ];
        let scene = create_test_scene(entities);
        let graph = SceneGraph::build(&scene).unwrap();

        let parent_id = EntityId::from_persistent_id("parent");
        let child1_id = EntityId::from_persistent_id("child1");
        let child2_id = EntityId::from_persistent_id("child2");

        // Parent has no parent
        assert!(graph.get_parent(parent_id).is_none());

        // Children have parent
        assert_eq!(graph.get_parent(child1_id), Some(parent_id));
        assert_eq!(graph.get_parent(child2_id), Some(parent_id));

        // Parent has two children
        let children = graph.get_children(parent_id);
        assert_eq!(children.len(), 2);
        assert!(children.contains(&child1_id));
        assert!(children.contains(&child2_id));
    }

    #[test]
    fn test_load_fml_scene() {
        // Load the actual fml.json scene file
        // CARGO_MANIFEST_DIR = /path/to/rust/engine/crates/scene-graph
        // We want: /path/to/rust/game/scenes/fml.json
        let scene_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent() // -> crates
            .unwrap()
            .parent() // -> engine
            .unwrap()
            .parent() // -> rust
            .unwrap()
            .join("game/scenes/fml.json");

        let json = std::fs::read_to_string(&scene_path).expect("Failed to read fml.json");
        let scene: Scene = serde_json::from_str(&json).expect("Failed to parse fml.json");

        // Verify scene has entities
        assert_eq!(scene.entities.len(), 5, "Scene should have 5 entities");

        // Debug print entity info
        for (idx, entity) in scene.entities.iter().enumerate() {
            eprintln!(
                "Entity {}: name={:?}, persistentId={:?}, has_entity_id={}",
                idx,
                entity.name,
                entity.persistentId,
                entity.entity_id().is_some()
            );
        }

        // Build scene graph
        let result = SceneGraph::build(&scene);
        assert!(result.is_ok(), "SceneGraph::build should succeed");

        let mut graph = result.unwrap();

        // Verify graph has entities
        assert_eq!(graph.entity_ids().len(), 5, "Graph should have 5 entities");

        // Extract renderables
        let instances = graph.extract_renderables(&scene);

        // Should find 2 renderable entities (Cube 0 and Cube 0 Copy)
        assert_eq!(
            instances.len(),
            2,
            "Should find 2 renderable entities (2 cubes)"
        );
    }
}
