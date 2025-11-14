import * as THREE from 'three';
import type { IClip } from '@core/components/animation/AnimationComponent';
import type { ITrack } from '@core/components/animation/tracks/TrackTypes';
import { TrackType } from '@core/components/animation/tracks/TrackTypes';
import { evaluatePositionTrack, evaluateRotationTrack, evaluateScaleTrack } from '@core/components/animation/tracks/TransformTrack';
import { evaluateMorphTrack } from '@core/components/animation/tracks/MorphTargetTrack';
import { evaluateMaterialTrack } from '@core/components/animation/tracks/MaterialTrack';
import { evaluateEventTrack, type IEventData } from '@core/components/animation/tracks/EventTrack';

/**
 * Evaluated track result
 */
export interface IEvaluatedTrack {
  type: string;
  targetPath: string;
  value: unknown;
}

/**
 * Timeline evaluation result
 */
export interface ITimelineEvaluation {
  transforms: Map<string, { position?: THREE.Vector3; rotation?: THREE.Quaternion; scale?: THREE.Vector3 }>;
  morphs: Map<string, Record<string, number>>;
  materials: Map<string, Record<string, number>>;
  events: IEventData[];
}

/**
 * TimelineEvaluator - evaluates all tracks in a clip at a given time
 * Provides caching for improved performance
 */
export class TimelineEvaluator {
  private cache = new Map<string, { time: number; result: ITimelineEvaluation }>();
  private previousTime = 0;

  /**
   * Evaluate all tracks in a clip at the given time
   */
  evaluate(clip: IClip, time: number): ITimelineEvaluation {
    const cacheKey = `${clip.id}`;
    const cached = this.cache.get(cacheKey);

    // Simple cache check - only use if time hasn't changed
    if (cached && cached.time === time) {
      return cached.result;
    }

    const result: ITimelineEvaluation = {
      transforms: new Map(),
      morphs: new Map(),
      materials: new Map(),
      events: [],
    };

    // Evaluate each track
    for (const track of clip.tracks) {
      this.evaluateTrack(track, time, result);
    }

    // Cache the result
    this.cache.set(cacheKey, { time, result });

    // Update previous time for event detection
    this.previousTime = time;

    return result;
  }

  /**
   * Evaluate a single track
   */
  private evaluateTrack(track: ITrack, time: number, result: ITimelineEvaluation): void {
    const targetPath = track.targetPath;

    switch (track.type) {
      case TrackType.TRANSFORM_POSITION: {
        const position = evaluatePositionTrack(track, time);
        const existing = result.transforms.get(targetPath) || {};
        result.transforms.set(targetPath, { ...existing, position });
        break;
      }

      case TrackType.TRANSFORM_ROTATION: {
        const rotation = evaluateRotationTrack(track, time);
        const existing = result.transforms.get(targetPath) || {};
        result.transforms.set(targetPath, { ...existing, rotation });
        break;
      }

      case TrackType.TRANSFORM_SCALE: {
        const scale = evaluateScaleTrack(track, time);
        const existing = result.transforms.get(targetPath) || {};
        result.transforms.set(targetPath, { ...existing, scale });
        break;
      }

      case TrackType.MORPH: {
        const morphWeights = evaluateMorphTrack(track, time);
        result.morphs.set(targetPath, morphWeights);
        break;
      }

      case TrackType.MATERIAL: {
        const materialProps = evaluateMaterialTrack(track, time);
        result.materials.set(targetPath, materialProps);
        break;
      }

      case TrackType.EVENT: {
        const eventResult = evaluateEventTrack(track, time, this.previousTime);
        if (eventResult.triggered) {
          result.events.push(...eventResult.events);
        }
        break;
      }

      default:
        console.warn(`Unknown track type: ${track.type}`);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific clip
   */
  clearCacheForClip(clipId: string): void {
    this.cache.delete(clipId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
