import {
  AnimationComponentSchema,
  type IAnimationComponent,
} from '@core/components/animation/AnimationComponent';

/**
 * Serialize animation component to JSON
 */
export function serializeAnimation(data: IAnimationComponent): unknown {
  // Validate before serialization
  const validated = AnimationComponentSchema.parse(data);

  return validated;
}

/**
 * Deserialize animation component from JSON
 */
export function deserializeAnimation(data: unknown): IAnimationComponent {
  return AnimationComponentSchema.parse(data);
}

/**
 * Compress animation data by removing default values
 */
export function compressAnimation(data: IAnimationComponent): Partial<IAnimationComponent> {
  const compressed: Partial<IAnimationComponent> = {};
  if (data.activeBindingId !== undefined) compressed.activeBindingId = data.activeBindingId;
  if (data.playing !== false) compressed.playing = data.playing;
  if (data.time !== 0) compressed.time = data.time;
  if (data.clipBindings.length > 0) compressed.clipBindings = data.clipBindings;
  return compressed;
}

/**
 * Decompress animation data by filling in default values
 */
export function decompressAnimation(data: Partial<IAnimationComponent>): IAnimationComponent {
  return {
    activeBindingId: data.activeBindingId,
    playing: data.playing ?? false,
    time: data.time ?? 0,
    clipBindings: data.clipBindings ?? [],
  };
}
