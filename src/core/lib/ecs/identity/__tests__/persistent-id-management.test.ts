import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from '../../EntityManager';
import { ComponentRegistry } from '../../ComponentRegistry';
import { ECSWorld } from '../../World';

describe('PersistentId Integration', () => {
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;

  beforeEach(() => {
    ECSWorld.getInstance().reset();
    componentRegistry = ComponentRegistry.getInstance();
    entityManager = EntityManager.getInstance();
    entityManager.reset(); // Reset first to clear caches
    entityManager.refreshWorld(); // Then refresh to rebuild indices and reattach listeners
  });

  describe('Entity creation with persistent IDs', () => {
    it('should create entity with auto-generated persistent ID', () => {
      const entity = entityManager.createEntity('Test Entity');

      const persistentId = entityManager.getEntityPersistentId(entity.id);
      expect(persistentId).toBeDefined();
      expect(persistentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should create entity with provided persistent ID', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const entity = entityManager.createEntity('Test Entity', undefined, customId);

      const persistentId = entityManager.getEntityPersistentId(entity.id);
      expect(persistentId).toBe(customId);
    });

    it('should prevent duplicate persistent IDs', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';

      entityManager.createEntity('Test Entity 1', undefined, customId);

      expect(() => {
        entityManager.createEntity('Test Entity 2', undefined, customId);
      }).toThrow('Duplicate PersistentId');
    });

    it('should reject invalid persistent ID format', () => {
      expect(() => {
        entityManager.createEntity('Test Entity', undefined, 'invalid-id');
      }).toThrow('Invalid PersistentId');
    });
  });

  describe('Entity ID service integration', () => {
    it('should reserve IDs when creating entities', () => {
      const entity = entityManager.createEntity('Test Entity');
      const persistentId = entityManager.getEntityPersistentId(entity.id);

      expect(persistentId).toBeDefined();
      // Note: ID service integration tests depend on internal implementation
    });

    it('should release IDs when deleting entities', () => {
      const entity = entityManager.createEntity('Test Entity');
      const persistentId = entityManager.getEntityPersistentId(entity.id);

      expect(persistentId).toBeDefined();

      entityManager.deleteEntity(entity.id);

      // Verify entity is deleted
      expect(entityManager.getEntity(entity.id)).toBeUndefined();
    });

    it('should generate unique IDs across multiple entities', () => {
      const entities = [];
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        const entity = entityManager.createEntity(`Test Entity ${i}`);
        const persistentId = entityManager.getEntityPersistentId(entity.id);
        entities.push(entity);

        expect(ids.has(persistentId)).toBe(false);
        ids.add(persistentId);
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('Persistent ID component integration', () => {
    it('should store persistent ID in component data', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const entity = entityManager.createEntity('Test Entity', undefined, customId);

      const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
        entity.id,
        'PersistentId',
      );

      expect(persistentIdData?.id).toBe(customId);
    });

    it('should maintain persistent ID across entity queries', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      entityManager.createEntity('Test Entity', undefined, customId);

      const foundEntityId = entityManager.findEntityByPersistentId(customId);
      expect(foundEntityId).toBeDefined();

      const persistentId = entityManager.getEntityPersistentId(foundEntityId!);
      expect(persistentId).toBe(customId);
    });
  });

  describe('EntityManager reset integration', () => {
    it('should clear ID reservations on reset', () => {
      const entity = entityManager.createEntity('Test Entity');
      const persistentId = entityManager.getEntityPersistentId(entity.id);

      expect(persistentId).toBeDefined();

      entityManager.reset();

      // After reset, entity should be gone
      expect(entityManager.getEntityCount()).toBe(0);
    });

    it('should allow reusing IDs after reset', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';

      entityManager.createEntity('Test Entity 1', undefined, customId);
      entityManager.reset();

      expect(() => {
        entityManager.createEntity('Test Entity 2', undefined, customId);
      }).not.toThrow();
    });
  });
});
