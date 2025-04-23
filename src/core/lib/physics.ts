// Core Physics implementation for Vibe Coder 3D
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';

import { useGameLoop } from './gameLoop';

// Export types from Rapier for convenience
export { RigidBodyType } from '@dimforge/rapier3d-compat';

// Define key physics constants
export const PHYSICS_UPDATE_RATE = 1 / 60; // 60Hz physics updates
export const MAX_PHYSICS_STEPS = 3; // Maximum physics steps per frame to prevent spiral of death

/**
 *
 * Hook to access the Rapier world instance and physics utility functions
 */
export function usePhysics() {
  const { world, rapier } = useRapier();

  return {
    world,
    rapier,
    // Utility functions can be added here as needed

    // Create a ray for raycasting
    createRay: (origin: [number, number, number], direction: [number, number, number]) => {
      return new rapier.Ray(
        { x: origin[0], y: origin[1], z: origin[2] },
        { x: direction[0], y: direction[1], z: direction[2] },
      );
    },

    // Cast a ray and return the first hit
    raycast: (
      origin: [number, number, number],
      direction: [number, number, number],
      maxToi = 100,
    ) => {
      const ray = new rapier.Ray(
        { x: origin[0], y: origin[1], z: origin[2] },
        { x: direction[0], y: direction[1], z: direction[2] },
      );

      return world.castRay(ray, maxToi, true);
    },

    // Check if a point is inside any collider
    pointIntersection: (point: [number, number, number]) => {
      return world.intersectionsWithPoint({ x: point[0], y: point[1], z: point[2] }, () => true);
    },
  };
}

/**
 * Component to advance the physics simulation in sync with the game loop
 * This should be used inside the EngineLoop component
 */
export function usePhysicsSystem() {
  const { world } = useRapier();
  const { isRunning, isPaused } = useGameLoop();

  // Accumulated time for fixed timestep physics
  let accumulatedTime = 0;

  useFrame((_, delta) => {
    // Skip physics update if game is not running or is paused
    if (!isRunning || isPaused) return;

    // Accumulate time and step physics in fixed intervals
    accumulatedTime += delta;

    // Cap the number of physics steps to prevent spiral of death
    let steps = 0;

    while (accumulatedTime >= PHYSICS_UPDATE_RATE && steps < MAX_PHYSICS_STEPS) {
      world.step();
      accumulatedTime -= PHYSICS_UPDATE_RATE;
      steps++;
    }

    // If we had to cap the physics steps, reset accumulated time
    // This can cause minor physics inaccuracies but prevents the simulation from slowing down
    if (steps >= MAX_PHYSICS_STEPS && accumulatedTime >= PHYSICS_UPDATE_RATE) {
      accumulatedTime = 0;
    }
  });
}
