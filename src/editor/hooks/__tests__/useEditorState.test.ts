import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '@/editor/store/editorStore';
import { useEntityState, useUIState, usePhysicsState, useAppState } from '../useEditorState';

describe('useEditorState hooks', () => {
  beforeEach(() => {
    // Reset the store before each test
    useEditorStore.setState({
      selectedId: null,
      selectedIds: [],
      entityIds: [],
      isChatExpanded: false,
      isLeftPanelCollapsed: false,
      showAddMenu: false,
      isPlaying: false,
      statusMessage: 'Ready',
      performanceMetrics: { averageFPS: 60, frameTime: 0, renderCount: 0 },
    });
  });

  describe('useEntityState', () => {
    it('should return entity state values', () => {
      const { result } = renderHook(() => useEntityState());

      expect(result.current.entityIds).toEqual([]);
      expect(result.current.selectedId).toBeNull();
      expect(typeof result.current.setEntityIds).toBe('function');
      expect(typeof result.current.setSelectedId).toBe('function');
    });

    it('should update entity IDs', () => {
      const { result } = renderHook(() => useEntityState());

      act(() => {
        result.current.setEntityIds([1, 2, 3]);
      });

      expect(result.current.entityIds).toEqual([1, 2, 3]);
    });

    it('should update selected ID', () => {
      const { result } = renderHook(() => useEntityState());

      act(() => {
        result.current.setSelectedId(42);
      });

      expect(result.current.selectedId).toBe(42);
    });

    it('should clear selected ID', () => {
      const { result } = renderHook(() => useEntityState());

      act(() => {
        result.current.setSelectedId(42);
      });

      expect(result.current.selectedId).toBe(42);

      act(() => {
        result.current.setSelectedId(null);
      });

      expect(result.current.selectedId).toBeNull();
    });

    it('should maintain state consistency across multiple renders', () => {
      const { result, rerender } = renderHook(() => useEntityState());

      act(() => {
        result.current.setEntityIds([10, 20, 30]);
        result.current.setSelectedId(20);
      });

      rerender();

      expect(result.current.entityIds).toEqual([10, 20, 30]);
      expect(result.current.selectedId).toBe(20);
    });
  });

  describe('useUIState', () => {
    it('should return UI state values', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isChatExpanded).toBe(false);
      expect(result.current.isLeftPanelCollapsed).toBe(false);
      expect(result.current.showAddMenu).toBe(false);
      expect(typeof result.current.setIsChatExpanded).toBe('function');
      expect(typeof result.current.setIsLeftPanelCollapsed).toBe('function');
      expect(typeof result.current.setShowAddMenu).toBe('function');
    });

    it('should toggle chat expansion', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isChatExpanded).toBe(false);

      act(() => {
        result.current.setIsChatExpanded(true);
      });

      expect(result.current.isChatExpanded).toBe(true);

      act(() => {
        result.current.setIsChatExpanded(false);
      });

      expect(result.current.isChatExpanded).toBe(false);
    });

    it('should toggle left panel collapse', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.isLeftPanelCollapsed).toBe(false);

      act(() => {
        result.current.setIsLeftPanelCollapsed(true);
      });

      expect(result.current.isLeftPanelCollapsed).toBe(true);
    });

    it('should control add menu visibility', () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.showAddMenu).toBe(false);

      act(() => {
        result.current.setShowAddMenu(true);
      });

      expect(result.current.showAddMenu).toBe(true);

      act(() => {
        result.current.setShowAddMenu(false);
      });

      expect(result.current.showAddMenu).toBe(false);
    });

    it('should maintain independent UI state values', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsChatExpanded(true);
        result.current.setIsLeftPanelCollapsed(false);
        result.current.setShowAddMenu(true);
      });

      expect(result.current.isChatExpanded).toBe(true);
      expect(result.current.isLeftPanelCollapsed).toBe(false);
      expect(result.current.showAddMenu).toBe(true);
    });
  });

  describe('usePhysicsState', () => {
    it('should return physics state values', () => {
      const { result } = renderHook(() => usePhysicsState());

      expect(result.current.isPlaying).toBe(false);
      expect(typeof result.current.setIsPlaying).toBe('function');
    });

    it('should toggle play mode', () => {
      const { result } = renderHook(() => usePhysicsState());

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.setIsPlaying(true);
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.setIsPlaying(false);
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should reflect physics state changes from store', () => {
      const { result } = renderHook(() => usePhysicsState());

      // Change state directly through store
      act(() => {
        useEditorStore.setState({ isPlaying: true });
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('useAppState', () => {
    it('should return app state values', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.statusMessage).toBe('Ready');
      expect(result.current.performanceMetrics).toEqual({
        averageFPS: 60,
        frameTime: 0,
        renderCount: 0,
      });
      expect(typeof result.current.setStatusMessage).toBe('function');
    });

    it('should update status message', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setStatusMessage('Loading...');
      });

      expect(result.current.statusMessage).toBe('Loading...');

      act(() => {
        result.current.setStatusMessage('Error occurred');
      });

      expect(result.current.statusMessage).toBe('Error occurred');
    });

    it('should maintain performance metrics', () => {
      const { result } = renderHook(() => useAppState());
      const initialMetrics = result.current.performanceMetrics;

      expect(initialMetrics.averageFPS).toBe(60);
      expect(initialMetrics.frameTime).toBe(0);
      expect(initialMetrics.renderCount).toBe(0);

      // Performance metrics are updated through the store's setPerformanceMetrics
      act(() => {
        useEditorStore.setState({
          performanceMetrics: {
            averageFPS: 45,
            frameTime: 22.2,
            renderCount: 100,
          },
        });
      });

      expect(result.current.performanceMetrics.averageFPS).toBe(45);
      expect(result.current.performanceMetrics.frameTime).toBe(22.2);
      expect(result.current.performanceMetrics.renderCount).toBe(100);
    });

    it('should handle various status messages', () => {
      const { result } = renderHook(() => useAppState());

      const testMessages = [
        'Initializing...',
        'Saving scene...',
        'Loading assets...',
        'Build complete',
        'Error: Failed to save',
        '',
      ];

      testMessages.forEach((message) => {
        act(() => {
          result.current.setStatusMessage(message);
        });

        expect(result.current.statusMessage).toBe(message);
      });
    });
  });

  describe('state isolation', () => {
    it('should not interfere between different state hooks', () => {
      const entityState = renderHook(() => useEntityState());
      const uiState = renderHook(() => useUIState());
      const physicsState = renderHook(() => usePhysicsState());
      const appState = renderHook(() => useAppState());

      // Update various states
      act(() => {
        entityState.result.current.setSelectedId(123);
        uiState.result.current.setIsChatExpanded(true);
        physicsState.result.current.setIsPlaying(true);
        appState.result.current.setStatusMessage('Testing');
      });

      // Verify each hook only reflects its own state
      expect(entityState.result.current.selectedId).toBe(123);
      expect(uiState.result.current.isChatExpanded).toBe(true);
      expect(physicsState.result.current.isPlaying).toBe(true);
      expect(appState.result.current.statusMessage).toBe('Testing');

      // Verify no cross-contamination
      expect((entityState.result.current as any).setIsChatExpanded).toBeUndefined();
      expect((uiState.result.current as any).setSelectedId).toBeUndefined();
      expect((physicsState.result.current as any).setStatusMessage).toBeUndefined();
      expect((appState.result.current as any).setIsPlaying).toBeUndefined();
    });
  });

  describe('hook stability', () => {
    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useEntityState());

      const initialSetSelectedId = result.current.setSelectedId;
      const initialSetEntityIds = result.current.setEntityIds;

      rerender();

      expect(result.current.setSelectedId).toBe(initialSetSelectedId);
      expect(result.current.setEntityIds).toBe(initialSetEntityIds);
    });

    it('should update values but maintain function references across state changes', () => {
      const { result, rerender } = renderHook(() => useEntityState());

      const initialSetSelectedId = result.current.setSelectedId;

      act(() => {
        result.current.setSelectedId(999);
      });

      rerender();

      expect(result.current.selectedId).toBe(999);
      expect(result.current.setSelectedId).toBe(initialSetSelectedId);
    });
  });
});
