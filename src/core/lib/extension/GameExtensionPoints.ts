import {
  IComponentDescriptor,
  ISystemDescriptor,
  IScriptDescriptor,
  IPrefabDescriptor,
  ISceneDescriptor,
  IGameProjectConfig,
  GameProjectConfigSchema,
  ComponentDescriptorSchema,
  SystemDescriptorSchema,
  ScriptDescriptorSchema,
  PrefabDescriptorSchema,
  SceneDescriptorSchema,
} from './types';
// Note: Future integration with core component registry
// import { componentRegistry as coreComponentRegistry } from '../ecs/ComponentRegistry';
// import { IComponentDescriptor as CoreComponentDescriptor } from '../ecs/ComponentRegistry';

// Internal registries for game extensions
const gameComponentRegistry = new Map<string, IComponentDescriptor>();
const systemRegistry = new Map<string, ISystemDescriptor>();
const scriptRegistry = new Map<string, IScriptDescriptor>();
const prefabRegistry = new Map<string, IPrefabDescriptor>();
const sceneRegistry = new Map<string, ISceneDescriptor>();

let currentProjectConfig: IGameProjectConfig | null = null;

// Validation helpers
function validateNamespace(id: string): void {
  if (!id.includes('.')) {
    throw new Error(`Invalid ID "${id}": must include namespace (e.g., "game.componentName")`);
  }
}

function checkDuplicate<T>(registry: Map<string, T>, id: string): void {
  if (registry.has(id)) {
    console.warn(`Re-registering "${id}" - this may happen in development mode`);
  }
}

// Public API functions
export function registerComponent(desc: IComponentDescriptor): void {
  try {
    ComponentDescriptorSchema.parse(desc);
    validateNamespace(desc.id);
    checkDuplicate(gameComponentRegistry, desc.id);

    // TODO: Convert to CoreComponentDescriptor and register with coreComponentRegistry
    // For now, just store in our game registry
    gameComponentRegistry.set(desc.id, desc);
  } catch (error) {
    throw new Error(`Failed to register component "${desc.id}": ${error}`);
  }
}

export function registerSystem(desc: ISystemDescriptor): void {
  try {
    SystemDescriptorSchema.parse(desc);
    validateNamespace(desc.id);
    checkDuplicate(systemRegistry, desc.id);
    systemRegistry.set(desc.id, desc);
  } catch (error) {
    throw new Error(`Failed to register system "${desc.id}": ${error}`);
  }
}

export function registerScript(desc: IScriptDescriptor): void {
  try {
    ScriptDescriptorSchema.parse(desc);
    validateNamespace(desc.id);
    checkDuplicate(scriptRegistry, desc.id);
    scriptRegistry.set(desc.id, desc);
  } catch (error) {
    throw new Error(`Failed to register script "${desc.id}": ${error}`);
  }
}

export function registerPrefab(desc: IPrefabDescriptor): void {
  try {
    PrefabDescriptorSchema.parse(desc);
    validateNamespace(desc.id);
    checkDuplicate(prefabRegistry, desc.id);
    prefabRegistry.set(desc.id, desc);
  } catch (error) {
    throw new Error(`Failed to register prefab "${desc.id}": ${error}`);
  }
}

export function registerScene(desc: ISceneDescriptor): void {
  try {
    SceneDescriptorSchema.parse(desc);
    validateNamespace(desc.id);
    checkDuplicate(sceneRegistry, desc.id);
    sceneRegistry.set(desc.id, desc);
  } catch (error) {
    throw new Error(`Failed to register scene "${desc.id}": ${error}`);
  }
}

export function initializeGameProject(config: IGameProjectConfig): void {
  try {
    GameProjectConfigSchema.parse(config);
    currentProjectConfig = config;
  } catch (error) {
    throw new Error(`Failed to initialize game project: ${error}`);
  }
}

// Getter functions for internal use
export function getRegisteredComponents(): Map<string, IComponentDescriptor> {
  return new Map(gameComponentRegistry);
}

export function getRegisteredSystems(): Map<string, ISystemDescriptor> {
  return new Map(systemRegistry);
}

export function getRegisteredScripts(): Map<string, IScriptDescriptor> {
  return new Map(scriptRegistry);
}

export function getRegisteredPrefabs(): Map<string, IPrefabDescriptor> {
  return new Map(prefabRegistry);
}

export function getRegisteredScenes(): Map<string, ISceneDescriptor> {
  return new Map(sceneRegistry);
}

export function getCurrentProjectConfig(): IGameProjectConfig | null {
  return currentProjectConfig;
}

// Helper functions
export function getComponent(id: string): IComponentDescriptor | undefined {
  return gameComponentRegistry.get(id);
}

export function getSystem(id: string): ISystemDescriptor | undefined {
  return systemRegistry.get(id);
}

export function getScript(id: string): IScriptDescriptor | undefined {
  return scriptRegistry.get(id);
}

export function getPrefab(id: string): IPrefabDescriptor | undefined {
  return prefabRegistry.get(id);
}

export function getScene(id: string): ISceneDescriptor | undefined {
  return sceneRegistry.get(id);
}

// System execution function for integration with EngineLoop
export function runRegisteredSystems(deltaTime: number): void {
  // Get systems sorted by order (lower numbers run first)
  const systems = Array.from(systemRegistry.values()).sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  for (const system of systems) {
    try {
      system.update(deltaTime);
    } catch (error) {
      console.error(`[GameExtensionPoints] Error running system "${system.id}":`, error);
    }
  }
}

// Script execution function for integration with the existing ScriptSystem
export function runRegisteredScripts(deltaTime: number, entityId?: number): void {
  const scripts = Array.from(scriptRegistry.values());

  for (const script of scripts) {
    try {
      // If entityId is provided, run script for that specific entity
      // Otherwise, run for all entities (would need entity iteration logic)
      if (entityId !== undefined) {
        script.onUpdate?.(entityId, deltaTime);
      } else {
        // For now, just note that scripts are registered
        // In a full implementation, this would iterate over all entities with scripts
      }
    } catch (error) {
      console.error(`[GameExtensionPoints] Error running script "${script.id}":`, error);
    }
  }
}

// Script lifecycle functions for entity management
export function initializeScriptForEntity(entityId: number): void {
  const scripts = Array.from(scriptRegistry.values());

  for (const script of scripts) {
    try {
      script.onInit?.(entityId);
    } catch (error) {
      console.error(
        `[GameExtensionPoints] Error initializing script "${script.id}" for entity ${entityId}:`,
        error,
      );
    }
  }
}

export function destroyScriptForEntity(entityId: number): void {
  const scripts = Array.from(scriptRegistry.values());

  for (const script of scripts) {
    try {
      script.onDestroy?.(entityId);
    } catch (error) {
      console.error(
        `[GameExtensionPoints] Error destroying script "${script.id}" for entity ${entityId}:`,
        error,
      );
    }
  }
}
