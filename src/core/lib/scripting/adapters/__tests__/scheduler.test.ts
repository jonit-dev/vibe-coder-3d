/**
 * Scheduler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduler } from '../scheduler';

describe('Scheduler', () => {
  const entityId = 1;

  beforeEach(() => {
    // Clear all timers before each test
    scheduler.clearAllForEntity(entityId);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should schedule and execute a timeout', () => {
    const callback = vi.fn();
    const id = scheduler.setTimeout(entityId, callback, 100);

    expect(id).toBeGreaterThan(0);
    expect(callback).not.toHaveBeenCalled();

    // Advance time
    vi.advanceTimersByTime(100);
    scheduler.update();

    expect(callback).toHaveBeenCalledOnce();

    // Should not be called again
    scheduler.update();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should schedule and execute an interval', () => {
    const callback = vi.fn();
    const id = scheduler.setInterval(entityId, callback, 50);

    expect(id).toBeGreaterThan(0);

    // First execution
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(1);

    // Second execution
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(2);

    // Third execution
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(3);

    scheduler.clear(id);
  });

  it('should clear a timeout before execution', () => {
    const callback = vi.fn();
    const id = scheduler.setTimeout(entityId, callback, 100);

    scheduler.clear(id);

    vi.advanceTimersByTime(100);
    scheduler.update();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear an interval', () => {
    const callback = vi.fn();
    const id = scheduler.setInterval(entityId, callback, 50);

    // First execution
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback).toHaveBeenCalledOnce();

    // Clear interval
    scheduler.clear(id);

    // Should not execute again
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should clear all timers for an entity', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    scheduler.setTimeout(entityId, callback1, 50);
    scheduler.setInterval(entityId, callback2, 50);
    scheduler.setTimeout(entityId, callback3, 100);

    // Clear all for entity
    scheduler.clearAllForEntity(entityId);

    vi.advanceTimersByTime(100);
    scheduler.update();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();
  });

  it('should not clear timers from other entities', () => {
    const entity1Callback = vi.fn();
    const entity2Callback = vi.fn();

    scheduler.setTimeout(1, entity1Callback, 50);
    scheduler.setTimeout(2, entity2Callback, 50);

    // Clear only entity 1
    scheduler.clearAllForEntity(1);

    vi.advanceTimersByTime(50);
    scheduler.update();

    expect(entity1Callback).not.toHaveBeenCalled();
    expect(entity2Callback).toHaveBeenCalledOnce();
  });

  it('should handle multiple timers with different delays', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    scheduler.setTimeout(entityId, callback1, 50);
    scheduler.setTimeout(entityId, callback2, 100);
    scheduler.setTimeout(entityId, callback3, 150);

    // After 50ms
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback1).toHaveBeenCalledOnce();
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();

    // After 100ms
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback2).toHaveBeenCalledOnce();
    expect(callback3).not.toHaveBeenCalled();

    // After 150ms
    vi.advanceTimersByTime(50);
    scheduler.update();
    expect(callback3).toHaveBeenCalledOnce();
  });

  it('should handle errors in timer callbacks', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Timer error');
    });
    const normalCallback = vi.fn();

    scheduler.setTimeout(entityId, errorCallback, 50);
    scheduler.setTimeout(entityId, normalCallback, 50);

    // Should not throw and should execute both callbacks
    vi.advanceTimersByTime(50);
    expect(() => scheduler.update()).not.toThrow();

    expect(errorCallback).toHaveBeenCalledOnce();
    expect(normalCallback).toHaveBeenCalledOnce();
  });

  it('should respect frame budget (conceptual test)', () => {
    const callbacks: ReturnType<typeof vi.fn>[] = [];

    // Schedule many timers that should all execute
    for (let i = 0; i < 100; i++) {
      const cb = vi.fn();
      callbacks.push(cb);
      scheduler.setTimeout(entityId, cb, 50);
    }

    vi.advanceTimersByTime(50);

    // First update might not execute all due to budget
    scheduler.update();

    // But eventually all should execute
    for (let i = 0; i < 10; i++) {
      scheduler.update();
    }

    // Check that all callbacks were eventually called
    const executedCount = callbacks.filter((cb) => cb.mock.calls.length > 0).length;
    expect(executedCount).toBe(100);
  });

  it('should generate unique timer IDs', () => {
    const id1 = scheduler.setTimeout(entityId, vi.fn(), 100);
    const id2 = scheduler.setTimeout(entityId, vi.fn(), 100);
    const id3 = scheduler.setTimeout(entityId, vi.fn(), 100);

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should handle immediate execution (0ms delay)', () => {
    const callback = vi.fn();
    scheduler.setTimeout(entityId, callback, 0);

    scheduler.update();

    expect(callback).toHaveBeenCalledOnce();
  });
});
