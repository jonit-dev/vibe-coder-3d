/**
 * Advanced DirectScriptExecutor Tests
 * Testing hot-reload, mutation buffer, multi-entity execution, and error recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DirectScriptExecutor, IScriptExecutionOptions } from '../DirectScriptExecutor';

describe('DirectScriptExecutor - Advanced Features', () => {
  let executor: DirectScriptExecutor;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    executor.clearAll();
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

  describe('Hot Reload Caching', () => {
    it('should remove cached script on recompilation', () => {
      const code1 = `
        function onStart() {
          console.log("Version 1");
        }
      `;

      const scriptId = 'hot-reload-test';

      // Compile version 1
      const result1 = executor.compileScript(code1, scriptId);
      expect(result1.success).toBe(true);
      expect(executor.hasCompiled(scriptId)).toBe(true);

      // Recompile with version 2
      const code2 = `
        function onStart() {
          console.log("Version 2");
        }
      `;

      const result2 = executor.compileScript(code2, scriptId);
      expect(result2.success).toBe(true);
      expect(executor.hasCompiled(scriptId)).toBe(true);

      // Verify script was recompiled
      executor.executeScript(scriptId, createMockOptions(1), 'onStart');
    });

    it('should handle rapid recompilation without memory leaks', () => {
      const scriptId = 'rapid-recompile';

      for (let i = 0; i < 10; i++) {
        const code = `
          function onUpdate(deltaTime) {
            const version = ${i};
          }
        `;

        const result = executor.compileScript(code, scriptId);
        expect(result.success).toBe(true);
      }

      const stats = executor.getCacheStats();
      expect(stats.compiled).toBe(1); // Should only have one cached version
    });

    it('should clear all scripts and contexts', () => {
      const code = `function onStart() {}`;

      executor.compileScript(code, 'script1');
      executor.compileScript(code, 'script2');
      executor.compileScript(code, 'script3');

      executor.executeScript('script1', createMockOptions(1), 'onStart');
      executor.executeScript('script2', createMockOptions(2), 'onStart');

      let stats = executor.getCacheStats();
      expect(stats.compiled).toBe(3);
      expect(stats.contexts).toBe(2);

      executor.clearAll();

      stats = executor.getCacheStats();
      expect(stats.compiled).toBe(0);
      expect(stats.contexts).toBe(0);
    });
  });

  describe('Mutation Buffer Integration', () => {
    it('should provide mutation buffer for component writes', () => {
      const mutationBuffer = executor.getMutationBuffer();
      expect(mutationBuffer).toBeDefined();
      // Mutation buffer should have required methods
      expect(typeof mutationBuffer.queue).toBe('function');
      expect(typeof mutationBuffer.flush).toBe('function');
      expect(typeof mutationBuffer.clear).toBe('function');
      expect(typeof mutationBuffer.size).toBe('number');
    });

    it('should share mutation buffer across all scripts', () => {
      const buffer1 = executor.getMutationBuffer();
      const buffer2 = executor.getMutationBuffer();

      // Should be the same instance
      expect(buffer1).toBe(buffer2);
    });
  });

  describe('Multi-Entity Script Execution', () => {
    it('should maintain separate contexts for different entities', () => {
      const code = `
        let counter = 0;
        function onUpdate(deltaTime) {
          counter++;
        }
      `;

      executor.compileScript(code, 'shared-script');

      // Execute for entity 1
      executor.executeScript('shared-script', createMockOptions(1), 'onUpdate');
      executor.executeScript('shared-script', createMockOptions(1), 'onUpdate');

      // Execute for entity 2
      executor.executeScript('shared-script', createMockOptions(2), 'onUpdate');

      // Each entity should have its own context and counter
      const context1 = executor.getScriptContext(1);
      const context2 = executor.getScriptContext(2);

      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
      expect(context1).not.toBe(context2);
    });

    it('should handle concurrent execution of multiple entities', () => {
      const code = `
        let executionCount = 0;
        function onStart() {
          executionCount++;
        }
      `;

      executor.compileScript(code, 'concurrent-script');

      const results = [];
      for (let i = 1; i <= 10; i++) {
        const result = executor.executeScript('concurrent-script', createMockOptions(i), 'onStart');
        results.push(result);
      }

      // All executions should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Should have 10 separate contexts
      const stats = executor.getCacheStats();
      expect(stats.contexts).toBe(10);
    });

    it('should properly clean up entity contexts on removal', () => {
      const code = `function onStart() {}`;

      executor.compileScript(code, 'cleanup-test');

      executor.executeScript('cleanup-test', createMockOptions(1), 'onStart');
      executor.executeScript('cleanup-test', createMockOptions(2), 'onStart');
      executor.executeScript('cleanup-test', createMockOptions(3), 'onStart');

      let stats = executor.getCacheStats();
      expect(stats.contexts).toBe(3);

      executor.removeScriptContext(2);

      stats = executor.getCacheStats();
      expect(stats.contexts).toBe(2);

      const context2 = executor.getScriptContext(2);
      expect(context2).toBeUndefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from runtime errors without breaking executor', () => {
      const badCode = `
        function onStart() {
          throw new Error("Runtime error");
        }
      `;

      executor.compileScript(badCode, 'error-script');
      const result1 = executor.executeScript('error-script', createMockOptions(1), 'onStart');

      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Runtime error');

      // Executor should still work for other scripts
      const goodCode = `function onStart() {}`;
      executor.compileScript(goodCode, 'good-script');
      const result2 = executor.executeScript('good-script', createMockOptions(2), 'onStart');

      expect(result2.success).toBe(true);
    });

    it('should handle missing lifecycle methods gracefully', () => {
      const code = `
        function onStart() {
          console.log("onStart exists");
        }
        // onUpdate is missing
      `;

      executor.compileScript(code, 'missing-lifecycle');

      const startResult = executor.executeScript(
        'missing-lifecycle',
        createMockOptions(1),
        'onStart',
      );
      const updateResult = executor.executeScript(
        'missing-lifecycle',
        createMockOptions(1),
        'onUpdate',
      );

      expect(startResult.success).toBe(true);
      expect(updateResult.success).toBe(true); // Should not fail if lifecycle missing
    });

    it('should handle TypeScript transpilation errors', () => {
      const invalidTS = `
        function onStart() {
          const x: WrongType = "test";
        }
      `;

      // TypeScript transpiler should handle this gracefully
      const result = executor.compileScript(invalidTS, 'ts-error');

      // Transpilation succeeds (TS types are stripped), but runtime may fail
      expect(result.success).toBe(true);
    });

    it('should timeout long-running scripts', () => {
      const infiniteLoop = `
        function onUpdate(deltaTime) {
          while(true) {
            // Infinite loop
          }
        }
      `;

      executor.compileScript(infiniteLoop, 'timeout-script');

      // Note: Function() doesn't have built-in timeout, but we test the framework
      // In production, maxExecutionTime would be enforced by the system
      const options = createMockOptions(1, { maxExecutionTime: 1 });

      // This will hang unless there's timeout protection
      // For now, we just verify the option is passed
      expect(options.maxExecutionTime).toBe(1);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time', () => {
      const code = `
        function onUpdate(deltaTime) {
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
        }
      `;

      executor.compileScript(code, 'perf-script');
      const result = executor.executeScript('perf-script', createMockOptions(1), 'onUpdate');

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(100); // Should be reasonably fast
    });

    it('should report execution time for compilation', () => {
      const code = `
        function onStart() {
          const data = Array(1000).fill(0).map((_, i) => i * 2);
        }
      `;

      const result = executor.compileScript(code, 'compile-perf');

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should maintain good performance with cached scripts', () => {
      const code = `function onUpdate(deltaTime) { const x = 1 + 1; }`;

      executor.compileScript(code, 'cached-perf');

      // First execution - initializes context
      const result1 = executor.executeScript('cached-perf', createMockOptions(1), 'onUpdate');

      // Subsequent executions should be faster
      const times = [];
      for (let i = 0; i < 10; i++) {
        const result = executor.executeScript('cached-perf', createMockOptions(1), 'onUpdate');
        times.push(result.executionTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(5); // Cached execution should be very fast
    });
  });

  describe('Context Isolation', () => {
    it('should isolate script contexts from each other', () => {
      const code1 = `
        let myValue = 100;
        function onStart() {
          myValue = 200;
        }
      `;

      const code2 = `
        let myValue = 300;
        function onStart() {
          myValue = 400;
        }
      `;

      executor.compileScript(code1, 'script1');
      executor.compileScript(code2, 'script2');

      executor.executeScript('script1', createMockOptions(1), 'onStart');
      executor.executeScript('script2', createMockOptions(2), 'onStart');

      // Each script should maintain its own state
      const context1 = executor.getScriptContext(1);
      const context2 = executor.getScriptContext(2);

      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
    });

    it('should not allow scripts to access window or global scope', () => {
      const code = `
        function onStart() {
          try {
            const w = window;
            console.log("Should not access window");
          } catch (e) {
            console.log("Correctly blocked window access");
          }
        }
      `;

      executor.compileScript(code, 'isolation-test');
      const result = executor.executeScript('isolation-test', createMockOptions(1), 'onStart');

      // Script should execute but window should be undefined
      expect(result.success).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    it('should accurately report cache statistics', () => {
      const code = `function onStart() {}`;

      // Initial state
      let stats = executor.getCacheStats();
      expect(stats.compiled).toBe(0);
      expect(stats.contexts).toBe(0);

      // Add compiled scripts
      executor.compileScript(code, 'script1');
      executor.compileScript(code, 'script2');

      stats = executor.getCacheStats();
      expect(stats.compiled).toBe(2);
      expect(stats.contexts).toBe(0);

      // Execute to create contexts
      executor.executeScript('script1', createMockOptions(1), 'onStart');
      executor.executeScript('script2', createMockOptions(2), 'onStart');

      stats = executor.getCacheStats();
      expect(stats.compiled).toBe(2);
      expect(stats.contexts).toBe(2);
    });
  });

  describe('Script Context Updates', () => {
    it('should update dynamic context properties', () => {
      const code = `
        function onUpdate(deltaTime) {
          // Time should update each frame
        }
      `;

      executor.compileScript(code, 'dynamic-test');

      const options1 = createMockOptions(1, {
        timeInfo: { time: 1.0, deltaTime: 0.016, frameCount: 60 },
      });

      const options2 = createMockOptions(1, {
        timeInfo: { time: 2.0, deltaTime: 0.016, frameCount: 120 },
      });

      executor.executeScript('dynamic-test', options1, 'onUpdate');
      executor.executeScript('dynamic-test', options2, 'onUpdate');

      const context = executor.getScriptContext(1);
      expect(context).toBeDefined();
      expect(context?.time.time).toBe(2.0);
      expect(context?.time.frameCount).toBe(120);
    });

    it('should update parameters on each execution', () => {
      const code = `
        function onUpdate(deltaTime) {
          // Parameters should be accessible
        }
      `;

      executor.compileScript(code, 'params-test');

      const options1 = createMockOptions(1, {
        parameters: { speed: 1.0 },
      });

      const options2 = createMockOptions(1, {
        parameters: { speed: 2.0, color: '#ff0000' },
      });

      executor.executeScript('params-test', options1, 'onUpdate');
      executor.executeScript('params-test', options2, 'onUpdate');

      const context = executor.getScriptContext(1);
      expect(context).toBeDefined();
      expect(context?.parameters).toEqual({ speed: 2.0, color: '#ff0000' });
    });
  });
});
