import { useLODStore } from '@core/state/lodStore';
import { getLODPath, normalizeToOriginalPath } from '@core/lib/rendering/lodUtils';
import type { LODQuality } from '@core/state/lodStore';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useLOD');

export interface IUseLODOptions {
  basePath: string;
  distance?: number;
  quality?: LODQuality; // Optional override
}

/**
 * Hook to get LOD-aware model path
 * Simplified version using Zustand for reactivity
 *
 * Usage:
 * - const lodPath = useLOD({ basePath: modelPath });
 * - const lodPath = useLOD({ basePath: modelPath, quality: 'high_fidelity' });
 * - const lodPath = useLOD({ basePath: modelPath, distance: 50 });
 */
export function useLOD({ basePath, distance, quality: overrideQuality }: IUseLODOptions): string {
  // Subscribe to all LOD state to ensure reactivity
  const globalQuality = useLODStore((state) => state.quality);
  const autoSwitch = useLODStore((state) => state.autoSwitch);
  const distanceThresholds = useLODStore((state) => state.distanceThresholds);
  const getQualityForDistance = useLODStore((state) => state.getQualityForDistance);

  // CRITICAL: Normalize basePath to original form to prevent LOD path feedback loops
  // If basePath is already an LOD variant (e.g., ends with .high_fidelity.glb),
  // convert it back to the original path before resolving
  const originalBasePath = normalizeToOriginalPath(basePath);

  // Determine effective quality - recalculates when any dependency changes
  let effectiveQuality: LODQuality;

  if (overrideQuality) {
    // Priority 1: Explicit override
    effectiveQuality = overrideQuality;
    logger.debug('Using override quality', {
      basePath: originalBasePath,
      quality: effectiveQuality,
    });
  } else if (autoSwitch && distance !== undefined) {
    // Priority 2: Distance-based (if auto-switch enabled)
    effectiveQuality = getQualityForDistance(distance);
    logger.debug('Using distance-based quality', {
      basePath: originalBasePath,
      distance: distance.toFixed(2),
      quality: effectiveQuality,
      thresholds: distanceThresholds,
    });
  } else {
    // Priority 3: Global quality
    effectiveQuality = globalQuality;
    logger.debug('Using global quality', {
      basePath: originalBasePath,
      quality: effectiveQuality,
      autoSwitch,
    });
  }

  // Resolve path from the normalized original basePath
  return getLODPath(originalBasePath, effectiveQuality);
}

/**
 * Hook to get current LOD quality
 */
export function useLODQuality(): LODQuality {
  return useLODStore((state) => state.quality);
}

/**
 * Hook to get LOD actions
 */
export function useLODActions() {
  const setQuality = useLODStore((state) => state.setQuality);
  const setAutoSwitch = useLODStore((state) => state.setAutoSwitch);
  const setDistanceThresholds = useLODStore((state) => state.setDistanceThresholds);

  return {
    setQuality,
    setAutoSwitch,
    setDistanceThresholds,
  };
}
