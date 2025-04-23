// Hook for accessing the ECS world and functionality
import { addComponent, defineQuery, hasComponent, IWorld, removeComponent } from 'bitecs';
import { useMemo } from 'react';

import { createEntity, destroyEntity, world } from '../lib/ecs';

/**
 * Hook that provides access to the ECS world and helper functions
 */

export function useECS() {
  const ecs = useMemo(
    () => ({
      // Access to the world instance
      world,

      // Entity management
      createEntity,
      destroyEntity,

      // Component operations
      addComponent: <T>(component: T, entity: number) => {
        addComponent(world, component as any, entity);
        return entity;
      },

      removeComponent: <T>(component: T, entity: number) => {
        removeComponent(world, component as any, entity);
        return entity;
      },

      hasComponent: <T>(component: T, entity: number) => {
        return hasComponent(world, component as any, entity);
      },

      // Query creation
      createQuery: (components: any[]) => {
        return defineQuery(components)(world);
      },

      // Find entities with a query
      findEntities: (query: (world: IWorld) => number[]) => {
        return query(world);
      },
    }),
    [],
  );

  return ecs;
}

/**
 * Hook for querying entities with specific components
 *
 * @param components List of components to query for
 * @returns Array of entity IDs matching the query
 */
export function useECSQuery(components: any[]) {
  // Create a memoized query function
  const query = useMemo(() => defineQuery(components), [components]);

  // Return the result of running the query against the world
  return query(world);
}

/**
 * Hook to get component data for a specific entity
 *
 * @param entity Entity ID
 * @param component Component to retrieve data from
 * @returns The component data for the entity or null if not found
 */
export function useEntityComponent<T>(entity: number, component: T) {
  if (!entity || !hasComponent(world, component as any, entity)) {
    return null;
  }

  // Each component in bitECS is an object with arrays for each field,
  // where the entity ID is used as the index
  const componentData = { ...(component as any) };

  // Return only the data for this specific entity
  // This needs to be enhanced depending on how you're using component data
  return componentData;
}
