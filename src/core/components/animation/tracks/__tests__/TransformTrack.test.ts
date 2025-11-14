import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  evaluatePositionTrack,
  evaluateRotationTrack,
  evaluateScaleTrack,
} from '../TransformTrack';
import type { ITrack } from '../TrackTypes';
import { TrackType } from '../TrackTypes';

describe('TransformTrack', () => {
  let positionTrack: ITrack;
  let rotationTrack: ITrack;
  let scaleTrack: ITrack;
  let targetVec3: THREE.Vector3;
  let targetQuat: THREE.Quaternion;

  beforeEach(() => {
    // Setup test tracks
    positionTrack = {
      id: 'pos-track',
      type: TrackType.TRANSFORM_POSITION,
      targetPath: 'root',
      keyframes: [
        { time: 0, value: [0, 0, 0] },
        { time: 1, value: [1, 2, 3] },
        { time: 2, value: [2, 4, 6] },
      ],
    };

    rotationTrack = {
      id: 'rot-track',
      type: TrackType.TRANSFORM_ROTATION,
      targetPath: 'root',
      keyframes: [
        { time: 0, value: [0, 0, 0, 1] }, // Identity
        { time: 1, value: [0, 1, 0, 0] }, // 180 degrees around X
        { time: 2, value: [0, 0, 1, 0] }, // 180 degrees around Z
      ],
    };

    scaleTrack = {
      id: 'scale-track',
      type: TrackType.TRANSFORM_SCALE,
      targetPath: 'root',
      keyframes: [
        { time: 0, value: [1, 1, 1] },
        { time: 1, value: [2, 2, 2] },
        { time: 2, value: [0.5, 0.5, 0.5] },
      ],
    };

    targetVec3 = new THREE.Vector3();
    targetQuat = new THREE.Quaternion();
  });

  describe('evaluatePositionTrack', () => {
    it('should return zero vector when no keyframes exist', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [],
      };

      const result = evaluatePositionTrack(emptyTrack, 0, targetVec3);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should return first keyframe value when time is before first keyframe', () => {
      const result = evaluatePositionTrack(positionTrack, -0.5, targetVec3);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should return last keyframe value when time is after last keyframe', () => {
      const result = evaluatePositionTrack(positionTrack, 2.5, targetVec3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(4);
      expect(result.z).toBe(6);
    });

    it('should return exact keyframe value when time matches a keyframe', () => {
      const result = evaluatePositionTrack(positionTrack, 1, targetVec3);
      expect(result.x).toBe(1);
      expect(result.y).toBe(2);
      expect(result.z).toBe(3);
    });

    it('should interpolate between keyframes with linear easing', () => {
      // Test at t=0.5 (halfway between first and second keyframe)
      const result = evaluatePositionTrack(positionTrack, 0.5, targetVec3);
      expect(result.x).toBeCloseTo(0.5, 5);
      expect(result.y).toBeCloseTo(1, 5);
      expect(result.z).toBeCloseTo(1.5, 5);
    });

    it('should handle single keyframe track', () => {
      const singleKeyframeTrack: ITrack = {
        id: 'single',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [{ time: 1, value: [5, 10, 15] }],
      };

      const result = evaluatePositionTrack(singleKeyframeTrack, 0, targetVec3);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
      expect(result.z).toBe(15);
    });

    it('should use provided target vector', () => {
      const customTarget = new THREE.Vector3(99, 99, 99);
      const result = evaluatePositionTrack(positionTrack, 0.5, customTarget);
      expect(result).toBe(customTarget);
      expect(result.x).toBeCloseTo(0.5, 5);
    });

    it('should handle bezier easing', () => {
      const bezierTrack: ITrack = {
        id: 'bezier-pos',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0], easing: 'linear' },
          { time: 1, value: [1, 0, 0], easing: 'bezier', easingArgs: [0.42, 0, 0.58, 1] },
        ],
      };

      const result = evaluatePositionTrack(bezierTrack, 0.5, targetVec3);
      // With ease-in-out bezier, value at t=0.5 should be close to 0.5
      expect(result.x).toBeCloseTo(0.5, 1);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should handle step easing', () => {
      const stepTrack: ITrack = {
        id: 'step-pos',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0], easing: 'linear' },
          { time: 1, value: [1, 1, 1], easing: 'step' },
        ],
      };

      // With step easing, any time before 1 should return the first value
      const result1 = evaluatePositionTrack(stepTrack, 0.1, targetVec3);
      expect(result1.x).toBe(0);
      expect(result1.y).toBe(0);
      expect(result1.z).toBe(0);

      // At or after 1, should return the second value
      const result2 = evaluatePositionTrack(stepTrack, 1, targetVec3);
      expect(result2.x).toBe(1);
      expect(result2.y).toBe(1);
      expect(result2.z).toBe(1);
    });
  });

  describe('evaluateRotationTrack', () => {
    it('should return identity quaternion when no keyframes exist', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.TRANSFORM_ROTATION,
        targetPath: 'root',
        keyframes: [],
      };

      const result = evaluateRotationTrack(emptyTrack, 0, targetQuat);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(1, 5);
    });

    it('should return first keyframe value when time is before first keyframe', () => {
      const result = evaluateRotationTrack(rotationTrack, -0.5, targetQuat);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(1, 5);
    });

    it('should return last keyframe value when time is after last keyframe', () => {
      const result = evaluateRotationTrack(rotationTrack, 2.5, targetQuat);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(1, 5);
      expect(result.w).toBeCloseTo(0, 5);
    });

    it('should return exact keyframe value when time matches a keyframe', () => {
      const result = evaluateRotationTrack(rotationTrack, 1, targetQuat);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5);
      expect(result.z).toBeCloseTo(0, 5);
      expect(result.w).toBeCloseTo(0, 5);
    });

    it('should slerp between quaternions correctly', () => {
      // Create a simple rotation from identity to 90 degrees around Y
      const simpleRotationTrack: ITrack = {
        id: 'simple-rot',
        type: TrackType.TRANSFORM_ROTATION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0, 1] }, // Identity
          { time: 1, value: [0, 0.7071, 0, 0.7071] }, // 90 deg around Y
        ],
      };

      // At t=0.5, should be 45 degrees around Y
      const result = evaluateRotationTrack(simpleRotationTrack, 0.5, targetQuat);
      expect(result.x).toBeCloseTo(0, 3);
      expect(result.y).toBeCloseTo(0.3827, 3); // sin(45/2)
      expect(result.z).toBeCloseTo(0, 3);
      expect(result.w).toBeCloseTo(0.9239, 3); // cos(45/2)
    });

    it('should use provided target quaternion', () => {
      const customTarget = new THREE.Quaternion(0.1, 0.2, 0.3, 0.4);
      const result = evaluateRotationTrack(rotationTrack, 0.5, customTarget);
      expect(result).toBe(customTarget);
    });

    it('should interpolate between unnormalized quaternions', () => {
      // Create a track with unnormalized quaternions
      const unnormalizedTrack: ITrack = {
        id: 'unnormalized',
        type: TrackType.TRANSFORM_ROTATION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [0, 0, 0, 2] }, // Identity but unnormalized (magnitude 2)
          { time: 1, value: [0, 1, 0, 0] }, // 180 deg around Y but unnormalized (magnitude 1)
        ],
      };

      const result = evaluateRotationTrack(unnormalizedTrack, 0.5, targetQuat);
      // Should normalize inputs before slerp, then interpolate
      // [0,0,0,2] normalized = [0,0,0,1] (identity)
      // [0,1,0,0] normalized = [0,1,0,0] (180deg Y rotation)
      // slerp(t=0.5) = 90deg Y rotation = [0, 0.707, 0, 0.707]
      expect(result.x).toBeCloseTo(0, 3);
      expect(result.y).toBeCloseTo(0.707, 2);
      expect(result.w).toBeCloseTo(0.707, 2);
    });
  });

  describe('evaluateScaleTrack', () => {
    it('should return unit vector when no keyframes exist', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.TRANSFORM_SCALE,
        targetPath: 'root',
        keyframes: [],
      };

      const result = evaluateScaleTrack(emptyTrack, 0, targetVec3);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
      expect(result.z).toBe(1);
    });

    it('should return first keyframe value when time is before first keyframe', () => {
      const result = evaluateScaleTrack(scaleTrack, -0.5, targetVec3);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
      expect(result.z).toBe(1);
    });

    it('should return last keyframe value when time is after last keyframe', () => {
      const result = evaluateScaleTrack(scaleTrack, 2.5, targetVec3);
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
      expect(result.z).toBe(0.5);
    });

    it('should return exact keyframe value when time matches a keyframe', () => {
      const result = evaluateScaleTrack(scaleTrack, 1, targetVec3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(2);
      expect(result.z).toBe(2);
    });

    it('should interpolate between scale values', () => {
      const result = evaluateScaleTrack(scaleTrack, 1.5, targetVec3);
      // At t=1.5 (halfway between 1 and 2), should be halfway between [2,2,2] and [0.5,0.5,0.5]
      expect(result.x).toBeCloseTo(1.25, 5);
      expect(result.y).toBeCloseTo(1.25, 5);
      expect(result.z).toBeCloseTo(1.25, 5);
    });

    it('should handle non-uniform scaling', () => {
      const nonUniformTrack: ITrack = {
        id: 'non-uniform',
        type: TrackType.TRANSFORM_SCALE,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [1, 1, 1] },
          { time: 1, value: [2, 0.5, 3] },
        ],
      };

      const result = evaluateScaleTrack(nonUniformTrack, 0.5, targetVec3);
      expect(result.x).toBeCloseTo(1.5, 5);
      expect(result.y).toBeCloseTo(0.75, 5);
      expect(result.z).toBeCloseTo(2, 5);
    });

    it('should handle zero scale values', () => {
      const zeroScaleTrack: ITrack = {
        id: 'zero-scale',
        type: TrackType.TRANSFORM_SCALE,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [1, 1, 1] },
          { time: 1, value: [0, 0, 0] },
        ],
      };

      const result = evaluateScaleTrack(zeroScaleTrack, 0.5, targetVec3);
      expect(result.x).toBeCloseTo(0.5, 5);
      expect(result.y).toBeCloseTo(0.5, 5);
      expect(result.z).toBeCloseTo(0.5, 5);
    });

    it('should use provided target vector', () => {
      const customTarget = new THREE.Vector3(99, 99, 99);
      const result = evaluateScaleTrack(scaleTrack, 0.5, customTarget);
      expect(result).toBe(customTarget);
      expect(result.x).toBeCloseTo(1.5, 5);
    });
  });

  describe('Edge cases', () => {
    it('should handle unsorted keyframes', () => {
      const unsortedTrack: ITrack = {
        id: 'unsorted',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 2, value: [2, 2, 2] },
          { time: 0, value: [0, 0, 0] },
          { time: 1, value: [1, 1, 1] },
        ],
      };

      const result = evaluatePositionTrack(unsortedTrack, 0.5, targetVec3);
      expect(result.x).toBeCloseTo(0.5, 5);
      expect(result.y).toBeCloseTo(0.5, 5);
      expect(result.z).toBeCloseTo(0.5, 5);
    });

    it('should handle duplicate keyframe times', () => {
      const duplicateTrack: ITrack = {
        id: 'duplicate',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 1, value: [1, 1, 1] },
          { time: 1, value: [2, 2, 2] }, // Same time
          { time: 2, value: [3, 3, 3] },
        ],
      };

      // When time exactly matches, both prev and next are the same keyframe
      // For duplicates at the same time, findKeyframeRange returns the first one found
      const result = evaluatePositionTrack(duplicateTrack, 1, targetVec3);
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
      expect(result.z).toBeCloseTo(1, 5);
    });

    it('should handle negative values', () => {
      const negativeTrack: ITrack = {
        id: 'negative',
        type: TrackType.TRANSFORM_POSITION,
        targetPath: 'root',
        keyframes: [
          { time: 0, value: [-1, -2, -3] },
          { time: 1, value: [1, 2, 3] },
        ],
      };

      const result = evaluatePositionTrack(negativeTrack, 0.5, targetVec3);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });
  });
});
