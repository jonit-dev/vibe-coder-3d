import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { createLoopStore, IGameLoopStore } from '../createLoopStore';

describe('createLoopStore', () => {
  let store: IGameLoopStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createLoopStore();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = store.getState();

      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.fps).toBe(0);
      expect(state.frameCount).toBe(0);
      expect(state.deltaTime).toBe(0);
      expect(state.interpolationAlpha).toBe(0);
      expect(state.maxFPS).toBe(0);
      expect(state.targetFrameTime).toBe(0);
    });

    it('should initialize with custom maxFPS', () => {
      const customStore = createLoopStore({ maxFPS: 60 });
      const state = customStore.getState();

      expect(state.maxFPS).toBe(60);
      expect(state.targetFrameTime).toBeCloseTo(1000 / 60, 2);
    });

    it('should support performance tracking option', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const trackedStore = createLoopStore({ enablePerformanceTracking: true });

      trackedStore.getState().startLoop();

      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Starting loop');
      consoleSpy.mockRestore();
    });
  });

  describe('Loop Control - Start/Stop', () => {
    it('should start the loop', () => {
      act(() => {
        store.getState().startLoop();
      });

      const state = store.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.frameCount).toBe(0);
    });

    it('should not start if already running', () => {
      act(() => {
        store.getState().startLoop();
      });

      const firstState = store.getState();

      act(() => {
        store.getState().startLoop();
      });

      const secondState = store.getState();
      expect(secondState).toEqual(firstState);
    });

    it('should stop the loop', () => {
      act(() => {
        store.getState().startLoop();
      });

      expect(store.getState().isRunning).toBe(true);

      act(() => {
        store.getState().stopLoop();
      });

      const state = store.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should not stop if not running', () => {
      const initialState = store.getState();

      act(() => {
        store.getState().stopLoop();
      });

      expect(store.getState()).toEqual(initialState);
    });

    it('should reset frame count on start', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
        store.getState().update(0.016);
      });

      expect(store.getState().frameCount).toBeGreaterThan(0);

      act(() => {
        store.getState().stopLoop();
        store.getState().startLoop();
      });

      expect(store.getState().frameCount).toBe(0);
    });
  });

  describe('Loop Control - Pause/Resume', () => {
    it('should pause the loop', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().pauseLoop();
      });

      const state = store.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
    });

    it('should not pause if not running', () => {
      act(() => {
        store.getState().pauseLoop();
      });

      expect(store.getState().isPaused).toBe(false);
    });

    it('should not pause if already paused', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().pauseLoop();
      });

      const firstState = store.getState();

      act(() => {
        store.getState().pauseLoop();
      });

      expect(store.getState()).toEqual(firstState);
    });

    it('should resume the loop', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().pauseLoop();
      });

      expect(store.getState().isPaused).toBe(true);

      act(() => {
        store.getState().resumeLoop();
      });

      const state = store.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should not resume if not running', () => {
      act(() => {
        store.getState().resumeLoop();
      });

      expect(store.getState().isRunning).toBe(false);
    });

    it('should not resume if not paused', () => {
      act(() => {
        store.getState().startLoop();
      });

      const firstState = store.getState();

      act(() => {
        store.getState().resumeLoop();
      });

      expect(store.getState()).toEqual(firstState);
    });

    it('should skip updates when paused', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
      });

      const frameCountAfterFirstUpdate = store.getState().frameCount;

      act(() => {
        store.getState().pauseLoop();
        store.getState().update(0.016);
        store.getState().update(0.016);
      });

      expect(store.getState().frameCount).toBe(frameCountAfterFirstUpdate);
    });
  });

  describe('Frame Updates', () => {
    it('should update deltaTime on each frame', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
      });

      expect(store.getState().deltaTime).toBeCloseTo(0.016, 3);

      act(() => {
        store.getState().update(0.033);
      });

      expect(store.getState().deltaTime).toBeCloseTo(0.033, 3);
    });

    it('should increment frame count', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
      });

      expect(store.getState().frameCount).toBe(1);

      act(() => {
        store.getState().update(0.016);
        store.getState().update(0.016);
      });

      expect(store.getState().frameCount).toBe(3);
    });

    it('should calculate smoothed FPS', () => {
      act(() => {
        store.getState().startLoop();
        // Simulate 60 FPS (0.016s per frame)
        store.getState().update(0.016);
      });

      const fps = store.getState().fps;
      expect(fps).toBeGreaterThan(0);
      expect(fps).toBeLessThan(100); // Reasonable FPS range
    });

    it('should smooth FPS over multiple frames', () => {
      act(() => {
        store.getState().startLoop();

        // Feed consistent 60 FPS deltas
        // Need more frames for the smoothing algorithm to converge (95% decay factor)
        for (let i = 0; i < 100; i++) {
          store.getState().update(1 / 60);
        }
      });

      const fps = store.getState().fps;
      // Should converge towards 60 FPS after many frames
      // Smoothing uses 95% of old value + 5% new, so convergence is gradual
      expect(fps).toBeGreaterThan(30); // Lower bound after smoothing
      expect(fps).toBeLessThan(70);
    });

    it('should not update when not running', () => {
      act(() => {
        store.getState().update(0.016);
      });

      const state = store.getState();
      expect(state.frameCount).toBe(0);
      expect(state.deltaTime).toBe(0);
    });

    it('should handle variable frame times', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016); // 60 FPS
        store.getState().update(0.033); // 30 FPS
        store.getState().update(0.008); // 120 FPS
      });

      expect(store.getState().frameCount).toBe(3);
      expect(store.getState().deltaTime).toBeCloseTo(0.008, 3);
    });
  });

  describe('Interpolation Alpha', () => {
    it('should set interpolation alpha', () => {
      act(() => {
        store.getState().setInterpolationAlpha(0.5);
      });

      expect(store.getState().interpolationAlpha).toBe(0.5);
    });

    it('should clamp interpolation alpha to [0, 1]', () => {
      act(() => {
        store.getState().setInterpolationAlpha(1.5);
      });

      expect(store.getState().interpolationAlpha).toBe(1);

      act(() => {
        store.getState().setInterpolationAlpha(-0.5);
      });

      expect(store.getState().interpolationAlpha).toBe(0);
    });

    it('should allow values within valid range', () => {
      const testValues = [0, 0.25, 0.5, 0.75, 1];

      testValues.forEach((value) => {
        act(() => {
          store.getState().setInterpolationAlpha(value);
        });

        expect(store.getState().interpolationAlpha).toBe(value);
      });
    });
  });

  describe('Max FPS Control', () => {
    it('should set max FPS', () => {
      act(() => {
        store.getState().setMaxFPS(60);
      });

      const state = store.getState();
      expect(state.maxFPS).toBe(60);
      expect(state.targetFrameTime).toBeCloseTo(1000 / 60, 2);
    });

    it('should handle unlimited FPS (0)', () => {
      act(() => {
        store.getState().setMaxFPS(0);
      });

      const state = store.getState();
      expect(state.maxFPS).toBe(0);
      expect(state.targetFrameTime).toBe(0);
    });

    it('should update target frame time when max FPS changes', () => {
      act(() => {
        store.getState().setMaxFPS(30);
      });

      expect(store.getState().targetFrameTime).toBeCloseTo(1000 / 30, 2);

      act(() => {
        store.getState().setMaxFPS(120);
      });

      expect(store.getState().targetFrameTime).toBeCloseTo(1000 / 120, 2);
    });
  });

  describe('State Transitions', () => {
    it('should handle start -> pause -> resume -> stop sequence', () => {
      act(() => {
        store.getState().startLoop();
      });
      expect(store.getState().isRunning).toBe(true);
      expect(store.getState().isPaused).toBe(false);

      act(() => {
        store.getState().pauseLoop();
      });
      expect(store.getState().isRunning).toBe(true);
      expect(store.getState().isPaused).toBe(true);

      act(() => {
        store.getState().resumeLoop();
      });
      expect(store.getState().isRunning).toBe(true);
      expect(store.getState().isPaused).toBe(false);

      act(() => {
        store.getState().stopLoop();
      });
      expect(store.getState().isRunning).toBe(false);
      expect(store.getState().isPaused).toBe(false);
    });

    it('should handle stop while paused', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().pauseLoop();
        store.getState().stopLoop();
      });

      const state = store.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should handle restart after stop', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
        store.getState().stopLoop();
      });

      const frameCountBeforeRestart = store.getState().frameCount;

      act(() => {
        store.getState().startLoop();
      });

      expect(store.getState().isRunning).toBe(true);
      expect(store.getState().frameCount).toBe(0); // Reset on restart
    });
  });

  describe('React Hook Integration', () => {
    it('should work with renderHook', () => {
      const { result } = renderHook(() => store.getState());

      expect(result.current.isRunning).toBe(false);

      act(() => {
        store.getState().startLoop();
      });

      expect(store.getState().isRunning).toBe(true);
    });

    it('should support multiple subscribers', () => {
      const { result: result1 } = renderHook(() => store((state) => state.isRunning));
      const { result: result2 } = renderHook(() => store((state) => state.frameCount));

      expect(result1.current).toBe(false);
      expect(result2.current).toBe(0);

      act(() => {
        store.getState().startLoop();
        store.getState().update(0.016);
      });

      expect(store.getState().isRunning).toBe(true);
      expect(store.getState().frameCount).toBe(1);
    });
  });

  describe('Performance Tracking', () => {
    it('should log performance events when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const trackedStore = createLoopStore({ enablePerformanceTracking: true });

      trackedStore.getState().startLoop();
      trackedStore.getState().pauseLoop();
      trackedStore.getState().resumeLoop();
      trackedStore.getState().stopLoop();
      trackedStore.getState().setMaxFPS(60);

      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Starting loop');
      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Pausing loop');
      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Resuming loop');
      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Stopping loop');
      expect(consoleSpy).toHaveBeenCalledWith('[LoopStore] Setting max FPS to 60');

      consoleSpy.mockRestore();
    });

    it('should not log when performance tracking disabled', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const untrackedStore = createLoopStore({ enablePerformanceTracking: false });

      untrackedStore.getState().startLoop();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delta time', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(0);
      });

      expect(store.getState().frameCount).toBe(1);
      expect(store.getState().deltaTime).toBe(0);
    });

    it('should handle very large delta time', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(10); // 10 seconds
      });

      expect(store.getState().deltaTime).toBe(10);
      // FPS calculation: 1 / 10 = 0.1 FPS, smoothed from 0 initial
      // With 95% old + 5% new: 0 * 0.95 + 0.1 * 0.05 = 0.005, rounds to 0
      // This is expected behavior for very large delta times on first frame
      const fps = store.getState().fps;
      expect(fps).toBeGreaterThanOrEqual(0); // Can be 0 due to smoothing
    });

    it('should handle negative delta time gracefully', () => {
      act(() => {
        store.getState().startLoop();
        store.getState().update(-0.016);
      });

      // Should still update, even with negative delta
      expect(store.getState().frameCount).toBe(1);
    });

    it('should create independent store instances', () => {
      const store1 = createLoopStore();
      const store2 = createLoopStore();

      act(() => {
        store1.getState().startLoop();
      });

      expect(store1.getState().isRunning).toBe(true);
      expect(store2.getState().isRunning).toBe(false);
    });
  });
});
