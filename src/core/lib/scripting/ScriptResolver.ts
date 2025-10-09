/**
 * Script Resolver - Resolves script code from external files or inline sources
 */

import { EntityId } from '../ecs/types';
import { IScriptRef } from '../ecs/components/definitions/ScriptComponent';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ScriptResolver');

/**
 * Resolution result containing script code and metadata
 */
export interface IScriptResolution {
  code: string;
  origin: 'external' | 'inline';
  path?: string;
  hash?: string;
}

/**
 * Script data passed to resolver
 */
export interface IScriptData {
  code?: string;
  scriptRef?: IScriptRef;
}

/**
 * In-memory cache for external scripts (dev mode)
 */
const externalScriptCache = new Map<string, { code: string; hash: string; timestamp: number }>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Resolve script code from external file or inline source
 */
export async function resolveScript(
  entityId: EntityId,
  data: IScriptData,
): Promise<IScriptResolution> {
  // If scriptRef is present and source is external, use cached code or fetch
  if (data.scriptRef && data.scriptRef.source === 'external') {
    // If we have inline code, prefer it (already synced by editor)
    if (data.code && data.code.length > 0) {
      return {
        code: data.code,
        origin: 'external',
        path: data.scriptRef.path,
        hash: data.scriptRef.codeHash,
      };
    }

    try {
      // Check cache first
      const cached = externalScriptCache.get(data.scriptRef.scriptId);
      const now = Date.now();

      if (cached && cached.hash === data.scriptRef.codeHash && now - cached.timestamp < CACHE_TTL) {
        logger.debug(`Using cached external script for ${data.scriptRef.scriptId}`);
        return {
          code: cached.code,
          origin: 'external',
          path: data.scriptRef.path,
          hash: cached.hash,
        };
      }

      // Fetch from API in dev mode
      const code = await fetchExternalScript(data.scriptRef.scriptId);

      // Update cache
      if (data.scriptRef.codeHash) {
        externalScriptCache.set(data.scriptRef.scriptId, {
          code,
          hash: data.scriptRef.codeHash,
          timestamp: now,
        });
      }

      return {
        code,
        origin: 'external',
        path: data.scriptRef.path,
        hash: data.scriptRef.codeHash,
      };
    } catch (error) {
      logger.error(`Failed to load external script for entity ${entityId}:`, error);

      // Fallback to inline code if available
      if (data.code) {
        logger.warn(`Falling back to inline code for entity ${entityId}`);
        return {
          code: data.code,
          origin: 'inline',
        };
      }

      throw new Error(
        `Failed to resolve external script "${data.scriptRef.scriptId}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Use inline code
  return {
    code: data.code || '',
    origin: 'inline',
  };
}

/**
 * Fetch external script from API
 */
async function fetchExternalScript(scriptId: string): Promise<string> {
  // In development, use the API endpoint
  if (import.meta.env.DEV) {
    try {
      const response = await fetch(`/api/script/load?id=${encodeURIComponent(scriptId)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Script "${scriptId}" not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.code) {
        throw new Error('Invalid API response');
      }

      return result.code;
    } catch (error) {
      logger.error(`Failed to fetch external script "${scriptId}":`, error);
      throw error;
    }
  }

  // In production, would use bundled scripts
  // For now, throw error in production mode
  throw new Error('External scripts not supported in production mode (bundle not implemented)');
}

/**
 * Clear the script cache
 */
export function clearScriptCache(): void {
  externalScriptCache.clear();
  logger.debug('Script cache cleared');
}

/**
 * Invalidate a specific script in cache
 */
export function invalidateScriptCache(scriptId: string): void {
  externalScriptCache.delete(scriptId);
  logger.debug(`Script cache invalidated for "${scriptId}"`);
}

/**
 * Get cache statistics
 */
export function getScriptCacheStats(): {
  size: number;
  entries: Array<{ scriptId: string; hash: string; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(externalScriptCache.entries()).map(([scriptId, data]) => ({
    scriptId,
    hash: data.hash,
    age: now - data.timestamp,
  }));

  return {
    size: externalScriptCache.size,
    entries,
  };
}
