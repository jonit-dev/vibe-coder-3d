/**
 * Tests for EntitySerializer Auto-Generated PersistentId
 *
 * These tests validate that:
 * 1. PersistentId is auto-generated when not provided
 * 2. Manual PersistentId is preserved when provided
 * 3. Generated UUIDs are valid
 * 4. Auto-generation is logged properly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntitySerializer } from './EntitySerializer';
import type { IEntityManagerAdapter, IComponentManagerAdapter } from './EntitySerializer';
import { validate as uuidValidate } from 'uuid';

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
            // No PersistentId component
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      // Verify entity was created
      expect(createdEntities.size).toBe(1);
      const entity = createdEntities.get(0);
      expect(entity).toBeDefined();

      // Verify UUID was auto-generated
      expect(entity?.persistentId).toBeDefined();
      expect(entity?.persistentId).toBeTruthy();

      // Verify it's a valid UUID
      expect(uuidValidate(entity!.persistentId!)).toBe(true);
    });

    it('should preserve manual PersistentId when provided', () => {
      const manualId = 'a0293986-830a-4818-a906-382600973f92';
      const entities = [
        {
          id: 0,
          name: 'Camera',
          components: {
            PersistentId: {
              id: manualId,
            },
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      // Verify manual ID was preserved
      expect(createdEntities.size).toBe(1);
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

      // Verify all entities created
      expect(createdEntities.size).toBe(3);

      // Collect all generated UUIDs
      const generatedIds: string[] = [];
      for (const entity of createdEntities.values()) {
        expect(entity.persistentId).toBeDefined();
        expect(uuidValidate(entity.persistentId!)).toBe(true);
        generatedIds.push(entity.persistentId!);
      }

      // Verify all UUIDs are unique
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
            PersistentId: {
              id: manualId1,
            },
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
            // No PersistentId - should be auto-generated
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
            PersistentId: {
              id: manualId2,
            },
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

      // Verify manual IDs preserved
      const camera = createdEntities.get(0);
      expect(camera?.persistentId).toBe(manualId1);

      const cube = createdEntities.get(2);
      expect(cube?.persistentId).toBe(manualId2);

      // Verify auto-generated ID for Light
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

      // Verify only Transform was added as component
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
            PersistentId: {
              id: 'a0293986-830a-4818-a906-382600973f92',
            },
            Transform: {
              position: [0, 1, -10],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
      ];

      entitySerializer.deserialize(entities, mockEntityManager, mockComponentManager);

      // Verify PersistentId was NOT added as a component
      const persistentIdComponents = addedComponents.filter((c) => c.type === 'PersistentId');
      expect(persistentIdComponents).toHaveLength(0);

      // Verify Transform was added
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

      // Verify both components added
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
            PersistentId: {
              id: 'a0293986-830a-4818-a906-382600973f92',
            },
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

      // Verify both have auto-generated IDs
      const parent = createdEntities.get(0);
      const child = createdEntities.get(1);

      expect(parent?.persistentId).toBeDefined();
      expect(child?.persistentId).toBeDefined();
      expect(uuidValidate(parent!.persistentId!)).toBe(true);
      expect(uuidValidate(child!.persistentId!)).toBe(true);

      // Verify setParent was called
      expect(mockEntityManager.setParent).toHaveBeenCalled();
    });
  });
});
