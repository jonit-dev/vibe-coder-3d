import mitt, { Emitter } from 'mitt';
import { BatchedEventEmitter } from './perf/BatchedEventEmitter';

// Example event types (expand as needed)
export type CoreEvents = {
  'physics:collision': { entityA: number; entityB: number; point?: number[]; position?: any };
  'asset:loaded': { url?: string; assetId?: string; asset: unknown };
  'scene:loaded': { sceneName: string };
  'input:actionPressed': { action: string };
  'input:actionReleased': { action: string };
  'game:playerDamaged': { damage: number };
  'game:scoreChanged': { newScore: number };
  'game:itemCollected': { itemType: string; entity: number };
  'ui:buttonClicked': { buttonId: string };

  // Sound events
  'sound:autoplay': { entityId: number; soundData: any };

  // Entity events
  'entity:created': { entityId: number; componentId?: string };
  'entity:destroyed': { entityId: number };

  // Component system events
  'component:added': { entityId: number; componentId: string; data: any };
  'component:removed': { entityId: number; componentId: string };
  'component:updated': { entityId: number; componentId: string; data: any };

  // Animation events
  'animation:play': { entityId: number; clipId: string; fade?: number; loop?: boolean };
  'animation:pause': { entityId: number };
  'animation:stop': { entityId: number; fade?: number };
  'animation:ended': { entityId: number; clipId: string };
  'animation:loop': { entityId: number; clipId: string; loopCount: number };
  'animation:marker': { entityId: number; markerName: string; time: number; params?: Record<string, unknown> };
};

// Legacy mitt-based emitter for backward compatibility
export const emitter: Emitter<CoreEvents> = mitt<CoreEvents>();

// Batched event emitter for high-frequency events
const batchedEmitter = new BatchedEventEmitter<CoreEvents>({
  coalesce: true,
  maxBufferSize: 1000,
  useAnimationFrame: true,
});

// Configuration flag to enable/disable batching
export const enableEventBatching = () => {
  // This is a simple flag - in a real implementation you might want more sophisticated control
  return (
    process.env.NODE_ENV === 'production' || localStorage.getItem('enableEventBatching') === 'true'
  );
};

// Enhanced event bus that can use batching for high-frequency events
export function emit<Key extends keyof CoreEvents>(type: Key, event: CoreEvents[Key]) {
  // Always emit to legacy system for backward compatibility
  emitter.emit(type, event);

  // Also emit to batched system if batching is enabled
  if (enableEventBatching()) {
    batchedEmitter.emit(type, event);
  }
}

export function on<Key extends keyof CoreEvents>(
  type: Key,
  handler: (event: CoreEvents[Key]) => void,
) {
  const wrappedHandler = (event: CoreEvents[Key]) => {
    try {
      handler(event);
    } catch (error) {
      console.error(`Error in event handler for ${type}:`, error);
    }
  };

  // Always register with legacy system for backward compatibility
  emitter.on(type, wrappedHandler);

  // Also register with batched system if batching is enabled
  if (enableEventBatching()) {
    return batchedEmitter.on(type, wrappedHandler);
  }

  return () => emitter.off(type, wrappedHandler);
}

export function off<Key extends keyof CoreEvents>(
  type: Key,
  handler: (event: CoreEvents[Key]) => void,
) {
  // Always unregister from legacy system
  emitter.off(type, handler);

  // Also unregister from batched system if batching is enabled
  if (enableEventBatching()) {
    batchedEmitter.off(type, handler);
  }
}

// Flush any pending batched events immediately
export function flushBatchedEvents() {
  if (enableEventBatching()) {
    batchedEmitter.flush();
  }
}

// Get stats about batched events for debugging
export function getBatchedEventStats() {
  if (enableEventBatching()) {
    return batchedEmitter.getStats();
  }
  return null;
}

// Clear all event handlers
export function clearAllEvents() {
  emitter.all.clear();
  if (enableEventBatching()) {
    batchedEmitter.clear();
  }
}

export const eventBus = {
  emit,
  on,
  off,
  flushBatchedEvents,
  getBatchedEventStats,
  clearAllEvents,
};
