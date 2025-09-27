// useGameEngine Hook (DEPRECATED)
// Provides control functions for the game engine using the game loop store
// MIGRATION: Use useGameEngineControls with EngineProvider instead
import { useCallback } from 'react';

import { ECSWorld } from '@core/lib/ecs/World';
import { useGameLoop } from '@core/lib/gameLoop';

// Interface for consistency (duplicated to avoid circular imports)
export interface IGameEngineControls {
  startEngine: () => void;
  stopEngine: () => void;
  pauseEngine: () => void;
  resumeEngine: () => void;
  resetEngine: () => void;
}

/**
 * @deprecated Use useGameEngineControls with EngineProvider instead
 * This hook uses global state and will be removed in a future version
 *
 * Migration guide:
 * 1. Wrap your app/component with <EngineProvider>
 * 2. Replace useGameEngine() with useGameEngineControls()
 */
export function useGameEngine(): IGameEngineControls {
  // Note: Context checking removed to avoid require() imports
  // This hook now uses the legacy implementation only
  // Use useGameEngineControls with EngineProvider for the new context-aware version

  // Warn about deprecation in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[useGameEngine] DEPRECATED: This hook uses global state. ' +
        'Please wrap your component with <EngineProvider> and use useGameEngineControls() instead.',
    );
  }

  // Legacy implementation using global state
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
    ECSWorld.getInstance().reset();

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
