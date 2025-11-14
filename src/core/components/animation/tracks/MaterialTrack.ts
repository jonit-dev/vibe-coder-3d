import type { ITrack } from './TrackTypes';
import { findKeyframeRange, getNormalizedTime } from './TrackTypes';
import { getEasingFunction } from '../curves/Easing';
import { lerp } from '../curves/Interpolators';

/**
 * Material property types that can be animated
 */
export type MaterialProperty = 'opacity' | 'emissiveIntensity' | 'metalness' | 'roughness';

/**
 * Evaluate material track at given time
 * Returns a map of material properties to values
 */
export function evaluateMaterialTrack(
  track: ITrack,
  time: number
): Record<string, number> {
  const { prev, next } = findKeyframeRange(track.keyframes, time);

  if (!prev && !next) {
    return {};
  }

  if (!next || prev === next) {
    return prev!.value as Record<string, number>;
  }

  if (!prev) {
    return next.value as Record<string, number>;
  }

  const t = getNormalizedTime(prev, next, time);
  const easingFn = getEasingFunction(next.easing, next.easingArgs);
  const easedT = easingFn(t);

  const prevValue = prev.value as Record<string, number>;
  const nextValue = next.value as Record<string, number>;

  // Interpolate all material properties
  const result: Record<string, number> = {};
  const allKeys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);

  for (const key of allKeys) {
    const prevProp = prevValue[key] ?? 0;
    const nextProp = nextValue[key] ?? 0;
    result[key] = lerp(prevProp, nextProp, easedT);
  }

  return result;
}
