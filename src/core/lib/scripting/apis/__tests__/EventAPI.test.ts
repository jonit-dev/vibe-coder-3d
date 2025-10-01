/**
 * EventAPI Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEventAPI } from '../EventAPI';
import { emitter } from '@/core/lib/events';

describe('EventAPI', () => {
  const entityId = 1;
  let eventAPI: ReturnType<typeof createEventAPI>;

  beforeEach(() => {
    eventAPI = createEventAPI(entityId);
  });

  afterEach(() => {
    // Clean up all event listeners
    emitter.all.clear();
  });

  it('should create an event API instance', () => {
    expect(eventAPI).toBeDefined();
    expect(eventAPI.on).toBeInstanceOf(Function);
    expect(eventAPI.off).toBeInstanceOf(Function);
    expect(eventAPI.emit).toBeInstanceOf(Function);
  });

  it('should subscribe to events', () => {
    const handler = vi.fn();
    const unsubscribe = eventAPI.on('test:event', handler);

    expect(unsubscribe).toBeInstanceOf(Function);

    // Emit event
    eventAPI.emit('test:event', { data: 'test' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should unsubscribe from events', () => {
    const handler = vi.fn();
    const unsubscribe = eventAPI.on('test:event', handler);

    // Emit event - should be called
    eventAPI.emit('test:event', { data: 'test1' });
    expect(handler).toHaveBeenCalledOnce();

    // Unsubscribe
    unsubscribe();

    // Emit event again - should not be called
    eventAPI.emit('test:event', { data: 'test2' });
    expect(handler).toHaveBeenCalledOnce(); // Still only once
  });

  it('should unsubscribe using off method', () => {
    const handler = vi.fn();
    eventAPI.on('test:event', handler);

    // Emit event - should be called
    eventAPI.emit('test:event', { data: 'test1' });
    expect(handler).toHaveBeenCalledOnce();

    // Unsubscribe using off
    eventAPI.off('test:event', handler);

    // Emit event again - should not be called
    eventAPI.emit('test:event', { data: 'test2' });
    expect(handler).toHaveBeenCalledOnce(); // Still only once
  });

  it('should handle multiple subscribers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventAPI.on('test:event', handler1);
    eventAPI.on('test:event', handler2);

    eventAPI.emit('test:event', { data: 'test' });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should handle multiple event types', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventAPI.on('event:one', handler1);
    eventAPI.on('event:two', handler2);

    eventAPI.emit('event:one', { data: '1' });
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).not.toHaveBeenCalled();

    eventAPI.emit('event:two', { data: '2' });
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should emit events with different payload types', () => {
    const handler = vi.fn();
    eventAPI.on('test:event', handler);

    // String payload
    eventAPI.emit('test:event', 'string');
    expect(handler).toHaveBeenCalledWith('string');

    // Number payload
    eventAPI.emit('test:event', 42);
    expect(handler).toHaveBeenCalledWith(42);

    // Object payload
    eventAPI.emit('test:event', { key: 'value' });
    expect(handler).toHaveBeenCalledWith({ key: 'value' });

    // Array payload
    eventAPI.emit('test:event', [1, 2, 3]);
    expect(handler).toHaveBeenCalledWith([1, 2, 3]);
  });
});
