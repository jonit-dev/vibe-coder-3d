/**
 * Play Session Tracker
 * Tracks entities created during play mode for automatic cleanup on Stop
 */

import { Logger } from '@/core/lib/logger';
import { EntityId } from '@/core/lib/ecs/types';

const logger = Logger.create('PlaySessionTracker');

export class PlaySessionTracker {
  private static instance: PlaySessionTracker;
  private createdDuringPlay = new Set<EntityId>();
  private isPlayMode = false;

  private constructor() {}

  public static getInstance(): PlaySessionTracker {
    if (!PlaySessionTracker.instance) {
      PlaySessionTracker.instance = new PlaySessionTracker();
    }
    return PlaySessionTracker.instance;
  }

  /**
   * Mark the start of play mode
   */
  public startPlayMode(): void {
    this.isPlayMode = true;
    this.createdDuringPlay.clear();
    logger.debug('Play mode started, tracking enabled');
  }

  /**
   * Mark the end of play mode
   */
  public stopPlayMode(): void {
    this.isPlayMode = false;
    logger.debug('Play mode stopped, tracking disabled');
  }

  /**
   * Check if currently in play mode
   */
  public isInPlayMode(): boolean {
    return this.isPlayMode;
  }

  /**
   * Mark an entity as created during play mode
   * @param entityId Entity ID to track
   */
  public markCreated(entityId: EntityId): void {
    if (this.isPlayMode) {
      this.createdDuringPlay.add(entityId);
      logger.debug('Marked entity as play-created', { entityId });
    }
  }

  /**
   * Check if an entity was created during play mode
   * @param entityId Entity ID to check
   */
  public wasCreatedDuringPlay(entityId: EntityId): boolean {
    return this.createdDuringPlay.has(entityId);
  }

  /**
   * Get all entities created during play mode
   */
  public getCreatedEntities(): EntityId[] {
    return Array.from(this.createdDuringPlay);
  }

  /**
   * Clean up all play-created entities using provided delete function
   * @param deleteFn Function to delete an entity
   */
  public cleanupOnStop(deleteFn: (eid: EntityId) => void): void {
    const count = this.createdDuringPlay.size;
    logger.info('Cleaning up play-created entities', { count });

    this.createdDuringPlay.forEach((eid) => {
      try {
        deleteFn(eid);
      } catch (error) {
        logger.error('Failed to delete play-created entity', { entityId: eid, error });
      }
    });

    this.createdDuringPlay.clear();
    logger.debug('Play-created entities cleaned up');
  }

  /**
   * Manually remove an entity from tracking (e.g., if deleted during play)
   * @param entityId Entity ID to untrack
   */
  public untrack(entityId: EntityId): void {
    this.createdDuringPlay.delete(entityId);
  }

  /**
   * Reset tracker state (for testing)
   */
  public reset(): void {
    this.createdDuringPlay.clear();
    this.isPlayMode = false;
    logger.debug('Tracker reset');
  }

  /**
   * Get count of tracked entities
   */
  public getTrackedCount(): number {
    return this.createdDuringPlay.size;
  }
}
