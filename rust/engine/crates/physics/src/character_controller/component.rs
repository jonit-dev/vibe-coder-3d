//! Character Controller Component
//!
//! ECS component combining configuration and runtime state for kinematic character control.
//! Aligned with TypeScript Contract v2.0 for cross-platform parity.

use anyhow::{Context, Result};
use rapier3d::prelude::*;
use serde::{Deserialize, Serialize};
use vibe_scene::EntityId;

/// Input mapping for auto-control mode
/// Maps gameplay actions to keyboard keys
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputMapping {
    pub forward: String,
    pub backward: String,
    pub left: String,
    pub right: String,
    pub jump: String,
}

impl Default for InputMapping {
    fn default() -> Self {
        Self {
            forward: "w".to_string(),
            backward: "s".to_string(),
            left: "a".to_string(),
            right: "d".to_string(),
            jump: "space".to_string(),
        }
    }
}

/// Centralized configuration for character controller behavior
/// Contract v2.0 - Matches TypeScript implementation exactly
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterControllerConfig {
    /// Whether the character controller is enabled
    pub enabled: bool,

    /// Maximum angle (in degrees) the character can walk up
    /// Valid range: 0-90 degrees
    #[serde(rename = "slopeLimit")]
    pub slope_limit_deg: f32,

    /// Maximum height of steps the character can step over
    /// Valid range: 0.01-2.0 meters
    #[serde(rename = "stepOffset")]
    pub step_offset: f32,

    /// Distance between character collider and environment
    /// Prevents jitter and penetration
    /// Valid range: 0.001-0.5 meters
    #[serde(rename = "skinWidth")]
    pub skin_width: f32,

    /// Multiplier for gravity affecting the character
    /// Valid range: 0.0-10.0 (0 = no gravity, 1 = normal gravity)
    #[serde(rename = "gravityScale")]
    pub gravity_scale: f32,

    /// Maximum horizontal movement speed
    /// Valid range: 0.1-50.0 meters/second
    #[serde(rename = "maxSpeed")]
    pub max_speed: f32,

    /// Upward velocity applied when jumping
    /// Valid range: 0.1-20.0 meters/second
    #[serde(rename = "jumpStrength")]
    pub jump_strength: f32,

    /// Control mode: "auto" (input system driven) or "manual" (script driven)
    #[serde(rename = "controlMode")]
    pub control_mode: String,

    /// Input mapping for auto-control mode (optional)
    #[serde(skip_serializing_if = "Option::is_none", rename = "inputMapping")]
    pub input_mapping: Option<InputMapping>,
}

impl Default for CharacterControllerConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            slope_limit_deg: 45.0,
            step_offset: 0.3,
            skin_width: 0.08,
            gravity_scale: 1.0,
            max_speed: 6.0,
            jump_strength: 6.5,
            control_mode: "auto".to_string(),
            input_mapping: Some(InputMapping::default()),
        }
    }
}

/// Runtime state for character controller
/// Not serialized to scene files - computed each frame
#[derive(Debug, Clone, Default)]
pub struct CharacterControllerState {
    /// Whether the character is currently on the ground
    pub is_grounded: bool,

    /// Last time (in milliseconds) the character was grounded
    /// Used for coyote time (grace period for jumping after leaving ground)
    pub last_grounded_time_ms: u64,

    /// Desired movement input from scripts/input (X and Z in world space)
    pub desired_input_xz: [f32; 2],

    /// Whether a jump has been requested this frame
    pub pending_jump: bool,

    /// Normal vector of the ground surface (if grounded)
    pub ground_normal: [f32; 3],

    /// Current velocity of the character
    pub velocity: Vector<f32>,

    /// The Rapier rigid body handle for this character
    pub body_handle: Option<RigidBodyHandle>,

    /// The Rapier collider handle for this character
    pub collider_handle: Option<ColliderHandle>,
}

/// Complete Character Controller Component
/// Combines configuration and runtime state per the PRD
#[derive(Debug, Clone)]
pub struct CharacterControllerComponent {
    /// Entity ID this component belongs to
    pub entity_id: EntityId,

    /// Configuration (serializable, editor-editable)
    pub config: CharacterControllerConfig,

    /// Runtime state (transient, computed per frame)
    pub state: CharacterControllerState,
}

impl CharacterControllerComponent {
    /// Create a new character controller component
    pub fn new(entity_id: EntityId, config: CharacterControllerConfig) -> Self {
        Self {
            entity_id,
            config,
            state: CharacterControllerState::default(),
        }
    }

    /// Set movement input (called by scripts or auto-input system)
    pub fn set_move_input(&mut self, input: [f32; 2]) {
        self.state.desired_input_xz = input;
    }

    /// Request a jump (called by scripts or auto-input system)
    pub fn request_jump(&mut self) {
        self.state.pending_jump = true;
    }

