use serde::{Deserialize, Serialize};

pub type SubscriberId = u64;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EventKey(pub String);

impl From<String> for EventKey {
    fn from(s: String) -> Self {
        EventKey(s)
    }
}

impl From<&str> for EventKey {
    fn from(s: &str) -> Self {
        EventKey(s.to_string())
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EventEnvelope {
    pub key: EventKey,
    pub target: Option<vibe_scene::EntityId>,
    pub payload: serde_json::Value,
}

impl EventEnvelope {
    pub fn new(key: impl Into<EventKey>, payload: serde_json::Value) -> Self {
        Self {
            key: key.into(),
            target: None,
            payload,
        }
    }

    pub fn targeted(target: vibe_scene::EntityId, key: impl Into<EventKey>, payload: serde_json::Value) -> Self {
        Self {
            key: key.into(),
            target: Some(target),
            payload,
        }
    }
}

// Event key constants for core domains to reduce typos
pub mod keys {

    // Scene events
    pub const SCENE_LOADED: &str = "scene:loaded";
    pub const SCENE_UNLOADED: &str = "scene:unloaded";

    // Physics events
    pub const PHYSICS_COLLISION: &str = "physics:collision";
    pub const PHYSICS_TRIGGER: &str = "physics:trigger";

    // Audio events
    pub const AUDIO_PLAY: &str = "audio:play";
    pub const AUDIO_STOP: &str = "audio:stop";

    // Game events
    pub const GAME_SCORE_CHANGED: &str = "game:scoreChanged";
    pub const GAME_STATE_CHANGED: &str = "game:stateChanged";

    // UI events
    pub const UI_SHOW: &str = "ui:show";
    pub const UI_HIDE: &str = "ui:hide";

    // Entity events
    pub const ENTITY_SPAWNED: &str = "entity:spawned";
    pub const ENTITY_DESTROYED: &str = "entity:destroyed";
    pub const ENTITY_COMPONENT_ADDED: &str = "entity:componentAdded";
    pub const ENTITY_COMPONENT_REMOVED: &str = "entity:componentRemoved";
}