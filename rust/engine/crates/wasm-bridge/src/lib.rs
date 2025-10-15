mod bridge;
mod diff;
mod ipc;

pub use bridge::LiveBridge;
pub use diff::{ComponentDiff, DiffBatch, SceneDiff};
pub use ipc::FileIpcAdapter;

#[cfg(feature = "socket-ipc")]
pub use ipc::SocketIpcAdapter;

// WASM bindings (optional, only when targeting wasm32)
#[cfg(all(feature = "wasm", target_arch = "wasm32"))]
mod wasm {
    use super::*;
    use wasm_bindgen::prelude::*;
    use vibe_ecs_bridge::create_default_registry;

    /// WASM-accessible live bridge
    #[wasm_bindgen]
    pub struct WasmLiveBridge {
        inner: LiveBridge,
    }

    #[wasm_bindgen]
    impl WasmLiveBridge {
        /// Create a new WASM live bridge
        #[wasm_bindgen(constructor)]
        pub fn new() -> Self {
            // Initialize logging for WASM
            console_error_panic_hook::set_once();
            wasm_logger::init(wasm_logger::Config::default());

            let registry = create_default_registry();
            Self {
                inner: LiveBridge::new(registry),
            }
        }

        /// Load a complete scene from JSON string
        #[wasm_bindgen(js_name = loadScene)]
        pub fn load_scene(&mut self, json: &str) -> Result<(), JsValue> {
            self.inner
                .load_scene(json)
                .map_err(|e| JsValue::from_str(&format!("Failed to load scene: {}", e)))
        }

        /// Apply a diff batch from JSON string
        #[wasm_bindgen(js_name = applyDiff)]
        pub fn apply_diff(&mut self, diff_json: &str) -> Result<(), JsValue> {
            self.inner
                .apply_diff(diff_json)
                .map_err(|e| JsValue::from_str(&format!("Failed to apply diff: {}", e)))
        }

        /// Get current scene as JSON string
        #[wasm_bindgen(js_name = getSceneJson)]
        pub fn get_scene_json(&self) -> Result<String, JsValue> {
            serde_json::to_string(self.inner.scene())
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize scene: {}", e)))
        }

        /// Get entity count
        #[wasm_bindgen(js_name = getEntityCount)]
        pub fn get_entity_count(&self) -> usize {
            self.inner.scene().entities.len()
        }
    }

    impl Default for WasmLiveBridge {
        fn default() -> Self {
            Self::new()
        }
    }
}

#[cfg(all(feature = "wasm", target_arch = "wasm32"))]
pub use wasm::WasmLiveBridge;
