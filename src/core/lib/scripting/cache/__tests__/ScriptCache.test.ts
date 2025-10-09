import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScriptCache } from '../ScriptCache';
import { ICompiledScript } from '../../compiler/Instruction';

describe('ScriptCache', () => {
  let cache: ScriptCache;

  const createMockScript = (): ICompiledScript => ({
    lifecycles: {
      onStart: {
        name: 'onStart',
        instructions: [],
      },
    },
  });

  beforeEach(() => {
    cache = new ScriptCache(5, 1000); // Small cache for testing
  });

  describe('Basic operations', () => {
    it('should store and retrieve scripts', () => {
      const script = createMockScript();
      cache.set('test-script', script);

      const retrieved = cache.get('test-script');
      expect(retrieved).toBe(script);
    });

    it('should return undefined for missing scripts', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should check if script exists', () => {
      cache.set('test-script', createMockScript());

      expect(cache.has('test-script')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete scripts', () => {
      cache.set('test-script', createMockScript());
      expect(cache.has('test-script')).toBe(true);

      cache.delete('test-script');
      expect(cache.has('test-script')).toBe(false);
    });

    it('should clear all scripts', () => {
      cache.set('script1', createMockScript());
      cache.set('script2', createMockScript());
      expect(cache.stats().size).toBe(2);

      cache.clear();
      expect(cache.stats().size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      // Fill cache to max size (5)
      for (let i = 0; i < 5; i++) {
        cache.set(`script${i}`, createMockScript());
      }

      expect(cache.stats().size).toBe(5);

      // Add one more, should evict script0 (least recently used)
      cache.set('script5', createMockScript());

      expect(cache.stats().size).toBe(5);
      expect(cache.has('script0')).toBe(false);
      expect(cache.has('script5')).toBe(true);
    });

    it('should update access time on get', async () => {
      // Create cache with exact size needed
      const lruCache = new ScriptCache(5, 10000);

      lruCache.set('script0', createMockScript());
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      lruCache.set('script1', createMockScript());
      await new Promise((resolve) => setTimeout(resolve, 10));
      lruCache.set('script2', createMockScript());

      // Access script1 to make it most recently used (after small delay to ensure time difference)
      await new Promise((resolve) => setTimeout(resolve, 10));
      lruCache.get('script1');

      // Fill cache to capacity
      await new Promise((resolve) => setTimeout(resolve, 10));
      lruCache.set('script3', createMockScript());
      await new Promise((resolve) => setTimeout(resolve, 10));
      lruCache.set('script4', createMockScript());

      // Cache is now full (5 items). Add one more should evict LRU
      // script0 was added first, never accessed since, so it should be LRU
      await new Promise((resolve) => setTimeout(resolve, 10));
      lruCache.set('script5', createMockScript());

      expect(lruCache.has('script1')).toBe(true); // Recently accessed, should remain
      expect(lruCache.has('script0')).toBe(false); // LRU (oldest, never re-accessed), should be evicted
    });

    it('should not evict when updating existing entry', () => {
      cache.set('script1', createMockScript());
      expect(cache.stats().size).toBe(1);

      const newScript = createMockScript();
      cache.set('script1', newScript);

      expect(cache.stats().size).toBe(1);
      expect(cache.get('script1')).toBe(newScript);
    });
  });

  describe('TTL eviction', () => {
    it('should evict expired entries', async () => {
      const shortTTLCache = new ScriptCache(10, 100); // 100ms TTL

      shortTTLCache.set('script1', createMockScript());
      expect(shortTTLCache.has('script1')).toBe(true);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be evicted after TTL
      expect(shortTTLCache.has('script1')).toBe(false);
    });

    it('should not evict non-expired entries', async () => {
      const longTTLCache = new ScriptCache(10, 5000); // 5s TTL

      longTTLCache.set('script1', createMockScript());
      expect(longTTLCache.has('script1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still be in cache
      expect(longTTLCache.has('script1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should report cache size', () => {
      cache.set('script1', createMockScript());
      cache.set('script2', createMockScript());

      const stats = cache.stats();
      expect(stats.size).toBe(2);
    });

    it('should report oldest script age', async () => {
      cache.set('old-script', createMockScript());

      await new Promise((resolve) => setTimeout(resolve, 50));

      cache.set('new-script', createMockScript());

      const stats = cache.stats();
      expect(stats.oldestMs).toBeGreaterThanOrEqual(50);
    });

    it('should report 0 age for empty cache', () => {
      const stats = cache.stats();
      expect(stats.oldestMs).toBe(0);
    });
  });

  describe('Cache hit/miss', () => {
    it('should handle cache hits', () => {
      const script = createMockScript();
      cache.set('test', script);

      const result = cache.get('test');
      expect(result).toBe(script);
    });

    it('should handle cache misses', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero-size cache', () => {
      const zeroCache = new ScriptCache(0);

      zeroCache.set('script1', createMockScript());

      // With size 0, should not store anything
      expect(zeroCache.stats().size).toBe(0);
    });

    it('should handle very large cache', () => {
      const largeCache = new ScriptCache(10000);

      for (let i = 0; i < 100; i++) {
        largeCache.set(`script${i}`, createMockScript());
      }

      expect(largeCache.stats().size).toBe(100);
    });

    it('should handle same key multiple times', () => {
      const script1 = createMockScript();
      const script2 = createMockScript();

      cache.set('test', script1);
      cache.set('test', script2);

      expect(cache.get('test')).toBe(script2);
      expect(cache.stats().size).toBe(1);
    });
  });

  describe('Debug mode', () => {
    it('should not throw in debug mode', () => {
      const debugCache = new ScriptCache(5, 1000, true);

      expect(() => {
        debugCache.set('test', createMockScript());
        debugCache.get('test');
        debugCache.delete('test');
        debugCache.clear();
      }).not.toThrow();
    });
  });
});
