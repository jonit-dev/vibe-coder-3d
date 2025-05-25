import { useEffect, useMemo, useState } from 'react';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';

export const useEntityComponents = (entityId: number) => {
  const componentManager = useComponentManager();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for relevant component changes only
  useEffect(() => {
    const relevantComponents = [
      KnownComponentTypes.TRANSFORM,
      KnownComponentTypes.MESH_RENDERER,
      KnownComponentTypes.MESH_COLLIDER,
      KnownComponentTypes.RIGID_BODY,
    ];

    const handleComponentChange = (event: any) => {
      if (event.entityId === entityId && relevantComponents.includes(event.componentType)) {
        // Verify entity still exists before triggering update
        const entityExists = componentManager.getComponent(entityId, KnownComponentTypes.TRANSFORM);
        if (entityExists) {
          setUpdateTrigger((prev) => prev + 1);
        }
      }
    };

    const unsubscribe = componentManager.addEventListener(handleComponentChange);
    return unsubscribe;
  }, [entityId, componentManager]);

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
