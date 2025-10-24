/// EntityBuilder - Fluent API for entity creation
///
/// Provides a builder pattern for creating entities with components.

use std::sync::Arc;
use vibe_scene::{ComponentKindId, EntityCommand, EntityCommandBuffer, EntityId, SceneState};

/// Fluent builder for creating entities
pub struct EntityBuilder<'a> {
    command_buffer: &'a mut EntityCommandBuffer,
    scene_state: Arc<SceneState>,
    name: String,
    parent_id: Option<EntityId>,
    components: Vec<(ComponentKindId, serde_json::Value)>,
}

impl<'a> EntityBuilder<'a> {
    /// Create a new EntityBuilder
    pub fn new(
        command_buffer: &'a mut EntityCommandBuffer,
        scene_state: Arc<SceneState>,
    ) -> Self {
        Self {
            command_buffer,
            scene_state,
            name: "Entity".to_string(),
            parent_id: None,
            components: Vec::new(),
        }
    }

    /// Set entity name
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = name.into();
        self
    }

    /// Set parent entity
    pub fn with_parent(mut self, parent_id: Option<EntityId>) -> Self {
        self.parent_id = parent_id;
        self
    }

    /// Add a component with JSON data
    pub fn with_component(
        mut self,
        component_type: impl Into<ComponentKindId>,
        data: serde_json::Value,
    ) -> Self {
        self.components.push((component_type.into(), data));
        self
    }

    /// Add Transform component with position
    pub fn with_position(self, position: [f32; 3]) -> Self {
        self.with_component(
            "Transform",
            serde_json::json!({
                "position": position
            }),
        )
    }

    /// Add Transform component with rotation (Euler degrees)
    pub fn with_rotation(self, rotation: [f32; 3]) -> Self {
        self.with_component(
            "Transform",
            serde_json::json!({
                "rotation": rotation
            }),
        )
    }

    /// Add Transform component with scale
    pub fn with_scale(self, scale: [f32; 3]) -> Self {
        self.with_component(
            "Transform",
            serde_json::json!({
                "scale": scale
            }),
        )
    }

    /// Add full Transform component
    pub fn with_transform(
        self,
        position: Option<[f32; 3]>,
        rotation: Option<[f32; 3]>,
        scale: Option<[f32; 3]>,
    ) -> Self {
        let mut transform = serde_json::Map::new();

        if let Some(pos) = position {
            transform.insert("position".to_string(), serde_json::json!(pos));
        }
        if let Some(rot) = rotation {
            transform.insert("rotation".to_string(), serde_json::json!(rot));
        }
        if let Some(scl) = scale {
            transform.insert("scale".to_string(), serde_json::json!(scl));
        }

        self.with_component("Transform", serde_json::Value::Object(transform))
    }

    /// Add a primitive mesh (cube, sphere, plane, etc.)
    pub fn with_primitive(self, primitive_type: &str) -> Self {
        self.with_component(
            "MeshRenderer",
            serde_json::json!({
                "meshId": primitive_type,
                "castShadow": true,
                "receiveShadow": true
            }),
        )
    }

    /// Add a material
    pub fn with_material(self, color: &str, metalness: f32, roughness: f32) -> Self {
        self.with_component(
            "Material",
            serde_json::json!({
                "color": color,
                "metalness": metalness,
                "roughness": roughness,
                "shader": "standard"
            }),
        )
    }

    /// Add RigidBody component
    pub fn with_rigidbody(
        self,
        body_type: &str,
        mass: f32,
        gravity_scale: f32,
    ) -> Self {
        self.with_component(
            "RigidBody",
            serde_json::json!({
                "bodyType": body_type,
                "mass": mass,
                "gravityScale": gravity_scale
            }),
        )
    }

    /// Add MeshCollider component
    pub fn with_collider(self, collider_type: &str) -> Self {
        self.with_component(
            "MeshCollider",
            serde_json::json!({
                "type": collider_type,
                "isTrigger": false
            }),
        )
    }

    /// Build and queue the entity creation command
    ///
    /// Returns the entity ID that will be assigned when commands are applied.
    pub fn build(self) -> EntityId {
        // Generate new entity ID
        let entity_id = self.scene_state.generate_entity_id();

        // Queue creation command
        self.command_buffer.push(EntityCommand::CreateEntity {
            entity_id,
            name: self.name,
            parent_id: self.parent_id,
            components: self.components,
        });

        entity_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_scene::{EntityCommandBuffer, Scene, SceneState};

    fn create_test_scene_state() -> Arc<SceneState> {
        let scene = Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![],
            materials: vec![],
            meshes: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        };
        Arc::new(SceneState::new(scene))
    }

    #[test]
    fn test_entity_builder_basic() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Test Entity")
            .build();

        assert_eq!(buffer.len(), 1);
        assert!(entity_id.as_u64() > 0);
    }

    #[test]
    fn test_entity_builder_with_transform() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let _entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Positioned Entity")
            .with_position([1.0, 2.0, 3.0])
            .build();

        assert_eq!(buffer.len(), 1);
    }

    #[test]
    fn test_entity_builder_with_primitive() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let _entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Cube")
            .with_primitive("cube")
            .with_material("#ff0000", 0.5, 0.5)
            .build();

        assert_eq!(buffer.len(), 1);
    }

    #[test]
    fn test_entity_builder_with_physics() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let _entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Physics Cube")
            .with_primitive("cube")
            .with_rigidbody("dynamic", 1.0, 1.0)
            .with_collider("box")
            .build();

        assert_eq!(buffer.len(), 1);
    }

    #[test]
    fn test_entity_builder_full_transform() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let _entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Transformed Entity")
            .with_transform(
                Some([0.0, 5.0, 0.0]),
                Some([0.0, 45.0, 0.0]),
                Some([2.0, 2.0, 2.0]),
            )
            .build();

        assert_eq!(buffer.len(), 1);
    }

    #[test]
    fn test_entity_builder_with_parent() {
        let state = create_test_scene_state();
        let mut buffer = EntityCommandBuffer::new();

        let parent_id = EntityId::new(1);

        let _entity_id = EntityBuilder::new(&mut buffer, state)
            .with_name("Child Entity")
            .with_parent(Some(parent_id))
            .build();

        assert_eq!(buffer.len(), 1);
    }
}
