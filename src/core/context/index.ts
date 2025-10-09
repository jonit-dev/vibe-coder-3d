// New DI/Context API
export {
  EngineProvider,
  useECSWorld,
  useEntityManager,
  useComponentRegistry,
  useEngineContainer,
  useEngineContext,
  useLoopStore,
} from './EngineProvider';

export type { ECSWorldStore } from './ECSWorldStore';
export type { EntityManagerStore } from './EntityManagerStore';
export type { ComponentRegistryStore } from './ComponentRegistryStore';

// Factory functions
export { createEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';
export type { IEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';

// Migration adapters (deprecated)
export {
  getWorldSingleton,
  getEntityManagerSingleton,
  getComponentRegistrySingleton,
} from '@core/lib/ecs/adapters/SingletonAdapter';
