/**
 * useAutoSelection Hook Tests
 * Tests for automatic entity selection logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoSelection } from '../useAutoSelection';

describe('useAutoSelection', () => {
  let setSelectedId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setSelectedId = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should auto-select first entity when no selection exists', () => {
    renderHook(() =>
      useAutoSelection({
        selectedId: null,
        entityIds: [1, 2, 3],
        setSelectedId,
      }),
    );

    expect(setSelectedId).toHaveBeenCalledWith(1);
  });

  it('should not auto-select when selection already exists', () => {
    renderHook(() =>
      useAutoSelection({
        selectedId: 2,
        entityIds: [1, 2, 3],
        setSelectedId,
      }),
    );

    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should not auto-select when entity list is empty', () => {
    renderHook(() =>
      useAutoSelection({
        selectedId: null,
        entityIds: [],
        setSelectedId,
      }),
    );

    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should clear selection when selected entity is removed', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 2,
          entityIds: [1, 2, 3],
        },
      },
    );

    setSelectedId.mockClear();

    // Entity 2 was deleted
    rerender({
      selectedId: 2,
      entityIds: [1, 3],
    });

    // Advance time past deletion delay
    vi.advanceTimersByTime(150);

    // Should clear selection
    expect(setSelectedId).toHaveBeenCalledWith(null);
  });

  it('should not auto-select immediately after deletion', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 2,
          entityIds: [1, 2, 3],
        },
      },
    );

    setSelectedId.mockClear();

    // Entity 2 was deleted
    rerender({
      selectedId: null,
      entityIds: [1, 3],
    });

    // Should not auto-select within deletion window
    expect(setSelectedId).not.toHaveBeenCalledWith(1);
  });

  it('should handle race condition when newly selected entity not yet in list', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: null,
          entityIds: [1, 2],
        },
      },
    );

    setSelectedId.mockClear();

    // User selects entity 3, but it's not yet in the entity list (race condition)
    rerender({
      selectedId: 3,
      entityIds: [1, 2],
    });

    // Should not auto-select a different entity
    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should handle when selected entity is removed from list', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 2,
          entityIds: [1, 2, 3],
        },
      },
    );

    setSelectedId.mockClear();

    // Entity list changes and selection becomes invalid (entity deleted)
    rerender({
      selectedId: 2,
      entityIds: [1, 3, 4], // Entity 2 no longer exists
    });

    // Should detect entity was removed and call setSelectedId
    expect(setSelectedId).toHaveBeenCalled();
  });

  it('should handle invalid entityIds input gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useAutoSelection({
        selectedId: null,
        entityIds: null as any,
        setSelectedId,
      }),
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should maintain previous entity list across renders', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 1,
          entityIds: [1, 2, 3],
        },
      },
    );

    setSelectedId.mockClear();

    // Add a new entity
    rerender({
      selectedId: 1,
      entityIds: [1, 2, 3, 4],
    });

    // Should not trigger auto-select
    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should detect deletion when entity count decreases', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 1,
          entityIds: [1, 2, 3, 4],
        },
      },
    );

    setSelectedId.mockClear();

    // Remove an entity (deletion detected)
    rerender({
      selectedId: 1,
      entityIds: [1, 2, 3],
    });

    // Within deletion window, should not auto-select
    expect(setSelectedId).not.toHaveBeenCalled();

    // Advance past deletion window
    vi.advanceTimersByTime(150);

    // Clear selection
    rerender({
      selectedId: null,
      entityIds: [1, 2, 3],
    });

    // Should now allow auto-select
    expect(setSelectedId).toHaveBeenCalledWith(1);
  });

  it('should handle multiple entities with same behavior', () => {
    renderHook(() =>
      useAutoSelection({
        selectedId: null,
        entityIds: [10, 20, 30, 40],
        setSelectedId,
      }),
    );

    // Should select first entity
    expect(setSelectedId).toHaveBeenCalledWith(10);
  });

  it('should not interfere with manual selection', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 1,
          entityIds: [1, 2, 3],
        },
      },
    );

    setSelectedId.mockClear();

    // User manually selects another entity
    rerender({
      selectedId: 3,
      entityIds: [1, 2, 3],
    });

    // Should not override manual selection
    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should handle rapid entity additions and removals', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 1,
          entityIds: [1],
        },
      },
    );

    setSelectedId.mockClear();

    // Rapid additions
    rerender({ selectedId: 1, entityIds: [1, 2] });
    rerender({ selectedId: 1, entityIds: [1, 2, 3] });
    rerender({ selectedId: 1, entityIds: [1, 2, 3, 4] });

    // Should remain stable
    expect(setSelectedId).not.toHaveBeenCalled();
  });

  it('should maintain deletion flag for correct duration', () => {
    const { rerender } = renderHook(
      ({ selectedId, entityIds }) =>
        useAutoSelection({
          selectedId,
          entityIds,
          setSelectedId,
        }),
      {
        initialProps: {
          selectedId: 1,
          entityIds: [1, 2, 3],
        },
      },
    );

    // Trigger deletion
    rerender({ selectedId: 1, entityIds: [1, 2] });

    setSelectedId.mockClear();

    // Within 100ms - deletion flag should still be set
    vi.advanceTimersByTime(50);
    rerender({ selectedId: null, entityIds: [1, 2] });
    expect(setSelectedId).not.toHaveBeenCalled();

    // After 100ms - deletion flag should be cleared
    vi.advanceTimersByTime(60);
    rerender({ selectedId: null, entityIds: [1, 2] });
    expect(setSelectedId).toHaveBeenCalledWith(1);
  });
});
