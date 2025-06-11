import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from '../EntityManager';

describe('EntityManager', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  describe('createEntity', () => {
    it('should create an entity with a unique ID', () => {
      const entity1 = entityManager.createEntity('Test Entity 1');
      const entity2 = entityManager.createEntity('Test Entity 2');

      expect(entity1.id).toBe(1);
      expect(entity2.id).toBe(2);
      expect(entity1.name).toBe('Test Entity 1');
      expect(entity2.name).toBe('Test Entity 2');
    });

    it('should create an entity without parent by default', () => {
      const entity = entityManager.createEntity('Test Entity');

      expect(entity.parentId).toBeUndefined();
      expect(entity.children).toEqual([]);
    });
  });

  describe('getEntity', () => {
    it('should return the correct entity by ID', () => {
      const entity = entityManager.createEntity('Test Entity');
      const retrieved = entityManager.getEntity(entity.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(entity.id);
      expect(retrieved?.name).toBe('Test Entity');
    });

    it('should return undefined for non-existent entity', () => {
      const retrieved = entityManager.getEntity(999);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('deleteEntity', () => {
    it('should remove entity from manager', () => {
      const entity = entityManager.createEntity('Test Entity');
      const deleted = entityManager.deleteEntity(entity.id);

      expect(deleted).toBe(true);
      expect(entityManager.getEntity(entity.id)).toBeUndefined();
    });

    it('should return false for non-existent entity', () => {
      const deleted = entityManager.deleteEntity(999);
      expect(deleted).toBe(false);
    });

    it('should remove entity from parent children list', () => {
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child');

      entityManager.setParent(child.id, parent.id);
      entityManager.deleteEntity(child.id);

      const updatedParent = entityManager.getEntity(parent.id);
      expect(updatedParent?.children).toEqual([]);
    });
  });

  describe('setParent', () => {
    it('should set parent-child relationship', () => {
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child');

      const success = entityManager.setParent(child.id, parent.id);

      expect(success).toBe(true);

      const updatedChild = entityManager.getEntity(child.id);
      const updatedParent = entityManager.getEntity(parent.id);

      expect(updatedChild?.parentId).toBe(parent.id);
      expect(updatedParent?.children).toContain(child.id);
    });

    it('should remove entity from previous parent when setting new parent', () => {
      const parent1 = entityManager.createEntity('Parent 1');
      const parent2 = entityManager.createEntity('Parent 2');
      const child = entityManager.createEntity('Child');

      entityManager.setParent(child.id, parent1.id);
      entityManager.setParent(child.id, parent2.id);

      const updatedParent1 = entityManager.getEntity(parent1.id);
      const updatedParent2 = entityManager.getEntity(parent2.id);
      const updatedChild = entityManager.getEntity(child.id);

      expect(updatedParent1?.children).toEqual([]);
      expect(updatedParent2?.children).toContain(child.id);
      expect(updatedChild?.parentId).toBe(parent2.id);
    });

    it('should remove parent when setting undefined', () => {
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child');

      entityManager.setParent(child.id, parent.id);
      entityManager.setParent(child.id, undefined);

      const updatedChild = entityManager.getEntity(child.id);
      const updatedParent = entityManager.getEntity(parent.id);

      expect(updatedChild?.parentId).toBeUndefined();
      expect(updatedParent?.children).toEqual([]);
    });

    it('should prevent circular parent-child relationships', () => {
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child');

      entityManager.setParent(child.id, parent.id);
      const success = entityManager.setParent(parent.id, child.id);

      expect(success).toBe(false);

      const updatedParent = entityManager.getEntity(parent.id);
      expect(updatedParent?.parentId).toBeUndefined();
    });
  });

  describe('getAllEntities', () => {
    it('should return all entities', () => {
      const entity1 = entityManager.createEntity('Entity 1');
      const entity2 = entityManager.createEntity('Entity 2');

      const allEntities = entityManager.getAllEntities();

      expect(allEntities).toHaveLength(2);
      expect(allEntities.map((e) => e.id)).toContain(entity1.id);
      expect(allEntities.map((e) => e.id)).toContain(entity2.id);
    });

    it('should return empty array when no entities exist', () => {
      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toEqual([]);
    });
  });
});
