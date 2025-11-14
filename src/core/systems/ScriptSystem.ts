/**
 * Script System - Executes user scripts in the game loop
 * Handles script compilation, execution, and lifecycle management
 */

import { defineQuery, enterQuery, exitQuery } from 'bitecs';

import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { ECSWorld } from '../lib/ecs/World';
import { EntityId } from '../lib/ecs/types';
import { getStringFromHash, storeString } from '../lib/ecs/utils/stringHashUtils';
import { Logger } from '../lib/logger';
import { ITimeAPI } from '../lib/scripting/ScriptAPI';
import {
  IScriptExecutionResult,
  DirectScriptExecutor,
} from '../lib/scripting/DirectScriptExecutor';
import { resolveScript } from '../lib/scripting/ScriptResolver';
import { scheduler } from '../lib/scripting/adapters/scheduler';
import { createInputAPI } from '../lib/scripting/apis/InputAPI';
import { createComponentWriteSystem } from './ComponentWriteSystem';

// BitECS Script component type structure
interface IBitECSScriptComponent {
  enabled: Record<number, number>;
  language: Record<number, number>;
  executeInUpdate: Record<number, number>;
  executeOnStart: Record<number, number>;
  executeOnEnable: Record<number, number>;
  maxExecutionTime: Record<number, number>;
  hasErrors: Record<number, number>;
  lastExecutionTime: Record<number, number>;
  executionCount: Record<number, number>;
  codeHash: Record<number, number>;
  scriptNameHash: Record<number, number>;
  descriptionHash: Record<number, number>;
  lastErrorMessageHash: Record<number, number>;
  parametersHash: Record<number, number>;
  compiledCodeHash: Record<number, number>;
  scriptRefHash: Record<number, number>;
  lastModified: Record<number, number>;
  needsCompilation: Record<number, number>;
  needsExecution: Record<number, number>;
}

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Create logger for this system
const logger = Logger.create('ScriptSystem');

// Lazy-initialize the query to avoid module-load timing issues
let scriptQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getScriptQuery() {
  if (!scriptQuery) {
    const scriptComponent = componentRegistry.getBitECSComponent(
      'Script',
    ) as IBitECSScriptComponent | null;
    if (!scriptComponent) {
      logger.warn('Script component not yet registered, skipping update');
      return null;
    }
    scriptQuery = defineQuery([scriptComponent]);
  }
  return scriptQuery;
}

// Get script executor instance - using DirectScriptExecutor for full JS support
const scriptExecutor = DirectScriptExecutor.getInstance();

// Create component write system for flushing batched mutations
const componentWriteSystem = createComponentWriteSystem(scriptExecutor.getMutationBuffer());

// Track entities that need script compilation
const entitiesToCompile = new Set<EntityId>();

// Track entities that have been started
const startedEntities = new Set<EntityId>();

// Performance tracking
let totalScriptExecutionTime = 0;
let scriptExecutionCount = 0;

/**
 * Mock input system - replace with actual input system integration
 */
// Input API is now created from real InputManager via createInputAPI()
// Previously was a mock implementation

/**
 * Get current time information
 */
function getTimeInfo(deltaTime: number): ITimeAPI {
  return {
    time: performance.now() / 1000, // Convert to seconds
    deltaTime: deltaTime / 1000, // Convert to seconds
    frameCount: 0, // Would need frame counter from engine
  };
}

/**
 * Check if an entity's script needs compilation
 */
function entityNeedsCompilation(eid: EntityId): boolean {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return false;

  const codeHash = scriptComponent.codeHash[eid];
  const code = getStringFromHash(codeHash);
  const scriptId = `entity_${eid}`;

  // If script has execution flags enabled, it needs to be compiled even if empty
  const hasExecutionFlags =
    scriptComponent.executeOnStart[eid] ||
    scriptComponent.executeInUpdate[eid] ||
    scriptComponent.executeOnEnable[eid];

  const isEmpty = !code || code.trim() === '';
  const isCompiled = scriptExecutor.hasCompiled(scriptId);
  const needsCompilationFlag = scriptComponent.needsCompilation[eid] === 1;

  // Empty scripts with no execution flags don't need compilation
  if (isEmpty && !hasExecutionFlags) {
    return false;
  }

  // Check if script is already compiled and up to date
  const needsCompilation = !isCompiled || needsCompilationFlag;
  return needsCompilation;
}

/**
 * Ensure script is compiled before execution
 */
