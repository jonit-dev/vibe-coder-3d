/**
 * Audio API implementation
 * Provides scripts with sound playback capabilities using Howler.js
 */

import * as THREE from 'three';
import { Howl } from 'howler';
import type { IAudioAPI } from '../ScriptAPI';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('AudioAPI');

/**
 * Global registry of active sound instances created by scripts
 * Maps unique sound IDs to their Howl instances and metadata
 */
interface IScriptSoundInstance {
  howl: Howl;
  howlId: number | null; // Howler's internal sound ID
  url: string;
  entityId: number;
  is3D: boolean;
  follow: boolean; // Whether to follow entity position
}

// Global sound registry (shared across all script contexts)
const scriptSoundRegistry = new Map<number, IScriptSoundInstance>();
let nextScriptSoundId = 1;

// Track sounds per entity for cleanup
const entitySoundMap = new Map<number, Set<number>>();

/**
 * Get world position from entity's mesh
 */
const getEntityWorldPosition = (mesh: THREE.Object3D): [number, number, number] => {
  const worldPos = new THREE.Vector3();
  mesh.getWorldPosition(worldPos);
  return [worldPos.x, worldPos.y, worldPos.z];
};

/**
 * Creates an audio API for scripts with full Howler.js integration
 */
export const createAudioAPI = (
  entityId: number,
  getMeshRef: () => THREE.Object3D | null,
): IAudioAPI => {
  // Ensure entity has a sound set in the map
  if (!entitySoundMap.has(entityId)) {
    entitySoundMap.set(entityId, new Set());
  }
  const entitySounds = entitySoundMap.get(entityId)!;

  return {
    play: (url: string, options?: Record<string, unknown>): number => {
      logger.debug('Playing sound', { entityId, url, options });

      try {
        // Extract options with defaults
        const volume = typeof options?.volume === 'number' ? options.volume : 1.0;
        const loop = typeof options?.loop === 'boolean' ? options.loop : false;
        const rate = typeof options?.rate === 'number' ? options.rate : 1.0;
        const sprite = typeof options?.sprite === 'string' ? options.sprite : undefined;
        const is3D = typeof options?.is3D === 'boolean' ? options.is3D : false;

        // Validate options
        const clampedVolume = Math.max(0, Math.min(1, volume));
        const clampedRate = Math.max(0.1, Math.min(4, rate));

        // Create Howl instance
        const howl = new Howl({
          src: [url],
          loop,
          volume: clampedVolume,
          rate: clampedRate,
          sprite: sprite ? { [sprite]: [0, 1000] } : undefined,
          html5: is3D, // Use HTML5 for 3D audio support
          onloaderror: (_id, error) => {
            logger.error('Failed to load sound', { url, error });
          },
          onplayerror: (_id, error) => {
            logger.error('Failed to play sound', { url, error });
          },
        });

        // Play the sound
        const howlId = howl.play(sprite);

        // If 3D audio is requested, set up spatial positioning
        if (is3D) {
          const mesh = getMeshRef();
          if (mesh) {
            const [x, y, z] = getEntityWorldPosition(mesh);
            howl.pos(x, y, z, howlId);
          } else {
            logger.warn('Cannot enable 3D audio: entity has no mesh', { entityId });
          }
        }

        // Register the sound instance
        const scriptSoundId = nextScriptSoundId++;
        const soundInstance: IScriptSoundInstance = {
          howl,
          howlId,
          url,
          entityId,
          is3D,
          follow: false, // Will be set by attachToEntity
        };

        scriptSoundRegistry.set(scriptSoundId, soundInstance);
        entitySounds.add(scriptSoundId);

        logger.debug('Sound started', { scriptSoundId, howlId, url });

        return scriptSoundId;
      } catch (error) {
        logger.error('Error playing sound', { url, error });
        return -1;
      }
    },

    stop: (handleOrUrl: number | string): void => {
      if (typeof handleOrUrl === 'number') {
        // Stop by sound ID
        const soundInstance = scriptSoundRegistry.get(handleOrUrl);
        if (soundInstance) {
          if (soundInstance.howlId !== null) {
            soundInstance.howl.stop(soundInstance.howlId);
          }
          soundInstance.howl.unload();
          scriptSoundRegistry.delete(handleOrUrl);
          entitySounds.delete(handleOrUrl);
          logger.debug('Stopped sound by ID', { scriptSoundId: handleOrUrl });
        }
      } else {
        // Stop all sounds with matching URL for this entity
        const soundsToStop: number[] = [];
        for (const [scriptSoundId, instance] of scriptSoundRegistry.entries()) {
          if (instance.url === handleOrUrl && instance.entityId === entityId) {
            soundsToStop.push(scriptSoundId);
          }
        }

        for (const scriptSoundId of soundsToStop) {
          const instance = scriptSoundRegistry.get(scriptSoundId)!;
          if (instance.howlId !== null) {
            instance.howl.stop(instance.howlId);
          }
          instance.howl.unload();
          scriptSoundRegistry.delete(scriptSoundId);
          entitySounds.delete(scriptSoundId);
        }

        logger.debug('Stopped sounds by URL', { url: handleOrUrl, count: soundsToStop.length });
      }
    },

    attachToEntity: (follow: boolean): void => {
      const mesh = getMeshRef();
      if (!mesh) {
        logger.warn('Cannot attach audio: entity has no mesh', { entityId });
        return;
      }

      // Enable 3D positioning for all active sounds of this entity
      for (const scriptSoundId of entitySounds) {
        const instance = scriptSoundRegistry.get(scriptSoundId);
        if (instance && instance.howlId !== null) {
          instance.is3D = true;
          instance.follow = follow;

          // Set current position
          const [x, y, z] = getEntityWorldPosition(mesh);
          instance.howl.pos(x, y, z, instance.howlId);

          logger.debug('Attached audio to entity', { scriptSoundId, follow });
        }
      }
    },
  };
};

/**
 * Update 3D audio positions for sounds that follow their entities
 * Should be called each frame from the script system
 */
export const updateAudioPositions = (): void => {
  for (const instance of scriptSoundRegistry.values()) {
    if (instance.is3D && instance.follow && instance.howlId !== null) {
      // Would need access to ThreeJS registry or entity system to get mesh
      // For now, this is a placeholder - position updates will happen when
      // attachToEntity is called or when the entity moves
      // In a full implementation, you'd integrate with ThreeJSEntityRegistry
    }
  }
};

/**
 * Cleanup function to be called when script is destroyed
 * Stops and unloads all active sounds for the entity
 */
export const cleanupAudioAPI = (entityId: number): void => {
  const entitySounds = entitySoundMap.get(entityId);
  if (!entitySounds) {
    return;
  }

  logger.debug('Cleaning up audio for entity', { entityId, soundCount: entitySounds.size });

  // Stop and unload all sounds for this entity
  for (const scriptSoundId of entitySounds) {
    const instance = scriptSoundRegistry.get(scriptSoundId);
    if (instance) {
      if (instance.howlId !== null) {
        instance.howl.stop(instance.howlId);
      }
      instance.howl.unload();
      scriptSoundRegistry.delete(scriptSoundId);
    }
  }

  // Clear entity's sound set
  entitySounds.clear();
  entitySoundMap.delete(entityId);
};
