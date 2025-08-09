import { useMemo, useState } from 'react';

import { useEvent } from '@/core/hooks/useEvent';
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

export const useEntityComponents = (entityId: number) => {
  const { hasComponent, getComponentData, listEntityComponents } = useComponentRegistry();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for relevant component changes only
  const relevantComponents = [
    KnownComponentTypes.TRANSFORM,
    KnownComponentTypes.MESH_RENDERER,
    KnownComponentTypes.MESH_COLLIDER,
    KnownComponentTypes.RIGID_BODY,
    // React to camera/light changes so initial component snapshot stays accurate
    KnownComponentTypes.CAMERA,
    KnownComponentTypes.LIGHT,
    // Include Terrain so viewport reacts to terrain edits
    'Terrain' as string,
  ];

  // Listen for component events using the global event system
  useEvent('component:added', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as string)) {
      // Verify entity still exists before triggering update
      const entityExists = hasComponent(entityId, KnownComponentTypes.TRANSFORM);
      if (entityExists) {
        setUpdateTrigger((prev) => prev + 1);
      }
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as string)) {
      setUpdateTrigger((prev) => prev + 1);
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId && relevantComponents.includes(event.componentId as string)) {
      // Verify entity still exists before triggering update
      const entityExists = hasComponent(entityId, KnownComponentTypes.TRANSFORM);
      if (entityExists) {
        setUpdateTrigger((prev) => prev + 1);
      }
    }
  });

  // Get transform component (required for all entities)
  const transform = getComponentData<ITransformData>(entityId, KnownComponentTypes.TRANSFORM);

  // Get all components for this entity - memoized with update trigger
  const entityComponents = useMemo(() => {
    if (!transform) return [];
    const componentIds = listEntityComponents(entityId);
    return componentIds.map((componentId) => ({
      type: componentId,
      data: getComponentData(entityId, componentId),
    }));
  }, [listEntityComponents, entityId, updateTrigger, transform, getComponentData]);

  // Get specific components
  const meshCollider = getComponentData(entityId, KnownComponentTypes.MESH_COLLIDER);

  return {
    transform: transform ? { data: transform } : null,
    entityComponents,
    meshCollider: meshCollider ? { data: meshCollider } : null,
  };
};
