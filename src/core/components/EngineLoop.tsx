// EngineLoop component - Manages the core game loop and systems
import { useFrame } from '@react-three/fiber';
import { ReactNode, useEffect, useRef } from 'react';

import { useEngineContext } from '@core/context/EngineProvider';
import { runRegisteredSystems } from '../lib/extension/GameExtensionPoints';
import { Profiler } from '../lib/perf/Profiler';
import { materialSystem } from '../systems/MaterialSystem';
import { updateScriptSystem } from '../systems/ScriptSystem';
import { cameraSystem } from '../systems/cameraSystem';
import { lightSystem } from '../systems/lightSystem';
import { soundSystem } from '../systems/soundSystem';
import { transformSystem } from '../systems/transformSystem';
import { InputManager } from '../lib/input/InputManager';

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
  // Get access to the game loop state from context
  // This component should only be used within an EngineProvider
  const { loopStore } = useEngineContext();

  // Helper function to get loop state
  const getLoopState = () => {
    return loopStore.getState();
  };

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
    const state = getLoopState();
    if (state.frameCount % 60 === 0) {
      metrics.average = metrics.samples.reduce((sum, val) => sum + val, 0) / metrics.samples.length;
    }
  };

  // Auto-start effect - only runs when autoStart changes
  useEffect(() => {
    const state = getLoopState();
    if (autoStart && !state.isRunning) {
      state.startLoop();
    }
  }, [autoStart]); // Only depend on autoStart

  // Pause/resume effect - only runs when paused prop changes
  useEffect(() => {
    const state = getLoopState();
    if (paused) {
      if (!state.isPaused && state.isRunning) {
        state.pauseLoop();
      }
    } else {
      if (state.isPaused && state.isRunning) {
        state.resumeLoop();
      }
    }
  }, [paused]); // Only depend on paused

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    return () => {
      const state = getLoopState();
      if (state.isRunning) {
        state.stopLoop();
      }
    };
  }, []); // No dependencies - only runs on mount/unmount

  // Main game loop
  useFrame((_, rawDeltaTime) => {
    const state = getLoopState();

    // Skip if not running or paused
    if (!state.isRunning || state.isPaused) return;

    // Cap delta time to prevent large jumps
    const deltaTime = Math.min(rawDeltaTime, maxTimeStep);

    // Start performance timing for overall frame
    const frameStart = perfMonitoring ? performance.now() : 0;

    // Update the game loop state
    state.update(deltaTime);

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
      state.setInterpolationAlpha(accumulatedTimeRef.current / fixedTimeStep);
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
        const state = getLoopState();
        if (state.isRunning && !state.isPaused) {
          if (perfMonitoring) {
            // Performance monitoring in debug mode
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [debug, perfMonitoring]);

  // Render children - typically the actual game scene
  return <>{children}</>;
};

/**
 * Function to run all ECS systems
 * This would be expanded as more systems are added
 */
function runECSSystems(deltaTime: number, isPlaying: boolean = false) {
  // Update input state BEFORE any systems run
  const inputManager = InputManager.getInstance();
  inputManager.update();

  // Run transform system - updates Three.js objects from ECS Transform components
  const transformCount = Profiler.time('transformSystem', () => transformSystem());

  // Run material system - updates Three.js materials from ECS Material components
  Profiler.time('materialSystem', () => materialSystem.update());

  // Run camera system - updates Three.js cameras from ECS Camera components
  const cameraCount = Profiler.time('cameraSystem', () => cameraSystem());

  // Run light system - processes light component updates
  const lightCount = Profiler.time('lightSystem', () => lightSystem(deltaTime));

  // Run script system - executes user scripts with entity context
  // Note: updateScriptSystem is async but we fire-and-forget here to avoid blocking the render loop
  Profiler.time('scriptSystem', () => {
    updateScriptSystem(deltaTime * 1000, isPlaying).catch((error) => {
      console.error('[EngineLoop] Script system error:', error);
    });
  });

  // Run sound system - handles autoplay and sound updates during play mode
  const soundCount = Profiler.time('soundSystem', () => soundSystem(deltaTime, isPlaying));

  // Run registered game systems from extension points
  Profiler.time('registeredSystems', () => runRegisteredSystems(deltaTime));

  // Clear input frame state AFTER all systems have run
  inputManager.clearFrameState();

  // Debug info
  if (transformCount > 0 || cameraCount > 0 || lightCount > 0 || soundCount > 0) {
    // System updates tracked internally
  }
}
