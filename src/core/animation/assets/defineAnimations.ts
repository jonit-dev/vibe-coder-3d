import { z } from 'zod';
import { ClipSchema } from '../../components/animation/AnimationComponent';

/**
 * Animation asset schema
 * Extends the base ClipSchema with metadata for asset management
 */
export const AnimationAssetSchema = ClipSchema.extend({
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  description: z.string().optional(),
  previewFrame: z.number().min(0).optional(),
});

export type IAnimationAsset = z.infer<typeof AnimationAssetSchema>;

/**
 * Define a single animation clip asset
 * Used in .animation.tsx files in the shared asset library
 * Automatically applies defaults from AnimationAssetSchema
 *
 * @example
 * ```typescript
 * // assets/animations/walk.animation.tsx
 * export default defineAnimationClip({
 *   id: 'walk',
 *   name: 'Walk Cycle',
 *   duration: 1.0,
 *   tracks: [...],
 *   tags: ['locomotion', 'character'],
 * });
 * ```
 */
export function defineAnimationClip(
  clip: Partial<IAnimationAsset> & Pick<IAnimationAsset, 'id' | 'name'>,
): IAnimationAsset {
  return AnimationAssetSchema.parse(clip);
}

/**
 * Define multiple animation clips
 * Used in .animations.tsx files for scene-local animation collections
 * Automatically applies defaults from AnimationAssetSchema
 *
 * @example
 * ```typescript
 * // scenes/Forest/Forest.animations.tsx
 * export default defineAnimationClips([
 *   { id: 'idleSpirit', name: 'Spirit Idle', duration: 2.0, tracks: [...] },
 *   { id: 'walkSpirit', name: 'Spirit Walk', duration: 1.5, tracks: [...] },
 * ]);
 * ```
 */
export function defineAnimationClips(
  clips: Array<Partial<IAnimationAsset> & Pick<IAnimationAsset, 'id' | 'name'>>,
): IAnimationAsset[] {
  return clips.map((clip) => AnimationAssetSchema.parse(clip));
}
