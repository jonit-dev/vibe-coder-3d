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

#[cfg(test)]
mod tests {
    use super::*;

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
}
