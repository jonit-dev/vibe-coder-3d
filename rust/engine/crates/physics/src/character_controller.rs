//! Character Controller Configuration
//!
//! Centralized configuration and validation for character controller parameters.
//! Provides invariant checks and reasonable defaults to stabilize gameplay feel.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Centralized configuration for character controller behavior
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CharacterControllerConfig {
    /// Maximum angle (in degrees) the character can walk up
    /// Valid range: 0-90 degrees
    pub slope_limit: f32,

    /// Maximum height of steps the character can step over
    /// Valid range: 0.01-2.0 meters
    pub step_offset: f32,

    /// Distance between character collider and environment
    /// Prevents jitter and penetration
    /// Valid range: 0.001-0.5 meters
    pub skin_width: f32,

    /// Multiplier for gravity affecting the character
    /// Valid range: 0.0-10.0 (0 = no gravity, 1 = normal gravity)
    pub gravity_scale: f32,

    /// Maximum horizontal movement speed
    /// Valid range: 0.1-50.0 meters/second
    pub max_speed: f32,

    /// Upward velocity applied when jumping
    /// Valid range: 0.1-20.0 meters/second
    pub jump_strength: f32,

    /// Maximum speed change per frame (for smooth acceleration)
    /// Valid range: 1.0-100.0 meters/second²
    pub acceleration: f32,

    /// Maximum speed for auto-snapping to ground
    /// Valid range: 0.1-20.0 meters/second
    pub snap_max_speed: f32,

    /// Maximum distance to resolve penetration per frame
    /// Valid range: 0.01-2.0 meters
    pub max_depenetration_per_frame: f32,

    /// Force applied when pushing dynamic objects
    /// Valid range: 0.0-100.0
    pub push_strength: f32,

    /// Maximum mass of objects that can be pushed (0 = unlimited)
    /// Valid range: 0.0-1000.0 kg
    pub max_push_mass: f32,
}

impl Default for CharacterControllerConfig {
    fn default() -> Self {
        Self {
            slope_limit: 45.0,
            step_offset: 0.3,
            skin_width: 0.08,
            gravity_scale: 1.0,
            max_speed: 6.0,
            jump_strength: 6.5,
            acceleration: 20.0,
            snap_max_speed: 5.0,
            max_depenetration_per_frame: 0.5,
            push_strength: 1.0,
            max_push_mass: 0.0, // 0 = unlimited
        }
    }
}

impl CharacterControllerConfig {
    /// Create a new config with validated parameters
    pub fn new(
        slope_limit: f32,
        step_offset: f32,
        skin_width: f32,
        gravity_scale: f32,
        max_speed: f32,
        jump_strength: f32,
        acceleration: f32,
        snap_max_speed: f32,
        max_depenetration_per_frame: f32,
        push_strength: f32,
        max_push_mass: f32,
    ) -> Result<Self> {
        let config = Self {
            slope_limit,
            step_offset,
            skin_width,
            gravity_scale,
            max_speed,
            jump_strength,
            acceleration,
            snap_max_speed,
            max_depenetration_per_frame,
            push_strength,
            max_push_mass,
        };

        config.validate()
            .context("Failed to create CharacterControllerConfig")?;

        Ok(config)
    }

