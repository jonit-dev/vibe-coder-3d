import { componentRegistry, ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ECSWorld } from '@core/lib/ecs/World';

/**
 * Temporary bridge to maintain getInstance() calls during migration
 * This adapter will delegate to current context when available, or fall back to local instances
 *
 * @deprecated Use dependency injection or React context instead
 */

let currentWorldInstance: ECSWorld | null = null;
let currentEntityManagerInstance: EntityManager | null = null;
let currentComponentRegistryInstance: ComponentRegistry | null = null;

/**
 * Set the current context instances (called by EngineProvider)
 * @internal
 */
export function setCurrentInstances(
  world: ECSWorld,
  entityManager: EntityManager,
  componentRegistryArg: ComponentRegistry,
): void {
  currentWorldInstance = world;
  currentEntityManagerInstance = entityManager;
  currentComponentRegistryInstance = componentRegistryArg;
}

/**
 * Clear current context instances (called when provider unmounts)
 * @internal
 */
export function clearCurrentInstances(): void {
  currentWorldInstance = null;
  currentEntityManagerInstance = null;
  currentComponentRegistryInstance = null;
}

/**
 * Get ECS World singleton with context fallback
 * @deprecated Use useECSWorld hook or dependency injection instead
 */
export function getWorldSingleton(): ECSWorld {
  if (currentWorldInstance) {
    logDeprecationWarning('getWorldSingleton', 'useECSWorld hook');
    return currentWorldInstance;
  }

  // Fall back to original singleton for non-React contexts (tests, etc.)
  return ECSWorld.getInstance();
}

/**
 * Get EntityManager singleton with context fallback
 * @deprecated Use useEntityManager hook or dependency injection instead
 */
export function getEntityManagerSingleton(): EntityManager {
  if (currentEntityManagerInstance) {
    logDeprecationWarning('getEntityManagerSingleton', 'useEntityManager hook');
    return currentEntityManagerInstance;
  }

  // Fall back to original singleton for non-React contexts (tests, etc.)
  return EntityManager.getInstance();
}

/**
 * Get ComponentRegistry singleton with context fallback
 * @deprecated Use useComponentRegistry hook or dependency injection instead
 */
export function getComponentRegistrySingleton(): ComponentRegistry {
  if (currentComponentRegistryInstance) {
    logDeprecationWarning('getComponentRegistrySingleton', 'useComponentRegistry hook');
    return currentComponentRegistryInstance;
  }

  // Fall back to original singleton for non-React contexts (tests, etc.)
  return componentRegistry;
}

const deprecationWarnings = new Set<string>();

function logDeprecationWarning(oldMethod: string, newMethod: string): void {
  const warning = `${oldMethod} -> ${newMethod}`;
  if (!deprecationWarnings.has(warning)) {
    deprecationWarnings.add(warning);
    console.warn(
      `🚨 DEPRECATED: ${oldMethod}() is deprecated. Use ${newMethod} instead. ` +
        `This will be removed in a future version.`,
    );
  }
}
