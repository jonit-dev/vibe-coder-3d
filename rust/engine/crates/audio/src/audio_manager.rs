use anyhow::{Context, Result};
use log::{debug, warn};
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use rustc_hash::FxHashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

/// Handle to a loaded sound
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SoundHandle(u64);

impl SoundHandle {
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    pub fn id(&self) -> u64 {
        self.0
    }
}

/// State of a sound
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SoundState {
    pub is_playing: bool,
    pub is_paused: bool,
    pub volume: f32,
    pub speed: f32,
    pub current_time: f32,
    pub duration: f32,
}

struct SoundData {
    sink: Sink,
    duration: Duration,
    path: String,
}

/// Manages audio playback using rodio
pub struct AudioManager {
    _stream: OutputStream,
    stream_handle: OutputStreamHandle,
    sounds: FxHashMap<SoundHandle, SoundData>,
    next_id: u64,
}

impl AudioManager {
    /// Create a new audio manager
    pub fn new() -> Result<Self> {
        let (stream, stream_handle) = OutputStream::try_default()
            .context("Failed to create audio output stream")?;

        debug!("AudioManager initialized successfully");

        Ok(Self {
            _stream: stream,
            stream_handle,
            sounds: FxHashMap::default(),
            next_id: 0,
        })
    }

    /// Load a sound from a file
    pub fn load_sound(&mut self, path: &str) -> Result<SoundHandle> {
        debug!("Loading sound: {}", path);

        // Create a sink for this sound
        let sink = Sink::try_new(&self.stream_handle)
            .context("Failed to create audio sink")?;

        // Load the audio file
        let file = File::open(path)
            .with_context(|| format!("Failed to open audio file: {}", path))?;

        let source = Decoder::new(BufReader::new(file))
            .with_context(|| format!("Failed to decode audio file: {}", path))?;

        // Get duration before consuming the source
        let duration = source.total_duration().unwrap_or(Duration::from_secs(0));

        // Add source to sink but pause it immediately
        sink.append(source);
        sink.pause();

        // Generate handle
        let handle = SoundHandle::new(self.next_id);
        self.next_id += 1;

        // Store sound data
        self.sounds.insert(
            handle,
            SoundData {
                sink,
                duration,
                path: path.to_string(),
            },
        );

        debug!("Sound loaded successfully: {} (handle: {})", path, handle.id());

        Ok(handle)
    }

    /// Play a sound
    pub fn play(&mut self, handle: SoundHandle) -> Result<()> {
        if let Some(data) = self.sounds.get(&handle) {
            data.sink.play();
            debug!("Playing sound: {} (handle: {})", data.path, handle.id());
            Ok(())
        } else {
            anyhow::bail!("Sound handle not found: {}", handle.id())
        }
    }

    /// Stop a sound
    pub fn stop(&mut self, handle: SoundHandle) {
        if let Some(data) = self.sounds.get(&handle) {
            data.sink.stop();
            debug!("Stopped sound: {} (handle: {})", data.path, handle.id());
        } else {
            warn!("Attempted to stop unknown sound handle: {}", handle.id());
        }
    }

    /// Pause a sound
    pub fn pause(&mut self, handle: SoundHandle) {
        if let Some(data) = self.sounds.get(&handle) {
            data.sink.pause();
            debug!("Paused sound: {} (handle: {})", data.path, handle.id());
        } else {
            warn!("Attempted to pause unknown sound handle: {}", handle.id());
        }
    }

    /// Set volume (0.0 to 1.0+)
    pub fn set_volume(&mut self, handle: SoundHandle, volume: f32) {
        if let Some(data) = self.sounds.get(&handle) {
            data.sink.set_volume(volume.max(0.0));
        }
    }

    /// Set playback speed (pitch)
    pub fn set_speed(&mut self, handle: SoundHandle, speed: f32) {
        if let Some(data) = self.sounds.get(&handle) {
            data.sink.set_speed(speed.max(0.1));
        }
    }

    /// Set whether the sound should loop
    pub fn set_looping(&mut self, handle: SoundHandle, looping: bool) {
        // Note: rodio doesn't support changing looping after appending
        // This would need to be set when loading the sound
        warn!("set_looping not fully supported - requires reload. Handle: {}", handle.id());
    }

    /// Set stereo pan (-1.0 = left, 0.0 = center, 1.0 = right)
    pub fn set_pan(&mut self, handle: SoundHandle, pan: f32) {
        // Note: Basic rodio doesn't support panning directly
        // We approximate by adjusting left/right channel volumes
        let pan = pan.clamp(-1.0, 1.0);

        if let Some(_data) = self.sounds.get(&handle) {
            // Rodio doesn't have built-in panning, would need custom implementation
            // For now, this is a placeholder
            debug!("Pan requested for handle {}: {} (not fully implemented)", handle.id(), pan);
        }
    }

    /// Get current playback position in seconds
    pub fn get_current_time(&self, handle: SoundHandle) -> f32 {
        // Rodio doesn't provide current position easily
        // This is a limitation - would need custom Source wrapper
        0.0
    }

    /// Get total duration in seconds
    pub fn get_duration(&self, handle: SoundHandle) -> f32 {
        self.sounds
            .get(&handle)
            .map(|data| data.duration.as_secs_f32())
            .unwrap_or(0.0)
    }

    /// Check if sound is currently playing
    pub fn is_playing(&self, handle: SoundHandle) -> bool {
        self.sounds
            .get(&handle)
            .map(|data| !data.sink.is_paused() && !data.sink.empty())
            .unwrap_or(false)
    }

    /// Get the current state of a sound
    pub fn get_state(&self, handle: SoundHandle) -> Option<SoundState> {
        self.sounds.get(&handle).map(|data| SoundState {
            is_playing: !data.sink.is_paused() && !data.sink.empty(),
            is_paused: data.sink.is_paused(),
            volume: data.sink.volume(),
            speed: data.sink.speed(),
            current_time: 0.0, // Not easily available in rodio
            duration: data.duration.as_secs_f32(),
        })
    }

    /// Remove a sound and free resources
    pub fn unload(&mut self, handle: SoundHandle) {
        if let Some(data) = self.sounds.remove(&handle) {
            debug!("Unloaded sound: {} (handle: {})", data.path, handle.id());
        }
    }

    /// Get the number of loaded sounds
    pub fn sound_count(&self) -> usize {
        self.sounds.len()
    }
}

impl Default for AudioManager {
    fn default() -> Self {
        Self::new().expect("Failed to create default AudioManager")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_manager_creation() {
        let result = AudioManager::new();
        assert!(result.is_ok());
    }

    #[test]
    fn test_sound_handle() {
        let handle1 = SoundHandle::new(0);
        let handle2 = SoundHandle::new(1);

        assert_ne!(handle1, handle2);
        assert_eq!(handle1.id(), 0);
        assert_eq!(handle2.id(), 1);
    }

    #[test]
    fn test_sound_state() {
        let state = SoundState {
            is_playing: true,
            is_paused: false,
            volume: 1.0,
            speed: 1.0,
            current_time: 0.0,
            duration: 10.0,
        };

        assert_eq!(state.is_playing, true);
        assert_eq!(state.volume, 1.0);
    }

    #[test]
    fn test_audio_manager_sound_count() {
        let manager = AudioManager::new().unwrap();
        assert_eq!(manager.sound_count(), 0);
    }
}
