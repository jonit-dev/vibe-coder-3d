# Audio API

The Audio API provides functionality for playing and managing audio in your game, including sound effects, background music, and positional audio. It supports both 2D audio for UI effects and 3D positional audio for in-game sounds.

## Overview

The Audio API includes:

- Sound playback from URLs or asset IDs
- Positional 3D audio support
- Audio options for volume, pitch, and looping
- Entity attachment for spatial audio

## Core Methods

### `audio.play(url, options)`

Play sound from URL or asset ID.

**Parameters:**

- `url` (string): Path or asset ID of audio file
- `options` (Record<string, unknown>, optional): Audio playback options

**Returns:**

- `number`: Audio handle for later control

**Options:**

- `volume` (number): Volume multiplier (default: 1.0)
- `pitch` (number): Pitch multiplier (default: 1.0)
- `loop` (boolean): Whether to loop the audio (default: false)

**Example:**

```javascript
// Play simple sound effect
const shootSound = audio.play('/sounds/shoot.wav');

// Play with options
const bgmHandle = audio.play('/music/background.mp3', {
  volume: 0.7,
  loop: true,
});

// Play with pitch variation
const hitSound = audio.play('/sounds/hit.wav', {
  volume: 0.8,
  pitch: 0.9 + Math.random() * 0.2, // Random pitch between 0.9-1.1
});
```

### `audio.stop(handleOrUrl)`

Stop sound by handle or URL.

**Parameters:**

- `handleOrUrl` (number | string): Audio handle or URL/asset ID

**Example:**

```javascript
const soundHandle = audio.play('/sounds/explosion.wav');

// Stop by handle
audio.stop(soundHandle);

// Stop by URL (stops all instances of this sound)
audio.stop('/sounds/background.mp3');
```

### `audio.attachToEntity(follow)`

Attach audio to entity for positional sound (optional method).

**Parameters:**

- `follow` (boolean): Whether to follow entity position

**Note:** This method may be optional depending on implementation. Some implementations use positional audio automatically when called from entity scripts.

**Example:**

```javascript
// Play positional sound at entity location
const footstepHandle = audio.play('/sounds/footstep.wav');
if (audio.attachToEntity) {
  audio.attachToEntity(footstepHandle, true);
}
```

## Complete Examples

### Weapon Audio System

```javascript
const WeaponAudioSystem = {
  sounds: {
    fire: '/sounds/weapons/pistol_fire.wav',
    reload: '/sounds/weapons/reload.wav',
    empty: '/sounds/weapons/empty.wav',
    switch: '/sounds/weapons/switch.wav',
  },

  currentHandles: {},

  playFireSound(weaponType) {
    const soundPath = this.sounds.fire;

    // Randomize pitch slightly for variation
    const pitchVariation = 0.95 + Math.random() * 0.1;

    const handle = audio.play(soundPath, {
      volume: 0.8,
      pitch: pitchVariation,
    });

    // Make it positional
    if (audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    console.log(`Weapon fire sound played: ${weaponType}`);
    return handle;
  },

  playReloadSound() {
    const handle = audio.play(this.sounds.reload, {
      volume: 0.7,
    });

    if (audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    console.log('Reload sound played');
    return handle;
  },

  playEmptySound() {
    const handle = audio.play(this.sounds.empty, {
      volume: 0.6,
      pitch: 1.2, // Higher pitch for empty click
    });

    if (audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    console.log('Empty weapon sound played');
    return handle;
  },

  playSwitchSound() {
    const handle = audio.play(this.sounds.switch, {
      volume: 0.5,
    });

    if (audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    console.log('Weapon switch sound played');
    return handle;
  },
};

// Usage in weapon script
let ammo = 12;
let maxAmmo = 12;
let reloading = false;

function onUpdate() {
  if (input.isMouseButtonPressed(0) && !reloading) {
    if (ammo > 0) {
      fire();
    } else {
      WeaponAudioSystem.playEmptySound();
    }
  }

  if (input.isKeyPressed('r') && ammo < maxAmmo && !reloading) {
    reload();
  }
}

function fire() {
  ammo--;
  WeaponAudioSystem.playFireSound('pistol');
  console.log(`Fired! Ammo: ${ammo}/${maxAmmo}`);
}

function reload() {
  reloading = true;
  WeaponAudioSystem.playReloadSound();

  timer.setTimeout(() => {
    ammo = maxAmmo;
    reloading = false;
    console.log('Reload complete!');
  }, 2000);
}
```

