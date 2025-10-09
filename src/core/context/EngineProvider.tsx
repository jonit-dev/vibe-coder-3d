import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { Container } from '@core/lib/di/Container';
import {
  clearCurrentInstances,
  setCurrentInstances,
} from '@core/lib/ecs/adapters/SingletonAdapter';
import { createEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';
import {
  createLoopStore,
  IGameLoopStore,
  ILoopStoreOptions,
} from '@core/lib/gameLoop/createLoopStore';
import { Logger } from '@core/lib/logger';

import { ComponentRegistryStore, createComponentRegistryStore } from './ComponentRegistryStore';
import { ECSWorldStore, createECSWorldStore } from './ECSWorldStore';
import { EntityManagerStore, createEntityManagerStore } from './EntityManagerStore';

interface IEngineContext {
  container: Container;
  worldStore: ECSWorldStore;
  entityManagerStore: EntityManagerStore;
  componentRegistryStore: ComponentRegistryStore;
  loopStore: IGameLoopStore;
}

const EngineContext = createContext<IEngineContext | null>(null);

interface IEngineProviderProps {
  children: React.ReactNode;
  container?: Container;
  loopOptions?: ILoopStoreOptions;
}

// Global singleton to prevent duplicate engine initialization
let globalEngineInstance: IEngineContext | null = null;

export const EngineProvider: React.FC<IEngineProviderProps> = React.memo(
  ({ children, container: parentContainer, loopOptions }) => {
    const logger = Logger.create('EngineProvider');

    const context = useMemo(() => {
      // Use existing global instance if available
      if (globalEngineInstance) {
        logger.debug('Reusing existing engine instance');
        return globalEngineInstance;
      }

      logger.info('Creating new engine instance');

      // Create engine instance with all services
      const engineInstance = createEngineInstance(parentContainer);

      // Create scoped stores for this engine instance
      const worldStore = createECSWorldStore();
      const entityManagerStore = createEntityManagerStore();
      const componentRegistryStore = createComponentRegistryStore();
      const loopStore = createLoopStore(loopOptions);

      // Initialize stores with the engine instance services
      worldStore.getState().setWorld(engineInstance.world);
      entityManagerStore.getState().setEntityManager(engineInstance.entityManager);
      componentRegistryStore.getState().setComponentRegistry(engineInstance.componentRegistry);

      const context = {
        container: engineInstance.container,
        worldStore,
        entityManagerStore,
        componentRegistryStore,
        loopStore,
      };

      // Store as global singleton
      globalEngineInstance = context;
      logger.milestone('Engine Instance Created');

      return context;
    }, [parentContainer, loopOptions, logger]);

    // Set up singleton adapter bridge
    useEffect(() => {
      const world = context.worldStore.getState().world;
      const entityManager = context.entityManagerStore.getState().entityManager;
      const componentRegistry = context.componentRegistryStore.getState().componentRegistry;

      if (world && entityManager && componentRegistry) {
        setCurrentInstances(world, entityManager, componentRegistry);
      }

      return () => {
        clearCurrentInstances();
      };
    }, [context.worldStore, context.entityManagerStore, context.componentRegistryStore]);

    return <EngineContext.Provider value={context}>{children}</EngineContext.Provider>;
  },
);

EngineProvider.displayName = 'EngineProvider';

export const useEngineContext = (): IEngineContext => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngineContext must be used within an EngineProvider');
  }
  return context;
};

// Individual hooks for each store
export const useECSWorld = () => {
  const { worldStore } = useEngineContext();
  return worldStore((state) => ({ world: state.world }));
};

export const useEntityManager = () => {
  const { entityManagerStore } = useEngineContext();
  return entityManagerStore((state) => ({ entityManager: state.entityManager }));
};

export const useComponentRegistry = () => {
  const { componentRegistryStore } = useEngineContext();
  return componentRegistryStore((state) => ({ componentRegistry: state.componentRegistry }));
};

export const useEngineContainer = () => {
  const { container } = useEngineContext();
  return container;
};

export const useLoopStore = () => {
  const { loopStore } = useEngineContext();
  return loopStore;
};
