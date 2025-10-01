/**
 * TimerAPI Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimerAPI, cleanupTimerAPI } from '../TimerAPI';
import { scheduler } from '../../adapters/scheduler';

describe('TimerAPI', () => {
  const entityId = 1;
  let timerAPI: ReturnType<typeof createTimerAPI>;

  beforeEach(() => {
    timerAPI = createTimerAPI(entityId);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTimerAPI(entityId);
    vi.restoreAllMocks();
  });

  it('should create a timer API instance', () => {
    expect(timerAPI).toBeDefined();
    expect(timerAPI.setTimeout).toBeInstanceOf(Function);
    expect(timerAPI.clearTimeout).toBeInstanceOf(Function);
    expect(timerAPI.setInterval).toBeInstanceOf(Function);
    expect(timerAPI.clearInterval).toBeInstanceOf(Function);
    expect(timerAPI.nextTick).toBeInstanceOf(Function);
    expect(timerAPI.waitFrames).toBeInstanceOf(Function);
  });

  it('should schedule a timeout', () => {
    const callback = vi.fn();
    const id = timerAPI.setTimeout(callback, 1000);

    expect(id).toBeGreaterThan(0);
    expect(callback).not.toHaveBeenCalled();

    // Advance time and update scheduler
    vi.advanceTimersByTime(1000);
    scheduler.update();

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should clear a timeout', () => {
    const callback = vi.fn();
    const id = timerAPI.setTimeout(callback, 1000);

    timerAPI.clearTimeout(id);

    vi.advanceTimersByTime(1000);
    scheduler.update();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should schedule an interval', () => {
    const callback = vi.fn();
    const id = timerAPI.setInterval(callback, 100);

    expect(id).toBeGreaterThan(0);
    expect(callback).not.toHaveBeenCalled();

    // First interval
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(1);

    // Second interval
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(2);

    // Third interval
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback).toHaveBeenCalledTimes(3);

    timerAPI.clearInterval(id);
  });

  it('should clear an interval', () => {
    const callback = vi.fn();
    const id = timerAPI.setInterval(callback, 100);

    // First call
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback).toHaveBeenCalledOnce();

    // Clear interval
    timerAPI.clearInterval(id);

    // Should not be called again
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should wait for next tick', async () => {
    const callback = vi.fn();

    timerAPI.nextTick().then(callback);

    expect(callback).not.toHaveBeenCalled();

    // Trigger RAF
    await vi.runAllTimersAsync();

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should wait for multiple frames', async () => {
    const callback = vi.fn();

    timerAPI.waitFrames(3).then(callback);

    expect(callback).not.toHaveBeenCalled();

    // Should require 3 RAF calls
    await vi.runAllTimersAsync();

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should cleanup all timers for entity', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    timerAPI.setTimeout(callback1, 1000);
    timerAPI.setInterval(callback2, 100);
    timerAPI.setTimeout(callback3, 500);

    // Cleanup
    cleanupTimerAPI(entityId);

    // None should be called
    vi.advanceTimersByTime(1000);
    scheduler.update();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();
  });

  it('should handle multiple timers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    timerAPI.setTimeout(callback1, 100);
    timerAPI.setTimeout(callback2, 200);
    timerAPI.setTimeout(callback3, 300);

    // First timer
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback1).toHaveBeenCalledOnce();
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();

    // Second timer
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback2).toHaveBeenCalledOnce();
    expect(callback3).not.toHaveBeenCalled();

    // Third timer
    vi.advanceTimersByTime(100);
    scheduler.update();
    expect(callback3).toHaveBeenCalledOnce();
  });
});
