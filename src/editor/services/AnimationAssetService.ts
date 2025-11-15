import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AnimationAssetService');

/**
 * Animation Asset Service
 * Handles API operations for animation assets
 * Mirrors MaterialAssetService pattern
 */
export class AnimationAssetService {
  private static baseUrl = '/api/assets/animation';

  /**
   * Save an animation asset to the filesystem
   * @param animation - Animation asset to save
   * @param path - Asset path (e.g., '@/animations/walk' or './animations/SceneName')
   */
  static async save(animation: IAnimationAsset, path?: string): Promise<void> {
    const assetPath = path || `@/animations/${animation.id}`;

    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: assetPath,
          payload: animation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save animation');
      }

      const result = await response.json();
      logger.info('Animation saved', {
        id: animation.id,
        path: assetPath,
        filename: result.filename,
      });
    } catch (error) {
      logger.error('Failed to save animation', { error, id: animation.id });
      throw error;
    }
  }

  /**
   * Load an animation asset from the filesystem
   * @param path - Asset path (e.g., '@/animations/walk')
   * @returns Animation asset
   */
  static async load(path: string): Promise<IAnimationAsset> {
    try {
      const response = await fetch(`${this.baseUrl}/load?path=${encodeURIComponent(path)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load animation');
      }

      const result = await response.json();
      logger.info('Animation loaded', { path, id: result.payload.id });

      return result.payload as IAnimationAsset;
    } catch (error) {
      logger.error('Failed to load animation', { error, path });
      throw error;
    }
  }

  /**
   * List all animation assets
   * @param scope - 'library' or 'scene'
   * @param sceneName - Scene name (required if scope is 'scene')
   * @returns Array of animation asset metadata
   */
  static async list(
    scope: 'library' | 'scene' = 'library',
    sceneName?: string,
  ): Promise<Array<{ filename: string; path: string; size: number; type: string }>> {
    try {
      const params = new URLSearchParams({ scope });
      if (sceneName) {
        params.append('scene', sceneName);
      }

      const response = await fetch(`${this.baseUrl}/list?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to list animations');
      }

      const result = await response.json();
      logger.debug('Animations listed', { scope, count: result.assets.length });

      return result.assets;
    } catch (error) {
      logger.error('Failed to list animations', { error, scope });
      throw error;
    }
  }

  /**
   * Delete an animation asset
   * @param path - Asset path (e.g., '@/animations/walk')
   */
  static async delete(path: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete animation');
      }

      logger.info('Animation deleted', { path });
    } catch (error) {
      logger.error('Failed to delete animation', { error, path });
      throw error;
    }
  }
}
