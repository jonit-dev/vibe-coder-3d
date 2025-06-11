import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { emit } from '@/core/lib/events';
import { useEvent } from '../useEvent';

describe('useEvent', () => {
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn();
    vi.clearAllMocks();
  });

  it('should register event handler on mount', () => {
    renderHook(() => useEvent('entity:created', mockHandler));

    emit('entity:created', { entityId: 1, componentId: 'Transform' });

    expect(mockHandler).toHaveBeenCalledWith({ entityId: 1, componentId: 'Transform' });
  });

  it('should unregister event handler on unmount', () => {
    const { unmount } = renderHook(() => useEvent('entity:created', mockHandler));

    unmount();

    emit('entity:created', { entityId: 1, componentId: 'Transform' });

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle multiple event types', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    renderHook(() => useEvent('entity:created', handler1));
    renderHook(() => useEvent('entity:destroyed', handler2));

    emit('entity:created', { entityId: 1, componentId: 'Transform' });
    emit('entity:destroyed', { entityId: 1 });

    expect(handler1).toHaveBeenCalledWith({ entityId: 1, componentId: 'Transform' });
    expect(handler2).toHaveBeenCalledWith({ entityId: 1 });
  });

  it('should handle component events', () => {
    const componentHandler = vi.fn();

    renderHook(() => useEvent('component:added', componentHandler));

    emit('component:added', { entityId: 1, componentId: 'MeshRenderer', data: {} });

    expect(componentHandler).toHaveBeenCalledWith({
      entityId: 1,
      componentId: 'MeshRenderer',
      data: {},
    });
  });

  it('should handle physics events', () => {
    const physicsHandler = vi.fn();

    renderHook(() => useEvent('physics:collision', physicsHandler));

    emit('physics:collision', { entityA: 1, entityB: 2, point: [0, 0, 0] });

    expect(physicsHandler).toHaveBeenCalledWith({
      entityA: 1,
      entityB: 2,
      point: [0, 0, 0],
    });
  });

  it('should handle asset events', () => {
    const assetHandler = vi.fn();

    renderHook(() => useEvent('asset:loaded', assetHandler));

    emit('asset:loaded', { assetId: 'test-asset', asset: {} });

    expect(assetHandler).toHaveBeenCalledWith({
      assetId: 'test-asset',
      asset: {},
    });
  });

  it('should re-register handler when dependencies change', () => {
    let currentHandler = vi.fn();

    const { rerender } = renderHook(({ handler }) => useEvent('entity:created', handler), {
      initialProps: { handler: currentHandler },
    });

    emit('entity:created', { entityId: 1, componentId: 'Transform' });
    expect(currentHandler).toHaveBeenCalledTimes(1);

    // Change handler
    const newHandler = vi.fn();
    currentHandler = newHandler;
    rerender({ handler: newHandler });

    emit('entity:created', { entityId: 2, componentId: 'Transform' });
    expect(newHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle error in event handler gracefully', () => {
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error');
    });

    renderHook(() => useEvent('entity:created', errorHandler));

    expect(() => {
      emit('entity:created', { entityId: 1, componentId: 'Transform' });
    }).not.toThrow();

    expect(errorHandler).toHaveBeenCalled();
  });
});
