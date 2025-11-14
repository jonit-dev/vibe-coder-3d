import type { ITrack } from './TrackTypes';
import { findKeyframeRange, getNormalizedTime } from './TrackTypes';
import { getEasingFunction } from '../curves/Easing';
import { lerp } from '../curves/Interpolators';

/**
 * Evaluate morph track at given time
 * Returns a map of morph target names to weights
 */
export function evaluateMorphTrack(
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

  // Interpolate all morph targets
  const result: Record<string, number> = {};
  const allKeys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);

  for (const key of allKeys) {
    const prevWeight = prevValue[key] ?? 0;
    const nextWeight = nextValue[key] ?? 0;
    result[key] = lerp(prevWeight, nextWeight, easedT);
  }

  return result;
}
