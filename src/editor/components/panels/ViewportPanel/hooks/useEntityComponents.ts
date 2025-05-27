import { useMemo, useState } from 'react';

import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

export const useEntityComponents = (entityId: number) => {
  const componentManager = useComponentManager();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for relevant component changes only
  const relevantComponents = [
    KnownComponentTypes.TRANSFORM,
    KnownComponentTypes.MESH_RENDERER,
    KnownComponentTypes.MESH_COLLIDER,
    KnownComponentTypes.RIGID_BODY,
  ];

  // Listen for component events using the global event system
  useEvent('component:added', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as any)) {
      // Verify entity still exists before triggering update
      const entityExists = componentManager.getComponent(entityId, KnownComponentTypes.TRANSFORM);
      if (entityExists) {
        setUpdateTrigger((prev) => prev + 1);
      }
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as any)) {
      setUpdateTrigger((prev) => prev + 1);
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as any)) {
      // Verify entity still exists before triggering update
      const entityExists = componentManager.getComponent(entityId, KnownComponentTypes.TRANSFORM);
      if (entityExists) {
        setUpdateTrigger((prev) => prev + 1);
      }
    }
  });

  // Get transform component (required for all entities)
  const transform = componentManager.getComponent<ITransformData>(
    entityId,
    KnownComponentTypes.TRANSFORM,
  );

  // Get all components for this entity - memoized with update trigger
  const entityComponents = useMemo(() => {
    if (!transform?.data) return [];
    return componentManager.getComponentsForEntity(entityId);
  }, [componentManager, entityId, updateTrigger]);

  // Get specific components
  const meshCollider = componentManager.getComponent(entityId, KnownComponentTypes.MESH_COLLIDER);

  return {
    transform,
    entityComponents,
    meshCollider,
  };
};
