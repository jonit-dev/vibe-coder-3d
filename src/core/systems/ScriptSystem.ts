/**
 * Script System - Executes user scripts in the game loop
 * Handles script compilation, execution, and lifecycle management
 */

import { defineQuery, enterQuery, exitQuery } from 'bitecs';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';
import { EntityId } from '@core/lib/ecs/types';
import { getStringFromHash, storeString } from '@core/lib/ecs/utils/stringHashUtils';
import { ScriptExecutor, IScriptExecutionResult } from '@core/lib/scripting/ScriptExecutor';
import { ITimeAPI, IInputAPI } from '@core/lib/scripting/ScriptAPI';

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
  lastModified: Record<number, number>;
  needsCompilation: Record<number, number>;
  needsExecution: Record<number, number>;
}

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let scriptQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getScriptQuery() {
  if (!scriptQuery) {
    const scriptComponent = componentRegistry.getBitECSComponent(
      'Script',
    ) as IBitECSScriptComponent | null;
    if (!scriptComponent) {
      console.warn('[ScriptSystem] Script component not yet registered, skipping update');
      return null;
    }
    scriptQuery = defineQuery([scriptComponent]);
  }
  return scriptQuery;
}

// Get script executor instance
const scriptExecutor = ScriptExecutor.getInstance();

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
function createMockInputAPI(): IInputAPI {
  return {
    isKeyPressed: (_key: string) => false,
    isKeyDown: (_key: string) => false,
    isKeyUp: (_key: string) => false,
    mousePosition: () => [0, 0],
    isMouseButtonPressed: (_button: number) => false,
    isMouseButtonDown: (_button: number) => false,
    isMouseButtonUp: (_button: number) => false,
    getGamepadAxis: (_gamepadIndex: number, _axisIndex: number) => 0,
    isGamepadButtonPressed: (_gamepadIndex: number, _buttonIndex: number) => false,
  };
}

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

  console.log(`[ScriptSystem] Checking compilation need for entity ${eid}:`, {
    codeHash,
    codeLength: code?.length || 0,
    isEmpty,
    hasExecutionFlags,
    isCompiled,
    needsCompilationFlag,
    executeOnStart: scriptComponent.executeOnStart[eid],
    executeInUpdate: scriptComponent.executeInUpdate[eid],
    executeOnEnable: scriptComponent.executeOnEnable[eid],
  });

  // Empty scripts with no execution flags don't need compilation
  if (isEmpty && !hasExecutionFlags) {
    console.log(
      `[ScriptSystem] Entity ${eid}: Empty script with no execution flags, skipping compilation`,
    );
    return false;
  }

  // Check if script is already compiled and up to date
  const needsCompilation = !isCompiled || needsCompilationFlag;
  console.log(`[ScriptSystem] Entity ${eid}: Needs compilation = ${needsCompilation}`);
  return needsCompilation;
}

/**
 * Ensure script is compiled before execution
 */
function ensureScriptCompiled(eid: EntityId): boolean {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return false;

  // Check if compilation is needed
  if (!entityNeedsCompilation(eid)) {
    return true; // Already compiled or empty script
  }

  // Compile the script
  return compileScriptForEntity(eid);
}

/**
 * Compile a script for an entity
 */
function compileScriptForEntity(eid: EntityId): boolean {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return false;

  const codeHash = scriptComponent.codeHash[eid];
  const code = getStringFromHash(codeHash);
  const scriptId = `entity_${eid}`;

  console.log(`[ScriptSystem] Compiling script for entity ${eid}:`, {
    codeHash,
    codeLength: code?.length || 0,
    codePreview: code?.substring(0, 100) || '(empty)',
    executeOnStart: scriptComponent.executeOnStart[eid],
    executeInUpdate: scriptComponent.executeInUpdate[eid],
    needsCompilation: scriptComponent.needsCompilation[eid],
  });

  if (!code || code.trim() === '') {
    // For empty scripts, register a no-op function so execution doesn't fail
    console.log(`[ScriptSystem] Compiling empty script for entity ${eid} as no-op`);
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
      console.log(`[ScriptSystem] Successfully compiled empty script for entity ${eid}`);
      return true;
    } else {
      const errorHash = storeString(result.error || 'Unknown compilation error');
      scriptComponent.lastErrorMessageHash[eid] = errorHash;
      console.error(
        `[ScriptSystem] Failed to compile empty script for entity ${eid}:`,
        result.error,
      );
      return false;
    }
  }

  console.log(`[ScriptSystem] Compiling script with content for entity ${eid}`);
  const result: IScriptExecutionResult = scriptExecutor.compileScript(code, scriptId);

  // Update component with compilation results
  scriptComponent.hasErrors[eid] = result.success ? 0 : 1;
  scriptComponent.lastExecutionTime[eid] = result.executionTime;
  scriptComponent.needsCompilation[eid] = 0;

  if (result.error) {
    const errorHash = storeString(result.error);
    scriptComponent.lastErrorMessageHash[eid] = errorHash;
    console.error(`[ScriptSystem] Compilation error for entity ${eid}:`, result.error);
    return false;
  } else {
    scriptComponent.lastErrorMessageHash[eid] = 0; // Clear error
    console.log(`[ScriptSystem] Successfully compiled script for entity ${eid}`);
    return true;
  }
}

