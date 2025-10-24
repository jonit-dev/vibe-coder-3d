//! Entity mutation buffer for safe scene modifications from scripts
//!
//! Scripts cannot directly modify the scene during execution because:
//! 1. Scene is borrowed immutably during script execution
//! 2. Multiple scripts might execute in parallel
//! 3. Modifications need to be validated before application
//!
//! Instead, scripts queue mutations in a buffer that is applied after all scripts finish.

use serde_json::Value;
use std::sync::{Arc, Mutex};
use vibe_scene::EntityId;

/// Type of mutation to perform on an entity
#[derive(Debug, Clone)]
pub enum EntityMutation {
    /// Set or update a component
    SetComponent {
        entity_id: EntityId,
        component_type: String,
        data: Value,
    },
    /// Remove a component
    RemoveComponent {
        entity_id: EntityId,
        component_type: String,
    },
    /// Destroy an entity
    DestroyEntity { entity_id: EntityId },
    /// Set entity active state (not yet implemented - placeholder)
    SetActive { entity_id: EntityId, active: bool },
}

/// Buffer for collecting entity mutations from scripts
#[derive(Debug, Default, Clone)]
pub struct EntityMutationBuffer {
    mutations: Arc<Mutex<Vec<EntityMutation>>>,
}

impl EntityMutationBuffer {
    /// Create a new empty mutation buffer
    pub fn new() -> Self {
        Self {
            mutations: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Queue a mutation to be applied later
    pub fn push(&self, mutation: EntityMutation) {
        let mut mutations = self.mutations.lock().unwrap();
        mutations.push(mutation);
    }

    /// Get all queued mutations and clear the buffer
    pub fn drain(&self) -> Vec<EntityMutation> {
        let mut mutations = self.mutations.lock().unwrap();
        mutations.drain(..).collect()
    }

    /// Get the number of queued mutations
    pub fn len(&self) -> usize {
        let mutations = self.mutations.lock().unwrap();
        mutations.len()
    }

    /// Check if the buffer is empty
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Clear all queued mutations without applying them
    pub fn clear(&self) {
        let mut mutations = self.mutations.lock().unwrap();
        mutations.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mutation_buffer_push_drain() {
        let buffer = EntityMutationBuffer::new();

        // Buffer starts empty
        assert_eq!(buffer.len(), 0);
        assert!(buffer.is_empty());

        // Push some mutations
        buffer.push(EntityMutation::SetComponent {
            entity_id: EntityId::new(1),
            component_type: "Transform".to_string(),
            data: serde_json::json!({"position": [1.0, 2.0, 3.0]}),
        });

        buffer.push(EntityMutation::DestroyEntity {
            entity_id: EntityId::new(2),
        });

        assert_eq!(buffer.len(), 2);
        assert!(!buffer.is_empty());

        // Drain mutations
        let mutations = buffer.drain();
        assert_eq!(mutations.len(), 2);

        // Buffer is empty after drain
        assert_eq!(buffer.len(), 0);
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_mutation_buffer_clear() {
        let buffer = EntityMutationBuffer::new();

        buffer.push(EntityMutation::SetComponent {
            entity_id: EntityId::new(1),
            component_type: "Transform".to_string(),
            data: serde_json::json!({}),
        });

        assert_eq!(buffer.len(), 1);

        buffer.clear();

        assert_eq!(buffer.len(), 0);
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_mutation_types() {
        let buffer = EntityMutationBuffer::new();

        // SetComponent
        buffer.push(EntityMutation::SetComponent {
            entity_id: EntityId::new(1),
            component_type: "Camera".to_string(),
            data: serde_json::json!({"fov": 60}),
        });

        // RemoveComponent
        buffer.push(EntityMutation::RemoveComponent {
            entity_id: EntityId::new(2),
            component_type: "MeshRenderer".to_string(),
        });

        // DestroyEntity
        buffer.push(EntityMutation::DestroyEntity {
            entity_id: EntityId::new(3),
        });

        // SetActive
        buffer.push(EntityMutation::SetActive {
            entity_id: EntityId::new(4),
            active: false,
        });

        let mutations = buffer.drain();
        assert_eq!(mutations.len(), 4);

        // Verify mutation types
        assert!(matches!(mutations[0], EntityMutation::SetComponent { .. }));
        assert!(matches!(
            mutations[1],
            EntityMutation::RemoveComponent { .. }
        ));
        assert!(matches!(mutations[2], EntityMutation::DestroyEntity { .. }));
        assert!(matches!(mutations[3], EntityMutation::SetActive { .. }));
    }
}
