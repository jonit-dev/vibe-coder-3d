//! Keyboard input state tracking
//!
//! Tracks key states with frame-based tracking for down/pressed/released states.

use std::collections::HashMap;
use winit::event::VirtualKeyCode;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum KeyState {
    /// Key is not pressed
    Up,
    /// Key was just pressed this frame
    JustPressed,
    /// Key is held down (after first frame)
    Down,
    /// Key was just released this frame
    JustReleased,
}

/// Keyboard input state tracker
#[derive(Debug)]
pub struct KeyboardInput {
    states: HashMap<VirtualKeyCode, KeyState>,
}

impl KeyboardInput {
    pub fn new() -> Self {
        Self {
            states: HashMap::new(),
        }
    }

    /// Handle key press event
    pub fn on_key_down(&mut self, keycode: VirtualKeyCode) {
        let current_state = self.states.get(&keycode).copied().unwrap_or(KeyState::Up);

        // Only mark as JustPressed if it was previously Up
        if current_state == KeyState::Up || current_state == KeyState::JustReleased {
            self.states.insert(keycode, KeyState::JustPressed);
        }
    }

    /// Handle key release event
    pub fn on_key_up(&mut self, keycode: VirtualKeyCode) {
        self.states.insert(keycode, KeyState::JustReleased);
    }

    /// Check if key is currently down (held)
    pub fn is_key_down(&self, keycode: VirtualKeyCode) -> bool {
        matches!(
            self.states.get(&keycode),
            Some(KeyState::Down) | Some(KeyState::JustPressed)
        )
    }

    /// Check if key was just pressed this frame
    pub fn is_key_pressed(&self, keycode: VirtualKeyCode) -> bool {
        matches!(self.states.get(&keycode), Some(KeyState::JustPressed))
    }

    /// Check if key was just released this frame
    pub fn is_key_released(&self, keycode: VirtualKeyCode) -> bool {
        matches!(self.states.get(&keycode), Some(KeyState::JustReleased))
    }

    /// Update state for next frame (call at end of frame)
    pub fn clear_frame_state(&mut self) {
        for state in self.states.values_mut() {
            *state = match *state {
                KeyState::JustPressed => KeyState::Down,
                KeyState::JustReleased => KeyState::Up,
                other => other,
            };
        }
    }

    /// Convert string key name to VirtualKeyCode
    pub fn parse_key_name(name: &str) -> Option<VirtualKeyCode> {
        let lower = name.to_lowercase();
        match lower.as_str() {
            // Letters
            "a" => Some(VirtualKeyCode::A),
            "b" => Some(VirtualKeyCode::B),
            "c" => Some(VirtualKeyCode::C),
            "d" => Some(VirtualKeyCode::D),
            "e" => Some(VirtualKeyCode::E),
            "f" => Some(VirtualKeyCode::F),
            "g" => Some(VirtualKeyCode::G),
            "h" => Some(VirtualKeyCode::H),
            "i" => Some(VirtualKeyCode::I),
            "j" => Some(VirtualKeyCode::J),
            "k" => Some(VirtualKeyCode::K),
            "l" => Some(VirtualKeyCode::L),
            "m" => Some(VirtualKeyCode::M),
            "n" => Some(VirtualKeyCode::N),
            "o" => Some(VirtualKeyCode::O),
            "p" => Some(VirtualKeyCode::P),
            "q" => Some(VirtualKeyCode::Q),
            "r" => Some(VirtualKeyCode::R),
            "s" => Some(VirtualKeyCode::S),
            "t" => Some(VirtualKeyCode::T),
            "u" => Some(VirtualKeyCode::U),
            "v" => Some(VirtualKeyCode::V),
            "w" => Some(VirtualKeyCode::W),
            "x" => Some(VirtualKeyCode::X),
            "y" => Some(VirtualKeyCode::Y),
            "z" => Some(VirtualKeyCode::Z),

            // Numbers
            "0" => Some(VirtualKeyCode::Key0),
            "1" => Some(VirtualKeyCode::Key1),
            "2" => Some(VirtualKeyCode::Key2),
            "3" => Some(VirtualKeyCode::Key3),
            "4" => Some(VirtualKeyCode::Key4),
            "5" => Some(VirtualKeyCode::Key5),
            "6" => Some(VirtualKeyCode::Key6),
            "7" => Some(VirtualKeyCode::Key7),
            "8" => Some(VirtualKeyCode::Key8),
            "9" => Some(VirtualKeyCode::Key9),

            // Special keys
            "space" => Some(VirtualKeyCode::Space),
            "escape" | "esc" => Some(VirtualKeyCode::Escape),
            "return" | "enter" => Some(VirtualKeyCode::Return),
            "tab" => Some(VirtualKeyCode::Tab),
            "backspace" => Some(VirtualKeyCode::Back),
            "delete" | "del" => Some(VirtualKeyCode::Delete),

            // Arrow keys
            "up" | "arrowup" => Some(VirtualKeyCode::Up),
            "down" | "arrowdown" => Some(VirtualKeyCode::Down),
            "left" | "arrowleft" => Some(VirtualKeyCode::Left),
            "right" | "arrowright" => Some(VirtualKeyCode::Right),

            // Modifiers
            "shift" | "shiftleft" => Some(VirtualKeyCode::LShift),
            "shiftright" => Some(VirtualKeyCode::RShift),
            "control" | "ctrl" | "controlleft" => Some(VirtualKeyCode::LControl),
            "controlright" | "ctrlright" => Some(VirtualKeyCode::RControl),
            "alt" | "altleft" => Some(VirtualKeyCode::LAlt),
            "altright" => Some(VirtualKeyCode::RAlt),

            // Function keys
            "f1" => Some(VirtualKeyCode::F1),
            "f2" => Some(VirtualKeyCode::F2),
            "f3" => Some(VirtualKeyCode::F3),
            "f4" => Some(VirtualKeyCode::F4),
            "f5" => Some(VirtualKeyCode::F5),
            "f6" => Some(VirtualKeyCode::F6),
            "f7" => Some(VirtualKeyCode::F7),
            "f8" => Some(VirtualKeyCode::F8),
            "f9" => Some(VirtualKeyCode::F9),
            "f10" => Some(VirtualKeyCode::F10),
            "f11" => Some(VirtualKeyCode::F11),
            "f12" => Some(VirtualKeyCode::F12),

            _ => None,
        }
    }
}

impl Default for KeyboardInput {
    fn default() -> Self {
        Self::new()
    }
}
