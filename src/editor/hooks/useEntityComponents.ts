import { useCallback, useEffect, useMemo, useState } from 'react';

import { IComponent, KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ComponentType, EntityId } from '@/editor/lib/ecs/types';

import { useComponentManager } from './useComponentManager';

/**
 * Hook for managing components on an entity - enables customization of entity behavior
 */
export const useEntityComponents = (entityId: EntityId | null) => {
  const componentManager = useComponentManager();
  const [components, setComponents] = useState<IComponent<any>[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Refresh components when entity changes or when component events occur
  useEffect(() => {
    if (entityId === null) {
      setComponents([]);
      return;
    }

    const updateComponents = () => {
      const entityComponents = componentManager.getComponentsForEntity(entityId);
      setComponents(entityComponents);
    };

    updateComponents();

    // Listen for component events to trigger reactive updates
    const removeEventListener = componentManager.addEventListener((event) => {
      // Only update if the event affects our current entity
      if (event.entityId === entityId) {
        // Removed debug logging to reduce console spam during drag
        updateComponents();
        setUpdateTrigger((prev) => prev + 1); // Force re-render for dependent computations
      }
    });

    return removeEventListener;
  }, [entityId, componentManager]);

  const addComponent = useCallback(
    <TData>(type: ComponentType, data: TData): IComponent<TData> | null => {
      if (entityId === null) return null;

      return componentManager.addComponent(entityId, type, data);
    },
    [entityId, componentManager],
  );

  const updateComponent = useCallback(
    <TData>(type: ComponentType, data: Partial<TData>): boolean => {
      if (entityId === null) return false;

      // Removed debug logging to reduce console spam during drag
      return componentManager.updateComponent(entityId, type, data);
    },
    [entityId, componentManager],
  );

  const removeComponent = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;

      return componentManager.removeComponent(entityId, type);
    },
    [entityId, componentManager],
  );

  const hasComponent = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;

      return componentManager.hasComponent(entityId, type);
    },
    [entityId, componentManager, updateTrigger], // Include updateTrigger to invalidate memoization
  );

  const getComponent = useCallback(
    <TData>(type: ComponentType): IComponent<TData> | undefined => {
      if (entityId === null) return undefined;

      return componentManager.getComponent<TData>(entityId, type);
    },
    [entityId, componentManager, updateTrigger], // Include updateTrigger to invalidate memoization
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

  const getTransform = useCallback(() => {
    if (entityId === null) return undefined;
    return componentManager.getTransformComponent(entityId);
  }, [entityId, componentManager, updateTrigger]);

  const getMeshRenderer = useCallback(() => {
    if (entityId === null) return undefined;
    return componentManager.getMeshRendererComponent(entityId);
  }, [entityId, componentManager, updateTrigger]);

  const getRigidBody = useCallback(() => {
    if (entityId === null) return undefined;
    return componentManager.getRigidBodyComponent(entityId);
  }, [entityId, componentManager, updateTrigger]);

  const getMeshCollider = useCallback(() => {
    if (entityId === null) return undefined;
    return componentManager.getMeshColliderComponent(entityId);
  }, [entityId, componentManager, updateTrigger]);

  return {
    components,
    addComponent,
    updateComponent,
    removeComponent,
    hasComponent,
    getComponent,
    // Convenience accessors
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
  };
};
