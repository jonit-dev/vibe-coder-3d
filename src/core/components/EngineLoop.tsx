// EngineLoop component - Manages the core game loop and systems
import { useFrame } from '@react-three/fiber';
import { ReactNode, useEffect } from 'react';

import { useGameLoop } from '../lib/gameLoop';
import { runPhysicsSyncSystem } from '../systems/PhysicsSyncSystem';

// Types for component props
interface EngineLoopProps {
  children?: ReactNode;
  autoStart?: boolean;
  paused?: boolean;
  debug?: boolean;
}

/**
 * The EngineLoop component is responsible for managing the core game loop
 * and orchestrating the execution of systems (physics, ECS, etc.)
 */
export const EngineLoop = ({
  children,
  autoStart = true,
  paused = false,
  debug = false,
}: EngineLoopProps) => {
  // Get access to the game loop state
  const gameLoop = useGameLoop();

  // Auto-start or pause the game loop based on props
  useEffect(() => {
    if (autoStart && !gameLoop.isRunning) {
      gameLoop.startLoop();
    }

    // Handle paused state
    if (paused && !gameLoop.isPaused && gameLoop.isRunning) {
      gameLoop.pauseLoop();
    } else if (!paused && gameLoop.isPaused && gameLoop.isRunning) {
      gameLoop.resumeLoop();
    }

    // Clean up when component unmounts
    return () => {
      if (gameLoop.isRunning) {
        gameLoop.stopLoop();
      }
    };
  }, [autoStart, paused, gameLoop]);

  // Main game loop
  useFrame((_, deltaTime) => {
    // Skip if not running or paused
    if (!gameLoop.isRunning || gameLoop.isPaused) return;

    // Update the game loop state
    gameLoop.update(deltaTime);

    // Run ECS systems
    runECSSystems(deltaTime);
  });

  // Optional debug output
  useEffect(() => {
    if (debug) {
      // Set up a periodic log of performance
      const interval = setInterval(() => {
        if (gameLoop.isRunning && !gameLoop.isPaused) {
          console.log(`FPS: ${gameLoop.fps}, Frame: ${gameLoop.frameCount}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [debug, gameLoop]);

  // Render children - typically the actual game scene
  return <>{children}</>;
};

/**
 * Function to run all ECS systems
 * This would be expanded as more systems are added
 */
function runECSSystems(deltaTime: number) {
  // Run physics sync system - syncs physics bodies with Transform components
  const physicsSyncCount = runPhysicsSyncSystem(deltaTime);

  // For future systems, add them here in the appropriate order
  // e.g., movementSystem(ecsWorld, deltaTime);

  // Debug info
  if (physicsSyncCount > 0) {
    // Uncomment for debugging:
    // console.log(`Updated ${physicsSyncCount} physics entities`);
  }
}
