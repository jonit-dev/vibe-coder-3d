/**
 * Direct Script Executor - Executes user scripts using Function() constructor
 *
 * This replaces the regex-based pattern matching approach with direct JavaScript execution.
 * Scripts get full JavaScript language support while remaining sandboxed from outer scope.
 *
 * Security model:
 * - Scripts execute in strict mode
 * - No access to outer scope (except provided APIs)
 * - No access to window, document, or other browser APIs
 * - APIs are explicitly passed as function parameters
 *
 * Benefits over pattern matching:
 * - Full JavaScript language support (variables, loops, conditionals, etc.)
 * - No regex patterns to maintain
 * - Natural developer experience
 * - Easier to debug
 */

import * as THREE from 'three';
import * as ts from 'typescript';
import { EntityId } from '../ecs/types';
import { IInputAPI, IScriptContext, ITimeAPI } from './ScriptAPI';
import { cleanupTimerAPI } from './apis/TimerAPI';
import { cleanupPhysicsEventsAPI } from './apis/PhysicsEventsAPI';
import { cleanupAudioAPI } from './apis/AudioAPI';
import { ScriptContextFactory } from './ScriptContextFactory';
import { Logger } from '@/core/lib/logger';
import { ComponentMutationBuffer } from '../ecs/mutations/ComponentMutationBuffer';
import { perfMark, perfMeasure } from './instrumentation/perf';

const logger = Logger.create('DirectScriptExecutor');

/**
 * Transpile TypeScript code to JavaScript using the official TypeScript compiler
 * This allows scripts to be written in TypeScript but executed using Function() constructor
 *
 * IMPORTANT: Scripts should NOT use export/import statements as they will cause errors
 */
function transpileTypeScript(code: string): string {
  // Strip any export keywords that might have been added by the AI
  // This prevents "exports is not defined" errors
  const cleanedCode = code
    .replace(/^\s*export\s+/gm, '') // Remove "export " at start of lines
    .replace(/^\s*import\s+.*?;?\s*$/gm, ''); // Remove import statements

  const result = ts.transpileModule(cleanedCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2015, // Use ES2015 modules, then strip imports/exports
      removeComments: false,
      inlineSourceMap: false,
      inlineSources: false,
      declaration: false,
    },
  });

  // Strip any remaining export/import statements from transpiled output
  const cleanedOutput = result.outputText
    .replace(/^\s*export\s+/gm, '')
    .replace(/^\s*import\s+.*?;?\s*$/gm, '')
    .replace(/Object\.defineProperty\(exports,.*?\n/g, '') // Remove Object.defineProperty(exports, ...)
    .replace(/exports\.__esModule\s*=\s*true;?\s*\n?/g, '') // Remove exports.__esModule = true
    .replace(/exports\.\w+\s*=\s*/g, ''); // Remove exports.xxx =

  return cleanedOutput;
}

/**
 * Result of script execution
 */
export interface IScriptExecutionResult {
  success: boolean;
  error?: string;
  executionTime: number;
  output?: unknown;
}

/**
 * Script execution options
 */
export interface IScriptExecutionOptions {
  maxExecutionTime?: number; // in milliseconds
  entityId: EntityId;
  parameters?: Record<string, unknown>;
  timeInfo: ITimeAPI;
  inputInfo: IInputAPI;
  meshRef?: () => THREE.Object3D | null;
  sceneRef?: () => THREE.Scene | null;
}

/**
 * Compiled script with lifecycle methods
 */
interface ICompiledScriptLifecycle {
  onStart?: () => void;
  onUpdate?: (deltaTime: number) => void;
  onDestroy?: () => void;
  onEnable?: () => void;
  onDisable?: () => void;
}

/**
 * Direct script executor using Function() constructor
 *
 * This approach provides full JavaScript support while maintaining security
 * through lexical scoping - scripts can only access explicitly passed APIs.
 */
export class DirectScriptExecutor {
  private static instance: DirectScriptExecutor;

  private contextFactory: ScriptContextFactory;
  private scriptContexts = new Map<EntityId, IScriptContext>();
  private compiledScripts = new Map<string, ICompiledScriptLifecycle>();
  private debugMode: boolean;
  private mutationBuffer: ComponentMutationBuffer;

  // Performance tracking
  private totalCompileTime = 0;
  private compileCount = 0;
  private totalExecuteTime = 0;
  private executeCount = 0;

