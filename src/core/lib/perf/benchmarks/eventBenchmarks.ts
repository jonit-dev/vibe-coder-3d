/**
 * Event System Benchmarks
 * Tests performance of event emission with and without batching
 */

import mitt from 'mitt';
import { BatchedEventEmitter } from '../BatchedEventEmitter';
import { Profiler } from '../Profiler';

interface ITestEvents extends Record<string | symbol, unknown> {
  'test:event1': { data: number };
  'test:event2': { data: string };
  'test:event3': { data: { complex: object } };
  'test:rapid': { id: number; timestamp: number };
}

// Traditional mitt emitter
function createMittEmitter(): any {
  return mitt<ITestEvents>();
}

// Batched event emitter
function createBatchedEmitter(): BatchedEventEmitter<ITestEvents> {
  return new BatchedEventEmitter<ITestEvents>({
    coalesce: true,
    maxBufferSize: 1000,
    useAnimationFrame: false, // Disable for benchmarking
  });
}

// Benchmark event emission with mitt
export function benchmarkMittEmission(eventCount: number, handlerCount: number = 10): void {
  const emitter = createMittEmitter();
  const handlers: Array<() => void> = [];

  // Set up handlers
  for (let i = 0; i < handlerCount; i++) {
    handlers.push(emitter.on('test:rapid', () => {}));
  }

  Profiler.time(`mittEmission_${eventCount}events_${handlerCount}handlers`, () => {
    for (let i = 0; i < eventCount; i++) {
      emitter.emit('test:rapid', { id: i, timestamp: Date.now() });
    }
  });

  // Cleanup
  handlers.forEach((unsubscribe) => unsubscribe());
}

// Benchmark event emission with batched emitter
export function benchmarkBatchedEmission(eventCount: number, handlerCount: number = 10): void {
  const emitter = createBatchedEmitter();
  const handlers: Array<() => void> = [];

  // Set up handlers
  for (let i = 0; i < handlerCount; i++) {
    handlers.push(emitter.on('test:rapid', () => {}));
  }

  Profiler.time(`batchedEmission_${eventCount}events_${handlerCount}handlers`, () => {
    for (let i = 0; i < eventCount; i++) {
      emitter.emit('test:rapid', { id: i, timestamp: Date.now() });
    }
    // Force flush
    emitter.flush();
  });

  // Cleanup
  handlers.forEach((unsubscribe) => unsubscribe());
}

// Benchmark event emission with identical events (coalescing test)
export function benchmarkEventCoalescing(eventCount: number): void {
  const batchedEmitter = createBatchedEmitter();

  // Handler that just counts events
  let receivedCount = 0;
  batchedEmitter.on('test:rapid', () => {
    receivedCount++;
  });

  Profiler.time(`batchedCoalescing_${eventCount}events`, () => {
    // Emit many identical events
    for (let i = 0; i < eventCount; i++) {
      batchedEmitter.emit('test:rapid', { id: 1, timestamp: Date.now() });
    }
    batchedEmitter.flush();
  });

}

// Benchmark handler registration overhead
export function benchmarkHandlerRegistration(handlerCount: number = 1000): void {
  Profiler.time(`mittHandlerRegistration_${handlerCount}`, () => {
    const emitter = createMittEmitter();
    const handlers: Array<() => void> = [];

    for (let i = 0; i < handlerCount; i++) {
      handlers.push(emitter.on('test:event1', () => {}));
    }

    handlers.forEach((unsubscribe) => unsubscribe());
  });

  Profiler.time(`batchedHandlerRegistration_${handlerCount}`, () => {
    const emitter = createBatchedEmitter();
    const handlers: Array<() => void> = [];

    for (let i = 0; i < handlerCount; i++) {
      handlers.push(emitter.on('test:event1', () => {}));
    }

    handlers.forEach((unsubscribe) => unsubscribe());
  });
}

// Benchmark mixed event types
export function benchmarkMixedEvents(eventCount: number): void {
  const batchedEmitter = createBatchedEmitter();

  let event1Count = 0;
  let event2Count = 0;
  let event3Count = 0;

  batchedEmitter.on('test:event1', () => {
    event1Count++;
  });
  batchedEmitter.on('test:event2', () => {
    event2Count++;
  });
  batchedEmitter.on('test:event3', () => {
    event3Count++;
  });

  Profiler.time(`mixedEvents_${eventCount}`, () => {
    for (let i = 0; i < eventCount; i++) {
      switch (i % 3) {
        case 0:
          batchedEmitter.emit('test:event1', { data: i });
          break;
        case 1:
          batchedEmitter.emit('test:event2', { data: `event${i}` });
          break;
        case 2:
          batchedEmitter.emit('test:event3', { data: { complex: { id: i, nested: true } } });
          break;
      }
    }
    batchedEmitter.flush();
  });

}

// Run all event benchmarks
export function runEventBenchmarks(): void {

  const testSizes = [100, 1000, 10000];
  const handlerCounts = [1, 10, 100];

  testSizes.forEach((eventCount) => {
    handlerCounts.forEach((handlerCount) => {
      benchmarkMittEmission(eventCount, handlerCount);
      benchmarkBatchedEmission(eventCount, handlerCount);
    });
  });

  // Coalescing test
  benchmarkEventCoalescing(10000);

  // Handler registration test
  benchmarkHandlerRegistration(1000);

  // Mixed events test
  benchmarkMixedEvents(3000);

}

// Auto-run benchmarks in development
if (process.env.NODE_ENV === 'development') {
  // Delay to avoid blocking initial load
  setTimeout(() => {
    runEventBenchmarks();
  }, 2000);
}
