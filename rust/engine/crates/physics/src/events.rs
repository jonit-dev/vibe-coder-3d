use serde::{Deserialize, Serialize};
use std::sync::Arc;
use vibe_scene::EntityId;

/// Physics event types
#[derive(Debug, Clone)]
pub enum CollisionEvent {
    /// Contact started between two entities
    ContactStarted {
        entity_a: EntityId,
        entity_b: EntityId,
    },
    /// Contact ended between two entities
    ContactEnded {
        entity_a: EntityId,
        entity_b: EntityId,
    },
    /// Trigger/sensor intersection started
    TriggerStarted {
        entity_a: EntityId,
        entity_b: EntityId,
    },
    /// Trigger/sensor intersection ended
    TriggerEnded {
        entity_a: EntityId,
        entity_b: EntityId,
    },
}

/// Contact event with manifold data
#[derive(Debug, Clone)]
pub struct ContactEvent {
    pub entity_a: EntityId,
    pub entity_b: EntityId,
    pub started: bool,
}

/// Queue for physics events
#[derive(Debug, Default)]
pub struct PhysicsEventQueue {
    events: Vec<CollisionEvent>,
}

impl PhysicsEventQueue {
    pub fn new() -> Self {
        Self { events: Vec::new() }
    }

    pub fn push(&mut self, event: CollisionEvent) {
        self.events.push(event);
    }

    pub fn drain(&mut self) -> impl Iterator<Item = CollisionEvent> + '_ {
        self.events.drain(..)
    }

    pub fn clear(&mut self) {
        self.events.clear();
    }

    pub fn len(&self) -> usize {
        self.events.len()
    }

    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }
}

/// Physics event bridge to publish events to SceneEventBus
pub struct PhysicsEventBridge {
    event_bus: Option<Arc<vibe_events::SceneEventBus>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CollisionEventData {
    pub entity_a: u64,
    pub entity_b: u64,
    pub event_type: String, // "contact_started", "contact_ended", "trigger_started", "trigger_ended"
}

impl PhysicsEventBridge {
    pub fn new() -> Self {
        Self { event_bus: None }
    }

    pub fn with_event_bus(event_bus: Arc<vibe_events::SceneEventBus>) -> Self {
        Self {
            event_bus: Some(event_bus),
        }
    }

    /// Publish all queued physics events to the SceneEventBus
    pub fn publish_queued_events(&self, queue: &PhysicsEventQueue) {
        if let Some(ref event_bus) = self.event_bus {
            for event in queue.events.iter() {
                self.publish_collision_event(event_bus, event);
            }
        }
    }

    /// Publish a single collision event
    pub fn publish_collision_event(
        &self,
        event_bus: &vibe_events::SceneEventBus,
        event: &CollisionEvent,
    ) {
        let (entity_a, entity_b, event_type) = match event {
            CollisionEvent::ContactStarted { entity_a, entity_b } => {
                (entity_a, entity_b, "contact_started")
            }
            CollisionEvent::ContactEnded { entity_a, entity_b } => {
                (entity_a, entity_b, "contact_ended")
            }
            CollisionEvent::TriggerStarted { entity_a, entity_b } => {
                (entity_a, entity_b, "trigger_started")
            }
            CollisionEvent::TriggerEnded { entity_a, entity_b } => {
                (entity_a, entity_b, "trigger_ended")
            }
        };

        let payload = CollisionEventData {
            entity_a: entity_a.as_u64(),
            entity_b: entity_b.as_u64(),
            event_type: event_type.to_string(),
        };

        let json_payload = serde_json::to_value(&payload).unwrap_or_else(|e| {
            log::error!("Failed to serialize collision event payload: {}", e);
            serde_json::json!({
                "error": "serialization_failed",
                "entity_a": entity_a.as_u64(),
                "entity_b": entity_b.as_u64(),
                "event_type": event_type
            })
        });

        // Emit to both entities involved
        event_bus.emit_to(
            *entity_a,
            vibe_events::keys::PHYSICS_COLLISION,
            json_payload.clone(),
        );
        event_bus.emit_to(
            *entity_b,
            vibe_events::keys::PHYSICS_COLLISION,
            json_payload,
        );

        log::debug!(
            "[Physics Bridge] Published {} event between entities {} and {}",
            event_type,
            entity_a,
            entity_b
        );
    }
}

impl Default for PhysicsEventBridge {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_events::SceneEventBus;

    #[test]
    fn test_event_queue_push_and_drain() {
        let mut queue = PhysicsEventQueue::new();
        assert!(queue.is_empty());
        assert_eq!(queue.len(), 0);

        queue.push(CollisionEvent::ContactStarted {
            entity_a: EntityId::new(1),
            entity_b: EntityId::new(2),
        });
        assert_eq!(queue.len(), 1);

        let events: Vec<_> = queue.drain().collect();
        assert_eq!(events.len(), 1);
        assert!(queue.is_empty());
    }

    #[test]
    fn test_event_queue_clear() {
        let mut queue = PhysicsEventQueue::new();
        queue.push(CollisionEvent::TriggerStarted {
            entity_a: EntityId::new(1),
            entity_b: EntityId::new(2),
        });
        queue.push(CollisionEvent::TriggerEnded {
            entity_a: EntityId::new(1),
            entity_b: EntityId::new(2),
        });
        assert_eq!(queue.len(), 2);

        queue.clear();
        assert!(queue.is_empty());
    }

    #[test]
    fn test_physics_event_bridge() {
        let event_bus = Arc::new(SceneEventBus::new());
        let bridge = PhysicsEventBridge::with_event_bus(event_bus.clone());

        let mut queue = PhysicsEventQueue::new();
        queue.push(CollisionEvent::ContactStarted {
            entity_a: EntityId::new(1),
            entity_b: EntityId::new(2),
        });

        // Test publishing doesn't panic
        bridge.publish_queued_events(&queue);

        // Verify event count
        assert_eq!(event_bus.pending_count(), 2); // One for each entity
    }

    #[test]
    fn test_collision_event_serialization() {
        let event_data = CollisionEventData {
            entity_a: 1,
            entity_b: 2,
            event_type: "contact_started".to_string(),
        };

        let json = serde_json::to_value(&event_data).unwrap();
        assert_eq!(json["entity_a"], 1);
        assert_eq!(json["entity_b"], 2);
        assert_eq!(json["event_type"], "contact_started");
    }
}
