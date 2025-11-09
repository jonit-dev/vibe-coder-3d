use crate::types::{EventEnvelope, EventKey, SubscriberId};
use crossbeam_channel::{unbounded, Receiver, Sender};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

type HandlerFn = Arc<dyn Fn(&EventEnvelope) + Send + Sync + 'static>;

/// A thread-safe, frame-driven event bus for cross-entity communication
pub struct SceneEventBus {
    tx: Sender<EventEnvelope>,
    rx: Receiver<EventEnvelope>,
    // key -> handlers
    handlers: RwLock<HashMap<EventKey, Vec<(SubscriberId, HandlerFn)>>>,
    // entity -> subscriber ids
    per_entity: RwLock<HashMap<vibe_scene::EntityId, Vec<SubscriberId>>>,
    // reverse index: subscriber -> key
    reverse: RwLock<HashMap<SubscriberId, EventKey>>,
    next_id: RwLock<SubscriberId>,
}

impl SceneEventBus {
    pub fn new() -> Self {
        let (tx, rx) = unbounded();
        Self {
            tx,
            rx,
            handlers: RwLock::new(HashMap::new()),
            per_entity: RwLock::new(HashMap::new()),
            reverse: RwLock::new(HashMap::new()),
            next_id: RwLock::new(0),
        }
    }

    /// Subscribe to global events (not tied to any specific entity)
    pub fn on_global<F>(&self, key: impl Into<EventKey>, handler: F) -> SubscriberId
    where
        F: Fn(&EventEnvelope) + Send + Sync + 'static,
    {
        self.on(key, None, handler)
    }

    /// Subscribe to events with optional entity ownership for auto-cleanup
    pub fn on<F>(
        &self,
        key: impl Into<EventKey>,
        owner: Option<vibe_scene::EntityId>,
        handler: F,
    ) -> SubscriberId
    where
        F: Fn(&EventEnvelope) + Send + Sync + 'static,
    {
        let mut id_guard = self.next_id.write().unwrap();
        *id_guard += 1;
        let id = *id_guard;
        drop(id_guard);

        let key = key.into();

        {
            let mut map = self.handlers.write().unwrap();
            map.entry(key.clone())
                .or_default()
                .push((id, Arc::new(handler)));
        }

        if let Some(eid) = owner {
            let mut per = self.per_entity.write().unwrap();
            per.entry(eid).or_default().push(id);
        }

        self.reverse.write().unwrap().insert(id, key);
        id
    }

    /// Subscribe to events for a specific entity
    pub fn on_entity<F>(
        &self,
        entity_id: vibe_scene::EntityId,
        key: impl Into<EventKey>,
        handler: F,
    ) -> SubscriberId
    where
        F: Fn(&EventEnvelope) + Send + Sync + 'static,
    {
        self.on(key, Some(entity_id), handler)
    }

    /// Unsubscribe using the subscriber ID returned from on()
    pub fn off(&self, id: SubscriberId) {
        if let Some(key) = self.reverse.write().unwrap().remove(&id) {
            let mut map = self.handlers.write().unwrap();
            if let Some(list) = map.get_mut(&key) {
                list.retain(|(sid, _)| *sid != id);
            }
        }
    }

    /// Emit a global event that all subscribers can receive
    pub fn emit(&self, key: impl Into<EventKey>, payload: serde_json::Value) {
        let envelope = EventEnvelope::new(key, payload);
        let _ = self.tx.send(envelope);
    }

    /// Emit an event targeted to a specific entity
    pub fn emit_to(
        &self,
        target: vibe_scene::EntityId,
        key: impl Into<EventKey>,
        payload: serde_json::Value,
    ) {
        let envelope = EventEnvelope::targeted(target, key, payload);
        let _ = self.tx.send(envelope);
    }