async function ensureScriptCompiled(eid: EntityId): Promise<boolean> {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return false;

  // Check if compilation is needed
  if (!entityNeedsCompilation(eid)) {
    return true; // Already compiled or empty script
  }

  // Compile the script
  return await compileScriptForEntity(eid);
}

/**
 * Compile a script for an entity
 */
async function compileScriptForEntity(eid: EntityId): Promise<boolean> {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return false;

  const scriptId = `entity_${eid}`;

  try {
    // Get script data for resolution
    const codeHash = scriptComponent.codeHash[eid];
    const code = getStringFromHash(codeHash);

    const scriptRefHash = scriptComponent.scriptRefHash[eid];
    const scriptRefStr = getStringFromHash(scriptRefHash);
    const scriptRef = scriptRefStr ? JSON.parse(scriptRefStr) : undefined;

    // Resolve script code (from external or inline)
    const resolution = await resolveScript(eid, { code, scriptRef });

    const resolvedCode = resolution.code;

    // In dev mode with external scripts, check if the resolved hash differs from component hash
    // If so, we've detected a file change and need to force recompilation
    if (import.meta.env.DEV && resolution.origin === 'external' && resolution.hash) {
      const currentHash = scriptRefStr ? JSON.parse(scriptRefStr).codeHash : null;
      if (currentHash && resolution.hash !== currentHash) {
        logger.info(
          `Detected external script change for entity ${eid}: hash mismatch (${currentHash.slice(0, 8)}... -> ${resolution.hash.slice(0, 8)}...)`,
        );
        // Force recompilation by removing cached script
        scriptExecutor.removeCompiledScript(scriptId);
      }
    }

    if (!resolvedCode || resolvedCode.trim() === '') {
      // For empty scripts, register a no-op function so execution doesn't fail
      logger.debug(`Compiling empty script for entity ${eid} as no-op`);
      const result: IScriptExecutionResult = scriptExecutor.compileScript(
        '// Empty script',
        scriptId,
      );

      // Update component with compilation results
      scriptComponent.hasErrors[eid] = result.success ? 0 : 1;
      scriptComponent.lastExecutionTime[eid] = result.executionTime;
      scriptComponent.needsCompilation[eid] = 0;

      if (result.success) {
        scriptComponent.lastErrorMessageHash[eid] = 0; // Clear error
        logger.debug(`Successfully compiled empty script for entity ${eid}`);
        return true;
      } else {
        const errorHash = storeString(result.error || 'Unknown compilation error');
        scriptComponent.lastErrorMessageHash[eid] = errorHash;
        logger.error(`Failed to compile empty script for entity ${eid}:`, result.error);
        return false;
      }
    }

    const result: IScriptExecutionResult = scriptExecutor.compileScript(resolvedCode, scriptId);

    // Update component with compilation results
    scriptComponent.hasErrors[eid] = result.success ? 0 : 1;
    scriptComponent.lastExecutionTime[eid] = result.executionTime;
    scriptComponent.needsCompilation[eid] = 0;

    if (result.error) {
      const errorHash = storeString(result.error);
      scriptComponent.lastErrorMessageHash[eid] = errorHash;
      logger.error(`Compilation error for entity ${eid}:`, result.error);
      return false;
    } else {
      scriptComponent.lastErrorMessageHash[eid] = 0; // Clear error
      logger.debug(`Successfully compiled script for entity ${eid}`);
      return true;
    }
  } catch (error) {
    // Handle resolution errors
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorHash = storeString(errorMsg);
    scriptComponent.hasErrors[eid] = 1;
    scriptComponent.lastErrorMessageHash[eid] = errorHash;
    scriptComponent.needsCompilation[eid] = 0;
    logger.error(`Script resolution/compilation failed for entity ${eid}:`, error);
    return false;
  }
}

/**
 * Execute script lifecycle method for an entity
 */
