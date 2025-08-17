/**
 * Sound System
 * ECS system that handles sound component processing during play mode
 * Ensures autoplay sounds trigger when entering play mode
 */

import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { eventBus } from '../lib/events';
import { SoundData } from '../lib/ecs/components/definitions/SoundComponent';

let isInitialized = false;
let wasPlayingMode = false;

/**
 * Sound system - processes sound components during play mode
 * Handles autoplay triggering and future sound system features
 */
export function soundSystem(_deltaTime: number, isPlaying?: boolean): number {
  let processedCount = 0;

  // Initialize on first run
  if (!isInitialized) {
    console.log('[SoundSystem] Initialized');
    isInitialized = true;
  }

  // Detect when entering play mode
  const enteringPlayMode = isPlaying && !wasPlayingMode;
  wasPlayingMode = isPlaying || false;

  if (enteringPlayMode) {
    console.log('[SoundSystem] Entering play mode - checking for autoplay sounds');
    
    // Get all entities with Sound components
    const soundEntities = componentRegistry.getEntitiesWithComponent('Sound');
    
    for (const entityId of soundEntities) {
      const soundData = componentRegistry.getComponentData(entityId, 'Sound') as SoundData;
      
      if (soundData && soundData.autoplay && soundData.enabled && !soundData.isPlaying) {
        console.log(`[SoundSystem] Triggering autoplay for entity ${entityId}`);
        
        // Emit event to notify SoundManager to start playback
        eventBus.emit('sound:autoplay', {
          entityId,
          soundData,
        });
        
        processedCount++;
      }
    }
  }

  // Future: Add continuous sound processing here if needed
  // - 3D audio position updates
  // - Dynamic sound streaming
  // - Sound occlusion/obstruction
  // - Performance-based audio quality adjustment

  return processedCount;
}

/**
 * Cleanup function for sound system
 */
export function cleanupSoundSystem(): void {
  isInitialized = false;
  wasPlayingMode = false;
  console.log('[SoundSystem] Cleaned up');
}