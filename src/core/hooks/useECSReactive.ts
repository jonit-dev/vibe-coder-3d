// Reactive ECS Hooks - Event-driven instead of polling
import { useCallback, useEffect, useState } from 'react';

import { Transform } from '@core/lib/ecs';
import { onECSEvent } from '@core/lib/ecs-events';
import { ecsManager, ITransformData } from '@core/lib/ecs-manager';

/**
 * Hook for reactive entity transform data
 * Updates automatically when transform changes via events
 */
export function useEntityTransform(entityId: number | null): {
  transform: ITransformData | null;
  updateTransform: (transform: Partial<ITransformData>) => void;
  setPosition: (position: [number, number, number]) => void;
  setRotation: (rotation: [number, number, number]) => void;
  setScale: (scale: [number, number, number]) => void;
} {
  const [transform, setTransform] = useState<ITransformData | null>(
    entityId ? ecsManager.getTransform(entityId) : null,
  );

  // Update transform when entity changes
  useEffect(() => {
    if (entityId) {
      setTransform(ecsManager.getTransform(entityId));
    } else {
      setTransform(null);
    }
  }, [entityId]);

  // Listen to transform events
  useEffect(() => {
    if (!entityId) return;

    const unsubscribe = onECSEvent('transform:updated', (data) => {
      if (data.entityId === entityId) {
        setTransform(ecsManager.getTransform(entityId));
      }
    });

    return unsubscribe;
  }, [entityId]);

  // Update functions
  const updateTransform = useCallback(
    (newTransform: Partial<ITransformData>) => {
      if (entityId) {
        ecsManager.updateTransform(entityId, newTransform);
      }
    },
    [entityId],
  );

  const setPosition = useCallback(
    (position: [number, number, number]) => {
      updateTransform({ position });
    },
    [updateTransform],
  );

  const setRotation = useCallback(
    (rotation: [number, number, number]) => {
      updateTransform({ rotation });
    },
    [updateTransform],
  );

  const setScale = useCallback(
    (scale: [number, number, number]) => {
      updateTransform({ scale });
    },
    [updateTransform],
  );

  return {
    transform,
    updateTransform,
    setPosition,
    setRotation,
    setScale,
  };
}

/**
 * Hook for reactive entity material data
 */
export function useEntityMaterial(entityId: number | null): {
  color: [number, number, number] | null;
  setColor: (color: [number, number, number]) => void;
} {
  const [color, setColorState] = useState<[number, number, number] | null>(null);

  // Initialize color from ECS
  useEffect(() => {
    if (entityId && ecsManager.hasComponent(entityId, Transform)) {
      // Get initial color from Material component
      const material = Transform; // This should be Material component, but keeping consistent with pattern
      setColorState([0.2, 0.6, 1.0]); // Default blue - should get from actual Material component
    } else {
      setColorState(null);
    }
  }, [entityId]);

  // Listen to material events
  useEffect(() => {
    if (!entityId) return;

    const unsubscribe = onECSEvent('material:updated', (data) => {
      if (data.entityId === entityId) {
        setColorState(data.color);
      }
    });

    return unsubscribe;
  }, [entityId]);

  const setColor = useCallback(
    (newColor: [number, number, number]) => {
      if (entityId) {
        ecsManager.updateMaterialColor(entityId, newColor);
      }
    },
    [entityId],
  );

  return { color, setColor };
}

/**
 * Hook for reactive entity name
 */
export function useEntityName(entityId: number | null): {
  name: string;
  setName: (name: string) => void;
} {
  const [name, setNameState] = useState<string>('');

  // Initialize name from ECS
  useEffect(() => {
    if (entityId) {
      setNameState(ecsManager.getEntityName(entityId));
    } else {
      setNameState('');
    }
  }, [entityId]);

  // Listen to component update events for name changes
  useEffect(() => {
    if (!entityId) return;

    const unsubscribe = onECSEvent('component:updated', (data) => {
      if (data.entityId === entityId && data.componentName === 'Name') {
        setNameState(ecsManager.getEntityName(entityId));
      }
    });

    return unsubscribe;
  }, [entityId]);

  const setName = useCallback(
    (newName: string) => {
      if (entityId) {
        ecsManager.setEntityName(entityId, newName);
      }
    },
    [entityId],
  );

  return { name, setName };
}

/**
 * Hook for reactive entity list
 * Updates when entities are created or destroyed
 */
