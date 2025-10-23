/**
 * EntitiesAPI Tests
 */

import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createEntitiesAPI } from '../EntitiesAPI';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityMetadataManager } from '@/core/lib/ecs/metadata/EntityMetadataManager';
import { TagManager } from '@/core/lib/ecs/tags/TagManager';

describe('EntitiesAPI', () => {
  let entitiesAPI: ReturnType<typeof createEntitiesAPI>;
  let entityManager: EntityManager;
  let metadataManager: EntityMetadataManager;
  let tagManager: TagManager;

  beforeEach(() => {
    // Get singleton instances
    entityManager = EntityManager.getInstance();
    metadataManager = EntityMetadataManager.getInstance();
    tagManager = TagManager.getInstance();

    // Clear any existing data
    metadataManager.clear();
    tagManager.clear();

    // Create test entities with metadata and components
    const player1 = entityManager.createEntity('Player');
    metadataManager.createEntity(player1.id, 'Player');
    componentRegistry.addComponent(player1.id, 'Transform', {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    tagManager.addTag(player1.id, 'player');

    const enemy = entityManager.createEntity('Enemy');
    metadataManager.createEntity(enemy.id, 'Enemy');
    componentRegistry.addComponent(enemy.id, 'Transform', {
      position: [5, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    tagManager.addTag(enemy.id, 'enemy');

    const player2 = entityManager.createEntity('Player');
    metadataManager.createEntity(player2.id, 'Player');
    componentRegistry.addComponent(player2.id, 'Transform', {
      position: [10, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    tagManager.addTag(player2.id, 'player');

    const coin = entityManager.createEntity('Coin');
    metadataManager.createEntity(coin.id, 'Coin');
    componentRegistry.addComponent(coin.id, 'Transform', {
      position: [2, 2, 2],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
    });
    tagManager.addTag(coin.id, 'collectible');
    tagManager.addTag(coin.id, 'item');

    entitiesAPI = createEntitiesAPI();
  });

  afterEach(() => {
    // Clean up after tests
    metadataManager.clear();
    tagManager.clear();
  });

  it('should create an entities API instance', () => {
    expect(entitiesAPI).toBeDefined();
    expect(entitiesAPI.fromRef).toBeInstanceOf(Function);
    expect(entitiesAPI.get).toBeInstanceOf(Function);
    expect(entitiesAPI.findByName).toBeInstanceOf(Function);
    expect(entitiesAPI.findByTag).toBeInstanceOf(Function);
    expect(entitiesAPI.exists).toBeInstanceOf(Function);
  });

  describe('get', () => {
    it('should resolve entity by ID', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const entity = entitiesAPI.get(firstEntityId);

      expect(entity).toBeTruthy();
      expect(entity?.id).toBe(firstEntityId);
    });

    it('should return null for non-existent entity ID', () => {
      const entity = entitiesAPI.get(999999);
      expect(entity).toBeNull();
    });

    it('should return entity with API methods', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const entity = entitiesAPI.get(firstEntityId);

      expect(entity).toBeTruthy();
      expect(entity?.transform).toBeDefined();
      expect(entity?.getComponent).toBeInstanceOf(Function);
      expect(entity?.setComponent).toBeInstanceOf(Function);
      expect(entity?.hasComponent).toBeInstanceOf(Function);
    });
  });

  describe('exists', () => {
    it('should return true for existing entities', () => {
      const entities = entityManager.getAllEntities();
      entities.forEach((e) => {
        expect(entitiesAPI.exists(e.id)).toBe(true);
      });
    });

    it('should return false for non-existent entities', () => {
      expect(entitiesAPI.exists(999999)).toBe(false);
      expect(entitiesAPI.exists(-1)).toBe(false);
    });
  });

  describe('fromRef', () => {
    it('should resolve entity reference by number', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const entity = entitiesAPI.fromRef(firstEntityId);

      expect(entity).toBeTruthy();
      expect(entity?.id).toBe(firstEntityId);
    });

    it('should resolve entity reference by IEntityRef with entityId', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const ref = { entityId: firstEntityId };
      const entity = entitiesAPI.fromRef(ref);

      expect(entity).toBeTruthy();
      expect(entity?.id).toBe(firstEntityId);
    });

    it('should resolve entity reference by GUID', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const guid = metadataManager.getGuid(firstEntityId);

      if (guid) {
        const ref = { guid };
        const entity = entitiesAPI.fromRef(ref);

        expect(entity).toBeTruthy();
        expect(entity?.id).toBe(firstEntityId);
      }
    });

    it('should resolve entity reference by name (returns first match)', () => {
      const ref = { name: 'Player' };
      const entity = entitiesAPI.fromRef(ref);

      expect(entity).toBeTruthy();
      expect(entity?.name).toBe('Player');
    });

    it('should resolve entity reference by string GUID', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const guid = metadataManager.getGuid(firstEntityId);

      if (guid) {
        const entity = entitiesAPI.fromRef(guid);

        expect(entity).toBeTruthy();
        expect(entity?.id).toBe(firstEntityId);
      }
    });

    it('should return null for invalid entity reference', () => {
      const ref = { entityId: 999999 };
      const entity = entitiesAPI.fromRef(ref);
      expect(entity).toBeNull();
    });

    it('should return null for non-existent GUID', () => {
      const ref = { guid: 'non-existent-guid-12345' };
      const entity = entitiesAPI.fromRef(ref);
      expect(entity).toBeNull();
    });

    it('should return null for non-existent name', () => {
      const ref = { name: 'NonExistentEntity' };
      const entity = entitiesAPI.fromRef(ref);
      expect(entity).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find multiple entities with same name', () => {
      const playerEntities = entitiesAPI.findByName('Player');

      expect(Array.isArray(playerEntities)).toBe(true);
      expect(playerEntities.length).toBe(2);
      playerEntities.forEach((entity) => {
        expect(entity.name).toBe('Player');
      });
    });

    it('should find single entity by unique name', () => {
      const enemyEntities = entitiesAPI.findByName('Enemy');

      expect(Array.isArray(enemyEntities)).toBe(true);
      expect(enemyEntities.length).toBe(1);
      expect(enemyEntities[0].name).toBe('Enemy');
    });

    it('should return empty array for non-existent name', () => {
      const entities = entitiesAPI.findByName('NonExistent');

      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    });

    it('should handle case-sensitive name search', () => {
      const exactMatch = entitiesAPI.findByName('Player');
      const wrongCase = entitiesAPI.findByName('player');

      expect(exactMatch.length).toBe(2);
      expect(wrongCase.length).toBe(0);
    });
  });

  describe('findByTag', () => {
    it('should find multiple entities with same tag', () => {
      const playerEntities = entitiesAPI.findByTag('player');

      expect(Array.isArray(playerEntities)).toBe(true);
      expect(playerEntities.length).toBe(2);
    });

    it('should find single entity by unique tag', () => {
      const enemyEntities = entitiesAPI.findByTag('enemy');

      expect(Array.isArray(enemyEntities)).toBe(true);
      expect(enemyEntities.length).toBe(1);
    });

    it('should return empty array for non-existent tag', () => {
      const entities = entitiesAPI.findByTag('nonexistent');

      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(0);
    });

    it('should find entity with multiple tags', () => {
      const collectibles = entitiesAPI.findByTag('collectible');
      const items = entitiesAPI.findByTag('item');

      expect(collectibles.length).toBe(1);
      expect(items.length).toBe(1);
      expect(collectibles[0].id).toBe(items[0].id); // Same entity
    });

    it('should normalize tags (case-insensitive)', () => {
      const lowerCase = entitiesAPI.findByTag('player');
      const upperCase = entitiesAPI.findByTag('PLAYER');
      const mixedCase = entitiesAPI.findByTag('PlaYeR');

      expect(lowerCase.length).toBe(2);
      expect(upperCase.length).toBe(2);
      expect(mixedCase.length).toBe(2);
    });
  });

  describe('entity API integration', () => {
    it('should provide working transform API', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const entity = entitiesAPI.get(firstEntityId);

      expect(entity).toBeTruthy();
      expect(entity?.transform).toBeDefined();
      expect(entity?.transform.position).toBeDefined();
      expect(entity?.transform.rotation).toBeDefined();
      expect(entity?.transform.scale).toBeDefined();
    });

    it('should provide working component access', () => {
      const entities = entityManager.getAllEntities();
      const firstEntityId = entities[0].id;
      const entity = entitiesAPI.get(firstEntityId);

      expect(entity).toBeTruthy();
      expect(entity?.hasComponent('Transform')).toBe(true);

      const transform = entity?.getComponent('Transform');
      expect(transform).toBeDefined();
      expect(transform).toHaveProperty('position');
      expect(transform).toHaveProperty('rotation');
      expect(transform).toHaveProperty('scale');
    });

    it('should handle multiple entity lookups', () => {
      const entities = entityManager.getAllEntities();
      const entity1 = entitiesAPI.get(entities[0].id);
      const entity2 = entitiesAPI.get(entities[1].id);
      const entity3 = entitiesAPI.get(entities[2].id);

      expect(entity1?.id).toBe(entities[0].id);
      expect(entity2?.id).toBe(entities[1].id);
      expect(entity3?.id).toBe(entities[2].id);
    });

    it('should handle mixed valid and invalid references', () => {
      const entities = entityManager.getAllEntities();
      const valid = entitiesAPI.fromRef(entities[0].id);
      const invalid = entitiesAPI.fromRef(999999);

      expect(valid).toBeTruthy();
      expect(invalid).toBeNull();
    });
  });
});