/**
 * Execute script lifecycle method for an entity
 */
function executeScriptLifecycle(
  eid: EntityId,
  method: 'onStart' | 'onUpdate' | 'onDestroy' | 'onEnable' | 'onDisable',
  deltaTime?: number,
): void {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  // Skip if disabled
  if (!scriptComponent.enabled[eid]) return;

  // Ensure script is compiled before execution
  if (!ensureScriptCompiled(eid)) {
    return; // Compilation failed
  }

  // Skip if script has errors after compilation attempt
  if (scriptComponent.hasErrors[eid]) return;

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
    console.warn(`[ScriptSystem] Failed to parse parameters for entity ${eid}:`, error);
  }

  const result: IScriptExecutionResult = scriptExecutor.executeScript(
    scriptId,
    {
      entityId: eid,
      maxExecutionTime,
      parameters,
      timeInfo: getTimeInfo(deltaTime || 0),
      inputInfo: createMockInputAPI(),
    },
    method,
  );

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
      console.error(`[ScriptSystem] Execution error for entity ${eid} (${method}):`, result.error);
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
function handleNewScriptEntities(): void {
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
      console.log(`[ScriptSystem] Script component added to entity ${eid}`);

      // Mark for compilation if script has code and needs compilation
      if (entityNeedsCompilation(eid)) {
        entitiesToCompile.add(eid);
      }

      // Execute onEnable if component is enabled
      if (scriptComponent.enabled[eid] && scriptComponent.executeOnEnable[eid]) {
        executeScriptLifecycle(eid, 'onEnable');
      }
    }
  }

  // Handle entities that exited the query (removed Script components)
  const exitedEntities = exitQuery(query)(world);
  if (exitedEntities && exitedEntities.length > 0) {
    for (const eid of exitedEntities) {
      console.log(`[ScriptSystem] Script component removed from entity ${eid}`);

      // Execute onDestroy before cleanup
      executeScriptLifecycle(eid, 'onDestroy');

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
function compileScripts(): void {
  // Compile scripts in batches to avoid frame drops
  const maxCompilationsPerFrame = 2;
  let compilations = 0;

  for (const eid of entitiesToCompile) {
    if (compilations >= maxCompilationsPerFrame) break;

    if (compileScriptForEntity(eid)) {
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

    // Check if script needs compilation
    if (entityNeedsCompilation(eid)) {
      entitiesToCompile.add(eid);
    }
  }
}

/**
 * Execute scripts in update loop
 */
function executeScripts(deltaTime: number, _isPlaying: boolean = false): void {
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
    if (!scriptComponent.enabled[eid]) continue;

    // Skip scripts with compilation errors
    if (scriptComponent.hasErrors[eid]) continue;

    // Execute onStart if not yet started and configured to do so
    if (!startedEntities.has(eid) && scriptComponent.executeOnStart[eid]) {
      executeScriptLifecycle(eid, 'onStart');
      startedEntities.add(eid);
    }

    // Execute onUpdate if configured to do so (only during play mode or always if not play-dependent)
    if (scriptComponent.executeInUpdate[eid]) {
      // For now, execute regardless of play state - could be made configurable per script
      executeScriptLifecycle(eid, 'onUpdate', deltaTime);
    }
  }
}

/**
 * Main script system update function
 * Should be called from the main game loop
 */
export function updateScriptSystem(deltaTime: number, isPlaying: boolean = false): void {
  // When entering play mode, ensure all scripts are marked for compilation
  if (isPlaying) {
    ensureAllScriptsCompiled();
  }

  // Handle new/removed script entities
  handleNewScriptEntities();

  // Compile scripts that need compilation
  compileScripts();

  // Execute scripts
  executeScripts(deltaTime, isPlaying);
}

/**
 * Get performance statistics
 */
export function getScriptSystemStats(): {
  totalExecutionTime: number;
  executionCount: number;
  averageExecutionTime: number;
  pendingCompilations: number;
} {
  return {
    totalExecutionTime: totalScriptExecutionTime,
    executionCount: scriptExecutionCount,
    averageExecutionTime:
      scriptExecutionCount > 0 ? totalScriptExecutionTime / scriptExecutionCount : 0,
    pendingCompilations: entitiesToCompile.size,
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

  console.log('[ScriptSystem] Marked all scripts for recompilation');
}

/**
 * Enable/disable a script for a specific entity
 */
export function setScriptEnabled(eid: EntityId, enabled: boolean): void {
  const scriptComponent = componentRegistry.getBitECSComponent(
    'Script',
  ) as IBitECSScriptComponent | null;
  if (!scriptComponent) return;

  const wasEnabled = Boolean(scriptComponent.enabled[eid]);
  scriptComponent.enabled[eid] = enabled ? 1 : 0;

  // Call lifecycle methods based on state change
  if (!wasEnabled && enabled) {
    executeScriptLifecycle(eid, 'onEnable');
  } else if (wasEnabled && !enabled) {
    executeScriptLifecycle(eid, 'onDisable');
  }
}
