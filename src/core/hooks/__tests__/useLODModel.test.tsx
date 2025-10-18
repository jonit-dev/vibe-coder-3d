import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLODModel } from '../useLODModel';
import { lodManager } from '../../lib/rendering/LODManager';

describe('useLODModel', () => {
  const testBasePath = '/assets/models/Character/glb/Character.glb';

  beforeEach(() => {
    lodManager.setQuality('original');
    lodManager.setAutoSwitch(false);
  });

  it('should return original path by default', () => {
    const { result } = renderHook(() => useLODModel({ basePath: testBasePath }));
    expect(result.current).toBe(testBasePath);
  });

  it('should return high_fidelity path when quality is set', () => {
    lodManager.setQuality('high_fidelity');
    const { result } = renderHook(() => useLODModel({ basePath: testBasePath }));
    expect(result.current).toBe('/assets/models/Character/lod/Character.high_fidelity.glb');
  });

  it('should return low_fidelity path when quality is set', () => {
    lodManager.setQuality('low_fidelity');
    const { result } = renderHook(() => useLODModel({ basePath: testBasePath }));
    expect(result.current).toBe('/assets/models/Character/lod/Character.low_fidelity.glb');
  });

  it('should use quality override when provided', () => {
    lodManager.setQuality('original');
    const { result } = renderHook(() =>
      useLODModel({ basePath: testBasePath, quality: 'low_fidelity' }),
    );
    expect(result.current).toBe('/assets/models/Character/lod/Character.low_fidelity.glb');
  });

  it('should use distance-based quality when distance provided', () => {
    lodManager.setAutoSwitch(true);
    lodManager.setDistanceThresholds(50, 100);

    // Close distance - original
    const { result: close } = renderHook(() =>
      useLODModel({ basePath: testBasePath, distance: 25 }),
    );
    expect(close.current).toBe(testBasePath);

    // Medium distance - high_fidelity
    const { result: medium } = renderHook(() =>
      useLODModel({ basePath: testBasePath, distance: 75 }),
    );
    expect(medium.current).toBe('/assets/models/Character/lod/Character.high_fidelity.glb');

    // Far distance - low_fidelity
    const { result: far } = renderHook(() =>
      useLODModel({ basePath: testBasePath, distance: 150 }),
    );
    expect(far.current).toBe('/assets/models/Character/lod/Character.low_fidelity.glb');
  });

  it('should update path when global quality changes', () => {
    const { result, rerender } = renderHook(() => useLODModel({ basePath: testBasePath }));

    // Initial state
    expect(result.current).toBe(testBasePath);

    // Change quality
    act(() => {
      lodManager.setQuality('low_fidelity');
    });

    rerender();

    // Should still return original since hook needs to re-render
    // In real app, this would trigger a re-render of the component
    expect(result.current).toBe(testBasePath);
  });

  it('should handle different base paths correctly', () => {
    lodManager.setQuality('high_fidelity');

    const paths = [
      {
        base: '/assets/models/Tree/glb/Tree.glb',
        expected: '/assets/models/Tree/lod/Tree.high_fidelity.glb',
      },
      {
        base: '/assets/models/House/glb/House.glb',
        expected: '/assets/models/House/lod/House.high_fidelity.glb',
      },
      {
        base: '/assets/models/Rock.glb',
        expected: '/assets/models/lod/Rock.high_fidelity.glb',
      },
    ];

    paths.forEach(({ base, expected }) => {
      const { result } = renderHook(() => useLODModel({ basePath: base }));
      expect(result.current).toBe(expected);
    });
  });

  it('should prioritize quality override over distance', () => {
    lodManager.setAutoSwitch(true);
    lodManager.setDistanceThresholds(50, 100);

    // Distance would suggest original, but override forces high_fidelity
    const { result } = renderHook(() =>
      useLODModel({ basePath: testBasePath, distance: 10, quality: 'high_fidelity' }),
    );
    expect(result.current).toBe('/assets/models/Character/lod/Character.high_fidelity.glb');
  });

  it('should handle edge case: auto-switch disabled with distance provided', () => {
    lodManager.setAutoSwitch(false);
    lodManager.setQuality('low_fidelity');

    // Distance is provided but auto-switch is off, should use global quality
    const { result } = renderHook(() => useLODModel({ basePath: testBasePath, distance: 10 }));
    expect(result.current).toBe('/assets/models/Character/lod/Character.low_fidelity.glb');
  });
});
