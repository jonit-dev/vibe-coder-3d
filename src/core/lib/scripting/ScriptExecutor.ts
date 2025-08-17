/**
 * Script Executor - Handles secure execution of user scripts in a sandboxed environment
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';
import {
  createConsoleAPI,
  createEntityAPI,
  createMathAPI,
  createThreeJSAPI,
  IInputAPI,
  IScriptContext,
  ITimeAPI,
} from './ScriptAPI';
import { threeJSEntityRegistry } from './ThreeJSEntityRegistry';

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
 * Secure script executor that runs user code in a sandboxed environment
 */
export class ScriptExecutor {
  private static instance: ScriptExecutor;
  private compiledScripts = new Map<string, (...args: any[]) => any>();
  private scriptContexts = new Map<EntityId, IScriptContext>();
  private compilationTimestamps = new Map<string, number>();
  private maxCacheSize = 100; // Limit cached scripts
  private maxCacheAge = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ScriptExecutor {
    if (!ScriptExecutor.instance) {
      ScriptExecutor.instance = new ScriptExecutor();
    }
    return ScriptExecutor.instance;
  }

  /**
   * Sanitize user code to prevent dangerous patterns
   */
  private sanitizeCode(code: string): string {
    // Remove potentially dangerous patterns
    let sanitized = code;

    // Remove eval and Function constructor calls
    sanitized = sanitized.replace(/\beval\s*\(/g, '__blocked_eval(');
    sanitized = sanitized.replace(/\bnew\s+Function\s*\(/g, '__blocked_Function(');
    sanitized = sanitized.replace(/\bFunction\s*\(/g, '__blocked_Function(');

    // Remove dangerous global access patterns
    sanitized = sanitized.replace(/\bwindow\s*\[/g, '__blocked_window[');
    sanitized = sanitized.replace(/\bglobalThis\s*\[/g, '__blocked_globalThis[');
    sanitized = sanitized.replace(/\bself\s*\[/g, '__blocked_self[');

    // Remove prototype pollution attempts
    sanitized = sanitized.replace(/\b__proto__\s*=/g, '__blocked_proto =');
    sanitized = sanitized.replace(
      /\bconstructor\s*\.\s*prototype\s*=/g,
      '__blocked_constructor.prototype =',
    );

    // Inject instruction counting into loops
    sanitized = this.injectInstructionCounting(sanitized);

    return sanitized;
  }

  /**
   * Inject instruction counting into loops to prevent infinite loops
   */
  private injectInstructionCounting(code: string): string {
    // Add instruction counting to for loops
    code = code.replace(
      /for\s*\(\s*([^;]*;[^;]*;[^)]*)\s*\)\s*\{/g,
      'for ($1) { __checkInstructions();',
    );

    // Add instruction counting to while loops
    code = code.replace(/while\s*\([^)]*\)\s*\{/g, '$& __checkInstructions();');

    // Add instruction counting to do-while loops
    code = code.replace(/do\s*\{/g, '$& __checkInstructions();');

    return code;
  }

  /**
   * Clean up old cached scripts to prevent memory leaks
   */
  private cleanupCache(): void {
    const now = Date.now();
    const scriptsToRemove: string[] = [];

    // Remove scripts older than maxCacheAge
    for (const [scriptId, timestamp] of Array.from(this.compilationTimestamps.entries())) {
      if (now - timestamp > this.maxCacheAge) {
        scriptsToRemove.push(scriptId);
      }
    }

    // If still over capacity, remove oldest scripts
    if (this.compiledScripts.size > this.maxCacheSize) {
      const sortedScripts = Array.from(this.compilationTimestamps.entries())
        .sort(([, a], [, b]) => a - b)
        .slice(0, this.compiledScripts.size - this.maxCacheSize)
        .map(([scriptId]) => scriptId);

      scriptsToRemove.push(...sortedScripts);
    }

    // Remove identified scripts
    for (const scriptId of scriptsToRemove) {
      this.compiledScripts.delete(scriptId);
      this.compilationTimestamps.delete(scriptId);
    }

    if (scriptsToRemove.length > 0) {
      console.log(`[ScriptExecutor] Cleaned up ${scriptsToRemove.length} cached scripts`);
    }
  }

  /**
   * Check whether a scriptId has been compiled and cached
   */
  public hasCompiled(scriptId: string): boolean {
    return this.compiledScripts.has(scriptId);
  }

  /**
   * Compile script code into a function for later execution
   */
  public compileScript(code: string, scriptId: string): IScriptExecutionResult {
    const startTime = performance.now();

    try {
      // Clean up cache periodically
      if (this.compiledScripts.size > this.maxCacheSize) {
        this.cleanupCache();
      }

      // Sanitize and secure the user code
      const sanitizedCode = this.sanitizeCode(code);

      // Wrap user code in a secure function that accepts the context
      const wrappedCode = `
        return (function(context) {
          "use strict";
          
          // Security: Remove access to dangerous globals
          const window = undefined;
          const document = undefined;
          const eval = undefined;
          const Function = undefined;
          const setTimeout = undefined;
          const setInterval = undefined;
          const XMLHttpRequest = undefined;
          const fetch = undefined;
          const WebSocket = undefined;
          const Worker = undefined;
          const SharedWorker = undefined;
          const ServiceWorker = undefined;
          const importScripts = undefined;
          const navigator = undefined;
          const location = undefined;
          const history = undefined;
          const localStorage = undefined;
          const sessionStorage = undefined;
          const indexedDB = undefined;
          const crypto = undefined;
          const performance = undefined;
          
          // Prevent prototype pollution
          Object.freeze(Object.prototype);
          Object.freeze(Array.prototype);
          Object.freeze(Function.prototype);
          
          // Extract context variables for easier access
          const { entity, time, input, math, console, parameters, three } = context;
          
          // Instruction counter for infinite loop protection
          let __instructionCount = 0;
          const __maxInstructions = 100000; // Limit to prevent infinite loops
          
          function __checkInstructions() {
            __instructionCount++;
            if (__instructionCount > __maxInstructions) {
              throw new Error('Script execution exceeded maximum instruction limit (possible infinite loop)');
            }
          }
          
          // User's code goes here - they can define onStart, onUpdate, etc. functions
          ${sanitizedCode}
          
          // Return the lifecycle functions for the system to call
          return {
            onStart: typeof onStart !== 'undefined' ? onStart : undefined,
            onUpdate: typeof onUpdate !== 'undefined' ? onUpdate : undefined,
            onDestroy: typeof onDestroy !== 'undefined' ? onDestroy : undefined,
            onEnable: typeof onEnable !== 'undefined' ? onEnable : undefined,
            onDisable: typeof onDisable !== 'undefined' ? onDisable : undefined,
          };
        });
      `;

      // Create the compiled function in a secure way
      const compiledFunction = new Function(wrappedCode)();

      // Store the compiled function with timestamp
      this.compiledScripts.set(scriptId, compiledFunction);
      this.compilationTimestamps.set(scriptId, Date.now());

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Execute a compiled script with improved timeout protection
   */
  public executeScript(
    scriptId: string,
    options: IScriptExecutionOptions,
    lifecycleMethod: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable' = 'onUpdate',
  ): IScriptExecutionResult {
    const startTime = performance.now();
    const maxTime = options.maxExecutionTime || 16; // Default 16ms max execution

    try {
      const compiledScript = this.compiledScripts.get(scriptId);
      if (!compiledScript) {
        return {
          success: false,
          error: `Script not compiled for entity ${options.entityId}. Ensure script system is running and script has been processed.`,
          executionTime: 0,
        };
      }

      // Create or get the script context for this entity
      let context = this.scriptContexts.get(options.entityId);
      if (!context) {
        context = this.createScriptContext(
          options.entityId,
          options.parameters || {},
          options.timeInfo,
          options.inputInfo,
          options.meshRef,
          options.sceneRef,
        );
        this.scriptContexts.set(options.entityId, context);
      }

      // Update dynamic context properties
      context.time = options.timeInfo;
      context.parameters = options.parameters || {};

      // Execute the script to get lifecycle functions (only if not cached)
      if (!context.onStart && !context.onUpdate && !context.onDestroy) {
        const lifecycleFunctions = compiledScript(context);

        // Store lifecycle functions in context
        if (lifecycleFunctions.onStart) context.onStart = lifecycleFunctions.onStart;
        if (lifecycleFunctions.onUpdate) context.onUpdate = lifecycleFunctions.onUpdate;
        if (lifecycleFunctions.onDestroy) context.onDestroy = lifecycleFunctions.onDestroy;
        if (lifecycleFunctions.onEnable) context.onEnable = lifecycleFunctions.onEnable;
        if (lifecycleFunctions.onDisable) context.onDisable = lifecycleFunctions.onDisable;
      }

      // Execute the requested lifecycle method with timeout protection
      let output: unknown;
      const method = context[lifecycleMethod];

      if (method && typeof method === 'function') {
        const executionStart = performance.now();

        try {
          if (lifecycleMethod === 'onUpdate') {
            output = (method as (deltaTime: number) => any)(options.timeInfo.deltaTime);
          } else {
            output = (method as () => any)();
          }

          const executionTime = performance.now() - executionStart;
          if (executionTime > maxTime) {
            throw new Error(
              `Script execution exceeded maximum time limit of ${maxTime}ms (took ${executionTime.toFixed(2)}ms)`,
            );
          }
        } catch (error) {
          throw error;
        }
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        executionTime,
        output,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Create a secure script context for an entity
   */
  private createScriptContext(
    entityId: EntityId,
    parameters: Record<string, unknown>,
    timeInfo: ITimeAPI,
    inputInfo: IInputAPI,
    meshRef?: () => THREE.Object3D | null,
    sceneRef?: () => THREE.Scene | null,
  ): IScriptContext {
    // Use ThreeJSEntityRegistry for mesh and scene access, fallback to provided refs
    const getMeshRef = () => {
      const registeredObject = threeJSEntityRegistry.getEntityObject3D(entityId);
      if (registeredObject) return registeredObject;
      return meshRef ? meshRef() : null;
    };

    const getSceneRef = () => {
      const registeredScene = threeJSEntityRegistry.getEntityScene(entityId);
      if (registeredScene) return registeredScene;
      return sceneRef ? sceneRef() : null;
    };

    return {
      entity: createEntityAPI(entityId),
      time: timeInfo,
      input: inputInfo,
      math: createMathAPI(),
      console: createConsoleAPI(entityId),
      three: createThreeJSAPI(entityId, getMeshRef, getSceneRef),
      parameters,
    };
  }

  /**
   * Remove script context when entity is destroyed
   */
  public removeScriptContext(entityId: EntityId): void {
    const context = this.scriptContexts.get(entityId);
    if (context && context.onDestroy) {
      try {
        context.onDestroy();
      } catch (error) {
        console.error(`Error in script onDestroy for entity ${entityId}:`, error);
      }
    }
    this.scriptContexts.delete(entityId);
  }

  /**
   * Remove compiled script
   */
  public removeCompiledScript(scriptId: string): void {
    this.compiledScripts.delete(scriptId);
    this.compilationTimestamps.delete(scriptId);
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
    this.compiledScripts.clear();
    this.scriptContexts.clear();
    this.compilationTimestamps.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): { compiled: number; contexts: number; oldestScript: number } {
    const now = Date.now();
    let oldestTimestamp = now;

    for (const timestamp of Array.from(this.compilationTimestamps.values())) {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    }

    return {
      compiled: this.compiledScripts.size,
      contexts: this.scriptContexts.size,
      oldestScript: now - oldestTimestamp,
    };
  }
}
