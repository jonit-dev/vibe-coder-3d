import { describe, it, expect } from 'vitest';
import { evaluateMaterialTrack, type MaterialProperty } from '../MaterialTrack';
import type { ITrack } from '../TrackTypes';
import { TrackType } from '../TrackTypes';

describe('MaterialTrack', () => {
  let materialTrack: ITrack;

  beforeEach(() => {
    materialTrack = {
      id: 'material-track',
      type: TrackType.MATERIAL,
      targetPath: 'character_material',
      keyframes: [
        {
          time: 0,
          value: { opacity: 1, emissiveIntensity: 0, metalness: 0, roughness: 1 },
        },
        {
          time: 1,
          value: { opacity: 0.5, emissiveIntensity: 2, metalness: 1, roughness: 0.5 },
        },
        {
          time: 2,
          value: { opacity: 0, emissiveIntensity: 0, metalness: 0.5, roughness: 0.2 },
        },
      ],
    };
  });

  describe('evaluateMaterialTrack', () => {
    it('should return empty object when no keyframes exist', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [],
      };

      const result = evaluateMaterialTrack(emptyTrack, 0);
      expect(result).toEqual({});
    });

    it('should return first keyframe value when time is before first keyframe', () => {
      const result = evaluateMaterialTrack(materialTrack, -0.5);
      expect(result).toEqual({ opacity: 1, emissiveIntensity: 0, metalness: 0, roughness: 1 });
    });

    it('should return last keyframe value when time is after last keyframe', () => {
      const result = evaluateMaterialTrack(materialTrack, 2.5);
      expect(result).toEqual({ opacity: 0, emissiveIntensity: 0, metalness: 0.5, roughness: 0.2 });
    });

    it('should return exact keyframe value when time matches a keyframe', () => {
      const result = evaluateMaterialTrack(materialTrack, 1);
      expect(result).toEqual({ opacity: 0.5, emissiveIntensity: 2, metalness: 1, roughness: 0.5 });
    });

    it('should interpolate between material properties with linear easing', () => {
      // Test at t=0.5 (halfway between first and second keyframe)
      const result = evaluateMaterialTrack(materialTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.75, 5);
      expect(result.emissiveIntensity).toBeCloseTo(1, 5);
      expect(result.metalness).toBeCloseTo(0.5, 5);
      expect(result.roughness).toBeCloseTo(0.75, 5);
    });

    it('should handle material properties that appear/disappear between keyframes', () => {
      const variableTrack: ITrack = {
        id: 'variable-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: 1, metalness: 0.5 } },
          { time: 1, value: { metalness: 1, roughness: 0.8 } }, // opacity removed, roughness added
        ],
      };

      const result = evaluateMaterialTrack(variableTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.5, 5); // Interpolates from 1 to 0
      expect(result.metalness).toBeCloseTo(0.75, 5); // Interpolates from 0.5 to 1
      expect(result.roughness).toBeCloseTo(0.4, 5); // Interpolates from 0 to 0.8
    });

    it('should handle single keyframe track', () => {
      const singleKeyframeTrack: ITrack = {
        id: 'single-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [{ time: 1, value: { opacity: 0.8, metalness: 0.6 } }],
      };

      const result = evaluateMaterialTrack(singleKeyframeTrack, 0);
      expect(result).toEqual({ opacity: 0.8, metalness: 0.6 });
    });

    it('should handle bezier easing', () => {
      const bezierTrack: ITrack = {
        id: 'bezier-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: 0 }, easing: 'linear' },
          { time: 1, value: { opacity: 1 }, easing: 'bezier', easingArgs: [0.42, 0, 0.58, 1] },
        ],
      };

      const result = evaluateMaterialTrack(bezierTrack, 0.5);
      // With ease-in-out bezier, value at t=0.5 should be close to 0.5
      expect(result.opacity).toBeCloseTo(0.5, 1);
    });

    it('should handle step easing', () => {
      const stepTrack: ITrack = {
        id: 'step-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: 0 }, easing: 'linear' },
          { time: 1, value: { opacity: 1 }, easing: 'step' },
        ],
      };

      // With step easing, any time before 1 should return the first value
      const result1 = evaluateMaterialTrack(stepTrack, 0.1);
      expect(result1.opacity).toBe(0);

      // At or after 1, should return the second value
      const result2 = evaluateMaterialTrack(stepTrack, 1);
      expect(result2.opacity).toBe(1);
    });

    it('should handle opacity values between 0 and 1', () => {
      const opacityTrack: ITrack = {
        id: 'opacity-track',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: 0 } },
          { time: 1, value: { opacity: 1 } },
        ],
      };

      const result = evaluateMaterialTrack(opacityTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.5, 5);
      expect(result.opacity).toBeGreaterThanOrEqual(0);
      expect(result.opacity).toBeLessThanOrEqual(1);
    });

    it('should handle metalness values between 0 and 1', () => {
      const metalnessTrack: ITrack = {
        id: 'metalness-track',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { metalness: 0 } },
          { time: 1, value: { metalness: 1 } },
        ],
      };

      const result = evaluateMaterialTrack(metalnessTrack, 0.75);
      expect(result.metalness).toBeCloseTo(0.75, 5);
      expect(result.metalness).toBeGreaterThanOrEqual(0);
      expect(result.metalness).toBeLessThanOrEqual(1);
    });

    it('should handle roughness values between 0 and 1', () => {
      const roughnessTrack: ITrack = {
        id: 'roughness-track',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { roughness: 0.1 } },
          { time: 1, value: { roughness: 0.9 } },
        ],
      };

      const result = evaluateMaterialTrack(roughnessTrack, 0.5);
      expect(result.roughness).toBeCloseTo(0.5, 5);
      expect(result.roughness).toBeGreaterThanOrEqual(0);
      expect(result.roughness).toBeLessThanOrEqual(1);
    });

    it('should handle emissive intensity values', () => {
      const emissiveTrack: ITrack = {
        id: 'emissive-track',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { emissiveIntensity: 0 } },
          { time: 2, value: { emissiveIntensity: 5 } },
        ],
      };

      const result = evaluateMaterialTrack(emissiveTrack, 1);
      expect(result.emissiveIntensity).toBeCloseTo(2.5, 5);
    });

    it('should handle negative material values (though unusual)', () => {
      const negativeTrack: ITrack = {
        id: 'negative-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: -0.5, emissiveIntensity: -1 } },
          { time: 1, value: { opacity: 0.5, emissiveIntensity: 1 } },
        ],
      };

      const result = evaluateMaterialTrack(negativeTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0, 5);
      expect(result.emissiveIntensity).toBeCloseTo(0, 5);
    });

    it('should handle extreme material values', () => {
      const extremeTrack: ITrack = {
        id: 'extreme-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { emissiveIntensity: 100, metalness: 2 } },
          { time: 1, value: { emissiveIntensity: 0, metalness: -1 } },
        ],
      };

      const result = evaluateMaterialTrack(extremeTrack, 0.5);
      expect(result.emissiveIntensity).toBeCloseTo(50, 5);
      expect(result.metalness).toBeCloseTo(0.5, 5);
    });

    it('should handle custom material properties', () => {
      const customTrack: ITrack = {
        id: 'custom-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { customProperty1: 0, customProperty2: 10 } },
          { time: 1, value: { customProperty1: 5, customProperty2: 20 } },
        ],
      };

      const result = evaluateMaterialTrack(customTrack, 0.5);
      expect(result.customProperty1).toBeCloseTo(2.5, 5);
      expect(result.customProperty2).toBeCloseTo(15, 5);
    });

    it('should handle material properties with very small values', () => {
      const smallValuesTrack: ITrack = {
        id: 'small-values',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: { opacity: 0.001, emissiveIntensity: 0.0001 } },
          { time: 1, value: { opacity: 0.002, emissiveIntensity: 0.0002 } },
        ],
      };

      const result = evaluateMaterialTrack(smallValuesTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.0015, 6);
      expect(result.emissiveIntensity).toBeCloseTo(0.00015, 6);
    });
  });

  describe('MaterialProperty type', () => {
    it('should define expected material property types', () => {
      const expectedTypes: MaterialProperty[] = [
        'opacity',
        'emissiveIntensity',
        'metalness',
        'roughness',
      ];

      // This test verifies the type exists - in TypeScript this would be a compile-time check
      expect(expectedTypes).toContain('opacity');
      expect(expectedTypes).toContain('emissiveIntensity');
      expect(expectedTypes).toContain('metalness');
      expect(expectedTypes).toContain('roughness');
    });
  });

  describe('Edge cases', () => {
    it('should handle unsorted keyframes', () => {
      const unsortedTrack: ITrack = {
        id: 'unsorted-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 2, value: { opacity: 2 } },
          { time: 0, value: { opacity: 0 } },
          { time: 1, value: { opacity: 1 } },
        ],
      };

      const result = evaluateMaterialTrack(unsortedTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.5, 5);
    });

    it('should handle duplicate keyframe times', () => {
      const duplicateTrack: ITrack = {
        id: 'duplicate-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 1, value: { opacity: 1 } },
          { time: 1, value: { opacity: 2 } }, // Same time
          { time: 2, value: { opacity: 3 } },
        ],
      };

      // When there are duplicate times, the first encountered is used
      // (this is reasonable behavior for duplicate keyframes)
      const result = evaluateMaterialTrack(duplicateTrack, 1);
      expect(result.opacity).toBe(1); // Uses first keyframe at time 1
    });

    it('should handle empty material property objects', () => {
      const emptyObjectTrack: ITrack = {
        id: 'empty-object-material',
        type: TrackType.MATERIAL,
        targetPath: 'material',
        keyframes: [
          { time: 0, value: {} },
          { time: 1, value: { opacity: 1 } },
        ],
      };

      const result = evaluateMaterialTrack(emptyObjectTrack, 0.5);
      expect(result.opacity).toBeCloseTo(0.5, 5);
    });
  });
});
