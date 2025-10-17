import type { LODQuality } from '@core/state/lodStore';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('lodUtils');

// Throttle logging to prevent spam
let lastLogTime = 0;
let lastLoggedPath = '';
const LOG_THROTTLE_MS = 2000; // Only log once per 2 seconds for same path

/**
 * LOD Path Utilities - Pure functions for LOD path resolution
 * Following SRP: Separated from state management
 */

/**
 * Check if a path already contains an LOD quality suffix
 */
export function hasLODQuality(path: string): boolean {
  return path.includes('.high_fidelity.') || path.includes('.low_fidelity.');
}

/**
 * Extract quality from a path if it exists
 */
export function extractQualityFromPath(path: string): LODQuality | null {
  if (path.includes('.high_fidelity.')) return 'high_fidelity';
  if (path.includes('.low_fidelity.')) return 'low_fidelity';
  return null;
}

/**
 * Get LOD path for a given base path and quality
 * Pure function with no side effects
 */
export function getLODPath(basePath: string, quality: LODQuality): string {
  const result = _getLODPathInternal(basePath, quality);

  // Throttled logging - only log if path changed or enough time passed
  const now = Date.now();
  const pathKey = `${basePath}:${quality}`;
  if (pathKey !== lastLoggedPath || now - lastLogTime > LOG_THROTTLE_MS) {
    lastLogTime = now;
    lastLoggedPath = pathKey;
    logger.info('📦 LOD path → ' + quality, { basePath, result });
  }

  return result;
}

function _getLODPathInternal(basePath: string, quality: LODQuality): string {
  // Original quality = base path unchanged
  if (quality === 'original') {
    return basePath;
  }

  // If path already has a quality suffix, replace it
  const currentQuality = extractQualityFromPath(basePath);
  if (currentQuality) {
    return basePath
      .replace('.high_fidelity.', `.${quality}.`)
      .replace('.low_fidelity.', `.${quality}.`);
  }

  // Determine path pattern and transform accordingly
  let path: string;

  if (basePath.includes('/glb/')) {
    // Pattern: /models/Model/glb/Model.glb -> /models/Model/lod/Model.quality.glb
    path = basePath.replace('/glb/', '/lod/');
  } else if (basePath.includes('/lod/')) {
    // Already in lod directory
    path = basePath;
  } else {
    // Pattern: /models/Model/Model.glb -> /models/Model/lod/Model.quality.glb
    const lastSlash = basePath.lastIndexOf('/');
    const dir = basePath.substring(0, lastSlash);
    const filename = basePath.substring(lastSlash + 1);
    path = `${dir}/lod/${filename}`;
  }

  // Add quality suffix before extension
  const ext = path.substring(path.lastIndexOf('.'));
  const withoutExt = path.substring(0, path.lastIndexOf('.'));
  return `${withoutExt}.${quality}${ext}`;
}

/**
 * Normalize a path that might be an LOD variant back to its original form
 * E.g., '/assets/models/Model/lod/Model.high_fidelity.glb' -> '/assets/models/Model/glb/Model.glb'
 */
export function normalizeToOriginalPath(path: string): string {
  // If already an original path (no LOD suffix), return as-is
  if (!hasLODQuality(path)) {
    return path;
  }

  // Remove quality suffix
  const withoutQuality = path.replace('.high_fidelity.', '.').replace('.low_fidelity.', '.');

  // Replace /lod/ with /glb/ if present
  if (withoutQuality.includes('/lod/')) {
    return withoutQuality.replace('/lod/', '/glb/');
  }

  return withoutQuality;
}

/**
 * Get all LOD paths for a model
 */
export function getAllLODPaths(basePath: string): Record<LODQuality, string> {
  // Normalize to ensure we start from the original path
  const originalPath = normalizeToOriginalPath(basePath);

  return {
    original: originalPath,
    high_fidelity: getLODPath(originalPath, 'high_fidelity'),
    low_fidelity: getLODPath(originalPath, 'low_fidelity'),
  };
}