async function executeScriptLifecycle(
  eid: EntityId,
  method: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable',
  deltaTime?: number,
): Promise<void> {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  // Skip if disabled
  if (!scriptComponent.enabled[eid]) return;

  // Ensure script is compiled before execution
  if (!(await ensureScriptCompiled(eid))) {
    logger.error(`Entity ${eid}: Script compilation failed, skipping ${method}`);
    return; // Compilation failed
  }

  // Skip if script has errors after compilation attempt
  if (scriptComponent.hasErrors[eid]) {
    logger.error(`Entity ${eid}: Script has errors, skipping ${method}`);
    return;
  }

  const scriptId = `entity_${eid}`;
  const maxExecutionTime = scriptComponent.maxExecutionTime[eid];

  // Get script parameters
  const parametersHash = scriptComponent.parametersHash[eid];
  let parameters: Record<string, unknown> = {};

  try {
    const parametersStr = getStringFromHash(parametersHash);
    if (parametersStr) {
      parameters = JSON.parse(parametersStr);
    }
  } catch (error) {
    logger.warn(`Failed to parse parameters for entity ${eid}:`, error);
  }

  const result: IScriptExecutionResult = scriptExecutor.executeScript(
    scriptId,
    {
      entityId: eid,
      maxExecutionTime,
      parameters,
      timeInfo: getTimeInfo(deltaTime || 0),
      inputInfo: createInputAPI(),
    },
    method,
  );

  if (!result.success && result.error) {
    logger.error(`Entity ${eid}: ${method} execution failed:`, result.error);
  }

  // Update performance stats
  totalScriptExecutionTime += result.executionTime;
  scriptExecutionCount++;

  // Update component with execution results
  scriptComponent.lastExecutionTime[eid] = result.executionTime;
  scriptComponent.executionCount[eid] = (scriptComponent.executionCount[eid] || 0) + 1;

  if (!result.success) {
    scriptComponent.hasErrors[eid] = 1;
    if (result.error) {
      const errorHash = storeString(result.error);
      scriptComponent.lastErrorMessageHash[eid] = errorHash;
      logger.error(`Execution error for entity ${eid} (${method}):`, result.error);
    }
  } else {
    // Clear any previous errors if execution was successful
    if (scriptComponent.hasErrors[eid]) {
      scriptComponent.hasErrors[eid] = 0;
      scriptComponent.lastErrorMessageHash[eid] = 0;
    }
  }
}

/**
 * Handle new entities with Script components
 */
async function handleNewScriptEntities(): Promise<void> {
  const query = getScriptQuery();
  if (!query) return;

  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  // Handle entities that entered the query (newly added Script components)
  const enteredEntities = enterQuery(query)(world);
  if (enteredEntities && enteredEntities.length > 0) {
    for (const eid of enteredEntities) {
      logger.debug(`Script component added to entity ${eid}`);

      // Mark for compilation if script has code and needs compilation
      if (entityNeedsCompilation(eid)) {
        entitiesToCompile.add(eid);
      }

      // Execute onEnable if component is enabled
      if (scriptComponent.enabled[eid] && scriptComponent.executeOnEnable[eid]) {
        await executeScriptLifecycle(eid, 'onEnable');
      }
    }
  }

  // Handle entities that exited the query (removed Script components)
  const exitedEntities = exitQuery(query)(world);
  if (exitedEntities && exitedEntities.length > 0) {
    for (const eid of exitedEntities) {
      logger.debug(`Script component removed from entity ${eid}`);

      // Execute onDestroy before cleanup
      await executeScriptLifecycle(eid, 'onDestroy');

      // Clean up
      scriptExecutor.removeScriptContext(eid);
      scriptExecutor.removeCompiledScript(`entity_${eid}`);
      entitiesToCompile.delete(eid);
      startedEntities.delete(eid);
    }
  }
}

/**
 * Compile scripts that need compilation
 */
async function compileScripts(): Promise<void> {
  // Compile scripts in batches to avoid frame drops
  const maxCompilationsPerFrame = 2;
  let compilations = 0;

  for (const eid of entitiesToCompile) {
    if (compilations >= maxCompilationsPerFrame) break;

    if (await compileScriptForEntity(eid)) {
      entitiesToCompile.delete(eid);
      compilations++;
    } else {
      // Keep in queue but don't increment compilation count
      // This allows retrying failed compilations next frame
    }
  }
}

/**
 * Mark all uncompiled scripts for compilation (used when starting play mode)
 */
function ensureAllScriptsCompiled(): void {
  const query = getScriptQuery();
  if (!query) return;

  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  const entities = query(world);

  for (const eid of entities) {
    // Skip disabled scripts
    if (!scriptComponent.enabled[eid]) continue;

    // Ensure onStart will run when entering play mode
    if (!scriptComponent.executeOnStart[eid]) {
      scriptComponent.executeOnStart[eid] = 1;
    }

    // Check if script needs compilation
    if (entityNeedsCompilation(eid)) {
      entitiesToCompile.add(eid);
    }
  }
}

/**
 * Execute scripts in update loop
 */
