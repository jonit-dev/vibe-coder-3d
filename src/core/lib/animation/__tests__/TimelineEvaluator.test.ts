import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { TimelineEvaluator, type ITimelineEvaluation } from '../TimelineEvaluator';
import type { IClip, ITrack } from '@core/components/animation/AnimationComponent';
import { TrackType } from '@core/components/animation/tracks/TrackTypes';

// Mock the track evaluation functions
vi.mock('@core/components/animation/tracks/TransformTrack', () => ({
  evaluatePositionTrack: vi.fn(),
  evaluateRotationTrack: vi.fn(),
  evaluateScaleTrack: vi.fn(),
}));

vi.mock('@core/components/animation/tracks/MorphTargetTrack', () => ({
  evaluateMorphTrack: vi.fn(),
}));

vi.mock('@core/components/animation/tracks/MaterialTrack', () => ({
  evaluateMaterialTrack: vi.fn(),
}));

vi.mock('@core/components/animation/tracks/EventTrack', () => ({
  evaluateEventTrack: vi.fn(),
}));

import {
  evaluatePositionTrack,
  evaluateRotationTrack,
  evaluateScaleTrack,
} from '@core/components/animation/tracks/TransformTrack';
import { evaluateMorphTrack } from '@core/components/animation/tracks/MorphTargetTrack';
import { evaluateMaterialTrack } from '@core/components/animation/tracks/MaterialTrack';
import { evaluateEventTrack } from '@core/components/animation/tracks/EventTrack';

const mockEvaluatePositionTrack = vi.mocked(evaluatePositionTrack);
const mockEvaluateRotationTrack = vi.mocked(evaluateRotationTrack);
const mockEvaluateScaleTrack = vi.mocked(evaluateScaleTrack);
const mockEvaluateMorphTrack = vi.mocked(evaluateMorphTrack);
const mockEvaluateMaterialTrack = vi.mocked(evaluateMaterialTrack);
const mockEvaluateEventTrack = vi.mocked(evaluateEventTrack);

