//! Input Action System
//!
//! Allows defining high-level actions (like "Move", "Jump") that map to physical inputs.
//! Supports composite bindings like WASD → Vector2.

use super::keyboard::KeyboardInput;
use super::manager::ActionValue;
use super::mouse::MouseInput;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use winit::event::VirtualKeyCode;

/// Action map configuration (loaded from JSON)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionMapConfig {
    pub name: String,
    #[serde(default)]
    pub enabled: bool,
    pub actions: Vec<ActionConfig>,
}

/// Individual action configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionConfig {
    pub name: String,
    #[serde(rename = "type")]
    pub action_type: ActionType,
    pub bindings: Vec<BindingConfig>,
}

/// Action type determines how the value is calculated
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ActionType {
    Button,  // Single value 0/1
    Axis,    // Single value -1 to 1
    Vector2, // 2D vector
    Vector3, // 3D vector
}

/// Binding configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BindingConfig {
    #[serde(flatten)]
    pub binding: BindingType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum BindingType {
    Key {
        key: String,
        #[serde(default = "default_scale")]
        scale: f32,
    },
    MouseButton {
        button: u8,
        #[serde(default = "default_scale")]
        scale: f32,
    },
    Composite2D {
        up: String,
        down: String,
        left: String,
        right: String,
    },
}

fn default_scale() -> f32 {
    1.0
}

/// Runtime action system
#[derive(Debug)]
pub struct ActionSystem {
    maps: HashMap<String, ActionMap>,
    enabled_maps: Vec<String>,
}

#[derive(Debug)]
struct ActionMap {
    actions: HashMap<String, Action>,
}

#[derive(Debug)]
struct Action {
    action_type: ActionType,
    bindings: Vec<Binding>,
    current_value: ActionValue,
    was_active: bool,
}

#[derive(Debug, Clone)]
enum Binding {
    Key {
        keycode: VirtualKeyCode,
        scale: f32,
    },
    MouseButton {
        button: u8,
        scale: f32,
    },
    Composite2D {
        up: VirtualKeyCode,
        down: VirtualKeyCode,
        left: VirtualKeyCode,
        right: VirtualKeyCode,
    },
}

impl ActionSystem {
    pub fn new() -> Self {
        Self {
            maps: HashMap::new(),
            enabled_maps: Vec::new(),
        }
    }

    /// Load action maps from JSON
    pub fn load_from_json(&mut self, json_data: &str) -> anyhow::Result<()> {
        let configs: Vec<ActionMapConfig> = serde_json::from_str(json_data)?;

        for config in configs {
            let mut actions = HashMap::new();

            for action_config in config.actions {
                let bindings: Vec<Binding> = action_config
                    .bindings
                    .iter()
                    .filter_map(|b| Self::parse_binding(&b.binding))
                    .collect();

                let initial_value = match action_config.action_type {
                    ActionType::Button | ActionType::Axis => ActionValue::Scalar(0.0),
                    ActionType::Vector2 => ActionValue::Vector2(0.0, 0.0),
                    ActionType::Vector3 => ActionValue::Vector3(0.0, 0.0, 0.0),
                };

                actions.insert(
                    action_config.name.clone(),
                    Action {
                        action_type: action_config.action_type,
                        bindings,
                        current_value: initial_value,
                        was_active: false,
                    },
                );
            }

            let map_name = config.name.clone();
            self.maps.insert(map_name.clone(), ActionMap { actions });

            if config.enabled {
                self.enabled_maps.push(map_name);
            }
        }

        Ok(())
    }

    fn parse_binding(binding: &BindingType) -> Option<Binding> {
        match binding {
            BindingType::Key { key, scale } => {
                KeyboardInput::parse_key_name(key).map(|keycode| Binding::Key {
                    keycode,
                    scale: *scale,
                })
            }
            BindingType::MouseButton { button, scale } => Some(Binding::MouseButton {
                button: *button,
                scale: *scale,
            }),
            BindingType::Composite2D {
                up,
                down,
                left,
                right,
            } => {
                let up_key = KeyboardInput::parse_key_name(up)?;
                let down_key = KeyboardInput::parse_key_name(down)?;
                let left_key = KeyboardInput::parse_key_name(left)?;
                let right_key = KeyboardInput::parse_key_name(right)?;

                Some(Binding::Composite2D {
                    up: up_key,
                    down: down_key,
                    left: left_key,
                    right: right_key,
                })
            }
        }
    }

    /// Update action values based on current input state
    pub fn update(&mut self, keyboard: &KeyboardInput, mouse: &MouseInput) {
        for map_name in &self.enabled_maps {
            if let Some(map) = self.maps.get_mut(map_name) {
                for action in map.actions.values_mut() {
                    action.current_value = Self::calculate_action_value(
                        &action.bindings,
                        action.action_type,
                        keyboard,
                        mouse,
                    );
                }
            }
        }
    }

