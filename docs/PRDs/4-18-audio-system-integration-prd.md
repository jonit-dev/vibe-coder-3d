# Audio System Integration PRD

**Status**: Not Started
**Priority**: High
**Estimated Effort**: 2 days
**Dependencies**: Script API Expansion (Complete), SoundManager/Howler.js

## Overview

Integrate the Script API's AudioAPI with a real audio system (SoundManager/Howler.js) to enable scripts to play sounds, manage playback, and support positional 3D audio.

## Current State

The AudioAPI stub exists in `src/core/lib/scripting/apis/AudioAPI.ts` with the following methods:

- `play(url, options)` - Currently logs warning and returns mock ID
- `stop(handleOrUrl)` - Currently logs warning, no-op
- `attachToEntity(follow)` - Currently logs warning, no-op

All methods log: `"Audio playback not yet implemented - integration with SoundManager pending"`

## Goals

1. Integrate Howler.js for audio playback
2. Support basic sound playback (play/stop)
3. Support positional 3D audio attached to entities
4. Support volume, looping, and playback control
5. Resource management and cleanup
6. Audio pooling for performance

## Proposed Solution

### Architecture

```
src/core/lib/audio/
├── SoundManager.ts          # Singleton manager for all audio
├── AudioPool.ts             # Object pool for sound instances
├── PositionalAudio.ts       # 3D positional audio wrapper
└── __tests__/
    ├── SoundManager.test.ts
    └── AudioPool.test.ts

src/core/lib/scripting/apis/
└── AudioAPI.ts              # Update to use SoundManager
```

### SoundManager Interface

```typescript
interface ISoundOptions {
  volume?: number; // 0-1
  loop?: boolean;
  rate?: number; // Playback rate
  sprite?: string; // Audio sprite name
  position?: [number, number, number]; // 3D position
  fadeIn?: number; // Fade in duration (ms)
  fadeOut?: number; // Fade out duration (ms)
}

interface ISound {
  id: number;
  url: string;
  howl: Howl;
  howlId?: number;
  isPlaying: boolean;
  isLooping: boolean;
  volume: number;
  position?: [number, number, number];
  attachedEntity?: number; // Entity ID if attached
}

class SoundManager {
  private sounds: Map<number, ISound>;
  private howlCache: Map<string, Howl>;
  private nextSoundId: number;
  private masterVolume: number;

  // Basic playback
  play(url: string, options?: ISoundOptions): number;
  stop(soundId: number): void;
  stopByUrl(url: string): void;
  pause(soundId: number): void;
  resume(soundId: number): void;

  // Volume control
  setVolume(soundId: number, volume: number): void;
  setMasterVolume(volume: number): void;

  // Positional audio
  attachToEntity(soundId: number, entityId: number, follow: boolean): void;
  detachFromEntity(soundId: number): void;
  updateListener(position: [number, number, number], forward: [number, number, number]): void;

  // Resource management
  preload(url: string): Promise<void>;
  unload(url: string): void;
  cleanup(entityId: number): void; // Stop all sounds for entity
}
```

### Updated AudioAPI Implementation

```typescript
export const createAudioAPI = (
  entityId: number,
  getMeshRef: () => THREE.Object3D | null,
): IAudioAPI => {
  const soundManager = SoundManager.getInstance();
  const activeSounds = new Set<number>();

  return {
    play: (url: string, options?: Record<string, unknown>): number => {
      const soundId = soundManager.play(url, {
        volume: (options?.volume as number) ?? 1.0,
        loop: (options?.loop as boolean) ?? false,
        rate: (options?.rate as number) ?? 1.0,
      });

      activeSounds.add(soundId);
      return soundId;
    },

    stop: (handleOrUrl: number | string): void => {
      if (typeof handleOrUrl === 'number') {
        soundManager.stop(handleOrUrl);
        activeSounds.delete(handleOrUrl);
      } else {
        soundManager.stopByUrl(handleOrUrl);
      }
    },

    attachToEntity: (follow: boolean): void => {
      const mesh = getMeshRef();
      if (!mesh) {
        logger.warn('Cannot attach audio: entity has no mesh');
        return;
      }

      // Attach all active sounds to this entity
      for (const soundId of activeSounds) {
        soundManager.attachToEntity(soundId, entityId, follow);
      }
    },
  };
};

export const cleanupAudioAPI = (entityId: number) => {
  const soundManager = SoundManager.getInstance();
  soundManager.cleanup(entityId);
};
```

### Positional Audio Support

```typescript
class PositionalAudio {
  private sound: ISound;
  private entityId: number;
  private follow: boolean;

  constructor(sound: ISound, entityId: number, follow: boolean) {
    this.sound = sound;
    this.entityId = entityId;
    this.follow = follow;
  }

  update(): void {
    if (!this.follow) return;

    const entity = getEntityPosition(this.entityId);
    if (entity) {
      this.updatePosition(entity.position);
    }
  }

  updatePosition(position: [number, number, number]): void {
    const [x, y, z] = position;
    this.sound.howl.pos(x, y, z, this.sound.howlId);
  }
}
```

## Implementation Plan

### Phase 1: Basic SoundManager (0.5 days)

1. Install Howler.js: `yarn add howler @types/howler`
2. Create SoundManager class with basic play/stop
3. Implement Howl caching for performance
4. Add volume control
5. Unit tests for SoundManager

### Phase 2: Audio Pool (0.25 days)

