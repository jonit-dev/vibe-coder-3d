import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { Container } from '@core/lib/di/Container';
import {
  clearCurrentInstances,
  setCurrentInstances,
} from '@core/lib/ecs/adapters/SingletonAdapter';
import { createEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';

import { ComponentManagerStore, createComponentManagerStore } from './ComponentManagerStore';
import { ECSWorldStore, createECSWorldStore } from './ECSWorldStore';
import { EntityManagerStore, createEntityManagerStore } from './EntityManagerStore';

interface IEngineContext {
  container: Container;
  worldStore: ECSWorldStore;
  entityManagerStore: EntityManagerStore;
  componentManagerStore: ComponentManagerStore;
}

const EngineContext = createContext<IEngineContext | null>(null);

interface IEngineProviderProps {
  children: React.ReactNode;
  container?: Container;
}

export const EngineProvider: React.FC<IEngineProviderProps> = React.memo(
  ({ children, container: parentContainer }) => {
    const context = useMemo(() => {
      // Create engine instance with all services
      const engineInstance = createEngineInstance(parentContainer);

      // Create scoped stores for this engine instance
      const worldStore = createECSWorldStore();
      const entityManagerStore = createEntityManagerStore();
      const componentManagerStore = createComponentManagerStore();

      // Initialize stores with the engine instance services
      worldStore.getState().setWorld(engineInstance.world);
      entityManagerStore.getState().setEntityManager(engineInstance.entityManager);
      componentManagerStore.getState().setComponentManager(engineInstance.componentManager);

      return {
        container: engineInstance.container,
        worldStore,
        entityManagerStore,
        componentManagerStore,
      };
    }, [parentContainer]);

    // Set up singleton adapter bridge
    useEffect(() => {
      const world = context.worldStore.getState().world;
      const entityManager = context.entityManagerStore.getState().entityManager;
      const componentManager = context.componentManagerStore.getState().componentManager;

      if (world && entityManager && componentManager) {
        setCurrentInstances(world, entityManager, componentManager);
      }

      return () => {
        clearCurrentInstances();
      };
    }, [context.worldStore, context.entityManagerStore, context.componentManagerStore]);

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

export const useComponentManager = () => {
  const { componentManagerStore } = useEngineContext();
  return componentManagerStore((state) => ({ componentManager: state.componentManager }));
};

export const useEngineContainer = () => {
  const { container } = useEngineContext();
  return container;
};