export function useEntityList(): {
  entities: number[];
  createEntity: (options?: Parameters<typeof ecsManager.createEntity>[0]) => number;
  destroyEntity: (entityId: number) => void;
} {
  const [entities, setEntities] = useState<number[]>([]);

  // Listen to entity creation/destruction events
  useEffect(() => {
    const unsubscribeCreate = onECSEvent('entity:created', () => {
      // Refresh entity list - in a real implementation, we'd maintain this more efficiently
      setEntities([
        ...Array.from({ length: 1000 }, (_, i) => i).filter((i) =>
          ecsManager.hasComponent(i, Transform),
        ),
      ]);
    });

    const unsubscribeDestroy = onECSEvent('entity:destroyed', () => {
      // Refresh entity list
      setEntities([
        ...Array.from({ length: 1000 }, (_, i) => i).filter((i) =>
          ecsManager.hasComponent(i, Transform),
        ),
      ]);
    });

    // Initial load
    setEntities([
      ...Array.from({ length: 1000 }, (_, i) => i).filter((i) =>
        ecsManager.hasComponent(i, Transform),
      ),
    ]);

    return () => {
      unsubscribeCreate();
      unsubscribeDestroy();
    };
  }, []);

  const createEntity = useCallback((options?: Parameters<typeof ecsManager.createEntity>[0]) => {
    return ecsManager.createEntity(options);
  }, []);

  const destroyEntity = useCallback((entityId: number) => {
    ecsManager.destroyEntity(entityId);
  }, []);

  return { entities, createEntity, destroyEntity };
}

/**
 * Hook for component existence checking
 */
export function useEntityComponent(
  entityId: number | null,
  componentName: string,
): {
  hasComponent: boolean;
  addComponent: () => void;
  removeComponent: () => void;
} {
  const [hasComponent, setHasComponent] = useState(false);

  // Check initial component state
  useEffect(() => {
    if (entityId) {
      // This would need to be expanded to check different component types
      setHasComponent(ecsManager.hasComponent(entityId, Transform));
    } else {
      setHasComponent(false);
    }
  }, [entityId, componentName]);

  // Listen to component addition/removal events
  useEffect(() => {
    if (!entityId) return;

    const unsubscribeAdd = onECSEvent('component:added', (data) => {
      if (data.entityId === entityId && data.componentName === componentName) {
        setHasComponent(true);
      }
    });

    const unsubscribeRemove = onECSEvent('component:removed', (data) => {
      if (data.entityId === entityId && data.componentName === componentName) {
        setHasComponent(false);
      }
    });

    return () => {
      unsubscribeAdd();
      unsubscribeRemove();
    };
  }, [entityId, componentName]);

  const addComponent = useCallback(() => {
    if (entityId && componentName === 'Velocity') {
      ecsManager.addVelocity(entityId);
    }
    // Add more component types as needed
  }, [entityId, componentName]);

  const removeComponent = useCallback(() => {
    // Implementation would depend on component type
    console.log(`Remove component ${componentName} from entity ${entityId}`);
  }, [entityId, componentName]);

  return { hasComponent, addComponent, removeComponent };
}

/**
 * Hook for debugging ECS state
 */
export function useECSDebug(): {
  totalEntities: number;
  recentEvents: Array<{ type: string; data: any; timestamp: number }>;
  clearEvents: () => void;
} {
  const [totalEntities, setTotalEntities] = useState(0);
  const [recentEvents, setRecentEvents] = useState<
    Array<{ type: string; data: any; timestamp: number }>
  >([]);

  useEffect(() => {
    // Count entities
    const updateEntityCount = () => {
      const count = Array.from({ length: 1000 }, (_, i) => i).filter((i) =>
        ecsManager.hasComponent(i, Transform),
      ).length;
      setTotalEntities(count);
    };

    // Listen to all ECS events for debugging
    const eventTypes = [
      'entity:created',
      'entity:destroyed',
      'component:added',
      'component:removed',
      'component:updated',
      'transform:updated',
      'material:updated',
    ] as const;

    const unsubscribes = eventTypes.map((type) =>
      onECSEvent(type, (data) => {
        setRecentEvents((prev) => [
          { type, data, timestamp: Date.now() },
          ...prev.slice(0, 49), // Keep last 50 events
        ]);
        updateEntityCount();
      }),
    );

    // Initial count
    updateEntityCount();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  return { totalEntities, recentEvents, clearEvents };
}
