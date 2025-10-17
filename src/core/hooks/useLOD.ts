import { useLODStore } from '@core/state/lodStore';
import { getLODPath } from '@core/lib/rendering/lodUtils';
import type { LODQuality } from '@core/state/lodStore';

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
  // Subscribe to LOD state
  const globalQuality = useLODStore((state) => state.quality);
  const autoSwitch = useLODStore((state) => state.autoSwitch);
  const getQualityForDistance = useLODStore((state) => state.getQualityForDistance);

  // Determine effective quality
  let effectiveQuality: LODQuality;

  if (overrideQuality) {
    // Priority 1: Explicit override
    effectiveQuality = overrideQuality;
  } else if (autoSwitch && distance !== undefined) {
    // Priority 2: Distance-based (if auto-switch enabled)
    effectiveQuality = getQualityForDistance(distance);
  } else {
    // Priority 3: Global quality
    effectiveQuality = globalQuality;
  }

  // Resolve path
  return getLODPath(basePath, effectiveQuality);
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