### Footstep System

```javascript
const FootstepSystem = {
  sounds: {
    grass: [
      '/sounds/footsteps/grass1.wav',
      '/sounds/footsteps/grass2.wav',
      '/sounds/footsteps/grass3.wav',
    ],
    stone: [
      '/sounds/footsteps/stone1.wav',
      '/sounds/footsteps/stone2.wav',
      '/sounds/footsteps/stone3.wav',
    ],
    water: ['/sounds/footsteps/water1.wav', '/sounds/footsteps/water2.wav'],
    metal: ['/sounds/footsteps/metal1.wav', '/sounds/footsteps/metal2.wav'],
  },

  lastFootstepTime: 0,
  footstepInterval: 0.4, // seconds between footsteps

  playFootstep(surfaceType = 'grass') {
    const currentTime = time.time;

    if (currentTime - this.lastFootstepTime < this.footstepInterval) {
      return; // Too soon for another footstep
    }

    const surfaceSounds = this.sounds[surfaceType] || this.sounds.grass;
    const randomSound = surfaceSounds[Math.floor(Math.random() * surfaceSounds.length)];

    const handle = audio.play(randomSound, {
      volume: 0.4 + Math.random() * 0.2, // Random volume 0.4-0.6
      pitch: 0.9 + Math.random() * 0.2, // Random pitch 0.9-1.1
    });

    // Make positional
    if (audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    this.lastFootstepTime = currentTime;
  },

  determineSurfaceType() {
    // Raycast down to determine surface type
    const rayOrigin = [...entity.transform.position];
    rayOrigin[1] += 0.1; // Start slightly above ground

    const hit = query.raycastFirst(rayOrigin, [0, -1, 0]);
    if (hit) {
      const hitEntity = entities.get(hit.entityId);
      if (hitEntity && hitEntity.hasComponent('SurfaceType')) {
        return hitEntity.getComponent('SurfaceType').type;
      }
    }

    return 'grass'; // Default surface
  },
};

function onUpdate() {
  let isMoving = false;

  if (
    input.isKeyDown('w') ||
    input.isKeyDown('a') ||
    input.isKeyDown('s') ||
    input.isKeyDown('d')
  ) {
    isMoving = true;
  }

  if (isMoving && entity.controller && entity.controller.isGrounded()) {
    const surfaceType = FootstepSystem.determineSurfaceType();
    FootstepSystem.playFootstep(surfaceType);
  }
}
```

### Background Music Manager

