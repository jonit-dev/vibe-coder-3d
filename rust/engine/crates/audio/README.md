# vibe-audio

Audio system for Vibe Coder 3D engine with 3D spatial audio support.

## Features

- **Audio Playback** - Load and play sounds using rodio
- **3D Spatial Audio** - Distance-based attenuation and stereo panning
- **Directional Audio** - Cone-based attenuation for directional sound sources
- **Volume & Pitch Control** - Real-time playback property adjustment
- **Looping Support** - Continuous playback for background music and ambient sounds

## Architecture

```
AudioSystem
├── AudioManager         - Sound loading and playback control
└── SpatialAudioCalculator - 3D positioning calculations
```

### AudioManager

Manages audio playback using the rodio library:

- **Sound Loading**: Loads audio files (WAV, MP3, OGG, FLAC via rodio)
- **Playback Control**: Play, pause, stop, volume, speed/pitch
- **Sound Handles**: Track loaded sounds via unique handles
- **State Management**: Query playback state (playing, paused, volume, etc.)

### SpatialAudioCalculator

Calculates 3D audio parameters:

- **Distance Attenuation**: Inverse distance model with rolloff factor
- **Stereo Panning**: Left/right positioning based on listener orientation
- **Cone Attenuation**: Directional sound sources with inner/outer angles
- **Doppler Effect**: Placeholder for future velocity-based pitch shifting

## Usage

### Basic Sound Playback

```rust
use vibe_audio::AudioSystem;

let mut audio = AudioSystem::new()?;

// Load a sound
let handle = audio.load_sound("/path/to/sound.wav")?;

// Play it
audio.play(handle)?;

// Control volume
audio.set_volume(handle, 0.5); // 50% volume

// Stop playback
audio.stop(handle);
```

### 3D Spatial Audio

```rust
use glam::Vec3;

let sound_pos = Vec3::new(10.0, 0.0, 5.0);
let listener_pos = Vec3::ZERO;
let listener_forward = Vec3::Z;

// Update spatial audio for a sound
audio.update_spatial(
    handle,
    sound_pos,
    listener_pos,
    listener_forward,
    1.0,    // min_distance
    100.0,  // max_distance
    1.0,    // rolloff_factor
);
```

## Integration with Engine

The `AudioLoader` module in the main engine integrates the audio system with the ECS:

```rust
use vibe_audio::AudioLoader;

let mut loader = AudioLoader::new()?;

// Load sound components from scene
for (entity_id, sound_component) in sound_entities {
    loader.load_sound(entity_id, &sound_component)?;
}

// Update spatial audio each frame
loader.update_all_spatial(&sound_transforms, camera_pos, camera_forward);
```

## Feature Flags

The audio system is optional and can be disabled to avoid system dependencies:

```toml
# Enable audio support (requires ALSA on Linux)
vibe-audio = { path = "crates/audio" }

# Or disable it
vibe-audio = { path = "crates/audio", optional = true }
```

## System Requirements

### Linux

- ALSA development libraries: `sudo apt-get install libasound2-dev`

### macOS

- No additional dependencies (uses CoreAudio)

### Windows

- No additional dependencies (uses WASAPI)

## Limitations

- **Current Time**: Rodio doesn't provide easy access to current playback position
- **Panning**: Basic stereo panning (no advanced spatialization like HRTF)
- **Loop Changes**: Changing loop state after loading requires reloading the sound
- **Format Support**: Limited to formats supported by rodio (WAV, MP3, OGG, FLAC)

## Future Enhancements

- [ ] HRTF (Head-Related Transfer Function) for realistic 3D audio
- [ ] Audio streaming for large music files
- [ ] Better current time tracking
- [ ] Dynamic loop control
- [ ] Audio effects (reverb, echo, filters)
- [ ] Doppler effect implementation
- [ ] Obstruction/occlusion simulation

## Testing

Run the test suite:

```bash
cargo test -p vibe-audio --lib
```

### Test Coverage

- Audio system creation
- Sound handle management
- Sound state tracking
- Volume calculation at various distances
- Stereo panning (left/right/center)
- Directional cone attenuation
- No-directionality mode (360° cone)

## License

Same as parent project.
