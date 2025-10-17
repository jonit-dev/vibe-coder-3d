import { describe, it, expect, beforeEach } from 'vitest';
import { useLODStore } from '../lodStore';

describe('LODStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useLODStore.getState();
    store.setQuality('original');
    store.setAutoSwitch(true);
    store.setDistanceThresholds({ high: 50, low: 100 });
  });

  describe('Quality Management', () => {
    it('should default to original quality', () => {
      const { quality } = useLODStore.getState();
      expect(quality).toBe('original');
    });

    it('should update quality when setQuality is called', () => {
      const { setQuality } = useLODStore.getState();
      setQuality('high_fidelity');
      expect(useLODStore.getState().quality).toBe('high_fidelity');
    });

    it('should preserve auto-switch when setting quality', () => {
      const { setQuality, setAutoSwitch } = useLODStore.getState();
      setAutoSwitch(true);
      setQuality('low_fidelity');
      // Auto-switch should remain ON after setting quality
      expect(useLODStore.getState().autoSwitch).toBe(true);
    });
  });

  describe('Auto-Switch', () => {
    it('should default to auto-switch enabled', () => {
      const { autoSwitch } = useLODStore.getState();
      expect(autoSwitch).toBe(true);
    });

    it('should toggle auto-switch', () => {
      const { setAutoSwitch } = useLODStore.getState();
      setAutoSwitch(false);
      expect(useLODStore.getState().autoSwitch).toBe(false);
      setAutoSwitch(true);
      expect(useLODStore.getState().autoSwitch).toBe(true);
    });
  });

  describe('Distance-Based Quality (Auto-Switch)', () => {
    it('should return original quality for close distances', () => {
      const { getQualityForDistance } = useLODStore.getState();
      // Distance < 50 (high threshold) = original quality
      expect(getQualityForDistance(10)).toBe('original');
      expect(getQualityForDistance(30)).toBe('original');
      expect(getQualityForDistance(49)).toBe('original');
    });

    it('should return high_fidelity for medium distances', () => {
      const { getQualityForDistance } = useLODStore.getState();
      // Distance 50-100 (between thresholds) = high_fidelity
      expect(getQualityForDistance(50)).toBe('high_fidelity');
      expect(getQualityForDistance(75)).toBe('high_fidelity');
      expect(getQualityForDistance(99)).toBe('high_fidelity');
    });

    it('should return low_fidelity for far distances', () => {
      const { getQualityForDistance } = useLODStore.getState();
      // Distance >= 100 (low threshold) = low_fidelity
      expect(getQualityForDistance(100)).toBe('low_fidelity');
      expect(getQualityForDistance(150)).toBe('low_fidelity');
      expect(getQualityForDistance(500)).toBe('low_fidelity');
    });

    it('should return global quality when auto-switch is disabled', () => {
      const { setAutoSwitch, setQuality, getQualityForDistance } = useLODStore.getState();
      setAutoSwitch(false);
      setQuality('high_fidelity');

      // Should return high_fidelity regardless of distance
      expect(getQualityForDistance(10)).toBe('high_fidelity');
      expect(getQualityForDistance(75)).toBe('high_fidelity');
      expect(getQualityForDistance(500)).toBe('high_fidelity');
    });
  });

  describe('Custom Distance Thresholds', () => {
    it('should use custom thresholds', () => {
      const { setDistanceThresholds, getQualityForDistance } = useLODStore.getState();

      // Set custom thresholds
      setDistanceThresholds({ high: 25, low: 75 });

      // Test with new thresholds
      expect(getQualityForDistance(20)).toBe('original'); // < 25
      expect(getQualityForDistance(50)).toBe('high_fidelity'); // 25-75
      expect(getQualityForDistance(100)).toBe('low_fidelity'); // >= 75
    });
  });

  describe('Zoom Simulation', () => {
    it('should handle zoom in correctly (smaller effective distance = higher quality)', () => {
      const { getQualityForDistance } = useLODStore.getState();

      // Simulate camera at distance 100, zoom = 1.0
      const baseDistance = 100;

      // Zoom IN: zoom increases (2.0), effective distance = baseDistance / zoom = 50
      const zoomInDistance = baseDistance / 2.0;
      expect(zoomInDistance).toBe(50); // Verify calculation
      expect(getQualityForDistance(zoomInDistance)).toBe('high_fidelity');
    });

    it('should handle zoom out correctly (larger effective distance = lower quality)', () => {
      const { getQualityForDistance } = useLODStore.getState();

      // Simulate camera at distance 50, zoom = 1.0
      const baseDistance = 50;

      // Zoom OUT: zoom decreases (0.5), effective distance = baseDistance / zoom = 100
      const zoomOutDistance = baseDistance / 0.5;
      expect(zoomOutDistance).toBe(100); // Verify calculation
      expect(getQualityForDistance(zoomOutDistance)).toBe('low_fidelity');
    });

    it('should prove: zoom OUT increases distance and lowers quality', () => {
      const { getQualityForDistance } = useLODStore.getState();

      // Start at medium distance with normal zoom
      const normalDist = 60; // high_fidelity range
      expect(getQualityForDistance(normalDist)).toBe('high_fidelity');

      // Zoom OUT by factor of 2 (zoom = 0.5)
      // effective distance = 60 / 0.5 = 120
      const zoomedOutDist = normalDist / 0.5;
      expect(zoomedOutDist).toBe(120);
      expect(getQualityForDistance(zoomedOutDist)).toBe('low_fidelity'); // Lower quality!
    });
  });
});
