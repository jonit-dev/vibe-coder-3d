import { describe, it, expect, beforeEach } from 'vitest';
import { EntitySerializer } from '../EntitySerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type { ISerializedEntity } from '../SceneSerializer';

describe('EntitySerializer', () => {
  let serializer: EntitySerializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;

  beforeEach(() => {
    serializer = new EntitySerializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();

    // Clear managers
    entityManager.clearEntities();
  });

  describe('serialize', () => {
    it('should serialize empty entities', () => {
      const result = serializer.serialize(entityManager, componentRegistry);
      expect(result).toEqual([]);
    });

    it('should serialize single entity with Transform', () => {
      const entity = entityManager.createEntity('Test Entity');

      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 1, 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const result = serializer.serialize(entityManager, componentRegistry);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: entity.id,
        name: 'Test Entity',
        components: {
          Transform: {
            position: [0, 1, 2],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      });
    });

    it('should serialize entity with multiple components', () => {
      const entity = entityManager.createEntity('Camera Entity');

      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 5, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      componentRegistry.addComponent(entity.id, 'Camera', {
        fov: 60,
        near: 0.1,
        far: 1000,
        isMain: true,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
      });

      const result = serializer.serialize(entityManager, componentRegistry);

      expect(result).toHaveLength(1);
      expect(result[0].components).toHaveProperty('Transform');
      expect(result[0].components).toHaveProperty('Camera');
      expect(result[0].components.Camera).toMatchObject({
        fov: 60,
        isMain: true,
      });
    });

    it('should serialize entity hierarchy with parentId', () => {
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child', parent.id);

      componentRegistry.addComponent(parent.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      componentRegistry.addComponent(child.id, 'Transform', {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const result = serializer.serialize(entityManager, componentRegistry);

      expect(result).toHaveLength(2);
      const childEntity = result.find((e) => e.name === 'Child');
      expect(childEntity?.parentId).toBe(parent.id);
    });

    it('should serialize multiple entities', () => {
      const entity1 = entityManager.createEntity('Entity 1');
      const entity2 = entityManager.createEntity('Entity 2');
      const entity3 = entityManager.createEntity('Entity 3');

      [entity1, entity2, entity3].forEach((entity) => {
        componentRegistry.addComponent(entity.id, 'Transform', {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
      });

      const result = serializer.serialize(entityManager, componentRegistry);

      expect(result).toHaveLength(3);
      expect(result.map((e) => e.name)).toEqual(['Entity 1', 'Entity 2', 'Entity 3']);
    });
  });

  describe('deserialize', () => {
    it('should deserialize empty array', () => {
      expect(() => serializer.deserialize([], entityManager, componentRegistry)).not.toThrow();
      expect(entityManager.getAllEntities()).toHaveLength(0);
    });

    it('should deserialize single entity', () => {
      const entities: ISerializedEntity[] = [
        {
          id: 1,
          name: 'Test Entity',
          components: {
            Transform: {
              position: [0, 1, 2],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      serializer.deserialize(entities, entityManager, componentRegistry);

      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(1);
      expect(allEntities[0].name).toBe('Test Entity');

      const createdEntity = allEntities[0];
      const components = componentRegistry.getComponentsForEntity(createdEntity.id);
      expect(components.some((c) => c.type === 'Transform')).toBe(true);
    });

    it('should deserialize entity with multiple components', () => {
      const entities: ISerializedEntity[] = [
        {
          id: 1,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 5, 10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            Camera: {
              fov: 60,
              near: 0.1,
              far: 1000,
              isMain: true,
              projectionType: 'perspective',
              orthographicSize: 10,
              depth: 0,
            },
          },
        },
      ];

      serializer.deserialize(entities, entityManager, componentRegistry);

      const allEntities = entityManager.getAllEntities();
      const createdEntity = allEntities[0];

      const components = componentRegistry.getComponentsForEntity(createdEntity.id);
      expect(components).toHaveLength(3); // PersistentId + Transform + Camera
      expect(components.some((c) => c.type === 'PersistentId')).toBe(true);
      expect(components.some((c) => c.type === 'Transform')).toBe(true);
      expect(components.some((c) => c.type === 'Camera')).toBe(true);
    });

    it('should deserialize entity hierarchy correctly', () => {
      const entities: ISerializedEntity[] = [
        {
          id: 1,
          name: 'Parent',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 2,
          name: 'Child',
          parentId: 1,
          components: {
            Transform: {
              position: [1, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      serializer.deserialize(entities, entityManager, componentRegistry);

      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(2);

      const parent = allEntities.find((e) => e.name === 'Parent');
      const child = allEntities.find((e) => e.name === 'Child');
      expect(child?.parentId).toBe(parent?.id);
    });

    it('should deserialize multiple entities', () => {
      const entities: ISerializedEntity[] = [
        {
          id: 1,
          name: 'Entity 1',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 2,
          name: 'Entity 2',
          components: {
            Transform: {
              position: [1, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 3,
          name: 'Entity 3',
          components: {
            Transform: {
              position: [2, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      serializer.deserialize(entities, entityManager, componentRegistry);

      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(3);
      expect(allEntities.map((e) => e.name)).toEqual(['Entity 1', 'Entity 2', 'Entity 3']);
    });

    it('should handle nested hierarchy (grandchildren)', () => {
      const entities: ISerializedEntity[] = [
        {
          id: 1,
          name: 'Grandparent',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 2,
          name: 'Parent',
          parentId: 1,
          components: {
            Transform: {
              position: [1, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 3,
          name: 'Child',
          parentId: 2,
          components: {
            Transform: {
              position: [2, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      serializer.deserialize(entities, entityManager, componentRegistry);

      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(3);

      const grandparent = allEntities.find((e) => e.name === 'Grandparent');
      const parent = allEntities.find((e) => e.name === 'Parent');
      const child = allEntities.find((e) => e.name === 'Child');

      expect(child?.parentId).toBe(parent?.id);
      expect(parent?.parentId).toBe(grandparent?.id);
    });
  });

  describe('validate', () => {
    it('should validate valid entity', () => {
      const entity = {
        id: 1,
        name: 'Test',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      const result = serializer.validate(entity);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject entity without id', () => {
      const entity = {
        name: 'Test',
        components: {},
      };

      const result = serializer.validate(entity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject entity without name', () => {
      const entity = {
        id: 1,
        components: {},
      };

      const result = serializer.validate(entity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject entity without components', () => {
      const entity = {
        id: 1,
        name: 'Test',
      };

      const result = serializer.validate(entity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve data through serialize -> deserialize cycle', () => {
      // Create original entities
      const parent = entityManager.createEntity('Parent');
      const child = entityManager.createEntity('Child', parent.id);

      componentRegistry.addComponent(parent.id, 'Transform', {
        position: [1, 2, 3],
        rotation: [45, 90, 180],
        scale: [2, 2, 2],
      });

      componentRegistry.addComponent(child.id, 'Transform', {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      componentRegistry.addComponent(child.id, 'Camera', {
        fov: 60,
        near: 0.1,
        far: 1000,
        isMain: true,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
      });

      // Serialize
      const serialized = serializer.serialize(entityManager, componentRegistry);

      // Clear and deserialize
      entityManager.clearEntities();
      serializer.deserialize(serialized, entityManager, componentRegistry);

      // Verify
      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(2);

      const deserializedParent = allEntities.find((e) => e.name === 'Parent');
      const deserializedChild = allEntities.find((e) => e.name === 'Child');
      expect(deserializedChild?.parentId).toBe(deserializedParent?.id);

      const childComponents = componentRegistry.getComponentsForEntity(deserializedChild!.id);
      expect(childComponents).toHaveLength(3); // PersistentId + Transform + Camera
      expect(childComponents.some((c) => c.type === 'PersistentId')).toBe(true);
      expect(childComponents.some((c) => c.type === 'Transform')).toBe(true);
      expect(childComponents.some((c) => c.type === 'Camera')).toBe(true);
    });
  });
});