    /// Validate configuration parameters and enforce invariants
    pub fn validate(&self) -> Result<()> {
        // Slope limit: 0-90 degrees
        if !(0.0..=90.0).contains(&self.slope_limit) {
            anyhow::bail!(
                "Invalid slope_limit: {}. Must be between 0 and 90 degrees",
                self.slope_limit
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

        // Acceleration: smooth but responsive
        if !(1.0..=100.0).contains(&self.acceleration) {
            anyhow::bail!(
                "Invalid acceleration: {}. Must be between 1.0 and 100.0 m/s²",
                self.acceleration
            );
        }

        // Snap max speed: should be less than or equal to max speed
        if !(0.1..=20.0).contains(&self.snap_max_speed) {
            anyhow::bail!(
                "Invalid snap_max_speed: {}. Must be between 0.1 and 20.0 m/s",
                self.snap_max_speed
            );
        }

        // Max depenetration: prevent tunneling through walls
        if !(0.01..=2.0).contains(&self.max_depenetration_per_frame) {
            anyhow::bail!(
                "Invalid max_depenetration_per_frame: {}. Must be between 0.01 and 2.0 meters",
                self.max_depenetration_per_frame
            );
        }

        // Push strength: reasonable interaction force
        if !(0.0..=100.0).contains(&self.push_strength) {
            anyhow::bail!(
                "Invalid push_strength: {}. Must be between 0.0 and 100.0",
                self.push_strength
            );
        }

        // Max push mass: limit what can be pushed
        if !(0.0..=1000.0).contains(&self.max_push_mass) {
            anyhow::bail!(
                "Invalid max_push_mass: {}. Must be between 0.0 and 1000.0 kg",
                self.max_push_mass
            );
        }

        // Cross-parameter invariants

        // Skin width should be less than step offset
        if self.skin_width >= self.step_offset {
            anyhow::bail!(
                "skin_width ({}) must be less than step_offset ({})",
                self.skin_width, self.step_offset
            );
        }

        // Step offset should be reasonable relative to character scale
        if self.step_offset > 1.0 {
            log::warn!(
                "Large step_offset ({}) may cause instability. Consider values <= 1.0 for human-sized characters",
                self.step_offset
            );
        }

        // Snap speed shouldn't exceed max speed significantly
        if self.snap_max_speed > self.max_speed * 3.0 {
            anyhow::bail!(
                "snap_max_speed ({}) shouldn't exceed max_speed ({}) by more than 3x",
                self.snap_max_speed, self.max_speed
            );
        }

        // Depenetration should be reasonable per frame
        if self.max_depenetration_per_frame > self.step_offset * 2.0 {
            log::warn!(
                "Large max_depenetration_per_frame ({}) may cause jitter. Consider values <= 2x step_offset ({})",
                self.max_depenetration_per_frame, self.step_offset * 2.0
            );
        }

        Ok(())
    }

    /// Create from a JSON component (for scene loading)
    pub fn from_component(component: &serde_json::Value) -> Result<Self> {
        let config = Self {
            slope_limit: component["slopeLimit"].as_f64().unwrap_or(45.0) as f32,
            step_offset: component["stepOffset"].as_f64().unwrap_or(0.3) as f32,
            skin_width: component["skinWidth"].as_f64().unwrap_or(0.08) as f32,
            gravity_scale: component["gravityScale"].as_f64().unwrap_or(1.0) as f32,
            max_speed: component["maxSpeed"].as_f64().unwrap_or(6.0) as f32,
            jump_strength: component["jumpStrength"].as_f64().unwrap_or(6.5) as f32,
            acceleration: component["acceleration"].as_f64().unwrap_or(20.0) as f32,
            snap_max_speed: component["snapMaxSpeed"].as_f64().unwrap_or(5.0) as f32,
            max_depenetration_per_frame: component["maxDepenetrationPerFrame"].as_f64().unwrap_or(0.5) as f32,
            push_strength: component["pushStrength"].as_f64().unwrap_or(1.0) as f32,
            max_push_mass: component["maxPushMass"].as_f64().unwrap_or(0.0) as f32,
        };

        config.validate()
            .with_context(|| format!("Invalid CharacterController component: {:?}", component))?;

        Ok(config)
    }

    /// Convert to JSON component format (for scene saving)
    pub fn to_component(&self) -> serde_json::Value {
        serde_json::json!({
            "enabled": true,
            "slopeLimit": self.slope_limit,
            "stepOffset": self.step_offset,
            "skinWidth": self.skin_width,
            "gravityScale": self.gravity_scale,
            "maxSpeed": self.max_speed,
            "jumpStrength": self.jump_strength,
            "acceleration": self.acceleration,
            "snapMaxSpeed": self.snap_max_speed,
            "maxDepenetrationPerFrame": self.max_depenetration_per_frame,
            "pushStrength": self.push_strength,
            "maxPushMass": self.max_push_mass,
            "controlMode": "auto",
            "inputMapping": {
                "forward": "w",
                "backward": "s",
                "left": "a",
                "right": "d",
                "jump": "space"
            },
            "isGrounded": false
        })
    }

    /// Apply preset configurations for different character types
    pub fn apply_preset(&mut self, preset: CharacterControllerPreset) {
        match preset {
            CharacterControllerPreset::Human => {
                self.slope_limit = 45.0;
                self.step_offset = 0.3;
                self.skin_width = 0.08;
                self.gravity_scale = 1.0;
                self.max_speed = 6.0;
                self.jump_strength = 6.5;
                self.acceleration = 20.0;
                self.snap_max_speed = 5.0;
            }
            CharacterControllerPreset::SmallCreature => {
                self.slope_limit = 60.0;
                self.step_offset = 0.15;
                self.skin_width = 0.04;
                self.gravity_scale = 0.8;
                self.max_speed = 4.0;
                self.jump_strength = 4.0;
                self.acceleration = 30.0;
                self.snap_max_speed = 3.0;
            }
            CharacterControllerPreset::HeavyCharacter => {
                self.slope_limit = 30.0;
                self.step_offset = 0.4;
                self.skin_width = 0.12;
                self.gravity_scale = 1.2;
                self.max_speed = 4.0;
                self.jump_strength = 3.0;
                self.acceleration = 10.0;
                self.snap_max_speed = 2.0;
                self.push_strength = 5.0;
                self.max_push_mass = 100.0;
            }
            CharacterControllerPreset::Floaty => {
                self.slope_limit = 90.0;
                self.step_offset = 0.5;
                self.skin_width = 0.1;
                self.gravity_scale = 0.3;
                self.max_speed = 8.0;
                self.jump_strength = 10.0;
                self.acceleration = 15.0;
                self.snap_max_speed = 2.0;
            }
        }
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
    contact_distance: f32,
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
    /// Create a new physics config with validation
    pub fn new(
        gravity: [f32; 3],
        time_step: f32,
        max_penetration: f32,
        contact_distance: f32,
    ) -> Result<Self> {
        let config = Self {
            gravity,
            time_step,
            max_penetration,
            contact_distance,
        };

        config.validate()
            .context("Failed to create PhysicsConfig")?;

        Ok(config)
    }

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
                self.contact_distance, self.max_penetration
            );
        }

        // Gravity should be reasonable (not too extreme)
        let gravity_magnitude = (self.gravity[0].powi(2) + self.gravity[1].powi(2) + self.gravity[2].powi(2)).sqrt();
        if gravity_magnitude > 50.0 {
            log::warn!(
                "Very high gravity magnitude ({}). This may cause instability.",
                gravity_magnitude
            );
        }

        Ok(())
    }

