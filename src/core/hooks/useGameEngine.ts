// useGameEngine Hook
// Provides control functions for the game engine using the game loop store
import { useCallback } from 'react';

import { resetWorld } from '@core/lib/ecs';
import { useGameLoop } from '@core/lib/gameLoop';

// The controls returned by the hook
export interface GameEngineControls {
  startEngine: () => void;
  stopEngine: () => void;
  pauseEngine: () => void;
  resumeEngine: () => void;
  resetEngine: () => void;
}

/**
 * Hook to control the game engine
 * Provides memoized functions to start, stop, pause, resume, and reset the engine
 */
export function useGameEngine(): GameEngineControls {
  // Start the engine
  const startEngine = useCallback(() => {
    useGameLoop.getState().startLoop();
  }, []);

  // Stop the engine
  const stopEngine = useCallback(() => {
    useGameLoop.getState().stopLoop();
  }, []);

  // Pause the engine
  const pauseEngine = useCallback(() => {
    useGameLoop.getState().pauseLoop();
  }, []);

  // Resume the engine
  const resumeEngine = useCallback(() => {
    useGameLoop.getState().resumeLoop();
  }, []);

  // Reset the engine
  const resetEngine = useCallback(() => {
    const gameLoop = useGameLoop.getState();

    // Stop the engine if it's running
    if (gameLoop.isRunning) {
      gameLoop.stopLoop();
    }

    // Reset the ECS world
    resetWorld();

    // Restart the engine
    gameLoop.startLoop();
  }, []);

  // Return the controls
  return {
    startEngine,
    stopEngine,
    pauseEngine,
    resumeEngine,
    resetEngine,
  };
}
