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
 * Animation component schema
 */
export const AnimationComponentSchema = z.object({
  activeClipId: z.string().optional(),
  blendIn: z.number().nonnegative().default(0.2),
  blendOut: z.number().nonnegative().default(0.2),
  layer: z.number().int().nonnegative().default(0),
  weight: z.number().min(0).max(1).default(1),
  playing: z.boolean().default(false),
  time: z.number().nonnegative().default(0),
  clips: z.array(ClipSchema).default([]),
  version: z.literal(1).default(1),
});

export type IAnimationComponent = z.infer<typeof AnimationComponentSchema>;

/**
 * Default animation component data
 */
export const DEFAULT_ANIMATION_COMPONENT: IAnimationComponent = {
  activeClipId: undefined,
  blendIn: 0.2,
  blendOut: 0.2,
  layer: 0,
  weight: 1,
  playing: false,
  time: 0,
  clips: [],
  version: 1,
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
  getClip(entityId: number, clipId: string): IClip | null;
  getAllClips(entityId: number): IClip[];
}
