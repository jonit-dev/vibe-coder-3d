// EngineLoop Component
// Runs inside a R3F Canvas and executes the ECS systems on each frame
import { markAllTransformsForUpdate } from '@core/lib/ecs';
import { useGameLoop } from '@core/lib/gameLoop';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';

/**
 * Main game loop component that runs inside the R3F Canvas
 * Executes ECS systems and updates the game state on each frame
 */
export function EngineLoop() {
  const { clock } = useThree();

  // Get state from the game loop store
  const isRunning = useGameLoop((state: { isRunning: boolean }) => state.isRunning);
  const isPaused = useGameLoop((state: { isPaused: boolean }) => state.isPaused);
  const update = useGameLoop((state: { update: (delta: number) => void }) => state.update);

  // Called on component mount
  useEffect(() => {
    // Start time for delta calculation
    clock.start();

    return () => {
      // Stop the clock when component unmounts
      clock.stop();
    };
  }, [clock]);

  // Create a stable frame callback that won't recreate on every render
  const frameCallback = useCallback((_: any, delta: number) => {
    // Only run systems if the engine is running and not paused
    if (isRunning && !isPaused) {
      // Mark all transforms for update (simplest approach for now)
      markAllTransformsForUpdate();
      // Update the game loop store with the latest frame time
      update(delta);
    }
  }, [isRunning, isPaused, update]);

  // Register the frame callback with R3F
  useFrame(frameCallback);

  // This component doesn't render anything
  return null;
} 
