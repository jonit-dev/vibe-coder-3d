/**
 * Factory for creating scoped game loop stores
 * Enables multiple isolated engine instances with independent loop controls
 */
import { create, StoreApi, UseBoundStore } from 'zustand';

// Type definition for the game loop state
export interface IGameLoopState {
  // State
  isRunning: boolean;
  isPaused: boolean;
  fps: number;
  frameCount: number;
  deltaTime: number;
  interpolationAlpha: number;
  maxFPS: number;
  targetFrameTime: number;

  // Actions
  startLoop: () => void;
  pauseLoop: () => void;
  resumeLoop: () => void;
  stopLoop: () => void;
  setInterpolationAlpha: (alpha: number) => void;
  setMaxFPS: (fps: number) => void;

  // Internal - called by EngineLoop component
  update: (delta: number) => void;
}

export type IGameLoopStore = UseBoundStore<StoreApi<IGameLoopState>>;

export interface ILoopStoreOptions {
  maxFPS?: number;
  enablePerformanceTracking?: boolean;
}

/**
 * Creates a new isolated game loop store instance
 * Each instance maintains independent loop state and controls
 */
export function createLoopStore(options: ILoopStoreOptions = {}): IGameLoopStore {
  const { maxFPS = 0, enablePerformanceTracking = false } = options;

  return create<IGameLoopState>((set, get) => ({
    // Initial state
    isRunning: false,
    isPaused: false,
    fps: 0,
    frameCount: 0,
    deltaTime: 0,
    interpolationAlpha: 0,
    maxFPS,
    targetFrameTime: maxFPS > 0 ? 1000 / maxFPS : 0,

    // Start the game loop
    startLoop: () => {
      const state = get();

      // Don't start if already running
      if (state.isRunning) return;

      if (enablePerformanceTracking) {
        console.debug('[LoopStore] Starting loop');
      }

      set({
        isRunning: true,
        isPaused: false,
        frameCount: 0,
      });
    },

    // Pause the game loop
    pauseLoop: () => {
      const state = get();

      // Don't pause if not running or already paused
      if (!state.isRunning || state.isPaused) return;

      if (enablePerformanceTracking) {
        console.debug('[LoopStore] Pausing loop');
      }

      set({ isPaused: true });
    },

    // Resume the game loop
    resumeLoop: () => {
      const state = get();

      // Don't resume if not running or not paused
      if (!state.isRunning || !state.isPaused) return;

      if (enablePerformanceTracking) {
        console.debug('[LoopStore] Resuming loop');
      }

      set({ isPaused: false });
    },

    // Stop the game loop
    stopLoop: () => {
      const state = get();

      // Don't stop if not running
      if (!state.isRunning) return;

      if (enablePerformanceTracking) {
        console.debug('[LoopStore] Stopping loop');
      }

      set({
        isRunning: false,
        isPaused: false,
      });
    },

    // Set the interpolation alpha for smooth rendering
    setInterpolationAlpha: (alpha: number) => {
      set({ interpolationAlpha: Math.max(0, Math.min(1, alpha)) });
    },

    // Set maximum frame rate (0 = unlimited)
    setMaxFPS: (fps: number) => {
      if (enablePerformanceTracking) {
        console.debug(`[LoopStore] Setting max FPS to ${fps}`);
      }

      set({
        maxFPS: fps,
        targetFrameTime: fps > 0 ? 1000 / fps : 0,
      });
    },

    // Update called by EngineLoop on each frame
    update: (delta: number) => {
      const state = get();

      // Skip updates if not running or paused
      if (!state.isRunning || state.isPaused) return;

      // Calculate FPS (smoothed)
      const currentFps = 1 / delta;
      const smoothedFps = Math.round(state.fps * 0.95 + currentFps * 0.05);

      // Update state
      set({
        deltaTime: delta,
        frameCount: state.frameCount + 1,
        fps: smoothedFps,
      });
    },
  }));
}
