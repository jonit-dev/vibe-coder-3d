/**
 * Batched Event Emitter for high-frequency events
 * Batches events and flushes them on the next animation frame to reduce redundant computations
 */

export interface IBatchedEventEmitter<TEvents extends Record<string, unknown>> {
  emit<K extends keyof TEvents>(type: K, data: TEvents[K]): void;
  on<K extends keyof TEvents>(type: K, handler: (event: TEvents[K]) => void): () => void;
  off<K extends keyof TEvents>(type: K, handler: (event: TEvents[K]) => void): void;
  flush(): void;
  clear(): void;
}

export interface IBatchedEventEmitterOptions {
  /** Whether to coalesce identical events (default: true) */
  coalesce?: boolean;
  /** Maximum events to buffer before auto-flush (default: 1000) */
  maxBufferSize?: number;
  /** Whether to use requestAnimationFrame for flushing (default: true) */
  useAnimationFrame?: boolean;
}

export class BatchedEventEmitter<TEvents extends Record<string, unknown>>
  implements IBatchedEventEmitter<TEvents>
{
  private handlers = new Map<keyof TEvents, Set<(event: TEvents[keyof TEvents]) => void>>();
  private pendingEvents = new Map<keyof TEvents, Set<TEvents[keyof TEvents]>>();
  private animationFrameId: number | null = null;
  private options: Required<IBatchedEventEmitterOptions>;

  constructor(options: IBatchedEventEmitterOptions = {}) {
    this.options = {
      coalesce: options.coalesce ?? true,
      maxBufferSize: options.maxBufferSize ?? 1000,
      useAnimationFrame: options.useAnimationFrame ?? true,
    };
  }

  emit<K extends keyof TEvents>(type: K, data: TEvents[K]): void {
    // Initialize sets if needed
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    if (!this.pendingEvents.has(type)) {
      this.pendingEvents.set(type, new Set());
    }

    const eventSet = this.pendingEvents.get(type)!;

    // Coalesce identical events if enabled
    if (this.options.coalesce) {
      // For objects, we do a shallow comparison
      const shouldAdd = Array.from(eventSet).every(
        (existing) => JSON.stringify(existing) !== JSON.stringify(data),
      );

      if (!shouldAdd) {
        return; // Event already pending, skip
      }
    }

    // Add event to pending
    eventSet.add(data);

    // Auto-flush if buffer is full
    const totalPending = Array.from(this.pendingEvents.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );

    if (totalPending >= this.options.maxBufferSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.animationFrameId && this.options.useAnimationFrame) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.animationFrameId = null;
        this.flush();
      });
    }
  }

  on<K extends keyof TEvents>(type: K, handler: (event: TEvents[K]) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as (event: TEvents[keyof TEvents]) => void);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
    };
  }

  off<K extends keyof TEvents>(type: K, handler: (event: TEvents[K]) => void): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as (event: TEvents[keyof TEvents]) => void);

      // Clean up empty handler sets
      if (handlers.size === 0) {
        this.handlers.delete(type);
        this.pendingEvents.delete(type);
      }
    }
  }

  flush(): void {
    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Process all pending events
    for (const [type, eventSet] of this.pendingEvents.entries()) {
      const handlers = this.handlers.get(type);
      if (!handlers || handlers.size === 0) continue;

      // Emit each unique event to all handlers
      for (const event of eventSet) {
        try {
          for (const handler of handlers) {
            handler(event);
          }
        } catch (error) {
          console.error(`Error in batched event handler for ${String(type)}:`, error);
        }
      }
    }

    // Clear pending events
    this.pendingEvents.clear();
  }

  clear(): void {
    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear all handlers and pending events
    this.handlers.clear();
    this.pendingEvents.clear();
  }

  // Get stats for monitoring
  getStats() {
    const handlerCounts = new Map<keyof TEvents, number>();
    for (const [type, handlers] of this.handlers.entries()) {
      handlerCounts.set(type, handlers.size);
    }

    const pendingCounts = new Map<keyof TEvents, number>();
    for (const [type, events] of this.pendingEvents.entries()) {
      pendingCounts.set(type, events.size);
    }

    return {
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0),
      totalPendingEvents: Array.from(this.pendingEvents.values()).reduce(
        (sum, set) => sum + set.size,
        0,
      ),
      handlerCounts,
      pendingCounts,
      isScheduled: this.animationFrameId !== null,
    };
  }
}
