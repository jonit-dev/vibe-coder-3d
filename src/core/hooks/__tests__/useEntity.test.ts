import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { useEntity, useEntityQuery } from '../useEntity';

// Mock the component registry
vi.mock('@core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    hasComponent: vi.fn(),
  },
}));

// Mock useFrame from react-three-fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    // Store the callback for manual execution in tests
    (globalThis as any).__frameCallback = callback;
  }),
}));

// Mock BitECS
vi.mock('bitecs', () => ({
  defineQuery: vi.fn(() => vi.fn(() => [1, 2, 3])),
}));

describe('useEntity', () => {
  const mockHasComponent = vi.mocked(componentRegistry.hasComponent);

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasComponent.mockReturnValue(false);
  });

  describe('useEntity hook', () => {
    it('should return false when entityId is null', () => {
      const { result } = renderHook(() => useEntity(null, 'Transform'));

      expect(result.current).toBe(false);
      expect(mockHasComponent).not.toHaveBeenCalled();
    });

    it('should return true when entity has component', () => {
      mockHasComponent.mockReturnValue(true);

      const { result } = renderHook(() => useEntity(1, 'Transform'));

      expect(result.current).toBe(true);
      expect(mockHasComponent).toHaveBeenCalledWith(1, 'Transform');
    });

    it('should return false when entity does not have component', () => {
      mockHasComponent.mockReturnValue(false);

      const { result } = renderHook(() => useEntity(1, 'Transform'));

      expect(result.current).toBe(false);
      expect(mockHasComponent).toHaveBeenCalledWith(1, 'Transform');
    });

    it('should update when component is added during frame', () => {
      mockHasComponent.mockReturnValue(false);

      const { result } = renderHook(() => useEntity(1, 'Transform'));

      expect(result.current).toBe(false);

      // Simulate component being added
      mockHasComponent.mockReturnValue(true);

      // Trigger frame callback
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      expect(result.current).toBe(true);
    });

    it('should update when component is removed during frame', () => {
      mockHasComponent.mockReturnValue(true);

      const { result } = renderHook(() => useEntity(1, 'Transform'));

      expect(result.current).toBe(true);

      // Simulate component being removed
      mockHasComponent.mockReturnValue(false);

      // Trigger frame callback
      act(() => {
        if ((globalThis as any).__frameCallback) {
          (globalThis as any).__frameCallback();
        }
      });

      expect(result.current).toBe(false);
    });

    it('should handle entityId changes', () => {
      mockHasComponent.mockImplementation((entityId, componentId) => {
        return entityId === 1 && componentId === 'Transform';
      });

      const { result, rerender } = renderHook(({ entityId }) => useEntity(entityId, 'Transform'), {
        initialProps: { entityId: 1 },
      });

      expect(result.current).toBe(true);

      // Change entity ID
      rerender({ entityId: 2 });

      expect(result.current).toBe(false);
    });

    it('should handle componentId changes', () => {
      mockHasComponent.mockImplementation((entityId, componentId) => {
        return entityId === 1 && componentId === 'Transform';
      });

      const { result, rerender } = renderHook(({ componentId }) => useEntity(1, componentId), {
        initialProps: { componentId: 'Transform' },
      });

      expect(result.current).toBe(true);

      // Change component ID
      rerender({ componentId: 'MeshRenderer' });

      expect(result.current).toBe(false);
    });

    it('should handle null to valid entityId transition', () => {
      mockHasComponent.mockReturnValue(true);

      const { result, rerender } = renderHook(({ entityId }) => useEntity(entityId, 'Transform'), {
        initialProps: { entityId: null },
      });

      expect(result.current).toBe(false);

      // Change to valid entity ID
      rerender({ entityId: 1 });

      expect(result.current).toBe(true);
      expect(mockHasComponent).toHaveBeenCalledWith(1, 'Transform');
    });

    it('should handle valid to null entityId transition', () => {
      mockHasComponent.mockReturnValue(true);

      const { result, rerender } = renderHook(({ entityId }) => useEntity(entityId, 'Transform'), {
        initialProps: { entityId: 1 },
      });

      expect(result.current).toBe(true);

      // Change to null entity ID
      rerender({ entityId: null });

      expect(result.current).toBe(false);
    });
  });
});
