import { z } from 'zod';
import { TrackSchema } from './tracks/TrackTypes';

/**
 * Animation clip schema
 */
export const ClipSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().positive(),
  loop: z.boolean().default(true),
  timeScale: z.number().positive().default(1),
  tracks: z.array(TrackSchema),
});

export type IClip = z.infer<typeof ClipSchema>;

/**
 * Clip binding schema
 * Associates an animation asset reference with entity-specific overrides
 */
export const ClipBindingSchema = z.object({
  bindingId: z.string(),
  clipId: z.string(),
  assetRef: z.string(), // '@/animations/walk' or './animations/MyScene'
  overrides: z
    .object({
      loop: z.boolean().optional(),
      speed: z.number().positive().optional(),
      startOffset: z.number().nonnegative().optional(),
    })
    .optional(),
});

export type IClipBinding = z.infer<typeof ClipBindingSchema>;

/**
 * Animation component schema
 * Uses external asset references via clip bindings
 */
export const AnimationComponentSchema = z.object({
  activeBindingId: z.string().optional(),
  playing: z.boolean(),
  time: z.number().nonnegative(),
  clipBindings: z.array(ClipBindingSchema),
});

export type IAnimationComponent = z.infer<typeof AnimationComponentSchema>;

/**
 * Default animation component data
 */
export const DEFAULT_ANIMATION_COMPONENT: IAnimationComponent = {
  activeBindingId: undefined,
  playing: false,
  time: 0,
  clipBindings: [],
};

/**
 * Animation playback state
 */
export interface IAnimationPlaybackState {
  time: number;
  playing: boolean;
  clipId: string | null;
  loop: boolean;
  timeScale: number;
}

/**
 * Animation API interface for runtime control
 */
export interface IAnimationApi {
  play(entityId: number, clipId: string, opts?: { fade?: number; loop?: boolean }): void;
  pause(entityId: number): void;
  stop(entityId: number, opts?: { fade?: number }): void;
  setTime(entityId: number, time: number): void;
  getState(entityId: number): IAnimationPlaybackState | null;
  getClip(entityId: number, clipId: string): unknown;
  getAllClips(entityId: number): unknown[];
}
