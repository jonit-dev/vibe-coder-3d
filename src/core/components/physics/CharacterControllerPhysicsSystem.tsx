/**
 * Character Controller Physics System Component
 * Integrates character controller with Rapier physics world
 * Must be rendered inside <Physics> context from @react-three/rapier
 */

import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useEffect } from 'react';

import { InputManager } from '@core/lib/input/InputManager';
import {
  updateCharacterControllerAutoInputSystem,
  cleanupCharacterControllerAutoInputSystem,
} from '@core/systems/CharacterControllerAutoInputSystem';
import { Logger } from '@core/lib/logger';
import type { Collider } from '@dimforge/rapier3d-compat';

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

  // Map to store collider handles for entities
  // This would need to be populated by the physics rendering system
  // For now, we'll provide a simple accessor that returns null
  const getEntityCollider = (_entityId: number): Collider | null => {
    // TODO: Implement proper collider lookup based on entity ID
    // This should query the physics world for colliders associated with entities
    // For now, return null and let the system use fallback physics
    return null;
  };

  useFrame((_, delta) => {
    if (!isPlaying) return;

    // Get input manager
    const inputManager = InputManager.getInstance();

    // Update character controller system with physics world
    try {
      updateCharacterControllerAutoInputSystem(
        inputManager,
        isPlaying,
        delta,
        world,
        getEntityCollider,
      );
    } catch (error) {
      logger.error('Error updating character controller system', {
        error: String(error),
      });
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCharacterControllerAutoInputSystem(world);
    };
  }, [world]);

  return null; // No visual rendering, just system logic
};