```javascript
const BGMManager = {
  currentTrack: null,
  currentHandle: null,
  tracks: {
    menu: '/music/menu_theme.mp3',
    gameplay: '/music/gameplay_loop.mp3',
    boss: '/music/boss_battle.mp3',
    victory: '/music/victory_fanfare.mp3',
    gameover: '/music/game_over_music.mp3',
  },

  volume: 0.7,

  play(trackName, options = {}) {
    if (!this.tracks[trackName]) {
      console.error(`Unknown BGM track: ${trackName}`);
      return null;
    }

    // Stop current track if playing
    this.stop();

    this.currentTrack = trackName;
    this.currentHandle = audio.play(this.tracks[trackName], {
      volume: this.volume * (options.volume || 1),
      loop: true,
    });

    console.log(`BGM started: ${trackName}`);
    return this.currentHandle;
  },

  stop() {
    if (this.currentHandle) {
      audio.stop(this.currentHandle);
      this.currentHandle = null;
    }

    if (this.currentTrack) {
      console.log(`BGM stopped: ${this.currentTrack}`);
      this.currentTrack = null;
    }
  },

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.currentHandle) {
      // Note: This would require audio API support for volume control
      // For now, restart with new volume
      const currentTrack = this.currentTrack;
      this.stop();
      this.play(currentTrack);
    }

    console.log(`BGM volume set to: ${this.volume}`);
  },

  crossfade(newTrackName, duration = 2.0) {
    if (!this.tracks[newTrackName]) {
      console.error(`Unknown BGM track: ${newTrackName}`);
      return;
    }

    if (this.currentTrack === newTrackName) {
      return; // Already playing this track
    }

    console.log(`Crossfading from ${this.currentTrack || 'none'} to ${newTrackName}`);

    // Fade out current track
    const fadeSteps = 20;
    const fadeInterval = duration / fadeSteps;

    for (let i = fadeSteps; i >= 0; i--) {
      timer.setTimeout(i * fadeInterval * 1000, () => {
        const volume = (i / fadeSteps) * this.volume;
        // Update volume if supported
        if (i === 0) {
          this.stop();
          this.play(newTrackName, { volume: 0 });

          // Fade in new track
          for (let j = 0; j <= fadeSteps; j++) {
            timer.setTimeout(j * fadeInterval * 1000 + duration * 1000, () => {
              const newVolume = (j / fadeSteps) * this.volume;
              // Set new track volume
            });
          }
        }
      });
    }
  },
};

function onStart() {
  // Listen for game state changes
  events.on('state_changed', (payload) => {
    switch (payload.to) {
      case 'menu':
        BGMManager.play('menu');
        break;
      case 'playing':
        BGMManager.play('gameplay');
        break;
      case 'game_over':
        BGMManager.play('gameover');
        break;
    }
  });

  events.on('boss_battle_start', () => {
    BGMManager.crossfade('boss');
  });

  events.on('boss_battle_end', () => {
    BGMManager.crossfade('gameplay');
  });

  events.on('victory', () => {
    BGMManager.play('victory');
  });
}
```

### Ambient Audio System

```javascript
const AmbientAudioSystem = {
  ambientSounds: new Map(),
  updateInterval: 2.0, // seconds between updates
  lastUpdateTime: 0,

  sounds: {
    forest: {
      birds: '/sounds/ambient/birds.wav',
      wind: '/sounds/ambient/wind.wav',
      rustle: '/sounds/ambient/leaf_rustle.wav',
    },
    cave: {
      water_drip: '/sounds/ambient/water_drip.wav',
      echo: '/sounds/ambient/cave_echo.wav',
      wind: '/sounds/ambient/cave_wind.wav',
    },
    city: {
      traffic: '/sounds/ambient/traffic.wav',
      people: '/sounds/ambient/crowd.wav',
      sirens: '/sounds/ambient/sirens.wav',
    },
  },

  currentEnvironment: 'forest',

  setEnvironment(environmentName) {
    if (!this.sounds[environmentName]) {
      console.error(`Unknown environment: ${environmentName}`);
      return;
    }

    this.currentEnvironment = environmentName;
    this.updateAmbientSounds();
    console.log(`Ambient environment changed to: ${environmentName}`);
  },

  updateAmbientSounds() {
    // Clear current ambient sounds
    this.ambientSounds.forEach((handle, soundName) => {
      audio.stop(handle);
    });
    this.ambientSounds.clear();

    // Start new ambient sounds
    const environmentSounds = this.sounds[this.currentEnvironment];

    Object.entries(environmentSounds).forEach(([soundName, soundPath]) => {
      const handle = audio.play(soundPath, {
        volume: this.getAmbientVolume(soundName),
        loop: true,
      });

      this.ambientSounds.set(soundName, handle);
    });
  },

  getAmbientVolume(soundName) {
    // Different volumes for different ambient sounds
    const baseVolumes = {
      birds: 0.3,
      wind: 0.4,
      rustle: 0.2,
      water_drip: 0.25,
      echo: 0.3,
      cave_wind: 0.35,
      traffic: 0.5,
      people: 0.4,
      sirens: 0.3,
    };

    return baseVolumes[soundName] || 0.3;
  },

  updateVolumes() {
    this.ambientSounds.forEach((handle, soundName) => {
      const targetVolume = this.getAmbientVolume(soundName);
      // Note: Would need volume control support
      // For now, this is just demonstration
    });
  },
};

function onUpdate() {
  if (time.time - AmbientAudioSystem.lastUpdateTime >= AmbientAudioSystem.updateInterval) {
    // Randomly adjust ambient volumes for more dynamic feel
    AmbientAudioSystem.updateVolumes();
    AmbientAudioSystem.lastUpdateTime = time.time;
  }

  // Environment detection based on position
  const playerPos = entity.transform.position;

  if (playerPos[1] < 0) {
    // Below ground - cave environment
    AmbientAudioSystem.setEnvironment('cave');
  } else if (Math.abs(playerPos[0]) > 50 || Math.abs(playerPos[2]) > 50) {
    // Far from origin - city environment
    AmbientAudioSystem.setEnvironment('city');
  } else {
    // Near origin - forest environment
    AmbientAudioSystem.setEnvironment('forest');
  }
}
```

