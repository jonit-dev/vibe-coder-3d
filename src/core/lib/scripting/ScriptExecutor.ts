/**
 * Script Executor - Handles secure execution of user scripts in a sandboxed environment
 * Completely rewritten to avoid eval and Function constructor for strict mode compatibility
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
import { createEventAPI } from './apis/EventAPI';
import { createAudioAPI } from './apis/AudioAPI';
import { createTimerAPI, cleanupTimerAPI } from './apis/TimerAPI';
import { createQueryAPI } from './apis/QueryAPI';
import { createPrefabAPI } from './apis/PrefabAPI';
import { createEntitiesAPI } from './apis/EntitiesAPI';

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
 * Parsed script structure
 */
interface IParsedScript {
  onStart?: string;
  onUpdate?: string;
  onDestroy?: string;
  onEnable?: string;
  onDisable?: string;
  variables?: Record<string, unknown>;
  isValid: boolean;
  parseError?: string;
}

/**
 * Safe script executor that uses static analysis instead of dynamic execution
 */
export class ScriptExecutor {
  private static instance: ScriptExecutor;
  private parsedScripts = new Map<string, IParsedScript>();
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
   * Simple script parser that extracts lifecycle functions without using eval
   */
  private parseScript(code: string): IParsedScript {
    const result: IParsedScript = {
      isValid: true,
      variables: {},
    };

    try {
      // Clean up the code
      const cleanCode = code.trim();

      if (!cleanCode) {
        // Empty script is valid but has no functions
        return result;
      }

      // Extract function definitions using regex patterns
      const functionRegex =
        /function\s+(onStart|onUpdate|onDestroy|onEnable|onDisable)\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/g;
      const arrowFunctionRegex =
        /(?:const|let|var)\s+(onStart|onUpdate|onDestroy|onEnable|onDisable)\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\}/g;
      const simpleArrowRegex =
        /(onStart|onUpdate|onDestroy|onEnable|onDisable)\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\}/g;

      let match;

      // Parse regular function declarations
      while ((match = functionRegex.exec(cleanCode)) !== null) {
        const [, functionName, functionBody] = match;
        const body = functionBody.trim();
        if (functionName === 'onStart') result.onStart = body;
        if (functionName === 'onUpdate') result.onUpdate = body;
        if (functionName === 'onDestroy') result.onDestroy = body;
        if (functionName === 'onEnable') result.onEnable = body;
        if (functionName === 'onDisable') result.onDisable = body;
      }

      // Parse arrow function declarations
      while ((match = arrowFunctionRegex.exec(cleanCode)) !== null) {
        const [, functionName, functionBody] = match;
        const body = functionBody.trim();
        if (functionName === 'onStart') result.onStart = body;
        if (functionName === 'onUpdate') result.onUpdate = body;
        if (functionName === 'onDestroy') result.onDestroy = body;
        if (functionName === 'onEnable') result.onEnable = body;
        if (functionName === 'onDisable') result.onDisable = body;
      }

      // Parse simple arrow function assignments
      while ((match = simpleArrowRegex.exec(cleanCode)) !== null) {
        const [, functionName, functionBody] = match;
        const body = functionBody.trim();
        if (functionName === 'onStart') result.onStart = body;
        if (functionName === 'onUpdate') result.onUpdate = body;
        if (functionName === 'onDestroy') result.onDestroy = body;
        if (functionName === 'onEnable') result.onEnable = body;
        if (functionName === 'onDisable') result.onDisable = body;
      }