    /// Clear jump request (consumed by system after processing)
    pub fn clear_jump_request(&mut self) {
        self.state.pending_jump = false;
    }

    /// Update slope limit (editor or script setter)
    pub fn set_slope_limit(&mut self, deg: f32) {
        self.config.slope_limit_deg = deg.clamp(0.0, 90.0);
    }

    /// Update step offset (editor or script setter)
    pub fn set_step_offset(&mut self, h: f32) {
        self.config.step_offset = h.max(0.0);
    }

    /// Check if character can jump (grounded or within coyote time)
    pub fn can_jump(&self, current_time_ms: u64, coyote_time_ms: u64) -> bool {
        if self.state.is_grounded {
            return true;
        }

        // Coyote time: allow jumping shortly after leaving ground
        let time_since_grounded = current_time_ms.saturating_sub(self.state.last_grounded_time_ms);
        time_since_grounded <= coyote_time_ms
    }

    /// Get slope limit in radians (for physics calculations)
    pub fn slope_limit_rad(&self) -> f32 {
        self.config.slope_limit_deg.to_radians()
    }
}

impl CharacterControllerConfig {
    /// Validate configuration parameters and enforce invariants
    pub fn validate(&self) -> Result<()> {
        // Slope limit: 0-90 degrees
        if !(0.0..=90.0).contains(&self.slope_limit_deg) {
            anyhow::bail!(
                "Invalid slope_limit: {}. Must be between 0 and 90 degrees",
                self.slope_limit_deg
            );
        }

        // Step offset: reasonable range for human-sized characters
        if !(0.01..=2.0).contains(&self.step_offset) {
            anyhow::bail!(
                "Invalid step_offset: {}. Must be between 0.01 and 2.0 meters",
                self.step_offset
            );
        }

        // Skin width: must be positive and reasonable
        if !(0.001..=0.5).contains(&self.skin_width) {
            anyhow::bail!(
                "Invalid skin_width: {}. Must be between 0.001 and 0.5 meters",
                self.skin_width
            );
        }

        // Gravity scale: non-negative multiplier
        if !(0.0..=10.0).contains(&self.gravity_scale) {
            anyhow::bail!(
                "Invalid gravity_scale: {}. Must be between 0.0 and 10.0",
                self.gravity_scale
            );
        }

        // Max speed: reasonable movement speeds
        if !(0.1..=50.0).contains(&self.max_speed) {
            anyhow::bail!(
                "Invalid max_speed: {}. Must be between 0.1 and 50.0 m/s",
                self.max_speed
            );
        }

        // Jump strength: realistic jump velocities
        if !(0.1..=20.0).contains(&self.jump_strength) {
            anyhow::bail!(
                "Invalid jump_strength: {}. Must be between 0.1 and 20.0 m/s",
                self.jump_strength
            );
        }

        // Control mode: must be "auto" or "manual"
        if self.control_mode != "auto" && self.control_mode != "manual" {
            anyhow::bail!(
                "Invalid control_mode: '{}'. Must be 'auto' or 'manual'",
                self.control_mode
            );
        }

        // Cross-parameter invariants
        if self.skin_width >= self.step_offset {
            anyhow::bail!(
                "skin_width ({}) must be less than step_offset ({})",
                self.skin_width,
                self.step_offset
            );
        }

        Ok(())
    }

    /// Create from a JSON component (for scene loading)
    pub fn from_component(component: &serde_json::Value) -> Result<Self> {
        // Parse input mapping if present
        let input_mapping = if let Some(mapping) = component.get("inputMapping") {
            Some(InputMapping {
                forward: mapping["forward"].as_str().unwrap_or("w").to_string(),
                backward: mapping["backward"].as_str().unwrap_or("s").to_string(),
                left: mapping["left"].as_str().unwrap_or("a").to_string(),
                right: mapping["right"].as_str().unwrap_or("d").to_string(),
                jump: mapping["jump"].as_str().unwrap_or("space").to_string(),
            })
        } else {
            None
        };

        let config = Self {
            enabled: component["enabled"].as_bool().unwrap_or(true),
            slope_limit_deg: component["slopeLimit"].as_f64().unwrap_or(45.0) as f32,
            step_offset: component["stepOffset"].as_f64().unwrap_or(0.3) as f32,
            skin_width: component["skinWidth"].as_f64().unwrap_or(0.08) as f32,
            gravity_scale: component["gravityScale"].as_f64().unwrap_or(1.0) as f32,
            max_speed: component["maxSpeed"].as_f64().unwrap_or(6.0) as f32,
            jump_strength: component["jumpStrength"].as_f64().unwrap_or(6.5) as f32,
            control_mode: component["controlMode"]
                .as_str()
                .unwrap_or("auto")
                .to_string(),
            input_mapping,
        };

        config
            .validate()
            .with_context(|| format!("Invalid CharacterController component: {:?}", component))?;

        Ok(config)
    }

