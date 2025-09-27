import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from '../../EntityManager';
import { ComponentRegistry } from '../../ComponentRegistry';
import { ECSWorld } from '../../World';
import { PersistentIdService } from '../PersistentIdService';

describe('PersistentId Integration', () => {
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;

  beforeEach(() => {
    ECSWorld.getInstance().reset();
    componentRegistry = ComponentRegistry.getInstance();
    entityManager = EntityManager.getInstance();
    entityManager.reset();
  });

  describe('Entity creation with persistent IDs', () => {
    it('should create entity with auto-generated persistent ID', () => {
      const entity = entityManager.createEntity();

      expect(entity.persistentId).toBeDefined();
      expect(entity.persistentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create entity with provided persistent ID', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const entity = entityManager.createEntity({ persistentId: customId });

      expect(entity.persistentId).toBe(customId);
    });

    it('should prevent duplicate persistent IDs', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';

      entityManager.createEntity({ persistentId: customId });

      expect(() => {
        entityManager.createEntity({ persistentId: customId });
      }).toThrow('Duplicate PersistentId');
    });

    it('should reject invalid persistent ID format', () => {
      expect(() => {
        entityManager.createEntity({ persistentId: 'invalid-id' });
      }).toThrow('Invalid PersistentId');
    });
  });

  describe('Entity ID service integration', () => {
    it('should reserve IDs when creating entities', () => {
      const entity = entityManager.createEntity();
      const idService = (entityManager as any).idService as PersistentIdService;

      expect(idService.isReserved(entity.persistentId)).toBe(true);
    });

    it('should release IDs when deleting entities', () => {
      const entity = entityManager.createEntity();
      const idService = (entityManager as any).idService as PersistentIdService;
      const persistentId = entity.persistentId;

      expect(idService.isReserved(persistentId)).toBe(true);

      entityManager.deleteEntity(entity.id);

      expect(idService.isReserved(persistentId)).toBe(false);
    });

    it('should generate unique IDs across multiple entities', () => {
      const entities = [];
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        const entity = entityManager.createEntity();
        entities.push(entity);

        expect(ids.has(entity.persistentId)).toBe(false);
        ids.add(entity.persistentId);
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('Persistent ID component integration', () => {
    it('should store persistent ID in component data', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      const entity = entityManager.createEntity({ persistentId: customId });

      const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
        entity.id,
        'PersistentId'
      );

      expect(persistentIdData?.id).toBe(customId);
    });

    it('should maintain persistent ID across entity queries', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';
      entityManager.createEntity({ persistentId: customId });

      const entities = entityManager.getAllEntities();
      const foundEntity = entities.find(e => e.persistentId === customId);

      expect(foundEntity).toBeDefined();
      expect(foundEntity?.persistentId).toBe(customId);
    });
  });

  describe('EntityManager reset integration', () => {
    it('should clear ID reservations on reset', () => {
      const entity = entityManager.createEntity();
      const idService = (entityManager as any).idService as PersistentIdService;
      const persistentId = entity.persistentId;

      expect(idService.isReserved(persistentId)).toBe(true);

      entityManager.reset();

      expect(idService.isReserved(persistentId)).toBe(false);
    });

    it('should allow reusing IDs after reset', () => {
      const customId = '550e8400-e29b-41d4-a716-446655440000';

      entityManager.createEntity({ persistentId: customId });
      entityManager.reset();

      expect(() => {
        entityManager.createEntity({ persistentId: customId });
      }).not.toThrow();
    });
  });
});