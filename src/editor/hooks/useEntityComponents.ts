import { useCallback, useEffect, useMemo, useState } from 'react';

import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';
import { useEvent } from '@/core/hooks/useEvent';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ComponentType, EntityId } from '@/core/lib/ecs/types';

/**
 * Hook for managing components on an entity - enables customization of entity behavior
 */
export const useEntityComponents = (entityId: EntityId | null) => {
  const {
    addComponent,
    removeComponent,
    hasComponent,
    getComponentData,
    updateComponent,
    listEntityComponents,
  } = useComponentRegistry();

  const [components, setComponents] = useState<IComponent<any>[]>([]);

  // Update components when entity changes or components are modified
  const updateComponents = useCallback(() => {
    if (entityId === null) {
      setComponents([]);
      return;
    }

    const entityComponents = listEntityComponents(entityId);
    // Convert to old format for compatibility
    const formattedComponents = entityComponents.map((componentId) => {
      const data = getComponentData(entityId, componentId);
      return {
        entityId,
        type: componentId,
        data,
      };
    });
    setComponents(formattedComponents);
  }, [entityId, getComponentData, listEntityComponents]);

  // Refresh components when entity changes
  useEffect(() => {
    updateComponents();
  }, [updateComponents]);

  // Listen for component events to update reactively
  useEvent('component:added', (event) => {
    if (event.entityId === entityId) {
      updateComponents();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId) {
      updateComponents();
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId) {
      updateComponents();
    }
  });

  const addComponentWrapper = useCallback(
    <TData>(type: ComponentType, data: TData): IComponent<TData> | null => {
      if (entityId === null) return null;

      const success = addComponent(entityId, type, data);
      if (success) {
        return { entityId, type, data };
      }
      return null;
    },
    [entityId, addComponent],
  );

  const updateComponentWrapper = useCallback(
    <TData>(type: ComponentType, data: Partial<TData>): boolean => {
      if (entityId === null) return false;

      const success = updateComponent(entityId, type, data);
      return success;
    },
    [entityId, updateComponent],
  );

  const removeComponentWrapper = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;

      const success = removeComponent(entityId, type);
      return success;
    },
    [entityId, removeComponent],
  );

  const hasComponentWrapper = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;
      return hasComponent(entityId, type);
    },
    [entityId, hasComponent],
  );

  const getComponent = useCallback(
    <TData>(type: ComponentType): IComponent<TData> | undefined => {
      if (entityId === null) return undefined;

      const data = getComponentData<TData>(entityId, type);
      return data ? { entityId, type, data } : undefined;
    },
    [entityId, getComponentData],
  );

  // Convenience computed values based on components array (safe for render)
  const hasTransform = useMemo(
    () => components.some((c) => c.type === KnownComponentTypes.TRANSFORM),
    [components],
  );

  const hasMeshRenderer = useMemo(
    () => components.some((c) => c.type === KnownComponentTypes.MESH_RENDERER),
    [components],
  );

  const hasRigidBody = useMemo(
    () => components.some((c) => c.type === KnownComponentTypes.RIGID_BODY),
    [components],
  );

  const hasMeshCollider = useMemo(
    () => components.some((c) => c.type === KnownComponentTypes.MESH_COLLIDER),
    [components],
  );

  const hasCamera = useMemo(
    () => components.some((c) => c.type === KnownComponentTypes.CAMERA),
    [components],
  );

  // Legacy getter methods for compatibility
  const getTransform = useCallback(() => {
    return getComponent(KnownComponentTypes.TRANSFORM);
  }, [getComponent]);

  const getMeshRenderer = useCallback(() => {
    return getComponent(KnownComponentTypes.MESH_RENDERER);
  }, [getComponent]);

  const getRigidBody = useCallback(() => {
    return getComponent(KnownComponentTypes.RIGID_BODY);
  }, [getComponent]);

  const getMeshCollider = useCallback(() => {
    return getComponent(KnownComponentTypes.MESH_COLLIDER);
  }, [getComponent]);

  const getCamera = useCallback(() => {
    return getComponent(KnownComponentTypes.CAMERA);
  }, [getComponent]);

  // Incompatible components functionality
  const getIncompatibleComponents = useCallback(
    (componentId: string): string[] => {
      if (entityId === null) return [];

      return componentRegistry.getIncompatibleComponentsForEntity(entityId, componentId);
    },
    [entityId],
  );

  const areComponentsIncompatible = useCallback(
    (componentA: string, componentB: string): boolean => {
      return componentRegistry.areComponentsIncompatible(componentA, componentB);
    },
    [],
  );

  return {
    components,
    addComponent: addComponentWrapper,
    updateComponent: updateComponentWrapper,
    removeComponent: removeComponentWrapper,
    hasComponent: hasComponentWrapper,
    getComponent,
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    hasCamera,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    getCamera,
    getIncompatibleComponents,
    areComponentsIncompatible,
  };
};
