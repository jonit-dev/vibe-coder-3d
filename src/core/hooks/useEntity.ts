import { useFrame } from '@react-three/fiber';
import { defineQuery, hasComponent } from 'bitecs';
import { useEffect, useState } from 'react';

import { world } from '@core/lib/ecs';

/**
 * Hook to access and subscribe to ECS component data for a specific entity
 *
 * @param entityId The entity ID to access
 * @param component The ECS component to access
 * @returns Whether the entity has the given component
 */
export function useEntity(entityId: number | null, component: any): boolean {
  const [hasComp, setHasComp] = useState(
    entityId !== null && hasComponent(world, component, entityId),
  );

  useEffect(() => {
    if (entityId !== null) {
      setHasComp(hasComponent(world, component, entityId));
    } else {
      setHasComp(false);
    }
  }, [entityId, component]);

  // Update subscription when component data changes
  useFrame(() => {
    if (entityId !== null) {
      const current = hasComponent(world, component, entityId);
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
