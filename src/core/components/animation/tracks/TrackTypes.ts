import { z } from 'zod';

/**
 * Track type enumeration
 */
export enum TrackType {
  TRANSFORM_POSITION = 'transform.position',
  TRANSFORM_ROTATION = 'transform.rotation',
  TRANSFORM_SCALE = 'transform.scale',
  MORPH = 'morph',
  MATERIAL = 'material',
  EVENT = 'event',
}

/**
 * Keyframe value types
 */
export type KeyframeValue =
  | number // Single number (scale, morph weight, etc.)
  | [number, number, number] // Vec3 (position, scale)
  | [number, number, number, number] // Quaternion (rotation)
  | Record<string, number>; // Morph target map or material properties

/**
 * Keyframe schema
 */
export const KeyframeSchema = z.object({
  time: z.number().nonnegative(),
  value: z.union([
    z.number(),
    z.tuple([z.number(), z.number(), z.number()]), // vec3
    z.tuple([z.number(), z.number(), z.number(), z.number()]), // quat
    z.record(z.string(), z.number()), // morph map or material props
  ]),
  easing: z
    .union([z.literal('linear'), z.literal('step'), z.literal('bezier'), z.literal('custom')])
    .default('linear'),
  easingArgs: z.array(z.number()).optional(), // bezier control points or custom id
});

export type IKeyframe = z.infer<typeof KeyframeSchema>;

/**
 * Track schema
 */
export const TrackSchema = z.object({
  id: z.string(),
  type: z.enum([
    'transform.position',
    'transform.rotation',
    'transform.scale',
    'morph',
    'material',
    'event',
  ]),
  targetPath: z.string(), // e.g. 'root/Spine' or material path
  keyframes: z.array(KeyframeSchema),
});

export type ITrack = z.infer<typeof TrackSchema>;

/**
 * Helper to sort keyframes by time
 * When times are equal, keeps the original order of the keyframes
 */
export function sortKeyframes(keyframes: IKeyframe[]): IKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

/**
 * Helper to find keyframes around a given time
 */
export function findKeyframeRange(
  keyframes: IKeyframe[],
  time: number,
): { prev: IKeyframe | null; next: IKeyframe | null; index: number } {
  const sorted = sortKeyframes(keyframes);

  if (sorted.length === 0) {
    return { prev: null, next: null, index: -1 };
  }

  // Before first keyframe
  if (time < sorted[0].time) {
    return { prev: null, next: sorted[0], index: 0 };
  }

  // After last keyframe
  if (time > sorted[sorted.length - 1].time) {
    return { prev: sorted[sorted.length - 1], next: null, index: sorted.length - 1 };
  }

  // Find exact match or range
  for (let i = 0; i < sorted.length; i++) {
    // Exact match
    if (time === sorted[i].time) {
      return { prev: sorted[i], next: sorted[i], index: i };
    }
    // Between keyframes
    if (i < sorted.length - 1 && time > sorted[i].time && time < sorted[i + 1].time) {
      return { prev: sorted[i], next: sorted[i + 1], index: i };
    }
  }

  return { prev: null, next: null, index: -1 };
}

/**
 * Calculate normalized time (0-1) between two keyframes
 */
export function getNormalizedTime(
  prevKeyframe: IKeyframe,
  nextKeyframe: IKeyframe,
  time: number,
): number {
  const duration = nextKeyframe.time - prevKeyframe.time;
  if (duration <= 0) return 0; // Handle zero or negative duration
  return Math.max(0, Math.min(1, (time - prevKeyframe.time) / duration));
}

/**
 * Default keyframe value to use when creating a new keyframe for a given
 * track type. This mirrors how DCC tools like Unity/Unreal seed values when
 * you key a transform track.
 */
export function getDefaultKeyframeValueForTrackType(trackType: string): KeyframeValue {
  if (trackType.includes('position') || trackType.includes('scale')) {
    return [0, 0, 0];
  }

  if (trackType.includes('rotation')) {
    // Identity quaternion
    return [0, 0, 0, 1];
  }

  // Material / morph / event tracks start from scalar 0 by default
  return 0;
}
