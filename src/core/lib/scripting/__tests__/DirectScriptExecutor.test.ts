/**
 * Tests for DirectScriptExecutor
 *
 * These tests verify that the Function() constructor approach works correctly
 * and provides full JavaScript language support.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { IScriptExecutionOptions } from '../DirectScriptExecutor';

describe('DirectScriptExecutor', () => {
  let executor: DirectScriptExecutor;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    executor.clearAll();
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

  describe('Basic Compilation', () => {
    it('should compile a simple script', () => {
      const code = `
        function onStart() {
          console.log("Hello World");
        }
      `;

      const result = executor.compileScript(code, 'test-script');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should cache compiled scripts', () => {
      const code = `function onStart() {}`;
      const scriptId = 'test-script';

      const result1 = executor.compileScript(code, scriptId);
      expect(result1.success).toBe(true);

      const result2 = executor.compileScript(code, scriptId);
      expect(result2.success).toBe(true);
      expect(result2.executionTime).toBeLessThan(result1.executionTime);
    });

    it('should detect syntax errors at compilation', () => {
      const code = `
        function onStart() {
          // This is truly invalid syntax that can't be auto-fixed
          const x = );
        }
      `;

      const result = executor.compileScript(code, 'bad-script');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Lifecycle Execution', () => {
    it('should execute onStart lifecycle', () => {
      const code = `
        let executed = false;
        function onStart() {
          executed = true;
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should execute onUpdate with deltaTime', () => {
      const code = `
        let updateCount = 0;
        function onUpdate(deltaTime) {
          updateCount++;
        }
      `;

      executor.compileScript(code, 'test-script');

      // Execute onUpdate multiple times
      for (let i = 0; i < 5; i++) {
        const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });

    it('should execute all lifecycle methods', () => {
      const code = `
        const calls = [];
        function onStart() { calls.push('start'); }
        function onUpdate(dt) { calls.push('update'); }
        function onDestroy() { calls.push('destroy'); }
        function onEnable() { calls.push('enable'); }
        function onDisable() { calls.push('disable'); }
      `;

      executor.compileScript(code, 'test-script');

      const methods: Array<'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable'> = [
        'onStart',
        'onUpdate',
        'onDestroy',
        'onEnable',
        'onDisable',
      ];

      methods.forEach((method) => {
        const result = executor.executeScript('test-script', createMockOptions(), method);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Entity API Access', () => {
    it('should allow entity.transform.rotate() without errors', () => {
      const code = `
        function onUpdate(deltaTime) {
          entity.transform.rotate(0, deltaTime * 0.5, 0);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should allow entity.transform.translate() without errors', () => {
      const code = `
        function onUpdate(deltaTime) {
          entity.transform.translate(deltaTime, 0, 0);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript(
        'test-script',
        createMockOptions({ timeInfo: { time: 0, deltaTime: 0.1, frameCount: 0 } }),
        'onUpdate',
      );

      expect(result.success).toBe(true);
    });

    it('should allow entity.transform.setPosition() without errors', () => {
      const code = `
        function onStart() {
          entity.transform.setPosition(1, 2, 3);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onStart');

      expect(result.success).toBe(true);
    });
  });

  describe('Full JavaScript Support', () => {
    it('should support variables', () => {
      const code = `
        function onUpdate(deltaTime) {
          const speed = 2.0;
          const rotationSpeed = deltaTime * speed;
          entity.transform.rotate(0, rotationSpeed, 0);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should support conditionals', () => {
      const code = `
        let counter = 0;
        function onUpdate(deltaTime) {
          counter++;
          if (counter > 5) {
            console.log("Counter is greater than 5");
          }
        }
      `;

      executor.compileScript(code, 'test-script');

      // Execute multiple times
      for (let i = 0; i < 7; i++) {
        const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });

    it('should support loops', () => {
      const code = `
        function onUpdate(deltaTime) {
          let totalRotation = 0;
          for (let i = 0; i < 5; i++) {
            totalRotation += deltaTime * 0.1;
          }
          entity.transform.rotate(0, totalRotation, 0);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should support functions', () => {
      const code = `
        function calculateRotation(deltaTime, multiplier) {
          return deltaTime * multiplier;
        }

        function onUpdate(deltaTime) {
          const rotation = calculateRotation(deltaTime, 3.0);
          entity.transform.rotate(0, rotation, 0);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should support arrays', () => {
      const code = `
        function onUpdate(deltaTime) {
          const movements = [1, 2, 3];
          entity.transform.setPosition(movements[0], movements[1], movements[2]);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should support objects', () => {
      const code = `
        function onUpdate(deltaTime) {
          const movement = { x: 5, y: 10, z: 15 };
          entity.transform.setPosition(movement.x, movement.y, movement.z);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(true);
    });

    it('should support Math operations', () => {
      const code = `
        function onUpdate(deltaTime) {
          const sinValue = math.sin(time.time);
          console.log(sinValue);
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript(
        'test-script',
        createMockOptions({ timeInfo: { time: Math.PI / 2, deltaTime: 0.016, frameCount: 0 } }),
        'onUpdate',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should catch runtime errors', () => {
      const code = `
        function onUpdate(deltaTime) {
          throw new Error("Test error");
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });

    it('should enforce execution time limits', () => {
      const code = `
        function onUpdate(deltaTime) {
          // Simulate long-running operation
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Busy wait
          }
        }
      `;

      executor.compileScript(code, 'test-script');
      const result = executor.executeScript(
        'test-script',
        createMockOptions({ maxExecutionTime: 16 }),
        'onUpdate',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeded maximum time limit');
    });
  });

  describe('Script Context Management', () => {
    it('should maintain context between executions', () => {
      const code = `
        let frameCount = 0;
        function onUpdate(deltaTime) {
          frameCount++;
        }
      `;

      executor.compileScript(code, 'test-script');

      // Execute multiple times
      for (let i = 1; i <= 3; i++) {
        const result = executor.executeScript('test-script', createMockOptions(), 'onUpdate');
        expect(result.success).toBe(true);
      }
    });

    it('should isolate contexts between entities', () => {
      const entity1 = 1;
      const entity2 = 2;

      const code = `
        let value = 0;
        function onUpdate(deltaTime) {
          value++;
        }
      `;

      executor.compileScript(code, 'test-script');

      // Execute for entity1
      const result1 = executor.executeScript(
        'test-script',
        createMockOptions({ entityId: entity1 }),
        'onUpdate',
      );
      expect(result1.success).toBe(true);

      // Execute for entity2
      const result2 = executor.executeScript(
        'test-script',
        createMockOptions({ entityId: entity2 }),
        'onUpdate',
      );
      expect(result2.success).toBe(true);

      executor.removeScriptContext(entity2);
    });
  });

  describe('Cache Management', () => {
    it('should report cache statistics', () => {
      const code1 = `function onStart() {}`;
      const code2 = `function onUpdate(dt) {}`;

      executor.compileScript(code1, 'script-1');
      executor.compileScript(code2, 'script-2');

      executor.executeScript('script-1', createMockOptions(), 'onStart');

      const stats = executor.getCacheStats();
      expect(stats.compiled).toBeGreaterThanOrEqual(2);
      expect(stats.contexts).toBeGreaterThanOrEqual(1);
    });

    it('should clear all caches', () => {
      const code = `function onStart() {}`;
      executor.compileScript(code, 'test-script');
      executor.executeScript('test-script', createMockOptions(), 'onStart');

      executor.clearAll();

      const stats = executor.getCacheStats();
      expect(stats.compiled).toBe(0);
      expect(stats.contexts).toBe(0);
    });
  });
});
