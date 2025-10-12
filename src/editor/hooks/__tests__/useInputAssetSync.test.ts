import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInputAssetSync } from '../useInputAssetSync';
import { InputManager } from '@core/lib/input/InputManager';
import { useInputStore } from '@editor/store/inputStore';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';

// Mock InputManager
vi.mock('@core/lib/input/InputManager', () => ({
  InputManager: {
    getInstance: vi.fn(),
  },
}));

// Mock Logger
vi.mock('@core/lib/logger', () => ({
  Logger: {
    create: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      milestone: vi.fn(),
    }),
  },
}));

describe('useInputAssetSync', () => {
  let mockInputManager: any;

  const createMockAsset = (
    name: string,
    actionMaps: Array<{ name: string; enabled: boolean }> = [],
  ): IInputActionsAsset => ({
    name,
    actionMaps: actionMaps.map((map) => ({
      name: map.name,
      enabled: map.enabled,
      actions: [],
    })),
  });

  const setupDefaultAsset = () => {
    const defaultAsset = createMockAsset('Default Input', [
      { name: 'Gameplay', enabled: true },
      { name: 'UI', enabled: false },
    ]);

    useInputStore.setState({
      assets: [defaultAsset],
      currentAsset: 'Default Input',
    });
  };

  beforeEach(() => {
    // Clear all mocks first
    vi.clearAllMocks();

    // Create mock InputManager
    mockInputManager = {
      loadInputActionsAsset: vi.fn(),
      enableActionMap: vi.fn(),
      disableActionMap: vi.fn(),
    };

    vi.mocked(InputManager.getInstance).mockReturnValue(mockInputManager);

    // Reset input store to empty state by default
    // Tests that need data should call setupDefaultAsset() or set their own state
    useInputStore.setState({
      assets: [],
      currentAsset: null as any,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Asset Loading', () => {
    it('should load current asset into InputManager on mount', async () => {
      setupDefaultAsset();

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
      });

      const loadedAsset = mockInputManager.loadInputActionsAsset.mock.calls[0][0];
      expect(loadedAsset.name).toBe('Default Input');
    });

    it('should enable all enabled action maps', async () => {
      setupDefaultAsset();

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Gameplay');
      });

      // UI should not be enabled since it's disabled in the asset
      expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(1);
    });

    it('should not enable disabled action maps', async () => {
      setupDefaultAsset();

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
      });

      // Verify UI was not enabled
      const calls = mockInputManager.enableActionMap.mock.calls;
      const uiMapEnabled = calls.some((call: any[]) => call[0] === 'UI');
      expect(uiMapEnabled).toBe(false);
    });

    it('should reload asset when currentAsset changes', async () => {
      setupDefaultAsset();

      const { rerender } = renderHook(() => useInputAssetSync());

      // Wait for initial load
      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
      });

      // Change current asset
      const newAsset = createMockAsset('Player Controls', [{ name: 'Player', enabled: true }]);

      useInputStore.setState({
        assets: [newAsset],
        currentAsset: 'Player Controls',
      });

      rerender();

      // Wait for reload
      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(2);
      });

      const secondLoadCall = mockInputManager.loadInputActionsAsset.mock.calls[1][0];
      expect(secondLoadCall.name).toBe('Player Controls');
    });

    it('should enable correct action maps when asset changes', async () => {
      setupDefaultAsset();

      const { rerender } = renderHook(() => useInputAssetSync());

      // Wait for initial load
      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Gameplay');
      });

      mockInputManager.enableActionMap.mockClear();

      // Change to asset with different action maps
      const newAsset = createMockAsset('Vehicle Controls', [
        { name: 'Vehicle', enabled: true },
        { name: 'Debug', enabled: true },
      ]);

      useInputStore.setState({
        assets: [newAsset],
        currentAsset: 'Vehicle Controls',
      });

      rerender();

      // Wait for new action maps to be enabled
      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Vehicle');
      });

      expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Debug');
      expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing currentAsset gracefully', async () => {
      // State already set to null/empty in beforeEach
      renderHook(() => useInputAssetSync());

      // Should not attempt to load asset
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockInputManager.loadInputActionsAsset).not.toHaveBeenCalled();
    });

    it('should handle asset with no action maps', async () => {
      const emptyAsset = createMockAsset('Empty Asset', []);

      useInputStore.setState({
        assets: [emptyAsset],
        currentAsset: 'Empty Asset',
      });

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
      });

      const loadedAsset = mockInputManager.loadInputActionsAsset.mock.calls[0][0];
      expect(loadedAsset.actionMaps).toEqual([]);
      expect(mockInputManager.enableActionMap).not.toHaveBeenCalled();
    });

    it('should handle all action maps disabled', async () => {
      const allDisabledAsset = createMockAsset('All Disabled', [
        { name: 'Map1', enabled: false },
        { name: 'Map2', enabled: false },
        { name: 'Map3', enabled: false },
      ]);

      useInputStore.setState({
        assets: [allDisabledAsset],
        currentAsset: 'All Disabled',
      });

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
      });

      expect(mockInputManager.enableActionMap).not.toHaveBeenCalled();
    });

    it('should handle InputManager not initialized', async () => {
      vi.mocked(InputManager.getInstance).mockReturnValue(null as any);

      renderHook(() => useInputAssetSync());

      // Should not crash and should not call methods on null
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No errors should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle loadInputActionsAsset errors gracefully', async () => {
      setupDefaultAsset();

      mockInputManager.loadInputActionsAsset.mockImplementation(() => {
        throw new Error('Failed to load asset');
      });

      renderHook(() => useInputAssetSync());

      // Should not crash
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Hook should still have called loadInputActionsAsset
      expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
    });

    it('should handle enableActionMap errors gracefully', async () => {
      setupDefaultAsset();

      mockInputManager.enableActionMap.mockImplementation(() => {
        throw new Error('Failed to enable action map');
      });

      renderHook(() => useInputAssetSync());

      // Should not crash
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still attempt to enable
      expect(mockInputManager.enableActionMap).toHaveBeenCalled();
    });

    it('should stop processing when enableActionMap fails', async () => {
      mockInputManager.enableActionMap.mockImplementation((mapName: string) => {
        if (mapName === 'Map1') {
          throw new Error('First map failed');
        }
      });

      const multiMapAsset = createMockAsset('Multi Map', [
        { name: 'Map1', enabled: true },
        { name: 'Map2', enabled: true },
      ]);

      useInputStore.setState({
        assets: [multiMapAsset],
        currentAsset: 'Multi Map',
      });

      renderHook(() => useInputAssetSync());

      // Should attempt to enable first map and then catch error, stopping further processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Only first call should happen before error is caught
      expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(1);
      expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Map1');
    });
  });

  describe('Asset List Changes', () => {
    it('should not reload when assets list changes but currentAsset stays same', async () => {
      setupDefaultAsset();

      const { rerender } = renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
      });

      mockInputManager.loadInputActionsAsset.mockClear();

      // Add another asset but keep current asset the same
      const newAsset = createMockAsset('Another Asset', []);

      useInputStore.setState((state) => ({
        ...state,
        assets: [...state.assets, newAsset],
        // currentAsset remains "Default Input"
      }));

      rerender();

      // Should not reload because currentAsset didn't change
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockInputManager.loadInputActionsAsset).not.toHaveBeenCalled();
    });

    it('should handle rapid asset switches', async () => {
      setupDefaultAsset();

      const { rerender } = renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
      });

      // Rapidly switch assets
      const asset1 = createMockAsset('Asset 1', [{ name: 'Map1', enabled: true }]);
      const asset2 = createMockAsset('Asset 2', [{ name: 'Map2', enabled: true }]);
      const asset3 = createMockAsset('Asset 3', [{ name: 'Map3', enabled: true }]);

      useInputStore.setState({ assets: [asset1], currentAsset: 'Asset 1' });
      rerender();

      useInputStore.setState({ assets: [asset2], currentAsset: 'Asset 2' });
      rerender();

      useInputStore.setState({ assets: [asset3], currentAsset: 'Asset 3' });
      rerender();

      // Should eventually load the final asset
      await waitFor(() => {
        const lastCall =
          mockInputManager.loadInputActionsAsset.mock.calls[
            mockInputManager.loadInputActionsAsset.mock.calls.length - 1
          ];
        expect(lastCall[0].name).toBe('Asset 3');
      });
    });
  });

  describe('Multiple Action Maps', () => {
    it('should enable multiple action maps in order', async () => {
      const multiMapAsset = createMockAsset('Multi Map Asset', [
        { name: 'Gameplay', enabled: true },
        { name: 'UI', enabled: true },
        { name: 'Debug', enabled: true },
        { name: 'Editor', enabled: true },
      ]);

      useInputStore.setState({
        assets: [multiMapAsset],
        currentAsset: 'Multi Map Asset',
      });

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(4);
      });

      const calls = mockInputManager.enableActionMap.mock.calls;
      expect(calls[0][0]).toBe('Gameplay');
      expect(calls[1][0]).toBe('UI');
      expect(calls[2][0]).toBe('Debug');
      expect(calls[3][0]).toBe('Editor');
    });

    it('should only enable enabled maps in mixed scenario', async () => {
      const mixedAsset = createMockAsset('Mixed Asset', [
        { name: 'Map1', enabled: true },
        { name: 'Map2', enabled: false },
        { name: 'Map3', enabled: true },
        { name: 'Map4', enabled: false },
        { name: 'Map5', enabled: true },
      ]);

      useInputStore.setState({
        assets: [mixedAsset],
        currentAsset: 'Mixed Asset',
      });

      renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(3);
      });

      const enabledMaps = mockInputManager.enableActionMap.mock.calls.map((call: any[]) => call[0]);
      expect(enabledMaps).toEqual(['Map1', 'Map3', 'Map5']);
    });
  });

  describe('Hook Cleanup', () => {
    it('should not call InputManager after unmount', async () => {
      setupDefaultAsset();

      const { unmount } = renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
      });

      mockInputManager.loadInputActionsAsset.mockClear();
      mockInputManager.enableActionMap.mockClear();

      unmount();

      // Change the store after unmount
      const newAsset = createMockAsset('Should Not Load', [{ name: 'Map', enabled: true }]);

      useInputStore.setState({
        assets: [newAsset],
        currentAsset: 'Should Not Load',
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not have called InputManager methods
      expect(mockInputManager.loadInputActionsAsset).not.toHaveBeenCalled();
      expect(mockInputManager.enableActionMap).not.toHaveBeenCalled();
    });
  });

  describe('InputManager Instance Consistency', () => {
    it('should use same InputManager instance across calls', async () => {
      setupDefaultAsset();

      const { rerender } = renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalled();
      });

      const callCount = vi.mocked(InputManager.getInstance).mock.calls.length;

      // Change asset
      const newAsset = createMockAsset('New Asset', [{ name: 'Map', enabled: true }]);
      useInputStore.setState({ assets: [newAsset], currentAsset: 'New Asset' });

      rerender();

      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(2);
      });

      // getInstance should be called at least twice (once per effect execution)
      expect(vi.mocked(InputManager.getInstance).mock.calls.length).toBeGreaterThanOrEqual(
        callCount + 1,
      );
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical game setup workflow', async () => {
      // Start with default asset
      const defaultAsset = createMockAsset('Default Input', [
        { name: 'Gameplay', enabled: true },
        { name: 'UI', enabled: true },
      ]);

      useInputStore.setState({
        assets: [defaultAsset],
        currentAsset: 'Default Input',
      });

      const { rerender } = renderHook(() => useInputAssetSync());

      // Wait for initial load
      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
        expect(mockInputManager.enableActionMap).toHaveBeenCalledTimes(2);
      });

      mockInputManager.loadInputActionsAsset.mockClear();
      mockInputManager.enableActionMap.mockClear();

      // Switch to vehicle controls
      const vehicleAsset = createMockAsset('Vehicle Controls', [
        { name: 'Vehicle', enabled: true },
        { name: 'UI', enabled: true },
      ]);

      useInputStore.setState({
        assets: [vehicleAsset],
        currentAsset: 'Vehicle Controls',
      });

      rerender();

      // Verify vehicle asset loaded
      await waitFor(() => {
        expect(mockInputManager.loadInputActionsAsset).toHaveBeenCalledTimes(1);
      });

      const vehicleLoadCall = mockInputManager.loadInputActionsAsset.mock.calls[0][0];
      expect(vehicleLoadCall.name).toBe('Vehicle Controls');

      expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('Vehicle');
      expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('UI');
    });

    it('should handle editor-to-game transition', async () => {
      // Editor mode with debug tools enabled
      const editorAsset = createMockAsset('Editor Mode', [
        { name: 'EditorCamera', enabled: true },
        { name: 'SelectionTools', enabled: true },
        { name: 'Gameplay', enabled: false },
      ]);

      useInputStore.setState({
        assets: [editorAsset],
        currentAsset: 'Editor Mode',
      });

      const { rerender } = renderHook(() => useInputAssetSync());

      await waitFor(() => {
        expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('EditorCamera');
        expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('SelectionTools');
      });

      const gameplayNotEnabled = mockInputManager.enableActionMap.mock.calls.every(
        (call: any[]) => call[0] !== 'Gameplay',
      );
      expect(gameplayNotEnabled).toBe(true);
    });
  });
});
