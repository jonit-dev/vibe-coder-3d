// EngineLoop component - Manages the core game loop and systems
import { useFrame } from '@react-three/fiber';
import { ReactNode, useEffect, useRef } from 'react';

import { runRegisteredSystems } from '../lib/extension/GameExtensionPoints';
import { useGameLoop } from '../lib/gameLoop';
import { Profiler } from '../lib/perf/Profiler';
import { materialSystem } from '../systems/MaterialSystem';
import { updateScriptSystem } from '../systems/ScriptSystem';
import { cameraSystem } from '../systems/cameraSystem';
import { lightSystem } from '../systems/lightSystem';
import { soundSystem } from '../systems/soundSystem';
import { transformSystem } from '../systems/transformSystem';

// Types for component props
interface IEngineLoopProps {
  children?: ReactNode;
  autoStart?: boolean;
  paused?: boolean;
  isPlaying?: boolean;
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
  isPlaying = false,
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

  // Auto-start effect - only runs when autoStart changes
  useEffect(() => {
    if (autoStart && !gameLoop.isRunning) {
      gameLoop.startLoop();
    }
  }, [autoStart]); // Only depend on autoStart

  // Pause/resume effect - only runs when paused prop changes
  useEffect(() => {
    if (paused) {
      if (!gameLoop.isPaused && gameLoop.isRunning) {
        gameLoop.pauseLoop();
      }
    } else {
      if (gameLoop.isPaused && gameLoop.isRunning) {
        gameLoop.resumeLoop();
      }
    }
  }, [paused]); // Only depend on paused

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    return () => {
      if (gameLoop.isRunning) {
        gameLoop.stopLoop();
      }
    };
  }, []); // No dependencies - only runs on mount/unmount

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
        runECSSystems(fixedTimeStep, isPlaying);

        // Subtract the fixed time step from accumulated time
        accumulatedTimeRef.current -= fixedTimeStep;
      }

      // Set interpolation alpha for smooth rendering between physics steps
      gameLoop.setInterpolationAlpha(accumulatedTimeRef.current / fixedTimeStep);
    } else {
      // Run systems with variable timestep
      runECSSystems(deltaTime, isPlaying);
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
function runECSSystems(deltaTime: number, isPlaying: boolean = false) {
  // Run transform system - updates Three.js objects from ECS Transform components
  const transformCount = Profiler.time('transformSystem', () => transformSystem());

  // Run material system - updates Three.js materials from ECS Material components
  Profiler.time('materialSystem', () => materialSystem.update());

  // Run camera system - updates Three.js cameras from ECS Camera components
  const cameraCount = Profiler.time('cameraSystem', () => cameraSystem());

  // Run light system - processes light component updates
  const lightCount = Profiler.time('lightSystem', () => lightSystem(deltaTime));

  // Run script system - executes user scripts with entity context
  Profiler.time('scriptSystem', () => updateScriptSystem(deltaTime * 1000, isPlaying));

  // Run sound system - handles autoplay and sound updates during play mode
  const soundCount = Profiler.time('soundSystem', () => soundSystem(deltaTime, isPlaying));

  // Run registered game systems from extension points
  Profiler.time('registeredSystems', () => runRegisteredSystems(deltaTime));

  // Debug info
  if (transformCount > 0 || cameraCount > 0 || lightCount > 0 || soundCount > 0) {
    // Uncomment for debugging:
    console.log(
      `[EngineLoop] System updates - Transform: ${transformCount}, Camera: ${cameraCount}, Light: ${lightCount}, Sound: ${soundCount}`,
    );
  }
}

// Track performance metrics
function trackPerformance(_system: 'velocity' | 'physics' | 'overall', __startTime: number) {
  // const endTime = performance.now();
  // const duration = endTime - startTime;
  // Record the duration for the specific system
  // This logic can be expanded to store/average metrics
  // console.log(`Performance [${system}]: ${duration.toFixed(2)}ms`);
}
