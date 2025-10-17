import { describe, it, expect, beforeEach } from 'vitest';
import { lodManager, type LODQuality } from '../LODManager';

describe('LODManager', () => {
  beforeEach(() => {
    // Reset to default state before each test
    lodManager.setQuality('original');
    lodManager.setAutoSwitch(false);
    lodManager.setDistanceThresholds(50, 100);
  });

  describe('Quality Management', () => {
    it('should have default quality as original', () => {
      expect(lodManager.getQuality()).toBe('original');
    });

    it('should set and get quality', () => {
      lodManager.setQuality('high_fidelity');
      expect(lodManager.getQuality()).toBe('high_fidelity');

      lodManager.setQuality('low_fidelity');
      expect(lodManager.getQuality()).toBe('low_fidelity');

      lodManager.setQuality('original');
      expect(lodManager.getQuality()).toBe('original');
    });

    it('should update config when quality changes', () => {
      lodManager.setQuality('low_fidelity');
      const config = lodManager.getConfig();
      expect(config.quality).toBe('low_fidelity');
    });
  });

  describe('Auto-Switch', () => {
    it('should have auto-switch disabled by default', () => {
      const config = lodManager.getConfig();
      expect(config.autoSwitch).toBe(false);
    });

    it('should enable/disable auto-switch', () => {
      lodManager.setAutoSwitch(true);
      expect(lodManager.getConfig().autoSwitch).toBe(true);

      lodManager.setAutoSwitch(false);
      expect(lodManager.getConfig().autoSwitch).toBe(false);
    });

    it('should return current quality when auto-switch is disabled', () => {
      lodManager.setQuality('low_fidelity');
      lodManager.setAutoSwitch(false);

      expect(lodManager.getQualityForDistance(10)).toBe('low_fidelity');
      expect(lodManager.getQualityForDistance(75)).toBe('low_fidelity');
      expect(lodManager.getQualityForDistance(150)).toBe('low_fidelity');
    });

    it('should switch quality based on distance when enabled', () => {
      lodManager.setAutoSwitch(true);
      lodManager.setDistanceThresholds(50, 100);

      expect(lodManager.getQualityForDistance(25)).toBe('original');
      expect(lodManager.getQualityForDistance(49)).toBe('original');
      expect(lodManager.getQualityForDistance(50)).toBe('high_fidelity');
      expect(lodManager.getQualityForDistance(75)).toBe('high_fidelity');
      expect(lodManager.getQualityForDistance(99)).toBe('high_fidelity');
      expect(lodManager.getQualityForDistance(100)).toBe('low_fidelity');
      expect(lodManager.getQualityForDistance(500)).toBe('low_fidelity');
    });

    it('should update distance thresholds', () => {
      lodManager.setDistanceThresholds(100, 200);
      const config = lodManager.getConfig();
      expect(config.distanceThresholds).toEqual({ high: 100, low: 200 });
    });

    it('should use custom thresholds for distance-based switching', () => {
      lodManager.setAutoSwitch(true);
      lodManager.setDistanceThresholds(20, 80);

      expect(lodManager.getQualityForDistance(10)).toBe('original');
      expect(lodManager.getQualityForDistance(50)).toBe('high_fidelity');
      expect(lodManager.getQualityForDistance(100)).toBe('low_fidelity');
    });
  });

  describe('Path Resolution', () => {
    it('should return original path for original quality', () => {
      const basePath = '/assets/models/Character/glb/Character.glb';
      lodManager.setQuality('original');

      const result = lodManager.getLODPath(basePath);
      expect(result).toBe(basePath);
    });

    it('should generate high_fidelity path', () => {
      const basePath = '/assets/models/Character/glb/Character.glb';
      lodManager.setQuality('high_fidelity');

      const result = lodManager.getLODPath(basePath);
      expect(result).toBe('/assets/models/Character/lod/Character.high_fidelity.glb');
    });

    it('should generate low_fidelity path', () => {
      const basePath = '/assets/models/Character/glb/Character.glb';
      lodManager.setQuality('low_fidelity');

      const result = lodManager.getLODPath(basePath);
      expect(result).toBe('/assets/models/Character/lod/Character.low_fidelity.glb');
    });

    it('should handle paths with multiple dots', () => {
      const basePath = '/assets/models/My.Model.Name/glb/My.Model.Name.glb';
      lodManager.setQuality('high_fidelity');

      const result = lodManager.getLODPath(basePath);
      expect(result).toBe('/assets/models/My.Model.Name/lod/My.Model.Name.high_fidelity.glb');
    });

    it('should allow overriding quality in getLODPath', () => {
      const basePath = '/assets/models/Character/glb/Character.glb';
      lodManager.setQuality('original');

      expect(lodManager.getLODPath(basePath, 'low_fidelity')).toBe(
        '/assets/models/Character/lod/Character.low_fidelity.glb',
      );

      expect(lodManager.getLODPath(basePath, 'high_fidelity')).toBe(
        '/assets/models/Character/lod/Character.high_fidelity.glb',
      );

      expect(lodManager.getLODPath(basePath, 'original')).toBe(basePath);
    });

    it('should return all LOD paths', () => {
      const basePath = '/assets/models/Character/glb/Character.glb';
      const paths = lodManager.getAllLODPaths(basePath);

      expect(paths).toEqual({
        original: '/assets/models/Character/glb/Character.glb',
        high_fidelity: '/assets/models/Character/lod/Character.high_fidelity.glb',
        low_fidelity: '/assets/models/Character/lod/Character.low_fidelity.glb',
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = lodManager;
      const instance2 = lodManager;
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across references', () => {
      lodManager.setQuality('high_fidelity');
      const config = lodManager.getConfig();
      expect(config.quality).toBe('high_fidelity');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero distance', () => {
      lodManager.setAutoSwitch(true);
      expect(lodManager.getQualityForDistance(0)).toBe('original');
    });

    it('should handle negative distance', () => {
      lodManager.setAutoSwitch(true);
      expect(lodManager.getQualityForDistance(-10)).toBe('original');
    });

    it('should handle very large distance', () => {
      lodManager.setAutoSwitch(true);
      expect(lodManager.getQualityForDistance(999999)).toBe('low_fidelity');
    });

    it('should handle paths without glb directory', () => {
      const basePath = '/assets/models/Character.glb';
      const result = lodManager.getLODPath(basePath, 'high_fidelity');
      expect(result).toBe('/assets/models/Character.high_fidelity.glb');
    });

    it('should handle paths with different extensions', () => {
      const basePath = '/assets/models/Character/glb/Character.gltf';
      const result = lodManager.getLODPath(basePath, 'high_fidelity');
      expect(result).toBe('/assets/models/Character/lod/Character.high_fidelity.gltf');
    });
  });

  describe('Config Management', () => {
    it('should return complete config', () => {
      lodManager.setQuality('high_fidelity');
      lodManager.setAutoSwitch(true);
      lodManager.setDistanceThresholds(30, 90);

      const config = lodManager.getConfig();

      expect(config).toEqual({
        quality: 'high_fidelity',
        autoSwitch: true,
        distanceThresholds: { high: 30, low: 90 },
      });
    });

    it('should return a copy of config (not reference)', () => {
      const config1 = lodManager.getConfig();
      const config2 = lodManager.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same values
    });
  });
});
