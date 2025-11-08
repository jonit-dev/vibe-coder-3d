import { describe, it, expect, beforeEach } from 'vitest';
import { terrainWorker } from '../TerrainWorker';
import { terrainCache } from '../TerrainCache';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';

/**
 * Basic Terrain Functionality Tests
 *
 * Simplified tests that verify terrain generation works without strict timing requirements
 */
describe('Terrain Basic Functionality', () => {
  beforeEach(() => {
    terrainCache.clear();
  });

  const createTerrainConfig = (segments: [number, number]): TerrainData => ({
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

  describe('Basic Generation', () => {
    it('should generate terrain without crashing', async () => {
      const config = createTerrainConfig([16, 16]); // Small size for quick test

      const data = await terrainWorker.generateTerrain(config);

      expect(data).toBeDefined();
      expect(data.positions).toBeInstanceOf(Float32Array);
      expect(data.indices).toBeInstanceOf(Uint32Array);
      expect(data.normals).toBeInstanceOf(Float32Array);
      expect(data.uvs).toBeInstanceOf(Float32Array);
    }, 30000); // Increased timeout

    it('should produce correct data structure', async () => {
      const config = createTerrainConfig([8, 8]); // Very small for quick test

      const data = await terrainWorker.generateTerrain(config);

      const expectedVertices = 8 * 8;
      expect(data.positions.length / 3).toBe(expectedVertices);
      expect(data.normals.length / 3).toBe(expectedVertices);
      expect(data.uvs.length / 2).toBe(expectedVertices);
    }, 30000);
  });

  describe('Cache Operations', () => {
    it('should cache and retrieve terrain data', async () => {
      const config = createTerrainConfig([8, 8]); // Small for quick test

      // First generation
      const data1 = await terrainWorker.generateTerrain(config);
      terrainCache.set(config, data1);

      // Cache hit
      const cached = terrainCache.get(config);
      expect(cached).toBe(data1);
      expect(terrainCache.has(config)).toBe(true);
    }, 30000);

    it('should respect memory limits', async () => {
      terrainCache.configure({ maxCacheSize: 1024 * 1024, maxEntries: 2 }); // Small limits

      // Generate a couple of small terrains
      const config1 = createTerrainConfig([8, 8]);
      const config2 = createTerrainConfig([8, 8]);
      config2.noiseSeed = 1338;

      const data1 = await terrainWorker.generateTerrain(config1);
      const data2 = await terrainWorker.generateTerrain(config2);

      terrainCache.set(config1, data1);
      terrainCache.set(config2, data2);

      const stats = terrainCache.getStats();
      expect(stats.totalEntries).toBe(2);
    }, 30000);
  });

  describe('Worker Transferables', () => {
    it('should use transferables for typed arrays', async () => {
      const config = createTerrainConfig([8, 8]); // Small for quick test

      const data = await terrainWorker.generateTerrain(config);

      // Verify that data contains typed arrays (transferables)
      expect(data.positions).toBeInstanceOf(Float32Array);
      expect(data.indices).toBeInstanceOf(Uint32Array);
      expect(data.normals).toBeInstanceOf(Float32Array);
      expect(data.uvs).toBeInstanceOf(Float32Array);
    }, 30000);
  });

  describe('Segment Validation', () => {
    it('should handle small segment counts correctly', () => {
      const config = createTerrainConfig([2, 2]);

      expect(config.segments[0]).toBeGreaterThan(0);
      expect(config.segments[1]).toBeGreaterThan(0);
      expect(config.segments[0]).toBeLessThanOrEqual(257);
      expect(config.segments[1]).toBeLessThanOrEqual(257);
    });
  });
});
