import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EntityMetadataManager } from '../EntityMetadataManager';

// Mock uuid to make tests deterministic
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
}));

describe('EntityMetadataManager', () => {
  let metadataManager: EntityMetadataManager;

  beforeEach(() => {
    metadataManager = EntityMetadataManager.getInstance();
    metadataManager.clear();
  });

  describe('createEntity', () => {
    it('should create entity with default name', () => {
      metadataManager.createEntity(1);

      expect(metadataManager.getName(1)).toBe('Entity 1');
    });

    it('should create entity with custom name', () => {
      metadataManager.createEntity(1, 'Player');

      expect(metadataManager.getName(1)).toBe('Player');
    });

    it('should generate GUID automatically', () => {
      metadataManager.createEntity(1);

      const guid = metadataManager.getGuid(1);
      expect(guid).toBeTruthy();
      expect(typeof guid).toBe('string');
    });

    it('should set creation and modification timestamps', () => {
      const before = Date.now();
      metadataManager.createEntity(1);
      const after = Date.now();

      const metadata = metadataManager.getMetadata(1);
      expect(metadata).toBeTruthy();
      expect(metadata!.created).toBeGreaterThanOrEqual(before);
      expect(metadata!.created).toBeLessThanOrEqual(after);
      expect(metadata!.modified).toBe(metadata!.created);
    });
  });

  describe('setName and getName', () => {
    it('should set and get entity name', () => {
      metadataManager.createEntity(1);
      metadataManager.setName(1, 'Hero');

      expect(metadataManager.getName(1)).toBe('Hero');
    });

    it('should update name index when name changes', () => {
      metadataManager.createEntity(1, 'OldName');
      metadataManager.setName(1, 'NewName');

      expect(metadataManager.findByName('OldName')).toEqual([]);
      expect(metadataManager.findByName('NewName')).toEqual([1]);
    });

    it('should return null for non-existent entity', () => {
      expect(metadataManager.getName(999)).toBeNull();
    });

    it('should create metadata if entity does not exist', () => {
      metadataManager.setName(1, 'AutoCreated');

      expect(metadataManager.getName(1)).toBe('AutoCreated');
    });
  });

  describe('setGuid and getGuid', () => {
    it('should set and get entity GUID', () => {
      metadataManager.createEntity(1);
      metadataManager.setGuid(1, 'custom-guid-123');

      expect(metadataManager.getGuid(1)).toBe('custom-guid-123');
    });

    it('should reject duplicate GUIDs', () => {
      metadataManager.createEntity(1);
      metadataManager.createEntity(2);

      const guid1 = metadataManager.getGuid(1)!;
      metadataManager.setGuid(2, guid1);

      // Entity 2 should keep its original GUID
      expect(metadataManager.getGuid(2)).not.toBe(guid1);
    });

    it('should return null for non-existent entity', () => {
      expect(metadataManager.getGuid(999)).toBeNull();
    });
  });

  describe('generateGuid', () => {
    it('should generate unique GUIDs', () => {
      const guid1 = metadataManager.generateGuid();
      const guid2 = metadataManager.generateGuid();

      expect(guid1).not.toBe(guid2);
      expect(guid1).toBeTruthy();
      expect(guid2).toBeTruthy();
    });
  });

  describe('ensureGuid', () => {
    it('should return existing GUID if present', () => {
      metadataManager.createEntity(1);
      const originalGuid = metadataManager.getGuid(1)!;

      const ensuredGuid = metadataManager.ensureGuid(1);
      expect(ensuredGuid).toBe(originalGuid);
    });

    it('should create GUID if missing', () => {
      metadataManager.createEntity(1);
      // Manually remove GUID
      const metadata = metadataManager.getMetadata(1)!;
      metadata.guid = '';

      const guid = metadataManager.ensureGuid(1);
      expect(guid).toBeTruthy();
      expect(metadataManager.getGuid(1)).toBe(guid);
    });
  });

  describe('findByName', () => {
    it('should find entities by name', () => {
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');

      expect(metadataManager.findByName('Player')).toEqual([1]);
      expect(metadataManager.findByName('Enemy')).toEqual([2]);
    });

    it('should return multiple entities with same name', () => {
      metadataManager.createEntity(1, 'Enemy');
      metadataManager.createEntity(2, 'Enemy');
      metadataManager.createEntity(3, 'Enemy');

      const enemies = metadataManager.findByName('Enemy');
      expect(enemies).toHaveLength(3);
      expect(enemies).toContain(1);
      expect(enemies).toContain(2);
      expect(enemies).toContain(3);
    });

    it('should return empty array if name not found', () => {
      expect(metadataManager.findByName('NonExistent')).toEqual([]);
    });

    it('should be case-sensitive', () => {
      metadataManager.createEntity(1, 'Player');

      expect(metadataManager.findByName('player')).toEqual([]);
      expect(metadataManager.findByName('Player')).toEqual([1]);
    });
  });

  describe('findByGuid', () => {
    it('should find entity by GUID', () => {
      metadataManager.createEntity(1);
      const guid = metadataManager.getGuid(1)!;

      expect(metadataManager.findByGuid(guid)).toBe(1);
    });

    it('should return null if GUID not found', () => {
      expect(metadataManager.findByGuid('nonexistent-guid')).toBeNull();
    });

    it('should be unique - only one entity per GUID', () => {
      metadataManager.createEntity(1);
      metadataManager.createEntity(2);

      const guid1 = metadataManager.getGuid(1)!;
      const guid2 = metadataManager.getGuid(2)!;

      expect(metadataManager.findByGuid(guid1)).toBe(1);
      expect(metadataManager.findByGuid(guid2)).toBe(2);
    });
  });

  describe('getMetadata', () => {
    it('should return full metadata object', () => {
      metadataManager.createEntity(1, 'TestEntity');
      const metadata = metadataManager.getMetadata(1);

      expect(metadata).toMatchObject({
        name: 'TestEntity',
        guid: expect.any(String),
        created: expect.any(Number),
        modified: expect.any(Number),
      });
    });

    it('should return null for non-existent entity', () => {
      expect(metadataManager.getMetadata(999)).toBeNull();
    });
  });

  describe('destroyEntity', () => {
    it('should remove entity metadata', () => {
      metadataManager.createEntity(1, 'ToDestroy');
      metadataManager.destroyEntity(1);

      expect(metadataManager.getName(1)).toBeNull();
      expect(metadataManager.getGuid(1)).toBeNull();
      expect(metadataManager.getMetadata(1)).toBeNull();
    });

    it('should clean up name index', () => {
      metadataManager.createEntity(1, 'Player');
      metadataManager.destroyEntity(1);

      expect(metadataManager.findByName('Player')).toEqual([]);
    });

    it('should clean up GUID index', () => {
      metadataManager.createEntity(1);
      const guid = metadataManager.getGuid(1)!;
      metadataManager.destroyEntity(1);

      expect(metadataManager.findByGuid(guid)).toBeNull();
    });

    it('should not affect other entities with same name', () => {
      metadataManager.createEntity(1, 'Enemy');
      metadataManager.createEntity(2, 'Enemy');
      metadataManager.destroyEntity(1);

      expect(metadataManager.findByName('Enemy')).toEqual([2]);
    });
  });

  describe('clear', () => {
    it('should remove all metadata', () => {
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');
      metadataManager.clear();

      expect(metadataManager.getMetadata(1)).toBeNull();
      expect(metadataManager.getMetadata(2)).toBeNull();
      expect(metadataManager.findByName('Player')).toEqual([]);
      expect(metadataManager.findByName('Enemy')).toEqual([]);
    });
  });

  describe('serialize and deserialize', () => {
    it('should serialize metadata to JSON-compatible format', () => {
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');

      const serialized = metadataManager.serialize();

      expect(serialized[1]).toMatchObject({
        name: 'Player',
        guid: expect.any(String),
        created: expect.any(Number),
        modified: expect.any(Number),
      });
      expect(serialized[2]).toMatchObject({
        name: 'Enemy',
        guid: expect.any(String),
        created: expect.any(Number),
        modified: expect.any(Number),
      });
    });

    it('should deserialize metadata from JSON format', () => {
      const data = {
        1: {
          name: 'Player',
          guid: 'guid-123',
          created: 1000,
          modified: 1000,
        },
        2: {
          name: 'Enemy',
          guid: 'guid-456',
          created: 2000,
          modified: 2000,
        },
      };

      metadataManager.deserialize(data);

      expect(metadataManager.getName(1)).toBe('Player');
      expect(metadataManager.getGuid(1)).toBe('guid-123');
      expect(metadataManager.getName(2)).toBe('Enemy');
      expect(metadataManager.getGuid(2)).toBe('guid-456');
    });

    it('should rebuild indices on deserialize', () => {
      const data = {
        1: {
          name: 'Player',
          guid: 'guid-123',
          created: 1000,
          modified: 1000,
        },
        2: {
          name: 'Enemy',
          guid: 'guid-456',
          created: 2000,
          modified: 2000,
        },
      };

      metadataManager.deserialize(data);

      expect(metadataManager.findByName('Player')).toEqual([1]);
      expect(metadataManager.findByGuid('guid-123')).toBe(1);
      expect(metadataManager.findByName('Enemy')).toEqual([2]);
      expect(metadataManager.findByGuid('guid-456')).toBe(2);
    });

    it('should round-trip serialize/deserialize', () => {
      metadataManager.createEntity(1, 'Player');
      metadataManager.createEntity(2, 'Enemy');

      const guid1 = metadataManager.getGuid(1)!;
      const guid2 = metadataManager.getGuid(2)!;

      const serialized = metadataManager.serialize();
      metadataManager.clear();
      metadataManager.deserialize(serialized);

      expect(metadataManager.getName(1)).toBe('Player');
      expect(metadataManager.getGuid(1)).toBe(guid1);
      expect(metadataManager.getName(2)).toBe('Enemy');
      expect(metadataManager.getGuid(2)).toBe(guid2);
      expect(metadataManager.findByName('Player')).toEqual([1]);
      expect(metadataManager.findByGuid(guid1)).toBe(1);
    });
  });

  describe('modification tracking', () => {
    it('should update modified timestamp on name change', () => {
      metadataManager.createEntity(1);
      const originalModified = metadataManager.getMetadata(1)!.modified;

      // Wait a bit to ensure timestamp difference
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      return delay(10).then(() => {
        metadataManager.setName(1, 'NewName');
        const newModified = metadataManager.getMetadata(1)!.modified;

        expect(newModified).toBeGreaterThan(originalModified);
      });
    });
  });
});
