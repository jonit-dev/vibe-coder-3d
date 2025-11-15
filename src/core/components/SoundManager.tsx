/**
 * Sound Manager Component
 * Integrates Sound components with Howler.js for actual audio playback
 * Handles 3D spatial audio positioning and playback state synchronization
 */

import { Howl, Howler } from 'howler';
import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useEvent } from '@/core/hooks/useEvent';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { SoundData } from '@/core/lib/ecs/components/definitions/SoundComponent';
import { EntityId } from '@/core/lib/ecs/types';
import { Logger } from '@/core/lib/logger';

interface ISoundInstance {
  entityId: EntityId;
  howl: Howl | null;
  soundId: number | null;
  lastUpdateTime: number;
}

const logger = Logger.create('SoundManager');

// Reusable Vector3 instances to avoid allocations
const tempVec3 = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempForward = new THREE.Vector3();
const tempUp = new THREE.Vector3();

export const SoundManager: React.FC = React.memo(() => {
  const soundInstances = useRef<Map<EntityId, ISoundInstance>>(new Map());

  // Initialize Howler global settings
  useEffect(() => {
    // Set up global audio context
    Howler.autoUnlock = true;
    Howler.html5PoolSize = 10;

    return () => {
      // Cleanup all sounds on unmount
      soundInstances.current.forEach((instance) => {
        if (instance.howl) {
          instance.howl.unload();
        }
      });
      soundInstances.current.clear();
    };
  }, []);

  // Helper function to get world position from Transform component
  // Returns position in the reusable tempVec3 to avoid allocations
  const getEntityWorldPosition = useCallback((entityId: EntityId): THREE.Vector3 => {
    const transformData = componentRegistry.getComponentData(entityId, 'Transform') as
      | { position?: [number, number, number] }
      | undefined;
    if (transformData && Array.isArray(transformData.position)) {
      tempVec3.set(...transformData.position);
    } else {
      tempVec3.set(0, 0, 0);
    }
    return tempVec3;
  }, []);

  // Helper function to detect audio format from file path
  const detectAudioFormat = useCallback((audioPath: string): string => {
    const extension = audioPath.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }, []);

  // Create or update a sound instance
  const updateSoundInstance = useCallback(
    (entityId: EntityId, soundData: SoundData) => {
      let instance = soundInstances.current.get(entityId);
      const needsReload =
        !instance?.howl || (instance.howl as { _src?: string })._src !== soundData.audioPath;

      if (needsReload) {
        // Clean up existing sound
        if (instance?.howl) {
          instance.howl.unload();
        }

        // Create new Howl instance
        if (soundData.audioPath) {
          const howl = new Howl({
            src: [soundData.audioPath],
            loop: soundData.loop,
            volume: soundData.volume,
            rate: soundData.playbackRate,
            autoplay: false, // We'll handle autoplay separately
            html5: true, // Use HTML5 Audio for better 3D support
            onload: () => {
              // Update duration in ECS
              componentRegistry.updateComponent(entityId, 'Sound', {
                duration: howl.duration(),
                format: detectAudioFormat(soundData.audioPath),
              });

              // Handle autoplay after audio is loaded
              if (soundData.autoplay && soundData.enabled && !soundData.isPlaying) {
                const soundId = howl.play();
                instance!.soundId = soundId;
              }
            },
            onloaderror: (_id: number | string, error: unknown) => {
              logger.error(`Failed to load audio: ${soundData.audioPath}`, error);
            },
            onplay: () => {
              componentRegistry.updateComponent(entityId, 'Sound', { isPlaying: true });
            },
            onpause: () => {
              componentRegistry.updateComponent(entityId, 'Sound', { isPlaying: false });
            },
            onstop: () => {
              componentRegistry.updateComponent(entityId, 'Sound', {
                isPlaying: false,
                currentTime: 0,
              });
            },
            onend: () => {
              componentRegistry.updateComponent(entityId, 'Sound', {
                isPlaying: false,
                currentTime: soundData.loop ? 0 : howl.duration(),
              });
            },
          });

          instance = {
            entityId,
            howl,
            soundId: null,
            lastUpdateTime: Date.now(),
          };
        } else {
          instance = {
            entityId,
            howl: null,
            soundId: null,
            lastUpdateTime: Date.now(),
          };
        }

        soundInstances.current.set(entityId, instance);
      }

      // Update existing instance properties if howl exists
      if (instance?.howl) {
        const howl = instance.howl;

        // Update basic properties
        howl.loop(soundData.loop);
        howl.volume(soundData.muted ? 0 : soundData.volume);
        howl.rate(soundData.playbackRate);

        // Handle 3D positioning if enabled
        if (soundData.is3D) {
          const worldPos = getEntityWorldPosition(entityId);
          howl.pos(worldPos.x, worldPos.y, worldPos.z);

          // Set 3D audio properties
          const soundId = instance.soundId;
          if (soundId !== null) {
            // These properties are per-sound-instance, not per-howl
            // Note: Howler.js internal properties for 3D audio
            const howlInternal = howl as { _pannerAttr?: Record<string, unknown> };
            howlInternal._pannerAttr = {
              coneInnerAngle: soundData.coneInnerAngle,
              coneOuterAngle: soundData.coneOuterAngle,
              coneOuterGain: soundData.coneOuterGain,
              distanceModel: 'inverse',
              maxDistance: soundData.maxDistance,
              refDistance: soundData.minDistance,
              rolloffFactor: soundData.rolloffFactor,
              panningModel: 'HRTF',
            };
          }
        }

        // Handle playback state
        if (soundData.isPlaying && !howl.playing()) {
          const soundId = howl.play();
          instance.soundId = soundId;

          // Seek to current time if specified
          if (soundData.currentTime > 0) {
            howl.seek(soundData.currentTime, soundId);
          }
        } else if (!soundData.isPlaying && howl.playing()) {
          howl.pause();
        }

        // Update current time in ECS periodically
        if (howl.playing() && instance.soundId !== null) {
          const currentTime = howl.seek(instance.soundId) as number;
          const now = Date.now();

          // Update every 100ms to avoid too frequent updates
          if (now - instance.lastUpdateTime > 100) {
            componentRegistry.updateComponent(entityId, 'Sound', { currentTime });
            instance.lastUpdateTime = now;
          }
        }
      }
    },
    [detectAudioFormat, getEntityWorldPosition],
  );

  // Remove sound instance
  const removeSoundInstance = useCallback((entityId: EntityId) => {
    const instance = soundInstances.current.get(entityId);
    if (instance?.howl) {
      instance.howl.unload();
    }
    soundInstances.current.delete(entityId);
  }, []);

  // Listen for component events
  const handleComponentAdded = useCallback(
    (event: { componentId: string; entityId: EntityId; data: unknown }) => {
      if (event.componentId === 'Sound') {
        const soundData = event.data as SoundData;
        updateSoundInstance(event.entityId, soundData);
      }
    },
    [updateSoundInstance],
  );

  const handleComponentUpdated = useCallback(
    (event: { componentId: string; entityId: EntityId; data: unknown }) => {
      if (event.componentId === 'Sound') {
        const soundData = event.data as SoundData;
        updateSoundInstance(event.entityId, soundData);
      }
    },
    [updateSoundInstance],
  );

  const handleComponentRemoved = useCallback(
    (event: { componentId: string; entityId: EntityId }) => {
      if (event.componentId === 'Sound') {
        removeSoundInstance(event.entityId);
      }
    },
    [removeSoundInstance],
  );

  const handleSoundAutoplay = useCallback(
    (event: { entityId: number; soundData: SoundData }) => {
      updateSoundInstance(event.entityId, event.soundData);
    },
    [updateSoundInstance],
  );

  useEvent('component:added', handleComponentAdded);
  useEvent('component:updated', handleComponentUpdated);
  useEvent('component:removed', handleComponentRemoved);
  useEvent('sound:autoplay', handleSoundAutoplay);

  // Update 3D listener position from camera
  const updateListener = useCallback(() => {
    // Find the main camera entity (usually entity ID 1 or first camera found)
    const allCameras = componentRegistry.getEntitiesWithComponent('Camera');
    if (allCameras.length > 0) {
      const cameraEntityId = allCameras[0];
      const cameraPos = getEntityWorldPosition(cameraEntityId);

      // Update Howler listener position
      Howler.pos(cameraPos.x, cameraPos.y, cameraPos.z);

      // Set listener orientation based on camera rotation
      const transformData = componentRegistry.getComponentData(cameraEntityId, 'Transform') as
        | { rotation?: [number, number, number] }
        | undefined;
      if (transformData && Array.isArray(transformData.rotation)) {
        const [rx, ry, rz] = transformData.rotation;
        tempEuler.set(rx, ry, rz);
        tempForward.set(0, 0, -1).applyEuler(tempEuler);
        tempUp.set(0, 1, 0).applyEuler(tempEuler);

        Howler.orientation(
          tempForward.x,
          tempForward.y,
          tempForward.z,
          tempUp.x,
          tempUp.y,
          tempUp.z,
        );
      }
    }
  }, [getEntityWorldPosition]);

  useEffect(() => {
    // Update listener position periodically
    const interval = setInterval(updateListener, 100);

    return () => clearInterval(interval);
  }, [updateListener]);

  // This component doesn't render anything
  return null;
});
