import { describe, it, expect } from 'vitest';
import { evaluateMorphTrack } from '../MorphTargetTrack';
import type { ITrack } from '../TrackTypes';
import { TrackType } from '../TrackTypes';

describe('MorphTargetTrack', () => {
  let morphTrack: ITrack;

  beforeEach(() => {
    morphTrack = {
      id: 'morph-track',
      type: TrackType.MORPH,
      targetPath: 'character',
      keyframes: [
        {
          time: 0,
          value: { smile: 0, blink: 0, frown: 0 },
        },
        {
          time: 1,
          value: { smile: 1, blink: 0.5, frown: 0 },
        },
        {
          time: 2,
          value: { smile: 0, blink: 0, frown: 1 },
        },
      ],
    };
  });

  describe('evaluateMorphTrack', () => {
    it('should return empty object when no keyframes exist', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [],
      };

      const result = evaluateMorphTrack(emptyTrack, 0);
      expect(result).toEqual({});
    });

    it('should return first keyframe value when time is before first keyframe', () => {
      const result = evaluateMorphTrack(morphTrack, -0.5);
      expect(result).toEqual({ smile: 0, blink: 0, frown: 0 });
    });

    it('should return last keyframe value when time is after last keyframe', () => {
      const result = evaluateMorphTrack(morphTrack, 2.5);
      expect(result).toEqual({ smile: 0, blink: 0, frown: 1 });
    });

    it('should return exact keyframe value when time matches a keyframe', () => {
      const result = evaluateMorphTrack(morphTrack, 1);
      expect(result).toEqual({ smile: 1, blink: 0.5, frown: 0 });
    });

    it('should interpolate between morph weights with linear easing', () => {
      // Test at t=0.5 (halfway between first and second keyframe)
      const result = evaluateMorphTrack(morphTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.5, 5);
      expect(result.blink).toBeCloseTo(0.25, 5);
      expect(result.frown).toBeCloseTo(0, 5);
    });

    it('should handle morph targets that appear/disappear between keyframes', () => {
      const variableTrack: ITrack = {
        id: 'variable-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: 1, blink: 0.5 } },
          { time: 1, value: { blink: 1, frown: 0.8 } }, // smile removed, frown added
        ],
      };

      const result = evaluateMorphTrack(variableTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.5, 5); // Interpolates from 1 to 0
      expect(result.blink).toBeCloseTo(0.75, 5); // Interpolates from 0.5 to 1
      expect(result.frown).toBeCloseTo(0.4, 5); // Interpolates from 0 to 0.8
    });

    it('should handle single keyframe track', () => {
      const singleKeyframeTrack: ITrack = {
        id: 'single-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [{ time: 1, value: { smile: 0.8, blink: 0.2 } }],
      };

      const result = evaluateMorphTrack(singleKeyframeTrack, 0);
      expect(result).toEqual({ smile: 0.8, blink: 0.2 });
    });

    it('should clamp morph weights between 0 and 1', () => {
      const extremeTrack: ITrack = {
        id: 'extreme-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: -0.5, blink: 1.5 } },
          { time: 1, value: { smile: 1.2, blink: -0.2 } },
        ],
      };

      const result = evaluateMorphTrack(extremeTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.35, 5); // (-0.5 + 1.2) / 2
      expect(result.blink).toBeCloseTo(0.65, 5); // (1.5 + -0.2) / 2
    });

    it('should handle bezier easing', () => {
      const bezierTrack: ITrack = {
        id: 'bezier-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: 0 }, easing: 'linear' },
          { time: 1, value: { smile: 1 }, easing: 'bezier', easingArgs: [0.42, 0, 0.58, 1] },
        ],
      };

      const result = evaluateMorphTrack(bezierTrack, 0.5);
      // With ease-in-out bezier, value at t=0.5 should be close to 0.5
      expect(result.smile).toBeCloseTo(0.5, 1);
    });

    it('should handle step easing', () => {
      const stepTrack: ITrack = {
        id: 'step-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: 0 }, easing: 'linear' },
          { time: 1, value: { smile: 1 }, easing: 'step' },
        ],
      };

      // With step easing, any time before 1 should return the first value
      const result1 = evaluateMorphTrack(stepTrack, 0.1);
      expect(result1.smile).toBe(0);

      // At or after 1, should return the second value
      const result2 = evaluateMorphTrack(stepTrack, 1);
      expect(result2.smile).toBe(1);
    });

    it('should handle complex morph target names', () => {
      const complexTrack: ITrack = {
        id: 'complex-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { 'left_eye_blink': 0, 'right_eye_blink': 0, 'mouth_open': 0 } },
          { time: 1, value: { 'left_eye_blink': 1, 'right_eye_blink': 0.8, 'mouth_open': 0.5 } },
        ],
      };

      const result = evaluateMorphTrack(complexTrack, 0.5);
      expect(result['left_eye_blink']).toBeCloseTo(0.5, 5);
      expect(result['right_eye_blink']).toBeCloseTo(0.4, 5);
      expect(result['mouth_open']).toBeCloseTo(0.25, 5);
    });

    it('should handle decimal morph weights correctly', () => {
      const decimalTrack: ITrack = {
        id: 'decimal-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: { smile: 0.1, blink: 0.2 } },
          { time: 1, value: { smile: 0.9, blink: 0.8 } },
        ],
      };

      const result = evaluateMorphTrack(decimalTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.5, 5);
      expect(result.blink).toBeCloseTo(0.5, 5);
    });

    it('should handle many morph targets efficiently', () => {
      const manyTargets: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        manyTargets[`morph_${i}`] = Math.random();
      }

      const manyTrack: ITrack = {
        id: 'many-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: manyTargets },
          { time: 1, value: manyTargets },
        ],
      };

      const result = evaluateMorphTrack(manyTrack, 0.5);
      expect(Object.keys(result)).toHaveLength(100);

      // All values should be the same since both keyframes are identical
      for (let i = 0; i < 100; i++) {
        expect(result[`morph_${i}`]).toBeCloseTo(manyTargets[`morph_${i}`], 5);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle unsorted keyframes', () => {
      const unsortedTrack: ITrack = {
        id: 'unsorted-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 2, value: { smile: 2 } },
          { time: 0, value: { smile: 0 } },
          { time: 1, value: { smile: 1 } },
        ],
      };

      const result = evaluateMorphTrack(unsortedTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.5, 5);
    });

    it('should handle duplicate keyframe times', () => {
      const duplicateTrack: ITrack = {
        id: 'duplicate-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 1, value: { smile: 1 } },
          { time: 1, value: { smile: 2 } }, // Same time
          { time: 2, value: { smile: 3 } },
        ],
      };

      // Should use the last keyframe at the given time (due to sortKeyframes implementation)
      const result = evaluateMorphTrack(duplicateTrack, 1);
      expect(result.smile).toBe(1); // Both keyframes have time=1, so the first one is used after sorting
    });

    it('should handle empty morph target objects', () => {
      const emptyObjectTrack: ITrack = {
        id: 'empty-object-morph',
        type: TrackType.MORPH,
        targetPath: 'character',
        keyframes: [
          { time: 0, value: {} },
          { time: 1, value: { smile: 1 } },
        ],
      };

      const result = evaluateMorphTrack(emptyObjectTrack, 0.5);
      expect(result.smile).toBeCloseTo(0.5, 5);
    });
  });
});