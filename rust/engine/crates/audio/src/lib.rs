pub mod audio_manager;
pub mod spatial_audio;

pub use audio_manager::{AudioManager, SoundHandle, SoundState};
pub use spatial_audio::SpatialAudioCalculator;

use anyhow::Result;
use glam::Vec3;
use std::sync::Arc;

/// Audio system for managing sounds and spatial audio
pub struct AudioSystem {
    manager: AudioManager,
    spatial: SpatialAudioCalculator,
}

impl AudioSystem {
    /// Create a new audio system
    pub fn new() -> Result<Self> {
        Ok(Self {
            manager: AudioManager::new()?,
            spatial: SpatialAudioCalculator::new(),
        })
    }

    /// Load a sound from a file path
    pub fn load_sound(&mut self, path: &str) -> Result<SoundHandle> {
        self.manager.load_sound(path)
    }

    /// Play a sound
    pub fn play(&mut self, handle: SoundHandle) -> Result<()> {
        self.manager.play(handle)
    }

    /// Stop a sound
    pub fn stop(&mut self, handle: SoundHandle) {
        self.manager.stop(handle);
    }

    /// Set sound volume (0.0 to 1.0)
    pub fn set_volume(&mut self, handle: SoundHandle, volume: f32) {
        self.manager.set_volume(handle, volume);
    }

    /// Set sound to loop
    pub fn set_looping(&mut self, handle: SoundHandle, looping: bool) {
        self.manager.set_looping(handle, looping);
    }

    /// Update 3D spatial audio for a sound
    pub fn update_spatial(
        &mut self,
        handle: SoundHandle,
        sound_pos: Vec3,
        listener_pos: Vec3,
        listener_forward: Vec3,
        min_distance: f32,
        max_distance: f32,
        rolloff_factor: f32,
    ) {
        let volume = self.spatial.calculate_volume(
            sound_pos,
            listener_pos,
            min_distance,
            max_distance,
            rolloff_factor,
        );

        let pan = self
            .spatial
            .calculate_pan(sound_pos, listener_pos, listener_forward);

        self.manager.set_volume(handle, volume);
        self.manager.set_pan(handle, pan);
    }

    /// Get current playback time in seconds
    pub fn get_current_time(&self, handle: SoundHandle) -> f32 {
        self.manager.get_current_time(handle)
    }

    /// Get total duration in seconds
    pub fn get_duration(&self, handle: SoundHandle) -> f32 {
        self.manager.get_duration(handle)
    }

    /// Check if a sound is currently playing
    pub fn is_playing(&self, handle: SoundHandle) -> bool {
        self.manager.is_playing(handle)
    }

    /// Get the state of a sound
    pub fn get_state(&self, handle: SoundHandle) -> Option<SoundState> {
        self.manager.get_state(handle)
    }
}

impl Default for AudioSystem {
    fn default() -> Self {
        Self::new().expect("Failed to create default AudioSystem")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_system_creation() {
        let result = AudioSystem::new();
        assert!(result.is_ok());
    }

    #[test]
    fn test_spatial_volume_calculation() {
        let system = AudioSystem::new().unwrap();

        // Test volume at different distances
        let sound_pos = Vec3::new(10.0, 0.0, 0.0);
        let listener_pos = Vec3::ZERO;
        let listener_forward = Vec3::Z;

        let volume = system.spatial.calculate_volume(
            sound_pos,
            listener_pos,
            1.0,   // min_distance
            100.0, // max_distance
            1.0,   // rolloff_factor
        );

        // Volume should be less than 1.0 at distance 10
        assert!(volume < 1.0);
        assert!(volume > 0.0);
    }

    #[test]
    fn test_spatial_pan_calculation() {
        let system = AudioSystem::new().unwrap();

        // Sound to the right should have positive pan
        let sound_pos = Vec3::new(10.0, 0.0, 0.0);
        let listener_pos = Vec3::ZERO;
        let listener_forward = Vec3::Z;

        let pan = system
            .spatial
            .calculate_pan(sound_pos, listener_pos, listener_forward);

        // Pan should be positive (to the right)
        assert!(pan > 0.0);
    }
}
