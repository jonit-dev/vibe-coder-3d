/**
 * Script Executor - Handles secure execution of user scripts in a sandboxed environment
 * Refactored to use Parser, Compiler, Runner, and Cache for better separation of concerns
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';
import { IInputAPI, IScriptContext, ITimeAPI } from './ScriptAPI';
import { cleanupTimerAPI } from './apis/TimerAPI';
import { LifecycleParser } from './parser/LifecycleParser';
import { ScriptCompiler } from './compiler/ScriptCompiler';
import { InstructionRunner } from './runtime/InstructionRunner';
import { ScriptCache } from './cache/ScriptCache';
import { ScriptContextFactory } from './ScriptContextFactory';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ScriptExecutor');

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
  meshRef?: () => THREE.Object3D | null; // Reference to entity's Three.js object
  sceneRef?: () => THREE.Scene | null; // Reference to the Three.js scene
}

/**
 * Safe script executor using parser/compiler/runner architecture
 */
export class ScriptExecutor {
  private static instance: ScriptExecutor;

  private parser: LifecycleParser;
  private compiler: ScriptCompiler;
  private runner: InstructionRunner;
  private cache: ScriptCache;
  private contextFactory: ScriptContextFactory;
  private scriptContexts = new Map<EntityId, IScriptContext>();
  private debugMode: boolean;

  private constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.parser = new LifecycleParser();
    this.compiler = new ScriptCompiler(debugMode);
    this.runner = new InstructionRunner(debugMode);
    this.cache = new ScriptCache(100, 5 * 60 * 1000, debugMode);
    this.contextFactory = new ScriptContextFactory();
  }

  public static getInstance(): ScriptExecutor {
    if (!ScriptExecutor.instance) {
      ScriptExecutor.instance = new ScriptExecutor(
        import.meta.env.DEV && import.meta.env.VITE_SCRIPT_DEBUG === 'true',
      );
    }
    return ScriptExecutor.instance;
  }

  /**
   * Check whether a scriptId has been compiled and cached
   */
  public hasCompiled(scriptId: string): boolean {
    return this.cache.has(scriptId);
  }

  /**
   * Compile script code using parser and compiler
   */
  public compileScript(code: string, scriptId: string): IScriptExecutionResult {
    const startTime = performance.now();

    if (this.debugMode) {
      logger.debug(`Compiling script: ${scriptId}`);
    }

    try {
      // Check cache first
      if (this.cache.has(scriptId)) {
        if (this.debugMode) {
          logger.debug(`Script already compiled (cached): ${scriptId}`);
        }
        const executionTime = performance.now() - startTime;
        return {
          success: true,
          executionTime,
        };
      }

      // Parse the script
      const ast = this.parser.parse(code);

      if (!ast.isValid) {
        const executionTime = performance.now() - startTime;
        logger.error(`Script parsing failed for ${scriptId}:`, ast.parseError);
        return {
          success: false,
          error: ast.parseError || 'Script parsing failed',
          executionTime,
        };
      }

      // Compile to instructions
      const compiled = this.compiler.compile(ast);

      // Cache the compiled script
      this.cache.set(scriptId, compiled);

      const executionTime = performance.now() - startTime;

      if (this.debugMode) {
        logger.debug(`Script compiled successfully: ${scriptId} (${executionTime.toFixed(2)}ms)`);
      }

      return {
        success: true,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      logger.error(`Compilation error for ${scriptId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Execute a compiled script using the instruction runner
   */
  public executeScript(
    scriptId: string,
    options: IScriptExecutionOptions,
    lifecycleMethod: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable' = 'onUpdate',
  ): IScriptExecutionResult {
    const startTime = performance.now();
    const maxTime = options.maxExecutionTime || 16; // Default 16ms max execution

    try {
      // Get compiled script from cache
      const compiledScript = this.cache.get(scriptId);
      if (!compiledScript) {
        return {
          success: false,
          error: `Script not compiled for entity ${options.entityId}. Ensure script system is running and script has been processed.`,
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
        });
        this.scriptContexts.set(options.entityId, context);
      }

      // Update dynamic context properties
      context.time = options.timeInfo;
      context.parameters = options.parameters || {};

      // Get the compiled lifecycle
      const lifecycle = compiledScript.lifecycles[lifecycleMethod];
      if (!lifecycle || lifecycle.instructions.length === 0) {
        // No instructions to execute
        const executionTime = performance.now() - startTime;
        return {
          success: true,
          executionTime,
        };
      }

      // Execute the lifecycle with the runner
      const executionStart = performance.now();

      if (lifecycleMethod === 'onUpdate') {
        this.runner.run(lifecycle, context, options.timeInfo.deltaTime);
      } else {
        this.runner.run(lifecycle, context);
      }

      const executionTime = performance.now() - executionStart;
      if (executionTime > maxTime) {
        const timeStr = executionTime.toFixed(2);
        throw new Error(
          `Script execution exceeded maximum time limit of ${maxTime}ms (took ${timeStr}ms)`,
        );
      }

      const totalTime = performance.now() - startTime;

      return {
        success: true,
        executionTime: totalTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

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
    // Cleanup timers
    cleanupTimerAPI(entityId);
    this.scriptContexts.delete(entityId);

    if (this.debugMode) {
      logger.debug(`Removed script context for entity ${entityId}`);
    }
  }

  /**
   * Remove compiled script
   */
  public removeCompiledScript(scriptId: string): void {
    this.cache.delete(scriptId);

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
    this.cache.clear();
    this.scriptContexts.clear();

    if (this.debugMode) {
      logger.debug('Cleared all compiled scripts and contexts');
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): { compiled: number; contexts: number; oldestScript: number } {
    const stats = this.cache.stats();

    return {
      compiled: stats.size,
      contexts: this.scriptContexts.size,
      oldestScript: stats.oldestMs,
    };
  }
}
