//! Bridge between InputManager and scripting API

use super::manager::{ActionValue, InputManager};
use vibe_scripting::InputApiProvider;

impl InputApiProvider for InputManager {
    fn is_key_down(&self, key: &str) -> bool {
        self.is_key_down(key)
    }

    fn is_key_pressed(&self, key: &str) -> bool {
        self.is_key_pressed(key)
    }

    fn is_key_released(&self, key: &str) -> bool {
        self.is_key_released(key)
    }

    fn is_mouse_button_down(&self, button: u8) -> bool {
        self.is_mouse_button_down(button)
    }

    fn is_mouse_button_pressed(&self, button: u8) -> bool {
        self.is_mouse_button_pressed(button)
    }

    fn is_mouse_button_released(&self, button: u8) -> bool {
        self.is_mouse_button_released(button)
    }

    fn mouse_position(&self) -> (f64, f64) {
        self.mouse_position()
    }

    fn mouse_delta(&self) -> (f64, f64) {
        self.mouse_delta()
    }

    fn mouse_wheel(&self) -> f32 {
        self.mouse_wheel()
    }

    fn is_pointer_locked(&self) -> bool {
        self.is_pointer_locked()
    }

    fn lock_pointer(&self) {
        self.set_pointer_locked(true);
    }

    fn unlock_pointer(&self) {
        self.set_pointer_locked(false);
    }

    fn get_action_value(&self, map_name: &str, action_name: &str) -> Option<(String, Vec<f32>)> {
        self.get_action_value(map_name, action_name)
            .map(|value| match value {
                ActionValue::Scalar(v) => ("scalar".to_string(), vec![v]),
                ActionValue::Vector2(x, y) => ("vector2".to_string(), vec![x, y]),
                ActionValue::Vector3(x, y, z) => ("vector3".to_string(), vec![x, y, z]),
            })
    }

    fn is_action_active(&self, map_name: &str, action_name: &str) -> bool {
        self.is_action_active(map_name, action_name)
    }

    fn enable_action_map(&self, map_name: &str) {
        self.enable_action_map(map_name);
    }

    fn disable_action_map(&self, map_name: &str) {
        self.disable_action_map(map_name);
    }
}
