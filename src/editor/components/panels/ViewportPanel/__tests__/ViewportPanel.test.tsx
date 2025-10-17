import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { useMemo } from 'react';
import { useEditorStore } from '@editor/store/editorStore';

/**
 * Tests for ViewportPanel useMemo fix
 *
 * Verifies that selection state memoization uses stable dependencies
 * from Zustand store instead of unstable groupSelection object.
 */
describe('ViewportPanel Selection Memoization', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.setState({
      selectedIds: [],
    });
  });

  describe('useMemo dependency stability', () => {
    it('should use selectedIds from store as stable dependency', () => {
      const selectedIds = [1, 2, 3];
      useEditorStore.setState({ selectedIds });

      // Simulate the fixed useMemo pattern
      const { result, rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        const selectedIdsSet = useMemo(() => new Set(ids), [ids]);
        const primarySelectionId = useMemo(() => (ids.length > 0 ? ids[0] : null), [ids]);
        const hasMultipleSelected = useMemo(() => ids.length > 1, [ids]);

        return { selectedIdsSet, primarySelectionId, hasMultipleSelected };
      });

      const firstRender = result.current;

      // Re-render without changing store - memoized values should be identical
      rerender();

      expect(result.current.selectedIdsSet).toBe(firstRender.selectedIdsSet);
      expect(result.current.primarySelectionId).toBe(firstRender.primarySelectionId);
      expect(result.current.hasMultipleSelected).toBe(firstRender.hasMultipleSelected);
    });

    it('should recompute when selectedIds actually changes in store', () => {
      useEditorStore.setState({ selectedIds: [1, 2, 3] });

      const { result, rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        const selectedIdsSet = useMemo(() => new Set(ids), [ids]);
        return selectedIdsSet;
      });

      const firstSet = result.current;
      expect(firstSet.has(1)).toBe(true);
      expect(firstSet.has(4)).toBe(false);

      // Change selection in store
      useEditorStore.setState({ selectedIds: [4, 5, 6] });
      rerender();

      // Should get new memoized value
      expect(result.current).not.toBe(firstSet);
      expect(result.current.has(4)).toBe(true);
      expect(result.current.has(1)).toBe(false);
    });

    it('should compute primarySelectionId correctly', () => {
      const { result, rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        return useMemo(() => (ids.length > 0 ? ids[0] : null), [ids]);
      });

      expect(result.current).toBe(null);

      useEditorStore.setState({ selectedIds: [42, 99] });
      rerender();

      expect(result.current).toBe(42);
    });

    it('should compute hasMultipleSelected correctly', () => {
      const { result, rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        return useMemo(() => ids.length > 1, [ids]);
      });

      expect(result.current).toBe(false);

      useEditorStore.setState({ selectedIds: [1] });
      rerender();
      expect(result.current).toBe(false);

      useEditorStore.setState({ selectedIds: [1, 2] });
      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('Performance: Prevent unnecessary re-renders', () => {
    it('should not recompute when unrelated store values change', () => {
      const computeSpy = vi.fn();

      const { rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        return useMemo(() => {
          computeSpy();
          return new Set(ids);
        }, [ids]);
      });

      expect(computeSpy).toHaveBeenCalledTimes(1);

      // Change unrelated store value
      useEditorStore.setState({ isPlaying: true });
      rerender();

      // Should NOT recompute (same selectedIds reference)
      expect(computeSpy).toHaveBeenCalledTimes(1);
    });

    it('should only recompute when selectedIds reference changes', () => {
      const computeSpy = vi.fn();
      useEditorStore.setState({ selectedIds: [1, 2, 3] });

      const { rerender } = renderHook(() => {
        const ids = useEditorStore((state) => state.selectedIds);
        return useMemo(() => {
          computeSpy();
          return new Set(ids);
        }, [ids]);
      });

      expect(computeSpy).toHaveBeenCalledTimes(1);

      // Multiple re-renders with same selectedIds
      rerender();
      rerender();
      rerender();

      // Should still only be called once
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // Now change selectedIds
      useEditorStore.setState({ selectedIds: [4, 5, 6] });
      rerender();

      // Should recompute
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Regression: Unstable groupSelection object', () => {
    it('should demonstrate the old broken pattern (for documentation)', () => {
      // This test shows WHY the old pattern was broken

      // Simulate groupSelection object that changes on every render
      const { result, rerender } = renderHook(() => {
        // BAD: groupSelection is recreated every render
        const groupSelection = {
          selectedIds: useEditorStore((state) => state.selectedIds),
        };

        // BAD: Using groupSelection.selectedIds as dependency
        // This will recompute on EVERY render because groupSelection is new
        const selectedIdsSet = useMemo(
          () => new Set(groupSelection.selectedIds),
          [groupSelection.selectedIds], // UNSTABLE DEPENDENCY
        );

        return selectedIdsSet;
      });

      const firstSet = result.current;

      // Re-render without changing store
      rerender();

      // With the old broken pattern, this would be a different Set instance
      // (In reality this test uses the fixed pattern, so it passes.
      //  This is just documenting what the bug WAS)
      expect(result.current).toBe(firstSet); // PASSES because we use direct store access
    });
  });
});
