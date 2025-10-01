import { describe, it, expect, beforeEach } from 'vitest';

import { TagManager } from '../TagManager';

describe('TagManager', () => {
  let tagManager: TagManager;

  beforeEach(() => {
    tagManager = TagManager.getInstance();
    tagManager.clear();
  });

  describe('addTag and removeTag', () => {
    it('should add a tag to an entity', () => {
      tagManager.addTag(1, 'enemy');

      expect(tagManager.hasTag(1, 'enemy')).toBe(true);
      expect(tagManager.getTags(1)).toEqual(['enemy']);
    });

    it('should remove a tag from an entity', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.removeTag(1, 'enemy');

      expect(tagManager.hasTag(1, 'enemy')).toBe(false);
      expect(tagManager.getTags(1)).toEqual([]);
    });

    it('should normalize tags to lowercase', () => {
      tagManager.addTag(1, 'Enemy');

      expect(tagManager.hasTag(1, 'enemy')).toBe(true);
      expect(tagManager.hasTag(1, 'Enemy')).toBe(true);
      expect(tagManager.getTags(1)).toEqual(['enemy']);
    });

    it('should replace spaces with dashes', () => {
      tagManager.addTag(1, 'flying enemy');

      expect(tagManager.hasTag(1, 'flying-enemy')).toBe(true);
      expect(tagManager.getTags(1)).toEqual(['flying-enemy']);
    });

    it('should not add duplicate tags', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(1, 'enemy');

      expect(tagManager.getTags(1)).toEqual(['enemy']);
    });

    it('should handle multiple tags on same entity', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(1, 'flying');
      tagManager.addTag(1, 'boss');

      const tags = tagManager.getTags(1);
      expect(tags).toHaveLength(3);
      expect(tags).toContain('enemy');
      expect(tags).toContain('flying');
      expect(tags).toContain('boss');
    });
  });

  describe('hasTag', () => {
    it('should return true if entity has tag', () => {
      tagManager.addTag(1, 'player');
      expect(tagManager.hasTag(1, 'player')).toBe(true);
    });

    it('should return false if entity does not have tag', () => {
      expect(tagManager.hasTag(1, 'player')).toBe(false);
    });

    it('should return false for non-existent entity', () => {
      expect(tagManager.hasTag(999, 'player')).toBe(false);
    });
  });

  describe('clearTags', () => {
    it('should remove all tags from entity', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(1, 'flying');
      tagManager.clearTags(1);

      expect(tagManager.getTags(1)).toEqual([]);
      expect(tagManager.hasTag(1, 'enemy')).toBe(false);
      expect(tagManager.hasTag(1, 'flying')).toBe(false);
    });
  });

  describe('setTags', () => {
    it('should replace existing tags', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.setTags(1, ['player', 'hero']);

      expect(tagManager.getTags(1)).toEqual(['player', 'hero']);
      expect(tagManager.hasTag(1, 'enemy')).toBe(false);
    });
  });

  describe('findByTag', () => {
    it('should find all entities with a tag', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(3, 'player');

      const enemies = tagManager.findByTag('enemy');
      expect(enemies).toHaveLength(2);
      expect(enemies).toContain(1);
      expect(enemies).toContain(2);
    });

    it('should return empty array if no entities have tag', () => {
      expect(tagManager.findByTag('nonexistent')).toEqual([]);
    });

    it('should handle normalized tag names', () => {
      tagManager.addTag(1, 'flying enemy');
      tagManager.addTag(2, 'Flying Enemy');

      const entities = tagManager.findByTag('FLYING-ENEMY');
      expect(entities).toHaveLength(2);
    });
  });

  describe('findByAllTags (AND query)', () => {
    it('should find entities with all specified tags', () => {
      tagManager.addTags(1, ['enemy', 'flying']);
      tagManager.addTags(2, ['enemy', 'ground']);
      tagManager.addTags(3, ['enemy', 'flying', 'boss']);

      const flyingEnemies = tagManager.findByAllTags(['enemy', 'flying']);
      expect(flyingEnemies).toHaveLength(2);
      expect(flyingEnemies).toContain(1);
      expect(flyingEnemies).toContain(3);
    });

    it('should return empty array if no entities match all tags', () => {
      tagManager.addTags(1, ['enemy']);
      tagManager.addTags(2, ['flying']);

      const result = tagManager.findByAllTags(['enemy', 'flying']);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty tags array', () => {
      expect(tagManager.findByAllTags([])).toEqual([]);
    });
  });

  describe('findByAnyTag (OR query)', () => {
    it('should find entities with any of the specified tags', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'boss');
      tagManager.addTag(3, 'player');

      const threats = tagManager.findByAnyTag(['enemy', 'boss']);
      expect(threats).toHaveLength(2);
      expect(threats).toContain(1);
      expect(threats).toContain(2);
    });

    it('should not duplicate entities with multiple matching tags', () => {
      tagManager.addTags(1, ['enemy', 'boss']);

      const result = tagManager.findByAnyTag(['enemy', 'boss']);
      expect(result).toEqual([1]);
    });

    it('should return empty array for empty tags array', () => {
      expect(tagManager.findByAnyTag([])).toEqual([]);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags in scene', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(3, 'player');
      tagManager.addTag(4, 'boss');

      const allTags = tagManager.getAllTags();
      expect(allTags).toHaveLength(3);
      expect(allTags).toContain('enemy');
      expect(allTags).toContain('player');
      expect(allTags).toContain('boss');
    });

    it('should return empty array when no tags exist', () => {
      expect(tagManager.getAllTags()).toEqual([]);
    });
  });

  describe('getEntityCount', () => {
    it('should return count of entities with tag', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(3, 'player');

      expect(tagManager.getEntityCount('enemy')).toBe(2);
      expect(tagManager.getEntityCount('player')).toBe(1);
      expect(tagManager.getEntityCount('nonexistent')).toBe(0);
    });
  });

  describe('renameTag', () => {
    it('should rename tag globally', () => {
      tagManager.addTag(1, 'old-name');
      tagManager.addTag(2, 'old-name');
      tagManager.renameTag('old-name', 'new-name');

      expect(tagManager.hasTag(1, 'new-name')).toBe(true);
      expect(tagManager.hasTag(2, 'new-name')).toBe(true);
      expect(tagManager.hasTag(1, 'old-name')).toBe(false);
      expect(tagManager.findByTag('old-name')).toEqual([]);
    });

    it('should handle same normalized names', () => {
      tagManager.addTag(1, 'test');
      tagManager.renameTag('test', 'Test');

      expect(tagManager.getTags(1)).toEqual(['test']); // Same normalized
    });
  });

  describe('destroyEntity', () => {
    it('should clean up all tags for entity', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(1, 'flying');
      tagManager.destroyEntity(1);

      expect(tagManager.getTags(1)).toEqual([]);
      expect(tagManager.findByTag('enemy')).toEqual([]);
      expect(tagManager.findByTag('flying')).toEqual([]);
    });

    it('should not affect other entities with same tags', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.destroyEntity(1);

      expect(tagManager.findByTag('enemy')).toEqual([2]);
    });
  });

  describe('serialize and deserialize', () => {
    it('should serialize tags to JSON-compatible format', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'player');
      tagManager.addTags(3, ['boss', 'enemy']);

      const serialized = tagManager.serialize();

      expect(serialized).toEqual({
        1: ['enemy'],
        2: ['player'],
        3: expect.arrayContaining(['boss', 'enemy']),
      });
    });

    it('should deserialize tags from JSON format', () => {
      const data = {
        1: ['enemy'],
        2: ['player'],
        3: ['boss', 'enemy'],
      };

      tagManager.deserialize(data);

      expect(tagManager.getTags(1)).toEqual(['enemy']);
      expect(tagManager.getTags(2)).toEqual(['player']);
      expect(tagManager.getTags(3)).toHaveLength(2);
      expect(tagManager.findByTag('enemy')).toHaveLength(2);
    });

    it('should round-trip serialize/deserialize', () => {
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'player');
      tagManager.addTags(3, ['boss', 'flying']);

      const serialized = tagManager.serialize();
      tagManager.clear();
      tagManager.deserialize(serialized);

      expect(tagManager.getTags(1)).toEqual(['enemy']);
      expect(tagManager.getTags(2)).toEqual(['player']);
      expect(tagManager.getTags(3)).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tag strings gracefully', () => {
      tagManager.addTag(1, '');
      expect(tagManager.getTags(1)).toEqual([]);
    });

    it('should handle whitespace-only tags', () => {
      tagManager.addTag(1, '   ');
      expect(tagManager.getTags(1)).toEqual([]);
    });

    it('should clean up empty sets when removing last entity with tag', () => {
      tagManager.addTag(1, 'unique-tag');
      tagManager.removeTag(1, 'unique-tag');

      // Tag should not exist in getAllTags
      expect(tagManager.getAllTags()).not.toContain('unique-tag');
    });
  });
});