    /// Load from configuration file or environment
    pub fn load_or_default() -> Self {
        // Try to load from environment variables first
        if let Ok(gravity_y) = std::env::var("VIBE_GRAVITY_Y") {
            if let Ok(gravity_y) = gravity_y.parse::<f32>() {
                let mut config = Self::default();
                config.gravity[1] = gravity_y;
                if let Err(e) = config.validate() {
                    log::warn!("Invalid gravity from environment: {}, using default", e);
                    return Self::default();
                }
                return config;
            }
        }

        Self::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_character_controller_config_default() {
        let config = CharacterControllerConfig::default();
        assert!(config.validate().is_ok());
        assert_eq!(config.slope_limit, 45.0);
        assert_eq!(config.max_speed, 6.0);
    }

    #[test]
    fn test_character_controller_config_validation() {
        // Test valid config
        let config = CharacterControllerConfig::new(
            45.0, 0.3, 0.08, 1.0, 6.0, 6.5, 20.0, 5.0, 0.5, 1.0, 0.0
        ).unwrap();
        assert!(config.validate().is_ok());

        // Test invalid slope limit
        let result = CharacterControllerConfig::new(
            100.0, 0.3, 0.08, 1.0, 6.0, 6.5, 20.0, 5.0, 0.5, 1.0, 0.0
        );
        assert!(result.is_err());

        // Test skin width >= step offset
        let result = CharacterControllerConfig::new(
            45.0, 0.1, 0.15, 1.0, 6.0, 6.5, 20.0, 5.0, 0.5, 1.0, 0.0
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_character_controller_presets() {
        let mut config = CharacterControllerConfig::default();

        config.apply_preset(CharacterControllerPreset::Human);
        assert_eq!(config.max_speed, 6.0);
        assert_eq!(config.jump_strength, 6.5);

        config.apply_preset(CharacterControllerPreset::SmallCreature);
        assert_eq!(config.max_speed, 4.0);
        assert_eq!(config.step_offset, 0.15);

        config.apply_preset(CharacterControllerPreset::HeavyCharacter);
        assert_eq!(config.max_speed, 4.0);
        assert_eq!(config.push_strength, 5.0);

        config.apply_preset(CharacterControllerPreset::Floaty);
        assert_eq!(config.gravity_scale, 0.3);
        assert_eq!(config.jump_strength, 10.0);
    }

    #[test]
    fn test_physics_config_default() {
        let config = PhysicsConfig::default();
        assert!(config.validate().is_ok());
        assert_eq!(config.gravity, [0.0, -9.81, 0.0]);
        assert_eq!(config.time_step, 1.0 / 60.0);
    }

    #[test]
    fn test_physics_config_validation() {
        // Test valid config
        let config = PhysicsConfig::new(
            [0.0, -9.81, 0.0], 1.0/60.0, 0.01, 0.001
        ).unwrap();
        assert!(config.validate().is_ok());

        // Test invalid time step
        let result = PhysicsConfig::new(
            [0.0, -9.81, 0.0], 0.2, 0.01, 0.001
        );
        assert!(result.is_err());

        // Test contact distance >= max penetration
        let result = PhysicsConfig::new(
            [0.0, -9.81, 0.0], 1.0/60.0, 0.01, 0.02
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_from_component() {
        let component = serde_json::json!({
            "slopeLimit": 60.0,
            "stepOffset": 0.4,
            "skinWidth": 0.1,
            "maxSpeed": 8.0
        });

        let config = CharacterControllerConfig::from_component(&component).unwrap();
        assert_eq!(config.slope_limit, 60.0);
        assert_eq!(config.step_offset, 0.4);
        assert_eq!(config.skin_width, 0.1);
        assert_eq!(config.max_speed, 8.0);
    }

    #[test]
    fn test_to_component() {
        let config = CharacterControllerConfig {
            slope_limit: 50.0,
            max_speed: 10.0,
            jump_strength: 8.0,
            ..Default::default()
        };

        let component = config.to_component();
        assert_eq!(component["slopeLimit"], 50.0);
        assert_eq!(component["maxSpeed"], 10.0);
        assert_eq!(component["jumpStrength"], 8.0);
        assert!(component["enabled"].as_bool().unwrap());
    }
}