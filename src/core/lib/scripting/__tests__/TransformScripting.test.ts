/**
 * Transform Scripting Tests
 * Testing transform operations via script system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DirectScriptExecutor, IScriptExecutionOptions } from '../DirectScriptExecutor';
import { EntityManager } from '../../ecs/EntityManager';

describe('Transform Scripting Tests', () => {
  let executor: DirectScriptExecutor;
  let entityManager: EntityManager;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    entityManager = EntityManager.getInstance();
    executor.clearAll();
    entityManager.clearEntities();
  });

  const createMockOptions = (
    entityId: number,
    overrides?: Partial<IScriptExecutionOptions>,
  ): IScriptExecutionOptions => ({
    entityId,
    timeInfo: {
      time: 1.0,
      deltaTime: 0.016,
      frameCount: 60,
    },
    inputInfo: {} as any,
    parameters: {},
    ...overrides,
  });

  describe('Position Scripts', () => {
    it('should compile position manipulation scripts', () => {
      const script = `
        function onStart() {
          entity.setComponent('Transform', {
            position: [5, 10, 15]
          });
        }
      `;

      const result = executor.compileScript(script, 'position-test');
      expect(result.success).toBe(true);
    });

    it('should execute position update scripts', () => {
      const script = `
        function onUpdate(deltaTime) {
          entity.setComponent('Transform', {
            position: [1 * deltaTime, 2 * deltaTime, 3 * deltaTime]
          });
        }
      `;

      executor.compileScript(script, 'position-update');
      const result = executor.executeScript('position-update', createMockOptions(1), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should handle incremental position changes in scripts', () => {
      const script = `
        let currentPos = [0, 0, 0];

        function onUpdate(deltaTime) {
          currentPos[0] += deltaTime;
          currentPos[1] += deltaTime * 2;
          currentPos[2] += deltaTime * 3;
        }
      `;

      executor.compileScript(script, 'incremental-position');

      for (let i = 0; i < 5; i++) {
        const result = executor.executeScript(
          'incremental-position',
          createMockOptions(1),
          'onUpdate',
        );
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Rotation Scripts', () => {
    it('should compile rotation scripts', () => {
      const script = `
        function onStart() {
          entity.setComponent('Transform', {
            rotation: [0, 90, 0]
          });
        }
      `;

      const result = executor.compileScript(script, 'rotation-test');
      expect(result.success).toBe(true);
    });

    it('should support continuous rotation', () => {
      const script = `
        let currentRotation = 0;

        function onUpdate(deltaTime) {
          currentRotation += deltaTime * 45;

          entity.setComponent('Transform', {
            rotation: [0, currentRotation, 0]
          });
        }
      `;

      executor.compileScript(script, 'continuous-rotation');

      for (let i = 0; i < 10; i++) {
        const result = executor.executeScript(
          'continuous-rotation',
          createMockOptions(1),
          'onUpdate',
        );
        expect(result.success).toBe(true);
      }
    });

    it('should handle multi-axis rotation', () => {
      const script = `
        function onUpdate(deltaTime) {
          entity.setComponent('Transform', {
            rotation: [30, 45, 60]
          });
        }
      `;

      executor.compileScript(script, 'multi-axis-rotation');
      const result = executor.executeScript(
        'multi-axis-rotation',
        createMockOptions(1),
        'onUpdate',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Scale Scripts', () => {
    it('should compile scale scripts', () => {
      const script = `
        function onStart() {
          entity.setComponent('Transform', {
            scale: [2, 3, 4]
          });
        }
      `;

      const result = executor.compileScript(script, 'scale-test');
      expect(result.success).toBe(true);
    });

    it('should support uniform scaling', () => {
      const script = `
        function onStart() {
          const uniformScale = 2.5;
          entity.setComponent('Transform', {
            scale: [uniformScale, uniformScale, uniformScale]
          });
        }
      `;

      executor.compileScript(script, 'uniform-scale');
      const result = executor.executeScript('uniform-scale', createMockOptions(1), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('Combined Transform Scripts', () => {
    it('should handle simultaneous position, rotation, and scale changes', () => {
      const script = `
        function onStart() {
          entity.setComponent('Transform', {
            position: [5, 10, 15],
            rotation: [30, 60, 90],
            scale: [2, 2, 2]
          });
        }
      `;

      executor.compileScript(script, 'combined-transform');
      const result = executor.executeScript('combined-transform', createMockOptions(1), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should support partial transform updates', () => {
      const script = `
        function onStart() {
          // Only update position
          entity.setComponent('Transform', {
            position: [5, 5, 5]
          });
        }
      `;

      executor.compileScript(script, 'partial-transform');
      const result = executor.executeScript('partial-transform', createMockOptions(1), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('Complex Transform Logic', () => {
    it('should handle oscillating motion', () => {
      const script = `
        let angle = 0;

        function onUpdate(deltaTime) {
          angle += deltaTime * 2;
          const y = Math.sin(angle) * 5;

          entity.setComponent('Transform', {
            position: [0, y, 0]
          });
        }
      `;

      executor.compileScript(script, 'oscillate');

      for (let i = 0; i < 20; i++) {
        const result = executor.executeScript('oscillate', createMockOptions(1), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });

    it('should handle circular motion', () => {
      const script = `
        let angle = 0;

        function onUpdate(deltaTime) {
          angle += deltaTime;
          const x = Math.cos(angle) * 10;
          const z = Math.sin(angle) * 10;

          entity.setComponent('Transform', {
            position: [x, 0, z]
          });
        }
      `;

      executor.compileScript(script, 'circular-motion');

      for (let i = 0; i < 15; i++) {
        const result = executor.executeScript('circular-motion', createMockOptions(1), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });

    it('should handle look-at rotation logic', () => {
      const script = `
        function onUpdate(deltaTime) {
          const targetX = 10;
          const targetZ = 10;

          const angleY = Math.atan2(targetX, targetZ) * (180 / Math.PI);

          entity.setComponent('Transform', {
            rotation: [0, angleY, 0]
          });
        }
      `;

      executor.compileScript(script, 'look-at');
      const result = executor.executeScript('look-at', createMockOptions(1), 'onUpdate');

      expect(result.success).toBe(true);
    });
  });

  describe('Performance with Transform Updates', () => {
    it('should handle many rapid transform updates', () => {
      // Create entity in the world first
      const entity = entityManager.createEntity('TestEntity');

      const script = `
        function onUpdate(deltaTime) {
          entity.setComponent('Transform', {
            position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
            rotation: [Math.random() * 360, Math.random() * 360, Math.random() * 360],
            scale: [1, 1, 1]
          });
        }
      `;

      executor.compileScript(script, 'rapid-updates');

      const executionTimes = [];
      for (let i = 0; i < 60; i++) {
        const result = executor.executeScript(
          'rapid-updates',
          createMockOptions(entity.id),
          'onUpdate',
        );
        expect(result.success).toBe(true);
        executionTimes.push(result.executionTime);
      }

      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      expect(avgTime).toBeLessThan(10); // Should average under 10ms
    });
  });
});
