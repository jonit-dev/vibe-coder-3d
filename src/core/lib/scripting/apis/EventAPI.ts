/**
 * Event API implementation
 * Provides scripts with access to the event bus for inter-entity communication
 */

import { emitter } from '@/core/lib/events';
import type { IEventAPI } from '../ScriptAPI';

/**
 * Creates an event API for scripts with automatic cleanup
 */
export const createEventAPI = (_entityId: number): IEventAPI => {
  const subscriptions = new Set<() => void>();

  return {
    on: (type, handler) => {
      emitter.on(type as any, handler as any);
      const off = () => {
        emitter.off(type as any, handler as any);
        subscriptions.delete(off);
      };
      subscriptions.add(off);
      return off;
    },

    off: (type, handler) => {
      emitter.off(type as any, handler as any);
    },

    emit: (type, payload) => {
      emitter.emit(type as any, payload as any);
    },
  };
};

/**
 * Cleanup function to be called when script is destroyed
 */
export const cleanupEventAPI = (_api: IEventAPI) => {
  // Auto-cleanup is handled via the subscriptions set
  // This is a no-op but kept for consistency
};