async function executeScripts(deltaTime: number): Promise<void> {
  const query = getScriptQuery();
  if (!query) return;

  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  // Reset performance counters periodically
  if (scriptExecutionCount > 1000) {
    totalScriptExecutionTime = 0;
    scriptExecutionCount = 0;
  }

  // Process all entities with Script components
  const entities = query(world);

  for (const eid of entities) {
    // Skip disabled scripts
    if (!scriptComponent.enabled[eid]) {
      logger.debug(`Entity ${eid}: Script disabled, skipping`);
      continue;
    }

    // Skip scripts with compilation errors
    if (scriptComponent.hasErrors[eid]) {
      logger.warn(`Entity ${eid}: Script has errors, skipping execution`);
      continue;
    }

    // Execute onStart if not yet started and configured to do so
    if (!startedEntities.has(eid) && scriptComponent.executeOnStart[eid]) {
      logger.info(`Entity ${eid}: Executing onStart()`);
      await executeScriptLifecycle(eid, 'onStart');
      startedEntities.add(eid);
    }

    // Execute onUpdate if configured to do so
    if (scriptComponent.executeInUpdate[eid]) {
      await executeScriptLifecycle(eid, 'onUpdate', deltaTime);
    }
  }
}

/**
 * Main script system update function
 * Should be called from the main game loop
 */
export async function updateScriptSystem(
  deltaTime: number,
  isPlaying: boolean = false,
): Promise<void> {
  // Update timer scheduler
  scheduler.update();

  // Handle new/removed script entities (runs in both edit and play mode)
  await handleNewScriptEntities();

  // Compile scripts that need compilation (runs in both edit and play mode)
  // This allows errors to surface in edit mode even when not playing
  await compileScripts();

  // Only execute scripts when in play mode
  if (isPlaying) {
    // Detect rising edge (entering play mode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastIsPlaying = (updateScriptSystem as any)._lastIsPlaying as boolean | undefined;

    if (!lastIsPlaying) {
      // Clear started entities so onStart runs fresh when entering play
      startedEntities.clear();
      // Ensure all enabled scripts are compiled before play begins
      ensureAllScriptsCompiled();
    }

    // Execute scripts (onStart/onUpdate only run during play)
    await executeScripts(deltaTime);
  }

  // Flush all batched component mutations to ECS
  // This applies all entity.meshRenderer.material.setColor(...) style updates
  componentWriteSystem();

  // Track last isPlaying state to detect edges next frame
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (updateScriptSystem as any)._lastIsPlaying = isPlaying;
}

/**
 * Get performance statistics
 */
export function getScriptSystemStats(): {
  totalExecutionTime: number;
  executionCount: number;
  averageExecutionTime: number;
  pendingCompilations: number;
  compileStats: {
    totalCompileTime: number;
    compileCount: number;
    avgCompileTime: number;
  };
  executeStats: {
    totalExecuteTime: number;
    executeCount: number;
    avgExecuteTime: number;
  };
} {
  const perfStats = scriptExecutor.getPerformanceStats();

  return {
    totalExecutionTime: totalScriptExecutionTime,
    executionCount: scriptExecutionCount,
    averageExecutionTime:
      scriptExecutionCount > 0 ? totalScriptExecutionTime / scriptExecutionCount : 0,
    pendingCompilations: entitiesToCompile.size,
    compileStats: {
      totalCompileTime: perfStats.totalCompileTime,
      compileCount: perfStats.compileCount,
      avgCompileTime: perfStats.avgCompileTime,
    },
    executeStats: {
      totalExecuteTime: perfStats.totalExecuteTime,
      executeCount: perfStats.executeCount,
      avgExecuteTime: perfStats.avgExecuteTime,
    },
  };
}

/**
 * Force recompilation of all scripts (useful for development/hot reload)
 */
export function recompileAllScripts(): void {
  const query = getScriptQuery();
  if (!query) return;

  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  const entities = query(world);

  for (const eid of entities) {
    scriptComponent.needsCompilation[eid] = 1;
    entitiesToCompile.add(eid);
    startedEntities.delete(eid); // Reset start state
  }

  // Clear all cached scripts
  scriptExecutor.clearAll();

  logger.info('Marked all scripts for recompilation');
}

/**
 * Enable/disable a script for a specific entity
 */
export async function setScriptEnabled(eid: EntityId, enabled: boolean): Promise<void> {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  const wasEnabled = Boolean(scriptComponent.enabled[eid]);
  scriptComponent.enabled[eid] = enabled ? 1 : 0;

  // Call lifecycle methods based on state change
  if (!wasEnabled && enabled) {
    await executeScriptLifecycle(eid, 'onEnable');
  } else if (wasEnabled && !enabled) {
    await executeScriptLifecycle(eid, 'onDisable');
  }
}
