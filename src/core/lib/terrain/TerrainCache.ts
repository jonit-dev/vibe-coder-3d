import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import type { ITerrainGeometryData } from './TerrainWorker';

interface ICachedTerrain {
  data: ITerrainGeometryData;
  lastAccessed: number;
  accessCount: number;
  size: number; // Memory size in bytes
}

interface ITerrainCacheStats {
  totalEntries: number;
  totalMemoryUsage: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

class TerrainCacheManager {
  private cache = new Map<string, ICachedTerrain>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB max cache size
  private maxEntries = 20; // Max number of cached terrains
  private hitCount = 0;
  private missCount = 0;

  // Generate cache key from terrain parameters
  private generateCacheKey(props: TerrainData): string {
    const {
      size,
      segments,
      heightScale,
      noiseEnabled,
      noiseSeed,
      noiseFrequency,
      noiseOctaves,
      noisePersistence,
      noiseLacunarity,
    } = props;

    // Create a deterministic key from all terrain parameters
    return [
      size[0],
      size[1],
      segments[0],
      segments[1],
      heightScale,
      noiseEnabled ? 1 : 0,
      noiseSeed,
      noiseFrequency,
      noiseOctaves,
      noisePersistence,
      noiseLacunarity,
    ].join('|');
  }

  // Calculate memory size of terrain data
  private calculateSize(data: ITerrainGeometryData): number {
    return (
      data.positions.byteLength +
      data.indices.byteLength +
      data.normals.byteLength +
      data.uvs.byteLength
    );
  }

  // Get total memory usage
  getTotalMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  // Remove least recently used entries to make space
  private evictLRU(requiredSpace: number) {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed,
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace && this.cache.size <= this.maxEntries) {
        break;
      }

      this.cache.delete(key);
      freedSpace += entry.size;

      // Log eviction for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Evicted terrain cache entry: ${key} (${entry.size} bytes)`);
      }
    }
  }

  // Store terrain data in cache
  set(props: TerrainData, data: ITerrainGeometryData) {
    const key = this.generateCacheKey(props);
    const size = this.calculateSize(data);

    // Don't cache extremely large terrains (> 10MB)
    if (size > 10 * 1024 * 1024) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 Skipping cache: terrain too large', size / 1024 / 1024, 'MB');
      }
      return;
    }

    // Evict entries if necessary
    const currentUsage = this.getTotalMemoryUsage();
    const requiredSpace = currentUsage + size - this.maxCacheSize;

    if (requiredSpace > 0 || this.cache.size >= this.maxEntries) {
      this.evictLRU(Math.max(requiredSpace, size));
    }

    // Store in cache
    this.cache.set(key, {
      data,
      lastAccessed: Date.now(),
      accessCount: 1,
      size,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Cached terrain: ${key} (${size / 1024}KB)`);
    }
  }

  // Retrieve terrain data from cache
  get(props: TerrainData): ITerrainGeometryData | null {
    const key = this.generateCacheKey(props);
    const entry = this.cache.get(key);

    if (entry) {
      // Update access statistics
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.hitCount++;

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cache hit: ${key}`);
      }

      return entry.data;
    }

    this.missCount++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Cache miss: ${key}`);
    }

    return null;
  }

  // Check if terrain is cached
  has(props: TerrainData): boolean {
    const key = this.generateCacheKey(props);
    return this.cache.has(key);
  }

  // Clear specific terrain from cache
  delete(props: TerrainData): boolean {
    const key = this.generateCacheKey(props);
    return this.cache.delete(key);
  }

  // Clear all cached terrain data
  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Cleared terrain cache');
    }
  }

  // Get cache statistics
  getStats(): ITerrainCacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const entries = Array.from(this.cache.values());

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage: this.getTotalMemoryUsage(),
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.lastAccessed)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.lastAccessed)) : 0,
    };
  }

  // Get most frequently accessed terrains
  getPopularTerrains(limit = 5): Array<{ key: string; accessCount: number; size: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  // Log cache statistics to console
  logStats() {
    if (process.env.NODE_ENV !== 'development') return;

    const stats = this.getStats();
    const memoryMB = stats.totalMemoryUsage / 1024 / 1024;

    console.group('🏔️ Terrain Cache Statistics');
    console.log(`📊 Cache Entries: ${stats.totalEntries}/${this.maxEntries}`);
    console.log(
      `🧠 Memory Usage: ${memoryMB.toFixed(1)}MB/${(this.maxCacheSize / 1024 / 1024).toFixed(0)}MB`,
    );
    console.log(`✅ Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`❌ Miss Rate: ${(stats.missRate * 100).toFixed(1)}%`);

    if (stats.totalEntries > 0) {
      const popular = this.getPopularTerrains(3);
      console.log('🔥 Most Popular:');
      popular.forEach((terrain, i) => {
        console.log(
          `  ${i + 1}. ${terrain.key} (${terrain.accessCount} hits, ${terrain.size / 1024}KB)`,
        );
      });
    }

    console.groupEnd();
  }

  // Configure cache settings
  configure(options: { maxCacheSize?: number; maxEntries?: number }) {
    if (options.maxCacheSize) {
      this.maxCacheSize = options.maxCacheSize;
    }
    if (options.maxEntries) {
      this.maxEntries = options.maxEntries;
    }

    // Evict entries if new limits are exceeded
    if (this.getTotalMemoryUsage() > this.maxCacheSize || this.cache.size > this.maxEntries) {
      this.evictLRU(0);
    }
  }

  // Preload commonly used terrain configurations
  async preloadCommonTerrains(
    presets: TerrainData[],
    generateFunc: (props: TerrainData) => Promise<ITerrainGeometryData>,
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Preloading terrain presets...');
    }

    const promises = presets.map(async (preset) => {
      if (!this.has(preset)) {
        try {
          const data = await generateFunc(preset);
          this.set(preset, data);
        } catch (error) {
          console.error('Failed to preload terrain preset:', error);
        }
      }
    });

    await Promise.all(promises);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Terrain preloading complete');
      this.logStats();
    }
  }
}

// Singleton instance
export const terrainCache = new TerrainCacheManager();
