/**
 * Hook to control the game engine using scoped loop store
 * Provides memoized functions to start, stop, pause, resume, and reset the engine
 * Uses the nearest EngineContext instead of global state
 */
import { useCallback } from 'react';

import { useEngineContext } from '@core/context/EngineProvider';

// The controls returned by the hook
export interface IGameEngineControls {
  startEngine: () => void;
  stopEngine: () => void;
  pauseEngine: () => void;
  resumeEngine: () => void;
  resetEngine: () => void;
}

/**
 * Hook to control the game engine with scoped context
 * Replaces the global useGameEngine hook with context-aware implementation
 */
export function useGameEngineControls(): IGameEngineControls {
  const { loopStore, worldStore } = useEngineContext();

  // Start the engine
  const startEngine = useCallback(() => {
    loopStore.getState().startLoop();
  }, [loopStore]);

  // Stop the engine
  const stopEngine = useCallback(() => {
    loopStore.getState().stopLoop();
  }, [loopStore]);

  // Pause the engine
  const pauseEngine = useCallback(() => {
    loopStore.getState().pauseLoop();
  }, [loopStore]);

  // Resume the engine
  const resumeEngine = useCallback(() => {
    loopStore.getState().resumeLoop();
  }, [loopStore]);

  // Reset the engine
  const resetEngine = useCallback(() => {
    const gameLoop = loopStore.getState();

    // Stop the engine if it's running
    if (gameLoop.isRunning) {
      gameLoop.stopLoop();
    }

    // Reset the ECS world (if available and has reset method)
    const world = worldStore.getState().world;
    if (world && typeof (world as unknown).reset === 'function') {
      (world as { reset: () => void }).reset();
    }

    // Restart the engine
    gameLoop.startLoop();
  }, [loopStore, worldStore]);

  // Return the controls
  return {
    startEngine,
    stopEngine,
    pauseEngine,
    resumeEngine,
    resetEngine,
  };
}
