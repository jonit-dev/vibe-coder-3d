import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntitySerializer } from '../EntitySerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type { ISerializedEntity } from '../SceneSerializer';
import type { IEntityManagerAdapter, IComponentManagerAdapter } from '../EntitySerializer';
import { validate as uuidValidate } from 'uuid';

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

    it('should accept entity without id (auto-generated)', () => {
      const entity = {
        name: 'Test',
        components: {},
      };

      const result = serializer.validate(entity);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
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

/**
 * Auto-Generated PersistentId Tests
 * Merged from root EntitySerializer.test.ts
 */
describe('EntitySerializer - Auto-Generated PersistentId', () => {
  let entitySerializer: EntitySerializer;
  let mockEntityManager: IEntityManagerAdapter;
  let mockComponentManager: IComponentManagerAdapter;
  let createdEntities: Map<number, { id: number; name: string; persistentId?: string }>;
  let addedComponents: Array<{ entityId: number; type: string; data: unknown }>;

  beforeEach(() => {
    entitySerializer = new EntitySerializer();
    createdEntities = new Map();
    addedComponents = [];

    // Mock entity manager
    mockEntityManager = {
      getAllEntities: vi.fn(() => []),
      clearEntities: vi.fn(() => {
        createdEntities.clear();
      }),
      createEntity: vi.fn((name: string, parentId?: number | null, persistentId?: string) => {
        const id = createdEntities.size;
        createdEntities.set(id, { id, name, persistentId });
        return { id };
      }),
      setParent: vi.fn(),
    };

    // Mock component manager
    mockComponentManager = {
      getComponentsForEntity: vi.fn(() => []),
      addComponent: vi.fn((entityId: number, componentType: string, data: unknown) => {
        addedComponents.push({ entityId, type: componentType, data });
      }),
    };
  });

  describe('Auto-Generation Behavior', () => {
    it('should auto-generate UUID when PersistentId is not provided', () => {
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(1);
      const entity = createdEntities.get(0);
      expect(entity?.persistentId).toBeDefined();
      expect(uuidValidate(entity!.persistentId!)).toBe(true);
    });

    it('should preserve manual PersistentId when provided', () => {
      const manualId = 'a0293986-830a-4818-a906-382600973f92';
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            PersistentId: { id: manualId },
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      const entity = createdEntities.get(0);
      expect(entity?.persistentId).toBe(manualId);
    });

    it('should generate unique UUIDs for multiple entities', () => {
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 1,
          name: 'Light',
          components: {
            Transform: {
              position: [5, 10, 5],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 2,
          name: 'Cube',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(3);

      const generatedIds: string[] = [];
      for (const entity of createdEntities.values()) {
        expect(entity.persistentId).toBeDefined();
        expect(uuidValidate(entity.persistentId!)).toBe(true);
        generatedIds.push(entity.persistentId!);
      }

      const uniqueIds = new Set(generatedIds);
      expect(uniqueIds.size).toBe(generatedIds.length);
    });

    it('should handle mix of manual and auto-generated IDs', () => {
      const manualId1 = 'a0293986-830a-4818-a906-382600973f92';
      const manualId2 = 'ddca780c-ce4d-4193-92dd-d01a60446870';

      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            PersistentId: { id: manualId1 },
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 1,
          name: 'Light',
          components: {
            Transform: {
              position: [5, 10, 5],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        {
          id: 2,
          name: 'Cube',
          components: {
            PersistentId: { id: manualId2 },
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(3);

      const camera = createdEntities.get(0);
      expect(camera?.persistentId).toBe(manualId1);

      const cube = createdEntities.get(2);
      expect(cube?.persistentId).toBe(manualId2);

      const light = createdEntities.get(1);
      expect(light?.persistentId).toBeDefined();
      expect(uuidValidate(light!.persistentId!)).toBe(true);
      expect(light?.persistentId).not.toBe(manualId1);
      expect(light?.persistentId).not.toBe(manualId2);
    });
  });

  describe('Component Addition', () => {
    it('should not add PersistentId as a component when auto-generated', () => {
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      const persistentIdComponents = addedComponents.filter((c) => c.type === 'PersistentId');
      expect(persistentIdComponents).toHaveLength(0);

      const transformComponents = addedComponents.filter((c) => c.type === 'Transform');
      expect(transformComponents).toHaveLength(1);
    });

    it('should not add PersistentId as a component when manually provided', () => {
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            PersistentId: { id: 'a0293986-830a-4818-a906-382600973f92' },
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      const persistentIdComponents = addedComponents.filter((c) => c.type === 'PersistentId');
      expect(persistentIdComponents).toHaveLength(0);

      const transformComponents = addedComponents.filter((c) => c.type === 'Transform');
      expect(transformComponents).toHaveLength(1);
    });

    it('should add all other components correctly', () => {
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            Camera: {
              fov: 75,
              near: 0.1,
              far: 1000,
              projectionType: 'perspective',
              orthographicSize: 10,
              depth: 0,
              isMain: true,
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(addedComponents).toHaveLength(2);
      expect(addedComponents.some((c) => c.type === 'Transform')).toBe(true);
      expect(addedComponents.some((c) => c.type === 'Camera')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entities array', () => {
      const entities: unknown[] = [];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(0);
    });

    it('should handle entity with only PersistentId component', () => {
      const entities = [
        {
          id: 0,
          name: 'Empty Entity',
          components: {
            PersistentId: { id: 'a0293986-830a-4818-a906-382600973f92' },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(1);
      const entity = createdEntities.get(0);
      expect(entity?.persistentId).toBe('a0293986-830a-4818-a906-382600973f92');
    });

    it('should handle entity with empty components object', () => {
      const entities = [
        {
          id: 0,
          name: 'No Components',
          components: {},
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(1);
      const entity = createdEntities.get(0);
      expect(entity?.persistentId).toBeDefined();
      expect(uuidValidate(entity!.persistentId!)).toBe(true);
    });
  });

  describe('Parent-Child Relationships', () => {
    it('should preserve parent-child relationships with auto-generated IDs', () => {
      const entities = [
        {
          id: 0,
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
          id: 1,
          name: 'Child',
          parentId: 0,
          components: {
            Transform: {
              position: [1, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      expect(createdEntities.size).toBe(2);

      const parent = createdEntities.get(0);
      const child = createdEntities.get(1);

      expect(parent?.persistentId).toBeDefined();
      expect(child?.persistentId).toBeDefined();
      expect(uuidValidate(parent!.persistentId!)).toBe(true);
      expect(uuidValidate(child!.persistentId!)).toBe(true);

      expect(mockEntityManager.setParent).toHaveBeenCalled();
    });
  });
});
