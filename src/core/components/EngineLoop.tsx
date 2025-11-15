// EngineLoop component - Manages the core game loop and systems
import { useFrame, useThree } from '@react-three/fiber';
import { ReactNode, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useEngineContext } from '@core/context/EngineProvider';
import { runRegisteredSystems } from '../lib/extension/GameExtensionPoints';
import { materialSystem } from '@core/systems/MaterialSystem';
import { updateScriptSystem } from '@core/systems/ScriptSystem';
import { AnimationSystem, animationSystem } from '@core/systems/AnimationSystem';
import { cameraSystem } from '@core/systems/cameraSystem';
import { lightSystem } from '@core/systems/lightSystem';
import { soundSystem } from '@core/systems/soundSystem';
import { transformSystem } from '@core/systems/transformSystem';
import { InputManager } from '@core/lib/input/InputManager';
import {
  initBVHSystem,
  updateBVHSystem,
  disposeBVHSystem,
  setBVHSystemEnabled,
} from '@core/systems/bvhSystem';
import {
  initInstanceSystem,
  updateInstanceSystem,
  cleanupInstanceSystem,
} from '@core/systems/InstanceSystem';
// Character Controller system now handled by CharacterControllerPhysicsSystem component
// which runs inside the Physics context to access Rapier world
import { useEngineStore } from '@core/state/engineStore';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('EngineLoop');

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

  // Initialize BVH system and Instance system
  const { scene, camera } = useThree();
  const bvhCullingEnabled = useEngineStore((s) => s.bvhCulling);

  useEffect(() => {
    if (scene && camera) {
      // Initialize systems that depend on the R3F scene/camera
      initBVHSystem(scene, camera);
      initInstanceSystem(scene);

      // Ensure the AnimationSystem has a reference to the live scene even
      // when the engine loop is paused (editor mode, timeline scrubbing).
      AnimationSystem.init(scene);
    }

    // Cleanup on unmount
    return () => {
      disposeBVHSystem();
      cleanupInstanceSystem();
      // CharacterController cleanup is now handled by CharacterControllerPhysicsSystem component
    };
  }, [scene, camera]);

  // Update BVH system enabled state when setting changes
  useEffect(() => {
    setBVHSystemEnabled(bvhCullingEnabled);
  }, [bvhCullingEnabled]);

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
  useFrame((frameState, rawDeltaTime) => {
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
        runECSSystems(fixedTimeStep, isPlaying, frameState.scene);

        // Subtract the fixed time step from accumulated time
        accumulatedTimeRef.current -= fixedTimeStep;
      }

      // Set interpolation alpha for smooth rendering between physics steps
      state.setInterpolationAlpha(accumulatedTimeRef.current / fixedTimeStep);
    } else {
      // Run systems with variable timestep
      runECSSystems(deltaTime, isPlaying, frameState.scene);
    }

    // Update BVH system (runs outside fixed timestep for smooth culling)
    if (frameState.scene && frameState.camera) {
      updateBVHSystem();
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
function runECSSystems(deltaTime: number, isPlaying: boolean = false, scene?: THREE.Scene) {
  // Update input state BEFORE any systems run
  const inputManager = InputManager.getInstance();
  inputManager.update();

  // Character Controller system is now handled by CharacterControllerPhysicsSystem component
  // which runs inside the Physics context to access Rapier world (see ViewportPanel)

  // Run transform system - updates Three.js objects from ECS Transform components
  transformSystem();

  // Run material system - updates Three.js materials from ECS Material components
  materialSystem.update();

  // Run instance system - updates InstancedMesh objects from ECS Instanced components
  updateInstanceSystem();

  // Run camera system - updates Three.js cameras from ECS Camera components
  cameraSystem();

  // Run light system - processes light component updates
  lightSystem(deltaTime);

  // Run animation system - updates animation playback and applies keyframes
  if (scene) {
    animationSystem(scene, deltaTime, isPlaying);
  }

  // Run script system - executes user scripts with entity context
  // Note: updateScriptSystem is async but we fire-and-forget here to avoid blocking the render loop
  updateScriptSystem(deltaTime * 1000, isPlaying).catch((error) => {
    logger.error('Script system error', { error });
  });

  // Run sound system - handles autoplay and sound updates during play mode
  soundSystem(deltaTime, isPlaying);

  // Run registered game systems from extension points
  runRegisteredSystems(deltaTime);

  // Clear input frame state AFTER all systems have run
  inputManager.clearFrameState();
}