    /// Convert to JSON component format (for scene saving)
    pub fn to_component(&self, is_grounded: bool) -> serde_json::Value {
        let mut json = serde_json::json!({
            "enabled": self.enabled,
            "slopeLimit": self.slope_limit_deg,
            "stepOffset": self.step_offset,
            "skinWidth": self.skin_width,
            "gravityScale": self.gravity_scale,
            "maxSpeed": self.max_speed,
            "jumpStrength": self.jump_strength,
            "controlMode": self.control_mode,
            "isGrounded": is_grounded
        });

        // Add input mapping if present
        if let Some(ref mapping) = self.input_mapping {
            json["inputMapping"] = serde_json::json!({
                "forward": mapping.forward,
                "backward": mapping.backward,
                "left": mapping.left,
                "right": mapping.right,
                "jump": mapping.jump
            });
        }

        json
    }
}

/// Preset configurations for common character types
#[derive(Debug, Clone, PartialEq)]
pub enum CharacterControllerPreset {
    /// Standard human-sized character
    Human,
    /// Small, agile creature (like a cat or small robot)
    SmallCreature,
    /// Heavy, strong character (like a robot or armored character)
    HeavyCharacter,
    /// Light, floaty character (low gravity, high jumps)
    Floaty,
}

impl CharacterControllerConfig {
    /// Apply preset configurations for different character types
    pub fn apply_preset(&mut self, preset: CharacterControllerPreset) {
        match preset {
            CharacterControllerPreset::Human => {
                self.slope_limit_deg = 45.0;
                self.step_offset = 0.3;
                self.skin_width = 0.08;
                self.gravity_scale = 1.0;
                self.max_speed = 6.0;
                self.jump_strength = 6.5;
            }
            CharacterControllerPreset::SmallCreature => {
                self.slope_limit_deg = 60.0;
                self.step_offset = 0.15;
                self.skin_width = 0.04;
                self.gravity_scale = 0.8;
                self.max_speed = 4.0;
                self.jump_strength = 4.0;
            }
            CharacterControllerPreset::HeavyCharacter => {
                self.slope_limit_deg = 30.0;
                self.step_offset = 0.4;
                self.skin_width = 0.12;
                self.gravity_scale = 1.2;
                self.max_speed = 4.0;
                self.jump_strength = 3.0;
            }
            CharacterControllerPreset::Floaty => {
                self.slope_limit_deg = 90.0;
                self.step_offset = 0.5;
                self.skin_width = 0.1;
                self.gravity_scale = 0.3;
                self.max_speed = 8.0;
                self.jump_strength = 10.0;
            }
        }
    }
}

/// Physics configuration for simulation-wide settings
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PhysicsConfig {
    /// Gravity vector (Y-up coordinate system)
    /// Standard Earth gravity: [0.0, -9.81, 0.0]
    pub gravity: [f32; 3],

    /// Time step for physics simulation
    /// Valid range: 0.001-0.1 seconds
    pub time_step: f32,

    /// Maximum penetration depth before correction
    /// Valid range: 0.001-0.1 meters
    pub max_penetration: f32,

    /// Distance threshold for collision detection
    /// Valid range: 0.0001-0.01 meters
    pub contact_distance: f32,
}

impl Default for PhysicsConfig {
    fn default() -> Self {
        Self {
            gravity: [0.0, -9.81, 0.0],
            time_step: 1.0 / 60.0, // 60 Hz
            max_penetration: 0.01,
            contact_distance: 0.001,
        }
    }
}

impl PhysicsConfig {
    /// Validate physics configuration parameters
    pub fn validate(&self) -> Result<()> {
        // Time step: reasonable for real-time simulation
        if !(0.001..=0.1).contains(&self.time_step) {
            anyhow::bail!(
                "Invalid time_step: {}. Must be between 0.001 and 0.1 seconds",
                self.time_step
            );
        }

        // Max penetration: prevent objects from sinking into each other
        if !(0.001..=0.1).contains(&self.max_penetration) {
            anyhow::bail!(
                "Invalid max_penetration: {}. Must be between 0.001 and 0.1 meters",
                self.max_penetration
            );
        }

        // Contact distance: must be smaller than max penetration
        if !(0.0001..=0.01).contains(&self.contact_distance) {
            anyhow::bail!(
                "Invalid contact_distance: {}. Must be between 0.0001 and 0.01 meters",
                self.contact_distance
            );
        }

        // Cross-parameter invariants
        if self.contact_distance >= self.max_penetration {
            anyhow::bail!(
                "contact_distance ({}) must be less than max_penetration ({})",
                self.contact_distance,
                self.max_penetration
            );
        }

        Ok(())
    }
}
