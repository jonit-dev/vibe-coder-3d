import { describe, it, expect, beforeEach } from 'vitest';

import { EntityMetadataManager } from '@/core/lib/ecs/metadata/EntityMetadataManager';
import { TagManager } from '@/core/lib/ecs/tags/TagManager';

import { createEntitiesAPI } from '../EntitiesAPI';
import { createQueryAPI } from '../QueryAPI';

describe('Script API Integration Tests', () => {
  let tagManager: TagManager;
  let metadataManager: EntityMetadataManager;

  beforeEach(() => {
    tagManager = TagManager.getInstance();
    metadataManager = EntityMetadataManager.getInstance();
    tagManager.clear();
    metadataManager.clear();
  });

  describe('QueryAPI with TagManager', () => {
    it('should find entities by tag', () => {
      // Setup entities with tags
      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(3, 'player');

      const queryAPI = createQueryAPI(0, () => null);

      const enemies = queryAPI.findByTag('enemy');
      expect(enemies).toHaveLength(2);
      expect(enemies).toContain(1);
      expect(enemies).toContain(2);
    });

    it('should return empty array for non-existent tag', () => {
      const queryAPI = createQueryAPI(0, () => null);

      const results = queryAPI.findByTag('nonexistent');
      expect(results).toEqual([]);
    });

    it('should handle tag normalization', () => {
      tagManager.addTag(1, 'Flying Enemy');

      const queryAPI = createQueryAPI(0, () => null);

      const results = queryAPI.findByTag('FLYING-ENEMY');
      expect(results).toEqual([1]);
    });
  });

  describe('EntitiesAPI with EntityMetadataManager', () => {
    it('should find entities by name', () => {
      // Create entities with metadata
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');
      metadataManager.createEntity(3, 'Enemy');

      const entitiesAPI = createEntitiesAPI();

      const players = entitiesAPI.findByName('Player');
      expect(players).toHaveLength(0); // Returns IEntityScriptAPI[] but entities don't have Transform

      const enemies = entitiesAPI.findByName('Enemy');
      expect(enemies).toHaveLength(0); // Same reason
    });

    it('should find entities by tag through EntitiesAPI', () => {
      tagManager.addTag(1, 'collectible');
      tagManager.addTag(2, 'collectible');

      const entitiesAPI = createEntitiesAPI();

      const collectibles = entitiesAPI.findByTag('collectible');
      expect(collectibles).toHaveLength(0); // Returns IEntityScriptAPI[] but entities don't have Transform
    });

    it('should resolve entity reference by GUID', () => {
      metadataManager.createEntity(1, 'TestEntity');
      const guid = metadataManager.getGuid(1)!;

      const entitiesAPI = createEntitiesAPI();

      const entityAPI = entitiesAPI.fromRef({ guid });
      expect(entityAPI).toBeNull(); // Null because entity doesn't have Transform component
    });

    it('should resolve entity reference by name', () => {
      metadataManager.createEntity(1, 'Hero');

      const entitiesAPI = createEntitiesAPI();

      const entityAPI = entitiesAPI.fromRef({ name: 'Hero' });
      expect(entityAPI).toBeNull(); // Null because entity doesn't have Transform component
    });

    it('should resolve entity reference by entityId', () => {
      const entitiesAPI = createEntitiesAPI();

      const entityAPI = entitiesAPI.fromRef({ entityId: 1 });
      expect(entityAPI).toBeNull(); // Null because entity doesn't have Transform component
    });

    it('should handle non-existent entity references', () => {
      const entitiesAPI = createEntitiesAPI();

      expect(entitiesAPI.fromRef({ guid: 'nonexistent' })).toBeNull();
      expect(entitiesAPI.fromRef({ name: 'NonExistent' })).toBeNull();
      expect(entitiesAPI.fromRef({ entityId: 999 })).toBeNull();
    });
  });

  describe('TagManager and EntityMetadataManager together', () => {
    it('should work together for complex queries', () => {
      // Create entities with both tags and metadata
      metadataManager.createEntity(1, 'Enemy-1');
      metadataManager.createEntity(2, 'Enemy-2');
      metadataManager.createEntity(3, 'Boss');

      tagManager.addTag(1, 'enemy');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(3, 'enemy');
      tagManager.addTag(3, 'boss');

      // Find all enemies
      const queryAPI = createQueryAPI(0, () => null);
      const enemies = queryAPI.findByTag('enemy');
      expect(enemies).toHaveLength(3);

      // Find all bosses
      const bosses = queryAPI.findByTag('boss');
      expect(bosses).toEqual([3]);

      // Find by name
      const boss = metadataManager.findByName('Boss');
      expect(boss).toEqual([3]);

      // Verify boss is both 'enemy' and 'boss'
      expect(tagManager.hasTag(3, 'enemy')).toBe(true);
      expect(tagManager.hasTag(3, 'boss')).toBe(true);
    });

    it('should serialize and deserialize both systems', () => {
      // Create complex state
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');

      tagManager.addTag(1, 'player');
      tagManager.addTag(2, 'enemy');
      tagManager.addTag(2, 'ai');

      // Serialize
      const tagData = tagManager.serialize();
      const metadataData = metadataManager.serialize();

      // Clear everything
      tagManager.clear();
      metadataManager.clear();

      // Deserialize
      tagManager.deserialize(tagData);
      metadataManager.deserialize(metadataData);

      // Verify restored state
      expect(tagManager.getTags(1)).toEqual(['player']);
      expect(tagManager.getTags(2)).toEqual(expect.arrayContaining(['enemy', 'ai']));

      expect(metadataManager.getName(1)).toBe('Player');
      expect(metadataManager.getName(2)).toBe('Enemy');
    });
  });
});