describe('TimelineEvaluator', () => {
  let evaluator: TimelineEvaluator;
  let mockClip: IClip;

  beforeEach(() => {
    evaluator = new TimelineEvaluator();

    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock clip with various track types
    mockClip = {
      id: 'test-clip',
      name: 'Test Clip',
      duration: 2,
      loop: true,
      timeScale: 1,
      tracks: [
        {
          id: 'position-track',
          type: TrackType.TRANSFORM_POSITION,
          targetPath: 'root',
          keyframes: [
            { time: 0, value: [0, 0, 0], easing: 'linear' },
            { time: 1, value: [1, 1, 1], easing: 'linear' },
          ],
        },
        {
          id: 'rotation-track',
          type: TrackType.TRANSFORM_ROTATION,
          targetPath: 'root',
          keyframes: [
            { time: 0, value: [0, 0, 0, 1], easing: 'linear' },
            { time: 1, value: [0, 1, 0, 1], easing: 'linear' },
          ],
        },
        {
          id: 'morph-track',
          type: TrackType.MORPH,
          targetPath: 'root/mesh',
          keyframes: [
            { time: 0, value: { blink: 0, smile: 0 }, easing: 'linear' },
            { time: 1, value: { blink: 1, smile: 0.5 }, easing: 'linear' },
          ],
        },
        {
          id: 'material-track',
          type: TrackType.MATERIAL,
          targetPath: 'root/material',
          keyframes: [
            { time: 0, value: { opacity: 1, roughness: 0.3 }, easing: 'linear' },
            { time: 1, value: { opacity: 0.5, roughness: 0.8 }, easing: 'linear' },
          ],
        },
        {
          id: 'event-track',
          type: TrackType.EVENT,
          targetPath: 'root',
          keyframes: [
            { time: 0.5, value: { type: 'footstep', volume: 0.5 }, easing: 'step' },
            { time: 1.5, value: { type: 'jump', height: 2 }, easing: 'step' },
          ],
        },
      ],
    };

    // Setup default mock return values
    mockEvaluatePositionTrack.mockReturnValue(new THREE.Vector3(0.5, 0.5, 0.5));
    mockEvaluateRotationTrack.mockReturnValue(new THREE.Quaternion(0, 0.5, 0, 1));
    mockEvaluateScaleTrack.mockReturnValue(new THREE.Vector3(1, 1, 1));
    mockEvaluateMorphTrack.mockReturnValue({ blink: 0.5, smile: 0.25 });
    mockEvaluateMaterialTrack.mockReturnValue({ opacity: 0.75, roughness: 0.55 });
    mockEvaluateEventTrack.mockReturnValue({
      triggered: true,
      events: [{ type: 'footstep', volume: 0.5, time: 0.5 }],
    });
  });

  describe('evaluate', () => {
    it('should evaluate all tracks in a clip', () => {
      const result = evaluator.evaluate(mockClip, 0.5);

      expect(result).toBeDefined();
      expect(result.transforms).toBeInstanceOf(Map);
      expect(result.morphs).toBeInstanceOf(Map);
      expect(result.materials).toBeInstanceOf(Map);
      expect(result.events).toBeInstanceOf(Array);
    });

    it('should call track evaluation functions with correct parameters', () => {
      evaluator.evaluate(mockClip, 0.75);

      expect(mockEvaluatePositionTrack).toHaveBeenCalledWith(
        mockClip.tracks[0],
        0.75
      );
      expect(mockEvaluateRotationTrack).toHaveBeenCalledWith(
        mockClip.tracks[1],
        0.75
      );
      expect(mockEvaluateMorphTrack).toHaveBeenCalledWith(
        mockClip.tracks[2],
        0.75
      );
      expect(mockEvaluateMaterialTrack).toHaveBeenCalledWith(
        mockClip.tracks[3],
        0.75
      );
      expect(mockEvaluateEventTrack).toHaveBeenCalledWith(
        mockClip.tracks[4],
        0.75,
        0 // previousTime defaults to 0
      );
    });

    it('should handle clips with no tracks', () => {
      const emptyClip: IClip = {
        ...mockClip,
        tracks: [],
      };

      const result = evaluator.evaluate(emptyClip, 1.0);

      expect(result.transforms.size).toBe(0);
      expect(result.morphs.size).toBe(0);
      expect(result.materials.size).toBe(0);
      expect(result.events).toHaveLength(0);
    });

    it('should combine transform tracks for the same target path', () => {
      const clipWithMultipleTransforms: IClip = {
        ...mockClip,
        tracks: [
          {
            id: 'pos-track',
            type: TrackType.TRANSFORM_POSITION,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'rot-track',
            type: TrackType.TRANSFORM_ROTATION,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'scale-track',
            type: TrackType.TRANSFORM_SCALE,
            targetPath: 'root',
            keyframes: [],
          },
        ],
      };

      const result = evaluator.evaluate(clipWithMultipleTransforms, 0.5);

      const rootTransform = result.transforms.get('root');
      expect(rootTransform).toBeDefined();
      expect(rootTransform?.position).toBeDefined();
      expect(rootTransform?.rotation).toBeDefined();
      expect(rootTransform?.scale).toBeDefined();
    });

    it('should handle different target paths separately', () => {
      const clipWithMultiplePaths: IClip = {
        ...mockClip,
        tracks: [
          {
            id: 'root-pos',
            type: TrackType.TRANSFORM_POSITION,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'child-pos',
            type: TrackType.TRANSFORM_POSITION,
            targetPath: 'root/child',
            keyframes: [],
          },
        ],
      };

      const result = evaluator.evaluate(clipWithMultiplePaths, 0.5);

      expect(result.transforms.size).toBe(2);
      expect(result.transforms.has('root')).toBe(true);
      expect(result.transforms.has('root/child')).toBe(true);
    });

    it('should cache results for identical clips and times', () => {
      const firstResult = evaluator.evaluate(mockClip, 0.5);
      const secondResult = evaluator.evaluate(mockClip, 0.5);

      // Should return cached result (same reference)
      expect(firstResult).toBe(secondResult);

      // Track evaluation functions should only be called once
      expect(mockEvaluatePositionTrack).toHaveBeenCalledTimes(1);
      expect(mockEvaluateRotationTrack).toHaveBeenCalledTimes(1);
      expect(mockEvaluateMorphTrack).toHaveBeenCalledTimes(1);
      expect(mockEvaluateMaterialTrack).toHaveBeenCalledTimes(1);
      expect(mockEvaluateEventTrack).toHaveBeenCalledTimes(1);
    });

    it('should not use cache for different times', () => {
      evaluator.evaluate(mockClip, 0.5);
      evaluator.evaluate(mockClip, 0.75);

      // Should call evaluation functions twice (once for each time)
      expect(mockEvaluatePositionTrack).toHaveBeenCalledTimes(2);
      expect(mockEvaluateRotationTrack).toHaveBeenCalledTimes(2);
    });

    it('should update previous time for event detection', () => {
      // First evaluation
      evaluator.evaluate(mockClip, 0.5);

      // Second evaluation should use previous time
      evaluator.evaluate(mockClip, 1.0);

      expect(mockEvaluateEventTrack).toHaveBeenLastCalledWith(
        mockClip.tracks[4],
        1.0,
        0.5 // previousTime from first call
      );
    });
  });

  describe('event handling', () => {
    it('should only add events when they are triggered', () => {
      mockEvaluateEventTrack.mockReturnValue({
        triggered: false,
        events: [],
      });

      const result = evaluator.evaluate(mockClip, 0.25);

      expect(result.events).toHaveLength(0);
    });

    it('should accumulate events from multiple event tracks', () => {
      const clipWithMultipleEvents: IClip = {
        ...mockClip,
        tracks: [
          {
            id: 'event-track-1',
            type: TrackType.EVENT,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'event-track-2',
            type: TrackType.EVENT,
            targetPath: 'root',
            keyframes: [],
          },
        ],
      };

      mockEvaluateEventTrack.mockReturnValueOnce({
        triggered: true,
        events: [{ type: 'footstep', time: 0.5 }],
      }).mockReturnValueOnce({
        triggered: true,
        events: [{ type: 'sound', time: 0.75 }],
      });

      const result = evaluator.evaluate(clipWithMultipleEvents, 1.0);

      expect(result.events).toHaveLength(2);
      expect(result.events).toContainEqual({ type: 'footstep', time: 0.5 });
      expect(result.events).toContainEqual({ type: 'sound', time: 0.75 });
    });
  });

  describe('cache management', () => {
    it('should provide cache statistics', () => {
      // Add some entries to cache
      evaluator.evaluate(mockClip, 0.5);
      evaluator.evaluate(mockClip, 0.75);

      const stats = evaluator.getCacheStats();

      expect(stats.size).toBe(1); // Only one clip cached, latest time stored
      expect(stats.keys).toContain('test-clip');
    });

    it('should clear all cache', () => {
      evaluator.evaluate(mockClip, 0.5);
      evaluator.evaluate(mockClip, 0.75);

      evaluator.clearCache();

      const stats = evaluator.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });

    it('should clear cache for specific clip', () => {
      const clip2: IClip = { ...mockClip, id: 'clip-2' };

      evaluator.evaluate(mockClip, 0.5);
      evaluator.evaluate(clip2, 0.5);

      let stats = evaluator.getCacheStats();
      expect(stats.size).toBe(2);

      evaluator.clearCacheForClip('test-clip');

      stats = evaluator.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).not.toContain('test-clip');
    });

    it('should handle clearing non-existent clip without error', () => {
      expect(() => {
        evaluator.clearCacheForClip('non-existent');
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle unknown track types gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const clipWithUnknownTrack: IClip = {
        ...mockClip,
        tracks: [
          {
            id: 'unknown-track',
            type: 'unknown' as any,
            targetPath: 'root',
            keyframes: [],
          },
        ],
      };

      const result = evaluator.evaluate(clipWithUnknownTrack, 0.5);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown track type: unknown');
      expect(result).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle evaluation errors gracefully', () => {
      mockEvaluatePositionTrack.mockImplementation(() => {
        throw new Error('Position evaluation failed');
      });

      expect(() => {
        evaluator.evaluate(mockClip, 0.5);
      }).toThrow('Position evaluation failed');
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of tracks efficiently', () => {
      const clipWithManyTracks: IClip = {
        ...mockClip,
        tracks: Array.from({ length: 1000 }, (_, i) => ({
          id: `track-${i}`,
          type: TrackType.TRANSFORM_POSITION,
          targetPath: `object-${i}`,
          keyframes: [],
        })),
      };

      const startTime = performance.now();
      const result = evaluator.evaluate(clipWithManyTracks, 0.5);
      const endTime = performance.now();

      expect(result.transforms.size).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in reasonable time
    });
  });

  describe('integration with Three.js objects', () => {
    it('should return Three.js objects for transform evaluation', () => {
      const expectedPosition = new THREE.Vector3(1, 2, 3);
      const expectedRotation = new THREE.Quaternion(0, 0.707, 0, 0.707);
      const expectedScale = new THREE.Vector3(1.5, 1.5, 1.5);

      mockEvaluatePositionTrack.mockReturnValue(expectedPosition);
      mockEvaluateRotationTrack.mockReturnValue(expectedRotation);
      mockEvaluateScaleTrack.mockReturnValue(expectedScale);

      // Create a mock clip with all transform types for the same target
      const transformClip: IClip = {
        id: 'transform-clip',
        name: 'Transform Test',
        duration: 1,
        loop: true,
        timeScale: 1,
        tracks: [
          {
            id: 'pos-track',
            type: TrackType.TRANSFORM_POSITION,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'rot-track',
            type: TrackType.TRANSFORM_ROTATION,
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'scale-track',
            type: TrackType.TRANSFORM_SCALE,
            targetPath: 'root',
            keyframes: [],
          },
        ],
      };

      const result = evaluator.evaluate(transformClip, 0.5);

      const rootTransform = result.transforms.get('root');
      expect(rootTransform?.position).toBeInstanceOf(THREE.Vector3);
      expect(rootTransform?.rotation).toBeInstanceOf(THREE.Quaternion);
      expect(rootTransform?.scale).toBeInstanceOf(THREE.Vector3);

      expect(rootTransform?.position).toEqual(expectedPosition);
      expect(rootTransform?.rotation).toEqual(expectedRotation);
      expect(rootTransform?.scale).toEqual(expectedScale);
    });
  });
});