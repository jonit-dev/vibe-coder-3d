// ECS Event System - Reactive updates for better synchronization

// Event types for ECS changes
export interface IECSEvents {
  'entity:created': { entityId: number };
  'entity:destroyed': { entityId: number };
  'component:added': { entityId: number; componentName: string };
  'component:removed': { entityId: number; componentName: string };
  'component:updated': { entityId: number; componentName: string; data: any };
  'transform:updated': {
    entityId: number;
    transform: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
  };
  'material:updated': { entityId: number; color: [number, number, number] };
  'physics:updated': { entityId: number; bodyId: number };
}

export type ECSEventName = keyof IECSEvents;
export type ECSEventData<T extends ECSEventName> = IECSEvents[T];

// Simple browser-compatible event emitter
class SimpleEventEmitter {
  private listeners: Map<string, Array<(data?: any) => void>> = new Map();

  on(event: string, listener: (data?: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data?: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }
}

// Global ECS event emitter
export const ecsEvents = new SimpleEventEmitter();

// Type-safe event emitting
export function emitECSEvent<T extends ECSEventName>(eventName: T, data: ECSEventData<T>): void {
  ecsEvents.emit(eventName, data);
}

// Type-safe event listening
export function onECSEvent<T extends ECSEventName>(
  eventName: T,
  listener: (data: ECSEventData<T>) => void,
): () => void {
  ecsEvents.on(eventName, listener);
  return () => ecsEvents.off(eventName, listener);
}

// Batch event emission for performance
export class ECSEventBatch {
  private events: Array<{ name: ECSEventName; data: any }> = [];

  add<T extends ECSEventName>(eventName: T, data: ECSEventData<T>): void {
    this.events.push({ name: eventName, data });
  }

  emit(): void {
    this.events.forEach(({ name, data }) => {
      ecsEvents.emit(name, data);
    });
    this.events.length = 0;
  }

  clear(): void {
    this.events.length = 0;
  }
}

// Singleton batch for frame-based batching
export const frameEventBatch = new ECSEventBatch();

// Utility to batch events and emit at end of frame
export function batchECSEvents(fn: () => void): void {
  fn();
  frameEventBatch.emit();
}
