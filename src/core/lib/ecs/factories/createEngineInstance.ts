import { componentRegistry, ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { EntityQueries } from '@core/lib/ecs/queries/entityQueries';
import { ECSWorld } from '@core/lib/ecs/World';
import { Container } from '@core/lib/di/Container';

export interface IEngineInstance {
  world: ECSWorld;
  entityManager: EntityManager;
  componentRegistry: ComponentRegistry;
  container: Container;
  dispose: () => void;
}

/**
 * Creates a new isolated engine instance with its own ECS components
 * @param parentContainer Optional parent container to inherit services from
 * @returns A new engine instance with isolated state
 */
export function createEngineInstance(parentContainer?: Container): IEngineInstance {
  // Create scoped container for this instance
  const container = parentContainer?.createChild() || new Container();

  // Create new isolated instances
  const world = new ECSWorld();
  const entityQueries = new EntityQueries(world.getWorld());
  const entityManager = new EntityManager(world.getWorld());
  // Use singleton ComponentRegistry instance
  const registry = componentRegistry;

  // Register services in the container
  container.registerInstance('ECSWorld', world);
  container.registerInstance('EntityManager', entityManager);
  container.registerInstance('ComponentRegistry', registry);
  container.registerInstance('EntityQueries', entityQueries);

  // Set up disposal cleanup
  const dispose = () => {
    world.reset();
    entityManager.reset();
    // Note: ComponentRegistry is a singleton, so we don't reset it here
    entityQueries.destroy();
    container.clear();
  };

  return {
    world,
    entityManager,
    componentRegistry: registry,
    container,
    dispose,
  };
}

/**
 * Type guard to check if an object is an engine instance
 */
export function isEngineInstance(obj: unknown): obj is IEngineInstance {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'world' in obj &&
    'entityManager' in obj &&
    'componentRegistry' in obj &&
    'container' in obj &&
    'dispose' in obj
  );
}
