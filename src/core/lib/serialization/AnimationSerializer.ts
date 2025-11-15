import { AnimationRegistry } from '@core/animation/AnimationRegistry';
import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AnimationSerializer');

/**
 * Animation Serializer
 * Handles serialization and deserialization of animation assets
 * Follows SRP pattern like MaterialSerializer and PrefabSerializer
 */
export class AnimationSerializer {
  /**
   * Serialize animations from the AnimationRegistry
   * @returns Array of animation assets
   */
  serialize(): IAnimationAsset[] {
    const registry = AnimationRegistry.getInstance();
    const animations = registry.list();

    logger.debug('Serialized animations', { count: animations.length });

    return animations;
  }

  /**
   * Deserialize animations into the AnimationRegistry
   * @param animations - Array of animation assets to load
   */
  deserialize(animations: IAnimationAsset[]): void {
    if (!animations || animations.length === 0) {
      logger.debug('No animations to deserialize');
      return;
    }

    const registry = AnimationRegistry.getInstance();
    registry.load(animations);

    logger.info('Deserialized animations', {
      count: animations.length,
      ids: animations.map((a) => a.id),
    });
  }
}
