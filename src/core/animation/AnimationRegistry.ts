import type { IAnimationAsset } from './assets/defineAnimations';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AnimationRegistry');

/**
 * Central registry for animation clip assets
 * Mirrors MaterialRegistry pattern for consistent asset management
 * Follows dependency injection pattern instead of singleton for better testability
 *
 * @example
 * ```typescript
 * const registry = AnimationRegistry.getInstance();
 * registry.load(animationAssets);
 * const clip = registry.get('walkCycle');
 * ```
 */
export class AnimationRegistry {
  private static instance: AnimationRegistry | null = null;

  /**
   * Get or create singleton instance
   */
  static getInstance(): AnimationRegistry {
    if (!this.instance) {
      this.instance = new AnimationRegistry();
    }
    return this.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  private idToClip = new Map<string, IAnimationAsset>();

  /**
   * Load multiple animation assets into the registry
   * Typically called during app initialization from library/scene assets
   *
   * @param assets - Array of animation assets to load
   */
  load(assets: IAnimationAsset[]): void {
    logger.debug('Loading animation assets', { count: assets.length });

    assets.forEach((asset) => {
      this.idToClip.set(asset.id, asset);
    });

    logger.info('Animation assets loaded', {
      count: assets.length,
      ids: assets.map((a) => a.id),
    });
  }

  /**
   * Insert or update a single animation asset
   * Used when creating/editing animations in the editor
   *
   * @param asset - Animation asset to upsert
   */
  upsert(asset: IAnimationAsset): void {
    const isUpdate = this.idToClip.has(asset.id);
    this.idToClip.set(asset.id, asset);

    logger.debug(isUpdate ? 'Animation asset updated' : 'Animation asset created', {
      id: asset.id,
      name: asset.name,
    });
  }

  /**
   * Get an animation asset by ID
   *
   * @param id - Asset ID to retrieve
   * @returns Animation asset or undefined if not found
   */
  get(id: string): IAnimationAsset | undefined {
    return this.idToClip.get(id);
  }

  /**
   * Check if an animation asset exists
   *
   * @param id - Asset ID to check
   * @returns True if asset exists
   */
  has(id: string): boolean {
    return this.idToClip.has(id);
  }

  /**
   * List all animation assets
   *
   * @returns Array of all registered animation assets
   */
  list(): IAnimationAsset[] {
    return Array.from(this.idToClip.values());
  }

  /**
   * Remove an animation asset by ID
   *
   * @param id - Asset ID to remove
   * @returns True if asset was removed, false if not found
   */
  remove(id: string): boolean {
    const existed = this.idToClip.has(id);
    this.idToClip.delete(id);

    if (existed) {
      logger.debug('Animation asset removed', { id });
    }

    return existed;
  }

  /**
   * Clear all animation assets
   * Primarily for testing
   */
  clear(): void {
    this.idToClip.clear();
    logger.debug('Animation registry cleared');
  }

  /**
   * Get total number of registered animation assets
   *
   * @returns Count of animation assets
   */
  count(): number {
    return this.idToClip.size;
  }
}
