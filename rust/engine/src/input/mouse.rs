//! Mouse input state tracking
//!
//! Tracks mouse button states, position, delta, and wheel with frame-based tracking.

use std::collections::HashMap;
use winit::event::MouseButton;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ButtonState {
    Up,
    JustPressed,
    Down,
    JustReleased,
}

/// Mouse input state tracker
#[derive(Debug)]
pub struct MouseInput {
    button_states: HashMap<MouseButton, ButtonState>,
    position: (f64, f64),
    last_position: (f64, f64),
    wheel_delta: f32,
    pointer_locked: bool,
}

impl MouseInput {
    pub fn new() -> Self {
        Self {
            button_states: HashMap::new(),
            position: (0.0, 0.0),
            last_position: (0.0, 0.0),
            wheel_delta: 0.0,
            pointer_locked: false,
        }
    }

    /// Handle mouse button press
    pub fn on_button_down(&mut self, button: MouseButton) {
        let current_state = self
            .button_states
            .get(&button)
            .copied()
            .unwrap_or(ButtonState::Up);

        if current_state == ButtonState::Up || current_state == ButtonState::JustReleased {
            self.button_states.insert(button, ButtonState::JustPressed);
        }
    }

    /// Handle mouse button release
    pub fn on_button_up(&mut self, button: MouseButton) {
        self.button_states.insert(button, ButtonState::JustReleased);
    }

    /// Handle mouse movement
    pub fn on_mouse_move(&mut self, x: f64, y: f64) {
        self.position = (x, y);
    }

    /// Handle mouse wheel
    pub fn on_mouse_wheel(&mut self, delta: f32) {
        self.wheel_delta += delta;
    }

    /// Check if button is currently down
    pub fn is_button_down(&self, button: MouseButton) -> bool {
        matches!(
            self.button_states.get(&button),
            Some(ButtonState::Down) | Some(ButtonState::JustPressed)
        )
    }

    /// Check if button was just pressed this frame
    pub fn is_button_pressed(&self, button: MouseButton) -> bool {
        matches!(
            self.button_states.get(&button),
            Some(ButtonState::JustPressed)
        )
    }

    /// Check if button was just released this frame
    pub fn is_button_released(&self, button: MouseButton) -> bool {
        matches!(
            self.button_states.get(&button),
            Some(ButtonState::JustReleased)
        )
    }

    /// Get current mouse position
    pub fn position(&self) -> (f64, f64) {
        self.position
    }

    /// Get mouse delta since last frame
    pub fn delta(&self) -> (f64, f64) {
        (
            self.position.0 - self.last_position.0,
            self.position.1 - self.last_position.1,
        )
    }

    /// Get mouse wheel delta
    pub fn wheel_delta(&self) -> f32 {
        self.wheel_delta
    }

    /// Check if pointer is locked
    pub fn is_pointer_locked(&self) -> bool {
        self.pointer_locked
    }

    /// Set pointer lock state
    pub fn set_pointer_locked(&mut self, locked: bool) {
        self.pointer_locked = locked;
    }

    /// Update state for next frame
    pub fn clear_frame_state(&mut self) {
        // Update button states
        for state in self.button_states.values_mut() {
            *state = match *state {
                ButtonState::JustPressed => ButtonState::Down,
                ButtonState::JustReleased => ButtonState::Up,
                other => other,
            };
        }

        // Update position tracking
        self.last_position = self.position;

        // Clear wheel delta
        self.wheel_delta = 0.0;
    }

    /// Parse mouse button number (0=left, 1=middle, 2=right)
    pub fn parse_button_number(button: u8) -> Option<MouseButton> {
        match button {
            0 => Some(MouseButton::Left),
            1 => Some(MouseButton::Middle),
            2 => Some(MouseButton::Right),
            _ => None,
        }
    }
}

impl Default for MouseInput {
    fn default() -> Self {
        Self::new()
    }
}