    fn calculate_action_value(
        bindings: &[Binding],
        action_type: ActionType,
        keyboard: &KeyboardInput,
        mouse: &MouseInput,
    ) -> ActionValue {
        match action_type {
            ActionType::Button | ActionType::Axis => {
                let mut value = 0.0f32;
                for binding in bindings {
                    value += Self::evaluate_binding(binding, keyboard, mouse);
                }
                ActionValue::Scalar(value.clamp(-1.0, 1.0))
            }
            ActionType::Vector2 => {
                let mut x = 0.0f32;
                let mut y = 0.0f32;

                for binding in bindings {
                    match binding {
                        Binding::Composite2D {
                            up,
                            down,
                            left,
                            right,
                        } => {
                            if keyboard.is_key_down(*up) {
                                y += 1.0;
                            }
                            if keyboard.is_key_down(*down) {
                                y -= 1.0;
                            }
                            if keyboard.is_key_down(*left) {
                                x -= 1.0;
                            }
                            if keyboard.is_key_down(*right) {
                                x += 1.0;
                            }
                        }
                        _ => {
                            // For scalar bindings, add to x
                            x += Self::evaluate_binding(binding, keyboard, mouse);
                        }
                    }
                }

                ActionValue::Vector2(x.clamp(-1.0, 1.0), y.clamp(-1.0, 1.0))
            }
            ActionType::Vector3 => {
                // For now, treat as Vector2 with z=0
                let mut x = 0.0f32;
                let mut y = 0.0f32;

                for binding in bindings {
                    x += Self::evaluate_binding(binding, keyboard, mouse);
                }

                ActionValue::Vector3(x.clamp(-1.0, 1.0), y.clamp(-1.0, 1.0), 0.0)
            }
        }
    }

    fn evaluate_binding(binding: &Binding, keyboard: &KeyboardInput, mouse: &MouseInput) -> f32 {
        match binding {
            Binding::Key { keycode, scale } => {
                if keyboard.is_key_down(*keycode) {
                    *scale
                } else {
                    0.0
                }
            }
            Binding::MouseButton { button, scale } => {
                if let Some(mouse_button) = MouseInput::parse_button_number(*button) {
                    if mouse.is_button_down(mouse_button) {
                        return *scale;
                    }
                }
                0.0
            }
            Binding::Composite2D { .. } => {
                // Composite bindings are handled at the Vector2 level
                0.0
            }
        }
    }

    /// Get action value for polling
    pub fn get_action_value(&self, map_name: &str, action_name: &str) -> Option<ActionValue> {
        if !self.enabled_maps.contains(&map_name.to_string()) {
            return None;
        }

        self.maps
            .get(map_name)
            .and_then(|map| map.actions.get(action_name))
            .map(|action| action.current_value)
    }

    /// Check if action is active (value above threshold)
    pub fn is_action_active(&self, map_name: &str, action_name: &str) -> bool {
        if let Some(value) = self.get_action_value(map_name, action_name) {
            match value {
                ActionValue::Scalar(v) => v.abs() > 0.1,
                ActionValue::Vector2(x, y) => x.abs() > 0.1 || y.abs() > 0.1,
                ActionValue::Vector3(x, y, z) => x.abs() > 0.1 || y.abs() > 0.1 || z.abs() > 0.1,
            }
        } else {
            false
        }
    }

    /// Enable an action map
    pub fn enable_map(&mut self, map_name: &str) {
        let name = map_name.to_string();
        if !self.enabled_maps.contains(&name) && self.maps.contains_key(&name) {
            self.enabled_maps.push(name);
        }
    }

    /// Disable an action map
    pub fn disable_map(&mut self, map_name: &str) {
        self.enabled_maps.retain(|n| n != map_name);
    }

    /// Clear frame-based state
    pub fn clear_frame_state(&mut self) {
        // Currently no frame-based state in actions
        // But we track this for future use (e.g., "started" callbacks)
        for map in self.maps.values_mut() {
            for action in map.actions.values_mut() {
                let is_active = match action.current_value {
                    ActionValue::Scalar(v) => v.abs() > 0.1,
                    ActionValue::Vector2(x, y) => x.abs() > 0.1 || y.abs() > 0.1,
                    ActionValue::Vector3(x, y, z) => {
                        x.abs() > 0.1 || y.abs() > 0.1 || z.abs() > 0.1
                    }
                };
                action.was_active = is_active;
            }
        }
    }
}

impl Default for ActionSystem {
    fn default() -> Self {
        Self::new()
    }
}
