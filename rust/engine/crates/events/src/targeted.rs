use crate::types::{EventEnvelope, EventKey};
use vibe_scene::EntityId;

/// Helper utilities for targeted event operations
pub struct EventTargeter {
    bus: std::sync::Arc<crate::bus::SceneEventBus>,
}

impl EventTargeter {
    pub fn new(bus: std::sync::Arc<crate::bus::SceneEventBus>) -> Self {
        Self { bus }
    }

    /// Send an event to multiple specific entities
    pub fn emit_to_multiple(&self, entities: &[EntityId], key: impl Into<EventKey>, payload: serde_json::Value) {
        let key = key.into();
        for &entity_id in entities {
            self.bus.emit_to(entity_id, key.clone(), payload.clone());
        }
    }

    /// Send an event to all entities except the specified one
    pub fn emit_to_others(&self, _exclude: EntityId, _key: impl Into<EventKey>, _payload: serde_json::Value) {
        // This would require access to the scene manager to get all entities
        // For now, this is a placeholder for the concept
        todo!("emit_to_others requires scene manager access")
    }

    /// Broadcast an event to all entities with a specific component
    pub fn emit_to_entities_with_component(&self, _component_type: &str, _key: impl Into<EventKey>, _payload: serde_json::Value) {
        // This would require ECS system integration
        todo!("emit_to_entities_with_component requires ECS integration")
    }

    /// Create a targeted event envelope
    pub fn create_targeted_event(&self, target: EntityId, key: impl Into<EventKey>, payload: serde_json::Value) -> EventEnvelope {
        EventEnvelope::targeted(target, key, payload)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bus::SceneEventBus;

    #[test]
    fn test_targeter_creation() {
        let bus = std::sync::Arc::new(SceneEventBus::new());
        let targeter = EventTargeter::new(bus.clone());

        // Test that targeter is created successfully
        assert_eq!(targeter.bus.pending_count(), 0);
    }
}