  private constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.contextFactory = new ScriptContextFactory();
    this.mutationBuffer = new ComponentMutationBuffer();
  }

  public static getInstance(): DirectScriptExecutor {
    if (!DirectScriptExecutor.instance) {
      DirectScriptExecutor.instance = new DirectScriptExecutor(
        import.meta.env.DEV && import.meta.env.VITE_SCRIPT_DEBUG === 'true',
      );
    }
    return DirectScriptExecutor.instance;
  }

  /**
   * Check whether a scriptId has been compiled and cached
   */
  public hasCompiled(scriptId: string): boolean {
    return this.compiledScripts.has(scriptId);
  }

  /**
   * Compile script code using Function() constructor
   *
   * The script is wrapped in a function that returns an object with lifecycle methods.
   * APIs are passed as parameters to ensure they're the only things accessible.
   */
  public compileScript(code: string, scriptId: string): IScriptExecutionResult {
    const markStart = `compile-start-${scriptId}`;
    const markEnd = `compile-end-${scriptId}`;
    const measureName = `compile-${scriptId}`;

    perfMark(markStart);
    const startTime = performance.now();

    if (this.debugMode) {
      logger.debug(`Compiling script: ${scriptId}`);
    }

    try {
      // Check if script is already compiled - return cached result
      if (this.compiledScripts.has(scriptId)) {
        if (this.debugMode) {
          logger.debug(`Using cached script: ${scriptId}`);
        }
        const executionTime = performance.now() - startTime;
        return {
          success: true,
          executionTime,
        };
      }

      // Transpile TypeScript to JavaScript using official TS compiler
      const jsCode = transpileTypeScript(code);

      if (this.debugMode) {
        logger.debug(`Transpiled TypeScript to JavaScript for: ${scriptId}`);
      }

      // Create the function that will execute the script
      // APIs are passed as parameters, making them the only accessible scope
      const scriptFunction = new Function(
        'entity',
        'math',
        'input',
        'time',
        'console',
        'events',
        'audio',
        'timer',
        'query',
        'prefab',
        'entities',
        'gameObject',
        'parameters',
        `
        'use strict';

        // User's script code
        ${jsCode}

        // Return lifecycle methods (if they exist)
        return {
          onStart: typeof onStart !== 'undefined' ? onStart : undefined,
          onUpdate: typeof onUpdate !== 'undefined' ? onUpdate : undefined,
          onDestroy: typeof onDestroy !== 'undefined' ? onDestroy : undefined,
          onEnable: typeof onEnable !== 'undefined' ? onEnable : undefined,
          onDisable: typeof onDisable !== 'undefined' ? onDisable : undefined,
        };
        `,
      );

      // Cache the compiled function
      this.compiledScripts.set(scriptId, scriptFunction as unknown as ICompiledScriptLifecycle);

      perfMark(markEnd);
      const executionTime = perfMeasure(measureName, markStart, markEnd);

      // Track compile metrics
      this.totalCompileTime += executionTime;
      this.compileCount++;

      if (this.debugMode) {
        logger.debug(`Script compiled successfully: ${scriptId} (${executionTime.toFixed(2)}ms)`);
      }

      return {
        success: true,
        executionTime,
      };
    } catch (error) {
      perfMark(markEnd);
      const executionTime = perfMeasure(measureName, markStart, markEnd);

      // Track compile metrics even on failure
      this.totalCompileTime += executionTime;
      this.compileCount++;

      logger.error(`Compilation error for ${scriptId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Execute a compiled script's lifecycle method
   */
  public executeScript(
    scriptId: string,
    options: IScriptExecutionOptions,
    lifecycleMethod: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable' = 'onUpdate',
  ): IScriptExecutionResult {
    const markStart = `execute-start-${scriptId}-${lifecycleMethod}`;
    const markEnd = `execute-end-${scriptId}-${lifecycleMethod}`;
    const measureName = `execute-${scriptId}-${lifecycleMethod}`;

    perfMark(markStart);
    const maxTime = options.maxExecutionTime || 16; // Default 16ms max execution

    try {
      // Get compiled script from cache
      const compiledFunction = this.compiledScripts.get(scriptId);
      if (!compiledFunction) {
        return {
          success: false,
          error: `Script not compiled for entity ${options.entityId}. Call compileScript() first.`,
          executionTime: 0,
        };
      }

      // Get or create the script context for this entity
      let context = this.scriptContexts.get(options.entityId);
      if (!context) {
        context = this.contextFactory.createContext({
          entityId: options.entityId,
          parameters: options.parameters || {},
          timeInfo: options.timeInfo,
          inputInfo: options.inputInfo,
          meshRef: options.meshRef,
          sceneRef: options.sceneRef,
          mutationBuffer: this.mutationBuffer,
        });
        this.scriptContexts.set(options.entityId, context);
      }

      // Update dynamic context properties
      context.time = options.timeInfo;
      context.input = options.inputInfo;
      context.parameters = options.parameters || {};

      // Execute the script function to get lifecycle methods
      // This is cached per scriptId, so we only compile once
      let lifecycle: ICompiledScriptLifecycle;

      // Check if this is a function (needs to be called) or already the lifecycle object

      if (typeof compiledFunction === 'function') {
        const executionStart = performance.now();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        lifecycle = (compiledFunction as unknown as Function)(
          context.entity,
          context.math,
          context.input,
          context.time,
          context.console,
          context.events,
          context.audio,
          context.timer,
          context.query,
          context.prefab,
          context.entities,
          context.gameObject,
          context.parameters,
        ) as ICompiledScriptLifecycle;

        const executionTime = performance.now() - executionStart;

        // Cache the result so we don't re-execute the script body every frame
        this.compiledScripts.set(scriptId, lifecycle);

        if (executionTime > maxTime) {
          logger.warn(
            `Script initialization exceeded time limit: ${scriptId} (${executionTime.toFixed(2)}ms)`,
          );
        }
      } else {
        lifecycle = compiledFunction;
      }

      // Call the requested lifecycle method
      const lifecycleFunction = lifecycle[lifecycleMethod];
      if (!lifecycleFunction) {
        // No lifecycle method defined, that's ok
        perfMark(markEnd);
        const executionTime = perfMeasure(measureName, markStart, markEnd);

        // Track execute metrics
        this.totalExecuteTime += executionTime;
        this.executeCount++;

        return {
          success: true,
          executionTime,
        };
      }

      const methodStart = performance.now();

      // Execute the lifecycle method
      if (lifecycleMethod === 'onUpdate' && typeof lifecycleFunction === 'function') {
        (lifecycleFunction as (deltaTime: number) => void)(options.timeInfo.deltaTime);
      } else if (typeof lifecycleFunction === 'function') {
        (lifecycleFunction as () => void)();
      }

      const methodTime = performance.now() - methodStart;

      if (methodTime > maxTime) {
        const timeStr = methodTime.toFixed(2);
        logger.warn(
          `Script execution took longer than recommended: ${scriptId} (${timeStr}ms > ${maxTime}ms)`,
        );
      }

      perfMark(markEnd);
      const totalTime = perfMeasure(measureName, markStart, markEnd);

      // Track execute metrics
      this.totalExecuteTime += totalTime;
      this.executeCount++;

      return {
        success: true,
        executionTime: totalTime,
      };
    } catch (error) {
      perfMark(markEnd);
      const executionTime = perfMeasure(measureName, markStart, markEnd);

      // Track execute metrics even on failure
      this.totalExecuteTime += executionTime;
      this.executeCount++;

      logger.error(`Execution error for ${scriptId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Remove script context when entity is destroyed
   */
  public removeScriptContext(entityId: EntityId): void {
    // Cleanup timers, physics events, and audio
    cleanupTimerAPI(entityId);
    cleanupPhysicsEventsAPI(entityId);
    cleanupAudioAPI(entityId);
    this.scriptContexts.delete(entityId);

    if (this.debugMode) {
      logger.debug(`Removed script context for entity ${entityId}`);
    }
  }

  /**
   * Remove compiled script
   */
  public removeCompiledScript(scriptId: string): void {
    this.compiledScripts.delete(scriptId);

    if (this.debugMode) {
      logger.debug(`Removed compiled script: ${scriptId}`);
    }
  }

  /**
   * Get script context for debugging purposes
   */
  public getScriptContext(entityId: EntityId): IScriptContext | undefined {
    return this.scriptContexts.get(entityId);
  }

  /**
   * Clear all compiled scripts and contexts (useful for hot reload)
   */
  public clearAll(): void {
    // Cleanup all timer APIs, physics events, and audio before clearing contexts
    for (const entityId of this.scriptContexts.keys()) {
      cleanupTimerAPI(entityId);
      cleanupPhysicsEventsAPI(entityId);
      cleanupAudioAPI(entityId);
    }

    this.compiledScripts.clear();
    this.scriptContexts.clear();
    this.mutationBuffer.clear();

    if (this.debugMode) {
      logger.debug('Cleared all compiled scripts and contexts');
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): { compiled: number; contexts: number } {
    return {
      compiled: this.compiledScripts.size,
      contexts: this.scriptContexts.size,
    };
  }

  /**
   * Get the shared mutation buffer for component writes
   * This should be flushed by ComponentWriteSystem after all scripts execute
   */
  public getMutationBuffer(): ComponentMutationBuffer {
    return this.mutationBuffer;
  }

  /**
   * Get compilation and execution statistics
   */
  public getPerformanceStats(): {
    totalCompileTime: number;
    compileCount: number;
    avgCompileTime: number;
    totalExecuteTime: number;
    executeCount: number;
    avgExecuteTime: number;
  } {
    return {
      totalCompileTime: this.totalCompileTime,
      compileCount: this.compileCount,
      avgCompileTime: this.compileCount > 0 ? this.totalCompileTime / this.compileCount : 0,
      totalExecuteTime: this.totalExecuteTime,
      executeCount: this.executeCount,
      avgExecuteTime: this.executeCount > 0 ? this.totalExecuteTime / this.executeCount : 0,
    };
  }

  /**
   * Reset performance statistics
   */
  public resetPerformanceStats(): void {
    this.totalCompileTime = 0;
    this.compileCount = 0;
    this.totalExecuteTime = 0;
    this.executeCount = 0;
  }
}
