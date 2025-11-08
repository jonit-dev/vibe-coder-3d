/**
 * Character Controller Physics System Component
 * Integrates character controller with Rapier physics world
 * Must be rendered inside <Physics> context from @react-three/rapier
 *
 * BASELINE REFACTOR: Added lifecycle logging integration
 */

import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useEffect } from 'react';

import { InputManager } from '@core/lib/input/InputManager';
import {
  updateCharacterControllerSystem,
  cleanupCharacterControllerSystem,
} from '@core/systems/CharacterControllerSystem';
import { Logger } from '@core/lib/logger';
import { colliderRegistry } from '@core/physics/character/ColliderRegistry';
import {
  startPhysicsLifecycleLogging,
  stopPhysicsLifecycleLogging,
  clearLifecycleHistory,
} from '@core/physics/character/PhysicsLifecycleLogger';
import { clearSignalHistory } from '@core/systems/CharacterControllerGoldenSignals';

const logger = Logger.create('CharacterControllerPhysicsSystem');

interface ICharacterControllerPhysicsSystemProps {
  isPlaying: boolean;
}

/**
 * Component that runs the Character Controller system with Rapier physics integration
 * This component must be rendered inside the Physics context to access the world
 */
export const CharacterControllerPhysicsSystem: React.FC<ICharacterControllerPhysicsSystemProps> = ({
  isPlaying,
}) => {
  const { world } = useRapier();

  useFrame((_, delta) => {
    if (!isPlaying) return;

    // Get input manager
    const inputManager = InputManager.getInstance();

    // Update character controller system with physics world
    try {
      updateCharacterControllerSystem(
        inputManager,
        isPlaying,
        delta,
        world,
      );
    } catch (error) {
      logger.error('Error updating character controller system', {
        error: String(error),
      });
    }
  });

  // Lifecycle management: start/stop logging and cleanup
  useEffect(() => {
    if (isPlaying) {
      // Start physics lifecycle logging
      startPhysicsLifecycleLogging();
      logger.info('Play mode started - physics lifecycle logging enabled');
    } else {
      // Stop physics lifecycle logging
      stopPhysicsLifecycleLogging();

      // Clear registries and history
      colliderRegistry.clear();
      clearLifecycleHistory();
      clearSignalHistory();

      logger.info('Play mode stopped - cleared physics state');
    }

    return () => {
      // Final cleanup on unmount
      stopPhysicsLifecycleLogging();
      cleanupCharacterControllerSystem(world);
      colliderRegistry.clear();
      clearLifecycleHistory();
      clearSignalHistory();
    };
  }, [world, isPlaying]);

  return null; // No visual rendering, just system logic
};
