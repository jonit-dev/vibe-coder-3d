// New DI/Context API
export {
  EngineProvider,
  useECSWorld,
  useEntityManager,
  useComponentManager,
  useEngineContainer,
  useEngineContext,
} from './EngineProvider';

export type { ECSWorldStore } from './ECSWorldStore';
export type { EntityManagerStore } from './EntityManagerStore';
export type { ComponentManagerStore } from './ComponentManagerStore';

// Factory functions
export { createEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';
export type { IEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';

// Migration adapters (deprecated)
export {
  getWorldSingleton,
  getEntityManagerSingleton,
  getComponentManagerSingleton,
} from '@core/lib/ecs/adapters/SingletonAdapter';