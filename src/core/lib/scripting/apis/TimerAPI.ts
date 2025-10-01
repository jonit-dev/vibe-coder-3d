/**
 * Timer API implementation
 * Provides scripts with setTimeout/setInterval and frame-waiting utilities
 */

import { scheduler } from '../adapters/scheduler';
import type { ITimerAPI } from '../ScriptAPI';

/**
 * Creates a timer API for scripts
 */
export const createTimerAPI = (entityId: number): ITimerAPI => {
  return {
    setTimeout: (callback: () => void, ms: number): number => {
      return scheduler.setTimeout(entityId, callback, ms);
    },

    clearTimeout: (id: number): void => {
      scheduler.clear(id);
    },

    setInterval: (callback: () => void, ms: number): number => {
      return scheduler.setInterval(entityId, callback, ms);
    },

    clearInterval: (id: number): void => {
      scheduler.clear(id);
    },

    nextTick: (): Promise<void> => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    },

    waitFrames: (count: number): Promise<void> => {
      return new Promise((resolve) => {
        let remaining = count;
        const tick = () => {
          remaining--;
          if (remaining <= 0) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      });
    },
  };
};

/**
 * Cleanup function to be called when script is destroyed
 */
export const cleanupTimerAPI = (entityId: number) => {
  scheduler.clearAllForEntity(entityId);
};
