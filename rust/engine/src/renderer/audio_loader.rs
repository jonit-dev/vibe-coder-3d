/// Audio system integration for loading and managing sounds from scenes
///
/// This module provides audio loading capabilities when the `audio-support` feature is enabled.
/// When disabled, it provides stub implementations that log warnings.

use anyhow::Result;
use log::{debug, warn};
use vibe_ecs_bridge::Sound;

#[cfg(feature = "audio-support")]
use vibe_audio::{AudioSystem, SoundHandle};

#[cfg(feature = "audio-support")]
use std::collections::HashMap;

#[cfg(feature = "audio-support")]
use glam::Vec3;

/// Audio manager that handles sound loading and playback
pub struct AudioLoader {
    #[cfg(feature = "audio-support")]
    system: AudioSystem,

    #[cfg(feature = "audio-support")]
    sounds: HashMap<u32, SoundHandle>, // entity_id -> sound_handle

    #[cfg(not(feature = "audio-support"))]
    _phantom: (),
}

impl AudioLoader {
    /// Create a new audio loader
    pub fn new() -> Result<Self> {
        #[cfg(feature = "audio-support")]
        {
            debug!("Initializing audio system (feature enabled)");
            Ok(Self {
                system: AudioSystem::new()?,
                sounds: HashMap::new(),
            })
        }

        #[cfg(not(feature = "audio-support"))]
        {
            warn!("Audio support is disabled (compile with --features audio-support to enable)");
            Ok(Self { _phantom: () })
        }
    }

    /// Load a sound component for an entity
    pub fn load_sound(&mut self, entity_id: u32, sound: &Sound) -> Result<()> {
        #[cfg(feature = "audio-support")]
        {
            if !sound.enabled {
                debug!("Sound for entity {} is disabled, skipping", entity_id);
                return Ok(());
            }

            debug!(
                "Loading sound for entity {}: {} (3D: {}, autoplay: {}, loop: {})",
                entity_id,
                sound.audioPath,
                sound.is3D,
                sound.autoplay,
                sound.is_looping()
            );

            // Load the sound file
            match self.system.load_sound(&sound.audioPath) {
                Ok(handle) => {
                    // Configure sound properties
                    self.system.set_volume(handle, sound.volume);
                    self.system.set_looping(handle, sound.is_looping());

                    // Auto-play if requested
                    if sound.autoplay {
                        self.system.play(handle)?;
                    }

                    // Store the handle
                    self.sounds.insert(entity_id, handle);

                    debug!("Sound loaded successfully for entity {}", entity_id);
                    Ok(())
                }
                Err(e) => {
                    warn!("Failed to load sound '{}' for entity {}: {}", sound.audioPath, entity_id, e);
                    // Don't fail the whole scene load just because one sound failed
                    Ok(())
                }
            }
        }

        #[cfg(not(feature = "audio-support"))]
        {
            debug!("Audio support disabled - would load sound: {}", sound.audioPath);
            Ok(())
        }
    }

    /// Update spatial audio for a 3D sound
    #[cfg(feature = "audio-support")]
    pub fn update_spatial_sound(
        &mut self,
        entity_id: u32,
        sound: &Sound,
        sound_pos: Vec3,
        listener_pos: Vec3,
        listener_forward: Vec3,
    ) {
        if !sound.is3D {
            return; // Skip 2D sounds
        }

        if let Some(&handle) = self.sounds.get(&entity_id) {
            self.system.update_spatial(
                handle,
                sound_pos,
                listener_pos,
                listener_forward,
                sound.minDistance,
                sound.maxDistance,
                sound.rolloffFactor,
            );
        }
    }

    /// Update all spatial sounds based on listener position
    #[cfg(feature = "audio-support")]
    pub fn update_all_spatial(
        &mut self,
        sounds: &[(u32, Sound, Vec3)], // (entity_id, sound component, position)
        listener_pos: Vec3,
        listener_forward: Vec3,
    ) {
        for (entity_id, sound, sound_pos) in sounds {
            self.update_spatial_sound(*entity_id, sound, *sound_pos, listener_pos, listener_forward);
        }
    }

    /// Get the number of loaded sounds
    pub fn sound_count(&self) -> usize {
        #[cfg(feature = "audio-support")]
        {
            self.sounds.len()
        }

        #[cfg(not(feature = "audio-support"))]
        {
            0
        }
    }
}

impl Default for AudioLoader {
    fn default() -> Self {
        Self::new().expect("Failed to create default AudioLoader")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_loader_creation() {
        let result = AudioLoader::new();
        assert!(result.is_ok());
    }

    #[test]
    fn test_audio_loader_sound_count() {
        let loader = AudioLoader::new().unwrap();
        assert_eq!(loader.sound_count(), 0);
    }

    #[cfg(feature = "audio-support")]
    #[test]
    fn test_load_sound_disabled() {
        let mut loader = AudioLoader::new().unwrap();

        let sound = Sound {
            audioPath: "/test/sound.wav".to_string(),
            enabled: false,
            ..Default::default()
        };

        let result = loader.load_sound(1, &sound);
        assert!(result.is_ok());
        assert_eq!(loader.sound_count(), 0); // Should not be loaded
    }
}
