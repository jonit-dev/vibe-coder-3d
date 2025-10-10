import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCollisionEvents } from '../useCollisionEvents';

// Mock dependencies
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    // Store the callback for manual execution in tests
    (globalThis as any).__frameCallback = callback;
  }),
}));

// Create mock EventQueue
const createMockEventQueue = () => {
  let drainCallback: ((handle1: number, handle2: number, started: boolean) => void) | null = null;

  return {
    eventQueue: {
      drainCollisionEvents: vi.fn((callback) => {
        drainCallback = callback;
      }),
    },
    triggerCollision: (handle1: number, handle2: number, started: boolean) => {
      if (drainCallback) {
        drainCallback(handle1, handle2, started);
      }
    },
  };
};

// Create mock collider
const createMockCollider = (entityId: number, isSensor = false) => ({
  userData: { entityId },
  isSensor: vi.fn(() => isSensor),
});

// Create mock world
const createMockWorld = (colliders: Map<number, ReturnType<typeof createMockCollider>>) => ({
  getCollider: vi.fn((handle: number) => colliders.get(handle)),
  intersectionPair: vi.fn(() => true),
});

vi.mock('@react-three/rapier', () => ({
  useRapier: () => ({
    world: (globalThis as any).__mockWorld,
  }),
}));

vi.mock('@dimforge/rapier3d-compat', () => ({
  EventQueue: vi.fn(() => (globalThis as any).__mockEventQueue),
}));

describe('useCollisionEvents', () => {
  let mockColliders: Map<number, ReturnType<typeof createMockCollider>>;
  let mockWorld: ReturnType<typeof createMockWorld>;
  let mockEventQueueHelpers: ReturnType<typeof createMockEventQueue>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock colliders
    mockColliders = new Map([
      [1, createMockCollider(100, false)],
      [2, createMockCollider(200, false)],
      [3, createMockCollider(300, true)], // sensor
      [4, createMockCollider(400, true)], // sensor
    ]);

    // Setup mock world
    mockWorld = createMockWorld(mockColliders);
    (globalThis as any).__mockWorld = mockWorld;

    // Setup mock event queue
    mockEventQueueHelpers = createMockEventQueue();
    (globalThis as any).__mockEventQueue = mockEventQueueHelpers.eventQueue;
  });

  describe('Regular Collisions', () => {
    it('should call onCollisionEnter when collision starts', () => {
      const onCollisionEnter = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onCollisionEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger collision
      act(() => {
        mockEventQueueHelpers.triggerCollision(1, 2, true);
      });

      expect(onCollisionEnter).toHaveBeenCalledWith(100, 200, true);
    });

    it('should call onCollisionExit when collision ends', () => {
      const onCollisionExit = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onCollisionExit,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger collision end
      act(() => {
        mockEventQueueHelpers.triggerCollision(1, 2, false);
      });

      expect(onCollisionExit).toHaveBeenCalledWith(100, 200, false);
    });

    it('should handle multiple collision events', () => {
      const onCollisionEnter = vi.fn();
      const onCollisionExit = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onCollisionEnter,
          onCollisionExit,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger multiple collisions
      act(() => {
        mockEventQueueHelpers.triggerCollision(1, 2, true);
        mockEventQueueHelpers.triggerCollision(1, 2, false);
      });

      expect(onCollisionEnter).toHaveBeenCalledWith(100, 200, true);
      expect(onCollisionExit).toHaveBeenCalledWith(100, 200, false);
    });
  });

  describe('Sensor Collisions', () => {
    it('should call onSensorEnter when sensor intersection starts', () => {
      const onSensorEnter = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onSensorEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger sensor collision
      act(() => {
        mockEventQueueHelpers.triggerCollision(3, 4, true);
      });

      expect(onSensorEnter).toHaveBeenCalledWith(300, 400, true);
      expect(mockWorld.intersectionPair).toHaveBeenCalled();
    });

    it('should call onSensorExit when sensor intersection ends', () => {
      const onSensorExit = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onSensorExit,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger sensor collision end
      act(() => {
        mockEventQueueHelpers.triggerCollision(3, 4, false);
      });

      expect(onSensorExit).toHaveBeenCalledWith(300, 400, false);
    });

    it('should not call onSensorEnter if intersection check fails', () => {
      const onSensorEnter = vi.fn();
      mockWorld.intersectionPair.mockReturnValue(false);

      renderHook(() =>
        useCollisionEvents({
          onSensorEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger sensor collision
      act(() => {
        mockEventQueueHelpers.triggerCollision(3, 4, true);
      });

      expect(onSensorEnter).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing colliders gracefully', () => {
      const onCollisionEnter = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onCollisionEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger collision with non-existent collider
      act(() => {
        mockEventQueueHelpers.triggerCollision(999, 2, true);
      });

      expect(onCollisionEnter).not.toHaveBeenCalled();
    });

    it('should handle colliders without entityId in userData', () => {
      const onCollisionEnter = vi.fn();

      // Add collider without entityId
      mockColliders.set(5, {
        userData: {},
        isSensor: vi.fn(() => false),
      } as any);

      renderHook(() =>
        useCollisionEvents({
          onCollisionEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger collision
      act(() => {
        mockEventQueueHelpers.triggerCollision(5, 2, true);
      });

      // Should call with -1 for missing entityId
      expect(onCollisionEnter).toHaveBeenCalledWith(-1, 200, true);
    });

    it('should not crash if no callbacks are provided', () => {
      expect(() => {
        renderHook(() => useCollisionEvents({}));

        // Trigger frame to drain events
        act(() => {
          if ((globalThis as any).__frameCallback) {
            (globalThis as any).__frameCallback();
          }
        });

        // Trigger collision
        act(() => {
          mockEventQueueHelpers.triggerCollision(1, 2, true);
        });
      }).not.toThrow();
    });

    it('should handle errors in collision processing gracefully', () => {
      const onCollisionEnter = vi.fn(() => {
        throw new Error('Test error');
      });

      // Should not throw - errors are caught and logged
      expect(() => {
        renderHook(() =>
          useCollisionEvents({
            onCollisionEnter,
          }),
        );

        // Trigger frame to drain events
        act(() => {
          if ((globalThis as any).__frameCallback) {
            (globalThis as any).__frameCallback();
          }
        });

        // Trigger collision
        act(() => {
          mockEventQueueHelpers.triggerCollision(1, 2, true);
        });
      }).not.toThrow();

      expect(onCollisionEnter).toHaveBeenCalled();
    });
  });

  describe('Mixed Collisions', () => {
    it('should handle collision between sensor and regular collider', () => {
      const onSensorEnter = vi.fn();
      const onCollisionEnter = vi.fn();

      renderHook(() =>
        useCollisionEvents({
          onSensorEnter,
          onCollisionEnter,
        }),
      );

      // Trigger frame to drain events
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      // Trigger collision between sensor and regular collider
      act(() => {
        mockEventQueueHelpers.triggerCollision(3, 1, true);
      });

      // Should call sensor callback, not collision callback
      expect(onSensorEnter).toHaveBeenCalledWith(300, 100, true);
      expect(onCollisionEnter).not.toHaveBeenCalled();
    });
  });
});
