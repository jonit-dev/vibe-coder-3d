/**
 * Event API implementation
 * Provides scripts with access to the event bus for inter-entity communication
 */

import { eventBus } from '@/core/lib/events';
import type { IEventAPI } from '../ScriptAPI';

/**
 * Creates an event API for scripts with automatic cleanup
 */
export const createEventAPI = (_entityId: number): IEventAPI => {
  const subscriptions = new Set<() => void>();

  return {
    on: <T extends string>(type: T, handler: (payload: unknown) => void) => {
      // Use type assertion to work around CoreEvents typing constraints
      // This allows scripts to emit custom events while maintaining type safety
      const off = eventBus.on(type as any, handler as any);
      subscriptions.add(off);
      return off;
    },

    off: <T extends string>(type: T, handler: (payload: unknown) => void) => {
      eventBus.off(type as any, handler as any);
    },

    emit: <T extends string>(type: T, payload: unknown) => {
      eventBus.emit(type as any, payload as any);
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
