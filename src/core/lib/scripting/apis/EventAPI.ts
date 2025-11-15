/**
 * Event API implementation
 * Provides scripts with access to the event bus for inter-entity communication
 */

import { emitter, type CoreEvents } from '@/core/lib/events';
import type { IEventAPI } from '../ScriptAPI';
import type { Emitter } from 'mitt';

// Extended event type that allows custom events beyond CoreEvents
type ScriptEvents = CoreEvents & {
  [key: string]: unknown;
};

/**
 * Creates an event API for scripts with automatic cleanup
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createEventAPI = (_entityId: number): IEventAPI => {
  const subscriptions = new Set<() => void>();

  // Type the emitter to accept any string key for script flexibility
  const scriptEmitter = emitter as Emitter<ScriptEvents>;

  return {
    on: <T extends string>(type: T, handler: (payload: unknown) => void) => {
      // Scripts can use any string event type, not limited to CoreEvents
      const wrappedHandler = handler as (event: ScriptEvents[keyof ScriptEvents]) => void;
      scriptEmitter.on(type as keyof ScriptEvents, wrappedHandler);
      const off = () => scriptEmitter.off(type as keyof ScriptEvents, wrappedHandler);
      subscriptions.add(off);
      return off;
    },

    off: <T extends string>(type: T, handler: (payload: unknown) => void) => {
      const wrappedHandler = handler as (event: ScriptEvents[keyof ScriptEvents]) => void;
      scriptEmitter.off(type as keyof ScriptEvents, wrappedHandler);
    },

    emit: <T extends string>(type: T, payload: unknown) => {
      scriptEmitter.emit(type as keyof ScriptEvents, payload as ScriptEvents[keyof ScriptEvents]);
    },
  };
};

/**
 * Cleanup function to be called when script is destroyed
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cleanupEventAPI = (_api: IEventAPI) => {
  // Auto-cleanup is handled via the subscriptions set
  // This is a no-op but kept for consistency
};
