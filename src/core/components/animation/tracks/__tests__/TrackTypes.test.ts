import { describe, it, expect } from 'vitest';
import {
  KeyframeSchema,
  TrackSchema,
  TrackType,
  sortKeyframes,
  findKeyframeRange,
  getNormalizedTime,
  type IKeyframe,
  type ITrack,
} from '../TrackTypes';

describe('TrackTypes', () => {
  describe('KeyframeSchema', () => {
    it('should validate a keyframe with number value', () => {
      const keyframe = {
        time: 1.5,
        value: 0.8,
        easing: 'linear' as const,
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(keyframe);
      }
    });

    it('should validate a keyframe with vec3 value', () => {
      const keyframe = {
        time: 0,
        value: [1, 2, 3] as [number, number, number],
        easing: 'bezier' as const,
        easingArgs: [0.25, 0.1, 0.25, 1.0],
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(keyframe);
      }
    });

    it('should validate a keyframe with quaternion value', () => {
      const keyframe = {
        time: 2.0,
        value: [0, 0, 0, 1] as [number, number, number, number],
        easing: 'step' as const,
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(keyframe);
      }
    });

    it('should validate a keyframe with object value', () => {
      const keyframe = {
        time: 1.0,
        value: { weight1: 0.5, weight2: 0.3 },
        easing: 'linear' as const,
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(keyframe);
      }
    });

    it('should reject keyframe with negative time', () => {
      const keyframe = {
        time: -0.5,
        value: 1,
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(false);
    });

    it('should reject keyframe with invalid easing type', () => {
      const keyframe = {
        time: 1.0,
        value: 1,
        easing: 'invalid',
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(false);
    });

    it('should default easing to linear', () => {
      const keyframe = {
        time: 1.0,
        value: 1,
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.easing).toBe('linear');
      }
    });

    it('should validate bezier easing with 4 arguments', () => {
      const keyframe = {
        time: 1.0,
        value: 1,
        easing: 'bezier' as const,
        easingArgs: [0.25, 0.1, 0.25, 1.0],
      };

      const result = KeyframeSchema.safeParse(keyframe);
      expect(result.success).toBe(true);
    });
  });

  describe('TrackSchema', () => {
    it('should validate a valid position track', () => {
      const track: ITrack = {
        id: 'pos-track-1',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0] },
          { time: 1, value: [1, 2, 3] },
        ],
      };

      const result = TrackSchema.safeParse(track);
      expect(result.success).toBe(true);
      if (result.success) {
        // Schema adds default easing to keyframes
        expect(result.data).toEqual({
          ...track,
          keyframes: [
            { time: 0, value: [0, 0, 0], easing: 'linear' },
            { time: 1, value: [1, 2, 3], easing: 'linear' },
          ],
        });
      }
    });

    it('should validate a valid rotation track', () => {
      const track: ITrack = {
        id: 'rot-track-1',
        type: TrackType.TRANSFORM_ROTATION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0, 1] },
          { time: 1, value: [0, 1, 0, 0] },
        ],
      };

      const result = TrackSchema.safeParse(track);
      expect(result.success).toBe(true);
    });

    it('should validate a valid morph track', () => {
      const track: ITrack = {
        id: 'morph-track-1',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: 0, blink: 0 } },
          { time: 1, value: { smile: 1, blink: 0.5 } },
        ],
      };

      const result = TrackSchema.safeParse(track);
      expect(result.success).toBe(true);
    });

    it('should require id, type, targetPath, and keyframes', () => {
      const incompleteTrack = {
        type: TrackType.TRANSFORM_POSITION,
      };

      const result = TrackSchema.safeParse(incompleteTrack);
      expect(result.success).toBe(false);
    });

    it('should reject track with invalid type', () => {
      const track = {
        id: 'invalid-track',
        type: 'invalid.type',
        targetPath: 'root',
        keyframes: [],
      };

      const result = TrackSchema.safeParse(track);
      expect(result.success).toBe(false);
    });

    it('should accept empty keyframes array', () => {
      const track: ITrack = {
        id: 'empty-track',
        type: TrackType.TRANSFORM_SCALE,
        targetPath: 'root',
        keyframes: [],
      };

      const result = TrackSchema.safeParse(track);
      expect(result.success).toBe(true);
    });
  });

  describe('sortKeyframes', () => {
    it('should sort keyframes by time', () => {
      const keyframes: IKeyframe[] = [
        { time: 2, value: 3 },
        { time: 0, value: 1 },
        { time: 1, value: 2 },
      ];

      const sorted = sortKeyframes(keyframes);
      expect(sorted).toHaveLength(3);
      expect(sorted[0].time).toBe(0);
      expect(sorted[1].time).toBe(1);
      expect(sorted[2].time).toBe(2);
    });

    it('should return a new array (not modify original)', () => {
      const keyframes: IKeyframe[] = [
        { time: 2, value: 3 },
        { time: 1, value: 2 },
      ];

      const sorted = sortKeyframes(keyframes);
      expect(sorted).not.toBe(keyframes);
      expect(keyframes[0].time).toBe(2); // Original unchanged
      expect(sorted[0].time).toBe(1); // Sorted copy
    });

    it('should handle already sorted keyframes', () => {
      const keyframes: IKeyframe[] = [
        { time: 0, value: 1 },
        { time: 1, value: 2 },
        { time: 2, value: 3 },
      ];

      const sorted = sortKeyframes(keyframes);
      expect(sorted).toEqual(keyframes);
    });

    it('should handle duplicate times (stable sort)', () => {
      const keyframes: IKeyframe[] = [
        { time: 1, value: 'first' },
        { time: 1, value: 'second' },
        { time: 0, value: 'third' },
      ];

      const sorted = sortKeyframes(keyframes);
      expect(sorted[0].time).toBe(0);
      // The order of duplicates should be preserved
      expect(sorted[1].value).toBe('first');
      expect(sorted[2].value).toBe('second');
    });
  });

  describe('findKeyframeRange', () => {
    it('should return null for both when keyframes array is empty', () => {
      const result = findKeyframeRange([], 1.0);
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
      expect(result.index).toBe(-1);
    });

    it('should return null prev and first keyframe as next when time is before first', () => {
      const keyframes: IKeyframe[] = [
        { time: 1, value: 1 },
        { time: 2, value: 2 },
      ];

      const result = findKeyframeRange(keyframes, 0.5);
      expect(result.prev).toBeNull();
      expect(result.next).toEqual(keyframes[0]);
      expect(result.index).toBe(0);
    });

    it('should return last keyframe as prev and null next when time is after last', () => {
      const keyframes: IKeyframe[] = [
        { time: 1, value: 1 },
        { time: 2, value: 2 },
      ];

      const result = findKeyframeRange(keyframes, 2.5);
      expect(result.prev).toEqual(keyframes[1]);
      expect(result.next).toBeNull();
      expect(result.index).toBe(1);
    });

    it('should return previous and next keyframes when time is between them', () => {
      const keyframes: IKeyframe[] = [
        { time: 0, value: 0 },
        { time: 1, value: 1 },
        { time: 2, value: 2 },
      ];

      const result = findKeyframeRange(keyframes, 1.5);
      expect(result.prev).toEqual(keyframes[1]);
      expect(result.next).toEqual(keyframes[2]);
      expect(result.index).toBe(1);
    });

    it('should return exact keyframe as both prev and next when time matches a keyframe', () => {
      const keyframes: IKeyframe[] = [
        { time: 0, value: 0 },
        { time: 1, value: 1 },
        { time: 2, value: 2 },
      ];

      const result = findKeyframeRange(keyframes, 1.0);
      expect(result.prev).toEqual(keyframes[1]);
      expect(result.next).toEqual(keyframes[1]);
      expect(result.index).toBe(1);
    });

    it('should handle unsorted keyframes by sorting them first', () => {
      const unsortedKeyframes: IKeyframe[] = [
        { time: 3, value: 3 },
        { time: 1, value: 1 },
        { time: 2, value: 2 },
      ];

      const result = findKeyframeRange(unsortedKeyframes, 1.5);
      expect(result.prev?.time).toBe(1);
      expect(result.next?.time).toBe(2);
    });

    it('should handle edge case of single keyframe', () => {
      const keyframes: IKeyframe[] = [{ time: 1, value: 1 }];

      // Before the keyframe
      let result = findKeyframeRange(keyframes, 0.5);
      expect(result.prev).toBeNull();
      expect(result.next?.time).toBe(1);

      // At the keyframe
      result = findKeyframeRange(keyframes, 1.0);
      expect(result.prev?.time).toBe(1);
      expect(result.next?.time).toBe(1);

      // After the keyframe
      result = findKeyframeRange(keyframes, 1.5);
      expect(result.prev?.time).toBe(1);
      expect(result.next).toBeNull();
    });
  });

  describe('getNormalizedTime', () => {
    it('should return 0 for zero duration', () => {
      const prev: IKeyframe = { time: 1, value: 1 };
      const next: IKeyframe = { time: 1, value: 2 };

      const result = getNormalizedTime(prev, next, 1);
      expect(result).toBe(0);
    });

    it('should return 0 for time before prev keyframe', () => {
      const prev: IKeyframe = { time: 1, value: 1 };
      const next: IKeyframe = { time: 2, value: 2 };

      const result = getNormalizedTime(prev, next, 0.5);
      expect(result).toBe(0);
    });

    it('should return 1 for time after next keyframe', () => {
      const prev: IKeyframe = { time: 1, value: 1 };
      const next: IKeyframe = { time: 2, value: 2 };

      const result = getNormalizedTime(prev, next, 2.5);
      expect(result).toBe(1);
    });

    it('should return correct normalized value for time between keyframes', () => {
      const prev: IKeyframe = { time: 0, value: 0 };
      const next: IKeyframe = { time: 2, value: 2 };

      // Halfway between
      let result = getNormalizedTime(prev, next, 1);
      expect(result).toBe(0.5);

      // Quarter way
      result = getNormalizedTime(prev, next, 0.5);
      expect(result).toBe(0.25);

      // Three quarters
      result = getNormalizedTime(prev, next, 1.5);
      expect(result).toBe(0.75);
    });

    it('should handle negative duration gracefully', () => {
      const prev: IKeyframe = { time: 2, value: 2 };
      const next: IKeyframe = { time: 1, value: 1 }; // prev > next

      const result = getNormalizedTime(prev, next, 1.5);
      expect(result).toBe(0); // Should clamp to 0
    });
  });

  describe('TrackType enum', () => {
    it('should have all expected track types', () => {
      expect(TrackType.TRANSFORM_POSITION).toBe('transform.position');
      expect(TrackType.TRANSFORM_ROTATION).toBe('transform.rotation');
      expect(TrackType.TRANSFORM_SCALE).toBe('transform.scale');
      expect(TrackType.MORPH).toBe('morph');
      expect(TrackType.MATERIAL).toBe('material');
      expect(TrackType.EVENT).toBe('event');
    });
  });
});
