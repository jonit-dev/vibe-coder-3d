//! Sound component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::{default_true, default_false};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Sound {
    #[serde(default)]
    pub audioPath: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_false")]
    pub autoplay: bool,
    #[serde(default = "default_false")]
    pub loop_: bool, // 'loop' is a Rust keyword, use loop_
    #[serde(rename = "loop", default = "default_false")]
    _loop_serde: bool, // For correct serde deserialization
    #[serde(default = "default_volume")]
    pub volume: f32,
    #[serde(default = "default_pitch")]
    pub pitch: f32,
    #[serde(default = "default_playback_rate")]
    pub playbackRate: f32,
    #[serde(default = "default_false")]
    pub muted: bool,

    // 3D Spatial Audio Properties
    #[serde(default = "default_true")]
    pub is3D: bool,
    #[serde(default = "default_min_distance")]
    pub minDistance: f32,
    #[serde(default = "default_max_distance")]
    pub maxDistance: f32,
    #[serde(default = "default_rolloff_factor")]
    pub rolloffFactor: f32,
    #[serde(default = "default_cone_inner_angle")]
    pub coneInnerAngle: f32,
    #[serde(default = "default_cone_outer_angle")]
    pub coneOuterAngle: f32,
    #[serde(default = "default_cone_outer_gain")]
    pub coneOuterGain: f32,

    // Playback State (read-only, managed by system)
    #[serde(default = "default_false")]
    pub isPlaying: bool,
    #[serde(default)]
    pub currentTime: f32,
    #[serde(default)]
    pub duration: f32,

    // Audio Format
    #[serde(default)]
    pub format: Option<String>,
}

// Default value functions for Sound
fn default_volume() -> f32 {
    1.0
}

fn default_pitch() -> f32 {
    1.0
}

fn default_playback_rate() -> f32 {
    1.0
}

fn default_min_distance() -> f32 {
    1.0
}

fn default_max_distance() -> f32 {
    10000.0
}

fn default_rolloff_factor() -> f32 {
    1.0
}

fn default_cone_inner_angle() -> f32 {
    360.0
}

fn default_cone_outer_angle() -> f32 {
    360.0
}

fn default_cone_outer_gain() -> f32 {
    0.0
}

impl Sound {
    pub fn is_looping(&self) -> bool {
        self.loop_
    }
}

impl Default for Sound {
    fn default() -> Self {
        Self {
            audioPath: String::new(),
            enabled: true,
            autoplay: false,
            loop_: false,
            _loop_serde: false,
            volume: 1.0,
            pitch: 1.0,
            playbackRate: 1.0,
            muted: false,
            is3D: true,
            minDistance: 1.0,
            maxDistance: 10000.0,
            rolloffFactor: 1.0,
            coneInnerAngle: 360.0,
            coneOuterAngle: 360.0,
            coneOuterGain: 0.0,
            isPlaying: false,
            currentTime: 0.0,
            duration: 0.0,
            format: None,
        }
    }
}

/// Decoder for Sound components
pub struct SoundDecoder;

impl IComponentDecoder for SoundDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Sound"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let mut component: Sound = serde_json::from_value(value.clone())?;
        // Copy the serde-deserialized loop field to the public field
        component.loop_ = component._loop_serde;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: Some("audio"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Sound")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sound_decoder() {
        let decoder = SoundDecoder;
        assert!(decoder.can_decode("Sound"));
        assert!(!decoder.can_decode("Light"));

        let json = serde_json::json!({
            "audioPath": "/sounds/music.mp3",
            "enabled": true,
            "autoplay": false,
            "loop": true,
            "volume": 0.8,
            "pitch": 1.2,
            "playbackRate": 1.5,
            "muted": false,
            "is3D": true,
            "minDistance": 5.0,
            "maxDistance": 100.0,
            "rolloffFactor": 0.5,
            "coneInnerAngle": 90.0,
            "coneOuterAngle": 180.0,
            "coneOuterGain": 0.3,
            "isPlaying": false,
            "currentTime": 0.0,
            "duration": 120.5,
            "format": "mp3"
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Core properties
        assert_eq!(sound.audioPath, "/sounds/music.mp3");
        assert_eq!(sound.enabled, true);
        assert_eq!(sound.autoplay, false);
        assert_eq!(sound.is_looping(), true);
        assert_eq!(sound.volume, 0.8);
        assert_eq!(sound.pitch, 1.2);
        assert_eq!(sound.playbackRate, 1.5);
        assert_eq!(sound.muted, false);

        // 3D Audio properties
        assert_eq!(sound.is3D, true);
        assert_eq!(sound.minDistance, 5.0);
        assert_eq!(sound.maxDistance, 100.0);
        assert_eq!(sound.rolloffFactor, 0.5);
        assert_eq!(sound.coneInnerAngle, 90.0);
        assert_eq!(sound.coneOuterAngle, 180.0);
        assert_eq!(sound.coneOuterGain, 0.3);

        // Playback state
        assert_eq!(sound.isPlaying, false);
        assert_eq!(sound.currentTime, 0.0);
        assert_eq!(sound.duration, 120.5);

        // Format
        assert_eq!(sound.format.as_deref(), Some("mp3"));
    }

    #[test]
    fn test_sound_decoder_defaults() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/test.wav"
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Verify defaults
        assert_eq!(sound.audioPath, "/sounds/test.wav");
        assert_eq!(sound.enabled, true);
        assert_eq!(sound.autoplay, false);
        assert_eq!(sound.is_looping(), false);
        assert_eq!(sound.volume, 1.0);
        assert_eq!(sound.pitch, 1.0);
        assert_eq!(sound.playbackRate, 1.0);
        assert_eq!(sound.muted, false);
        assert_eq!(sound.is3D, true);
        assert_eq!(sound.minDistance, 1.0);
        assert_eq!(sound.maxDistance, 10000.0);
        assert_eq!(sound.rolloffFactor, 1.0);
        assert_eq!(sound.coneInnerAngle, 360.0);
        assert_eq!(sound.coneOuterAngle, 360.0);
        assert_eq!(sound.coneOuterGain, 0.0);
        assert_eq!(sound.isPlaying, false);
        assert_eq!(sound.currentTime, 0.0);
        assert_eq!(sound.duration, 0.0);
        assert_eq!(sound.format, None);
    }

    #[test]
    fn test_sound_loop_keyword_handling() {
        // Test that 'loop' keyword is properly handled via _loop_serde
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/loop_test.wav",
            "loop": true
        });
        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();
        assert_eq!(sound.is_looping(), true);
    }

    #[test]
    fn test_sound_capabilities() {
        let decoder = SoundDecoder;
        let caps = decoder.capabilities();
        assert_eq!(caps.affects_rendering, false); // Audio doesn't affect visual rendering
        assert_eq!(caps.requires_pass, Some("audio"));
        assert!(caps.stable);
    }

    #[test]
    fn test_sound_component_kinds() {
        let decoder = SoundDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Sound");
    }
}