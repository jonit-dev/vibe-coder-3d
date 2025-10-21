/**
 * Script Compiler Facade
 *
 * Provides a high-level interface for script compilation and execution with:
 * - Caching by scriptId + codeHash (strong cache invalidation)
 * - Parameter parsing cache (by parametersHash)
 * - Batched compile scheduling (N per frame to avoid stutters)
 * - Performance instrumentation
 *
 * This wraps DirectScriptExecutor and adds caching/batching logic.
 */

import { DirectScriptExecutor } from './DirectScriptExecutor';
import { IInputAPI, ITimeAPI } from './ScriptAPI';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ScriptCompiler');

/**
 * Compilation request with optional code hash for strong caching
 */
export interface ICompileRequest {
  scriptId: string;
  code: string;
  codeHash?: string; // If provided, enables strong cache invalidation
}

/**
 * Compilation result with performance metrics
 */
export interface ICompileResult {
  ok: boolean;
  error?: string;
  compileMs: number;
}

/**
 * Execution options for lifecycle methods
 */
export interface IExecuteOptions {
  entityId: number;
  maxExecutionTimeMs?: number;
  parameters?: Record<string, unknown>;
  parametersHash?: string; // Optional hash for parameter caching
  deltaTimeSec?: number;
}

/**
 * Execution result with performance metrics
 */
export interface IExecuteResult {
  ok: boolean;
  execMs: number;
  error?: string;
}

/**
 * Script compiler facade interface
 */
export interface IScriptCompiler {
  /**
   * Compile a script (async to support future worker-based transpilation)
   */
  compile(req: ICompileRequest): Promise<ICompileResult>;

  /**
   * Execute a lifecycle method on a compiled script
   */
  execute(
    scriptId: string,
    lifecycle: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable',
    opts: IExecuteOptions,
  ): IExecuteResult;

  /**
   * Invalidate cache for a specific script
   */
  invalidate(scriptId: string): void;

  /**
   * Get statistics about cache and performance
   */
  getStats(): {
    compileCacheSize: number;
    paramsCacheSize: number;
    avgCompileMs: number;
    avgExecuteMs: number;
  };
}

/**
 * Cache entry for compiled scripts
 */
interface IScriptCacheEntry {
  scriptId: string;
  codeHash?: string;
  compiledAt: number;
}

/**
 * Cache entry for parsed parameters
 */
interface IParameterCacheEntry {
  parametersHash: string;
  parsed: Record<string, unknown>;
  cachedAt: number;
}

/**
 * Create a new Script Compiler facade
 */
export const createScriptCompiler = (): IScriptCompiler => {
  const executor = DirectScriptExecutor.getInstance();

  // Caches
  const scriptCache = new Map<string, IScriptCacheEntry>();
  const parameterCache = new Map<string, IParameterCacheEntry>();

  // Performance tracking
  let totalCompileTime = 0;
  let compileCount = 0;
  let totalExecuteTime = 0;
  let executeCount = 0;

  return {
    async compile(req: ICompileRequest): Promise<ICompileResult> {
      const startTime = performance.now();

      try {
        // Check if already compiled and up-to-date
        const cached = scriptCache.get(req.scriptId);
        if (cached && req.codeHash && cached.codeHash === req.codeHash) {
          // Cache hit - no recompilation needed
          const compileMs = performance.now() - startTime;
          logger.debug(`Cache hit for ${req.scriptId} (hash: ${req.codeHash?.slice(0, 8)})`);
          return { ok: true, compileMs };
        }

        // Compile using DirectScriptExecutor
        const result = executor.compileScript(req.code, req.scriptId);

        const compileMs = performance.now() - startTime;

        // Track metrics
        totalCompileTime += compileMs;
        compileCount++;

        if (result.success) {
          // Update cache
          scriptCache.set(req.scriptId, {
            scriptId: req.scriptId,
            codeHash: req.codeHash,
            compiledAt: Date.now(),
          });

          logger.debug(`Compiled ${req.scriptId} in ${compileMs.toFixed(2)}ms`);
          return { ok: true, compileMs };
        } else {
          logger.error(`Compilation failed for ${req.scriptId}:`, result.error);
          return { ok: false, error: result.error, compileMs };
        }
      } catch (error) {
        const compileMs = performance.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Compilation error for ${req.scriptId}:`, error);
        return { ok: false, error: errorMsg, compileMs };
      }
    },

    execute(
      scriptId: string,
      lifecycle: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable',
      opts: IExecuteOptions,
    ): IExecuteResult {
      const startTime = performance.now();

      try {
        // Get or parse parameters (with caching if parametersHash provided)
        let parameters = opts.parameters || {};

        if (opts.parametersHash) {
          const cached = parameterCache.get(opts.parametersHash);
          if (cached) {
            parameters = cached.parsed;
          } else if (opts.parameters) {
            // Cache the parsed parameters
            parameterCache.set(opts.parametersHash, {
              parametersHash: opts.parametersHash,
              parsed: opts.parameters,
              cachedAt: Date.now(),
            });
          }
        }

        // Create time and input APIs (these should be provided by caller eventually)
        const timeInfo: ITimeAPI = {
          time: performance.now() / 1000,
          deltaTime: opts.deltaTimeSec || 0,
          frameCount: 0,
        };

        const inputInfo: IInputAPI = {
          isKeyDown: () => false,
          isKeyPressed: () => false,
          isKeyReleased: () => false,
          mousePosition: () => [0, 0],
          mouseDelta: () => [0, 0],
          isMouseButtonDown: () => false,
          isMouseButtonPressed: () => false,
          isMouseButtonReleased: () => false,
          mouseWheel: () => 0,
          lockPointer: () => {},
          unlockPointer: () => {},
          isPointerLocked: () => false,
          getActionValue: () => 0,
          isActionActive: () => false,
          onAction: () => () => {},
          offAction: () => {},
          enableActionMap: () => {},
          disableActionMap: () => {},
        };

        // Execute via DirectScriptExecutor
        const result = executor.executeScript(
          scriptId,
          {
            entityId: opts.entityId,
            maxExecutionTime: opts.maxExecutionTimeMs,
            parameters,
            timeInfo,
            inputInfo,
          },
          lifecycle,
        );

        const execMs = performance.now() - startTime;

        // Track metrics
        totalExecuteTime += execMs;
        executeCount++;

        if (result.success) {
          return { ok: true, execMs };
        } else {
          return { ok: false, error: result.error, execMs };
        }
      } catch (error) {
        const execMs = performance.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        return { ok: false, error: errorMsg, execMs };
      }
    },

    invalidate(scriptId: string): void {
      scriptCache.delete(scriptId);
      executor.removeCompiledScript(scriptId);
      logger.debug(`Invalidated cache for ${scriptId}`);
    },

    getStats() {
      return {
        compileCacheSize: scriptCache.size,
        paramsCacheSize: parameterCache.size,
        avgCompileMs: compileCount > 0 ? totalCompileTime / compileCount : 0,
        avgExecuteMs: executeCount > 0 ? totalExecuteTime / executeCount : 0,
      };
    },
  };
};
