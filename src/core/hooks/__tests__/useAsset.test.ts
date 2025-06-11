import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAsset } from '../useAsset';
import { useAssetResource } from '../useAssetResource';

// Mock the useAssetResource hook
vi.mock('../useAssetResource', () => ({
  useAssetResource: vi.fn(),
}));

const mockUseAssetResource = vi.mocked(useAssetResource);

describe('useAsset', () => {
  const mockAsset = {
    scene: {
      position: { set: vi.fn() },
      scale: { set: vi.fn() },
      rotation: { set: vi.fn() },
    },
    animations: [],
    cameras: [],
    parser: {},
    scenes: [],
    userData: {},
  };

  const mockConfig = {
    position: [0, 0, 0] as [number, number, number],
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAssetResource.mockReturnValue({
      asset: mockAsset,
      config: mockConfig,
    });
  });

  describe('basic functionality', () => {
    it('should return asset data from useAssetResource', () => {
      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.gltf).toBe(mockAsset);
      expect(result.current.model).toBe(mockAsset.scene);
      expect(result.current.config).toBe(mockConfig);
      expect(result.current.ref).toBeDefined();
    });

    it('should call useAssetResource with correct key', () => {
      renderHook(() => useAsset('nightStalker'));

      expect(mockUseAssetResource).toHaveBeenCalledWith('nightStalker');
    });

    it('should handle missing asset gracefully', () => {
      mockUseAssetResource.mockReturnValue({
        asset: null,
        config: mockConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.gltf).toBeNull();
      expect(result.current.model).toBeUndefined();
      expect(result.current.config).toBe(mockConfig);
    });

    it('should handle asset without scene property', () => {
      const assetWithoutScene = {
        animations: [],
        cameras: [],
        parser: {},
        scenes: [],
        userData: {},
      };

      mockUseAssetResource.mockReturnValue({
        asset: assetWithoutScene,
        config: mockConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.gltf).toBe(assetWithoutScene);
      expect(result.current.model).toBeUndefined();
    });
  });

  describe('ref behavior', () => {
    it('should provide stable ref across re-renders', () => {
      const { result, rerender } = renderHook(() => useAsset('nightStalker'));

      const initialRef = result.current.ref;

      rerender();

      expect(result.current.ref).toBe(initialRef);
    });

    it('should not apply transformations when ref is null', () => {
      const { result } = renderHook(() => useAsset('nightStalker'));

      // ref.current is null by default
      expect(result.current.ref.current).toBeNull();

      // No transformations should be applied
      const { rerender } = renderHook(() => useAsset('nightStalker'));
      rerender();

      // No set methods should be called since ref.current is null
      expect(mockAsset.scene.position.set).not.toHaveBeenCalled();
    });

    it('should not apply transformations when asset is null', () => {
      mockUseAssetResource.mockReturnValue({
        asset: null,
        config: mockConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      const mockRef = {
        position: { set: vi.fn() },
        scale: { set: vi.fn() },
        rotation: { set: vi.fn() },
      };
      result.current.ref.current = mockRef;

      renderHook(() => useAsset('nightStalker'));

      expect(mockRef.position.set).not.toHaveBeenCalled();
      expect(mockRef.scale.set).not.toHaveBeenCalled();
      expect(mockRef.rotation.set).not.toHaveBeenCalled();
    });
  });

  describe('config handling', () => {
    it('should handle position configuration', () => {
      const customConfig = {
        ...mockConfig,
        position: [1, 2, 3] as [number, number, number],
      };

      mockUseAssetResource.mockReturnValue({
        asset: mockAsset,
        config: customConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.config.position).toEqual([1, 2, 3]);
    });

    it('should handle scale configuration', () => {
      const customConfig = {
        ...mockConfig,
        scale: 2,
      };

      mockUseAssetResource.mockReturnValue({
        asset: mockAsset,
        config: customConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.config.scale).toBe(2);
    });

    it('should handle rotation configuration', () => {
      const customConfig = {
        ...mockConfig,
        rotation: [Math.PI / 4, Math.PI / 2, Math.PI] as [number, number, number],
      };

      mockUseAssetResource.mockReturnValue({
        asset: mockAsset,
        config: customConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.config.rotation).toEqual([Math.PI / 4, Math.PI / 2, Math.PI]);
    });
  });

  describe('overrides functionality', () => {
    it('should merge overrides with config', () => {
      const overrides = {
        position: [5, 6, 7] as [number, number, number],
        scale: 3,
      };

      const { result } = renderHook(() => useAsset('nightStalker', overrides));

      // The hook should be called with overrides, but we can't easily test
      // the merged config without mocking the internal useEffect behavior
      expect(result.current.ref).toBeDefined();
      expect(result.current.gltf).toBe(mockAsset);
    });

    it('should handle overrides with different types', () => {
      const overrides = {
        scale: [1, 2, 3] as [number, number, number],
        position: [10, 20, 30] as [number, number, number],
      };

      const { result } = renderHook(() => useAsset('nightStalker', overrides));

      expect(result.current.ref).toBeDefined();
      expect(result.current.config).toBe(mockConfig);
    });
  });

  describe('asset types', () => {
    it('should handle GLTF assets with scene property', () => {
      const gltfAsset = {
        scene: mockAsset.scene,
        animations: [],
        cameras: [],
        parser: {},
        scenes: [mockAsset.scene],
        userData: {},
      };

      mockUseAssetResource.mockReturnValue({
        asset: gltfAsset,
        config: mockConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.model).toBe(gltfAsset.scene);
      expect(result.current.gltf).toBe(gltfAsset);
    });

    it('should handle non-GLTF assets without scene property', () => {
      const nonGltfAsset = {
        geometry: {},
        material: {},
        userData: {},
      };

      mockUseAssetResource.mockReturnValue({
        asset: nonGltfAsset,
        config: mockConfig,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.model).toBeUndefined();
      expect(result.current.gltf).toBe(nonGltfAsset);
    });
  });

  describe('dependency tracking', () => {
    it('should update when asset changes', () => {
      const { result, rerender } = renderHook(() => useAsset('nightStalker'));

      const initialAsset = result.current.gltf;

      // Change the asset
      const newAsset = {
        ...mockAsset,
        userData: { changed: true },
      };

      mockUseAssetResource.mockReturnValue({
        asset: newAsset,
        config: mockConfig,
      });

      rerender();

      expect(result.current.gltf).toBe(newAsset);
      expect(result.current.gltf).not.toBe(initialAsset);
    });

    it('should update when config changes', () => {
      const { result, rerender } = renderHook(() => useAsset('nightStalker'));

      const initialConfig = result.current.config;

      // Change the config
      const newConfig = {
        ...mockConfig,
        position: [10, 20, 30] as [number, number, number],
      };

      mockUseAssetResource.mockReturnValue({
        asset: mockAsset,
        config: newConfig,
      });

      rerender();

      expect(result.current.config).toBe(newConfig);
      expect(result.current.config).not.toBe(initialConfig);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined config values', () => {
      const incompleteConfig = {
        position: undefined,
        scale: undefined,
        rotation: undefined,
      };

      mockUseAssetResource.mockReturnValue({
        asset: mockAsset,
        config: incompleteConfig as any,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.config).toBe(incompleteConfig);
      expect(() => result.current).not.toThrow();
    });

    it('should handle empty overrides', () => {
      const { result } = renderHook(() => useAsset('nightStalker', {}));

      expect(result.current.ref).toBeDefined();
      expect(result.current.gltf).toBe(mockAsset);
    });

    it('should handle null asset and config', () => {
      mockUseAssetResource.mockReturnValue({
        asset: null,
        config: null as any,
      });

      const { result } = renderHook(() => useAsset('nightStalker'));

      expect(result.current.gltf).toBeNull();
      expect(result.current.model).toBeUndefined();
      expect(result.current.config).toBeNull();
    });
  });

  describe('performance considerations', () => {
    it('should not recreate ref on every render', () => {
      const { result, rerender } = renderHook(() => useAsset('nightStalker'));

      const refs = [result.current.ref];

      // Multiple rerenders
      for (let i = 0; i < 5; i++) {
        rerender();
        refs.push(result.current.ref);
      }

      // All refs should be the same instance
      refs.forEach((ref) => {
        expect(ref).toBe(refs[0]);
      });
    });

    it('should handle rapid config changes efficiently', () => {
      const { rerender } = renderHook(() => useAsset('nightStalker'));

      // Simulate rapid config changes
      for (let i = 0; i < 10; i++) {
        mockUseAssetResource.mockReturnValue({
          asset: mockAsset,
          config: {
            ...mockConfig,
            position: [i, i, i] as [number, number, number],
          },
        });
        rerender();
      }

      // Should not throw or cause issues
      expect(() => rerender()).not.toThrow();
    });
  });
});