    /// Process all pending events. Call once per frame on the main thread.
    pub fn pump_events<F>(&self, mut lua_dispatch: F)
    where
        F: FnMut(&EventEnvelope),
    {
        // Drain all events from the queue
        while let Ok(env) = self.rx.try_recv() {
            // Dispatch to Rust handlers first
            if let Some(handlers) = self.handlers.read().unwrap().get(&env.key) {
                // For targeted events, call handlers that either:
                // 1. Are global subscribers (no entity ownership)
                // 2. Are owned by the target entity
                if let Some(target_id) = env.target {
                    // Targeted event - filter by entity ownership
                    let per_entity = self.per_entity.read().unwrap();
                    for (id, h) in handlers.iter() {
                        // Check if this handler is global (not in per_entity) or owned by target entity
                        let is_global = !per_entity
                            .values()
                            .any(|entity_ids| entity_ids.contains(id));
                        let is_owned_by_target = per_entity
                            .get(&target_id)
                            .map(|entity_ids| entity_ids.contains(id))
                            .unwrap_or(false);

                        if is_global || is_owned_by_target {
                            h(&env);
                        }
                    }
                } else {
                    // Global event - call all handlers
                    for (_, h) in handlers.iter() {
                        h(&env);
                    }
                }
            }

            // Then dispatch to Lua handlers (safe to call on main thread)
            lua_dispatch(&env);
        }
    }

    /// Clean up all subscriptions for a specific entity
    pub fn cleanup_entity(&self, entity: vibe_scene::EntityId) {
        let ids = self
            .per_entity
            .write()
            .unwrap()
            .remove(&entity)
            .unwrap_or_default();
        for id in ids {
            self.off(id);
        }
    }

    /// Get the number of pending events in the queue
    pub fn pending_count(&self) -> usize {
        self.rx.len()
    }

    /// Get the number of active subscriptions
    pub fn subscription_count(&self) -> usize {
        self.reverse.read().unwrap().len()
    }
}

impl Default for SceneEventBus {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    #[test]
    fn test_basic_subscribe_emit() {
        let bus = SceneEventBus::new();
        let counter = Arc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        bus.on_global("test:event", move |_| {
            counter_clone.fetch_add(1, Ordering::Relaxed);
        });

        bus.emit("test:event", serde_json::json!({}));

        // Pump events
        bus.pump_events(|_| {});

        assert_eq!(counter.load(Ordering::Relaxed), 1);
    }

    #[test]
    fn test_targeted_events() {
        let bus = SceneEventBus::new();
        let global_counter = Arc::new(AtomicU32::new(0));
        let entity_counter = Arc::new(AtomicU32::new(0));

        let global_clone = global_counter.clone();
        let entity_clone = entity_counter.clone();

        // Global subscriber
        bus.on_global("test:event", move |_| {
            global_clone.fetch_add(1, Ordering::Relaxed);
        });

        // Entity-specific subscriber
        let entity_id = vibe_scene::EntityId::new(42);
        let _sub_id = bus.on_entity(entity_id, "test:event", move |_| {
            entity_clone.fetch_add(1, Ordering::Relaxed);
        });

        // Emit targeted event
        bus.emit_to(entity_id, "test:event", serde_json::json!({}));

        // Pump events
        bus.pump_events(|_| {});

        // Both should receive the targeted event
        assert_eq!(global_counter.load(Ordering::Relaxed), 1);
        assert_eq!(entity_counter.load(Ordering::Relaxed), 1);
    }

    #[test]
    fn test_entity_cleanup() {
        let bus = SceneEventBus::new();
        let counter = Arc::new(AtomicU32::new(0));
        let counter_clone = counter.clone();

        let entity_id = vibe_scene::EntityId::new(42);
        let _sub_id = bus.on_entity(entity_id, "test:event", move |_| {
            counter_clone.fetch_add(1, Ordering::Relaxed);
        });

        assert_eq!(bus.subscription_count(), 1);

        // Clean up entity
        bus.cleanup_entity(entity_id);

        assert_eq!(bus.subscription_count(), 0);

        // Emit event - should not be delivered
        bus.emit_to(entity_id, "test:event", serde_json::json!({}));
        bus.pump_events(|_| {});

        assert_eq!(counter.load(Ordering::Relaxed), 0);
    }
}
