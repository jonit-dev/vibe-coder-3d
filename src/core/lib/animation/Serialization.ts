import {
  AnimationComponentSchema,
  type IAnimationComponent,
} from '@core/components/animation/AnimationComponent';

/**
 * Animation component version history
 */
export const ANIMATION_VERSION = {
  V1: 1,
  CURRENT: 1,
} as const;

/**
 * Serialize animation component to JSON
 */
export function serializeAnimation(data: IAnimationComponent): unknown {
  // Validate before serialization
  const validated = AnimationComponentSchema.parse(data);

  return {
    ...validated,
    version: ANIMATION_VERSION.CURRENT,
  };
}

/**
 * Deserialize animation component from JSON
 */
export function deserializeAnimation(data: unknown): IAnimationComponent {
  // Parse and validate
  const parsed = AnimationComponentSchema.parse(data);

  // Handle version migrations
  if (parsed.version !== ANIMATION_VERSION.CURRENT) {
    return migrateAnimation(parsed);
  }

  return parsed;
}

/**
 * Migrate animation data from older versions
 */
function migrateAnimation(data: IAnimationComponent): IAnimationComponent {
  const version = data.version || 1;

  // Currently only v1 exists, but this structure allows for future migrations
  switch (version) {
    case 1:
      return data;
    default:
      console.warn(`Unknown animation version: ${version}, using as-is`);
      return data;
  }
}

/**
 * Compress animation data by removing default values
 */
export function compressAnimation(data: IAnimationComponent): Partial<IAnimationComponent> {
  const compressed: Partial<IAnimationComponent> = {};

  // Only include non-default values
  if (data.activeClipId !== undefined) compressed.activeClipId = data.activeClipId;
  if (data.playing !== false) compressed.playing = data.playing;
  if (data.time !== 0) compressed.time = data.time;
  if (data.clips.length > 0) compressed.clips = data.clips;
  if (data.version !== 1) compressed.version = data.version;

  return compressed;
}

/**
 * Decompress animation data by filling in default values
 */
export function decompressAnimation(data: Partial<IAnimationComponent>): IAnimationComponent {
  return {
    activeClipId: data.activeClipId,
    playing: data.playing ?? false,
    time: data.time ?? 0,
    clips: data.clips ?? [],
    version: data.version ?? 1,
  };
}