1. Create AudioPool for sound instance reuse
2. Implement pool sizing and limits
3. Add automatic cleanup for finished sounds
4. Tests for pooling behavior

### Phase 3: Integrate with AudioAPI (0.5 days)

1. Replace stub implementation in AudioAPI.ts
2. Wire SoundManager into AudioAPI
3. Update cleanup logic
4. Remove warning logs
5. Integration tests

### Phase 4: Positional Audio (0.5 days)

1. Implement PositionalAudio class
2. Add listener position tracking (camera position)
3. Implement attachToEntity functionality
4. Update loop to call positional audio updates
5. Tests for 3D audio

### Phase 5: Audio System (0.25 days)

1. Create AudioSystem that updates positional audio each frame
2. Integrate with ECS update loop
3. Update listener position from camera
4. Performance optimization

## File Structure

```
src/core/lib/audio/
├── SoundManager.ts
├── AudioPool.ts
├── PositionalAudio.ts
├── types.ts
└── __tests__/
    ├── SoundManager.test.ts
    ├── AudioPool.test.ts
    └── PositionalAudio.test.ts

src/core/systems/
└── AudioSystem.ts           # NEW: Updates positional audio

src/core/lib/scripting/apis/
└── AudioAPI.ts              # UPDATED: Use SoundManager

docs/architecture/
└── 2-12-audio-system.md     # UPDATED: Full documentation
```

## Usage Examples

### Basic Sound Playback

```typescript
function onStart(): void {
  // Play a sound
  const soundId = audio.play('/sounds/coin.wav', {
    volume: 0.8,
    loop: false,
  });

  // Stop after 2 seconds
  timer.setTimeout(() => {
    audio.stop(soundId);
  }, 2000);
}
```

### Looping Background Music

```typescript
let musicId: number;

function onStart(): void {
  musicId = audio.play('/music/background.mp3', {
    volume: 0.5,
    loop: true,
  });
}

function onDestroy(): void {
  audio.stop(musicId);
}
```

### Positional Audio

```typescript
function onStart(): void {
  // Play sound at entity position
  const soundId = audio.play('/sounds/engine.wav', {
    loop: true,
    volume: 1.0,
  });

  // Attach to entity - follows entity movement
  audio.attachToEntity(true);
}
```

### One-Shot Sound Effects

```typescript
function onUpdate(deltaTime: number): void {
  if (input.isKeyDown('space')) {
    // Fire and forget - no need to store ID
    audio.play('/sounds/jump.wav', { volume: 0.7 });
  }
}
```

## Testing Strategy

### Unit Tests

- SoundManager play/stop/pause/resume
- Volume control (per-sound and master)
- Howl caching and reuse
- AudioPool allocation and recycling
- Positional audio position updates

### Integration Tests

- AudioAPI integration with SoundManager
- Script sound playback through API
- Entity attachment and following
- Cleanup on entity destruction
- Multiple simultaneous sounds

### Performance Tests

- 100+ simultaneous sounds
- Pool allocation efficiency
- Memory usage with cached Howls
- CPU usage for positional audio updates

## Edge Cases

| Edge Case                            | Solution                           |
| ------------------------------------ | ---------------------------------- |
| Sound file not found                 | Log error, return -1, don't crash  |
| Too many simultaneous sounds         | Pool limit, oldest sounds stopped  |
| Entity destroyed while sound playing | Auto-stop via cleanup              |
| Invalid URL format                   | Validate URL, log error, return -1 |
| Volume out of range (< 0 or > 1)     | Clamp to valid range               |
| Attaching to entity without mesh     | Log warning, fallback to 2D audio  |
| Listener position not set            | Use default [0,0,0]                |
| Sound played before Howler loaded    | Queue and play when ready          |

## Performance Considerations

### Audio Pool

- Pool size: 50 sound instances
- Automatic recycling when sound finishes
- Prevents constant Howl allocation/deallocation

### Howl Caching

- Cache loaded Howls by URL
- Preload commonly used sounds
- Unload unused sounds after timeout

### Positional Audio

- Update only for sounds with follow=true
- Batch position updates per frame
- Distance culling for far sounds

### Memory Management

- Unload sounds not used in 60 seconds
- Limit simultaneous sounds to 50
- Automatic cleanup on scene change

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "howler": "^2.2.3"
  },
  "devDependencies": {
    "@types/howler": "^2.2.7"
  }
}
```

### System Dependencies

- Script System (complete)
- ECS System (for AudioSystem)
- Camera System (for listener position)
- Transform System (for entity positions)

## Acceptance Criteria

- ✅ Howler.js integrated and working
- ✅ Scripts can play sounds without warnings
- ✅ Scripts can stop sounds by ID or URL
- ✅ Volume control works (per-sound and master)
- ✅ Looping sounds work correctly
- ✅ Positional audio follows entities
- ✅ Audio cleanup works on entity destruction
- ✅ All unit tests pass (15+ tests)
- ✅ Integration tests pass (5+ tests)
- ✅ Documentation updated
- ✅ No memory leaks with long-running sounds

## Future Enhancements

- Audio sprites for efficient multiple sounds
- Audio effects (reverb, distortion, filters)
- Audio zones (different audio in different areas)
- Music crossfading
- Audio occlusion (blocked by objects)
- Audio visualization API
- Voice chat integration
- Audio recording/playback

## References

- [Howler.js Documentation](https://howlerjs.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Script API Documentation](../architecture/2-13-script-system.md)
- Current AudioAPI: `src/core/lib/scripting/apis/AudioAPI.ts`
