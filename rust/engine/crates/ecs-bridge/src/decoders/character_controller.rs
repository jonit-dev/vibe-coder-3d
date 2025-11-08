//! CharacterController component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use super::common::default_enabled;
use crate::{ComponentCapabilities, IComponentDecoder};

/// Input mapping for auto-control mode
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InputMapping {
    #[serde(default = "default_forward")]
    pub forward: String,
    #[serde(default = "default_backward")]
    pub backward: String,
    #[serde(default = "default_left")]
    pub left: String,
    #[serde(default = "default_right")]
    pub right: String,
    #[serde(default = "default_jump")]
    pub jump: String,
}

fn default_forward() -> String {
    "w".to_string()
}
fn default_backward() -> String {
    "s".to_string()
}
fn default_left() -> String {
    "a".to_string()
}
fn default_right() -> String {
    "d".to_string()
}
fn default_jump() -> String {
    "space".to_string()
}

impl Default for InputMapping {
    fn default() -> Self {
        Self {
            forward: default_forward(),
            backward: default_backward(),
            left: default_left(),
            right: default_right(),
            jump: default_jump(),
        }
    }
}

/// CharacterController component following TypeScript Contract v2.0
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CharacterController {
    #[serde(default = "default_enabled")]
    pub enabled: bool,

    #[serde(default = "default_slope_limit", rename = "slopeLimit")]
    pub slope_limit: f32,

    #[serde(default = "default_step_offset", rename = "stepOffset")]
    pub step_offset: f32,

    #[serde(default = "default_skin_width", rename = "skinWidth")]
    pub skin_width: f32,

    #[serde(default = "default_gravity_scale", rename = "gravityScale")]
    pub gravity_scale: f32,

    #[serde(default = "default_max_speed", rename = "maxSpeed")]
    pub max_speed: f32,

    #[serde(default = "default_jump_strength", rename = "jumpStrength")]
    pub jump_strength: f32,

    #[serde(default = "default_control_mode", rename = "controlMode")]
    pub control_mode: String,

    #[serde(skip_serializing_if = "Option::is_none", rename = "inputMapping")]
    pub input_mapping: Option<InputMapping>,

    #[serde(default, rename = "isGrounded")]
    pub is_grounded: bool,
}

// Default value functions
fn default_slope_limit() -> f32 {
    45.0
}

fn default_step_offset() -> f32 {
    0.3
}

fn default_skin_width() -> f32 {
    0.08
}

fn default_gravity_scale() -> f32 {
    1.0
}

fn default_max_speed() -> f32 {
    6.0
}

fn default_jump_strength() -> f32 {
    6.5
}

fn default_control_mode() -> String {
    "auto".to_string()
}

impl Default for CharacterController {
    fn default() -> Self {
        Self {
            enabled: true,
            slope_limit: default_slope_limit(),
            step_offset: default_step_offset(),
            skin_width: default_skin_width(),
            gravity_scale: default_gravity_scale(),
            max_speed: default_max_speed(),
            jump_strength: default_jump_strength(),
            control_mode: default_control_mode(),
            input_mapping: Some(InputMapping::default()),
            is_grounded: false,
        }
    }
}

/// Decoder for CharacterController components
pub struct CharacterControllerDecoder;

impl IComponentDecoder for CharacterControllerDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "CharacterController"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: CharacterController = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false, // Character controller doesn't affect rendering directly
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("CharacterController")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_character_controller_decoder() {
        let decoder = CharacterControllerDecoder;

        assert!(decoder.can_decode("CharacterController"));
        assert!(!decoder.can_decode("RigidBody"));

        let json = serde_json::json!({
            "enabled": true,
            "slopeLimit": 50.0,
            "stepOffset": 0.4,
            "maxSpeed": 8.0
        });

        let result = decoder.decode(&json);
        assert!(result.is_ok());

        let boxed = result.unwrap();
        let controller = boxed.downcast_ref::<CharacterController>().unwrap();
        assert!(controller.enabled);
        assert_eq!(controller.slope_limit, 50.0);
        assert_eq!(controller.step_offset, 0.4);
        assert_eq!(controller.max_speed, 8.0);
        // Defaults should be applied
        assert_eq!(controller.skin_width, 0.08);
        assert_eq!(controller.jump_strength, 6.5);
    }

    #[test]
    fn test_character_controller_with_input_mapping() {
        let json = serde_json::json!({
            "enabled": true,
            "controlMode": "auto",
            "inputMapping": {
                "forward": "w",
                "backward": "s",
                "left": "a",
                "right": "d",
                "jump": "space"
            }
        });

        let controller: CharacterController = serde_json::from_value(json).unwrap();
        assert_eq!(controller.control_mode, "auto");
        assert!(controller.input_mapping.is_some());

        let mapping = controller.input_mapping.unwrap();
        assert_eq!(mapping.forward, "w");
        assert_eq!(mapping.jump, "space");
    }

    #[test]
    fn test_character_controller_defaults() {
        let controller = CharacterController::default();
        assert!(controller.enabled);
        assert_eq!(controller.slope_limit, 45.0);
        assert_eq!(controller.step_offset, 0.3);
        assert_eq!(controller.skin_width, 0.08);
        assert_eq!(controller.gravity_scale, 1.0);
        assert_eq!(controller.max_speed, 6.0);
        assert_eq!(controller.jump_strength, 6.5);
        assert_eq!(controller.control_mode, "auto");
        assert!(!controller.is_grounded);
    }

    #[test]
    fn test_component_capabilities() {
        let decoder = CharacterControllerDecoder;
        let caps = decoder.capabilities();
        assert!(!caps.affects_rendering);
        assert!(caps.stable);
        assert!(caps.requires_pass.is_none());
    }
}
