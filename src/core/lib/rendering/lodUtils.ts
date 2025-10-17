import type { LODQuality } from '@core/state/lodStore';

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
 * Get all LOD paths for a model
 */
export function getAllLODPaths(basePath: string): Record<LODQuality, string> {
  return {
    original: basePath,
    high_fidelity: getLODPath(basePath, 'high_fidelity'),
    low_fidelity: getLODPath(basePath, 'low_fidelity'),
  };
}
