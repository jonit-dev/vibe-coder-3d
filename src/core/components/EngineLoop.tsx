// EngineLoop component - Manages the core game loop and systems
import { useFrame } from '@react-three/fiber';
import { ReactNode, useEffect, useRef } from 'react';

import { useGameLoop } from '../lib/gameLoop';
import { runPhysicsSyncSystem } from '../systems/PhysicsSyncSystem';
import { runVelocitySystem } from '../systems/VelocitySystem';

// Types for component props
interface IEngineLoopProps {
  children?: ReactNode;
  autoStart?: boolean;
  paused?: boolean;
  debug?: boolean;
  useFixedTimeStep?: boolean;
  fixedTimeStep?: number;
  maxTimeStep?: number;
  perfMonitoring?: boolean;
}

// Performance tracking
type SystemMetrics = {
  lastTime: number;
  accumulator: number;
  samples: number[];
  average: number;
};

/**
 * The EngineLoop component is responsible for managing the core game loop
 * and orchestrating the execution of systems (physics, ECS, etc.)
 */
export const EngineLoop = ({
  children,
  autoStart = true,
  paused = false,
  debug = false,
  useFixedTimeStep = true,
  fixedTimeStep = 1 / 60, // Default to 60 Hz physics updates
  maxTimeStep = 1 / 30, // Cap for large time steps to prevent tunneling
  perfMonitoring = debug,
}: IEngineLoopProps) => {
  // Get access to the game loop state
  const gameLoop = useGameLoop();

  // Reference for accumulated time when using fixed timestep
  const accumulatedTimeRef = useRef(0);

  // System performance metrics
  const metricsRef = useRef<{
    velocity: SystemMetrics;
    physics: SystemMetrics;
    overall: SystemMetrics;
  }>({
    velocity: { lastTime: 0, accumulator: 0, samples: [], average: 0 },
    physics: { lastTime: 0, accumulator: 0, samples: [], average: 0 },
    overall: { lastTime: 0, accumulator: 0, samples: [], average: 0 },
  });

  // Helper function to track performance
  const trackPerformance = (system: 'velocity' | 'physics' | 'overall', start: number) => {
    if (!perfMonitoring) return;

    const elapsed = performance.now() - start;
    const metrics = metricsRef.current[system];

    metrics.accumulator += elapsed;
    metrics.samples.push(elapsed);

    // Keep only the last 120 samples (about 2 seconds at 60fps)
    if (metrics.samples.length > 120) {
      metrics.samples.shift();
    }

    // Update average every 60 frames
    if (gameLoop.frameCount % 60 === 0) {
      metrics.average = metrics.samples.reduce((sum, val) => sum + val, 0) / metrics.samples.length;
    }
  };

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
  useFrame((_, rawDeltaTime) => {
    // Skip if not running or paused
    if (!gameLoop.isRunning || gameLoop.isPaused) return;

    // Cap delta time to prevent large jumps
    const deltaTime = Math.min(rawDeltaTime, maxTimeStep);

    // Start performance timing for overall frame
    const frameStart = perfMonitoring ? performance.now() : 0;

    // Update the game loop state
    gameLoop.update(deltaTime);

    if (useFixedTimeStep) {
      // Accumulate time for fixed timestep
      accumulatedTimeRef.current += deltaTime;

      // Run systems with fixed timestep
      while (accumulatedTimeRef.current >= fixedTimeStep) {
        // Run ECS systems with fixed timestep
        runECSSystems(fixedTimeStep);

        // Subtract the fixed time step from accumulated time
        accumulatedTimeRef.current -= fixedTimeStep;
      }

      // Set interpolation alpha for smooth rendering between physics steps
      gameLoop.setInterpolationAlpha(accumulatedTimeRef.current / fixedTimeStep);
    } else {
      // Run systems with variable timestep
      runECSSystems(deltaTime);
    }

    // Track overall frame performance
    if (perfMonitoring) {
      trackPerformance('overall', frameStart);
    }
  });

  // Optional debug output
  useEffect(() => {
    if (debug) {
      // Set up a periodic log of performance
      const interval = setInterval(() => {
        if (gameLoop.isRunning && !gameLoop.isPaused) {
          console.log(`FPS: ${gameLoop.fps}, Frame: ${gameLoop.frameCount}`);

          if (perfMonitoring) {
            const { velocity, physics, overall } = metricsRef.current;
            console.log(
              `Performance (ms): Overall: ${overall.average.toFixed(2)}, ` +
                `Velocity: ${velocity.average.toFixed(2)}, ` +
                `Physics: ${physics.average.toFixed(2)}`,
            );
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [debug, gameLoop, perfMonitoring]);

  // Render children - typically the actual game scene
  return <>{children}</>;
};

/**
 * Function to run all ECS systems
 * This would be expanded as more systems are added
 */
function runECSSystems(deltaTime: number) {
  const perfStartVelocity = performance.now();

  // Run velocity system first - updates positions based on velocity
  const velocityCount = runVelocitySystem(deltaTime);

  // Track velocity system performance
  trackPerformance('velocity', perfStartVelocity);

  const perfStartPhysics = performance.now();

  // Run physics sync system - syncs physics bodies with Transform components
  const physicsSyncCount = runPhysicsSyncSystem(deltaTime);

  // Track physics system performance
  trackPerformance('physics', perfStartPhysics);

  // Run material system - updates Three.js materials from ECS Material components
  materialSystem.update();

  // For future systems, add them here in the appropriate order
  // e.g., movementSystem(ecsWorld, deltaTime);

  // Debug info
  if (physicsSyncCount > 0 || velocityCount > 0) {
    // Uncomment for debugging:
    // console.log(`Updated ${velocityCount} velocity entities and ${physicsSyncCount} physics entities`);
  }
}

// Track performance metrics
function trackPerformance(_system: 'velocity' | 'physics' | 'overall', _startTime: number) {
  // const endTime = performance.now();
  // const duration = endTime - startTime;
  // Record the duration for the specific system
  // This logic can be expanded to store/average metrics
  // console.log(`Performance [${system}]: ${duration.toFixed(2)}ms`);
}
