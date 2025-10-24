//! Input Manager - Central input state management
//!
//! Coordinates keyboard, mouse, and action system inputs.

use super::actions::ActionSystem;
use super::keyboard::KeyboardInput;
use super::mouse::MouseInput;
use std::sync::{Arc, RwLock};
use winit::event::{
    ElementState, KeyboardInput as WinitKeyboardInput, MouseButton, MouseScrollDelta, WindowEvent,
};

/// Central input manager that tracks all input state
#[derive(Debug, Clone)]
pub struct InputManager {
    keyboard: Arc<RwLock<KeyboardInput>>,
    mouse: Arc<RwLock<MouseInput>>,
    action_system: Arc<RwLock<ActionSystem>>,
}

impl InputManager {
    pub fn new() -> Self {
        Self {
            keyboard: Arc::new(RwLock::new(KeyboardInput::new())),
            mouse: Arc::new(RwLock::new(MouseInput::new())),
            action_system: Arc::new(RwLock::new(ActionSystem::new())),
        }
    }

    /// Process window events
    pub fn process_event(&self, event: &WindowEvent) {
        match event {
            WindowEvent::KeyboardInput { input, .. } => {
                if let Some(keycode) = input.virtual_keycode {
                    let mut keyboard = self.keyboard.write().unwrap();
                    match input.state {
                        ElementState::Pressed => keyboard.on_key_down(keycode),
                        ElementState::Released => keyboard.on_key_up(keycode),
                    }
                }
            }
            WindowEvent::MouseInput { state, button, .. } => {
                let mut mouse = self.mouse.write().unwrap();
                match state {
                    ElementState::Pressed => mouse.on_button_down(*button),
                    ElementState::Released => mouse.on_button_up(*button),
                }
            }
            WindowEvent::CursorMoved { position, .. } => {
                let mut mouse = self.mouse.write().unwrap();
                mouse.on_mouse_move(position.x, position.y);
            }
            WindowEvent::MouseWheel { delta, .. } => {
                let mut mouse = self.mouse.write().unwrap();
                let wheel_delta = match delta {
                    MouseScrollDelta::LineDelta(_x, y) => *y,
                    MouseScrollDelta::PixelDelta(pos) => (pos.y as f32) / 100.0,
                };
                mouse.on_mouse_wheel(wheel_delta);
            }
            _ => {}
        }
    }

    /// Update input state - call at end of each frame
    pub fn update(&self) {
        let keyboard = self.keyboard.read().unwrap();
        let mouse = self.mouse.read().unwrap();

        // Update action system based on current input state
        let mut action_system = self.action_system.write().unwrap();
        action_system.update(&*keyboard, &*mouse);
    }

    /// Clear frame-based state - call after update
    pub fn clear_frame_state(&self) {
        self.keyboard.write().unwrap().clear_frame_state();
        self.mouse.write().unwrap().clear_frame_state();
        self.action_system.write().unwrap().clear_frame_state();
    }

    // Keyboard queries
    pub fn is_key_down(&self, key_name: &str) -> bool {
        if let Some(keycode) = KeyboardInput::parse_key_name(key_name) {
            self.keyboard.read().unwrap().is_key_down(keycode)
        } else {
            false
        }
    }

    pub fn is_key_pressed(&self, key_name: &str) -> bool {
        if let Some(keycode) = KeyboardInput::parse_key_name(key_name) {
            self.keyboard.read().unwrap().is_key_pressed(keycode)
        } else {
            false
        }
    }

    pub fn is_key_released(&self, key_name: &str) -> bool {
        if let Some(keycode) = KeyboardInput::parse_key_name(key_name) {
            self.keyboard.read().unwrap().is_key_released(keycode)
        } else {
            false
        }
    }

    // Mouse queries
    pub fn is_mouse_button_down(&self, button: u8) -> bool {
        if let Some(mouse_button) = MouseInput::parse_button_number(button) {
            self.mouse.read().unwrap().is_button_down(mouse_button)
        } else {
            false
        }
    }

    pub fn is_mouse_button_pressed(&self, button: u8) -> bool {
        if let Some(mouse_button) = MouseInput::parse_button_number(button) {
            self.mouse.read().unwrap().is_button_pressed(mouse_button)
        } else {
            false
        }
    }

    pub fn is_mouse_button_released(&self, button: u8) -> bool {
        if let Some(mouse_button) = MouseInput::parse_button_number(button) {
            self.mouse.read().unwrap().is_button_released(mouse_button)
        } else {
            false
        }
    }

    pub fn mouse_position(&self) -> (f64, f64) {
        self.mouse.read().unwrap().position()
    }

    pub fn mouse_delta(&self) -> (f64, f64) {
        self.mouse.read().unwrap().delta()
    }

    pub fn mouse_wheel(&self) -> f32 {
        self.mouse.read().unwrap().wheel_delta()
    }

    pub fn is_pointer_locked(&self) -> bool {
        self.mouse.read().unwrap().is_pointer_locked()
    }

    pub fn set_pointer_locked(&self, locked: bool) {
        self.mouse.write().unwrap().set_pointer_locked(locked);
    }

    // Action system queries
    pub fn get_action_value(&self, map_name: &str, action_name: &str) -> Option<ActionValue> {
        self.action_system
            .read()
            .unwrap()
            .get_action_value(map_name, action_name)
    }

    pub fn is_action_active(&self, map_name: &str, action_name: &str) -> bool {
        self.action_system
            .read()
            .unwrap()
            .is_action_active(map_name, action_name)
    }

    pub fn enable_action_map(&self, map_name: &str) {
        self.action_system.write().unwrap().enable_map(map_name);
    }

    pub fn disable_action_map(&self, map_name: &str) {
        self.action_system.write().unwrap().disable_map(map_name);
    }

    pub fn load_action_maps(&self, json_data: &str) -> anyhow::Result<()> {
        self.action_system
            .write()
            .unwrap()
            .load_from_json(json_data)
    }
}

impl Default for InputManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Action value types
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ActionValue {
    /// Button/axis value (0.0 to 1.0)
    Scalar(f32),
    /// 2D vector (e.g., WASD movement)
    Vector2(f32, f32),
    /// 3D vector
    Vector3(f32, f32, f32),
}

impl ActionValue {
    pub fn as_scalar(&self) -> f32 {
        match self {
            ActionValue::Scalar(v) => *v,
            _ => 0.0,
        }
    }

    pub fn as_vector2(&self) -> (f32, f32) {
        match self {
            ActionValue::Vector2(x, y) => (*x, *y),
            _ => (0.0, 0.0),
        }
    }

    pub fn as_vector3(&self) -> (f32, f32, f32) {
        match self {
            ActionValue::Vector3(x, y, z) => (*x, *y, *z),
            _ => (0.0, 0.0, 0.0),
        }
    }
}
