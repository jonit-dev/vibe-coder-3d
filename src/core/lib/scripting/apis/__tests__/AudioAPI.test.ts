/**
 * AudioAPI Tests
 * Tests for audio playback API available to scripts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAudioAPI, cleanupAudioAPI } from '../AudioAPI';
import * as THREE from 'three';

// Mock logger
vi.mock('@/core/lib/logger', () => ({
  Logger: {
    create: () => ({
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

describe('AudioAPI', () => {
  let mockMeshRef: () => THREE.Object3D | null;
  let mockMesh: THREE.Object3D;

  beforeEach(() => {
    // Create mock mesh
    mockMesh = new THREE.Object3D();
    mockMesh.position.set(10, 20, 30);

    // Create mesh ref getter
    mockMeshRef = vi.fn(() => mockMesh);
  });

  describe('createAudioAPI', () => {
    it('should create an audio API instance', () => {
      const api = createAudioAPI(1, mockMeshRef);

      expect(api).toBeDefined();
      expect(typeof api.play).toBe('function');
      expect(typeof api.stop).toBe('function');
      expect(typeof api.attachToEntity).toBe('function');
    });

    it('should create separate instances for different entities', () => {
      const api1 = createAudioAPI(1, mockMeshRef);
      const api2 = createAudioAPI(2, mockMeshRef);

      expect(api1).not.toBe(api2);
    });
  });

  describe('play', () => {
    it('should play a sound and return a handle', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/explosion.mp3');

      expect(typeof handle).toBe('number');
      expect(handle).toBeGreaterThan(0);
    });

    it('should return unique handles for each sound', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle1 = api.play('sounds/sound1.mp3');
      const handle2 = api.play('sounds/sound2.mp3');
      const handle3 = api.play('sounds/sound1.mp3'); // Same URL

      expect(handle1).not.toBe(handle2);
      expect(handle2).not.toBe(handle3);
      expect(handle1).not.toBe(handle3);
    });

    it('should accept optional parameters', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/music.mp3', {
        volume: 0.5,
        loop: true,
        rate: 1.2,
      });

      expect(typeof handle).toBe('number');
    });

    it('should handle playing multiple sounds simultaneously', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handles = [
        api.play('sounds/sound1.mp3'),
        api.play('sounds/sound2.mp3'),
        api.play('sounds/sound3.mp3'),
        api.play('sounds/sound4.mp3'),
      ];

      // All handles should be unique
      const uniqueHandles = new Set(handles);
      expect(uniqueHandles.size).toBe(4);
    });

    it('should handle various audio file formats', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const formats = [
        'sounds/sound.mp3',
        'sounds/sound.wav',
        'sounds/sound.ogg',
        'sounds/sound.m4a',
      ];

      formats.forEach((url) => {
        const handle = api.play(url);
        expect(typeof handle).toBe('number');
      });
    });

    it('should handle URL paths with special characters', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const specialUrls = [
        'sounds/sound with spaces.mp3',
        'sounds/sound-with-dashes.mp3',
        'sounds/sound_with_underscores.mp3',
        'sounds/123-numeric.mp3',
      ];

      specialUrls.forEach((url) => {
        const handle = api.play(url);
        expect(typeof handle).toBe('number');
      });
    });

    it('should handle relative and absolute paths', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const paths = [
        'sounds/local.mp3',
        './sounds/relative.mp3',
        '../sounds/parent.mp3',
        '/sounds/absolute.mp3',
        'https://example.com/remote.mp3',
      ];

      paths.forEach((url) => {
        const handle = api.play(url);
        expect(typeof handle).toBe('number');
      });
    });
  });

  describe('stop', () => {
    it('should stop sound by handle', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/sound.mp3');

      // Should not throw
      expect(() => api.stop(handle)).not.toThrow();
    });

    it('should stop sound by URL', () => {
      const api = createAudioAPI(1, mockMeshRef);

      api.play('sounds/sound.mp3');
      api.play('sounds/sound.mp3'); // Same sound twice

      // Should not throw
      expect(() => api.stop('sounds/sound.mp3')).not.toThrow();
    });

    it('should handle stopping non-existent sound gracefully', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Should not throw
      expect(() => api.stop(999)).not.toThrow();
      expect(() => api.stop('nonexistent.mp3')).not.toThrow();
    });

    it('should allow stopping the same sound multiple times', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/sound.mp3');

      expect(() => {
        api.stop(handle);
        api.stop(handle); // Stop again
        api.stop(handle); // And again
      }).not.toThrow();
    });

    it('should handle mixed numeric and string stop calls', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle1 = api.play('sounds/sound1.mp3');
      const handle2 = api.play('sounds/sound2.mp3');
      api.play('sounds/sound1.mp3'); // Duplicate URL

      expect(() => {
        api.stop(handle1); // Stop by handle
        api.stop('sounds/sound1.mp3'); // Stop by URL (should stop remaining)
        api.stop(handle2); // Stop other handle
      }).not.toThrow();
    });
  });

  describe('attachToEntity', () => {
    it('should attach audio to entity with follow enabled', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Should not throw
      expect(() => api.attachToEntity(true)).not.toThrow();
    });

    it('should attach audio to entity without follow', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Should not throw
      expect(() => api.attachToEntity(false)).not.toThrow();
    });

    it('should handle attachment when mesh ref is null', () => {
      const nullMeshRef = vi.fn(() => null);
      const api = createAudioAPI(1, nullMeshRef);

      // Should not throw even with null mesh
      expect(() => api.attachToEntity(true)).not.toThrow();
    });

    it('should call mesh ref getter when attaching', () => {
      const api = createAudioAPI(1, mockMeshRef);

      api.attachToEntity(true);

      expect(mockMeshRef).toHaveBeenCalled();
    });
  });

  describe('cleanupAudioAPI', () => {
    it('should cleanup audio API without errors', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Play some sounds
      api.play('sounds/sound1.mp3');
      api.play('sounds/sound2.mp3');

      // Cleanup should not throw
      expect(() => cleanupAudioAPI(api)).not.toThrow();
    });

    it('should cleanup empty audio API', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Cleanup without playing anything
      expect(() => cleanupAudioAPI(api)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical gameplay audio sequence', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Play background music
      const musicHandle = api.play('sounds/music.mp3', { loop: true, volume: 0.3 });

      // Play multiple sound effects
      const sfxHandles = [
        api.play('sounds/jump.mp3'),
        api.play('sounds/collect.mp3'),
        api.play('sounds/powerup.mp3'),
      ];

      // Attach to entity for positional audio
      api.attachToEntity(true);

      // Stop individual effects
      sfxHandles.forEach((handle) => api.stop(handle));

      // Stop background music
      api.stop(musicHandle);

      expect(true).toBe(true); // All operations completed without error
    });

    it('should handle rapid sound playback', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Simulate rapid fire sounds
      const handles: number[] = [];
      for (let i = 0; i < 50; i++) {
        handles.push(api.play('sounds/gunshot.mp3'));
      }

      // All handles should be unique
      const uniqueHandles = new Set(handles);
      expect(uniqueHandles.size).toBe(50);
    });

    it('should handle complex audio mixing scenario', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Background ambience
      const ambienceHandle = api.play('sounds/ambience.mp3', { loop: true, volume: 0.2 });

      // Periodic events
      const eventHandles = [];
      for (let i = 0; i < 5; i++) {
        eventHandles.push(api.play('sounds/event.mp3'));
      }

      // UI sounds
      const uiHandles = [
        api.play('sounds/click.mp3'),
        api.play('sounds/hover.mp3'),
        api.play('sounds/success.mp3'),
      ];

      // Stop all event sounds by URL
      api.stop('sounds/event.mp3');

      // Stop UI sounds individually
      uiHandles.forEach((h) => api.stop(h));

      // Keep ambience playing
      expect(ambienceHandle).toBeGreaterThan(0);
    });

    it('should handle entity movement with positional audio', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Attach audio to entity
      api.attachToEntity(true);

      // Play looping engine sound
      const engineHandle = api.play('sounds/engine.mp3', { loop: true });

      // Simulate entity movement
      mockMesh.position.set(100, 50, 200);

      // Audio should follow entity (implementation pending)
      api.attachToEntity(true);

      // Stop engine
      api.stop(engineHandle);

      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty URL string', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('');
      expect(typeof handle).toBe('number');
    });

    it('should handle very long URL paths', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const longUrl = 'sounds/' + 'very-long-path-segment/'.repeat(20) + 'sound.mp3';
      const handle = api.play(longUrl);

      expect(typeof handle).toBe('number');
    });

    it('should handle malformed URLs gracefully', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const malformedUrls = [
        '//invalid',
        'http://',
        'sounds\\windows\\path.mp3',
        'sounds/../../escape.mp3',
      ];

      malformedUrls.forEach((url) => {
        const handle = api.play(url);
        expect(typeof handle).toBe('number');
      });
    });

    it('should handle play/stop cycles', () => {
      const api = createAudioAPI(1, mockMeshRef);

      for (let i = 0; i < 10; i++) {
        const handle = api.play('sounds/cycle.mp3');
        api.stop(handle);
      }

      expect(true).toBe(true);
    });

    it('should handle maximum integer sound ID', () => {
      const api = createAudioAPI(1, mockMeshRef);

      // Play many sounds to increment ID
      const handles: number[] = [];
      for (let i = 0; i < 100; i++) {
        handles.push(api.play('sounds/sound.mp3'));
      }

      // All should be valid numbers
      handles.forEach((handle) => {
        expect(typeof handle).toBe('number');
        expect(handle).toBeGreaterThan(0);
      });
    });
  });

  describe('Future Integration Preparation', () => {
    it('should support volume parameter', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/sound.mp3', {
        volume: 0.5,
      });

      expect(typeof handle).toBe('number');
    });

    it('should support loop parameter', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/music.mp3', {
        loop: true,
      });

      expect(typeof handle).toBe('number');
    });

    it('should support playback rate parameter', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/sound.mp3', {
        rate: 1.5, // Faster playback
      });

      expect(typeof handle).toBe('number');
    });

    it('should support spatial audio parameters', () => {
      const api = createAudioAPI(1, mockMeshRef);

      const handle = api.play('sounds/3d-sound.mp3', {
        spatial: true,
        refDistance: 1,
        maxDistance: 100,
        rolloffFactor: 1,
      });

      expect(typeof handle).toBe('number');
    });
  });
});
