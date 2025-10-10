import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaySessionTracker } from '../PlaySessionTracker';
import { Logger } from '@/core/lib/logger';

vi.mock('@/core/lib/logger', () => ({
  Logger: {
    create: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

describe('PlaySessionTracker', () => {
  let tracker: PlaySessionTracker;

  beforeEach(() => {
    tracker = PlaySessionTracker.getInstance();
    tracker.reset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PlaySessionTracker.getInstance();
      const instance2 = PlaySessionTracker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Play Mode Management', () => {
    it('should start play mode and clear tracked entities', () => {
      tracker.markCreated(1);
      tracker.startPlayMode();

      expect(tracker.isInPlayMode()).toBe(true);
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should stop play mode', () => {
      tracker.startPlayMode();
      tracker.stopPlayMode();

      expect(tracker.isInPlayMode()).toBe(false);
    });

    it('should not track entities when not in play mode', () => {
      tracker.markCreated(1);

      expect(tracker.wasCreatedDuringPlay(1)).toBe(false);
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should track entities during play mode', () => {
      tracker.startPlayMode();
      tracker.markCreated(1);
      tracker.markCreated(2);

      expect(tracker.wasCreatedDuringPlay(1)).toBe(true);
      expect(tracker.wasCreatedDuringPlay(2)).toBe(true);
      expect(tracker.getTrackedCount()).toBe(2);
    });
  });

  describe('Entity Tracking', () => {
    beforeEach(() => {
      tracker.startPlayMode();
    });

    it('should mark entities as created during play', () => {
      tracker.markCreated(1);
      tracker.markCreated(2);
      tracker.markCreated(3);

      expect(tracker.getTrackedCount()).toBe(3);
    });

    it('should not duplicate entity IDs', () => {
      tracker.markCreated(1);
      tracker.markCreated(1);
      tracker.markCreated(1);

      expect(tracker.getTrackedCount()).toBe(1);
    });

    it('should check if entity was created during play', () => {
      tracker.markCreated(1);

      expect(tracker.wasCreatedDuringPlay(1)).toBe(true);
      expect(tracker.wasCreatedDuringPlay(2)).toBe(false);
    });

    it('should get all created entities', () => {
      tracker.markCreated(1);
      tracker.markCreated(2);
      tracker.markCreated(3);

      const entities = tracker.getCreatedEntities();
      expect(entities).toEqual(expect.arrayContaining([1, 2, 3]));
      expect(entities).toHaveLength(3);
    });

    it('should untrack entities', () => {
      tracker.markCreated(1);
      tracker.markCreated(2);

      tracker.untrack(1);

      expect(tracker.wasCreatedDuringPlay(1)).toBe(false);
      expect(tracker.wasCreatedDuringPlay(2)).toBe(true);
      expect(tracker.getTrackedCount()).toBe(1);
    });
  });

  describe('Cleanup on Stop', () => {
    beforeEach(() => {
      tracker.startPlayMode();
    });

    it('should clean up all tracked entities using delete function', () => {
      const deleteFn = vi.fn();
      tracker.markCreated(1);
      tracker.markCreated(2);
      tracker.markCreated(3);

      tracker.cleanupOnStop(deleteFn);

      expect(deleteFn).toHaveBeenCalledTimes(3);
      expect(deleteFn).toHaveBeenCalledWith(1);
      expect(deleteFn).toHaveBeenCalledWith(2);
      expect(deleteFn).toHaveBeenCalledWith(3);
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should handle errors during cleanup gracefully', () => {
      const deleteFn = vi.fn().mockImplementation((eid) => {
        if (eid === 2) {
          throw new Error('Delete failed');
        }
      });

      tracker.markCreated(1);
      tracker.markCreated(2);
      tracker.markCreated(3);

      expect(() => tracker.cleanupOnStop(deleteFn)).not.toThrow();
      expect(deleteFn).toHaveBeenCalledTimes(3);
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should clear tracking after cleanup', () => {
      const deleteFn = vi.fn();
      tracker.markCreated(1);
      tracker.markCreated(2);

      tracker.cleanupOnStop(deleteFn);

      expect(tracker.getTrackedCount()).toBe(0);
      expect(tracker.getCreatedEntities()).toHaveLength(0);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      tracker.startPlayMode();
      tracker.markCreated(1);
      tracker.markCreated(2);

      tracker.reset();

      expect(tracker.isInPlayMode()).toBe(false);
      expect(tracker.getTrackedCount()).toBe(0);
      expect(tracker.getCreatedEntities()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle cleanup with no entities', () => {
      const deleteFn = vi.fn();
      tracker.startPlayMode();

      tracker.cleanupOnStop(deleteFn);

      expect(deleteFn).not.toHaveBeenCalled();
      expect(tracker.getTrackedCount()).toBe(0);
    });

    it('should handle untracking non-existent entity', () => {
      tracker.startPlayMode();
      tracker.markCreated(1);

      expect(() => tracker.untrack(999)).not.toThrow();
      expect(tracker.getTrackedCount()).toBe(1);
    });

    it('should maintain separate tracking across play sessions', () => {
      tracker.startPlayMode();
      tracker.markCreated(1);
      tracker.stopPlayMode();

      tracker.startPlayMode();
      tracker.markCreated(2);

      expect(tracker.wasCreatedDuringPlay(1)).toBe(false);
      expect(tracker.wasCreatedDuringPlay(2)).toBe(true);
      expect(tracker.getTrackedCount()).toBe(1);
    });
  });
});
