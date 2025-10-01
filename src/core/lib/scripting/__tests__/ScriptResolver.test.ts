/**
 * Unit tests for ScriptResolver
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveScript,
  clearScriptCache,
  invalidateScriptCache,
  getScriptCacheStats,
} from '../ScriptResolver';
import type { IScriptData } from '../ScriptResolver';

// Mock fetch
global.fetch = vi.fn();

describe('ScriptResolver', () => {
  beforeEach(() => {
    clearScriptCache();
    vi.clearAllMocks();
  });

  describe('resolveScript', () => {
    it('should resolve inline script when no scriptRef is provided', async () => {
      const data: IScriptData = {
        code: 'function onUpdate() { console.log("test"); }',
      };

      const result = await resolveScript(1, data);

      expect(result.origin).toBe('inline');
      expect(result.code).toBe(data.code);
      expect(result.path).toBeUndefined();
      expect(result.hash).toBeUndefined();
    });

    it('should resolve inline script when scriptRef source is inline', async () => {
      const data: IScriptData = {
        code: 'function onUpdate() { console.log("test"); }',
        scriptRef: {
          scriptId: 'test-script',
          source: 'inline',
        },
      };

      const result = await resolveScript(1, data);

      expect(result.origin).toBe('inline');
      expect(result.code).toBe(data.code);
    });

    it('should fetch external script when scriptRef source is external', async () => {
      const externalCode = 'function onUpdate() { console.log("external"); }';
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          code: externalCode,
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        code: 'fallback code',
        scriptRef: {
          scriptId: 'test.external-script',
          source: 'external',
          path: './src/game/scripts/test.external-script.ts',
          codeHash: 'abc123',
        },
      };

      const result = await resolveScript(1, data);

      expect(result.origin).toBe('external');
      expect(result.code).toBe(externalCode);
      expect(result.path).toBe(data.scriptRef?.path);
      expect(result.hash).toBe(data.scriptRef?.codeHash);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/script/load?id=test.external-script',
      );
    });

    it('should cache external scripts', async () => {
      const externalCode = 'function onUpdate() { console.log("cached"); }';
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          code: externalCode,
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        scriptRef: {
          scriptId: 'test.cached-script',
          source: 'external',
          codeHash: 'def456',
        },
      };

      // First call - should fetch
      const result1 = await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call with same hash - should use cache
      const result2 = await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
      expect(result2.code).toBe(externalCode);
    });

    it('should refetch when hash changes', async () => {
      const mockResponse1 = {
        ok: true,
        json: async () => ({
          success: true,
          code: 'version 1',
        }),
      };

      const mockResponse2 = {
        ok: true,
        json: async () => ({
          success: true,
          code: 'version 2',
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const data1: IScriptData = {
        scriptRef: {
          scriptId: 'test.versioned-script',
          source: 'external',
          codeHash: 'hash1',
        },
      };

      const result1 = await resolveScript(1, data1);
      expect(result1.code).toBe('version 1');

      const data2: IScriptData = {
        scriptRef: {
          scriptId: 'test.versioned-script',
          source: 'external',
          codeHash: 'hash2', // Different hash
        },
      };

      const result2 = await resolveScript(1, data2);
      expect(result2.code).toBe('version 2');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback to inline code when external fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        code: 'fallback inline code',
        scriptRef: {
          scriptId: 'test.missing-script',
          source: 'external',
        },
      };

      const result = await resolveScript(1, data);

      expect(result.origin).toBe('inline');
      expect(result.code).toBe(data.code);
    });

    it('should throw error when external fetch fails and no fallback', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        scriptRef: {
          scriptId: 'test.missing-script',
          source: 'external',
        },
      };

      await expect(resolveScript(1, data)).rejects.toThrow();
    });

    it('should return empty code when no code is provided', async () => {
      const data: IScriptData = {};

      const result = await resolveScript(1, data);

      expect(result.origin).toBe('inline');
      expect(result.code).toBe('');
    });
  });

  describe('clearScriptCache', () => {
    it('should clear the cache', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          code: 'test code',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        scriptRef: {
          scriptId: 'test.cached-script',
          source: 'external',
          codeHash: 'abc',
        },
      };

      // Populate cache
      await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearScriptCache();

      // Should fetch again
      await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateScriptCache', () => {
    it('should invalidate specific script', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          code: 'test code',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        scriptRef: {
          scriptId: 'test.specific-script',
          source: 'external',
          codeHash: 'abc',
        },
      };

      // Populate cache
      await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Invalidate
      invalidateScriptCache('test.specific-script');

      // Should fetch again
      await resolveScript(1, data);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getScriptCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats1 = getScriptCacheStats();
      expect(stats1.size).toBe(0);
      expect(stats1.entries).toHaveLength(0);

      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          code: 'test code',
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const data: IScriptData = {
        scriptRef: {
          scriptId: 'test.stats-script',
          source: 'external',
          codeHash: 'abc',
        },
      };

      await resolveScript(1, data);

      const stats2 = getScriptCacheStats();
      expect(stats2.size).toBe(1);
      expect(stats2.entries).toHaveLength(1);
      expect(stats2.entries[0].scriptId).toBe('test.stats-script');
      expect(stats2.entries[0].hash).toBe('abc');
      expect(stats2.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });
});