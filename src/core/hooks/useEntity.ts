import { useFrame } from '@react-three/fiber';
import { defineQuery } from 'bitecs';
import { useEffect, useState } from 'react';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

/**
 * Hook to access and subscribe to ECS component data for a specific entity
 *
 * @param entityId The entity ID to access
 * @param componentId The component ID to access (e.g., 'Transform', 'Camera')
 * @returns Whether the entity has the given component
 */
export function useEntity(entityId: number | null, componentId: string): boolean {
  const [hasComp, setHasComp] = useState(false);

  useEffect(() => {
    if (entityId !== null) {
      const hasComponent = componentRegistry.hasComponent(entityId, componentId);
      setHasComp(hasComponent);
    } else {
      setHasComp(false);
    }
  }, [entityId, componentId]);

  // Update subscription when component data changes
  useFrame(() => {
    if (entityId !== null) {
      const current = componentRegistry.hasComponent(entityId, componentId);
      if (current !== hasComp) {
        setHasComp(current);
      }
    }
  });

  return hasComp;
}

/**
 * Hook to create a query for entities with the given components
 *
 * @param components Array of ECS components to query for
 * @returns Array of entity IDs matching the query
 */
export function useEntityQuery(components: any[]): number[] {
  const [entities, setEntities] = useState<number[]>([]);
  const query = defineQuery(components);

  // Update entities on each frame
  useFrame(() => {
    const result = query(world);
    setEntities([...result]);
  });

  return entities;
}
