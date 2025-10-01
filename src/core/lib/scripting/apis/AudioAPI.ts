/**
 * Audio API implementation
 * Provides scripts with sound playback capabilities
 */

import * as THREE from 'three';
import type { IAudioAPI } from '../ScriptAPI';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('AudioAPI');

/**
 * Creates an audio API for scripts
 * TODO: Integrate with SoundManager/Howler when available
 */
export const createAudioAPI = (
  entityId: number,
  getMeshRef: () => THREE.Object3D | null,
): IAudioAPI => {
  const activeSounds = new Map<number, any>();
  let nextSoundId = 1;

  return {
    play: (url: string, options?: Record<string, unknown>): number => {
      logger.debug(`Playing sound: ${url}`, { entityId, options });

      // TODO: Integrate with actual audio system
      // For now, return a mock sound ID
      const soundId = nextSoundId++;
      activeSounds.set(soundId, { url, options });

      // Placeholder: Log the sound play request
      logger.warn('Audio playback not yet implemented - integration with SoundManager pending');

      return soundId;
    },

    stop: (handleOrUrl: number | string): void => {
      if (typeof handleOrUrl === 'number') {
        activeSounds.delete(handleOrUrl);
        logger.debug(`Stopping sound by ID: ${handleOrUrl}`, { entityId });
      } else {
        // Stop all sounds with matching URL
        for (const [id, sound] of activeSounds.entries()) {
          if (sound.url === handleOrUrl) {
            activeSounds.delete(id);
          }
        }
        logger.debug(`Stopping sounds by URL: ${handleOrUrl}`, { entityId });
      }

      // TODO: Integrate with actual audio system
      logger.warn('Audio stop not yet implemented - integration with SoundManager pending');
    },

    attachToEntity: (follow: boolean): void => {
      const mesh = getMeshRef();
      if (mesh) {
        logger.debug(`Attaching audio to entity ${entityId}`, { follow });
        // TODO: Implement positional audio attachment
        logger.warn('Positional audio not yet implemented');
      }
    },
  };
};

/**
 * Cleanup function to be called when script is destroyed
 */
export const cleanupAudioAPI = (_api: IAudioAPI) => {
  // TODO: Stop all active sounds for this entity
  logger.debug('Cleaning up audio API');
};
