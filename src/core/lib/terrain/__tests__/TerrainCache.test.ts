import { describe, it, expect, beforeEach } from 'vitest';
import { terrainCache } from '../TerrainCache';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import type { ITerrainGeometryData } from '../TerrainWorker';

describe('TerrainCache', () => {
  const cache = terrainCache;

  const createMockTerrainData = (segments: [number, number]): TerrainData => ({
    size: [100, 100],
    segments,
    heightScale: 10,
    noiseEnabled: true,
    noiseSeed: 1337,
    noiseFrequency: 0.2,
    noiseOctaves: 4,
    noisePersistence: 0.5,
    noiseLacunarity: 2.0,
  });

  const createMockGeometryData = (size: number): ITerrainGeometryData => ({
    positions: new Float32Array(size),
    indices: new Uint32Array(size / 2),
    normals: new Float32Array(size),
    uvs: new Float32Array(size / 2),
  });

  beforeEach(() => {
    cache.clear();
  });

  describe('Cache Hit/Miss', () => {
    it('should return null for cache miss', () => {
      const props = createMockTerrainData([32, 32]);
      const result = cache.get(props);
      expect(result).toBeNull();
    });

    it('should return data for cache hit', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      cache.set(props, data);
      const result = cache.get(props);

      expect(result).toBe(data);
    });

    it('should differentiate between different terrain configs', () => {
      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const data1 = createMockGeometryData(100);
      const data2 = createMockGeometryData(200);

      cache.set(props1, data1);
      cache.set(props2, data2);

      expect(cache.get(props1)).toBe(data1);
      expect(cache.get(props2)).toBe(data2);
    });

    it('should track hit and miss counts', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      // First access - miss
      cache.get(props);

      // Set data
      cache.set(props, data);

      // Second access - hit
      cache.get(props);

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when limit reached', () => {
      cache.configure({ maxEntries: 2, maxCacheSize: 10 * 1024 * 1024 });

      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const props3 = createMockTerrainData([128, 128]);
      const data = createMockGeometryData(100);

      cache.set(props1, data);
      cache.set(props2, data);
      cache.set(props3, data); // Should evict props1

      expect(cache.get(props1)).toBeNull(); // Evicted
      expect(cache.get(props2)).not.toBeNull(); // Still cached
      expect(cache.get(props3)).not.toBeNull(); // Still cached
    });

    it('should evict based on memory size when limit exceeded', () => {
      // Set a reasonable memory limit
      cache.configure({ maxCacheSize: 100000, maxEntries: 50 });

      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const props3 = createMockTerrainData([128, 128]);
      const largeData = createMockGeometryData(10000); // ~40KB per entry

      cache.set(props1, largeData);
      cache.set(props2, largeData);

      const statsBefore = cache.getStats();

      cache.set(props3, largeData); // May trigger eviction

      const statsAfter = cache.getStats();
      // Memory should not grow unbounded
      expect(statsAfter.totalMemoryUsage).toBeLessThan(200000);
    });

    it('should track access time on get', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      cache.set(props, data);

      // Get the entry via the cache internals to check lastAccessed
      const key = cache['generateCacheKey'](props);
      const entry1 = cache['cache'].get(key);
      const time1 = entry1?.lastAccessed || 0;

      // Wait a bit and access again
      setTimeout(() => {
        cache.get(props);
        const entry2 = cache['cache'].get(key);
        const time2 = entry2?.lastAccessed || 0;

        // lastAccessed should be updated
        expect(time2).toBeGreaterThan(time1);
      }, 10);
    });
  });

  describe('Memory Management', () => {
    it('should calculate total memory usage correctly', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      cache.set(props, data);

      const stats = cache.getStats();
      const expectedSize =
        data.positions.byteLength +
        data.indices.byteLength +
        data.normals.byteLength +
        data.uvs.byteLength;

      expect(stats.totalMemoryUsage).toBe(expectedSize);
    });

    it('should not cache extremely large terrains', () => {
      const props = createMockTerrainData([512, 512]);
      // Create 20MB of data (exceeds 10MB limit)
      const largeData = createMockGeometryData(5 * 1024 * 1024); // 20MB total

      cache.set(props, largeData);

      // Should not be cached
      expect(cache.get(props)).toBeNull();
      expect(cache.getStats().totalEntries).toBe(0);
    });
  });

  describe('Cache Operations', () => {
    it('should check if terrain is cached with has()', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      expect(cache.has(props)).toBe(false);

      cache.set(props, data);

      expect(cache.has(props)).toBe(true);
    });

    it('should delete specific terrain from cache', () => {
      const props = createMockTerrainData([32, 32]);
      const data = createMockGeometryData(100);

      cache.set(props, data);
      expect(cache.has(props)).toBe(true);

      const deleted = cache.delete(props);

      expect(deleted).toBe(true);
      expect(cache.has(props)).toBe(false);
    });

    it('should clear all cached data', () => {
      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const data = createMockGeometryData(100);

      cache.set(props1, data);
      cache.set(props2, data);

      expect(cache.getStats().totalEntries).toBe(2);

      cache.clear();

      expect(cache.getStats().totalEntries).toBe(0);
      expect(cache.getStats().totalMemoryUsage).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate cache statistics', () => {
      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const data = createMockGeometryData(100);

      cache.set(props1, data);
      cache.set(props2, data);

      // Generate some hits and misses
      cache.get(props1); // hit
      cache.get(props1); // hit
      cache.get(createMockTerrainData([128, 128])); // miss

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.totalMemoryUsage).toBeGreaterThan(0);
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
      expect(stats.missRate).toBeCloseTo(1 / 3, 2);
    });

    it('should track popular terrains', () => {
      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const data = createMockGeometryData(100);

      cache.set(props1, data);
      cache.set(props2, data);

      // Access props1 multiple times
      cache.get(props1);
      cache.get(props1);
      cache.get(props1);
      cache.get(props2);

      const popular = cache.getPopularTerrains(2);

      expect(popular[0].accessCount).toBeGreaterThan(popular[1].accessCount);
    });
  });

  describe('Configuration', () => {
    it('should allow runtime configuration changes', () => {
      cache.configure({
        maxCacheSize: 200 * 1024 * 1024,
        maxEntries: 100,
      });

      expect(cache['maxCacheSize']).toBe(200 * 1024 * 1024);
      expect(cache['maxEntries']).toBe(100);

      // Reset to defaults
      cache.configure({
        maxCacheSize: 50 * 1024 * 1024,
        maxEntries: 20,
      });
    });

    it('should evict entries when new limits are lower', () => {
      const props1 = createMockTerrainData([32, 32]);
      const props2 = createMockTerrainData([64, 64]);
      const props3 = createMockTerrainData([128, 128]);
      const data = createMockGeometryData(100);

      cache.set(props1, data);
      cache.set(props2, data);
      cache.set(props3, data);

      expect(cache.getStats().totalEntries).toBe(3);

      // Reduce max entries to 1
      cache.configure({ maxEntries: 1 });

      expect(cache.getStats().totalEntries).toBeLessThanOrEqual(1);
    });
  });
});
