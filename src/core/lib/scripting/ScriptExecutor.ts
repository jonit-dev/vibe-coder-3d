/**
 * Script Executor - Handles secure execution of user scripts in a sandboxed environment
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';
import { threeJSEntityRegistry } from './ThreeJSEntityRegistry';
import {
  IScriptContext,
  createMathAPI,
  createConsoleAPI,
  createEntityAPI,
  createThreeJSAPI,
  ITimeAPI,
  IInputAPI,
} from './ScriptAPI';

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

  public static getInstance(): ScriptExecutor {
    if (!ScriptExecutor.instance) {
      ScriptExecutor.instance = new ScriptExecutor();
    }
    return ScriptExecutor.instance;
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
      // Wrap user code in a function that accepts the context
      const wrappedCode = `
        return (function(context) {
          "use strict";
          
          // Extract context variables for easier access
          const { entity, time, input, math, console, parameters } = context;
          
          // User can define these lifecycle functions
          let onStart, onUpdate, onDestroy, onEnable, onDisable;
          
          // User's code goes here
          ${code}
          
          // Return the lifecycle functions for the system to call
          return {
            onStart: typeof onStart === 'function' ? onStart : undefined,
            onUpdate: typeof onUpdate === 'function' ? onUpdate : undefined,
            onDestroy: typeof onDestroy === 'function' ? onDestroy : undefined,
            onEnable: typeof onEnable === 'function' ? onEnable : undefined,
            onDisable: typeof onDisable === 'function' ? onDisable : undefined,
          };
        });
      `;

      // Create the compiled function in a secure way
      const compiledFunction = new Function(wrappedCode)();

      // Store the compiled function
      this.compiledScripts.set(scriptId, compiledFunction);

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
   * Execute a compiled script
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

      // Execute the requested lifecycle method
      let output: unknown;
      const method = context[lifecycleMethod];

      if (method && typeof method === 'function') {
        // Set up timeout for script execution
        const timeout = setTimeout(() => {
          throw new Error(`Script execution exceeded maximum time limit of ${maxTime}ms`);
        }, maxTime);

        try {
          if (lifecycleMethod === 'onUpdate' && context.onUpdate) {
            output = context.onUpdate(options.timeInfo.deltaTime);
          } else {
            output = method();
          }
        } finally {
          clearTimeout(timeout);
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
   * Create a mock input API (would need actual input system integration)
   */
  private createInputAPI(): IInputAPI {
    return {
      isKeyPressed: () => false, // Mock implementation
      isKeyDown: () => false,
      isKeyUp: () => false,
      mousePosition: () => [0, 0],
      isMouseButtonPressed: () => false,
      isMouseButtonDown: () => false,
      isMouseButtonUp: () => false,
      getGamepadAxis: () => 0,
      isGamepadButtonPressed: () => false,
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
  }
}
