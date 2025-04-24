// Game Loop Store
// Manages the core loop state using Zustand
import { create } from 'zustand';

// Type definition for the game loop state
type GameLoopState = {
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
};

// Create and export the game loop store
export const useGameLoop = create<GameLoopState>((set, get) => ({
  // Initial state
  isRunning: false,
  isPaused: false,
  fps: 0,
  frameCount: 0,
  deltaTime: 0,
  interpolationAlpha: 0,
  maxFPS: 0, // 0 means no limit
  targetFrameTime: 0,

  // Start the game loop
  startLoop: () => {
    const state = get();

    // Don't start if already running
    if (state.isRunning) return;

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

    set({ isPaused: true });
  },

  // Resume the game loop
  resumeLoop: () => {
    const state = get();

    // Don't resume if not running or not paused
    if (!state.isRunning || !state.isPaused) return;

    set({ isPaused: false });
  },

  // Stop the game loop
  stopLoop: () => {
    const state = get();

    // Don't stop if not running
    if (!state.isRunning) return;

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
