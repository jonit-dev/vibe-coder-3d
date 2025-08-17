import { describe, it, expect, beforeEach } from 'vitest';

import {
  registerTag,
  unregisterTag,
  getNodes,
  clearTag,
  clearAllTags,
  getAllTags,
  getTagCounts,
} from '../tags';

describe('tags system', () => {
  beforeEach(() => {
    clearAllTags();
  });

  describe('registerTag', () => {
    it('should register a tag with a ref', () => {
      const ref = { current: null };
      registerTag('player', ref);

      const nodes = getNodes('player');
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toBe(ref);
    });

    it('should handle multiple refs for the same tag', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('enemy', ref1);
      registerTag('enemy', ref2);

      const nodes = getNodes('enemy');
      expect(nodes).toHaveLength(2);
      expect(nodes).toContain(ref1);
      expect(nodes).toContain(ref2);
    });

    it('should handle the same ref registered multiple times', () => {
      const ref = { current: null };

      registerTag('player', ref);
      registerTag('player', ref);

      const nodes = getNodes('player');
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toBe(ref);
    });

    it('should handle multiple tags for different refs', () => {
      const playerRef = { current: null };
      const enemyRef = { current: null };

      registerTag('player', playerRef);
      registerTag('enemy', enemyRef);

      const playerNodes = getNodes('player');
      const enemyNodes = getNodes('enemy');

      expect(playerNodes).toHaveLength(1);
      expect(playerNodes[0]).toBe(playerRef);
      expect(enemyNodes).toHaveLength(1);
      expect(enemyNodes[0]).toBe(enemyRef);
    });
  });

  describe('unregisterTag', () => {
    it('should unregister a tag', () => {
      const ref = { current: null };

      registerTag('player', ref);
      expect(getNodes('player')).toHaveLength(1);

      unregisterTag('player', ref);
      expect(getNodes('player')).toHaveLength(0);
    });

    it('should handle unregistering non-existent tag gracefully', () => {
      const ref = { current: null };

      expect(() => unregisterTag('nonexistent', ref)).not.toThrow();
      expect(getNodes('nonexistent')).toHaveLength(0);
    });

    it('should handle unregistering non-existent ref gracefully', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('player', ref1);

      expect(() => unregisterTag('player', ref2)).not.toThrow();
      expect(getNodes('player')).toHaveLength(1);
    });

    it('should clean up empty tag sets', () => {
      const ref = { current: null };

      registerTag('player', ref);
      unregisterTag('player', ref);

      expect(getAllTags()).not.toContain('player');
    });

    it('should only remove the specific ref when multiple refs exist', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('enemy', ref1);
      registerTag('enemy', ref2);

      unregisterTag('enemy', ref1);

      const nodes = getNodes('enemy');
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toBe(ref2);
    });
  });

  describe('getNodes', () => {
    it('should return empty array for non-existent tag', () => {
      const nodes = getNodes('nonexistent');
      expect(nodes).toEqual([]);
    });

    it('should return all nodes for a tag', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };
      const ref3 = { current: null };

      registerTag('collectible', ref1);
      registerTag('collectible', ref2);
      registerTag('collectible', ref3);

      const nodes = getNodes('collectible');
      expect(nodes).toHaveLength(3);
      expect(nodes).toContain(ref1);
      expect(nodes).toContain(ref2);
      expect(nodes).toContain(ref3);
    });

    it('should return strongly typed refs', () => {
      const ref = { current: null } as unknown as React.RefObject<HTMLDivElement>;
      registerTag('ui-element', ref);

      const nodes = getNodes<HTMLDivElement>('ui-element');
      expect(nodes[0]).toBe(ref);
    });
  });

  describe('clearTag', () => {
    it('should clear all refs for a specific tag', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('powerup', ref1);
      registerTag('powerup', ref2);
      registerTag('player', ref1);

      clearTag('powerup');

      expect(getNodes('powerup')).toHaveLength(0);
      expect(getNodes('player')).toHaveLength(1);
    });

    it('should handle clearing non-existent tag gracefully', () => {
      expect(() => clearTag('nonexistent')).not.toThrow();
    });
  });

  describe('clearAllTags', () => {
    it('should clear all tags', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('player', ref1);
      registerTag('enemy', ref2);
      registerTag('powerup', ref1);

      clearAllTags();

      expect(getAllTags()).toHaveLength(0);
      expect(getNodes('player')).toHaveLength(0);
      expect(getNodes('enemy')).toHaveLength(0);
      expect(getNodes('powerup')).toHaveLength(0);
    });

    it('should handle clearing when no tags exist', () => {
      expect(() => clearAllTags()).not.toThrow();
      expect(getAllTags()).toHaveLength(0);
    });
  });

  describe('getAllTags', () => {
    it('should return empty array when no tags exist', () => {
      expect(getAllTags()).toEqual([]);
    });

    it('should return all registered tag names', () => {
      const ref = { current: null };

      registerTag('player', ref);
      registerTag('enemy', ref);
      registerTag('collectible', ref);

      const tags = getAllTags();
      expect(tags).toHaveLength(3);
      expect(tags).toContain('player');
      expect(tags).toContain('enemy');
      expect(tags).toContain('collectible');
    });

    it('should not return duplicate tag names', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('enemy', ref1);
      registerTag('enemy', ref2);

      const tags = getAllTags();
      expect(tags).toEqual(['enemy']);
    });
  });

  describe('getTagCounts', () => {
    it('should return empty object when no tags exist', () => {
      expect(getTagCounts()).toEqual({});
    });

    it('should return counts for all tags', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };
      const ref3 = { current: null };

      registerTag('player', ref1);
      registerTag('enemy', ref1);
      registerTag('enemy', ref2);
      registerTag('collectible', ref1);
      registerTag('collectible', ref2);
      registerTag('collectible', ref3);

      const counts = getTagCounts();
      expect(counts).toEqual({
        player: 1,
        enemy: 2,
        collectible: 3,
      });
    });

    it('should update counts when tags are removed', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      registerTag('enemy', ref1);
      registerTag('enemy', ref2);

      expect(getTagCounts().enemy).toBe(2);

      unregisterTag('enemy', ref1);

      expect(getTagCounts().enemy).toBe(1);
    });

    it('should remove tags from counts when they become empty', () => {
      const ref = { current: null };

      registerTag('temporary', ref);
      expect(getTagCounts().temporary).toBe(1);

      unregisterTag('temporary', ref);
      expect(getTagCounts().temporary).toBeUndefined();
    });
  });
});