### Interactive Audio Feedback System

```javascript
const AudioFeedbackSystem = {
  uiSounds: {
    button_click: '/sounds/ui/button_click.wav',
    button_hover: '/sounds/ui/button_hover.wav',
    notification: '/sounds/ui/notification.wav',
    error: '/sounds/ui/error.wav',
    success: '/sounds/ui/success.wav',
    level_up: '/sounds/ui/level_up.wav',
  },

  gameSounds: {
    powerup: '/sounds/game/powerup.wav',
    hurt: '/sounds/game/hurt.wav',
    heal: '/sounds/game/heal.wav',
    coin: '/sounds/game/coin.wav',
    key: '/sounds/game/key_pickup.wav',
  },

  playUISound(soundName, pitch = 1.0) {
    if (!this.uiSounds[soundName]) {
      console.warn(`Unknown UI sound: ${soundName}`);
      return;
    }

    audio.play(this.uiSounds[soundName], {
      volume: 0.6,
      pitch: pitch,
    });
  },

  playGameSound(soundName, options = {}) {
    if (!this.gameSounds[soundName]) {
      console.warn(`Unknown game sound: ${soundName}`);
      return;
    }

    const handle = audio.play(this.gameSounds[soundName], {
      volume: options.volume || 0.7,
      pitch: options.pitch || 1.0,
    });

    if (options.positional && audio.attachToEntity) {
      audio.attachToEntity(handle, true);
    }

    return handle;
  },
};

function onStart() {
  // UI events
  events.on('ui_button_click', () => {
    AudioFeedbackSystem.playUISound('button_click');
  });

  events.on('ui_button_hover', () => {
    AudioFeedbackSystem.playUISound('button_hover');
  });

  events.on('notification_shown', () => {
    AudioFeedbackSystem.playUISound('notification');
  });

  events.on('error_occurred', () => {
    AudioFeedbackSystem.playUISound('error', 0.8);
  });

  // Game events
  events.on('powerup_collected', (payload) => {
    AudioFeedbackSystem.playGameSound('powerup', {
      positional: true,
      pitch: 1.1,
    });
  });

  events.on('player_damaged', () => {
    AudioFeedbackSystem.playGameSound('hurt', {
      positional: true,
      volume: 0.8,
    });
  });

  events.on('player_healed', () => {
    AudioFeedbackSystem.playGameSound('heal', {
      positional: true,
      pitch: 1.2,
    });
  });

  events.on('coin_collected', () => {
    AudioFeedbackSystem.playGameSound('coin', {
      positional: true,
    });
  });

  events.on('key_collected', () => {
    AudioFeedbackSystem.playGameSound('key', {
      positional: true,
    });
  });

  events.on('level_up', () => {
    AudioFeedbackSystem.playUISound('level_up', 1.5);
  });
}
```

## Best Practices

1. **Volume Management**: Use appropriate volume levels for different sound types (SFX vs BGM)
2. **Positional Audio**: Make game sounds positional for better immersion
3. **Sound Variation**: Randomize pitch and volume slightly for repeated sounds
4. **Memory Management**: Stop sounds when no longer needed to free resources
5. **Performance**: Avoid playing too many sounds simultaneously
6. **User Experience**: Provide volume controls and mute options

## Audio Loading

- Audio files are loaded on-demand when first played
- Consider preloading critical sounds during level loading
- Use compressed audio formats for better performance
- Loop background music instead of restarting it

## Error Handling

- Invalid audio paths will be logged but won't crash the script
- Audio handles may become invalid if the sound finishes naturally
- Network issues may prevent audio loading - handle gracefully
- Some features (like volume control) may not be available in all implementations