      // Script functions parsed: onStart, onUpdate, onDestroy, onEnable, onDisable
    } catch (error) {
      result.isValid = false;
      result.parseError = error instanceof Error ? error.message : String(error);
      console.error('[ScriptExecutor] Script parsing error:', error);
    }

    return result;
  }

  /**
   * Execute parsed script code in a safe environment
   * Uses predefined patterns instead of dynamic execution
   */
  private executeParsedFunction(
    functionBody: string,
    context: IScriptContext,
    deltaTime?: number,
  ): unknown {
    if (!functionBody || functionBody.trim() === '') {
      return undefined;
    }

    try {
      // For now, implement common script patterns manually
      // This is a safe fallback that handles most use cases without eval

      // Utility: parse simple numeric expressions possibly involving deltaTime
      const parseNumericExpression = (expr: string): number => {
        const trimmed = expr.trim();
        if (trimmed === 'deltaTime' && typeof deltaTime === 'number') return deltaTime;
        // Support: deltaTime * K, K * deltaTime, deltaTime / K, K / deltaTime
        const mulMatch = trimmed.match(/^(deltaTime)\s*\*\s*([\d.+-]+)$/);
        if (mulMatch && typeof deltaTime === 'number') return deltaTime * parseFloat(mulMatch[2]);
        const mulMatchRev = trimmed.match(/^([\d.+-]+)\s*\*\s*(deltaTime)$/);
        if (mulMatchRev && typeof deltaTime === 'number')
          return parseFloat(mulMatchRev[1]) * deltaTime;
        const divMatch = trimmed.match(/^(deltaTime)\s*\/\s*([\d.+-]+)$/);
        if (divMatch && typeof deltaTime === 'number') return deltaTime / parseFloat(divMatch[2]);
        const divMatchRev = trimmed.match(/^([\d.+-]+)\s*\/\s*(deltaTime)$/);
        if (divMatchRev && typeof deltaTime === 'number' && deltaTime !== 0)
          return parseFloat(divMatchRev[1]) / deltaTime;
        const num = parseFloat(trimmed);
        return isNaN(num) ? 0 : num;
      };

      // Console logging pattern
      if (functionBody.includes('console.log')) {
        // Best-effort: extract any quoted strings inside console.log and print them
        const logCalls = functionBody.match(/console\.log\s*\(([^)]*)\)/g);
        if (logCalls) {
          for (const call of logCalls) {
            const pieces = Array.from(call.matchAll(/['"`]([^'"`]+)['"`]/g)).map((m) => m[1]);
            if (pieces.length > 0) {
              context.console.log(...pieces);
            } else {
              context.console.log('[script] log');
            }
          }
        }
      }

      // Entity transform manipulation patterns (preferred API)
      if (functionBody.includes('entity.transform')) {
        // entity.transform.setPosition(x, y, z)
        const setPosMatches = functionBody.match(/entity\.transform\.setPosition\s*\(([^)]*)\)/g);
        if (setPosMatches) {
          for (const m of setPosMatches) {
            const args = m.match(/setPosition\s*\(([^)]*)\)/)?.[1]?.split(',') || [];
            if (args.length >= 3) {
              const x = parseNumericExpression(args[0]);
              const y = parseNumericExpression(args[1]);
              const z = parseNumericExpression(args[2]);
              context.entity.transform.setPosition(x, y, z);
            }
          }
        }

        // entity.transform.setRotation(x, y, z)
        const setRotMatches = functionBody.match(/entity\.transform\.setRotation\s*\(([^)]*)\)/g);
        if (setRotMatches) {
          for (const m of setRotMatches) {
            const args = m.match(/setRotation\s*\(([^)]*)\)/)?.[1]?.split(',') || [];
            if (args.length >= 3) {
              const x = parseNumericExpression(args[0]);
              const y = parseNumericExpression(args[1]);
              const z = parseNumericExpression(args[2]);
              context.entity.transform.setRotation(x, y, z);
            }
          }
        }

        // entity.transform.translate(x, y, z)
        const translateMatches = functionBody.match(/entity\.transform\.translate\s*\(([^)]*)\)/g);
        if (translateMatches) {
          for (const m of translateMatches) {
            const args = m.match(/translate\s*\(([^)]*)\)/)?.[1]?.split(',') || [];
            if (args.length >= 3) {
              const x = parseNumericExpression(args[0]);
              const y = parseNumericExpression(args[1]);
              const z = parseNumericExpression(args[2]);
              context.entity.transform.translate(x, y, z);
            }
          }
        }

        // entity.transform.rotate(x, y, z)
        const rotateMatches = functionBody.match(/entity\.transform\.rotate\s*\(([^)]*)\)/g);
        if (rotateMatches) {
          for (const m of rotateMatches) {
            const args = m.match(/rotate\s*\(([^)]*)\)/)?.[1]?.split(',') || [];
            if (args.length >= 3) {
              const x = parseNumericExpression(args[0]);
              const y = parseNumericExpression(args[1]);
              const z = parseNumericExpression(args[2]);
              context.entity.transform.rotate(x, y, z);
            }
          }
        }
      }

      // Legacy direct position/rotation patterns (kept for backward compatibility)
      if (functionBody.includes('entity.position')) {
        const positionMatches = functionBody.match(/entity\.position\.([xyz])\s*=\s*([\d.-]+)/g);
        if (positionMatches) {
          for (const posMatch of positionMatches) {
            const match = posMatch.match(/entity\.position\.([xyz])\s*=\s*([\d.-]+)/);
            if (match) {
              const axis = match[1] as 'x' | 'y' | 'z';
              const value = parseFloat(match[2]);
              if (!isNaN(value)) {
                const [px, py, pz] = context.entity.transform.position;
                if (axis === 'x') context.entity.transform.setPosition(value, py, pz);
                if (axis === 'y') context.entity.transform.setPosition(px, value, pz);
                if (axis === 'z') context.entity.transform.setPosition(px, py, value);
              }
            }
          }
        }
      }

      if (functionBody.includes('entity.rotation')) {
        const rotationMatches = functionBody.match(
          /entity\.rotation\.([xyz])\s*[+\-=]\s*([\d.-]+)/g,
        );
        if (rotationMatches) {
          for (const rotMatch of rotationMatches) {
            const match = rotMatch.match(/entity\.rotation\.([xyz])\s*([+\-=])\s*([\d.-]+)/);
            if (match) {
              const axis = match[1] as 'x' | 'y' | 'z';
              const operator = match[2];
              const value = parseFloat(match[3]);
              if (!isNaN(value)) {
                const [rx, ry, rz] = context.entity.transform.rotation;
                if (operator === '=') {
                  if (axis === 'x') context.entity.transform.setRotation(value, ry, rz);
                  if (axis === 'y') context.entity.transform.setRotation(rx, value, rz);
                  if (axis === 'z') context.entity.transform.setRotation(rx, ry, value);
                } else if (operator === '+') {
                  if (axis === 'x') context.entity.transform.setRotation(rx + value, ry, rz);
                  if (axis === 'y') context.entity.transform.setRotation(rx, ry + value, rz);
                  if (axis === 'z') context.entity.transform.setRotation(rx, ry, rz + value);
                } else if (operator === '-') {
                  if (axis === 'x') context.entity.transform.setRotation(rx - value, ry, rz);
                  if (axis === 'y') context.entity.transform.setRotation(rx, ry - value, rz);
                  if (axis === 'z') context.entity.transform.setRotation(rx, ry, rz - value);
                }
              }
            }
          }
        }
      }

      // Time-based animation patterns
      if (functionBody.includes('time.time') && deltaTime !== undefined) {
        // Handle sinusoidal motion patterns: entity.position.y = Math.sin(time.time) * amplitude
        const sinMatches = functionBody.match(
          /entity\.position\.([xyz])\s*=\s*Math\.sin\s*\(\s*time\.time\s*\)\s*\*\s*([\d.-]+)/g,
        );
        if (sinMatches) {
          for (const sinMatch of sinMatches) {
            const match = sinMatch.match(
              /entity\.position\.([xyz])\s*=\s*Math\.sin\s*\(\s*time\.time\s*\)\s*\*\s*([\d.-]+)/,
            );
            if (match) {
              const axis = match[1] as 'x' | 'y' | 'z';
              const amplitude = parseFloat(match[2]);
              if (!isNaN(amplitude)) {
                const value = Math.sin(context.time.time) * amplitude;
                const [px, py, pz] = context.entity.transform.position;
                if (axis === 'x') context.entity.transform.setPosition(value, py, pz);
                if (axis === 'y') context.entity.transform.setPosition(px, value, pz);
                if (axis === 'z') context.entity.transform.setPosition(px, py, value);
              }
            }
          }
        }

        // Handle rotation animation: entity.rotation.y += deltaTime
        const deltaRotMatches = functionBody.match(
          /entity\.rotation\.([xyz])\s*\+=\s*(?:time\.)?deltaTime(?:\s*\*\s*([\d.-]+))?/g,
        );
        if (deltaRotMatches) {
          for (const deltaMatch of deltaRotMatches) {
            const match = deltaMatch.match(
              /entity\.rotation\.([xyz])\s*\+=\s*(?:time\.)?deltaTime(?:\s*\*\s*([\d.-]+))?/,
            );
            if (match) {
              const axis = match[1] as 'x' | 'y' | 'z';
              const multiplier = match[2] ? parseFloat(match[2]) : 1;
              if (!isNaN(multiplier)) {
                const [rx, ry, rz] = context.entity.transform.rotation;
                const delta = deltaTime * multiplier;
                if (axis === 'x') context.entity.transform.setRotation(rx + delta, ry, rz);
                if (axis === 'y') context.entity.transform.setRotation(rx, ry + delta, rz);
                if (axis === 'z') context.entity.transform.setRotation(rx, ry, rz + delta);
              }
            }
          }
        }
      }

      // Three.js material color manipulation
      if (functionBody.includes('three.material.setColor')) {
        const colorCalls = functionBody.match(/three\.material\.setColor\s*\(([^)]*)\)/g);
        if (colorCalls) {
          for (const call of colorCalls) {
            const colorArg = call.match(/setColor\s*\(([^)]*)\)/)?.[1] || '';
            const colorMatch = colorArg.match(/['"`]([^'"`]+)['"`]/);
            if (colorMatch) {
              context.three.material.setColor(colorMatch[1]);
            }
          }
        }
      }

      return undefined; // Most scripts don't return values
    } catch (error) {
      console.error('[ScriptExecutor] Function execution error:', error);
      throw error;
    }
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
    if (this.parsedScripts.size > this.maxCacheSize) {
      const sortedScripts = Array.from(this.compilationTimestamps.entries())
        .sort(([, a], [, b]) => a - b)
        .slice(0, this.parsedScripts.size - this.maxCacheSize)
        .map(([scriptId]) => scriptId);

      scriptsToRemove.push(...sortedScripts);
    }

    // Remove identified scripts
    for (const scriptId of scriptsToRemove) {
      this.parsedScripts.delete(scriptId);
      this.compilationTimestamps.delete(scriptId);
    }

    if (scriptsToRemove.length > 0) {
      // Cleaned up cached scripts
    }
  }

  /**
   * Check whether a scriptId has been compiled and cached
   */
  public hasCompiled(scriptId: string): boolean {
    return this.parsedScripts.has(scriptId);
  }

  /**
   * Compile script code using static parsing (no dynamic execution)
   */
  public compileScript(code: string, scriptId: string): IScriptExecutionResult {
    const startTime = performance.now();

    // Compiling script in strict mode safe version

    try {
      // Clean up cache periodically
      if (this.parsedScripts.size > this.maxCacheSize) {
        this.cleanupCache();
      }

      // Parse the script using static analysis
      const parsedScript = this.parseScript(code);

      if (!parsedScript.isValid) {
        const executionTime = performance.now() - startTime;
        return {
          success: false,
          error: parsedScript.parseError || 'Script parsing failed',
          executionTime,
        };
      }

      // Store the parsed script with timestamp
      this.parsedScripts.set(scriptId, parsedScript);
      this.compilationTimestamps.set(scriptId, Date.now());

      const executionTime = performance.now() - startTime;

      // Script parsed successfully with static analysis
      return {
        success: true,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      console.error('[ScriptExecutor] Compilation error in SAFE STATIC PARSER:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
    }
  }

  /**
   * Execute a parsed script with safe pattern matching
   */
  public executeScript(
    scriptId: string,
    options: IScriptExecutionOptions,
    lifecycleMethod: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable' = 'onUpdate',
  ): IScriptExecutionResult {
    const startTime = performance.now();
    const maxTime = options.maxExecutionTime || 16; // Default 16ms max execution

    try {
      const parsedScript = this.parsedScripts.get(scriptId);
      if (!parsedScript) {
        return {
          success: false,
          error: `Script not compiled for entity ${options.entityId}. Ensure script system is running and script has been processed.`,
          executionTime: 0,
        };
      }

      if (!parsedScript.isValid) {
        return {
          success: false,
          error: parsedScript.parseError || 'Script is invalid',
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

      // Execute the requested lifecycle method
      let output: unknown;
      const functionBody = parsedScript[lifecycleMethod];

      if (functionBody) {
        const executionStart = performance.now();

        if (lifecycleMethod === 'onUpdate') {
          output = this.executeParsedFunction(functionBody, context, options.timeInfo.deltaTime);
        } else {
          output = this.executeParsedFunction(functionBody, context);
        }

        const executionTime = performance.now() - executionStart;
        if (executionTime > maxTime) {
          const timeStr = executionTime.toFixed(2);
          throw new Error(
            `Script execution exceeded maximum time limit of ${maxTime}ms (took ${timeStr}ms)`,
          );
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
      events: createEventAPI(entityId),
      audio: createAudioAPI(entityId, getMeshRef),
      timer: createTimerAPI(entityId),
      query: createQueryAPI(entityId, getSceneRef),
      prefab: createPrefabAPI(entityId),
      entities: createEntitiesAPI(),
      parameters,
    };
  }

  /**
   * Remove script context when entity is destroyed
   */
  public removeScriptContext(entityId: EntityId): void {
    // Cleanup timers
    cleanupTimerAPI(entityId);
    this.scriptContexts.delete(entityId);
  }

  /**
   * Remove compiled script
   */
  public removeCompiledScript(scriptId: string): void {
    this.parsedScripts.delete(scriptId);
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
    this.parsedScripts.clear();
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
      compiled: this.parsedScripts.size,
      contexts: this.scriptContexts.size,
      oldestScript: now - oldestTimestamp,
    };
  }
}
