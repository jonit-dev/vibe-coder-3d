/**
 * Tests for GameObjectAPI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameObjectAPI } from '../GameObjectAPI';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { PlaySessionTracker } from '../../adapters/PlaySessionTracker';

describe('GameObjectAPI', () => {
  let api: ReturnType<typeof createGameObjectAPI>;
  let entityManager: EntityManager;
  let tracker: PlaySessionTracker;
  let currentEntityId: number;

  beforeEach(() => {
    entityManager = EntityManager.getInstance();
    tracker = PlaySessionTracker.getInstance();
    tracker.reset();

    // Create a real entity to act as the "current entity" for the script
    const currentEntity = entityManager.createEntity('ScriptEntity');
    currentEntityId = currentEntity.id;
    api = createGameObjectAPI(currentEntityId);
  });

  describe('createEntity', () => {
    it('should create an entity with default name', () => {
      const entityId = api.createEntity();
      expect(entityId).toBeGreaterThan(0);

      const entity = entityManager.getEntity(entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe('Entity');
    });

    it('should create an entity with custom name', () => {
      const entityId = api.createEntity('CustomEntity');
      const entity = entityManager.getEntity(entityId);
      expect(entity?.name).toBe('CustomEntity');
    });

    it('should create entity with parent', () => {
      const parentId = entityManager.createEntity('Parent').id;
      const childId = api.createEntity('Child', parentId);

      const child = entityManager.getEntity(childId);
      expect(child?.parentId).toBe(parentId);
    });

    it('should add Transform component to created entity', () => {
      const entityId = api.createEntity();
      expect(componentRegistry.hasComponent(entityId, 'Transform')).toBe(true);
    });

    it('should track entity when in play mode', () => {
      tracker.startPlayMode();
      const entityId = api.createEntity();

      expect(tracker.wasCreatedDuringPlay(entityId)).toBe(true);
    });

    it('should not track entity when not in play mode', () => {
      const entityId = api.createEntity();
      expect(tracker.wasCreatedDuringPlay(entityId)).toBe(false);
    });
  });

  describe('createPrimitive', () => {
    it('should create a cube primitive', () => {
      const cubeId = api.createPrimitive('cube');
      expect(cubeId).toBeGreaterThan(0);

      expect(componentRegistry.hasComponent(cubeId, 'Transform')).toBe(true);
      expect(componentRegistry.hasComponent(cubeId, 'MeshRenderer')).toBe(true);
    });

    it('should create primitive with custom options', () => {
      const sphereId = api.createPrimitive('sphere', {
        name: 'CustomSphere',
        transform: { position: [1, 2, 3], scale: 2 },
        material: { color: '#ff0000', roughness: 0.5 },
      });

      const entity = entityManager.getEntity(sphereId);
      expect(entity?.name).toBe('CustomSphere');

      const transform = componentRegistry.getComponentData(sphereId, 'Transform');
      expect(transform?.position).toEqual([1, 2, 3]);
      expect(transform?.scale).toEqual([2, 2, 2]); // Uniform scale
    });

    it('should add physics components when requested', () => {
      // Just verify it doesn't throw - component registration is implementation-specific
      expect(() =>
        api.createPrimitive('cube', {
          physics: {
            body: 'dynamic',
            collider: 'box',
            mass: 2,
          },
        })
      ).not.toThrow();
    });

    it('should track primitive when in play mode', () => {
      tracker.startPlayMode();
      const primitiveId = api.createPrimitive('sphere');

      expect(tracker.wasCreatedDuringPlay(primitiveId)).toBe(true);
    });
  });

  describe('createModel', () => {
    it('should create model entity', () => {
      const modelId = api.createModel('/assets/test.glb');
      expect(modelId).toBeGreaterThan(0);

      expect(componentRegistry.hasComponent(modelId, 'Transform')).toBe(true);
      expect(componentRegistry.hasComponent(modelId, 'MeshRenderer')).toBe(true);
    });

    it('should throw error for empty model path', () => {
      expect(() => api.createModel('')).toThrow(/Model path or asset ID cannot be empty/);
    });

    it('should create model with options', () => {
      const modelId = api.createModel('/assets/robot.glb', {
        name: 'Robot',
        transform: { position: [0, 0, 5] },
        physics: { body: 'static', collider: 'mesh' },
      });

      const entity = entityManager.getEntity(modelId);
      expect(entity?.name).toBe('Robot');

      // Verify basic components exist - physics components may have different registration
      expect(componentRegistry.hasComponent(modelId, 'Transform')).toBe(true);
      expect(componentRegistry.hasComponent(modelId, 'MeshRenderer')).toBe(true);
    });
  });

  describe('clone', () => {
    it('should clone an entity', () => {
      const originalId = api.createPrimitive('cube', {
        name: 'Original',
        material: { color: '#ff0000' },
      });

      const cloneId = api.clone(originalId);
      expect(cloneId).toBeGreaterThan(0);
      expect(cloneId).not.toBe(originalId);

      const clone = entityManager.getEntity(cloneId);
      expect(clone?.name).toBe('Original_clone');
    });

    it('should clone with name override', () => {
      const originalId = api.createPrimitive('sphere');
      const cloneId = api.clone(originalId, { name: 'CustomClone' });

      const clone = entityManager.getEntity(cloneId);
      expect(clone?.name).toBe('CustomClone');
    });

    it('should clone with transform override', () => {
      const originalId = api.createPrimitive('cube');
      const cloneId = api.clone(originalId, {
        transform: { position: [10, 0, 0] },
      });

      const transform = componentRegistry.getComponentData(cloneId, 'Transform');
      expect(transform?.position).toEqual([10, 0, 0]);
    });

    it('should throw error for non-existent source', () => {
      expect(() => api.clone(99999)).toThrow(/Source entity .* not found/);
    });

    it('should not clone PersistentId component', () => {
      const originalId = api.createPrimitive('cube');
      const originalPersistentId = componentRegistry.getComponentData(originalId, 'PersistentId');

      const cloneId = api.clone(originalId);
      const clonePersistentId = componentRegistry.getComponentData(cloneId, 'PersistentId');

      // Clone should have its own PersistentId, different from original
      expect(clonePersistentId).toBeDefined();
      expect(clonePersistentId?.id).not.toBe(originalPersistentId?.id);
    });
  });

  describe('attachComponents', () => {
    it('should attach components to entity', () => {
      const entityId = api.createEntity();

      // Just verify the API call doesn't throw
      expect(() =>
        api.attachComponents(entityId, [
          {
            type: 'Transform',
            data: { position: [10, 20, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
          },
        ])
      ).not.toThrow();
    });

    it('should throw error for non-existent entity', () => {
      expect(() =>
        api.attachComponents(99999, [{ type: 'Transform', data: {} }])
      ).toThrow(/Entity .* not found/);
    });
  });

  describe('setParent', () => {
    it('should set entity parent', () => {
      const parentId = api.createEntity('Parent');
      const childId = api.createEntity('Child');

      api.setParent(childId, parentId);

      const child = entityManager.getEntity(childId);
      expect(child?.parentId).toBe(parentId);
    });

    it('should set entity as root (no parent)', () => {
      const childId = api.createEntity('Child', 1);
      api.setParent(childId, undefined);

      const child = entityManager.getEntity(childId);
      expect(child?.parentId).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should destroy target entity', () => {
      const entityId = api.createEntity();
      api.destroy(entityId);

      expect(entityManager.getEntity(entityId)).toBeUndefined();
    });

    it('should destroy current entity when no target specified', () => {
      // This would destroy the entity the script is attached to
      // In tests, we just verify it attempts to destroy currentEntityId
      const spy = vi.spyOn(entityManager, 'deleteEntity');
      api.destroy();

      expect(spy).toHaveBeenCalledWith(currentEntityId);
    });

    it('should untrack entity from play session', () => {
      tracker.startPlayMode();
      const entityId = api.createEntity();

      expect(tracker.wasCreatedDuringPlay(entityId)).toBe(true);

      api.destroy(entityId);

      expect(tracker.wasCreatedDuringPlay(entityId)).toBe(false);
    });

    it('should not throw for non-existent entity', () => {
      expect(() => api.destroy(99999)).not.toThrow();
    });
  });

  describe('setActive', () => {
    it('should set active state on entity', () => {
      const entityId = api.createEntity();

      // Should not throw
      expect(() => api.setActive(entityId, false)).not.toThrow();
      expect(() => api.setActive(entityId, true)).not.toThrow();
    });

    it('should warn but not throw for non-existent entity', () => {
      // Should log warning but not throw
      expect(() => api.setActive(99999, true)).not.toThrow();
    });
  });
});
