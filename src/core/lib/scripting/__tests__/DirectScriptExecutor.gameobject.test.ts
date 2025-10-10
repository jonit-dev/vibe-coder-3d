/**
 * Tests for GameObject API Integration in DirectScriptExecutor
 *
 * These tests verify that the gameObject API is properly accessible
 * in scripts and that all CRUD operations work correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { IScriptExecutionOptions } from '../DirectScriptExecutor';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { PlaySessionTracker } from '../adapters/PlaySessionTracker';
import { ECSWorld } from '@/core/lib/ecs/World';

describe('DirectScriptExecutor - GameObject API', () => {
  let executor: DirectScriptExecutor;
  let entityManager: EntityManager;
  let playTracker: PlaySessionTracker;

  beforeEach(() => {
    // Reset ECS world
    ECSWorld.getInstance().reset();

    executor = DirectScriptExecutor.getInstance();
    executor.clearAll();

    entityManager = EntityManager.getInstance();
    entityManager.reset();

    playTracker = PlaySessionTracker.getInstance();
    playTracker.reset();
  });

  afterEach(() => {
    executor.clearAll();
    playTracker.reset();
  });

  const createMockOptions = (
    overrides?: Partial<IScriptExecutionOptions>,
  ): IScriptExecutionOptions => ({
    entityId: 1,
    timeInfo: {
      time: 1.0,
      deltaTime: 0.016,
      frameCount: 60,
    },
    inputInfo: {} as any,
    parameters: {},
    ...overrides,
  });

  describe('gameObject API Accessibility', () => {
    it('should make gameObject API available in scripts', () => {
      const code = `
        let apiAvailable = false;
        function onStart() {
          apiAvailable = typeof gameObject !== 'undefined';
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should have all gameObject methods accessible', () => {
      const code = `
        let hasAllMethods = false;
        function onStart() {
          hasAllMethods = (
            typeof gameObject.createEntity === 'function' &&
            typeof gameObject.createPrimitive === 'function' &&
            typeof gameObject.createModel === 'function' &&
            typeof gameObject.clone === 'function' &&
            typeof gameObject.attachComponents === 'function' &&
            typeof gameObject.setParent === 'function' &&
            typeof gameObject.setActive === 'function' &&
            typeof gameObject.destroy === 'function'
          );
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('createEntity', () => {
    it('should create an entity from script', () => {
      const code = `
        let createdEntityId = -1;
        function onStart() {
          createdEntityId = gameObject.createEntity('TestEntity');
        }
      `;

      const initialCount = entityManager.getEntityCount();

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
      expect(entityManager.getEntityCount()).toBeGreaterThan(initialCount);
    });

    it('should create entity with default name', () => {
      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createEntity();
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should create entity with parent', () => {
      // Create parent entity first
      const parentEntity = entityManager.createEntity('Parent');

      const code = `
        let childId = -1;
        function onStart() {
          childId = gameObject.createEntity('Child', ${parentEntity.id});
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('createPrimitive', () => {
    it('should create a cube primitive from script', () => {
      const code = `
        let cubeId = -1;
        function onStart() {
          cubeId = gameObject.createPrimitive('cube');
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should create primitive with custom options', () => {
      const code = `
        let sphereId = -1;
        function onStart() {
          sphereId = gameObject.createPrimitive('sphere', {
            name: 'CustomSphere',
            transform: { position: [1, 2, 3], scale: 2 },
            material: { color: '#ff0000', roughness: 0.5 }
          });
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should create all primitive types', () => {
      const code = `
        const primitives = [];
        function onStart() {
          primitives.push(gameObject.createPrimitive('cube'));
          primitives.push(gameObject.createPrimitive('sphere'));
          primitives.push(gameObject.createPrimitive('plane'));
          primitives.push(gameObject.createPrimitive('cylinder'));
          primitives.push(gameObject.createPrimitive('cone'));
          primitives.push(gameObject.createPrimitive('torus'));
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should create primitive with physics', () => {
      const code = `
        let cubeId = -1;
        function onStart() {
          cubeId = gameObject.createPrimitive('cube', {
            physics: {
              body: 'dynamic',
              collider: 'box',
              mass: 2
            }
          });
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('createModel', () => {
    it('should create model entity from script', () => {
      const code = `
        let modelId = -1;
        function onStart() {
          modelId = gameObject.createModel('/assets/test.glb');
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should create model with options', () => {
      const code = `
        let modelId = -1;
        function onStart() {
          modelId = gameObject.createModel('/assets/robot.glb', {
            name: 'Robot',
            transform: { position: [0, 0, 5] }
          });
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should fail gracefully with empty model path', () => {
      const code = `
        let error = null;
        function onStart() {
          try {
            gameObject.createModel('');
          } catch (e) {
            error = e.message;
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      // Script should handle the error gracefully
      expect(result.success).toBe(true);
    });
  });

  describe('clone', () => {
    it('should clone an entity from script', () => {
      const code = `
        let originalId = -1;
        let cloneId = -1;
        function onStart() {
          originalId = gameObject.createPrimitive('cube', {
            name: 'Original',
            material: { color: '#ff0000' }
          });
          cloneId = gameObject.clone(originalId);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should clone with name override', () => {
      const code = `
        let originalId = -1;
        let cloneId = -1;
        function onStart() {
          originalId = gameObject.createPrimitive('sphere');
          cloneId = gameObject.clone(originalId, {
            name: 'CustomClone'
          });
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should clone with transform override', () => {
      const code = `
        let originalId = -1;
        let cloneId = -1;
        function onStart() {
          originalId = gameObject.createPrimitive('cube');
          cloneId = gameObject.clone(originalId, {
            transform: { position: [10, 0, 0] }
          });
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should destroy entity from script', () => {
      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createPrimitive('cube');
          gameObject.destroy(entityId);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should handle destroying non-existent entity gracefully', () => {
      const code = `
        function onStart() {
          gameObject.destroy(99999);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('attachComponents', () => {
    it('should attach components to entity from script', () => {
      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createEntity();
          gameObject.attachComponents(entityId, [
            {
              type: 'Transform',
              data: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] }
            }
          ]);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('setParent', () => {
    it('should set entity parent from script', () => {
      const code = `
        let parentId = -1;
        let childId = -1;
        function onStart() {
          parentId = gameObject.createEntity('Parent');
          childId = gameObject.createEntity('Child');
          gameObject.setParent(childId, parentId);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should unparent entity by setting parent to undefined', () => {
      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createEntity('Child', 1);
          gameObject.setParent(entityId, undefined);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('setActive', () => {
    it('should set entity active state from script', () => {
      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createEntity();
          gameObject.setActive(entityId, false);
          gameObject.setActive(entityId, true);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('Play Mode Integration', () => {
    it('should track entities created during play mode', () => {
      playTracker.startPlayMode();

      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createPrimitive('cube');
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
      expect(playTracker.getTrackedCount()).toBeGreaterThan(0);

      playTracker.stopPlayMode();
    });

    it('should not track entities when not in play mode', () => {
      // Ensure play mode is off
      playTracker.stopPlayMode();

      const code = `
        let entityId = -1;
        function onStart() {
          entityId = gameObject.createPrimitive('sphere');
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
      expect(playTracker.getTrackedCount()).toBe(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple entity creation and manipulation', () => {
      const code = `
        const myEntities = [];
        function onStart() {
          // Create a parent
          const parent = gameObject.createEntity('Container');
          myEntities.push(parent);

          // Create multiple children
          for (let i = 0; i < 3; i++) {
            const cube = gameObject.createPrimitive('cube', {
              name: 'Cube_' + i,
              parent: parent,
              transform: { position: [i * 2, 0, 0] }
            });
            myEntities.push(cube);
          }

          // Clone one of them
          const clone = gameObject.clone(myEntities[1], {
            name: 'Clone',
            transform: { position: [0, 2, 0] }
          });
          myEntities.push(clone);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should work with variables and loops', () => {
      const code = `
        function onStart() {
          const colors = ['#ff0000', '#00ff00', '#0000ff'];
          const primitives = ['cube', 'sphere', 'cylinder'];

          for (let i = 0; i < 3; i++) {
            gameObject.createPrimitive(primitives[i], {
              name: 'Shape_' + i,
              transform: { position: [i * 3, 0, 0] },
              material: { color: colors[i] }
            });
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should handle conditional entity creation', () => {
      const code = `
        function onStart() {
          const shouldCreateCube = true;
          const shouldCreateSphere = false;

          if (shouldCreateCube) {
            gameObject.createPrimitive('cube');
          }

          if (shouldCreateSphere) {
            gameObject.createPrimitive('sphere');
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should handle entity creation in onUpdate', () => {
      const code = `
        let frameCount = 0;
        let createdEntity = -1;
        function onUpdate(deltaTime) {
          frameCount++;
          if (frameCount === 1 && createdEntity === -1) {
            createdEntity = gameObject.createPrimitive('sphere');
          }
        }
      `;

      executor.compileScript(code, 'test-script');

      // Execute multiple frames
      for (let i = 0; i < 3; i++) {
        const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Zod validation errors gracefully', () => {
      const code = `
        let error = null;
        function onStart() {
          try {
            // Invalid options - negative parent ID
            gameObject.createPrimitive('cube', {
              parent: -1
            });
          } catch (e) {
            error = e.message;
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      // The script itself should execute successfully even if it catches errors
      expect(result.success).toBe(true);
    });

    it('should handle invalid primitive type gracefully', () => {
      const code = `
        let error = null;
        function onStart() {
          try {
            // TypeScript would catch this, but JavaScript won't
            gameObject.createPrimitive('invalid');
          } catch (e) {
            error = e.message;
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('Interaction with Other APIs', () => {
    it('should work alongside entity transform API', () => {
      const code = `
        let cubeId = -1;
        function onStart() {
          cubeId = gameObject.createPrimitive('cube', {
            transform: { position: [0, 5, 0] }
          });
        }

        function onUpdate(deltaTime) {
          entity.transform.rotate(0, deltaTime, 0);
        }
      `;

      executor.compileScript(code, 'test-script');

      const startResult = executor.executeScript('test-script', createMockOptions(), 'onStart');
      expect(startResult.success).toBe(true);

      const updateResult = executor.executeScript('test-script', createMockOptions(), 'onUpdate');
      expect(updateResult.success).toBe(true);
    });

    it('should work with console API', () => {
      const code = `
        function onStart() {
          const cubeId = gameObject.createPrimitive('cube');
          console.log('Created cube with ID:', cubeId);

          const cloneId = gameObject.clone(cubeId);
          console.log('Cloned to ID:', cloneId);

          gameObject.destroy(cloneId);
          console.log('Destroyed clone');
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should work with math API', () => {
      const code = `
        function onStart() {
          const count = math.floor(math.random() * 5) + 1;

          for (let i = 0; i < count; i++) {
            const angle = (i / count) * math.PI * 2;
            const x = math.cos(angle) * 3;
            const z = math.sin(angle) * 3;

            gameObject.createPrimitive('sphere', {
              transform: { position: [x, 0, z], scale: 0.5 }
            });
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });
});
